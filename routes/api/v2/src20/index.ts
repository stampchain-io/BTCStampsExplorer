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
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { getPaginationParams } from "$lib/utils/data/pagination/paginationUtils.ts";
import {
  DEFAULT_PAGINATION,
  validateSRC20SortParam,
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
    const op = url.searchParams.get("op");

    // Validate sort parameter with operation-specific restrictions
    const sortValidation = validateSRC20SortParam(
      url,
      op || undefined,
      "sortBy",
    );
    if (!sortValidation.isValid) {
      return sortValidation.error!;
    }

    const tick = url.searchParams.get("tick");

    // 🚀 V2.3 PARAMETERS - World-class API design
    // Simplified minting status filter: "all" (default), "minting", or "minted"
    const mintingStatusParam = url.searchParams.get("mintingStatus") || "all";
    const mintingStatus =
      ["all", "minting", "minted"].includes(mintingStatusParam)
        ? mintingStatusParam as "all" | "minting" | "minted"
        : "all";
    const trendingWindow = url.searchParams.get("trendingWindow") as
      | "24h"
      | "7d"
      | "30d"
      | null;
    const includeProgress = url.searchParams.get("includeProgress") === "true";
    const includeMarketData =
      url.searchParams.get("includeMarketData") === "true";
    const mintVelocityMinStr = url.searchParams.get("mintVelocityMin");
    const mintVelocityMin = mintVelocityMinStr
      ? parseFloat(mintVelocityMinStr)
      : undefined;

    // Validate mintingStatus parameter
    if (
      mintingStatus && !["all", "minting", "minted"].includes(mintingStatus)
    ) {
      return ApiResponseUtil.badRequest(
        "Invalid mintingStatus parameter. Must be one of: all, minting, minted",
      );
    }

    // Validate trendingWindow parameter
    if (trendingWindow && !["24h", "7d", "30d"].includes(trendingWindow)) {
      return ApiResponseUtil.badRequest(
        "Invalid trendingWindow parameter. Must be one of: 24h, 7d, 30d",
      );
    }

    const params: SRC20TrxRequestParams = {
      ...(op && { op }),
      ...(tick && { tick }),
      ...(sortValidation.data && { sortBy: sortValidation.data }),
      page: page || DEFAULT_PAGINATION.page,
      limit: limit || DEFAULT_PAGINATION.limit,
      // 🚀 V2.3 PARAMETERS
      ...(mintingStatus !== "all" && { mintingStatus }),
      ...(trendingWindow && { trendingWindow }),
      ...(includeProgress && { includeProgress }),
      ...(mintVelocityMin !== undefined && { mintVelocityMin }),
    };

    try {
      // Use the enhanced V2 service method with world-class feature support
      const result = await SRC20Service.QueryService.fetchAndFormatSrc20DataV2(
        params,
        {
          // 🎯 Smart filtering based on API parameters
          excludeFullyMinted: mintingStatus === "minting",
          onlyFullyMinted: mintingStatus === "minted",
          // 🎯 Rich data inclusion for developers
          includeMarketData: includeMarketData || params.op === "DEPLOY" ||
            includeProgress,
          enrichWithProgress: includeProgress || params.op === "DEPLOY", // Always include for DEPLOY ops
        },
      );
      return ApiResponseUtil.success(result, {
        routeType: RouteType.BLOCKCHAIN_DATA,
      });
    } catch (error) {
      return ApiResponseUtil.internalError(error, "Error processing request");
    }
  },
};
