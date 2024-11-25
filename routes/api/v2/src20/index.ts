import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { SRC20TrxRequestParams } from "globals";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import {
  DEFAULT_PAGINATION,
  validateSortParam,
} from "$server/services/routeValidationService.ts";

export const handler: Handlers = {
  async GET(req) {
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

    const params: SRC20TrxRequestParams = {
      op: url.searchParams.get("op") ?? undefined,
      sortBy: sortValidation.data,
      page: page || DEFAULT_PAGINATION.page,
      limit: limit || DEFAULT_PAGINATION.limit,
    };

    try {
      const result = await Src20Controller.handleSrc20TransactionsRequest(
        req,
        params,
      );
      return ResponseUtil.success(result);
    } catch (error) {
      return ResponseUtil.internalError(error, "Error processing request");
    }
  },
};
