import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import {
  ComposeAttachOptions,
  normalizeFeeRate,
  XcpManager,
} from "$server/services/xcpService.ts";
import { PSBTService } from "$server/services/transaction/psbtService.ts";
import { StampController } from "$server/controller/stampController.ts";

// Update interface to accept either fee rate type
interface StampAttachInput {
  address: string;
  identifier: string; // cpid, stamp number, or tx_hash
  quantity: number;
  options: Omit<ComposeAttachOptions, "inputs_set" | "fee_per_kb"> & {
    fee_per_kb?: number;
    satsPerVB?: number;
  };
  inputs_set?: string; // txid:vout format - moved to top level for clarity
}

export const handler: Handlers = {
  async POST(req: Request) {
    try {
      const input: StampAttachInput = await req.json();
      console.log("Received stamp attach input:", input);

      const { address, identifier, quantity, inputs_set, options } = input;

      // Normalize fee rate from either input type
      let normalizedFees;
      try {
        normalizedFees = normalizeFeeRate({
          satsPerKB: options.fee_per_kb,
          satsPerVB: options.satsPerVB,
        });
      } catch (error) {
        return ResponseUtil.badRequest(
          error instanceof Error ? error.message : "Invalid fee rate",
        );
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

        // Call composeAttach with resolved CPID and normalized fee rate
        const response = await XcpManager.composeAttach(
          address,
          cpid,
          quantity,
          {
            ...options,
            fee_per_kb: normalizedFees.normalizedSatsPerKB, // Use normalized fee rate
            inputs_set,
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
          normalizedFees.normalizedSatsPerKB, // Use normalized fee rate
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
