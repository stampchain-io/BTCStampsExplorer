import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import {
  ComposeDetachOptions,
  normalizeFeeRate,
  XcpManager,
} from "$server/services/xcpService.ts";
import { PSBTService } from "$server/services/transaction/psbtService.ts";

interface StampDetachInput {
  utxo: string;
  destination?: string;
  options: Omit<ComposeDetachOptions, "fee_per_kb"> & {
    fee_per_kb?: number;
    satsPerVB?: number;
    regular_dust_size?: number;
    return_psbt?: boolean;
    verbose?: boolean;
    [key: string]: unknown;
  };
}

export const handler: Handlers = {
  async POST(req: Request) {
    try {
      const input: StampDetachInput = await req.json();
      console.log("Received stamp detach input:", input);

      const { utxo, destination, options } = input;

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

      try {
        const response = await XcpManager.composeDetach(
          utxo,
          destination || "",
          {
            ...options,
            fee_per_kb: normalizedFees.normalizedSatsPerKB, // Use normalized fee rate
            return_psbt: true,
            verbose: true,
          },
        );

        if (!response?.result?.psbt) {
          if (response?.error) {
            return ResponseUtil.badRequest(response.error);
          }
          throw new Error("Failed to compose detach transaction.");
        }

        // Process PSBT using shared service
        const processedPSBT = await PSBTService.processCounterpartyPSBT(
          response.result.psbt,
          destination || "",
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
      console.error("Error processing stamp detach request:", error);
      return ResponseUtil.internalError(
        error,
        "Failed to process stamp detach request",
      );
    }
  },
};
