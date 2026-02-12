import type {MarketListingAggregated} from "$lib/types/marketData.d.ts";
import { MarketDataRepository } from "$server/database/marketDataRepository.ts";

/**
 * SRC20MarketService - Database-sourced market data service
 *
 * NOTE: This service previously called external APIs (StampScan, OpenStamp).
 * As of the migration, production code uses MarketDataEnrichmentService which
 * queries the src20_market_data table directly via MarketDataRepository.
 *
 * This method is maintained for backward compatibility with legacy consumers.
 */
export class SRC20MarketService {
  /**
   * Fetch market listing summary from database
   * Replaces external API calls to StampScan and OpenStamp
   *
   * @returns Array of market listing data with both v2.3 standardized and legacy field names
   */
  static async fetchMarketListingSummary(): Promise<MarketListingAggregated[]> {
    try {
      // Query market data from database
      const marketData = await MarketDataRepository.getAllSRC20MarketData();

      // Map DB fields to MarketListingAggregated interface
      // Preserving BOTH v2.3 standardized fields AND legacy deprecated field names
      return marketData.map((data) => {
        // Handle null values correctly - preserve NULL vs 0 distinction
        const floorPrice = data.floorPriceBTC !== null && data.floorPriceBTC !== undefined
          ? data.floorPriceBTC
          : (data.floorPriceBTC === 0 ? 0 : null);

        return {
          tick: data.tick,

          // ✅ v2.3 STANDARDIZED FIELDS
          floor_price_btc: floorPrice,
          market_cap_btc: data.marketCapBTC ?? 0,
          volume_24h_btc: data.volume24hBTC ?? 0,
          volume_7d_btc: data.volume7dBTC ?? 0,
          change_24h_percent: data.priceChange24hPercent,

          // 🔄 BACKWARD COMPATIBILITY: Legacy field names (populate for existing components)
          floor_unit_price: floorPrice,
          mcap: data.marketCapBTC ?? 0,
          volume24: data.volume24hBTC ?? 0,
          sum_1d: data.volume24hBTC ?? 0, // Alias for volume_24h_btc
          sum_7d: data.volume7dBTC ?? 0, // Alias for volume_7d_btc
          change24: data.priceChange24hPercent,
          change_24h: data.priceChange24hPercent,

          // Metadata fields
          stamp_url: null, // Not available in DB
          tx_hash: "", // Not available in DB
          holder_count: data.holderCount ?? 0,

          // Market data source breakdown (not available from DB - set to empty)
          market_data: {
            stampscan: {
              price: 0,
              volume_24h_btc: 0,
            },
            openstamp: {
              price: 0,
              volume_24h_btc: 0,
            },
          },
        };
      });
    } catch (error) {
      console.error("[SRC20MarketService] Error fetching market data from database:", error);
      // Return empty array on error to maintain backward compatibility
      return [];
    }
  }
}
