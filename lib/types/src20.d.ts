/**
 * @fileoverview SRC-20 Token Protocol Type Definitions
 *
 * This module contains all type definitions related to the SRC-20 token protocol
 * including operation types, token metadata, balance tracking, and validation helpers.
 *
 * @author BTCStampsExplorer Team
 * @version 1.0.0
 * @created 2025-01-31
 *
 * Migrated from globals.d.ts as part of the Type Domain Migration project.
 *
 * Dependencies:
 * - base.d.ts: Basic types and utilities
 * - marketData.d.ts: Market data integration types
 * - utils.d.ts: Utility types
 */

import Big from "big";
import type {
  PaginatedResponse as _PaginatedResponse,
  PaginationProps,
} from "$types/pagination.d.ts";
import type {
  CacheStatus,
  MarketListingAggregated,
  SRC20MarketData,
} from "$types/marketData.d.ts";
import type { BufferLike } from "$types/utils.d.ts";

// ============================================================================
// SRC-20 OPERATION AND FILTER TYPES
// ============================================================================

/**
 * SRC-20 token operation types
 * Defines the primary operations available in the SRC-20 protocol
 */
export type SRC20_TYPES =
  | "all" // All SRC-20 operations
  | "deploy" // Token deployment operations
  | "mint" // Token minting operations
  | "transfer" // Token transfer operations
  | "trending"; // Trending tokens (derived view);

/**
 * SRC-20 filter types for UI filtering
 * Used in frontend components for filtering token lists
 */
export type SRC20_FILTER_TYPES =
  | "minting" // Currently minting tokens
  | "trending mints" // Trending minting activity
  | "deploy" // Deployment information
  | "supply" // Total supply information
  | "marketcap" // Market capitalization data
  | "holders" // Token holder information
  | "volume" // Trading volume data
  | "price change"; // Price change metrics

/**
 * SRC-20 token status types
 * Represents the current state of a token's lifecycle
 */
export type SRC20_STATUS =
  | "fully minted" // Compare SRC20Valid with mint_status where progress = 100%
  | "minting" // Compare SRC20Valid with mint_status where progress < 100%
  | "trending mints"; // Requires aggregation of recent mint transactions

/**
 * SRC-20 detail view types
 * Defines what detailed information to display for tokens
 */
export type SRC20_DETAILS =
  | "deploy" // Maps to SRC20Valid.op = 'deploy'
  | "supply" // Maps to SRC20Valid.max field
  | "holders"; // Maps to src20_token_stats.holders_count

/**
 * SRC-20 market data types
 * Defines market-related information categories
 */
export type SRC20_MARKET =
  | "marketcap" // Calculated field: floor_price * total_supply
  | "volume" // Calculated from recent transactions
  | "price change"; // Calculated from price history

// ============================================================================
// SRC-20 CORE DATA STRUCTURES
// ============================================================================

/**
 * Core SRC-20 token row interface
 * Represents a complete SRC-20 token record with all associated metadata
 *
 * This is the primary interface for SRC-20 token data throughout the application.
 * Includes both protocol-required fields and extended market data.
 */
export interface SRC20Row {
  // Core protocol fields
  tx_hash: string;
  block_index: number;
  p: string; // Protocol identifier (e.g., "src-20")
  op: string; // Operation type: "deploy", "mint", "transfer"
  tick: string; // Token ticker symbol
  tick_hash: string; // Hash of the ticker
  creator: string; // Creator address
  creator_name: string | null; // Human-readable creator name

  // Operation-specific fields (optional based on operation type)
  amt?: string | bigint; // Amount (for mint/transfer operations)
  deci?: number; // Decimals (for deploy operations)
  max?: string | bigint; // Max supply (for deploy operations)
  lim?: string | bigint; // Mint limit (for deploy operations)

  // Transfer and metadata fields
  destination: string; // Destination address
  destination_name?: string; // Human-readable destination name
  block_time: Date; // Block timestamp
  status: string; // Transaction status
  row_num: number; // Row number for pagination
  progress?: string | null; // Minting progress percentage

  // Optional metadata fields
  email?: string; // Contact email
  web?: string; // Website URL
  tg?: string; // Telegram handle
  x?: string; // X (Twitter) handle
  holders: number; // Number of token holders

