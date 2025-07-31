import { Handlers } from "$fresh/server.ts";
import { logger } from "$lib/utils/logger.ts";
import { ResponseUtil } from "$lib/utils/api/responses/responseUtil.ts";
import { SRC101Service } from "$server/services/src101/index.ts";
import type { TX, TXError } from "$types/transaction.d.ts";

type TrxType = "multisig" | "olga";

export const handler: Handlers = {
  async POST(req: Request): Promise<Response> {
    try {
      let result: TX | TXError;
      let response: Response;

      const rawBody = await req.text();
      // Parse SRC-101 request body

      const body: SRC101InputData & { trxType?: TrxType; dryRun?: boolean } =
        JSON.parse(rawBody);
      const trxType = body.trxType || "multisig";
      const dryRun = body.dryRun === true;

      // Handle backward compatibility for fromAddress
      const effectiveSourceAddress = body.sourceAddress || body.fromAddress ||
        body.changeAddress;
      const effectiveChangeAddress = body.changeAddress || body.sourceAddress ||
        body.fromAddress || "";
      const effectiveRecAddress = body.recAddress;

      // For dryRun, we can use dummy addresses to avoid validation issues
      const finalSourceAddress = dryRun && !effectiveSourceAddress
        ? "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4" // Valid P2WPKH dummy address for estimation
        : effectiveSourceAddress;
      const finalChangeAddress = dryRun && !effectiveChangeAddress
        ? "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4" // Valid P2WPKH dummy address for estimation
        : effectiveChangeAddress;

      // Ensure at least one address exists
      if (!finalSourceAddress) {
        return ResponseUtil.badRequest(
          "Either sourceAddress/fromAddress or changeAddress is required",
        );
      }

      // For dryRun, return fee estimates without creating actual PSBT
      if (dryRun) {
        // SRC101 transactions are typically ~300 bytes
        const estimatedTxSize = 300;
        const feeRate = Number(body.feeRate) || 1;
        const estMinerFee = Math.ceil(estimatedTxSize * feeRate);
        const totalDustValue = 546; // Standard P2WPKH dust limit
        const totalCost = estMinerFee + totalDustValue;

        return ResponseUtil.success({
          est_miner_fee: estMinerFee,
          total_dust_value: totalDustValue,
          total_cost: totalCost,
          est_tx_size: estimatedTxSize,
          feeDetails: {
            total: estMinerFee,
            effectiveFeeRate: feeRate,
            estimatedSize: estimatedTxSize,
          },
          is_estimate: true,
          estimation_method: "dryRun_calculation",
        });
      }

      // Validate operation for both transaction types (skip for dryRun as we already returned)
      const validationError = await SRC101Service.UtilityService
        .validateOperation(
          body.op.toLowerCase() as
            | "deploy"
            | "mint"
            | "transfer"
            | "setrecord"
            | "renew",
          {
            op: body.op,
            feeRate: body.feeRate,
            toAddress: body.toAddress,
            fromAddress: body.fromAddress,
            root: body.root,
            sourceAddress: finalSourceAddress,
            changeAddress: finalChangeAddress,
            ...(effectiveRecAddress && { recAddress: effectiveRecAddress }),
          } as SRC101InputData,
        );
      // Validation failed
      if (validationError) {
        return ResponseUtil.badRequest(
          validationError.error || "Validation error",
        );
      }

      if (trxType === "multisig") {
        if (!finalSourceAddress || !finalChangeAddress) {
          return ResponseUtil.badRequest("Missing required addresses");
        }

        result = await SRC101Service.TransactionService.handleOperation(
          body.op.toLowerCase() as
            | "deploy"
            | "mint"
            | "transfer"
            | "setrecord"
            | "renew",
          {
            ...body,
            sourceAddress: finalSourceAddress,
            recAddress: effectiveRecAddress || finalSourceAddress,
            changeAddress: finalChangeAddress,
          },
        );
        logger.debug("api-src101-create", {
          message: "Multisig transaction result",
          result: JSON.stringify(result, null, 2),
        });

        if ("error" in result) {
          logger.error("api-src101-create", {
            message: "Operation error from service",
            error: result.error,
          });
          if (
            typeof result.error === "string" &&
            (result.error.toLowerCase().includes("insufficient funds") ||
              result.error.toLowerCase().includes("no utxos available"))
          ) {
            response = ResponseUtil.badRequest(result.error);
          } else {
            response = ResponseUtil.badRequest(
              result.error || "Operation failed",
            );
          }
        } else {
          response = ResponseUtil.success(result, { forceNoCache: true });
        }

        // Return successful response

        logger.debug("api-src101-create", {
          message: "Final multisig response",
          response: JSON.stringify(response, null, 2),
        });
        return response;
      } else {
        return ResponseUtil.badRequest("Not supported yet");
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      logger.error("api-src101-create", {
        message: "Error processing SRC101 create request",
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      if (error instanceof SyntaxError) {
        return ResponseUtil.badRequest("Invalid JSON in request body");
      }
      if (
        errorMessage.toLowerCase().includes("insufficient funds") ||
        errorMessage.toLowerCase().includes("no utxos available")
      ) {
        return ResponseUtil.badRequest(errorMessage);
      }
      return ResponseUtil.badRequest(
        errorMessage || "Unknown error occurred processing SRC101 request",
      );
    }
  },
};
