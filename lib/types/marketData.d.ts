import type { SRC20Row, StampRow } from "$globals";
import type { CollectionRow } from "../../server/types/collection.d.ts";

export interface MarketListingSummary {
  tick: string;
  floor_unit_price: number;
  mcap: number;
  sum_7d: number | null;
  sum_3d: number | null;
  sum_1d: number | null;
  stamp_url: string | null;
  tx_hash: string;
  holder_count: number;
}

export interface OpenStampMarketData {
  tokenId: number;
  name: string; // emoji tick
  totalSupply: number;
  holdersCount: number;
  price: string; // in satoshis
  amount24: string;
  volume24: string; // in satoshis
  volume24Change: string;
  change24: string;
  change7d: string;
}

export interface StampScanMarketData {
  tick: string; // emoji tick
  floor_unit_price: number; // in btc
  mcap: number; // in btc
  sum_7d: number | null; // in btc
  sum_3d: number | null; // in btc
  sum_1d: number | null; // in btc
  stamp_url: string | null;
  tx_hash: string;
  holder_count: number;
}

export interface MarketListingAggregated {
  tick: string;
  floor_unit_price: number; // lower of stampscan floor_unit_price and openstamp price
  mcap: number; // computed on lower of stampscan floor_unit_price and openstamp price * totalSupply
  volume24: number; // sum of sum_1d + volume24
  stamp_url?: string | null;
  tx_hash: string;
  holder_count: number; // use stampscan holder_count value
  market_data: {
    stampscan: {
      price: number; // floor_unit_price
      volume24: number; // sum_1d
    };
    openstamp: {
      price: number; // price
      volume24: number; // volume24
    };
  };
}

/**
 * Database row interface for stamp_market_data table
 * All DECIMAL columns are represented as strings to preserve precision
 */
export interface StampMarketDataRow {
  cpid: string;
  floor_price_btc: string | null;
  recent_sale_price_btc: string | null;
  open_dispensers_count: number;
  closed_dispensers_count: number;
  total_dispensers_count: number;
  holder_count: number;
  unique_holder_count: number;
  top_holder_percentage: string;
  holder_distribution_score: string;
  volume_24h_btc: string;
  volume_7d_btc: string;
  volume_30d_btc: string;
  total_volume_btc: string;
  price_source: string | null;
  volume_sources: string | null; // JSON string
  data_quality_score: string;
  confidence_level: string;
  last_updated: Date;
  last_price_update: Date | null;
  update_frequency_minutes: number;
}

/**
 * Database row interface for src20_market_data table
 * All DECIMAL columns are represented as strings to preserve precision
 */
export interface SRC20MarketDataRow {
  tick: string;
  price_btc: string | null;
  price_usd: string | null;
  floor_price_btc: string | null;
  market_cap_btc: string;
  market_cap_usd: string;
  volume_24h_btc: string;
  volume_7d_btc: string;
  volume_30d_btc: string;
  total_volume_btc: string;
  holder_count: number;
  circulating_supply: string;
  price_change_24h_percent: string;
  price_change_7d_percent: string;
  price_change_30d_percent: string;
  primary_exchange: string | null;
  exchange_sources: string | null; // JSON string
  data_quality_score: string;
  last_updated: Date;
}

/**
 * Database row interface for collection_market_data table
 * All DECIMAL columns are represented as strings to preserve precision
 */
export interface CollectionMarketDataRow {
  collection_id: string;
  min_floor_price_btc: string | null;
  max_floor_price_btc: string | null;
  avg_floor_price_btc: string | null;
  median_floor_price_btc: string | null;
  total_volume_24h_btc: string;
  stamps_with_prices_count: number;
  min_holder_count: number;
  max_holder_count: number;
  avg_holder_count: string;
  median_holder_count: number;
  total_unique_holders: number;
  avg_distribution_score: string;
  total_stamps_count: number;
  last_updated: Date;
}

/**
 * Parsed interfaces for application use
 * These convert database string values to appropriate types
 */
export interface StampMarketData {
  cpid: string;
  floorPriceBTC: number | null;
  recentSalePriceBTC: number | null;
  openDispensersCount: number;
  closedDispensersCount: number;
  totalDispensersCount: number;
  holderCount: number;
  uniqueHolderCount: number;
  topHolderPercentage: number;
  holderDistributionScore: number; // 0-100
  volume24hBTC: number;
  volume7dBTC: number;
  volume30dBTC: number;
  totalVolumeBTC: number;
  priceSource: string | null;
  volumeSources: Record<string, number> | null;
  dataQualityScore: number; // 0-10
  confidenceLevel: number; // 0-10
  lastUpdated: Date;
  lastPriceUpdate: Date | null;
  updateFrequencyMinutes: number;
}

