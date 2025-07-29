import { Handlers } from "$fresh/server.ts";
import { SecurityService } from "$server/services/security/securityService.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { logger } from "$lib/utils/logger.ts";
import { InternalApiFrontendGuard } from "$server/services/security/internalApiFrontendGuard.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      // Security check for internal endpoints
      const originError = InternalApiFrontendGuard.requireInternalAccess(req);
      if (originError) return originError;
      const token = await SecurityService.generateCSRFToken();

      logger.debug("stamps", {
        message: "CSRF token generated for request",
        tokenLength: token.length,
        tokenPreview: token.slice(0, 10) + "...",
      });

      return ApiResponseUtil.success({ token });
    } catch (error) {
      logger.error("stamps", {
        message: "Failed to generate CSRF token",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      return ApiResponseUtil.internalError(
        error,
        "Failed to generate CSRF token",
      );
    }
  },
};
