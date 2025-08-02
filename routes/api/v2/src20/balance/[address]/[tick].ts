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
import type {
  AddressTickHandlerContext,
  BlockHandlerContext,
  IdentHandlerContext,
  TickHandlerContext,
} from "$types/base.d.ts";
import type {
  PaginatedIdResponseBody,
  PaginatedTickResponseBody,
  SRC20TrxRequestParams,
} from "$types/api.d.ts";
import { Handlers } from "$fresh/server.ts";
import { getPaginationParams } from "$lib/utils/data/pagination/paginationUtils.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { RouteType } from "$server/services/infrastructure/cacheService.ts";
import {
  DEFAULT_PAGINATION,
  validateRequiredParams,
} from "$server/services/validation/routeValidationService.ts";
import { validateSortDirection } from "$server/services/validation/validationService.ts";

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
