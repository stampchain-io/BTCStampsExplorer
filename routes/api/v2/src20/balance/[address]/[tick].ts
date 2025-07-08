import { Handlers } from "$fresh/server.ts";
import { AddressTickHandlerContext } from "$globals";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import {
  DEFAULT_PAGINATION,
  validateRequiredParams,
} from "$server/services/routeValidationService.ts";
import { RouteType } from "$server/services/cacheService.ts";
import { validateSortDirection } from "$server/services/validationService.ts";

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
      const paginationParams = getPaginationParams(url);

      // Check if pagination validation failed
      if (paginationParams instanceof Response) {
        return paginationParams;
      }

      // Validate sort parameter
      const sortParam = params.get("sort");
      const sortValidation = validateSortDirection(sortParam);
      if (sortValidation instanceof Response) {
        return sortValidation;
      }

      const balanceParams = {
        address,
        tick,
        includePagination: params.get("includePagination") !== "false",
        limit: paginationParams.limit || DEFAULT_PAGINATION.limit,
        page: paginationParams.page || DEFAULT_PAGINATION.page,
        amt: Number(params.get("amt")) || 0,
        sortBy: sortValidation,
      };

      const result = await Src20Controller.handleSrc20BalanceRequest(
        balanceParams,
      );

      return ResponseUtil.success(result, { routeType: RouteType.BALANCE });
    } catch (error) {
      console.error("Error in GET handler:", error);
      return ResponseUtil.internalError(
        error,
        "Error processing balance request",
      );
    }
  },
};
