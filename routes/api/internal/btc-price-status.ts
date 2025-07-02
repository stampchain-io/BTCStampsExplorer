import { Handlers } from "$fresh/server.ts";
import { BTCPriceService } from "$server/services/price/btcPriceService.ts";
import { InternalRouteGuard } from "$server/services/security/internalRouteGuard.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const originError = await InternalRouteGuard.requireTrustedOrigin(req);
      if (originError) return originError;

      const cacheInfo = BTCPriceService.getCacheInfo();

      const status = {
        service: "BTCPriceService",
        cache: cacheInfo,
        timestamp: new Date().toISOString(),
      };

      return ApiResponseUtil.success(status);
    } catch (error) {
      return ApiResponseUtil.internalError(
        error instanceof Error ? error.message : "Unknown error",
        "Failed to get BTC price status",
      );
    }
  },

  async POST(req) {
    try {
      const originError = await InternalRouteGuard.requireTrustedOrigin(req);
      if (originError) return originError;

      const url = new URL(req.url);
      const action = url.searchParams.get("action");

      if (action === "invalidate") {
        await BTCPriceService.invalidateCache();
        return ApiResponseUtil.success({
          message: "BTC price cache invalidated",
        });
      }

      if (action === "warm") {
        await BTCPriceService.getPrice(); // This will warm the cache
        return ApiResponseUtil.success({ message: "BTC price cache warmed" });
      }

      return ApiResponseUtil.badRequest(
        "Invalid action. Use 'invalidate' or 'warm'",
      );
    } catch (error) {
      return ApiResponseUtil.internalError(
        error instanceof Error ? error.message : "Unknown error",
        "Failed to perform BTC price action",
      );
    }
  },
};
