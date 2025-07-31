/**
 * 🔌 API Types Domain Module
 *
 * This module contains all API-related type definitions including:
 * - HTTP request/response interfaces
 * - API handler context types
 * - Paginated response bodies
 * - Route parameter types
 *
 * Part of the divine type domain migration - extracting API types from globals.d.ts
 * into their celestial organized domain.
 *
 * @see globals.d.ts - Source of truth being migrated
 * @author Bitcoin Stamps 🎵
 */

// ============================================================================
// Type Imports from Other Domain Modules
// ============================================================================

import type { BlockRow, SUBPROTOCOLS } from "./base.d.ts";

import type {
  STAMP_FILTER_TYPES,
  StampBalance,
  StampFilters,
  StampRow,
} from "./stamp.d.ts";

import type {
  EnrichedSRC20Row,
  MintStatus,
  SRC20Balance,
  Src20Detail,
} from "./src20.d.ts";

import type { SendRow } from "./transaction.d.ts";

// Temporary imports from globals until these types are migrated to their domain modules
import type { DispenserRow, Pagination } from "../../globals.d.ts";

// ============================================================================
// API Handler Context Types
// ============================================================================

/**
 * IdentHandlerContext is used when the context requires an 'ident' parameter
 * Used by API routes that need to identify specific resources by ident
 */
export interface IdentHandlerContext {
  params: {
    ident: string;
  };
}

/**
 * BlockHandlerContext for block-specific API endpoints
 * Includes both route parameters and URL context
 */
export interface BlockHandlerContext {
  params: {
    block_index: string;
  };
  url: URL;
}

/**
 * AddressTickHandlerContext for address and tick specific operations
 * Used in SRC-20 token operations tied to specific addresses and ticks
 */
export interface AddressTickHandlerContext {
  params: {
    address: string;
    tick: string | number;
  };
}

/**
 * AddressHandlerContext for address-specific API endpoints
 * Used for wallet and address-related operations
 */
export interface AddressHandlerContext {
  params: {
    address: string;
  };
}

/**
 * TickHandlerContext for tick-specific SRC-20 operations
 * Supports optional operation parameter for future mint/transfer/deploy routing
 */
export interface TickHandlerContext {
  params: {
    tick: string;
    op?: string; // future use for mint/transfer deploy is defined in routes
  };
}

// ============================================================================
// API Request Parameter Types
// ============================================================================

/**
 * SRC-20 transaction request parameters for API endpoints
 * Comprehensive parameter set for filtering and querying SRC-20 transactions
 *
 * ✨ V2.3 Enhanced with trending and mint progress capabilities
 */
export interface SRC20TrxRequestParams {
  block_index?: number | null;
  tick?: string | string[] | null;
  op?: string | string[] | null;
  limit?: number;
  page?: number;
  sort?: string; // sort is only used on API requests
  sortBy?: string;
  filterBy?: string | string[] | null;
  tx_hash?: string | null;
  address?: string | null;
  noPagination?: boolean;
  singleResult?: boolean;

  // 🚀 NEW V2.3 PARAMETERS FOR TRENDING AND MINT PROGRESS
  mintingStatus?: "all" | "minting" | "minted"; // Simplified filter: all (default), minting (progress < 100%), minted (progress >= 99.9%)
  trendingWindow?: "24h" | "7d" | "30d"; // Time window for trending calculations
  includeProgress?: boolean; // Include progress_percentage, total_minted from market data
  mintVelocityMin?: number; // Minimum mint velocity for trending (mints per hour)
}

/**
 * SRC-20 snapshot request parameters
 * For generating point-in-time snapshots of SRC-20 token states
 */
export interface SRC20SnapshotRequestParams {
  block_index?: number | null;
  tick?: string | string[] | null;
  address?: string | null;
  limit?: number;
  page?: number;
  sortBy?: string;
  noPagination?: boolean;
}

// ============================================================================
// API Response Body Types
// ============================================================================

/**
 * Base paginated response structure for stamp-related endpoints
 * Provides common pagination metadata and stamp data array
 */
export interface PaginatedStampResponseBody {
  last_block: number;
  page: number;
  limit: number;
  totalPages: number;
  data: StampRow[];
}

