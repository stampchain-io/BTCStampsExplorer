import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { completePSBT } from "$server/btc_server.ts";

export const handler: Handlers = {
  async POST(req: Request) {
    try {
      const { sellerPsbtHex, buyerUtxo, buyerAddress, feeRate } = await req
        .json();

      if (
        !sellerPsbtHex || !buyerUtxo || !buyerAddress || feeRate === undefined
      ) {
        return ResponseUtil.error("Missing parameters", 400);
      }

      console.log(`Completing PSBT with fee rate: ${feeRate} sat/vB`);

      const completedPsbtHex = await completePSBT(
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
      return ResponseUtil.error(error.message || "Internal Server Error", 500);
    }
  },
};
