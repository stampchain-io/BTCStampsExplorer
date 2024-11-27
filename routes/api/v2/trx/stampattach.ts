import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import {
  ComposeAttachOptions,
  XcpManager,
} from "$server/services/xcpService.ts";
import { PSBTService } from "$server/services/transaction/psbtService.ts";
import { StampController } from "$server/controller/stampController.ts";

// Define interface extending ComposeAttachOptions for stamp-specific fields
interface StampAttachInput {
  address: string;
  identifier: string; // cpid, stamp number, or tx_hash
  quantity: number;
  options: Omit<ComposeAttachOptions, "inputs_set"> & {
    fee_per_kb: number; // Make explicitly required
  };
  inputs_set?: string; // txid:vout format - moved to top level for clarity
}

export const handler: Handlers = {
  async POST(req: Request) {
    try {
      const input: StampAttachInput = await req.json();
      console.log("Received stamp attach input:", input);

      const { address, identifier, quantity, inputs_set, options } = input;

      // Validate fee rate
      if (typeof options?.fee_per_kb !== "number" || options.fee_per_kb <= 0) {
        return ResponseUtil.badRequest("Invalid fee rate");
      }

      // Validate inputs_set format if provided
      if (inputs_set && !inputs_set.match(/^[a-fA-F0-9]{64}:\d+$/)) {
        return ResponseUtil.badRequest(
          "Invalid inputs_set format. Expected txid:vout",
        );
      }

      try {
        // Resolve identifier to CPID
        const cpid = await StampController.resolveToCpid(identifier);

        // Call composeAttach with resolved CPID
        const response = await XcpManager.composeAttach(
          address,
          cpid,
          quantity,
          {
            ...options,
            inputs_set, // Add inputs_set to options
            return_psbt: true,
            verbose: true,
          },
        );

        if (!response?.result?.psbt) {
          if (response?.error) {
            return ResponseUtil.badRequest(response.error);
          }
          throw new Error("Failed to compose attach transaction.");
        }

        // Process PSBT using shared service
        const processedPSBT = await PSBTService.processCounterpartyPSBT(
          response.result.psbt,
          address,
          options.fee_per_kb,
          { validateInputs: true, validateFees: true },
        );

        return new Response(JSON.stringify(processedPSBT), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        if (
          error instanceof Error && error.message.includes("Insufficient BTC")
        ) {
          return ResponseUtil.badRequest(error.message);
        }
        throw error;
      }
    } catch (error) {
      console.error("Error processing stamp attach request:", error);
      return ResponseUtil.internalError(
        error,
        "Failed to process stamp attach request",
      );
    }
  },
};
