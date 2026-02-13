import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { RouteType } from "$server/services/infrastructure/cacheService.ts";
import type { SRC20MarketDataRow } from "$types/marketData.d.ts";
import { DEFAULT_CACHE_DURATION } from "$constants";

/**
 * GET /api/v2/src20/market/[tick]
 *
 * Returns market data for a specific SRC-20 token from the src20_market_data cache table.
 * Uses case-insensitive tick matching to find the token.
 *
 * Path Parameters:
 * - tick: string - The SRC-20 token tick symbol (case-insensitive)
 *
 * Returns: SRC20MarketDataRow object with all market data fields
 * - 200: Market data found and returned
 * - 404: Token not found in market data cache
 * - 500: Internal server error
 *
 * Note: Returns raw database row to preserve NULL vs 0 distinction for volume fields
 */
export const handler: Handlers = {
  async GET(_req, ctx) {
    try {
      const { tick } = ctx.params;

      // Decode the tick parameter to handle URL encoding
      const decodedTick = decodeURIComponent(String(tick));

      if (!decodedTick || decodedTick.trim() === "") {
        return ApiResponseUtil.badRequest("Tick parameter is required");
      }

      // Query the database with case-insensitive matching
      const query = `
        SELECT
          tick,
          price_btc,
          price_usd,
          floor_price_btc,
          market_cap_btc,
          market_cap_usd,
          volume_24h_btc,
          volume_7d_btc,
          volume_30d_btc,
          total_volume_btc,
          holder_count,
          circulating_supply,
          price_change_24h_percent,
          price_change_7d_percent,
          price_change_30d_percent,
          primary_exchange,
          exchange_sources,
          data_quality_score,
          last_updated
        FROM src20_market_data
        WHERE LOWER(tick) = LOWER(?)
        LIMIT 1
      `;

      const result = await dbManager.executeQueryWithCache(
        query,
        [decodedTick],
        DEFAULT_CACHE_DURATION,
      ) as { rows?: SRC20MarketDataRow[] };

      // Check if token was found
      if (!result.rows || result.rows.length === 0) {
        return ApiResponseUtil.notFound(
          `Market data not found for SRC-20 token: ${decodedTick}`,
        );
      }

      const marketData = result.rows[0];

      // Return the complete market data row
      // Note: We return the raw row to preserve NULL vs 0 distinction for volume fields
      return ApiResponseUtil.success(marketData, {
        routeType: RouteType.BLOCKCHAIN_DATA,
      });
    } catch (error) {
      console.error("Error fetching SRC-20 market data by tick:", error);
      return ApiResponseUtil.internalError(
        error,
        "Error fetching SRC-20 market data",
      );
    }
  },
};
