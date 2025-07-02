/**
 * CI-friendly version of MarketDataRepository
 * This version can work without database connections for testing
 */

import type {
  StampMarketData,
  StampMarketDataRow,
  SRC20MarketData,
  SRC20MarketDataRow,
  CollectionMarketData,
  CollectionMarketDataRow,
  StampHolderCache,
  StampHolderCacheRow,
  StampWithMarketData,
  CacheStatus,
} from "$lib/types/marketData.d.ts";
import type { StampRow } from "$globals";
import type { StampFilters } from "$globals";
import {
  parseBTCDecimal,
  parseVolumeSources,
  parseExchangeSources,
  getCacheStatus,
} from "$lib/utils/marketData.ts";

// Interface for the database manager dependency
interface IDbManager {
  executeQueryWithCache<T>(
    query: string,
    params: unknown[],
    cacheDuration: number | "never"
  ): Promise<{ rows: T[] }>;
}

/**
 * Repository for accessing market data from cache tables.
 * CI version that accepts dbManager as a dependency injection
 */
export class MarketDataRepositoryCI {
  constructor(private dbManager: IDbManager) {}

  /**
   * Get market data for a single stamp by CPID
   */
  async getStampMarketData(cpid: string): Promise<StampMarketData | null> {
    const query = `
      SELECT 
        cpid,
        floor_price_btc,
        recent_sale_price_btc,
        open_dispensers_count,
        closed_dispensers_count,
        total_dispensers_count,
        holder_count,
        unique_holder_count,
        top_holder_percentage,
        holder_distribution_score,
        volume_24h_btc,
        volume_7d_btc,
        volume_30d_btc,
        total_volume_btc,
        price_source,
        volume_sources,
        data_quality_score,
        confidence_level,
        last_updated,
        last_price_update,
        update_frequency_minutes,
        TIMESTAMPDIFF(MINUTE, last_updated, UTC_TIMESTAMP()) as cache_age_minutes
      FROM stamp_market_data
      WHERE cpid = ?
      LIMIT 1
    `;

    try {
      const result = await this.dbManager.executeQueryWithCache(
        query,
        [cpid],
        300 // 5 minute cache
      );

      if (!result.rows || result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0] as StampMarketDataRow & { cache_age_minutes: number };
      return this.parseStampMarketDataRow(row);
    } catch (error) {
      console.error(`Error fetching market data for stamp ${cpid}:`, error);
      return null;
    }
  }

