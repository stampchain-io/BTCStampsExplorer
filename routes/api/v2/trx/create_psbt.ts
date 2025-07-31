import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { logger } from "$lib/utils/logger.ts";
import {
  createBitcoinTransactionBuilder,
} from "$server/services/transaction/index.ts";
import type { CreatePSBTInput, CreatePSBTResponse } from "$types/api.d.ts";

export const handler: Handlers = {
  async POST(req: Request) {
    try {
      // Parse the request body
      const rawBody = await req.text();
      const input: CreatePSBTInput = JSON.parse(rawBody);

      const { utxo, salePrice, sellerAddress } = input;

      // Validate inputs
      if (!utxo || !salePrice || !sellerAddress) {
        return ApiResponseUtil.badRequest("Missing parameters");
      }

      // Additional validation can be added here
      if (isNaN(salePrice) || salePrice <= 0) {
        return ApiResponseUtil.badRequest("Invalid salePrice value");
      }

      // const isOwner = await validateUTXOOwnership(utxo, sellerAddress);
      // if (!isOwner) {
      //   return ResponseUtil.error(
      //     "UTXO does not belong to the provided address",
      //     400,
      //   );
      // }
      // Create PSBT with validated inputs

      // Create PSBT
      const builder = createBitcoinTransactionBuilder();
      const psbtHex = await builder
        .createPSBT(
          utxo,
          salePrice,
          sellerAddress,
        );
      const response: CreatePSBTResponse = { psbt: psbtHex };

      return ApiResponseUtil.success(response);
    } catch (error) {
      if (error instanceof SyntaxError) {
        logger.error("api", {
          message: "Invalid JSON in create PSBT request",
          error: error.message,
        });
        return ApiResponseUtil.badRequest("Invalid JSON in request body");
      }
      logger.error("api", {
        message: "Error creating PSBT",
        error: error instanceof Error ? error.message : String(error),
      });
      return ApiResponseUtil.internalError(error, "Failed to create PSBT");
    }
  },
};
