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
// Extracted Inline API Types
// ============================================================================

/**
 * OLGA API - Fee Estimation Request Body
 * Used by the OLGA minting estimation endpoint
 */
export interface EstimateRequest {
  filename: string;
  file: string;
  qty?: number | string;
  satsPerVB?: number | string;
  satsPerKB?: number | string;
  feeRate?: number | string;
  service_fee?: number | string;
  isPoshStamp?: boolean;
}

/**
 * OLGA API - Fee Estimation Response Body
 * Comprehensive fee estimation response from OLGA endpoint
 */
export interface EstimateResponse {
  est_tx_size: number;
  total_dust_value: number;
  est_miner_fee: number;
  total_cost: number;
  fee_breakdown: {
    miner_fee: number;
    dust_value: number;
    service_fee: number;
  };
  file_info: {
    size_bytes: number;
    cip33_addresses_count: number;
  };
  is_estimate: true;
  estimation_method: "dummy_utxos";
  dummy_utxo_value: number;
}

/**
 * OLGA API - Raw Mint Request Body
 * Flexible request body for OLGA minting operations
 */
export interface RawRequestBody {
  sourceWallet?: string;
  assetName?: string;
  qty?: number | string;
  locked?: boolean;
  divisible?: boolean;
  filename?: string;
  file?: string;
  description?: string;
  prefix?: "stamp" | "file" | "glyph";
  dryRun?: boolean;
  satsPerKB?: number | string;
  satsPerVB?: number | string;
  feeRate?: number | string;
  service_fee?: number | string;
  service_fee_address?: string;
  isPoshStamp?: boolean;
  // MARA integration parameters
  outputValue?: number | string;
  maraFeeRate?: number | string;
}

/**
 * OLGA API - Transaction Input Type
 * Represents Bitcoin transaction input for OLGA operations
 */
export interface TransactionInput {
  txid: string;
  vout: number;
  signingIndex: number;
}

/**
 * OLGA API - Stamp Creation Parameters
 * Normalized parameters passed to StampCreationService
 */
export interface CreateStampIssuanceParams {
  sourceWallet: string;
  assetName: string;
  qty: string;
  locked: boolean;
  divisible: boolean;
  filename: string;
  file: string;
  satsPerKB: number;
  satsPerVB: number;
  description: string;
  prefix: "stamp" | "file" | "glyph";
  isDryRun?: boolean;
  service_fee: number;
  service_fee_address: string;
  outputValue?: number;
}

/**
 * OLGA API - Normalized Mint Response
 * Response structure for OLGA minting operations
 */
export interface NormalizedMintResponse {
  hex: string;
  cpid: string;
  est_tx_size: number;
  input_value: number;
  total_dust_value: number;
  est_miner_fee: number;
  change_value: number;
  total_output_value: number;
  txDetails: TransactionInput[];
  is_estimate?: boolean;
  estimation_method?: string;
}

/**
 * Transaction API - PSBT Creation Input
 * Input parameters for creating Bitcoin PSBTs
 */
export interface CreatePSBTInput {
  utxo: string;
  salePrice: number;
  sellerAddress: string;
}

/**
 * Transaction API - PSBT Creation Response
 * Response containing the created PSBT hex
 */
export interface CreatePSBTResponse {
  psbt: string;
}

/**
 * Send API - Send Request Body
 * Request body for Counterparty send operations
 */
export interface SendRequestBody {
  address: string;
  destination: string;
  asset: string;
  quantity: number;
  satsPerVB: number;
  options?: {
    service_fee?: number;
    service_fee_address?: string;
    memo?: string;
    memo_is_hex?: boolean;
    encoding?: string;
    fee_per_kb?: number;
    return_psbt?: boolean;
  };
  dryRun?: boolean;
}

/**
 * Send API - Send Response
 * Response structure for send operations
 */
export interface SendResponse {
  psbtHex?: string;
  inputsToSign?: { index: number; address: string; sighashTypes?: number[] }[];
  estimatedFee?: number;
  estimatedVsize?: number;
}

/**
 * SRC-20 API - Create Response
 * Response structure for SRC-20 token creation operations
 */
export interface SRC20CreateResponse {
  hex?: string;
  est_tx_size?: number;
  input_value?: number;
  total_dust_value?: number;
  est_miner_fee?: number;
  fee?: number;
  change_value?: number;
  inputsToSign?: Array<
    { index: number; address: string; sighashType?: number }
  >;
  sourceAddress?: string;
  changeAddress?: string;
  feeDetails?: any;
  cpid?: string;
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
