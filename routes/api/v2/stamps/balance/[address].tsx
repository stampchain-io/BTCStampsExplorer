import { Handlers } from "$fresh/server.ts";
import { AddressHandlerContext } from "$globals";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { StampController } from "$server/controller/stampController.ts";
import { RouteType } from "$server/services/infrastructure/cacheService.ts";
import {
  DEFAULT_PAGINATION,
  validateRequiredParams,
} from "$server/services/validation/routeValidationService.ts";

export const handler: Handlers<AddressHandlerContext> = {
  async GET(req: Request, ctx) {
    try {
      const { address } = ctx.params;

      // Validate required parameters
      const paramsValidation = validateRequiredParams({ address });
      if (!paramsValidation.isValid) {
        return paramsValidation.error!;
      }

      // Get query parameters
      const url = new URL(req.url);
      const pagination = getPaginationParams(url);

      // Check if pagination validation failed
      if (pagination instanceof Response) {
        return pagination;
      }

      const { page, limit } = pagination;
      const enhanced = url.searchParams.get("enhanced") === "true";
      const sortBy = url.searchParams.get("sortBy") || "DESC";

      console.log(
        `[StampBalance] Processing request for ${address}, enhanced: ${enhanced}`,
      );

      let body;

      // 🚀 ALWAYS include market data for v2.3 API versioning
      // Enhanced flag is now for additional features, not basic market data
      const includeMarketData = true; // Always true for proper API versioning

      if (enhanced || includeMarketData) {
        // 🚀 ENHANCED BALANCE RESPONSE with market data consolidation
        console.log(`[StampBalance] Enhanced/MarketData mode for ${address}`);

        // Use regular method and enhance the response
        body = await StampController.getStampBalancesByAddress(
          address,
          limit || DEFAULT_PAGINATION.limit,
          page || DEFAULT_PAGINATION.page,
          sortBy as "ASC" | "DESC",
        );

        // 🚀 MARKET DATA CONSOLIDATION: Always transform to v2.3 format
        // Let middleware strip fields for v2.2 if needed
        if (body.data && Array.isArray(body.data)) {
          body.data = body.data.map((stamp: any) => {
            // Create market_data nested object for v2.3
            const market_data = {
              floor_price_btc: stamp.floorPrice || null,
              recent_sale_price_btc: stamp.recentSalePrice || null,
              last_price_btc: stamp.floorPrice || stamp.recentSalePrice || 0,
              wallet_value_btc: (stamp.balance || 0) *
                (stamp.floorPrice || stamp.recentSalePrice || 0),
              open_dispensers_count: stamp.openDispensersCount || 0,
              holder_count: stamp.holderCount || 0,
              volume_24h_btc: stamp.volume24h || 0,
              volume_7d_btc: stamp.volume7d || 0,
              volume_30d_btc: stamp.volume30d || 0,
              last_updated: new Date().toISOString(),
              data_quality_score: stamp.dataQualityScore || 7,
            };

            // Return v2.3 format - let middleware strip for v2.2
            return {
              ...stamp,
              market_data, // v2.3 nested object (consistent snake_case)
              // Remove root-level price fields that were temporary
              floorPrice: undefined,
              floorPriceUSD: undefined,
              marketCapUSD: undefined,
              recentSalePrice: undefined,
            };
          }).map((stamp) => {
            // v2.3: Stamps already have clean structure with no root-level market fields
            return stamp;
          });
        }
      } else {
        // Standard response
        body = await StampController.getStampBalancesByAddress(
          address,
          limit || DEFAULT_PAGINATION.limit,
          page || DEFAULT_PAGINATION.page,
          sortBy as "ASC" | "DESC",
        );
      }

      return ApiResponseUtil.success(
        body,
        {
          routeType: RouteType.BALANCE,
        },
      );
    } catch (error) {
      console.error("[StampBalance] Error:", error);
      return ApiResponseUtil.internalError(
        error,
        "Failed to fetch stamp balances",
      );
    }
  },
};