  // 🎸 PUNK ROCK v2.3 STANDARDIZED FIELDS 🎸
  floor_price_btc?: number | null; // v2.3 standardized field (was floor_unit_price)
  fee_rate_sat_vb: number | null; // Fee rate in sat/vB
  fee: number | null; // Transaction fee
  market_cap_btc?: number; // v2.3 standardized field (was mcap)
  top_mints_percentage?: number; // Percentage of top mints
  volume_7d_btc?: number; // v2.3 extended field (was volume_7d)
  value?: number; // Token value

  // Display and reference fields
  stamp_url?: string; // Associated stamp URL
  deploy_img?: string; // Deployment image URL
  deploy_tx?: string; // Deployment transaction hash

  // Mint progress tracking
  mint_progress?: {
    max_supply: string; // Maximum token supply
    total_minted: string; // Total tokens minted so far
    limit: string; // Per-mint limit
    total_mints: number; // Total number of mint operations
    progress: string; // Progress percentage as string
    decimals: number; // Token decimals
    tx_hash: string; // Associated transaction hash
    tick: string; // Token ticker
  };

  // Market data fields
  volume_24h_btc?: number; // v2.3 standardized field (was volume24)
  market_cap?: number; // Market capitalization
  chart?: any[]; // Chart data array
  mint_count?: number | string; // Number of mints
  trending_rank?: number; // Trending rank position
}

/**
 * Enriched SRC-20 row with additional market data
 * Extends the base SRC20Row with optional market data and chart information
 */
export interface EnrichedSRC20Row extends SRC20Row {
  market_data?: MarketListingAggregated; // ✅ Uses v2.3 interface
  chart?: any; // Chart data for display
  mint_count?: number | string; // Number of mints for this token
  volume_24h_btc?: number; // ✅ v2.3 standardized field - 24h trading volume
  market_cap_btc?: number; // ✅ v2.3 standardized field - Market capitalization
}

/**
 * SRC-20 token balance information
 * Represents a user's balance for a specific SRC-20 token
 */
export interface SRC20Balance {
  address: string; // Holder address
  p: string; // Protocol identifier
  tick: string; // Token ticker
  amt: number; // Balance amount
  block_time: Date; // Last update block time
  last_update: number; // Last update timestamp
  deploy_tx: string; // Deployment transaction
  deploy_img: string; // Deployment image URL
}

/**
 * Detailed SRC-20 transaction information
 * Used for transaction-specific views and API responses
 */
export interface Src20Detail {
  tx_hash: string;
  block_index: number;
  p: string; // Protocol identifier
  op: string; // Operation type
  tick: string; // Token ticker
  creator: string; // Creator address
  amt: Big | null; // Amount using Big.js for precision
  deci: number; // Decimals
  lim: string; // Mint limit
  max: string; // Max supply
  destination: string; // Destination address
  block_time: string; // Block time as string
  creator_name: string | null; // Creator display name
  destination_name: string; // Destination display name

  // Optional fields for test compatibility and legacy support
  id?: number; // Database ID when needed
  // Note: market_data and chart removed from here, will be on EnrichedSRC20Row for relevant responses
}

/**
 * SRC-20 snapshot detail for balance snapshots
 * Used for point-in-time balance queries
 */
export interface Src20SnapShotDetail {
  tick: string; // Token ticker
  address: string; // Holder address
  balance: Big; // Balance using Big.js for precision
}

// ============================================================================
// SRC-20 FILTERING AND QUERY INTERFACES
// ============================================================================

/**
 * Comprehensive SRC-20 filtering interface
 * Used by frontend components to build complex filter queries
 */
export interface SRC20Filters {
  status?: SRC20_STATUS[]; // Filter by token status

  details?: {
    deploy?: boolean; // Include deployment info
    supply?: boolean; // Include supply info
    holders?: boolean; // Include holder info
    holdersRange?: { // Filter by holder count range
      min: number;
      max: number;
    };
    supplyRange?: { // Filter by supply range
      min: string | number;
      max: string | number;
    };
  };

