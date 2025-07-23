/**
 * @fileoverview Centralized SRC20 Market Data Enrichment Service
 * @description Eliminates code duplication across controller methods by providing
 * a single, standardized interface for market data enrichment that supports
 * both API versioning and performance optimization.
 *
 * @version 1.0.0
 * @author BTCStampsExplorer Team
 */

import type { SRC20Row } from "$globals";
import type { SRC20MarketData } from "$lib/types/marketData.d.ts";
import { MarketDataRepository } from "$server/database/marketDataRepository.ts";

/**
 * Options for controlling market data enrichment behavior
 */
export interface EnrichmentOptions {
  /** Include extended market data fields (7d, 30d metrics) */
  includeExtendedFields?: boolean;

  /** Optimize for bulk operations (use Map-based lookups) */
  bulkOptimized?: boolean;

  /** Enable detailed error logging */
  enableLogging?: boolean;

  /** Cache duration for bulk operations in milliseconds */
  cacheDuration?: number;
}

/**
 * Standardized market data fields structure
 * This eliminates the root-level field duplication by providing
 * a single, nested object format that serves as the source of truth.
 */
export interface MarketDataFields {
  /** Tick symbol for the SRC20 token */
  tick: string;

  /** Floor price in BTC, null if not available */
  floor_price_btc: number | null;

  /** Market capitalization in BTC */
  market_cap_btc: number;

  /** 24-hour trading volume in BTC */
  volume_24h_btc: number;

  /** 24-hour price change percentage */
  price_change_24h_percent: number;

  /** Total holder count */
  holder_count: number;

  /** Data quality score (0-10) */
  data_quality_score: number;

  /** Last update timestamp */
  last_updated: Date;

  /** Extended fields (included when includeExtendedFields=true) */
  volume_7d_btc?: number;
  volume_30d_btc?: number;
  price_change_7d_percent?: number;
  price_change_30d_percent?: number;

  /** Market data source information */
  primary_exchange?: string | null;
  exchange_sources?: string[] | null;

  /** Confidence metrics */
  confidence_level?: number;
}

/**
 * SRC20 item enriched with standardized market data
 * CRITICAL: This interface eliminates root-level market field duplication
 * and standardizes on the nested market_data object as the single source of truth.
 */
export interface EnrichedSRC20Item extends SRC20Row {
  /**
   * Nested market data object - SINGLE SOURCE OF TRUTH (snake_case for API consistency)
   * NO root-level fields like floor_unit_price, market_cap, volume24, change24
   */
  market_data: MarketDataFields | null;
}

/**
 * Bulk enrichment result for performance optimization
 */
export interface BulkEnrichmentResult {
  /** Map of tick symbol to market data for successful lookups */
  marketDataMap: Map<string, MarketDataFields>;

  /** Array of tick symbols that failed to retrieve market data */
  failedTicks: string[];

  /** Performance metrics */
  metrics: {
    totalProcessed: number;
    successful: number;
    failed: number;
    processingTimeMs: number;
  };
}

/**
 * Centralized Market Data Enrichment Service
 *
 * This service eliminates code duplication found in:
 * - handleSrc20BalanceRequest()
 * - fetchTrendingActiveMintingTokensV2()
 * - Other SRC20 endpoints that need market data enrichment
 *
 * By providing a single, standardized interface for market data enrichment
 * with proper error handling, performance optimization, and API versioning support.
 */
export class MarketDataEnrichmentService {

  /**
   * Enrich a single SRC20 item or array of items with market data
   *
   * @param data - Single SRC20Row or array of SRC20Row items
   * @param options - Enrichment options for controlling behavior
   * @returns Enriched item(s) with standardized market_data object
   *
   * @example
   * ```typescript
   * const enriched = await MarketDataEnrichmentService.enrichWithMarketData(
   *   src20Items,
   *   { includeExtendedFields: true, bulkOptimized: true }
   * );
   * ```
   */
  static async enrichWithMarketData<T extends SRC20Row>(
    data: T | T[],
    options: EnrichmentOptions = {}
  ): Promise<(T & EnrichedSRC20Item) | (T & EnrichedSRC20Item)[]> {
    const startTime = performance.now();
    const {
      includeExtendedFields = false,
      bulkOptimized = false,
      enableLogging = false,
      cacheDuration = 300000, // 5 minutes default
    } = options;

    try {
      // Handle single item
      if (!Array.isArray(data)) {
        const enriched = await this.enrichSingleItem(
          data,
          { includeExtendedFields, enableLogging }
        );

        if (enableLogging) {
          const duration = performance.now() - startTime;
          console.log(`[MarketDataEnrichment] Single item enriched in ${duration.toFixed(2)}ms`);
        }

        return enriched;
      }

      // Handle array of items
      if (bulkOptimized && data.length > 3) {
        return await this.enrichBulkOptimized(
          data,
          { includeExtendedFields, enableLogging, cacheDuration }
        );
      } else {
        return await this.enrichSequentially(
          data,
          { includeExtendedFields, enableLogging }
        );
      }

    } catch (error) {
      if (enableLogging) {
        console.error("[MarketDataEnrichment] Error during enrichment:", error);
      }

      // Return data with null market_data on error (graceful degradation)
      if (Array.isArray(data)) {
        return data.map(item => ({
          ...item,
          market_data: null
        }));
      } else {
        return {
          ...data,
          market_data: null
        };
      }
    }
  }

