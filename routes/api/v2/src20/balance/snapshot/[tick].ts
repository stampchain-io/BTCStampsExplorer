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
      const { tick } = ctx.params;

      // Validate required parameters
      const paramsValidation = validateRequiredParams({ tick });
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

      const snapshotParams = {
        tick: String(tick),
        limit: limit || DEFAULT_PAGINATION.limit,
        page: page || DEFAULT_PAGINATION.page,
        amt: Number(url.searchParams.get("amt")) || 0,
        sortBy: sortValidation.data,
      };

      const result = await Src20Controller.handleSrc20SnapshotRequest(
        snapshotParams,
      );

      // Check for empty result
      const emptyCheck = checkEmptyResult(result, "snapshot data");
      if (emptyCheck) {
        return emptyCheck;
      }

      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error in GET handler:", error);
      return ResponseUtil.internalError(
        error,
        "Error processing SRC20 snapshot request",
      );
    }
  },
};
