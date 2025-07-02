import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { FileUploadService } from "$server/services/file/uploadService.ts";
import { InternalRouteGuard } from "$server/services/security/internalRouteGuard.ts";
import { SRC20BackgroundUpload } from "$lib/types/src20.ts";
import { logger } from "$lib/utils/logger.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      // Log incoming request headers
      const csrfToken = req.headers.get("x-csrf-token");
      logger.debug("stamps", {
        message: "Received background upload request",
        headers: Object.fromEntries(req.headers.entries()),
        method: req.method,
        csrfToken: csrfToken?.slice(0, 10) + "...",
      });

      // Check CSRF and origin
      const csrfError = await InternalRouteGuard.requireCSRF(req);
      if (csrfError) {
        logger.error("stamps", {
          message: "CSRF validation failed",
          error: "Invalid CSRF token",
          headers: Object.fromEntries(req.headers.entries()),
          csrfToken: csrfToken?.slice(0, 10) + "...",
        });
        return csrfError;
      }

      const originError = await InternalRouteGuard.requireTrustedOrigin(req);
      if (originError) {
        logger.error("stamps", {
          message: "Origin validation failed",
          error: "Invalid origin",
          origin: req.headers.get("origin"),
        });
        return originError;
      }

      // Clone the request to read the body for logging
      const clonedReq = req.clone();
      const rawBody = await clonedReq.text();

      let body: Partial<SRC20BackgroundUpload>;
      try {
        body = JSON.parse(rawBody) as Partial<SRC20BackgroundUpload>;
      } catch (e) {
        logger.error("stamps", {
          message: "Failed to parse request body",
          error: e instanceof Error ? e.message : "Unknown parse error",
          rawBody: rawBody.slice(0, 100) + "...", // Log first 100 chars
        });
        return ApiResponseUtil.badRequest("Invalid JSON payload");
      }

      // Log request validation
      logger.debug("stamps", {
        message: "Validating background upload request",
        hasFileData: !!body.fileData,
        fileDataLength: body.fileData?.length,
        hasTick: !!body.tick,
        hasCSRF: !!body.csrfToken,
        tickLength: body.tick?.length,
        tick: body.tick,
        csrfPresent: !!body.csrfToken,
      });

      if (!body.fileData || !body.tick) {
        const missing = [];
        if (!body.fileData) missing.push("fileData");
        if (!body.tick) missing.push("tick");

        logger.error("stamps", {
          message: "Missing required fields",
          missingFields: missing,
        });

        return ApiResponseUtil.badRequest(
          `Missing required fields: ${missing.join(", ")}`,
        );
      }

      const result = await FileUploadService.uploadSRC20Background({
        fileData: body.fileData,
        tick: body.tick,
        csrfToken: csrfToken || "",
      });

      if (!result.success) {
        logger.error("stamps", {
          message: "Upload service failed",
          error: result.message,
          tick: body.tick,
        });
        return ApiResponseUtil.badRequest(result.message || "Upload failed");
      }

      return ApiResponseUtil.success(result);
    } catch (error) {
      logger.error("stamps", {
        message: "Error processing file upload",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      return ApiResponseUtil.internalError(
        error,
        "Error processing file upload",
      );
    }
  },
};
