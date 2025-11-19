// lib/types/transaction.d.ts - Transaction Processing Types Module
//
// This module contains all transaction-related types including Bitcoin transaction data,
// transaction processing states, validation, and API response types.
//
// Dependencies:
// - BlockRow, SUBPROTOCOLS from "./base.d.ts"
// - StampRow from "./stamp.d.ts"

// Import required base types
import type { BasicUTXO, BlockRow, ScriptType } from "$types/base.d.ts";
import type { StampRow } from "$types/stamp.d.ts";
import type { DatabaseQueryResult } from "$types/utils.d.ts";

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

// Additional Transaction-Related Types -------------------------------------------

/**
 * Dispense transaction data
 * Represents individual dispense actions from a dispenser
 */
export interface DispenseRow {
  /** Transaction hash of the dispense */
  tx_hash: string;
  /** Block index where dispense occurred */
  block_index: number;
  /** Asset being dispensed (CPID) */
  cpid: string;
  /** Source address (dispenser owner) */
  source: string;
  /** Destination address (recipient) */
  destination: string;
  /** Original dispenser transaction hash */
  dispenser_tx_hash: string;
  /** Quantity dispensed */
  dispense_quantity: number;
}

/**
 * Dispenser configuration and state
 * Represents an active or closed dispenser
 */
export interface DispenserRow {
  /** Transaction hash that created the dispenser */
  tx_hash: string;
  /** Block index where dispenser was created */
  block_index: number;
  /** Source address (dispenser owner) */
  source: string;
  /** Asset being dispensed (CPID) */
  cpid: string;
  /** Quantity given per dispense */
  give_quantity: number;
  /** Remaining quantity available */
  give_remaining: number;
  /** Total quantity in escrow */
  escrow_quantity: number;
  /** Rate in satoshis per unit */
  satoshirate: number;
  /** Rate in BTC per unit */
  btcrate: number;
  /** Original dispenser transaction */
  origin: string;
  /** Array of dispense transactions */
  dispenses: DispenseRow[];
}

/**
 * Basic pagination interface for paginated responses
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * DetailedUTXO - Migrated from fee-estimation.ts
 */
export interface DetailedUTXO extends BasicUTXO {
  /** Block height when this UTXO was created */
  blockHeight: number;
  /** Raw script public key */
  scriptPubKey: string;
  /** Witness data if applicable */
  witness?: string[];
  /** Ancestor transaction information for fee calculation */
  ancestors?: {
    count: number;
    size: number;
    fees: number;
  };
  /** Additional metadata for optimization */
  metadata?: {
    isOptimal: boolean;
    selectionPriority: number;
    estimatedInputSize: number;
  };
}

/**
 * UtxoSelectionStrategy - Migrated from fee-estimation.ts
 */
export type UtxoSelectionStrategy =
  | "largest-first"
  | "smallest-first"
  | "random"
  | "optimal";

/**
 * GetRawTx - Migrated from quicknode.d.ts
 */
export interface GetRawTx {
  (txHash: string): Promise<any>;
}

/**
 * GetDecodedTx - Migrated from quicknode.d.ts
 */
export interface GetDecodedTx {
  (txHex: string): Promise<any>;
}

/**
 * GetTransaction - Migrated from quicknode.d.ts
 */
export interface GetTransaction {
  (txHash: string): Promise<any>;
}

/**
 * UTXOFromBlockCypher - Migrated from utils.d.ts
 */
export interface UTXOFromBlockCypher {
  tx_hash: string;
  block_height: number;
  tx_input_n: number;
  tx_output_n: number;
  value: number;
  ref_balance: number;
  spent: boolean;
  confirmations: number;
  confirmed: Date;
  double_spend: boolean;
  script: string;
  size: number;
}

/**
 * UTXOFromBlockchain - Migrated from utils.d.ts
 */
export interface UTXOFromBlockchain {
  tx_hash_big_endian: string;
  tx_hash: string;
  tx_output_n: number;
  script: string;
  value: number;
  value_hex: string;
  confirmations: number;
  tx_index: number;
}

/**
 * TransactionInput - Migrated from utils.d.ts
 */
