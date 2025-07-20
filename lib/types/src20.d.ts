import type { SRC20Row } from "$globals";
import type {
  CacheStatus,
  MarketListingAggregated,
} from "$types/marketData.d.ts";
import type { BufferLike } from "$types/utils.d.ts";

type INETWORK = "mainnet" | "testnet";

export interface VOUT {
  address?: string;
  script?: BufferLike;
  value: number;
}

export interface PSBTInput {
  hash: string;
  index: number;
  witnessUtxo?: {
    script: BufferLike;
    value: bigint;
  };
  nonWitnessUtxo?: BufferLike;
  redeemScript?: BufferLike;
  sequence?: number;
}

export interface SRC20OperationResult {
  psbtHex: string;
  inputsToSign: { index: number; address: string }[];
  error?: string;
}

export type SRC20Operation = "deploy" | "mint" | "transfer";

export interface InputData {
  op?: SRC20Operation; // Optional for validation testing
  sourceAddress: string;
  toAddress?: string; // Optional, only required for transfer operations
  fromAddress?: string;
  changeAddress?: string; // Optional for validation testing
  tick: string;
  feeRate?: number; // Optional for validation testing
  amt?: string;
  max?: string;
  lim?: string;
  dec?: number;
  x?: string;
  web?: string;
  email?: string;
  tg?: string;
  description?: string;
  desc?: string;
  img?: string;
  icon?: string;
  isEstimate?: boolean;
}

export interface SignPSBTResult {
  signed: boolean;
  psbt?: string;
  txid?: string;
  cancelled?: boolean;
  error?: string;
}

export interface Deployment {
  amt: number;
  block_index: number;
  block_time: string;
  creator: string;
  creator_name: string;
  deci: number;
  destination: string;
  lim: number;
  max: number;
  op: string;
  p: string;
  tick: string;
  tx_hash: string;
  top_mints_percentage?: number;
}

export interface SRC20MintStatus {
  max_supply: string;
  total_minted: string;
  limit: string;
  total_mints: number;
  progress: string;
  decimals: number;
  tx_hash: string;
}

export interface SRC20MintDataResponse {
  mintStatus: SRC20MintStatus | null;
  holders: number;
}

export interface SRC20HolderData {
  amt: string;
  percentage: string;
  address?: string;
}

export interface SRC20TickPageData {
  last_block: number;
  deployment: Deployment;
  total_transfers: number;
  total_mints: number;
  total_holders: number;
  holders: SRC20HolderData[];
  mint_status: SRC20MintStatus;
  total_transactions: number;
  marketInfo?: MarketListingAggregated;
  initialCounts?: {
    totalMints: number;
    totalTransfers: number;
  };
  highcharts?: any[];
}

export interface SRC20BalanceRequestParams {
  address?: string;
  tick?: string;
  amt?: number;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortField?: string;
  includePagination?: boolean;
  includeMintData?: boolean;
  includeMarketData?: boolean; // NEW: API v2.3 enhancement for market data enrichment
}

/**
 * Enhanced SRC20 Row with clean v2.3 market data structure
 * Used for detailed token pages with additional enrichment data
 */
export interface EnrichedSRC20Row extends SRC20Row {
  // ONLY clean nested market data structure ✅
  market_data?: SRC20MarketDataV3 | null;

  // Additional enrichment data
  chart?: any; // TODO: Define proper chart interface
  holders: number; // Inherited from SRC20Row but made explicit

  // Optional metadata
  marketDataMessage?: string;
  cacheStatus?: CacheStatus;
  cacheAgeMinutes?: number;
}

/**
 * Utility type for safe market data access patterns
 * Components should use these patterns instead of direct property access
 * Type guard functions are implemented in lib/utils/marketDataHelpers.ts
 */
export type SafeMarketDataAccess<
  T extends SRC20Token | SRC20Balance | EnrichedSRC20Row,
> = T extends { market_data: SRC20MarketDataV3 } ? T["market_data"] : never;

/**
 * Clean v2.3 Market Data structure for SRC20 tokens
 * Standardized nested object - NO root-level field duplication
 */
