import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { logger } from "$lib/utils/logger.ts";
import { TX_CONSTANTS } from "$lib/utils/minting/constants.ts";
import CIP33 from "$lib/utils/minting/olga/CIP33.ts";
import { estimateTransactionSize } from "$lib/utils/minting/transactionSizes.ts";
import { normalizeFeeRate } from "$server/services/counterpartyApiService.ts";
import type { ScriptType } from "$types/index.d.ts";

interface EstimateRequest {
  filename: string;
  file: string;
  qty?: number | string;
  satsPerVB?: number | string;
  satsPerKB?: number | string;
  feeRate?: number | string;
  service_fee?: number | string;
  isPoshStamp?: boolean;
}

interface EstimateResponse {
  est_tx_size: number;
  total_dust_value: number;
  est_miner_fee: number;
  total_cost: number;
  fee_breakdown: {
    miner_fee: number;
    dust_value: number;
    service_fee: number;
  };
  file_info: {
    size_bytes: number;
    cip33_addresses_count: number;
  };
  is_estimate: true;
  estimation_method: "dummy_utxos";
  dummy_utxo_value: number;
}

export const handler: Handlers = {
  async POST(req: Request): Promise<Response> {
    const requestId = `est-${Date.now()}-${
      Math.random().toString(36).substr(2, 9)
    }`;

    logger.info("stamps", {
      message: "Fee estimation request received",
      requestId,
      url: req.url,
      headers: {
        contentType: req.headers.get("content-type"),
        userAgent: req.headers.get("user-agent")?.substring(0, 50),
      },
    });

    try {
      const body: EstimateRequest = await req.json();

      logger.debug("stamps", {
        message: "Fee estimation request parsed",
        requestId,
        filename: body.filename,
        fileSize: body.file?.length || 0,
        satsPerVB: body.satsPerVB,
        satsPerKB: body.satsPerKB,
        feeRate: body.feeRate,
        serviceFee: body.service_fee,
        qty: body.qty,
        isPoshStamp: body.isPoshStamp,
        bodyKeys: Object.keys(body),
      });

      // Validate required fields
      if (!body.filename || !body.file) {
        return ApiResponseUtil.badRequest(
          "Missing required fields: filename, file",
        );
      }

      // Normalize fee rate
      let normalizedFees;
      try {
        const feeInputArgs: { satsPerKB?: number; satsPerVB?: number } = {};
        if (body.satsPerKB !== undefined) {
          feeInputArgs.satsPerKB = typeof body.satsPerKB === "string"
            ? parseFloat(body.satsPerKB)
            : body.satsPerKB;
        }
        if (body.satsPerVB !== undefined) {
          feeInputArgs.satsPerVB = typeof body.satsPerVB === "string"
            ? parseFloat(body.satsPerVB)
            : body.satsPerVB;
        }
        if (
          body.feeRate !== undefined &&
          feeInputArgs.satsPerKB === undefined &&
          feeInputArgs.satsPerVB === undefined
        ) {
          feeInputArgs.satsPerKB = typeof body.feeRate === "string"
            ? parseFloat(body.feeRate)
            : body.feeRate;
        }
        normalizedFees = normalizeFeeRate(feeInputArgs);
      } catch (error) {
        return ApiResponseUtil.badRequest(
          error instanceof Error ? error.message : "Invalid fee rate",
        );
      }

      // Parse file and calculate CIP33 addresses
      const fileSize = Math.ceil((body.file.length * 3) / 4);
      const hex_file = CIP33.base64_to_hex(body.file);
      const cip33Addresses = CIP33.file_to_addresses(hex_file);

      logger.debug("stamps", {
        message: "File analysis for estimation",
        filename: body.filename,
        fileSize,
        cip33AddressCount: cip33Addresses.length,
        hexLength: hex_file.length,
      });

      // Calculate dust value (one dust output per CIP33 address)
      const totalDustValue = cip33Addresses.length * TX_CONSTANTS.DUST_SIZE;

      // Parse service fee with proper validation
      let serviceFee = 0;
      if (body.service_fee !== undefined && body.service_fee !== null) {
        if (typeof body.service_fee === "string") {
          const parsed = parseInt(body.service_fee, 10);
          serviceFee = isNaN(parsed) ? 0 : parsed;
        } else if (typeof body.service_fee === "number") {
          serviceFee = isNaN(body.service_fee) ? 0 : body.service_fee;
        }
      }

      logger.debug("stamps", {
        message: "Service fee parsing",
        rawServiceFee: body.service_fee,
        rawServiceFeeType: typeof body.service_fee,
        parsedServiceFee: serviceFee,
        parsedServiceFeeType: typeof serviceFee,
      });

      // For large files, we need bigger dummy UTXOs to ensure sufficient funds
      // Max 64KB file ≈ 2000 outputs × 333 sats + miner fees ≈ 1M+ sats needed
      const estimatedTotalCost =
        (cip33Addresses.length * TX_CONSTANTS.DUST_SIZE) +
        (cip33Addresses.length * 10) + // rough miner fee estimate
        serviceFee;

      // Use larger dummy UTXOs for big transactions (minimum 1M sats, scale up for large files)
      const dummyUtxoValue = Math.max(1000000, estimatedTotalCost * 1.5);

      logger.debug("stamps", {
        message: "Dummy UTXO sizing for estimation",
        cip33AddressCount: cip33Addresses.length,
        estimatedTotalCost,
        dummyUtxoValue,
        fileSize,
      });

      // Estimate transaction size using dummy inputs/outputs with realistic sizes
      const estimatedSize = estimateTransactionSize({
        inputs: [
          {
            type: "P2WPKH" as ScriptType,
            isWitness: true,
          },
          // Add a second input for larger files to ensure sufficient funds
          ...(cip33Addresses.length > 100
            ? [{
              type: "P2WPKH" as ScriptType,
              isWitness: true,
            }]
            : []),
        ],
        outputs: [
          { type: "OP_RETURN" as ScriptType }, // Counterparty OP_RETURN
          ...cip33Addresses.map(() => ({
            type: "P2WSH" as ScriptType, // CIP33 data outputs
          })),
          ...(serviceFee > 0 ? [{ type: "P2WPKH" as ScriptType }] : []), // Service fee output
          { type: "P2WPKH" as ScriptType }, // Change output
        ],
        includeChangeOutput: true,
        changeOutputType: "P2WPKH" as ScriptType,
      });

      // Calculate miner fee
      const estMinerFee = Math.ceil(
        estimatedSize * normalizedFees.normalizedSatsPerVB,
      );

      // Calculate total cost - ensure it's not null
      const totalCost = estMinerFee + totalDustValue + serviceFee;

      // Additional validation to catch any NaN or invalid values
      if (isNaN(totalCost) || !isFinite(totalCost)) {
        logger.error("stamps", {
          message: "Invalid total cost calculation",
          estMinerFee,
          totalDustValue,
          serviceFee,
          totalCost,
          calculationInputs: {
            estMinerFeeType: typeof estMinerFee,
            totalDustValueType: typeof totalDustValue,
            serviceFeeType: typeof serviceFee,
            estMinerFeeIsNaN: isNaN(estMinerFee),
            totalDustValueIsNaN: isNaN(totalDustValue),
            serviceFeeIsNaN: isNaN(serviceFee),
          },
        });

        return ApiResponseUtil.internalError("Invalid fee calculation result");
      }

      logger.debug("stamps", {
        message: "Fee calculation breakdown",
        estMinerFee,
        totalDustValue,
        serviceFee,
        totalCost,
        calculationCheck: {
          minerFeeIsNumber: typeof estMinerFee === "number",
          dustValueIsNumber: typeof totalDustValue === "number",
          serviceFeeIsNumber: typeof serviceFee === "number",
          totalCostIsNumber: typeof totalCost === "number",
          totalCostIsValid: !isNaN(totalCost) && isFinite(totalCost),
        },
      });

      const response: EstimateResponse = {
        est_tx_size: estimatedSize,
        total_dust_value: totalDustValue,
        est_miner_fee: estMinerFee,
        total_cost: totalCost,
        fee_breakdown: {
          miner_fee: estMinerFee,
          dust_value: totalDustValue,
          service_fee: serviceFee,
        },
        file_info: {
          size_bytes: fileSize,
          cip33_addresses_count: cip33Addresses.length,
        },
        is_estimate: true,
        estimation_method: "dummy_utxos",
        dummy_utxo_value: dummyUtxoValue,
      };

      // Validate response before sending
      logger.debug("stamps", {
        message: "Response validation before sending",
        responseValidation: {
          totalCostInResponse: response.total_cost,
          totalCostType: typeof response.total_cost,
          totalCostIsNull: response.total_cost === null,
          totalCostIsUndefined: response.total_cost === undefined,
          totalCostIsNaN: isNaN(response.total_cost),
          responseKeys: Object.keys(response),
        },
      });

      logger.info("stamps", {
        message: "Fee estimation completed",
        requestId,
        fileSize,
        cip33AddressCount: cip33Addresses.length,
        estimatedSize,
        feeRate: normalizedFees.normalizedSatsPerVB,
        estMinerFee,
        totalDustValue,
        serviceFee,
        totalCost,
        responseData: {
          est_tx_size: estimatedSize,
          total_dust_value: totalDustValue,
          est_miner_fee: estMinerFee,
          total_cost: totalCost,
        },
      });

      return ApiResponseUtil.success(response, { forceNoCache: true });
    } catch (error) {
      logger.error("stamps", {
        message: "Fee estimation error",
        requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      const errorMessage = error instanceof Error
        ? error.message
        : "An unexpected error occurred during fee estimation";

      return ApiResponseUtil.internalError(errorMessage);
    }
  },
};
