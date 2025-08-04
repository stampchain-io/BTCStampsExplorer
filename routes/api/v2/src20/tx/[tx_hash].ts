import type { SRC20TrxRequestParams } from "$types/api.d.ts";
import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { getPaginationParams } from "$lib/utils/data/pagination/paginationUtils.ts";
import {
  DEFAULT_PAGINATION,
  validateSortParam,
} from "$server/services/validation/routeValidationService.ts";
import { SRC20Service } from "$server/services/src20/index.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const { tx_hash } = ctx.params;
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

    const singleResult = url.searchParams.get("singleResult");
    const tick = url.searchParams.get("tick");
    const op = url.searchParams.get("op");
    const block_index = url.searchParams.get("block_index");

    const params: SRC20TrxRequestParams = {
      tx_hash,
      ...(op && { op }),
      ...(tick && { tick }),
      ...(block_index && { block_index: Number(block_index) }),
      singleResult: true, // Always return single result for transaction endpoint
      ...(sortValidation.data && { sortBy: sortValidation.data }),
      page: page || DEFAULT_PAGINATION.page,
      limit: limit || DEFAULT_PAGINATION.limit,
    };

    try {
      const result = await SRC20Service.QueryService.fetchAndFormatSrc20Data(
        params,
      );
      return ApiResponseUtil.success(result);
    } catch (error) {
      return ApiResponseUtil.internalError(error, "Error processing request");
    }
  },
};
