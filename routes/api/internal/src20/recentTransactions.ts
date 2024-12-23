import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { RouteType } from "$server/services/cacheService.ts";

export const handler: Handlers = {
  async GET() {
    try {
      const recentTransactions = await Src20Controller
        .fetchRecentTransactions();

      return ApiResponseUtil.success(recentTransactions, {
        routeType: RouteType.DYNAMIC,
      });
    } catch (error) {
      return ApiResponseUtil.internalError(
        error,
        "Error fetching recent transactions",
      );
    }
  },
};