/**
 * Paginated response with identifier information
 * Extends base stamp response with subprotocol identification
 */
export interface PaginatedIdResponseBody extends PaginatedStampResponseBody {
  ident: SUBPROTOCOLS;
}

/**
 * Paginated stamp balance response for wallet operations
 * Returns stamp balance information with pagination support
 */
export interface PaginatedStampBalanceResponseBody {
  last_block: number;
  page: number;
  limit: number;
  totalPages: number;
  data: StampBalance[];
}

/**
 * Paginated SRC-20 response with enriched market data
 * ✨ V2.3 Enhanced: Uses EnrichedSRC20Row for comprehensive token information
 */
export interface PaginatedSrc20ResponseBody {
  last_block: number;
  page: number;
  limit: number;
  totalPages: number;
  data: EnrichedSRC20Row[]; // CHANGED from Src20Detail[] to EnrichedSRC20Row[]
}

/**
 * Paginated tick response with mint status information
 * Provides detailed information about specific SRC-20 ticks including minting progress
 */
export interface PaginatedTickResponseBody {
  last_block: number;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  mint_status: MintStatus;
  data: Src20Detail[];
}

/**
 * Deploy operation response body
 * Returns information about SRC-20 token deployment with mint status
 */
export interface DeployResponseBody {
  last_block: number;
  mint_status: MintStatus;
  data: Src20Detail;
}

/**
 * Single SRC-20 token response body
 * Returns detailed information about a specific SRC-20 token
 */
export interface Src20ResponseBody {
  last_block: number;
  data: Src20Detail;
}

/**
 * Paginated SRC-20 balance response for wallet operations
 * Returns SRC-20 token balances with pagination support
 */
export interface PaginatedSrc20BalanceResponseBody {
  last_block: number;
  page: number;
  limit: number;
  totalPages: number;
  data: SRC20Balance[] | [];
}

/**
 * Single SRC-20 balance response body
 * Returns balance information for a specific SRC-20 token with optional pagination
 */
export interface Src20BalanceResponseBody {
  last_block: number;
  data: SRC20Balance;
  pagination?: Pagination;
}

/**
 * Block information response with associated transactions
 * Comprehensive block data including issuances and sends
 */
export interface BlockInfoResponseBody {
  block_info: BlockRow;
  issuances: StampRow[];
  sends: SendRow[];
  last_block: number;
}

/**
 * Stamp block response focusing on stamp data
 * Block information with associated stamp transactions
 */
export interface StampBlockResponseBody {
  block_info: BlockRow;
  data: StampRow[];
  last_block: number;
}

/**
 * Paginated dispenser response for marketplace operations
 * Returns dispenser information with pagination metadata
 */
export interface PaginatedDispenserResponseBody {
  page: number;
  limit: number;
  totalPages: number;
  last_block: number;
  dispensers: DispenserRow[];
}

// ============================================================================
// Composite API Types
// ============================================================================

/**
 * Combined stamps and SRC-20 data structure
 * Used for endpoints that return both stamp and SRC-20 information
 */
export interface StampsAndSrc20 {
  stamps: StampRow[];
  src20: SRC20Balance[];
}

/**
 * Stamp page props for frontend rendering
 * Comprehensive data structure for stamp gallery pages
 */
export type StampPageProps = {
  data: {
    stamps: StampRow[];
    page: number;
    totalPages: number;
    selectedTab: "all" | "classic" | "posh" | "recent_sales";
    sortBy: "ASC" | "DESC";
    filterBy: STAMP_FILTER_TYPES[];
    filters: StampFilters;
    search: string;
  };
};

// ============================================================================
// Type Re-exports for Dependencies
// ============================================================================

// These types are referenced by API types and need to be imported from their domains
// Import statements would be added here in a real implementation:
// import type { StampRow, StampBalance } from './stamp.d.ts';
// import type { SRC20Balance, EnrichedSRC20Row, Src20Detail } from './src20.d.ts';
// import type { SUBPROTOCOLS, STAMP_FILTER_TYPES, MintStatus } from './base.d.ts';
// import type { BlockRow, SendRow, DispenserRow } from './transaction.d.ts';
// import type { StampFilters } from './stamp.d.ts';
// import type { Pagination } from './pagination.d.ts';
