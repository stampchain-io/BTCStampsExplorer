/**
 * SRC-101 Protocol Type Definitions
 *
 * This module contains all type definitions for the SRC-101 NFT protocol
 * built on top of Bitcoin Stamps. SRC-101 is the NFT standard for Bitcoin
 * that enables the creation, transfer, and management of non-fungible tokens.
 *
 * @version 1.0.0
 * @see https://github.com/hydren1/SRC-101
 */

import type { TransactionOptions } from "$types/base.d.ts";

// =============================================================================
// SRC-101 Protocol Operations
// =============================================================================

/**
 * Available operations in the SRC-101 protocol
 */
export type SRC101Operation =
  | "deploy"
  | "mint"
  | "transfer"
  | "setrecord"
  | "renew";

/**
 * Input data structure for SRC-101 protocol operations
 * Contains all possible parameters for various SRC-101 operations
 */
export interface SRC101InputData {
  /** The operation type to perform */
  op: SRC101Operation;

  // Address Configuration
  /** Source address for the operation */
  sourceAddress: string;
  /** Destination address for transfers */
  toAddress?: string;
  /** Source address for transfers */
  fromAddress?: string;
  /** Record address for setrecord operations */
  recAddress?: string;
  /** Change address for transaction outputs */
  changeAddress: string;

  // Token Configuration
  /** Root token identifier */
  root?: string;
  /** Token name */
  name?: string;
  /** Limit for minting */
  lim?: number;
  /** Owner address */
  owner?: string;
  /** Record data */
  rec?: string[];
  /** Token ticker symbol */
  tick?: string;
  /** Priority data (JSON) */
  pri?: JSON;
  /** Token description */
  desc?: string;

  // Minting Configuration
  /** Minting start time */
  mintstart?: number;
  /** Minting end time */
  mintend?: number;
  /** Whitelist addresses */
  wla?: string;
  /** Image large preview URL */
  imglp?: string;
  /** Image file URL */
  imgf?: string;
  /** Image duration for animations */
  idua?: number;

  // Transfer Configuration
  /** Deploy hash identifier */
  hash?: string;
  /** Destination address for transfers */
  toaddress?: string;
  /** Token ID(s) for operations */
  tokenid?: string[] | string;
  /** Duration parameter */
  dua?: number;
  /** Primary identifier */
  prim?: string;
  /** Signature data */
  sig?: string;
  /** Image data */
  img?: string[] | string;
  /** Coefficient parameter */
  coef?: number;
  /** Type specification */
  type?: string;
  /** Additional arbitrary data */
  data?: Record<string, any>;

  // Fee Configuration
  /** Fee rate in sats/vB */
  feeRate: number;

  // Social Media Links
  /** Website URL */
  web?: string;
  /** Email contact */
  email?: string;
  /** Telegram handle */
  tg?: string;
  /** Extended description */
  description?: string;
  /** Twitter/X handle */
  x?: string;
}

// =============================================================================
// SRC-101 Core Data Types
// =============================================================================

/**
 * SRC-101 Balance information for a specific address and token
 * Represents ownership of SRC-101 NFTs
 */
export interface SRC101Balance {
  /** Owner address */
  address: string;
  /** Protocol identifier (should be "SRC-101") */
  p: string;
  /** Deploy transaction hash */
  deploy_hash: string;
  /** Token ID */
  tokenid: string;
  /** Token ID in UTF-8 format */
  tokenid_utf8: string;
  /** Expiration timestamp */
  expire_timestamp: number;
  /** Last update timestamp */
  last_update: number;
  /** Bitcoin address */
  address_btc: string;
  /** Ethereum address */
  address_eth: string;
  /** Text data associated with the token */
  txt_data: string;
  /** Image URL or data */
  img: string;
  /** Current owner address */
  owner: string;
}

/**
 * Detailed SRC-101 token information
 * Contains comprehensive metadata for SRC-101 NFTs
 */
export interface Src101Detail {
  /** Transaction hash */
  tx_hash: string;
  /** Block index number */
  block_index: number;
  /** Protocol identifier */
  p: string;
  /** Operation type */
  op: string;
  /** Token ticker (optional) */
  tick: string | null;
  /** Tick hash identifier */
  tick_hash: string | null;
  /** Token name */
  name: string | null;
  /** Array of token IDs */
  tokenid: string[] | null;
  /** Token ID in UTF-8 format */
  tokenid_utf8: string | null;
  /** Token description */
  description: string | null;
  /** Whitelist addresses */
  wla: string | null;
  /** Image large preview URL */
  imglp: string | null;
  /** Image file URL */
  imgf: string | null;
  /** Deploy hash */
  deploy_hash: string | null;
  /** Creator address */
  creator: string;
  /** Priority value */
  pri: number | null;
  /** Duration parameter */
  dua: number | null;
  /** Limit value */
  lim: number | null;
  /** Mint start time */
  mintstart: number | null;
  /** Mint end time */
  mintend: number | null;
  /** Owner address */
  owner: string | null;
  /** Destination address */
  toaddress: string | null;
  /** Final destination */
  destination: string;
  /** Block timestamp */
  block_time: string;
}

/**
 * SRC-101 Deployment details
 * Internal interface for deployment information
 */
