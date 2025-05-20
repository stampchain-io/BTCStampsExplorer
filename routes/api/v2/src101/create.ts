import { Handlers } from "$fresh/server.ts";
import { TX, TXError } from "$globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { SRC101Service } from "$server/services/src101/index.ts";
import { SRC101InputData } from "$types/index.d.ts";
import { logger } from "$lib/utils/logger.ts";

type TrxType = "multisig" | "olga";

export const handler: Handlers = {
  async POST(req: Request): Promise<Response> {
    try {
      let result: TX | TXError;
      let response: Response;

      const rawBody = await req.text();
      console.log("SRC-101 request body:", rawBody);

      const body: SRC101InputData & { trxType?: TrxType } = JSON.parse(rawBody);
      const trxType = body.trxType || "multisig";

      // Handle backward compatibility for fromAddress
      const effectiveSourceAddress = body.sourceAddress || body.fromAddress ||
        body.changeAddress;
      const effectiveChangeAddress = body.changeAddress || body.sourceAddress ||
        body.fromAddress;
      const effectiveRecAddress = body.recAddress;

      // Ensure at least one address exists
      if (!effectiveSourceAddress) {
        return ResponseUtil.badRequest(
          "Either sourceAddress/fromAddress or changeAddress is required",
        );
      }

      // Validate operation for both transaction types
      const validationError = await SRC101Service.UtilityService
        .validateOperation(
          body.op.toLowerCase() as
            | "deploy"
            | "mint"
            | "transfer"
            | "setrecord"
            | "renew",
          {
            ...body,
            sourceAddress: effectiveSourceAddress,
            changeAddress: effectiveChangeAddress,
            recAddress: effectiveRecAddress,
          },
        );
      console.log("validate=====>", validationError);
      if (validationError) {
        return ResponseUtil.badRequest(
          validationError.error || "Validation error",
        );
      }

      if (trxType === "multisig") {
        if (!effectiveSourceAddress || !effectiveChangeAddress) {
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
            sourceAddress: effectiveSourceAddress,
            recAddress: effectiveRecAddress || effectiveSourceAddress,
            changeAddress: effectiveChangeAddress,
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

        console.log("response", response);

        logger.debug("api-src101-create", {
          message: "Final multisig response",
          response: JSON.stringify(response, null, 2),
        });
        return response;
      } else {
        return ResponseUtil.badRequest("Not supported yet");
      }
    } catch (error: unknown) {
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
