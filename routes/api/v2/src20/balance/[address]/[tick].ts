import { Handlers } from "$fresh/server.ts";
import { AddressTickHandlerContext } from "$globals";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import {
  checkEmptyResult,
  DEFAULT_PAGINATION,
  validateRequiredParams,
  validateSortParam,
} from "$server/services/routeValidationService.ts";

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
      const includePagination = params.get("includePagination") === "true";

      // Get pagination parameters if pagination is included
      let paginationParams: { limit?: number; page?: number } = {};
      if (includePagination) {
        const pagination = getPaginationParams(url);

        // Check if pagination validation failed
        if (pagination instanceof Response) {
          return pagination;
        }

        const { limit, page } = pagination;
        paginationParams = { limit, page };
      }

      // Validate sort parameter
      const sortValidation = validateSortParam(url);
      if (!sortValidation.isValid) {
        return sortValidation.error!;
      }

      const balanceParams = {
        address,
        tick: decodeURIComponent(String(tick)),
        includePagination,
        limit: paginationParams.limit || DEFAULT_PAGINATION.limit,
        page: paginationParams.page || DEFAULT_PAGINATION.page,
        amt: Number(params.get("amt")) || undefined,
        sortBy: sortValidation.data,
      };

      const result = await Src20Controller.handleSrc20BalanceRequest(
        balanceParams,
      );

      // Check for empty result
      const emptyCheck = checkEmptyResult(result, "balance data");
      if (emptyCheck) {
        return emptyCheck;
      }

      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error in GET handler:", error);
      return ResponseUtil.internalError(
        error,
        "Error processing SRC20 balance request",
      );
    }
  },
};
