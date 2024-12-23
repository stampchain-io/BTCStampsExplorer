import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { RouteType } from "$server/services/cacheService.ts";

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
    try {
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get("limit") || "5");
      const page = parseInt(url.searchParams.get("page") || "1");
      const type = url.searchParams.get("type") || "minting"; // 'minting' or 'market'
      const transactionCount = parseInt(
        url.searchParams.get("transactionCount") || "1000",
      );

      let result;
      const useV2 = new URL(req.url).searchParams.get("v2") === "1";
      const type = new URL(req.url).searchParams.get("type") || "minting";
      
      if (type === "market") {
        // Get top tickers by market cap (fully minted)
        result = await Src20Controller.fetchFullyMintedByMarketCapV2(
          limit,
          page,
          useV2
        );
      } else {
        // Get trending minting tokens
        result = await Src20Controller.fetchTrendingActiveMintingTokensV2(
          limit,
          page,
          transactionCount,
          useV2
        );
      }

      return ApiResponseUtil.success(result, {
        routeType: RouteType.DYNAMIC,
      });
    } catch (error) {
      return ApiResponseUtil.internalError(
        error,
        `Error fetching ${type || "minting"} tokens`,
      );
    }
  },
};
