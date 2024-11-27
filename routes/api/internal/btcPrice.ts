import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { BTCPriceService } from "$server/services/price/btcPriceService.ts";
import { InternalRouteGuard } from "$server/services/security/internalRouteGuard.ts";
import { RouteType } from "$server/services/cacheService.ts";

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

      if ("error" in result) {
        console.error(`[${requestId}] Price service error:`, result.error);
        return ResponseUtil.internalError(result.error);
      }

      if (!result.price) {
        console.error(`[${requestId}] No price data available`);
        return ResponseUtil.internalError("No price data available");
      }

      const btcPrice = "bitcoin" in result.price
        ? result.price.bitcoin.usd
        : result.price.price;

      console.log(`[${requestId}] Extracted BTC price: ${btcPrice}`);

      const formattedResult = {
        data: {
          price: btcPrice,
          source: result.source,
          details: result.price,
        },
      };

      console.log(
        `[${requestId}] Sending response with price: ${btcPrice} from ${result.source}`,
      );
      return ResponseUtil.success(formattedResult, {
        routeType: RouteType.PRICE,
        forceNoCache: false,
      });
    } catch (error) {
      console.error(`[${requestId}] Unexpected error:`, error);
      return ResponseUtil.internalError(
        error instanceof Error ? error.message : "Unknown error",
        "Failed to fetch BTC price",
      );
    }
  },
};