export interface TransactionInput {
  txid: string;
  vout: number;
  scriptSig: string;
  sequence: number;
  witness?: string[];
}

/**
 * TransactionOutput - Migrated from utils.d.ts
 */
export interface TransactionOutput {
  value: number;
  scriptPubKey: string;
  address?: string;
  scriptType?: ScriptType;
}

/**
 * UTXOSelectionStrategy - Migrated from utils.d.ts
 */
export type UTXOSelectionStrategy =
  | "largest-first"
  | "smallest-first"
  | "random"
  | "optimal";

/**
 * UTXOTableSchema - Migrated from server.type.test.ts
 */
export interface UTXOTableSchema {
  id: number;
  txid: string;
  vout: number;
  address: string;
  script: string;
  value: number;
  confirmations: number;
  spent: boolean;
  spent_by_txid?: string | null;
  spent_by_vin?: number | null;
  block_index: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Transaction - Migrated from server.type.test.ts
 */
export interface Transaction {
  query<T>(sql: string, params?: any[]): Promise<DatabaseQueryResult<T>>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * UTXOFixture - Migrated from utxoFixtures.ts
 */
export interface UTXOFixture {
  txid: string;
  vout: number;
  value: bigint;
  script: string; // Hex string for script buffer
  address: string;
  scriptType: "p2pkh" | "p2sh" | "p2wpkh" | "p2wsh" | "p2tr";
  witnessUtxo: {
    script: string; // Hex string for script buffer
    value: bigint;
  };
  redeemScript?: string; // Hex string for P2SH redeem script
  witnessScript?: string; // Hex string for P2WSH witness script
  blockHeight?: number;
  confirmations?: number;
  isTestnet?: boolean;
}

/**
 * UTXOTestScenario - Migrated from utxoFixtures.ts
 */
export interface UTXOTestScenario {
  name: string;
  description: string;
  utxos: UTXOFixture[];
  expectedBehavior: string;
}

/**
 * TxInfo - Migrated from utxoUtils.fixture-based.mock.ts
 */
export interface TxInfo {
  utxo?: UTXO;
  ancestor?: {
    fees: number;
    vsize: number;
    effectiveRate: number;
  };
}

/**
 * UTXO - Migrated from quicknodeUTXOService.test.ts
 */
export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  script: string;
  vsize?: number;
  ancestorCount?: number;
  ancestorSize?: number;
  ancestorFees?: number;
  weight?: number;
  scriptType?: ScriptType;
  scriptDesc?: string;
  coinbase?: boolean;
}

/**
 * UTXOOptions - Migrated from quicknodeUTXOService.test.ts
 */
export interface UTXOOptions {
  confirmedOnly?: boolean;
  includeAncestors?: boolean;
}

/**
 * QuickNodeUTXO - Migrated from quicknodeUTXOService.test.ts
 */
export interface QuickNodeUTXO {
  txid: string;
  vout: number;
  value: string;
  confirmations: number;
  height: number;
  coinbase?: boolean;
}

/**
 * ScriptUTXO - Migrated from quicknodeUTXOService.test.ts
 */
export interface ScriptUTXO extends QuickNodeUTXO {
  hex?: string;
  address?: string;
}

/**
 * TransactionInput - Migrated from StampingTool.tsx
 */
export interface TransactionInput {
  txid: string;
  vout: number;
  signingIndex: number;
}

/**
 * AssertTxHash - Migrated from typeAssertions.ts
 */
export type AssertTxHash<T> = T extends string
  ? T extends
    `${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}`
    ? T
  : never
  : never;

/**
 * MockUTXOOptions - Migrated from testFactories.ts
 */
export interface MockUTXOOptions {
  txid?: string;
  vout?: number;
  value?: bigint;
  script?: string;
  address?: string;
  scriptType?: "p2pkh" | "p2sh" | "p2wpkh" | "p2wsh" | "p2tr";
  blockHeight?: number;
  confirmations?: number;
  isTestnet?: boolean;
}

/**
 * DetailedUTXO - Migrated from TransactionConstructionService.ts
 */
export interface DetailedUTXO extends BasicUTXO {
  script: string;
  witnessData?: string;
  ancestorDetails?: {
    size: number;
    fee: number;
    count: number;
  };
}

/**
 * InternalTransactionSizeOptions - Migrated from transactionSizes.ts
 */
export interface InternalTransactionSizeOptions {
  inputs: Array<
    {
      type: ScriptType;
      isWitness?: boolean;
      size?: number;
      ancestor?: { txid: string; vout: number; weight?: number };
    }
  >;
  outputs: Array<{ type: ScriptType }>;
  includeChangeOutput?: boolean;
  changeOutputType?: ScriptType;
}

/**
 * TransactionSizeOptions - Migrated from transactionSizeEstimator.ts
 */
export interface TransactionSizeOptions {
  inputs: Array<{
    type: ScriptType;
    isWitness?: boolean;
    size?: number;
    ancestor?: { txid: string; vout: number; weight?: number };
  }>;
  outputs: Array<{ type: ScriptType }>;
  includeChangeOutput?: boolean;
  changeOutputType?: ScriptType;
}

/**
 * DummyUTXOConfig - Migrated from dummyUtxoGenerator.ts
 */
export interface DummyUTXOConfig {
  targetAmount: number;
  averageUTXOSize?: number;
  includeSmallUTXOs?: boolean;
  includeDustUTXOs?: boolean;
  scriptType?: "P2WPKH" | "P2PKH" | "P2SH";
}

/**
 * TxInfo - Migrated from utxoUtils.ts
 */
export interface TxInfo {
  utxo?: UTXO;
  ancestor?: {
    fees: number;
    vsize: number;
    effectiveRate: number;
  };
}

/**
 * UTXOWithAncestors - Migrated from [address].ts
 */
export interface UTXOWithAncestors {
  ancestorCount?: number;
  ancestorFees?: number;
  ancestorSize?: number;
}

/**
 * InternalTransactionSizeOptions - Migrated from transactionSizes.ts
 */
export interface InternalTransactionSizeOptions {
  inputs: Array<
    {
      type: ScriptType;
      isWitness?: boolean;
      size?: number;
      ancestor?: { txid: string; vout: number; weight?: number };
    }
  >;
  outputs: Array<{ type: ScriptType }>;
  includeChangeOutput?: boolean;
  changeOutputType?: ScriptType;
}

/**
 * TxInfo - Migrated from utxoUtils.ts
 */
export interface TxInfo {
  utxo?: UTXO;
  ancestor?: {
    fees: number;
    vsize: number;
    effectiveRate: number;
  };
}

/**
 * PaginationOptions - Migrated from pagination utilities
 */
export interface PaginationOptions {
  /** Current page number (1-based) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Optional prefix for pagination controls */
  prefix?: string;
  /** Optional callback for page changes */
  onPageChange?: (page: number) => void;
}

/**
 * Transaction builder interface for constructing various Bitcoin transactions
 */
export interface TransactionBuilder {
  /** Create a Partially Signed Bitcoin Transaction (PSBT) */
  createPSBT(
    utxo: string,
    amount: number,
    address: string,
  ): Promise<string>;

  /** Process an existing PSBT from a Counterparty transaction */
  processCounterpartyPSBT?(
    psbtHex: string,
    address: string,
    feeRate: number,
  ): Promise<{
    psbtHex?: string;
    estimatedFee?: number;
    estimatedVsize?: number;
  }>;
}

/**
 * Transaction construction parameters for building Bitcoin transactions
 */
export interface TransactionConstructionParams {
  /** Source address initiating the transaction */
  sourceAddress: string;
  /** Destination address for the transaction */
  destinationAddress: string;
  /** Amount to send in satoshis */
  amount: number;
  /** Optional transaction fee rate in sats/vbyte */
  feeRate?: number;
  /** Optional service fee details */
  serviceFee?: {
    amount: number;
    address: string;
  };
}

/**
 * Transaction fee estimation parameters
 */
export interface TransactionEstimateParams {
  /** Inputs to include in fee estimation */
  inputs: Array<{
    value: number;
    scriptType: ScriptType;
  }>;
  /** Outputs to include in fee estimation */
  outputs: Array<{
    value: number;
    scriptType: ScriptType;
  }>;
  /** Target fee rate in satoshis per virtual byte */
  feeRate: number;
}