interface SRC101DeployDetail {
  /** Transaction hash */
  tx_hash: string;
  /** Block index */
  block_index: number;
  /** Protocol identifier */
  p: string;
  /** Operation type */
  op: string;
  /** Token ticker */
  tick: string | null;
  /** Tick hash */
  tick_hash: string | null;
  /** Token name */
  name: string | null;
  /** Description */
  description: string | null;
  /** Whitelist addresses */
  wla: string | null;
  /** Image large preview */
  imglp: string | null;
  /** Image file */
  imgf: string | null;
  /** Creator address */
  creator: string;
  /** Priority */
  pri: number | null;
  /** Limit */
  lim: number | null;
  /** Mint start time */
  mintstart: number | null;
  /** Mint end time */
  mintend: number | null;
  /** Owner */
  owner: string | null;
  /** Block time */
  block_time: string;
  /** Recipients array */
  recipients: string[];
}

// =============================================================================
// SRC-101 Request Parameter Types
// =============================================================================

/**
 * Parameters for querying SRC-101 token IDs
 */
export interface SRC101TokenidsParams {
  /** Deploy hash to filter by */
  deploy_hash: string;
  /** Bitcoin address to filter by */
  address_btc: string;
  /** Primary filter flag */
  prim: boolean;
  /** Maximum number of results */
  limit?: number;
  /** Page number for pagination */
  page?: number;
  /** Sort order */
  sort?: string;
}

/**
 * Parameters for counting valid SRC-101 transactions
 */
export interface SRC101ValidTxTotalCountParams {
  /** Token ticker filter */
  tick?: string;
  /** Operation type filter */
  op?: string;
  /** Block index filter */
  block_index?: string;
  /** Deploy hash filter */
  deploy_hash?: string;
  /** Transaction hash filter */
  tx_hash?: string;
  /** Address filter */
  address?: string;
  /** Maximum number of results */
  limit?: number;
  /** Page number for pagination */
  page?: number;
}

/**
 * Parameters for querying SRC-101 token owners
 */
export interface SRC101OwnerParams {
  /** Deploy hash filter */
  deploy_hash?: string;
  /** Token ID filter */
  tokenid?: string;
  /** Index filter */
  index?: number;
  /** Expiration filter */
  expire?: number;
  /** Maximum number of results */
  limit?: number;
  /** Page number for pagination */
  page?: number;
  /** Sort order */
  sort?: string;
}

/**
 * Parameters for querying SRC-101 transactions
 */
export interface SRC101TxParams {
  /** Token ticker filter */
  tick?: string;
  /** Operation type filter */
  op?: string;
  /** Valid transaction filter (1 for valid, 0 for invalid) */
  valid?: number;
  /** Block index filter */
  block_index?: string;
  /** Deploy hash filter */
  deploy_hash?: string;
  /** Maximum number of results */
  limit?: number;
  /** Page number for pagination */
  page?: number;
}

/**
 * Parameters for querying valid SRC-101 transactions
 */
export interface SRC101ValidTxParams {
  /** Token ticker filter */
  tick?: string;
  /** Operation type filter */
  op?: string;
  /** Block index filter */
  block_index?: string;
  /** Deploy hash filter */
  deploy_hash?: string;
  /** Transaction hash filter */
  tx_hash?: string;
  /** Address filter */
  address?: string;
  /** Maximum number of results */
  limit?: number;
  /** Page number for pagination */
  page?: number;
}

/**
 * Parameters for querying SRC-101 balances
 */
export interface Src101BalanceParams {
  /** Address to query (null for all addresses) */
  address: string | null;
  /** Maximum number of results */
  limit?: number;
  /** Page number for pagination */
  page?: number;
  /** Sort order */
  sort?: string;
}

// =============================================================================
// SRC-101 Response Types
// =============================================================================

/**
 * Paginated response for SRC-101 details
 */
export interface PaginatedSrc101ResponseBody {
  /** Last processed block */
  last_block: number;
  /** Current page number */
  page: number;
  /** Number of results per page */
  limit: number;
  /** Total number of pages */
  totalPages: number;
  /** Array of SRC-101 details */
  data: Src101Detail[];
}

/**
 * Response body for total SRC-101 count queries
 */
export interface TotalSrc101ResponseBody {
  /** Last processed block */
  last_block: number;
  /** Total count */
  data: number;
}

/**
 * Response body for SRC-101 token ID queries
 */
export interface TokenidSrc101ResponseBody {
  /** Last processed block */
  last_block: number;
  /** Current page number */
  page: number;
  /** Number of results per page */
  limit: number;
  /** Total number of pages */
  totalPages: number;
  /** Token ID data */
  data: string;
}

// =============================================================================

/**
 * SRC101TransactionOptions - Migrated from toolEndpointAdapter.ts
 */
export interface SRC101TransactionOptions extends TransactionOptions {
  /** SRC-101 operation type */
  op: "deploy" | "mint" | "transfer";
  /** Root domain name */
  root?: string;
  /** Subdomain name */
  name?: string;
  /** Amount to transfer */
  amt?: string;
  /** Destination address (for transfer) */
  destinationAddress?: string;
}

// Legacy Compatibility Types
// =============================================================================

/**
 * @deprecated Use SRC101InputData instead
 * Legacy deployment interface for backward compatibility
 */
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
}