  market?: {
    marketcap?: boolean; // Include market cap data
    marketcapRange?: { // Filter by market cap range
      min: number;
      max: number;
    };
    volume?: boolean; // Include volume data
    volumePeriod?: "24h" | "3d" | "7d"; // Volume time period
    priceChange?: boolean; // Include price change data
    priceChangePeriod?: "24h" | "3d" | "7d"; // Price change period
    priceChangeRange?: { // Filter by price change percentage
      min: number; // Percentage
      max: number; // Percentage
    };
  };

  search?: string; // Search by tick or tick_hash
}

/**
 * SRC-20 transaction request parameters
 * Used for querying SRC-20 transactions with advanced filtering
 */
export interface SRC20TrxRequestParams {
  block_index?: number | null; // Filter by block index
  tick?: string | string[] | null; // Filter by ticker(s)
  op?: string | string[] | null; // Filter by operation(s)
  limit?: number; // Results per page
  page?: number; // Page number
  sort?: string; // Sort order (API requests only)
  sortBy?: string; // Sort field
  filterBy?: string | string[] | null; // Additional filters
  tx_hash?: string | null; // Filter by transaction hash
  address?: string | null; // Filter by address
  noPagination?: boolean; // Disable pagination
  singleResult?: boolean; // Return single result

  // 🚀 NEW V2.3 PARAMETERS FOR TRENDING AND MINT PROGRESS
  mintingStatus?: "all" | "minting" | "minted"; // Simplified filter: all (default), minting (progress < 100%), minted (progress >= 99.9%)
  trendingWindow?: "24h" | "7d" | "30d"; // Time window for trending calculations
  includeProgress?: boolean; // Include progress_percentage, total_minted from market data
  mintVelocityMin?: number; // Minimum mint velocity for trending (mints per hour)
}

/**
 * SRC-20 balance request parameters
 * Used for querying token balances with optional enrichment
 */
export interface SRC20BalanceRequestParams {
  address?: string; // Filter by address
  tick?: string; // Filter by ticker
  amt?: number; // Filter by amount
  limit?: number; // Results per page
  page?: number; // Page number
  sortBy?: string; // Sort field
  sortField?: string; // Sort field (alternative)
  includePagination?: boolean; // Include pagination metadata
  includeMintData?: boolean; // Include mint data
  includeMarketData?: boolean; // NEW: API v2.3 enhancement for market data enrichment
}

/**
 * SRC-20 snapshot request parameters
 * Used for balance snapshot queries
 */
export interface SRC20SnapshotRequestParams {
  tick: string; // Token ticker (required)
  limit: number; // Results per page
  page: number; // Page number
  amt: number; // Amount filter
  sortBy?: string; // Sort field
}

// ============================================================================
// SRC-20 RESPONSE INTERFACES - MOVED TO api.d.ts
// ============================================================================

// NOTE: All SRC-20 API response interfaces have been moved to api.d.ts to eliminate duplication
// Import API response types from api.d.ts:
// - PaginatedSrc20ResponseBody
// - PaginatedTickResponseBody
// - DeployResponseBody
// - Src20ResponseBody
// - PaginatedSrc20BalanceResponseBody
// - Src20BalanceResponseBody
// - StampsAndSrc20
//
// These types are now centralized in api.d.ts as the single source of truth

// ============================================================================
// SRC-20 OPERATION AND PROTOCOL TYPES
// ============================================================================

/**
 * SRC-20 operation types
 * Defines the three main SRC-20 protocol operations
 */
export type SRC20Operation = "deploy" | "mint" | "transfer";

/**
 * Chart data point structure
 * Used for price/volume charts: [timestamp, value]
 */
export type ChartDataPoint = [number, number];

/**
 * Chart data array
 * Collection of chart data points for time-series visualization
 */
export type ChartData = ChartDataPoint[];

/**
 * Chart configuration options
 * Configuration for different chart types and display options
 */
export interface ChartOptions {
  type?: "line" | "candlestick"; // Chart type
  title?: string; // Chart title
  yAxisTitle?: string; // Y-axis label
  fromPage?: string; // Source page context
  tick?: string; // Token ticker for context
}

// ============================================================================
// SRC-20 MARKET DATA INTEGRATION
// ============================================================================

/**
 * SRC-20 token with optional market data
 * Extends base SRC20Row with optional market data fields for enhanced views
 */
