import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { XcpManager } from "../../lib/services/xcpService.ts";
import { Buffer } from "buffer";

interface UtxoAttachInput {
  address: string;
  asset: string;
  quantity: number;
  utxo: string;
  options: {
    return_psbt?: boolean;
    extended_tx_info?: boolean;
    regular_dust_size?: number;
    fee_per_kb?: number;
  };
}

interface UtxoAttachResponse {
  psbt: string;
}

export const handler: Handlers = {
  async POST(req: Request) {
    try {
      const input: UtxoAttachInput = await req.json();
      const { address, asset, quantity, utxo, options } = input;

      // Validate inputs
      if (!address || !asset || !quantity || !utxo) {
        return ResponseUtil.error("Missing required parameters", 400);
      }

      // Call composeAttach in xcpService
      const response = await XcpManager.composeAttach(
        address,
        asset,
        quantity,
        {
          ...options,
          destination: utxo, // Set destination to the UTXO
        },
      );

      if (!response || !response.result || !response.result.psbt) {
        throw new Error("Failed to compose attach transaction.");
      }

      // The response might contain psbt in base64; convert it to hex
      const psbtBase64 = response.result.psbt;
      const psbtBuffer = Buffer.from(psbtBase64, "base64");
      const psbtHex = psbtBuffer.toString("hex");

      const res: UtxoAttachResponse = { psbt: psbtHex };

      return new Response(JSON.stringify(res), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error processing utxo attach request:", error);
      return ResponseUtil.error(
        error.message || "Internal Server Error",
        500,
      );
    }
  },
};
