// lib/types/transaction.d.ts - Transaction Processing Types Module
//
// This module contains all transaction-related types including Bitcoin transaction data,
// transaction processing states, validation, and API response types.
//
// Dependencies:
// - BlockRow, SUBPROTOCOLS from "./base.d.ts"
// - StampRow from "./stamp.d.ts"

// Import required base types
import type { BlockRow, ScriptType } from "./base.d.ts";
import type { StampRow } from "./stamp.d.ts";

// Re-export ScriptType for convenience
export type { ScriptType };

// Bitcoin Transaction Script and Size Estimation Types -----------------------

export interface ScriptTypeInfo {
  type: ScriptType;
  isWitness: boolean;
  size: number;
  redeemScriptType?: ScriptTypeInfo;
}

export interface InputTypeForSizeEstimation {
  type: ScriptType;
  isWitness?: boolean;
  redeemScriptType?: ScriptType;
}

export interface OutputTypeForSizeEstimation {
  type: ScriptType;
}

export interface Output {
  script?: string;
  address?: string;
  value: number;
}

// Transaction Data Types ------------------------------------------------------

/**
 * Represents a send transaction between addresses
 * Contains source, destination, and transaction metadata
 */
export interface SendRow {
  /** Source address of the send */
  source: string;
  /** Destination address of the send */
  destination: string;
  /** Counterparty asset ID (if applicable) */
  cpid: string | null;
  /** SRC-20 tick name (if applicable) */
  tick: string | null;
  /** Transaction memo/description */
  memo: string;
  /** Quantity being sent (string or bigint for precision) */
  quantity: string | bigint;
  /** Transaction hash */
  tx_hash: string;
  /** Block index where transaction was confirmed */
  block_index: number;
  /** Satoshi rate at time of transaction */
  satoshirate: number | null;
  /** Block timestamp */
  block_time: Date;
}

/**
 * Complete block information including associated transactions
 * Aggregates block data with issuances and sends for comprehensive view
 */
export interface BlockInfo {
  /** Basic block information */
  block_info: BlockRow;
  /** All stamp/asset issuances in this block */
  issuances: StampRow[];
  /** All send transactions in this block */
  sends: SendRow[];
}

// Transaction API Response Types ----------------------------------------------

// NOTE: BlockInfoResponseBody moved to api.d.ts to eliminate duplication
// Import from api.d.ts: BlockInfoResponseBody

// Transaction Creation and Processing Types -----------------------------------

/**
 * Transaction result from PSBT creation
 * Contains the hex-encoded PSBT and fee information
 */
export interface TX {
  /** Partially Signed Bitcoin Transaction in hex format */
  psbtHex: string;
  /** Transaction fee in satoshis */
  fee: number;
  /** Change amount in satoshis */
  change: number;
}

/**
 * Transaction error response
 * Used when transaction creation or processing fails
 */
export interface TXError {
  /** Error message describing what went wrong */
  error: string;
}

/**
 * Input data for minting stamp transactions
 * Contains all parameters needed to create a stamp mint transaction
 */
export interface MintStampInputData {
  /** Source wallet address for the mint */
  sourceWallet: string;
  /** Optional custom name for the asset */
  assetName?: string;
  /** Quantity to mint */
  qty: number;
  /** Whether the asset should be locked after minting */
  locked: boolean;
  /** Whether the asset is divisible */
  divisible: boolean;
  /** Filename of the stamp content */
  filename: string;
  /** File content (base64 encoded or file data) */
  file: string;
  /** Fee rate in satoshis per kilobyte */
  satsPerKB: number;
  /** Service fee amount in satoshis */
  service_fee: number;
  /** Address to receive the service fee */
  service_fee_address: string;
}