export interface SRC20WithOptionalMarketData extends SRC20Row {
  // Optional market data fields
  marketData?: SRC20MarketData | null; // Market data from cache
  marketDataMessage?: string; // Status message for market data
  cacheStatus?: CacheStatus; // Cache status information
  cacheAgeMinutes?: number; // Age of cached data in minutes

  // Legacy fields for backward compatibility
  market_data?: MarketListingAggregated; // Legacy market data format
  priceBTC?: number | null; // Price in BTC
  priceUSD?: number | null; // Price in USD
  marketCapUSD?: number | null; // Market cap in USD
  volume24h?: number | null; // 24h volume
}

/**
 * Query parameters for SRC-20 endpoints with market data
 * Parameters for requesting SRC-20 data with market information
 */
export interface SRC20MarketDataQueryParams {
  includeMarketData?: boolean; // Include market data in response
  marketDataOnly?: boolean; // Only return tokens with market data
  minMarketCap?: number; // Minimum market cap filter
  minVolume24h?: number; // Minimum 24h volume filter
  sortByMarketCap?: "asc" | "desc"; // Sort by market cap
}

/**
 * Paginated SRC-20 response with market data
 * Enhanced paginated response including market data summary
 */
export interface PaginatedSRC20WithMarketDataResponse {
  page: number; // Current page
  limit: number; // Results per page
  totalPages: number; // Total pages
  total: number; // Total results
  last_block: number; // Last processed block
  data: SRC20WithOptionalMarketData[]; // Token data with market info
  marketDataSummary?: { // Market data summary
    tokensWithData: number; // Count of tokens with market data
    tokensWithoutData: number; // Count of tokens without market data
    totalMarketCapBTC: number; // Total market cap in BTC
    totalMarketCapUSD: number; // Total market cap in USD
    totalVolume24hBTC: number; // Total 24h volume in BTC
    cacheStatus: CacheStatus; // Overall cache status
  };
}

// ============================================================================
// SRC-20 WALLET AND TRANSACTION TYPES
// ============================================================================

/**
 * VOUT (Transaction Output) structure
 * Used in SRC-20 transaction construction
 */
export interface VOUT {
  address?: string; // Output address
  script?: BufferLike; // Output script
  value: number; // Output value in satoshis
}

/**
 * PSBT (Partially Signed Bitcoin Transaction) Input
 * Used for SRC-20 transaction signing workflows
 */
export interface PSBTInput {
  hash: string; // Transaction hash
  index: number; // Output index
  witnessUtxo?: { // Witness UTXO data
    script: BufferLike; // Script
    value: bigint; // Value
  };
  nonWitnessUtxo?: BufferLike; // Non-witness UTXO data
  redeemScript?: BufferLike; // Redeem script
  sequence?: number; // Sequence number
}

/**
 * SRC-20 operation result
 * Result of SRC-20 operation preparation (deploy/mint/transfer)
 */
export interface SRC20OperationResult {
  psbtHex: string; // PSBT hex string
  inputsToSign: { index: number; address: string }[]; // Inputs requiring signatures
  error?: string; // Error message if operation failed
}

/**
 * Input data for SRC-20 operations
 * Comprehensive input structure for all SRC-20 operations
 */
export interface InputData {
  op?: SRC20Operation; // Operation type (optional for validation)
  sourceAddress: string; // Source address (required)
  toAddress?: string; // Destination address (required for transfers)
  fromAddress?: string; // From address (alternative field)
  changeAddress?: string; // Change address (optional)
  tick: string; // Token ticker (required)
  feeRate?: number; // Fee rate (optional for validation)

  // Operation-specific parameters
  amt?: string; // Amount (for mint/transfer)
  max?: string; // Max supply (for deploy)
  lim?: string; // Mint limit (for deploy)
  dec?: number; // Decimals (for deploy)

  // Optional metadata fields
  x?: string; // X (Twitter) handle
  web?: string; // Website URL
  email?: string; // Contact email
  tg?: string; // Telegram handle
  description?: string; // Description
  desc?: string; // Description (alternative field)
  img?: string; // Image URL
  icon?: string; // Icon URL

  isEstimate?: boolean; // Whether this is for fee estimation
}

