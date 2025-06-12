import { Handlers } from "$fresh/server.ts";
import { BTCPriceService } from "$server/services/price/btcPriceService.ts";
import { InternalRouteGuard } from "$server/services/security/internalRouteGuard.ts";
import { RouteType } from "$server/services/cacheService.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";

// Use an atomic counter for round-robin
let requestCounter = 0;

// List of available sources in preferred order
const PRICE_SOURCES = ["quicknode", "coingecko"] as const;

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const requestId = `price-${Date.now()}-${
      Math.random().toString(36).substr(2, 9)
    }`;
    console.log(`[${requestId}] BTC price request started from ${url.origin}`);

    try {
      const originError = await InternalRouteGuard.requireTrustedOrigin(req);
      if (originError) {
        console.warn(
          `[${requestId}] Origin validation failed for ${url.origin}`,
        );
        return originError;
      }

      // Get next source in round-robin fashion
      const sourceIndex = requestCounter % PRICE_SOURCES.length;
      const initialSource = PRICE_SOURCES[sourceIndex];
      console.log(
        `[${requestId}] Selected source: ${initialSource} (counter: ${requestCounter})`,
      );

      // Increment counter atomically
      requestCounter = (requestCounter + 1) % Number.MAX_SAFE_INTEGER;

      console.log(`[${requestId}] Fetching price from BTCPriceService...`);
      const result = await BTCPriceService.getPrice(initialSource);
      console.log(`[${requestId}] BTCPriceService result:`, result);

      if (!result.price && result.source !== "default") {
        console.error(`[${requestId}] No price data available`);
        return ApiResponseUtil.internalError("No price data available");
      }

      const formattedResult = {
        data: {
          price: result.price,
          source: result.source,
          confidence: result.confidence,
          details: result.details,
        },
      };

      console.log(
        `[${requestId}] Sending response with price: ${result.price} from ${result.source}`,
      );
      return ApiResponseUtil.success(formattedResult, {
        routeType: RouteType.PRICE,
        forceNoCache: false,
      });
    } catch (error) {
      console.error(`[${requestId}] Unexpected error:`, error);
      return ApiResponseUtil.internalError(
        error instanceof Error ? error.message : "Unknown error",
        "Failed to fetch BTC price",
      );
    }
  },
};
