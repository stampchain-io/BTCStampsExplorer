import { FreshContext, Handlers } from "$fresh/server.ts";
import { MintStampInputData, TX, TXError } from "globals";
import { serverConfig } from "$server/config/config.ts";
import {
  StampMintService,
  StampValidationService,
} from "$server/services/stamp/index.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { Buffer } from "buffer";

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request, _ctx: FreshContext) {
    let body: MintStampInputData;
    try {
      body = await req.json();
    } catch (_error) {
      return ResponseUtil.error("Invalid JSON format in request body", 400);
    }

    let assetName;
    try {
      assetName = await StampValidationService.validateAndPrepareAssetName(
        body.assetName,
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        return ResponseUtil.error(error.message, 400);
      }
      return ResponseUtil.error("Invalid asset name", 400);
    }

    const prepare = {
      ...body,
      prefix: "stamp" as const,
      assetName: assetName,
      satsPerKB: Number(body.satsPerKB),
      // Only include service fee if it's defined
      ...(body.service_fee && {
        service_fee: body.service_fee ||
          parseInt(serverConfig.MINTING_SERVICE_FEE_FIXED_SATS),
      }),
      // Only include service fee address if service_fee is defined
      ...(body.service_fee && {
        service_fee_address: body.service_fee_address ||
          serverConfig.MINTING_SERVICE_FEE_ADDRESS,
      }),
    };

    try {
      const mint_tx = await StampMintService.createStampIssuance(prepare);
      if (!mint_tx || !mint_tx.psbt) {
        console.error("Invalid mint_tx structure:", mint_tx);
        return ResponseUtil.error(
          "Error generating mint transaction: Invalid response structure",
          400,
        );
      }

      console.log("Successful mint_tx:", mint_tx);

      // Update the txDetails mapping without changing the API response format
      const txInputs = mint_tx.psbt.txInputs;
      const txDetails = txInputs.map((input: any, index: number) => {
        let txid = "";
        let vout = 0;

        if (input.hash && typeof input.index === "number") {
          const hashBuffer = Buffer.from(input.hash);
          txid = hashBuffer.reverse().toString("hex");
          vout = input.index;
        } else {
          throw new Error(
            `Unable to extract txid and vout for input at index ${index}`,
          );
        }

        return {
          txid,
          vout,
          signingIndex: index,
        };
      });

      // Return the API response with the same format
      return ResponseUtil.success({
        hex: mint_tx.psbt.toHex(),
        base64: mint_tx.psbt.toBase64(),
        cpid: assetName,
        est_tx_size: mint_tx.estimatedTxSize,
        input_value: mint_tx.totalInputValue,
        total_dust_value: mint_tx.totalDustValue,
        est_miner_fee: mint_tx.estMinerFee,
        change_value: mint_tx.totalChangeOutput,
        txDetails: txDetails,
      });
    } catch (error: unknown) {
      console.error("Minting error:", error);

      const errorMessage = error instanceof Error
        ? error.message
        : "An unexpected error occurred during minting";

      let statusCode = 400;

      if (errorMessage.includes("insufficient funds")) {
        statusCode = 400;
      } else if (errorMessage.includes("UTXO selection failed")) {
        statusCode = 400;
      } else if (errorMessage.includes("Invalid satsPerKB parameter")) {
        statusCode = 400;
      } else {
        statusCode = 500;
      }

      return ResponseUtil.error(errorMessage, statusCode);
    }
  },
};
