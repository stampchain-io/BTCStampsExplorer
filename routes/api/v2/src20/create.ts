import { Handlers } from "$fresh/server.ts";
import { TXError } from "$globals";
import { AncestorInfo, InputData } from "$types/index.d.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { SRC20Service } from "$server/services/src20/index.ts";
import { logger } from "$lib/utils/logger.ts";
import { normalizeFeeRate } from "$server/services/xcpService.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";

type TrxType = "multisig" | "olga";

interface ExtendedInputData
  extends Omit<InputData, "feeRate" | "satsPerKB" | "satsPerVB"> {
  feeRate?: number | string;
  satsPerVB?: number | string;
  satsPerKB?: number | string;
  utxoAncestors?: AncestorInfo[];
  service_fee?: number | string;
  service_fee_address?: string;
  dryRun?: boolean;
  trxType?: TrxType;
}

interface SRC20CreateResponse {
  hex?: string;
  est_tx_size?: number;
  input_value?: number;
  total_dust_value?: number;
  est_miner_fee?: number;
  fee?: number;
  change_value?: number;
  inputsToSign?: Array<
    { index: number; address: string; sighashType?: number }
  >;
  sourceAddress?: string;
  changeAddress?: string;
  feeDetails?: any;
  cpid?: string;
}

export const handler: Handlers<SRC20CreateResponse | TXError> = {
  async POST(req: Request) {
    try {
      const rawBody = await req.text();
      if (!rawBody) {
        return ResponseUtil.badRequest("Empty request body");
      }

      let body: ExtendedInputData;
      try {
        body = JSON.parse(rawBody);
      } catch (_e) {
        return ResponseUtil.badRequest("Invalid JSON in request body");
      }

      if (
        !body.op || !body.tick ||
        !(body.sourceAddress || body.fromAddress || body.changeAddress)
      ) {
        return ApiResponseUtil.badRequest(
          "Missing required SRC20 operation fields: op, tick, or an address.",
        );
      }

      const isEffectivelyDryRun = body.dryRun === true;

      const feeInput: { satsPerKB?: number; satsPerVB?: number } = {};
      if (body.satsPerKB !== undefined) {
        feeInput.satsPerKB = typeof body.satsPerKB === "string"
          ? parseFloat(body.satsPerKB)
          : body.satsPerKB;
      }
      if (body.satsPerVB !== undefined) {
        feeInput.satsPerVB = typeof body.satsPerVB === "string"
          ? parseFloat(body.satsPerVB)
          : body.satsPerVB;
      }
      if (
        body.feeRate !== undefined && feeInput.satsPerKB === undefined &&
        feeInput.satsPerVB === undefined
      ) {
        feeInput.satsPerKB = typeof body.feeRate === "string"
          ? parseFloat(body.feeRate)
          : body.feeRate;
      }
      const normalizedFees = normalizeFeeRate(feeInput);

      const effectiveSourceAddress = body.sourceAddress || body.fromAddress ||
        body.changeAddress!;
      const effectiveChangeAddress = body.changeAddress || body.sourceAddress ||
        "";

      const opForValidation = body.op.toLowerCase() as
        | "deploy"
        | "transfer"
        | "mint";
      const validationError = await SRC20Service.UtilityService
        .validateOperation(
          opForValidation,
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
      if (validationError) return validationError as Response;
      if (body.trxType === "multisig") {
        return ResponseUtil.badRequest(
          "Multisig transactions should use dedicated endpoint",
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
        service_fee: body.service_fee !== undefined
          ? (typeof body.service_fee === "string"
            ? parseInt(body.service_fee)
            : body.service_fee)
          : 0,
        service_fee_address: body.service_fee_address || "",
        changeAddress: effectiveChangeAddress,
        trxType: body.trxType || "olga",
        isDryRun: isEffectivelyDryRun,
      });

      const responsePayload: SRC20CreateResponse = {
        hex: psbtResult.psbt?.toHex(),
        est_tx_size: psbtResult.estimatedTxSize,
        input_value: psbtResult.totalInputValue,
        total_dust_value: psbtResult.totalDustValue,
        est_miner_fee: psbtResult.estMinerFee,
        fee: psbtResult.feeDetails?.totalValue,
        change_value: psbtResult.totalChangeOutput,
        inputsToSign: psbtResult.inputs,
        sourceAddress: effectiveSourceAddress,
        changeAddress: psbtResult.changeAddress,
        feeDetails: psbtResult.feeDetails,
        cpid: body.tick,
      };

      if (isEffectivelyDryRun) {
        delete responsePayload.hex;
        delete responsePayload.inputsToSign;
      }
      return ApiResponseUtil.success(responsePayload);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      logger.error("api-src20-create", {
        message: "Error processing SRC20 create request",
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (
        errorMessage.toLowerCase().includes("insufficient funds") ||
        errorMessage.toLowerCase().includes("no utxos available") ||
        errorMessage.includes("UTXO selection failed")
      ) {
        return ApiResponseUtil.badRequest(errorMessage);
      }

      if (
        errorMessage.includes("Invalid address") ||
        errorMessage.includes("Invalid operation parameters")
      ) {
        return ApiResponseUtil.badRequest(errorMessage);
      }

      return ApiResponseUtil.internalError(
        error as Error,
        "Failed to process SRC20 request",
      );
    }
  },
};
