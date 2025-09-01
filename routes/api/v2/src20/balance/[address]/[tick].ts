import type { AddressTickHandlerContext } from "$types/base.d.ts";
import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { RouteType } from "$server/services/infrastructure/cacheService.ts";
import { validateRequiredParams } from "$server/services/validation/routeValidationService.ts";

export const handler: Handlers<AddressTickHandlerContext> = {
  async GET(req, ctx) {
    try {
      const { address, tick } = ctx.params;

      // Validate required parameters
      const paramsValidation = validateRequiredParams({ address, tick });
      if (!paramsValidation.isValid) {
        return paramsValidation.error!;
      }

      const url = new URL(req.url);
      const params = url.searchParams;

      // This endpoint returns a single balance object, never paginated
      const balanceParams = {
        address,
        tick,
        includePagination: false, // Single balance endpoint - no pagination
        amt: Number(params.get("amt")) || 0,
        includeMarketData: params.get("includeMarketData") === "true", // NEW: API v2.3 enhancement
      };

      const result = await Src20Controller.handleSrc20BalanceRequest(
        balanceParams,
      );

      return ApiResponseUtil.success(result, { routeType: RouteType.BALANCE });
    } catch (error) {
      console.error("Error in GET handler:", error);
      return ApiResponseUtil.internalError(
        error,
        "Error processing balance request",
      );
    }
  },
};
