import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { SRC101Service } from "$server/services/src101/index.ts";
import { SRC101InputData } from "$types/index.d.ts";
import { logger } from "$lib/utils/logger.ts";

type TrxType = "multisig" | "olga";

export const handler: Handlers = {
  async POST(req: Request): Promise<Response> {
    try {
      let response: Response;

      const rawBody = await req.text();
      console.log("SRC-101 request body:", rawBody);

      const body: SRC101InputData & { trxType?: TrxType } = JSON.parse(rawBody);
      const trxType = body.trxType || "olga";

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

      if (trxType === "multisig" || trxType === "olga") {
        if (!effectiveSourceAddress || !effectiveChangeAddress) {
          return ResponseUtil.badRequest("Missing required addresses");
        }

        const result = await SRC101Service.TransactionService.handleOperation(
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
          trxType,
        );

        logger.debug("stamps", {
          message: "Multisig transaction result",
          result: JSON.stringify(result, null, 2),
        });

        if ("error" in result) {
          logger.error("stamps", {
            message: "Operation error",
            error: result.error,
          });
          response = ApiResponseUtil.badRequest(result.error);
        } else {
          response = ApiResponseUtil.success(result);
        }

        console.log("response", response);

        logger.debug("stamps", {
          message: "Final multisig response",
          response: JSON.stringify(response, null, 2),
        });
        return response;
      } else {
        return ApiResponseUtil.badRequest("Not supported yet");
      }
    } catch (error: unknown) {
      console.error("Error processing request:", error);
      if (error instanceof SyntaxError) {
        return ApiResponseUtil.badRequest("Invalid JSON in request body");
      }
      return ApiResponseUtil.badRequest(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  },
};
