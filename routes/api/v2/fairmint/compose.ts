import { Handlers } from "$fresh/server.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { PSBTService } from "$server/services/transaction/psbtService.ts";

export const handler: Handlers = {
  async POST(req, _ctx) {
    try {
      const body = await req.json();
      const { address, asset, quantity, options } = body;

      // Validate required parameters
      if (!address || !asset || quantity === undefined) {
        return ResponseUtil.badRequest("Missing required parameters");
      }

      // Validate fee rate
      if (typeof options?.fee_per_kb !== "number" || options.fee_per_kb <= 0) {
        return ResponseUtil.badRequest("Invalid fee rate");
      }

      const feeRateKB = options.fee_per_kb;
      console.log(`Fee rate (sat/kB): ${feeRateKB}`);

      try {
        const response = await XcpManager.composeFairmint(
          address,
          asset,
          quantity,
          {
            ...options,
            return_psbt: true,
            fee_per_kb: feeRateKB,
          },
        );

        if (!response?.result?.psbt) {
          if (response?.error) {
            return ResponseUtil.badRequest(response.error);
          }
          throw new Error("Failed to compose fairmint transaction.");
        }

        console.log("PSBT Base64 from XCP:", response.result.psbt);

        // Process PSBT using shared service
        const processedPSBT = await PSBTService.processCounterpartyPSBT(
          response.result.psbt,
          address,
          feeRateKB,
          { validateInputs: true, validateFees: true },
        );

        return ResponseUtil.success(processedPSBT);
      } catch (error) {
        if (
          error instanceof Error && error.message.includes("Insufficient BTC")
        ) {
          return ResponseUtil.badRequest(error.message);
        }
        throw error;
      }
    } catch (error) {
      console.error("Error composing fairmint transaction:", error);
      return ResponseUtil.internalError(
        error,
        "Failed to compose fairmint transaction",
      );
    }
  },
};
