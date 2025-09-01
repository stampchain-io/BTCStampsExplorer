import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";

/**
 * Simple health check endpoint for CI/CD and load balancers
 * Always returns 200 OK with minimal checks for fast response
 */
export const handler: Handlers = {
  GET(_req) {
    try {
      // Simple health check that just verifies the API server is running
      const health = {
        status: "OK",
        timestamp: new Date().toISOString(),
        api: true,
      };

      return ApiResponseUtil.success(health, {
        forceNoCache: true,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch (error) {
      console.error("Health check failed:", error);

      return ApiResponseUtil.internalError(
        error instanceof Error ? error : new Error(String(error)),
        "Health check failed",
        {
          status: 503,
          headers: {
            "Cache-Control": "no-cache",
          },
        },
      );
    }
  },
};
