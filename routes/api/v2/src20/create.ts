import { Handlers } from "$fresh/server.ts";
import { TX, TXError } from "globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { SRC20Service } from "$server/services/src20/index.ts";
import { InputData } from "$types/index.d.ts";
import { convertEmojiToTick } from "$lib/utils/emojiUtils.ts";
import { logger } from "$lib/utils/logger.ts";
import { normalizeFeeRate } from "$server/services/xcpService.ts";

type TrxType = "multisig" | "olga";

// Extend InputData to include all possible fee rate inputs
interface ExtendedInputData extends Omit<InputData, "feeRate"> {
  feeRate?: number; // legacy support
  satsPerVB?: number;
  satsPerKB?: number; // included for completeness but shouldn't be used
}

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request) {
    try {
      const rawBody = await req.text();
      console.log("SRC-20 request body:", rawBody);

      if (!rawBody) {
        return ResponseUtil.badRequest("Empty request body");
      }

      let body: ExtendedInputData & { trxType?: TrxType };
      try {
        body = JSON.parse(rawBody);
      } catch (e) {
        console.error("JSON parse error:", e);
        return ResponseUtil.badRequest("Invalid JSON in request body");
      }

      // Normalize fee rate from any of the possible inputs
      let normalizedFees;
      try {
        const feeInput = {
          satsPerKB: body.satsPerKB,
          satsPerVB: body.satsPerVB,
        };

        // If neither is provided but legacy feeRate exists, use that as satsPerVB
        if (
          body.feeRate !== undefined && !feeInput.satsPerKB &&
          !feeInput.satsPerVB
        ) {
          console.log("Using legacy feeRate as satsPerVB:", body.feeRate);
          feeInput.satsPerVB = body.feeRate;
        }

        normalizedFees = normalizeFeeRate(feeInput);
      } catch (error) {
        return ResponseUtil.badRequest(
          error instanceof Error ? error.message : "Invalid fee rate",
        );
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
        return ResponseUtil.badRequest(
          "Either sourceAddress/fromAddress or changeAddress is required",
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

        // Destructure and reconstruct with required properties
        const {
          satsPerVB: _satsPerVB, // Omit these optional properties
          satsPerKB: _satsPerKB,
          feeRate: _feeRate,
          ...restBody
        } = body;

        const operationData: InputData = {
          ...restBody,
          changeAddress: effectiveChangeAddress || effectiveSourceAddress,
          feeRate: normalizedFees.normalizedSatsPerVB,
        };

        const result = await SRC20Service.TransactionService.handleOperation(
          body.op.toLowerCase() as "deploy" | "mint" | "transfer",
          operationData,
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
          satsPerVB: normalizedFees.normalizedSatsPerVB,
          service_fee: 0,
          service_fee_address: "",
          changeAddress: effectiveChangeAddress || effectiveSourceAddress,
        });

        return ResponseUtil.success({
          hex: psbtData.psbt.toHex(),
          est_tx_size: psbtData.estimatedTxSize,
          input_value: psbtData.totalInputValue,
          total_dust_value: psbtData.totalDustValue,
          est_miner_fee: psbtData.estMinerFee,
          fee: psbtData.totalDustValue + psbtData.estMinerFee,
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
        return ResponseUtil.badRequest("Invalid JSON in request body");
      }
      return ResponseUtil.internalError(error, "Unknown error occurred");
    }
  },
};
