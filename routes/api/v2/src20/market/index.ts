import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { getPaginationParams } from "$lib/utils/data/pagination/paginationUtils.ts";
import { MarketDataRepository } from "$server/database/marketDataRepository.ts";
import { BlockService } from "$server/services/core/blockService.ts";
import { RouteType } from "$server/services/infrastructure/cacheService.ts";
import type { PaginatedResponse } from "$types/pagination.d.ts";
import type { SRC20MarketData } from "$types/marketData.d.ts";

/**
 * GET /api/v2/src20/market
 *
 * Returns paginated SRC-20 market data from the src20_market_data cache table.
 *
 * Query Parameters:
 * - limit: number (default: 50) - Items per page
 * - page: number (default: 1) - Page number
 * - sort: string (default: market_cap_usd) - Sort field (market_cap_usd|volume_24h_btc|price_change_24h_percent)
 * - order: string (default: desc) - Sort order (asc|desc)
 *
 * Returns: PaginatedResponse<SRC20MarketData>
 */
export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const pagination = getPaginationParams(url);

    // Check if pagination validation failed
    if (pagination instanceof Response) {
      return pagination;
    }

    const { limit, page } = pagination;

    // Parse and validate sort parameter
    const sortParam = url.searchParams.get("sort") || "market_cap_usd";
    const validSortFields = [
      "market_cap_usd",
      "volume_24h_btc",
      "price_change_24h_percent",
    ];

    if (!validSortFields.includes(sortParam)) {
      return ApiResponseUtil.badRequest(
        `Invalid sort field. Must be one of: ${validSortFields.join(", ")}`,
      );
    }

    // Parse and validate order parameter
    const orderParam = url.searchParams.get("order")?.toLowerCase() || "desc";
    const validOrders = ["asc", "desc"];

    if (!validOrders.includes(orderParam)) {
      return ApiResponseUtil.badRequest(
        "Invalid order parameter. Must be 'asc' or 'desc'",
      );
    }

    const sortOrder = orderParam.toUpperCase() as "ASC" | "DESC";

    try {
      // Fetch paginated market data and last block in parallel
      const [marketDataResult, lastBlock] = await Promise.all([
        MarketDataRepository.getPaginatedSRC20MarketData({
          limit,
          page,
          sortBy: sortParam,
          sortOrder,
        }),
        BlockService.getLastBlock(),
      ]);

      // Build paginated response matching the existing pattern
      const response: PaginatedResponse<SRC20MarketData> & {
        last_block: number;
      } = {
        data: marketDataResult.data,
        total: marketDataResult.total,
        page: marketDataResult.page,
        limit: marketDataResult.limit,
        totalPages: marketDataResult.totalPages,
        last_block: lastBlock,
      };

      return ApiResponseUtil.success(response, {
        routeType: RouteType.BLOCKCHAIN_DATA,
      });
    } catch (error) {
      console.error("Error fetching SRC-20 market data:", error);
      return ApiResponseUtil.internalError(
        error,
        "Error fetching SRC-20 market data",
      );
    }
  },
};
