import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { RouteType } from "$server/services/cacheService.ts";

export const handler: Handlers = {
  async GET() {
    try {
      const recentTransactions = await Src20Controller
        .fetchRecentTransactions();

      return ResponseUtil.success(recentTransactions, {
        routeType: RouteType.DYNAMIC,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      return ResponseUtil.internalError(
        error,
        "Error fetching recent transactions",
      );
    }
  },
};
