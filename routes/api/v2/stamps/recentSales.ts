import { Handlers } from "$fresh/server.ts";
import { StampController } from "$server/controller/stampController.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import {
  checkEmptyResult,
  DEFAULT_PAGINATION,
} from "$server/services/routeValidationService.ts";
import { RouteType } from "$server/services/cacheService.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const pagination = getPaginationParams(url);

      // Check if pagination validation failed
      if (pagination instanceof Response) {
        return pagination;
      }

      const { limit, page } = pagination;
      const result = await StampController.getRecentSales(
        page || DEFAULT_PAGINATION.page,
        limit || DEFAULT_PAGINATION.limit,
      );

      // Check for empty result
      const emptyCheck = checkEmptyResult(result, "recent sales data");
      if (emptyCheck) {
        return emptyCheck;
      }

      // Return with appropriate cache duration for recent sales
      return ResponseUtil.success(result, { routeType: RouteType.DYNAMIC });
    } catch (error) {
      console.error("Error in GET handler:", error);
      return ResponseUtil.internalError(
        error,
        "Error processing recent sales request",
      );
    }
  },
};
