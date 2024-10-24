import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import {
  createPSBT,
  validateUTXOOwnership,
} from "../../../../server/btc_server.ts";
import { Buffer } from "buffer";

interface CreatePSBTInput {
  utxo: string;
  salePrice: number;
  sellerAddress: string;
}

interface CreatePSBTResponse {
  psbt: string;
}

export const handler: Handlers = {
  async POST(req: Request) {
    try {
      // Log the raw request body
      const rawBody = await req.text();
      console.log("Raw request body:", rawBody);

      // Parse the JSON
      const input: CreatePSBTInput = JSON.parse(rawBody);

      const { utxo, salePrice, sellerAddress } = input;

      // Validate inputs
      if (!utxo || !salePrice || !sellerAddress) {
        return ResponseUtil.error("Missing parameters", 400);
      }

      // Additional validation can be added here
      if (isNaN(salePrice) || salePrice <= 0) {
        return ResponseUtil.error("Invalid salePrice value", 400);
      }

      // const isOwner = await validateUTXOOwnership(utxo, sellerAddress);
      // if (!isOwner) {
      //   return ResponseUtil.error(
      //     "UTXO does not belong to the provided address",
      //     400,
      //   );
      // }
      // Log the inputs
      console.log("Creating PSBT with inputs:", {
        utxo,
        salePrice,
        sellerAddress,
      });

      // Create PSBT
      const psbtHex = await createPSBT(utxo, salePrice, sellerAddress);
      const response: CreatePSBTResponse = { psbt: psbtHex };

      return new Response(
        JSON.stringify(response),
        { headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      console.error(
        "Error processing request in /api/v2/trx/create_psbt:",
        error,
      );
      if (error instanceof SyntaxError) {
        return ResponseUtil.error("Invalid JSON in request body", 400);
      }
      return ResponseUtil.error(error.message || "Internal Server Error", 500);
    }
  },
};
