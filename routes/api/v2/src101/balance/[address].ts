import { Handlers } from "$fresh/server.ts";
import type { AddressHandlerContext } from "$types/base.d.ts";
import { Src101Controller } from "$server/controller/src101Controller.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { RouteType } from "$server/services/infrastructure/cacheService.ts";
import { getPaginationParams } from "$lib/utils/data/pagination/paginationUtils.ts";
import {
  checkEmptyResult,
  DEFAULT_PAGINATION,
  validateRequiredParams,
  validateSortParam,
} from "$server/services/validation/routeValidationService.ts";

export const handler: Handlers<AddressHandlerContext> = {
  async GET(req, ctx) {
    try {
      const { address } = ctx.params;

      // Validate required parameters
      const paramsValidation = validateRequiredParams({ address });
      if (!paramsValidation.isValid) {
        return paramsValidation.error!;
      }

      const url = new URL(req.url);
      const pagination = getPaginationParams(url);

      // Check if pagination validation failed
      if (pagination instanceof Response) {
        return pagination;
      }

      const { limit, page } = pagination;

      // Validate sort parameter
      const sortValidation = validateSortParam(url);
      if (!sortValidation.isValid) {
        return sortValidation.error!;
      }

      const queryParams = {
        address,
        limit: limit || DEFAULT_PAGINATION.limit,
        page: page || DEFAULT_PAGINATION.page,
        sort: sortValidation.data || "ASC",
      };

      const result = await Src101Controller.handleSrc101BalanceRequest(
        queryParams,
      );

      // Check for empty result
      const emptyCheck = checkEmptyResult(result, "balance data");
      if (emptyCheck) {
        return emptyCheck;
      }

      return ApiResponseUtil.success(result, { routeType: RouteType.BALANCE });
    } catch (error) {
      console.error(
        "Error in [deploy_hash]/address/[address_btc] handler:",
        error,
      );
      return ApiResponseUtil.internalError(
        error,
        "Error processing src101 tokenids request",
      );
    }
  },
};
