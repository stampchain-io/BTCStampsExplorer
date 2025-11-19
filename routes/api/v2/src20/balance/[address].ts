import { Handlers } from "$fresh/server.ts";
import type { AddressHandlerContext } from "$types/base.d.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { getPaginationParams } from "$lib/utils/data/pagination/paginationUtils.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { RouteType } from "$server/services/infrastructure/cacheService.ts";
import { validateSortDirection } from "$server/services/validation/validationService.ts";

export const handler: Handlers<AddressHandlerContext> = {
  async GET(req, ctx) {
    try {
      const { address } = ctx.params;
      const url = new URL(req.url);
      const params = url.searchParams;
      const pagination = getPaginationParams(url);

      // Check if pagination validation failed
      if (pagination instanceof Response) {
        return pagination;
      }

      const { limit, page } = pagination;

      // Validate sort parameter
      const sortParam = params.get("sort");
      const sortValidation = validateSortDirection(sortParam);
      if (sortValidation instanceof Response) {
        return sortValidation;
      }

      const balanceParams = {
        address,
        limit: limit || 50,
        page: page || 1,
        amt: Number(params.get("amt")) || 0,
        sortBy: sortValidation,
        includePagination: params.get("includePagination") !== "false",
        // 🚀 Include market data by default for v2.3 API versioning
        // The API middleware will strip it for v2.2 automatically
        includeMarketData: params.get("includeMarketData") !== "false", // Default to true
      };

      const result = await Src20Controller.handleSrc20BalanceRequest(
        balanceParams,
      );
      return ApiResponseUtil.success(result, { routeType: RouteType.BALANCE });
    } catch (error) {
      console.error("Error in balance handler:", error);
      return ApiResponseUtil.internalError(
        error,
        "Error processing balance request",
      );
    }
  },
};
