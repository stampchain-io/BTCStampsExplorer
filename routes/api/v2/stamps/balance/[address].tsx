import { Handlers } from "$fresh/server.ts";
import { AddressHandlerContext } from "$globals";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { StampController } from "$server/controller/stampController.ts";
import { RouteType } from "$server/services/cacheService.ts";
import {
  DEFAULT_PAGINATION,
  validateRequiredParams,
} from "$server/services/routeValidationService.ts";

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

      if (enhanced) {
        // 🚀 ENHANCED BALANCE RESPONSE with market data consolidation
        console.log(`[StampBalance] Enhanced mode for ${address}`);

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
            // Create marketData nested object for v2.3
            const marketData = {
              floorPriceBTC: stamp.floorPrice || null,
              recentSalePriceBTC: stamp.recentSalePrice || null,
              lastPriceBTC: stamp.floorPrice || stamp.recentSalePrice || 0,
              walletValueBTC: (stamp.balance || 0) *
                (stamp.floorPrice || stamp.recentSalePrice || 0),
              openDispensersCount: stamp.openDispensersCount || 0,
              holderCount: stamp.holderCount || 0,
              volume24hBTC: stamp.volume24h || 0,
              volume7dBTC: stamp.volume7d || 0,
              volume30dBTC: stamp.volume30d || 0,
              lastUpdated: new Date().toISOString(),
              dataQualityScore: stamp.dataQualityScore || 7,
            };

            // Return v2.3 format - let middleware strip for v2.2
            return {
              ...stamp,
              marketData, // v2.3 nested object
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
