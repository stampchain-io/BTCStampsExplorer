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
    try {
      const originError = await InternalRouteGuard.requireTrustedOrigin(req);
      if (originError) return originError;

      const sourceIndex = requestCounter % PRICE_SOURCES.length;
      const initialSource = PRICE_SOURCES[sourceIndex];

      requestCounter = (requestCounter + 1) % Number.MAX_SAFE_INTEGER;

      const result = await BTCPriceService.getPrice(initialSource);

      if ("error" in result) {
        return ResponseUtil.internalError(result.error);
      }

      if (!result.price) {
        return ResponseUtil.internalError("No price data available");
      }

      const btcPrice = "bitcoin" in result.price
        ? result.price.bitcoin.usd
        : result.price.price;

      const formattedResult = {
        data: {
          price: btcPrice,
          source: result.source,
          details: result.price,
        },
      };

      return ResponseUtil.success(formattedResult, {
        routeType: RouteType.PRICE,
        forceNoCache: false,
      });
    } catch (error) {
      return ResponseUtil.internalError(
        error instanceof Error ? error.message : "Unknown error",
        "Failed to fetch BTC price",
      );
    }
  },
};
