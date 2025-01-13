import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
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
      const type = url.searchParams.get("type") || "minting";
      const limit = Number(url.searchParams.get("limit")) || 50;
      const page = Number(url.searchParams.get("page")) || 1;
      const transactionCount =
        Number(url.searchParams.get("transactionCount")) || 1000;

      let result;
      if (type === "minting") {
        result = await Src20Controller.fetchTrendingActiveMintingTokensV2(
          limit,
          page,
          transactionCount,
        );
      } else {
        result = await Src20Controller.fetchFullyMintedByMarketCapV2(
          limit,
          page,
        );
      }

      return ApiResponseUtil.success(result, {
        routeType: RouteType.DYNAMIC,
      });
    } catch (error) {
      console.error("Error in trending endpoint:", error);
      return ApiResponseUtil.internalError(
        error,
        "Error fetching tokens",
      );
    }
  },
};
