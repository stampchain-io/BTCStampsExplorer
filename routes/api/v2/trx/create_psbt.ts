import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { TransactionService } from "$server/services/transaction/index.ts";

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
        return ResponseUtil.badRequest("Missing parameters");
      }

      // Additional validation can be added here
      if (isNaN(salePrice) || salePrice <= 0) {
        return ResponseUtil.badRequest("Invalid salePrice value");
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
      const psbtHex = await TransactionService.PSBTService.createPSBT(
        utxo,
        salePrice,
        sellerAddress,
      );
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
        return ResponseUtil.badRequest("Invalid JSON in request body");
      }
      return ResponseUtil.internalError(error, "Internal Server Error");
    }
  },
};
