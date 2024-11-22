import { Handlers } from "$fresh/server.ts";
import { TX, TXError } from "globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { SRC20Service } from "$server/services/src20/index.ts";
import { InputData } from "$types/index.d.ts";
import { convertEmojiToTick } from "$lib/utils/emojiUtils.ts";
import { logger } from "$lib/utils/logger.ts";

type TrxType = "multisig" | "olga";

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request) {
    try {
      const rawBody = await req.text();
      console.log("SRC-20 request body:", rawBody);

      if (!rawBody) {
        return ResponseUtil.error("Empty request body", 400);
      }

      let body: InputData & { trxType?: TrxType };
      try {
        body = JSON.parse(rawBody);
      } catch (e) {
        console.error("JSON parse error:", e);
        return ResponseUtil.error("Invalid JSON in request body", 400);
      }

      console.log("Parsed request body:", body);

      const trxType = body.trxType || "olga";

      // Handle backward compatibility for fromAddress
      const effectiveSourceAddress = body.sourceAddress || body.fromAddress ||
        body.changeAddress;
      const effectiveChangeAddress = body.changeAddress || body.sourceAddress ||
        body.fromAddress;

      // Ensure at least one address exists
      if (!effectiveSourceAddress) {
        return ResponseUtil.error(
          "Either sourceAddress/fromAddress or changeAddress is required",
          400,
        );
      }

      logger.debug("stamps", {
        message: "Processing request",
        trxType,
        operation: body.op.toLowerCase(),
        effectiveChangeAddress,
        effectiveSourceAddress,
      });

      // Validate operation for both transaction types
      const validationError = await SRC20Service.UtilityService
        .validateOperation(
          body.op.toLowerCase() as "deploy" | "mint" | "transfer",
          {
            ...body,
            sourceAddress: effectiveSourceAddress,
            changeAddress: effectiveChangeAddress,
          },
        );

      if (validationError) {
        logger.debug("stamps", {
          message: "Validation error",
          error: validationError,
        });
        return validationError;
      }

      if (trxType === "multisig") {
        logger.debug("stamps", {
          message: "Starting multisig transaction handling",
          operation: body.op.toLowerCase(),
        });

        const result = await SRC20Service.TransactionService.handleOperation(
          body.op.toLowerCase() as "deploy" | "mint" | "transfer",
          {
            ...body,
            changeAddress: effectiveChangeAddress,
          },
        );

        logger.debug("stamps", {
          message: "Multisig transaction result",
          result: JSON.stringify(result, null, 2),
        });

        const response = ResponseUtil.success(result);
        logger.debug("stamps", {
          message: "Final multisig response",
          response: JSON.stringify(response, null, 2),
        });

        return response;
      } else {
        // Handle Olga/p2wsh transaction
        const src20Action = {
          op: body.op.toUpperCase(),
          p: "SRC-20",
          tick: body.tick,
          ...(body.max && { max: body.max.toString() }),
          ...(body.lim && { lim: body.lim.toString() }),
          ...(body.dec !== undefined && { dec: Number(body.dec) }),
          ...(body.amt && { amt: body.amt.toString() }),
          ...(body.x && { x: body.x }),
          ...(body.web && { web: body.web }),
          ...(body.email && { email: body.email }),
          ...(body.tg && { tg: body.tg }),
          ...(body.description && { description: body.description }),
        };

        const psbtData = await SRC20Service.PSBTService.preparePSBT({
          sourceAddress: effectiveSourceAddress,
          toAddress: body.toAddress,
          src20Action,
          satsPerVB: Number(body.feeRate),
          service_fee: 0,
          service_fee_address: "",
          changeAddress: effectiveChangeAddress,
        });

        return ResponseUtil.success({
          hex: psbtData.psbt.toHex(),
          base64: psbtData.psbt.toBase64(),
          est_tx_size: psbtData.estimatedTxSize,
          input_value: psbtData.totalInputValue,
          total_dust_value: psbtData.totalDustValue,
          est_miner_fee: psbtData.estMinerFee,
          change_value: psbtData.totalChangeOutput,
          inputsToSign: psbtData.psbt.data.inputs.map((_, index) => index),
          sourceAddress: body.sourceAddress,
          changeAddress: effectiveChangeAddress,
        });
      }
    } catch (error: unknown) {
      logger.error("stamps", {
        message: "Error processing request",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof SyntaxError) {
        return ResponseUtil.error("Invalid JSON in request body", 400);
      }
      return ResponseUtil.error(
        error instanceof Error ? error.message : "Unknown error occurred",
        400,
      );
    }
  },
};
