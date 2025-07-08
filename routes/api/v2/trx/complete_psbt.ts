import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { logger } from "$lib/utils/logger.ts";
import { TransactionService } from "$server/services/transaction/index.ts";

export const handler: Handlers = {
  async POST(req: Request) {
    try {
      const { sellerPsbtHex, buyerUtxo, buyerAddress, feeRate } = await req
        .json();

      if (
        !sellerPsbtHex || !buyerUtxo || !buyerAddress || feeRate === undefined
      ) {
        return ApiResponseUtil.badRequest("Missing parameters");
      }

      // Complete PSBT with specified fee rate

      const completedPsbtHex = await TransactionService.PSBTService
        .completePSBT(
          sellerPsbtHex,
          buyerUtxo,
          buyerAddress,
          feeRate,
        );

      return new Response(JSON.stringify({ completedPsbt: completedPsbtHex }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      logger.error("api", {
        message: "Error completing PSBT",
        error: error instanceof Error ? error.message : String(error),
      });
      return ApiResponseUtil.internalError(error, "Failed to complete PSBT");
    }
  },
};
