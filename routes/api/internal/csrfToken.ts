import { Handlers } from "$fresh/server.ts";
import { SecurityService } from "$server/services/security/securityService.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { logger } from "$lib/utils/logger.ts";

export const handler: Handlers = {
  async GET(_req) {
    try {
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