/**
 * PSBT signing result
 * Result of PSBT signing operation
 */
export interface SignPSBTResult {
  signed: boolean; // Whether signing was successful
  psbt?: string; // Signed PSBT hex
  txid?: string; // Transaction ID if broadcast
  cancelled?: boolean; // Whether user cancelled
  error?: string; // Error message if failed
}

// ============================================================================
// SRC-20 MINT AND DEPLOYMENT TYPES
// ============================================================================

/**
 * Token deployment information
 * Detailed information about a token deployment
 */
export interface Deployment {
  amt: number; // Amount
  block_index: number; // Block index
  block_time: string; // Block time
  creator: string; // Creator address
  creator_name: string; // Creator name
  deci: number; // Decimals
  destination: string; // Destination address
  lim: number; // Mint limit
  max: number; // Max supply
  op: string; // Operation type
  p: string; // Protocol
  tick: string; // Token ticker
  tx_hash: string; // Transaction hash
  top_mints_percentage?: number; // Top mints percentage
}

/**
 * SRC-20 mint status information
 * Tracks the minting progress of a token
 */
export interface SRC20MintStatus {
  max_supply: string; // Maximum supply
  total_minted: string; // Total minted so far
  limit: string; // Per-mint limit
  total_mints: number; // Total mint operations
  progress: string; // Progress percentage
  decimals: number; // Token decimals
  tx_hash: string; // Associated transaction
}

/**
 * SRC-20 mint data response
 * Response containing mint status and holder information
 */
export interface SRC20MintDataResponse {
  mintStatus: SRC20MintStatus | null; // Mint status or null if not found
  holders: number; // Number of holders
}

/**
 * SRC-20 holder data
 * Information about a token holder
 */
export interface SRC20HolderData {
  amt: string; // Amount held
  percentage: string; // Percentage of total supply
  address?: string; // Holder address (optional for privacy)
}

/**
 * SRC-20 tick page data
 * Comprehensive data for token detail pages
 */
export interface SRC20TickPageData {
  last_block: number; // Last processed block
  deployment: Deployment; // Deployment information
  total_transfers: number; // Total transfer count
  total_mints: number; // Total mint count
  total_holders: number; // Total holder count
  holders: SRC20HolderData[]; // Holder data array
  mint_status: SRC20MintStatus; // Current mint status
  total_transactions: number; // Total transaction count
  marketInfo?: MarketListingAggregated; // Optional market information
  initialCounts?: { // Initial counts for comparison
    totalMints: number;
    totalTransfers: number;
  };
  highcharts?: ChartData; // Chart data for visualization
}

// ============================================================================
// TYPE RE-EXPORTS AND COMPATIBILITY
// ============================================================================

// Re-export types that might be used elsewhere for backward compatibility
export type {
  MarketListingAggregated,
  SRC20MarketData,
} from "$types/marketData.d.ts";
export type {
  PaginatedResponse,
  PaginationProps,
} from "$types/pagination.d.ts";

// Compatibility exports for backward compatibility
export type MintStatus = SRC20MintStatus;

// ============================================================================
// MODULE DOCUMENTATION
// ============================================================================

/**
 * @example Basic SRC-20 token query
 * ```typescript
 * import type { SRC20Row, SRC20TrxRequestParams } from "$types/src20.d.ts";
 *
 * const params: SRC20TrxRequestParams = {
 *   tick: "EXAMPLE",
 *   op: "mint",
 *   limit: 50,
 *   includeProgress: true
 * };
 * ```
 *
 * @example SRC-20 operation preparation
 * ```typescript
 * import type { InputData, SRC20OperationResult } from "$types/src20.d.ts";
 *
 * const mintData: InputData = {
 *   op: "mint",
 *   sourceAddress: "bc1q...",
 *   tick: "EXAMPLE",
 *   amt: "1000"
 * };
 * ```
 *
 * @example Market data integration
 * ```typescript
 * import type { SRC20WithOptionalMarketData } from "$types/src20.d.ts";
 *
 * const tokenWithMarket: SRC20WithOptionalMarketData = {
 *   ...baseTokenData,
 *   marketData: marketInfo,
 *   cacheStatus: "fresh"
 * };
 * ```
 */