export interface SRC20MarketData {
  tick: string;
  priceBTC: number | null;
  priceUSD: number | null;
  floorPriceBTC: number | null;
  marketCapBTC: number;
  marketCapUSD: number;
  volume24hBTC: number;
  volume7dBTC: number;
  volume30dBTC: number;
  totalVolumeBTC: number;
  holderCount: number;
  circulatingSupply: string;
  priceChange24hPercent: number;
  priceChange7dPercent: number;
  priceChange30dPercent: number;
  primaryExchange: string | null;
  exchangeSources: string[] | null;
  dataQualityScore: number;
  lastUpdated: Date;
}

export interface CollectionMarketData {
  collectionId: string;
  minFloorPriceBTC: number | null;
  maxFloorPriceBTC: number | null;
  avgFloorPriceBTC: number | null;
  medianFloorPriceBTC: number | null;
  totalVolume24hBTC: number;
  stampsWithPricesCount: number;
  minHolderCount: number;
  maxHolderCount: number;
  avgHolderCount: number;
  medianHolderCount: number;
  totalUniqueHolders: number;
  avgDistributionScore: number;
  totalStampsCount: number;
  lastUpdated: Date;
}

/**
 * Database row interface for stamp_holder_cache table
 * Stores detailed holder information for individual stamps
 */
export interface StampHolderCacheRow {
  id: number;
  cpid: string;
  address: string;
  quantity: string; // DECIMAL(20,8) stored as string
  percentage: string; // DECIMAL(5,2) stored as string
  rank_position: number;
  last_updated: Date;
}

/**
 * Database row interface for market_data_sources table
 * Tracks market data from multiple sources for transparency
 */
export interface MarketDataSourcesRow {
  id: number;
  asset_type: "stamp" | "src20";
  asset_id: string; // cpid for stamps, tick for src20
  source: string; // 'counterparty', 'openstamp', 'kucoin', etc.
  price_btc: string | null; // DECIMAL(16,8)
  price_usd: string | null; // DECIMAL(16,2)
  volume_24h_btc: string; // DECIMAL(16,8)
  holder_count: number;
  market_cap_btc: string; // DECIMAL(20,8)
  source_confidence: string; // DECIMAL(3,1) - 0-10 confidence score
  api_response_time_ms: number;
  last_updated: Date;
}

/**
 * Parsed interface for stamp holder cache
 * Used in application logic with proper types
 */
export interface StampHolderCache {
  id: number;
  cpid: string;
  address: string;
  quantity: number;
  percentage: number;
  rankPosition: number;
  lastUpdated: Date;
}

/**
 * Parsed interface for market data sources
 * Used for source tracking and data quality assessment
 */
export interface MarketDataSource {
  id: number;
  assetType: "stamp" | "src20";
  assetId: string;
  source: string;
  priceBTC: number | null;
  priceUSD: number | null;
  volume24hBTC: number;
  holderCount: number;
  marketCapBTC: number;
  sourceConfidence: number; // 0-10
  apiResponseTimeMs: number;
  lastUpdated: Date;
}

/**
 * Cache status type for indicating data freshness
 */
export type CacheStatus = "fresh" | "stale" | "expired";

/**
 * Volume sources type for parsed JSON data
 */
export type VolumeSources = Record<string, number>;

/**
 * Exchange sources type for parsed JSON data
 */
export type ExchangeSources = string[];

/**
 * Extended stamp interface that includes market data
 * Used when joining stamps with market data cache
 */
export interface StampWithMarketData extends StampRow {
  marketData: StampMarketData | null;
  marketDataMessage?: string;
  cacheStatus?: CacheStatus;
  cacheAgeMinutes?: number;
}

/**
 * Extended SRC20 interface that includes market data
 * Used when joining SRC20 tokens with market data cache
 */
export interface SRC20WithMarketData extends SRC20Row {
  marketData: SRC20MarketData | null;
  marketDataMessage?: string;
  cacheStatus?: CacheStatus;
  cacheAgeMinutes?: number;
}

/**
 * API response interface for stamp with market data
 * Used for REST API responses
 */
export interface StampMarketDataResponse {
  stamp: StampRow;
  marketData: StampMarketData | null;
  cacheStatus: CacheStatus;
  message?: string;
}

/**
 * API response interface for SRC20 with market data
 * Used for REST API responses
 */
export interface SRC20MarketDataResponse {
  token: SRC20Row;
  marketData: SRC20MarketData | null;
  cacheStatus: CacheStatus;
  message?: string;
}

/**
 * Collection stamps with aggregated market data
 */
export interface CollectionWithMarketData {
  collection: CollectionRow;
  stamps: StampWithMarketData[];
  aggregatedMarketData: CollectionMarketData | null;
}
