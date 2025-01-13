import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { TransactionService } from "$server/services/transaction/index.ts";

export const handler: Handlers = {
  async POST(req: Request) {
    try {
      const { sellerPsbtHex, buyerUtxo, buyerAddress, feeRate } = await req
        .json();

      if (
        !sellerPsbtHex || !buyerUtxo || !buyerAddress || feeRate === undefined
      ) {
        return ResponseUtil.badRequest("Missing parameters");
      }

      console.log(`Completing PSBT with fee rate: ${feeRate} sat/vB`);

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
      console.error("Error completing PSBT:", error);
      return ResponseUtil.internalError(error, "Internal Server Error");
    }
  },
};
