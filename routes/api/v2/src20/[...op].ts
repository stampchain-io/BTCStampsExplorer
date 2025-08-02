import type { SUBPROTOCOLS } from "$types/base.d.ts";
import type {
  ColumnDefinition,
  FeeAlert,
  InputData,
  MockResponse,
  NamespaceImport,
  ProtocolComplianceLevel,
  ToolEstimationParams,
  XcpBalance,
} from "$types/toolEndpointAdapter.ts";
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
    const { op } = ctx.params;
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

    try {
      const result = await SRC20Service.QueryService.fetchAndFormatSrc20Data({
        op: op.toUpperCase(),
        ...(sortValidation.data && { sortBy: sortValidation.data }),
        page: page || DEFAULT_PAGINATION.page,
        limit: limit || DEFAULT_PAGINATION.limit,
      });
      return ApiResponseUtil.success(result);
    } catch (error) {
      return ApiResponseUtil.internalError(error, "Error processing request");
    }
  },
};
