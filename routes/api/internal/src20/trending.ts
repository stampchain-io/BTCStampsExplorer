import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { RouteType } from "$server/services/cacheService.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get("limit") || "5");
      const page = parseInt(url.searchParams.get("page") || "1");
      const transactionCount = parseInt(
        url.searchParams.get("transactionCount") || "1000",
      );

      const trendingData = await Src20Controller.fetchTrendingTokens(
        req,
        limit,
        page,
        transactionCount,
      );

      return ResponseUtil.success(trendingData, {
        routeType: RouteType.DYNAMIC,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      return ResponseUtil.internalError(
        error,
        "Error fetching trending tokens",
      );
    }
  },
};
