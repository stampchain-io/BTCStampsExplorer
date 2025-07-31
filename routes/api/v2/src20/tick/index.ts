import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { getPaginationParams } from "$lib/utils/data/pagination/paginationUtils.ts";
import {
  DEFAULT_PAGINATION,
  validateSortParam,
} from "$server/services/validation/routeValidationService.ts";
import { SRC20Service } from "$server/services/src20/index.ts";
import { RouteType } from "$server/services/infrastructure/cacheService.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const pagination = getPaginationParams(url);

    // Check if pagination validation failed
    if (pagination instanceof Response) {
      return pagination;
    }

    const { limit, page } = pagination;

    // Validate sort parameter - API expects 'sort_order' parameter
    const sortValidation = validateSortParam(url, "sort_order");
    if (!sortValidation.isValid) {
      return sortValidation.error!;
    }

    const tick = url.searchParams.get("tick");
    const params: SRC20TrxRequestParams = {
      ...(tick && { tick }),
      ...(sortValidation.data && { sortBy: sortValidation.data }),
      page: page || DEFAULT_PAGINATION.page,
      limit: limit || DEFAULT_PAGINATION.limit,
    };

    try {
      const result = await SRC20Service.QueryService.fetchAndFormatSrc20Data(
        params,
      );
      return ApiResponseUtil.success(result, {
        routeType: RouteType.BLOCKCHAIN_DATA,
      });
    } catch (error) {
      return ApiResponseUtil.internalError(error, "Error processing request");
    }
  },
};
