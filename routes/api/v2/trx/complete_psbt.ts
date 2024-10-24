import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { completePSBT } from "../../../../server/btc_server.ts";

export const handler: Handlers = {
  async POST(req: Request) {
    try {
      const { sellerPsbtHex, buyerUtxo, buyerAddress } = await req.json();

      if (!sellerPsbtHex || !buyerUtxo || !buyerAddress) {
        return ResponseUtil.error("Missing parameters", 400);
      }

      const completedPsbtHex = await completePSBT(
        sellerPsbtHex,
        buyerUtxo,
        buyerAddress,
      );
      return new Response(JSON.stringify({ psbt: completedPsbtHex }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error completing PSBT:", error);
      return ResponseUtil.error(error.message || "Internal Server Error", 500);
    }
  },
};
