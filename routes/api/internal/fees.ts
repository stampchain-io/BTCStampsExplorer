import { Handlers } from "$fresh/server.ts";
import { RateLimitMiddleware } from "$server/middleware/rateLimitMiddleware.ts";
import { getProductionFeeService } from "$server/services/fee/feeServiceFactory.ts";
import { InternalApiFrontendGuard } from "$server/services/security/internalApiFrontendGuard.ts";

export const handler: Handlers = {
  async GET(req) {
    // Origin validation for read-only endpoint (no CSRF needed)
    const originError = await InternalApiFrontendGuard.requireInternalAccess(
      req,
    );
    if (originError) {
      console.log("[fees.ts] Origin validation failed");
      return originError;
    }

    // Rate limiting for fee endpoints
    const rateLimitError = await RateLimitMiddleware.checkFeeRateLimit(req);
    if (rateLimitError) {
      console.log("[fees.ts] Rate limit exceeded");
      return rateLimitError;
    }

    const startTime = Date.now();

    try {
      console.log("[fees.ts] Starting fee estimation with DI service");

      // Use the new DI-based FeeService
      const feeService = getProductionFeeService();
      const feeData = await feeService.getFeeData();

      const duration = Date.now() - startTime;
      console.log(
        `[fees.ts] Fee estimation completed in ${duration}ms using ${feeData.source} source (DI-based)`,
      );

      // Add rate limit headers to response
      const rateLimitHeaders = RateLimitMiddleware.getRateLimitHeaders(
        req,
        60,
        60 * 1000,
      );

      return Response.json(feeData, {
        headers: rateLimitHeaders,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[fees.ts] Critical error after ${duration}ms:`, error);

      // Add rate limit headers to error response
      const rateLimitHeaders = RateLimitMiddleware.getRateLimitHeaders(
        req,
        60,
        60 * 1000,
      );

      // Emergency fallback - this should rarely happen as FeeService has its own fallbacks
      return Response.json({
        recommendedFee: 10, // Conservative fallback
        btcPrice: 0,
        source: "default",
        confidence: "low",
        timestamp: Date.now(),
        fallbackUsed: true,
        errors: [
          `Critical error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
        emergencyFallback: true,
        debug_feesResponse: {
          static_fallback: true,
          reason: "FeeService critical failure",
        },
      }, {
        status: 500,
        headers: rateLimitHeaders,
      });
    }
  },
};
