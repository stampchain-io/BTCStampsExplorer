import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { RouteType } from "$server/services/cacheService.ts";
import { CircuitBreakerError } from "$server/services/circuitBreaker.ts";

/**
 * Endpoint for fetching top SRC20 tokens based on different criteria:
 *
 * 1. Trending minting tokens (type=minting):
 *    - Not fully minted
 *    - Ordered by % of mints in last N transactions
 *    - Does not include market data
 *
 * 2. Top tickers by market cap (type=market):
 *    - Fully minted tokens only
 *    - Ordered by market cap
 *    - Includes market data
 */
export const handler: Handlers = {
  async GET(req) {
    const startTime = Date.now();

    try {
      const url = new URL(req.url);
      const type = url.searchParams.get("type") || "minting";
      const limit = Number(url.searchParams.get("limit")) || 50;
      const page = Number(url.searchParams.get("page")) || 1;
      const transactionCount =
        Number(url.searchParams.get("transactionCount")) || 1000;

      console.log(
        `[TRENDING] Request: type=${type}, limit=${limit}, page=${page}, transactionCount=${transactionCount}`,
      );

      let result;
      try {
        if (type === "minting") {
          console.log(`[TRENDING] Fetching trending minting tokens...`);
          result = await Src20Controller.fetchTrendingActiveMintingTokensV2(
            limit,
            page,
            transactionCount,
          );
        } else {
          console.log(`[TRENDING] Fetching fully minted by market cap...`);
          result = await Src20Controller.fetchFullyMintedByMarketCapV2(
            limit,
            page,
          );
        }
      } catch (controllerError) {
        console.error(`[TRENDING] Controller method error:`, controllerError);

        // If controller method fails, check if it's a circuit breaker error
        if (controllerError instanceof CircuitBreakerError) {
          console.warn(
            `[TRENDING] Circuit breaker activated in controller: ${controllerError.message}`,
          );
          return ApiResponseUtil.success({
            data: [],
            total: 0,
            page: 1,
            totalPages: 0,
            limit: 50,
            isFromFallback: true,
            fallbackReason:
              "Circuit breaker activated due to repeated failures",
          }, {
            routeType: RouteType.DYNAMIC,
          });
        }

        // Re-throw other errors to be handled by the outer catch block
        throw controllerError;
      }

      const duration = Date.now() - startTime;
      console.log(`[TRENDING] Request completed in ${duration}ms`);

      return ApiResponseUtil.success(result, {
        routeType: RouteType.DYNAMIC,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[TRENDING] Error after ${duration}ms:`, error);

      // Handle circuit breaker errors specifically
      if (error instanceof CircuitBreakerError) {
        console.warn(`[TRENDING] Circuit breaker activated: ${error.message}`);

        // Return basic fallback data when circuit breaker is open
        return ApiResponseUtil.success({
          data: [],
          total: 0,
          page: 1,
          totalPages: 0,
          limit: 50,
          isFromFallback: true,
          fallbackReason: "Circuit breaker activated due to repeated failures",
        }, {
          routeType: RouteType.DYNAMIC,
        });
      }

      // Handle other errors with basic fallback
      if (
        error instanceof Error &&
        (error.message.includes("timeout") ||
          error.message.includes("ECONNREFUSED"))
      ) {
        console.warn(
          `[TRENDING] Database connection error, returning empty result`,
        );
        return ApiResponseUtil.success({
          data: [],
          total: 0,
          page: 1,
          totalPages: 0,
          limit: 50,
          isFromFallback: true,
          fallbackReason: "Database connection timeout",
        }, {
          routeType: RouteType.DYNAMIC,
        });
      }

      return ApiResponseUtil.internalError(
        error,
        "Error fetching tokens",
      );
    }
  },
};