  /**
   * Enrich a single SRC20 item with market data
   * @private
   */
  private static async enrichSingleItem<T extends SRC20Row>(
    item: T,
    options: { includeExtendedFields: boolean; enableLogging: boolean }
  ): Promise<T & EnrichedSRC20Item> {
    try {
      const marketData = await MarketDataRepository.getSRC20MarketData(item.tick);
      const standardizedMarketData = marketData
        ? this.standardizeMarketData(marketData, options.includeExtendedFields)
        : null;

      return {
        ...item,
        market_data: standardizedMarketData
      };
    } catch (error) {
      if (options.enableLogging) {
        console.warn(`[MarketDataEnrichment] Failed to enrich ${item.tick}:`, error);
      }

      return {
        ...item,
        market_data: null
      };
    }
  }

  /**
   * Enrich items sequentially (for small arrays)
   * @private
   */
  private static async enrichSequentially<T extends SRC20Row>(
    items: T[],
    options: { includeExtendedFields: boolean; enableLogging: boolean }
  ): Promise<(T & EnrichedSRC20Item)[]> {
    const promises = items.map(item =>
      this.enrichSingleItem(item, options)
    );

    return await Promise.all(promises);
  }

  /**
   * Bulk-optimized enrichment for large arrays (>3 items)
   * Uses Map-based lookups for better performance
   * @private
   */
  private static async enrichBulkOptimized<T extends SRC20Row>(
    items: T[],
    options: { includeExtendedFields: boolean; enableLogging: boolean; cacheDuration: number }
  ): Promise<(T & EnrichedSRC20Item)[]> {
    const startTime = performance.now();

    // Extract unique tick symbols
    const uniqueTicks = [...new Set(items.map(item => item.tick))];

    // Bulk fetch market data using Map-based approach
    const bulkResult = await this.bulkFetchMarketData(uniqueTicks, options);

    // Enrich all items using the bulk result map
    const enrichedItems = items.map(item => ({
      ...item,
      market_data: bulkResult.marketDataMap.get(item.tick) || null
    }));

    if (options.enableLogging) {
      const duration = performance.now() - startTime;
      console.log(
        `[MarketDataEnrichment] Bulk enriched ${items.length} items ` +
        `(${uniqueTicks.length} unique ticks) in ${duration.toFixed(2)}ms`
      );
      console.log(
        `[MarketDataEnrichment] Success rate: ${bulkResult.metrics.successful}/${bulkResult.metrics.totalProcessed}`
      );
    }

    return enrichedItems;
  }

  /**
   * Bulk fetch market data for multiple tick symbols
   * @private
   */
  private static async bulkFetchMarketData(
    ticks: string[],
    options: { includeExtendedFields: boolean; enableLogging: boolean }
  ): Promise<BulkEnrichmentResult> {
    const startTime = performance.now();
    const marketDataMap = new Map<string, MarketDataFields>();
    const failedTicks: string[] = [];

    // For now, use Promise.allSettled for concurrent fetching
    const promises = ticks.map(async (tick) => {
      try {
        const marketData = await MarketDataRepository.getSRC20MarketData(tick);
        if (marketData) {
          const standardized = this.standardizeMarketData(marketData, options.includeExtendedFields);
          marketDataMap.set(tick, standardized);
          return { tick, success: true };
        } else {
          failedTicks.push(tick);
          return { tick, success: false };
        }
      } catch (error) {
        if (options.enableLogging) {
          console.warn(`[MarketDataEnrichment] Failed to fetch ${tick}:`, error);
        }
        failedTicks.push(tick);
        return { tick, success: false };
      }
    });

    await Promise.allSettled(promises);

    const processingTimeMs = performance.now() - startTime;

    return {
      marketDataMap,
      failedTicks,
      metrics: {
        totalProcessed: ticks.length,
        successful: marketDataMap.size,
        failed: failedTicks.length,
        processingTimeMs
      }
    };
  }

  /**
   * Convert SRC20MarketData from repository to standardized MarketDataFields format
   * This is the field mapping that eliminates root-level duplication
   * @private
   */
  private static standardizeMarketData(
    data: SRC20MarketData,
    includeExtendedFields: boolean
  ): MarketDataFields {
    const standardized: MarketDataFields = {
      tick: data.tick,
      floor_price_btc: data.floorPriceBTC,
      market_cap_btc: data.marketCapBTC,
      volume_24h_btc: data.volume24hBTC,
      price_change_24h_percent: data.priceChange24hPercent,
      holder_count: data.holderCount,
      data_quality_score: data.dataQualityScore,
      last_updated: data.lastUpdated,
      primary_exchange: data.primaryExchange,
      exchange_sources: data.exchangeSources,
    };

    // Include extended fields when requested
    if (includeExtendedFields) {
      standardized.volume_7d_btc = data.volume7dBTC;
      standardized.volume_30d_btc = data.volume30dBTC;
      standardized.price_change_7d_percent = data.priceChange7dPercent;
      standardized.price_change_30d_percent = data.priceChange30dPercent;
    }

    return standardized;
  }

  /**
   * Utility method to extract just the market data for a specific tick
   * Useful for single-tick lookups
   */
  static async getStandardizedMarketData(
    tick: string,
    includeExtendedFields: boolean = false
  ): Promise<MarketDataFields | null> {
    try {
      const data = await MarketDataRepository.getSRC20MarketData(tick);
      return data ? this.standardizeMarketData(data, includeExtendedFields) : null;
    } catch (error) {
      console.error(`[MarketDataEnrichment] Error fetching market data for ${tick}:`, error);
      return null;
    }
  }
}

/**
 * Type guard to check if an item has been enriched with market data
 */
export function hasMarketData<T extends SRC20Row>(
  item: T | (T & EnrichedSRC20Item)
): item is T & EnrichedSRC20Item {
  return 'market_data' in item;
}

/**
 * Utility type for extracting the enriched type
 */
export type EnrichedType<T extends SRC20Row> = T & EnrichedSRC20Item;
