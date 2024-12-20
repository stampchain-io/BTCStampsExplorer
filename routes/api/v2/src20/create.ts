import { Handlers } from "$fresh/server.ts";
import { TX, TXError } from "$globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { SRC20Service } from "$server/services/src20/index.ts";
import { InputData } from "$types/index.d.ts";
import { convertEmojiToTick as _convertEmojiToTick } from "$lib/utils/emojiUtils.ts";
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

// Update the response interface to include more input details
interface EnhancedInputToSign {
  index: number;
  address?: string; // The address that needs to sign
  sighashType?: number; // Optional sighash type
  derivationPath?: string; // Optional derivation path
}

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request) {
    try {
      const rawBody = await req.text();
      if (!rawBody) {
        return ResponseUtil.badRequest("Empty request body");
      }

      let body: ExtendedInputData & { trxType?: TrxType };
      try {
        body = JSON.parse(rawBody);
      } catch (_e) {
        return ResponseUtil.badRequest("Invalid JSON in request body");
      }

      // Normalize fee rate
      const normalizedFees = normalizeFeeRate({
        satsPerKB: body.satsPerKB,
        satsPerVB: body.satsPerVB,
        feeRate: body.feeRate,
      });

      // Validate addresses and operation
      const effectiveSourceAddress = body.sourceAddress || body.fromAddress ||
        body.changeAddress;
      const effectiveChangeAddress = body.changeAddress || body.sourceAddress ||
        body.fromAddress;

      if (!effectiveSourceAddress) {
        return ResponseUtil.badRequest("Source address is required");
      }

      // Validate operation
      const validationError = await SRC20Service.UtilityService
        .validateOperation(
          body.op.toLowerCase(),
          {
            sourceAddress: effectiveSourceAddress,
            changeAddress: effectiveChangeAddress,
            tick: body.tick,
            max: body.max?.toString(),
            lim: body.lim?.toString(),
            dec: body.dec?.toString(),
            amt: body.amt?.toString(),
            toAddress: body.toAddress,
          },
        );

      if (validationError) {
        return validationError;
      }

      // Use single path for PSBT creation
      if (body.trxType === "multisig") {
        return ResponseUtil.badRequest(
          "Multisig transactions should use /api/v2/src20/multisig/[operation] endpoint",
        );
      }

      const psbtResult = await SRC20Service.PSBTService.preparePSBT({
        sourceAddress: effectiveSourceAddress,
        toAddress: body.toAddress || effectiveSourceAddress,
        src20Action: {
          p: "SRC-20",
          op: body.op.toUpperCase(),
          tick: body.tick,
          ...(body.max && { max: body.max.toString() }),
          ...(body.lim && { lim: body.lim.toString() }),
          ...(body.dec !== undefined && { dec: Number(body.dec) }),
          ...(body.amt && { amt: body.amt.toString() }),
          ...(body.x && { x: body.x }),
          ...(body.web && { web: body.web }),
          ...(body.email && { email: body.email }),
        },
        satsPerVB: normalizedFees.normalizedSatsPerVB,
        service_fee: body.service_fee || 0,
        service_fee_address: body.service_fee_address || "",
        changeAddress: effectiveChangeAddress,
        trxType: body.trxType || "olga",
      });

      // Return consistent response format
      return ApiResponseUtil.success({
        hex: psbtResult.psbt?.toHex(),
        est_tx_size: psbtResult.estimatedTxSize,
        input_value: psbtResult.totalInputValue,
        total_dust_value: psbtResult.totalDustValue,
        est_miner_fee: psbtResult.estMinerFee,
        fee: psbtResult.feeDetails.totalValue,
        change_value: psbtResult.totalChangeOutput,
        inputsToSign: psbtResult.inputs,
        sourceAddress: effectiveSourceAddress,
        changeAddress: psbtResult.changeAddress,
        feeDetails: {
          ...psbtResult.feeDetails,
          minerFee: psbtResult.estMinerFee,
          dustValue: psbtResult.totalDustValue,
          totalValue: psbtResult.estMinerFee + psbtResult.totalDustValue,
        },
      });
    } catch (error) {
      logger.error("stamps", {
        message: "Error processing request",
        error: error instanceof Error ? error.message : String(error),
      });
      return ApiResponseUtil.internalError(error);
    }
  },
};
