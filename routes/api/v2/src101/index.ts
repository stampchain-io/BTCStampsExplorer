import { Handlers } from "$fresh/server.ts";
import { Src101Controller } from "$server/controller/src101Controller.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import {
  checkEmptyResult,
  DEFAULT_PAGINATION,
} from "$server/services/routeValidationService.ts";

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

      const queryParams = {
        limit: limit || DEFAULT_PAGINATION.limit,
        page: page || DEFAULT_PAGINATION.page,
      };

      const result = await Src101Controller.handleValidSrc101TxRequest(
        queryParams,
      );

      // Check for empty result
      const emptyCheck = checkEmptyResult(result, "transaction data");
      if (emptyCheck) {
        return emptyCheck;
      }

      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error in index handler:", error);
      return ResponseUtil.internalError(
        error,
        "Error processing src101 valid tx request",
      );
    }
  },
};