export interface SRC20MarketDataV3 {
  // Price fields (BTC-denominated)
  floorPriceBTC: number | null;
  recentSalePriceBTC: number | null;
  lastPriceBTC: number; // Best available price (hierarchy: floor > recent > 0)

  // Market metrics
  marketCapBTC: number;
  marketCapUSD: number;

  // Volume data
  volume24hBTC: number;
  volume7dBTC: number;
  volume30dBTC: number;

  // Market activity
  holderCount: number;
  circulatingSupply: string;

  // Price changes
  change24h: number | null; // Percentage change
  change7d: number | null;
  change30d: number | null;

  // Data quality & metadata
  dataQualityScore: number; // 1-10 scale
  lastUpdated: string; // ISO date string
  primaryExchange: string | null;
  exchangeSources: string[] | null;
}

/**
 * Clean v2.3 SRC20 Token interface
 * ONLY uses nested market_data object - NO root-level market fields
 */
export interface SRC20Token extends SRC20Row {
  // ONLY nested market data structure ✅
  market_data?: SRC20MarketDataV3 | null;

  // Optional enrichment metadata
  marketDataMessage?: string;
  cacheStatus?: CacheStatus;
  cacheAgeMinutes?: number;

  // Chart data for detail pages
  chart?: any; // TODO: Define proper chart interface
}

/**
 * Clean v2.3 SRC20 Balance interface for wallet endpoints
 * Extends basic balance with optional market data enrichment
 */
export interface SRC20Balance extends SRC20Row {
  // Balance-specific fields
  address: string;
  balance: string;
  available: string;
  transferable: string;

  // ONLY nested market data structure ✅
  market_data?: SRC20MarketDataV3 | null;

  // Optional enrichment metadata
  marketDataMessage?: string;
  cacheStatus?: CacheStatus;
  cacheAgeMinutes?: number;
}

/**
 * @deprecated Legacy interface - use SRC20Token instead
 * Kept temporarily for backward compatibility during migration
 */
export interface SRC20WithOptionalMarketData extends SRC20Row {
  /** @deprecated Use market_data?.floorPriceBTC instead */
  marketData?: SRC20MarketDataV3 | null;
  marketDataMessage?: string;
  cacheStatus?: CacheStatus;
  cacheAgeMinutes?: number;

  /** @deprecated Use market_data instead - will be removed in v2.4 */
  market_data?: MarketListingAggregated;
  /** @deprecated Use market_data?.floorPriceBTC instead */
  priceBTC?: number | null;
  /** @deprecated Use market_data?.marketCapUSD instead */
  priceUSD?: number | null;
  /** @deprecated Use market_data?.marketCapUSD instead */
  marketCapUSD?: number | null;
  /** @deprecated Use market_data?.volume24hBTC instead */
  volume24h?: number | null;
}

/**
 * Query parameters for SRC20 endpoints with market data
 */
export interface SRC20MarketDataQueryParams {
  includeMarketData?: boolean;
  marketDataOnly?: boolean; // Only return tokens with market data
  minMarketCap?: number;
  minVolume24h?: number;
  sortByMarketCap?: "asc" | "desc";
}

/**
 * Paginated SRC20 response with market data - v2.3 Clean Format
 * Uses clean SRC20Token interface with nested market_data structure only
 */
export interface PaginatedSRC20Response {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
  last_block: number;
  data: SRC20Token[]; // ✅ Using clean interface
  marketDataSummary?: {
    tokensWithData: number;
    tokensWithoutData: number;
    totalMarketCapBTC: number;
    totalMarketCapUSD: number;
    totalVolume24hBTC: number;
    cacheStatus: CacheStatus;
  };
}

/**
 * @deprecated Use PaginatedSRC20Response instead
 * Legacy paginated response - kept for backward compatibility
 */
export interface PaginatedSRC20WithMarketDataResponse {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
  last_block: number;
  data: SRC20WithOptionalMarketData[]; // Legacy format
  marketDataSummary?: {
    tokensWithData: number;
    tokensWithoutData: number;
    totalMarketCapBTC: number;
    totalMarketCapUSD: number;
    totalVolume24hBTC: number;
    cacheStatus: CacheStatus;
  };
}
