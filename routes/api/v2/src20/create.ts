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
interface AncestorInfo {
  txid: string;
  vout: number;
  weight?: number;
}

interface ExtendedInputData extends Omit<InputData, "feeRate"> {
  feeRate?: number; // legacy support
  satsPerVB?: number;
  satsPerKB?: number; // included for completeness but shouldn't be used
  utxoAncestors?: AncestorInfo[];
}

// Update the PSBTService.preparePSBT interface by extending its parameters
interface PSBTParams {
  sourceAddress: string;
  toAddress: string;
  src20Action: Record<string, unknown>;
  satsPerVB: number;
  service_fee: number;
  service_fee_address: string;
  changeAddress: string;
  utxoAncestors?: AncestorInfo[];
  dryRun?: boolean;
}

// Add basic size estimation without UTXO fetching
function estimateBasicSize(data: ExtendedInputData): number {
  // Base transaction size
  let size = 10; // Version + locktime

  // Estimate input size (assume one P2WPKH input for estimation)
  size += 68; // Basic input size

  // Calculate outputs based on operation
  switch (data.op.toLowerCase()) {
    case "deploy":
      // P2WSH output for deploy data + change output
      size += Math.ceil((data.max?.length || 0) / 62) * 43; // Each data chunk in P2WSH
      size += 31; // Change output
      break;
    case "mint":
      // Basic mint outputs + change
      size += 43; // Recipient output
      size += Math.ceil((data.amt?.length || 0) / 62) * 43; // Data outputs
      size += 31; // Change output
      break;
    case "transfer":
      // Transfer outputs + change
      size += 43; // Recipient output
      size += 43; // Data output
      size += 31; // Change output
      break;
  }

  return size;
}

function calculateBasicDustValue(operation: string): number {
  const DUST_AMOUNT = 546;
  switch (operation) {
    case "deploy":
      return DUST_AMOUNT; // One recipient output
    case "mint":
      return DUST_AMOUNT * 2; // Recipient + data output
    case "transfer":
      return DUST_AMOUNT * 2; // Recipient + data output
    default:
      return DUST_AMOUNT;
  }
}

function estimateOutputCount(data: ExtendedInputData): number {
  switch (data.op.toLowerCase()) {
    case "deploy":
      return Math.ceil((data.max?.length || 0) / 62) + 2; // Data chunks + recipient + change
    case "mint":
      return Math.ceil((data.amt?.length || 0) / 62) + 2; // Data chunks + recipient + change
    case "transfer":
      return 3; // Recipient + data + change
    default:
      return 2;
  }
}

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request) {
    try {
      const rawBody = await req.text();
      console.log("SRC-20 request body:", rawBody);

      if (!rawBody) {
        return ResponseUtil.badRequest("Empty request body");
      }

      let body: ExtendedInputData & {
        trxType?: TrxType;
        dryRun?: boolean;
      };
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
      let validationError;
      if (body.dryRun) {
        validationError = await SRC20Service.UtilityService
          .validateOperation(
            body.op.toLowerCase() as "deploy" | "mint" | "transfer",
            {
              sourceAddress: effectiveSourceAddress,
              changeAddress: effectiveChangeAddress,
              tick: body.tick || "TEST",
              max: body.max || "1000",
              lim: body.lim || "1000",
              dec: body.dec || "18",
              amt: body.amt || "1",
              toAddress: body.toAddress || effectiveSourceAddress,
              isEstimate: true,
            },
          );
      } else {
        validationError = await SRC20Service.UtilityService
          .validateOperation(
            body.op.toLowerCase() as "deploy" | "mint" | "transfer",
            {
              sourceAddress: effectiveSourceAddress,
              changeAddress: effectiveChangeAddress,
              tick: body.tick,
              max: body.max?.toString(),
              lim: body.lim?.toString(),
              dec: body.dec?.toString(),
              amt: body.amt?.toString(),
              toAddress: body.toAddress,
              x: body.x,
              web: body.web,
              email: body.email,
              isEstimate: false,
            },
          );
      }

      if (validationError) {
        logger.debug("stamps", {
          message: "Validation error",
          error: validationError,
          requestData: {
            operation: body.op.toLowerCase(),
            sourceAddress: effectiveSourceAddress,
            changeAddress: effectiveChangeAddress,
            tick: body.tick,
            max: body.max,
            lim: body.lim,
            dec: body.dec,
          },
        });
        return validationError;
      }

      // If it's a dry run, use quick estimation without UTXO fetching
      if (body.dryRun) {
        const estimatedSize = estimateBasicSize(body);
        const minerFee = Math.ceil(
          estimatedSize * normalizedFees.normalizedSatsPerVB,
        );
        const dustValue = calculateBasicDustValue(body.op.toLowerCase());

        return ResponseUtil.success({
          minerFee,
          dustValue,
          estimatedSize,
          outputCount: estimateOutputCount(body),
        });
      }

      // Only do full UTXO fetching and PSBT construction for actual transactions
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
          service_fee: body.service_fee || 0,
          service_fee_address: body.service_fee_address || "",
          changeAddress: effectiveChangeAddress || effectiveSourceAddress,
          utxoAncestors: body.utxoAncestors,
          dryRun: body.dryRun,
        } as PSBTParams);

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