  /**
   * Get stamps with their market data using JOIN queries
   */
  async getStampsWithMarketData(options: {
    collectionId?: string;
    offset?: number;
    limit?: number;
    filters?: StampFilters;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<StampWithMarketData[]> {
    const {
      collectionId,
      offset = 0,
      limit = 100,
      filters,
      sortBy = 'block_index',
      sortOrder = 'DESC'
    } = options;

    let query = `
      SELECT 
        st.*,
        cr.creator AS creator_name,
        smd.floor_price_btc,
        smd.recent_sale_price_btc,
        smd.open_dispensers_count,
        smd.closed_dispensers_count,
        smd.total_dispensers_count,
        smd.holder_count,
        smd.unique_holder_count,
        smd.top_holder_percentage,
        smd.holder_distribution_score,
        smd.volume_24h_btc,
        smd.volume_7d_btc,
        smd.volume_30d_btc,
        smd.total_volume_btc,
        smd.price_source,
        smd.volume_sources,
        smd.data_quality_score,
        smd.confidence_level,
        smd.last_updated as market_data_last_updated,
        smd.last_price_update,
        smd.update_frequency_minutes,
        TIMESTAMPDIFF(MINUTE, smd.last_updated, UTC_TIMESTAMP()) as cache_age_minutes
      FROM stamps st
      LEFT JOIN creator cr ON st.creator = cr.address
      LEFT JOIN stamp_market_data smd ON st.cpid = smd.cpid
    `;

    const whereConditions: string[] = [];
    const queryParams: (string | number)[] = [];

    if (collectionId) {
      query += ` JOIN collection_stamps cs ON st.stamp = cs.stamp`;
      whereConditions.push("cs.collection_id = UNHEX(?)");
      queryParams.push(collectionId);
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    query += ` ORDER BY st.${sortBy} ${sortOrder}`;
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    try {
      const result = await this.dbManager.executeQueryWithCache(
        query,
        queryParams,
        300
      );

      if (!result.rows) {
        return [];
      }

      return result.rows.map((row: any) => this.mapStampWithMarketData(row));
    } catch (error) {
      console.error("Error fetching stamps with market data:", error);
      return [];
    }
  }

  /**
   * Get SRC-20 token market data by tick
   */
  async getSRC20MarketData(tick: string): Promise<SRC20MarketData | null> {
    const query = `
      SELECT 
        tick,
        price_btc,
        price_usd,
        floor_price_btc,
        market_cap_btc,
        market_cap_usd,
        volume_24h_btc,
        holder_count,
        circulating_supply,
        price_change_24h_percent,
        primary_exchange,
        exchange_sources,
        data_quality_score,
        last_updated,
        TIMESTAMPDIFF(MINUTE, last_updated, UTC_TIMESTAMP()) as cache_age_minutes
      FROM src20_market_data
      WHERE tick = ?
      LIMIT 1
    `;

    try {
      const result = await this.dbManager.executeQueryWithCache(
        query,
        [tick],
        300
      );

      if (!result.rows || result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0] as SRC20MarketDataRow & { cache_age_minutes: number };
      return this.parseSRC20MarketDataRow(row);
    } catch (error) {
      console.error(`Error fetching market data for SRC-20 token ${tick}:`, error);
      return null;
    }
  }

  /**
   * Get aggregated market data for a collection
   */
  async getCollectionMarketData(collectionId: string): Promise<CollectionMarketData | null> {
    const query = `
      SELECT 
        collection_id,
        min_floor_price_btc,
        max_floor_price_btc,
        avg_floor_price_btc,
        median_floor_price_btc,
        total_volume_24h_btc,
        stamps_with_prices_count,
        min_holder_count,
        max_holder_count,
        avg_holder_count,
        median_holder_count,
        total_unique_holders,
        avg_distribution_score,
        total_stamps_count,
        last_updated,
        TIMESTAMPDIFF(MINUTE, last_updated, UTC_TIMESTAMP()) as cache_age_minutes
      FROM collection_market_data
      WHERE collection_id = ?
      LIMIT 1
    `;

    try {
      const result = await this.dbManager.executeQueryWithCache(
        query,
        [collectionId],
        300
      );

      if (!result.rows || result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0] as CollectionMarketDataRow & { cache_age_minutes: number };
      return this.parseCollectionMarketDataRow(row);
    } catch (error) {
      console.error(`Error fetching market data for collection ${collectionId}:`, error);
      return null;
    }
  }

  /**
   * Get cached holder data for a stamp
   */
  async getStampHoldersFromCache(cpid: string): Promise<StampHolderCache[]> {
    const query = `
      SELECT 
        id,
        cpid,
        address,
        quantity,
        percentage,
        rank_position,
        last_updated
      FROM stamp_holder_cache
      WHERE cpid = ?
      ORDER BY rank_position ASC
    `;

    try {
      const result = await this.dbManager.executeQueryWithCache(
        query,
        [cpid],
        300
      );

      if (!result.rows) {
        return [];
      }

      return result.rows.map((row: StampHolderCacheRow) => ({
        id: row.id,
        cpid: row.cpid,
        address: row.address,
        quantity: parseBTCDecimal(row.quantity) || 0,
        percentage: parseFloat(row.percentage) || 0,
        rankPosition: row.rank_position,
        lastUpdated: new Date(row.last_updated),
      }));
    } catch (error) {
      console.error(`Error fetching holder cache for stamp ${cpid}:`, error);
      return [];
    }
  }

  /**
   * Bulk fetch market data for multiple stamps
   */
  async getBulkStampMarketData(cpids: string[]): Promise<Map<string, StampMarketData>> {
    if (cpids.length === 0) {
      return new Map();
    }

    const placeholders = cpids.map(() => '?').join(',');
    
    const query = `
      SELECT 
        cpid,
        floor_price_btc,
        recent_sale_price_btc,
        open_dispensers_count,
        closed_dispensers_count,
        total_dispensers_count,
        holder_count,
        unique_holder_count,
        top_holder_percentage,
        holder_distribution_score,
        volume_24h_btc,
        volume_7d_btc,
        volume_30d_btc,
        total_volume_btc,
        price_source,
        volume_sources,
        data_quality_score,
        confidence_level,
        last_updated,
        last_price_update,
        update_frequency_minutes,
        TIMESTAMPDIFF(MINUTE, last_updated, UTC_TIMESTAMP()) as cache_age_minutes
      FROM stamp_market_data
      WHERE cpid IN (${placeholders})
    `;

    try {
      const result = await this.dbManager.executeQueryWithCache(
        query,
        cpids,
        300
      );

      const marketDataMap = new Map<string, StampMarketData>();

      if (result.rows) {
        for (const row of result.rows) {
          const marketData = this.parseStampMarketDataRow(row as StampMarketDataRow & { cache_age_minutes: number });
          if (marketData) {
            marketDataMap.set(marketData.cpid, marketData);
          }
        }
      }

      return marketDataMap;
    } catch (error) {
      console.error("Error fetching bulk market data:", error);
      return new Map();
    }
  }

  // Private helper methods
  private parseStampMarketDataRow(row: StampMarketDataRow & { cache_age_minutes?: number }): StampMarketData | null {
    try {
      return {
        cpid: row.cpid,
        floorPriceBTC: parseBTCDecimal(row.floor_price_btc),
        recentSalePriceBTC: parseBTCDecimal(row.recent_sale_price_btc),
        openDispensersCount: row.open_dispensers_count || 0,
        closedDispensersCount: row.closed_dispensers_count || 0,
        totalDispensersCount: row.total_dispensers_count || 0,
        holderCount: row.holder_count || 0,
        uniqueHolderCount: row.unique_holder_count || 0,
        topHolderPercentage: parseFloat(row.top_holder_percentage) || 0,
        holderDistributionScore: parseFloat(row.holder_distribution_score) || 0,
        volume24hBTC: parseBTCDecimal(row.volume_24h_btc) || 0,
        volume7dBTC: parseBTCDecimal(row.volume_7d_btc) || 0,
        volume30dBTC: parseBTCDecimal(row.volume_30d_btc) || 0,
        totalVolumeBTC: parseBTCDecimal(row.total_volume_btc) || 0,
        priceSource: row.price_source,
        volumeSources: parseVolumeSources(row.volume_sources),
        dataQualityScore: parseFloat(row.data_quality_score) || 0,
        confidenceLevel: parseFloat(row.confidence_level) || 0,
        lastUpdated: new Date(row.last_updated),
        lastPriceUpdate: row.last_price_update ? new Date(row.last_price_update) : null,
        updateFrequencyMinutes: row.update_frequency_minutes || 60,
      };
    } catch (error) {
      console.error("Error parsing stamp market data row:", error);
      return null;
    }
  }

  private parseSRC20MarketDataRow(row: SRC20MarketDataRow & { cache_age_minutes?: number }): SRC20MarketData | null {
    try {
      return {
        tick: row.tick,
        priceBTC: parseBTCDecimal(row.price_btc),
        priceUSD: parseBTCDecimal(row.price_usd),
        floorPriceBTC: parseBTCDecimal(row.floor_price_btc),
        marketCapBTC: parseBTCDecimal(row.market_cap_btc) || 0,
        marketCapUSD: parseBTCDecimal(row.market_cap_usd) || 0,
        volume24hBTC: parseBTCDecimal(row.volume_24h_btc) || 0,
        holderCount: row.holder_count || 0,
        circulatingSupply: row.circulating_supply || "0",
        priceChange24hPercent: parseFloat(row.price_change_24h_percent) || 0,
        primaryExchange: row.primary_exchange,
        exchangeSources: parseExchangeSources(row.exchange_sources),
        dataQualityScore: parseFloat(row.data_quality_score) || 0,
        lastUpdated: new Date(row.last_updated),
      };
    } catch (error) {
      console.error("Error parsing SRC20 market data row:", error);
      return null;
    }
  }

  private parseCollectionMarketDataRow(row: CollectionMarketDataRow & { cache_age_minutes?: number }): CollectionMarketData | null {
    try {
      return {
        collectionId: row.collection_id,
        minFloorPriceBTC: parseBTCDecimal(row.min_floor_price_btc),
        maxFloorPriceBTC: parseBTCDecimal(row.max_floor_price_btc),
        avgFloorPriceBTC: parseBTCDecimal(row.avg_floor_price_btc),
        medianFloorPriceBTC: parseBTCDecimal(row.median_floor_price_btc),
        totalVolume24hBTC: parseBTCDecimal(row.total_volume_24h_btc) || 0,
        stampsWithPricesCount: row.stamps_with_prices_count || 0,
        minHolderCount: row.min_holder_count || 0,
        maxHolderCount: row.max_holder_count || 0,
        avgHolderCount: parseFloat(row.avg_holder_count) || 0,
        medianHolderCount: row.median_holder_count || 0,
        totalUniqueHolders: row.total_unique_holders || 0,
        avgDistributionScore: parseFloat(row.avg_distribution_score) || 0,
        totalStampsCount: row.total_stamps_count || 0,
        lastUpdated: new Date(row.last_updated),
      };
    } catch (error) {
      console.error("Error parsing collection market data row:", error);
      return null;
    }
  }

  private mapStampWithMarketData(row: any): StampWithMarketData {
    const stamp: StampRow = {
      stamp: row.stamp,
      block_index: row.block_index,
      cpid: row.cpid,
      creator: row.creator,
      creator_name: row.creator_name,
      divisible: row.divisible,
      keyburn: row.keyburn,
      locked: row.locked,
      stamp_url: row.stamp_url,
      stamp_mimetype: row.stamp_mimetype,
      supply: row.supply,
      block_time: row.block_time,
      tx_hash: row.tx_hash,
      tx_index: row.tx_index,
      ident: row.ident,
      stamp_hash: row.stamp_hash,
      file_hash: row.file_hash,
      stamp_base64: row.stamp_base64,
      asset_longname: row.asset_longname,
      message_index: row.message_index,
      src_data: row.src_data,
      is_btc_stamp: row.is_btc_stamp,
      is_reissue: row.is_reissue,
      is_valid_base64: row.is_valid_base64,
    };

    let marketData: StampMarketData | null = null;
    let cacheStatus: CacheStatus | undefined;
    let cacheAgeMinutes: number | undefined;

    if (row.market_data_last_updated) {
      marketData = {
        cpid: row.cpid,
        floorPriceBTC: parseBTCDecimal(row.floor_price_btc),
        recentSalePriceBTC: parseBTCDecimal(row.recent_sale_price_btc),
        openDispensersCount: row.open_dispensers_count || 0,
        closedDispensersCount: row.closed_dispensers_count || 0,
        totalDispensersCount: row.total_dispensers_count || 0,
        holderCount: row.holder_count || 0,
        uniqueHolderCount: row.unique_holder_count || 0,
        topHolderPercentage: parseFloat(row.top_holder_percentage) || 0,
        holderDistributionScore: parseFloat(row.holder_distribution_score) || 0,
        volume24hBTC: parseBTCDecimal(row.volume_24h_btc) || 0,
        volume7dBTC: parseBTCDecimal(row.volume_7d_btc) || 0,
        volume30dBTC: parseBTCDecimal(row.volume_30d_btc) || 0,
        totalVolumeBTC: parseBTCDecimal(row.total_volume_btc) || 0,
        priceSource: row.price_source,
        volumeSources: parseVolumeSources(row.volume_sources),
        dataQualityScore: parseFloat(row.data_quality_score) || 0,
        confidenceLevel: parseFloat(row.confidence_level) || 0,
        lastUpdated: new Date(row.market_data_last_updated),
        lastPriceUpdate: row.last_price_update ? new Date(row.last_price_update) : null,
        updateFrequencyMinutes: row.update_frequency_minutes || 60,
      };

      cacheAgeMinutes = row.cache_age_minutes;
      cacheStatus = getCacheStatus(cacheAgeMinutes);
    }

    const stampWithMarketData: StampWithMarketData = {
      ...stamp,
      marketData,
      cacheStatus,
      cacheAgeMinutes,
    };

    if (!marketData) {
      stampWithMarketData.marketDataMessage = "No market data available for this stamp";
    }

    return stampWithMarketData;
  }
}