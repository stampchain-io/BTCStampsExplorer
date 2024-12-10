import { Handlers } from "$fresh/server.ts";
import { TX, TXError } from "$globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { SRC20Service } from "$server/services/src20/index.ts";
import { InputData } from "$types/index.d.ts";
import { convertEmojiToTick } from "$lib/utils/emojiUtils.ts";
import { logger } from "$lib/utils/logger.ts";
import { normalizeFeeRate } from "$server/services/xcpService.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";

type TrxType = "multisig" | "olga";

// Extend InputData to include all possible fee rate inputs
interface AncestorInfo {
  txid: string;
  vout: number;
  weight?: number;
}

interface ExtendedInputData extends Omit<InputData, "feeRate"> {
  feeRate?: number;
  satsPerVB?: number;
  satsPerKB?: number;
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
  trxType?: "olga" | "multisig";
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
      const validationError = await SRC20Service.UtilityService
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
          },
        );

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

      // Always prepare PSBT with full data
      const psbtData = await SRC20Service.PSBTService.preparePSBT({
        sourceAddress: effectiveSourceAddress,
        toAddress: body.toAddress || effectiveSourceAddress,
        src20Action: {
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
        },
        satsPerVB: normalizedFees.normalizedSatsPerVB,
        service_fee: 0,
        service_fee_address: "",
        changeAddress: effectiveChangeAddress || effectiveSourceAddress,
        ...(body.utxoAncestors && { utxoAncestors: body.utxoAncestors }),
        trxType: body.trxType || "olga",
      } as PSBTParams);

      // Calculate actual fees
      const actualFee = psbtData.totalInputValue - psbtData.totalOutputValue -
        psbtData.totalChangeOutput;

      // Add validation before returning
      const outputs = psbtData.psbt.txOutputs;
      const dataOutputs = outputs.filter((
        output: { script: { toString: (format: string) => string } },
      ) => output.script.toString("hex").startsWith("0020"));

      // Validate data structure
      let fullData = "";
      for (const output of dataOutputs) {
        const script = output.script.toString("hex");
        // Remove witness version and push bytes (0020)
        const data = script.slice(4);
        fullData += data;
      }

      // Remove padding zeros
      fullData = fullData.replace(/0+$/, "");

      try {
        // First two bytes are length prefix
        const lengthPrefix = parseInt(fullData.slice(0, 4), 16);
        const data = fullData.slice(4);

        // Convert to binary and decode
        const decodedData = new TextDecoder().decode(
          new Uint8Array(hex2bin(data)),
        );

        // Validate prefix
        if (!decodedData.startsWith("stamp:")) {
          throw new Error("Invalid data format: missing STAMP prefix");
        }

        // Validate JSON structure
        const jsonStart = decodedData.indexOf("{");
        if (jsonStart === -1) {
          throw new Error("Invalid data format: no JSON structure found");
        }

        const jsonData = decodedData.slice(jsonStart);
        JSON.parse(jsonData); // This will throw if JSON is invalid
      } catch (error) {
        logger.error("stamps", {
          message: "Invalid transaction data structure",
          error: error instanceof Error ? error.message : String(error),
          fullData,
        });
        throw new Error("Invalid transaction data structure");
      }

      // Return consistent response format
      return ApiResponseUtil.success({
        hex: psbtData.psbt.toHex(),
        est_tx_size: psbtData.estimatedTxSize,
        input_value: psbtData.totalInputValue,
        total_dust_value: psbtData.totalDustValue,
        est_miner_fee: actualFee,
        fee: psbtData.totalDustValue + actualFee,
        change_value: psbtData.totalChangeOutput,
        inputsToSign: psbtData.psbt.data.inputs.map((_, index: number) =>
          index
        ),
        sourceAddress: body.sourceAddress,
        changeAddress: effectiveChangeAddress,
      });
    } catch (error: unknown) {
      logger.error("stamps", {
        message: "Error processing request",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof SyntaxError) {
        return ApiResponseUtilResponseUtil.badRequest(
          "Invalid JSON in request body",
        );
      }
      return ApiResponseUtil.internalError(error, "Unknown error occurred");
    }
  },
};
