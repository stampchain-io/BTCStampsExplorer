import type { UTXOFetchOptions } from "./services.d.ts";
export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  script: string;
  address?: string; // Optional address field for convenience
  ancestorCount?: number;
  ancestorSize?: number;
  ancestorFees?: number;
  ancestor?: AncestorInfo;
  vsize?: number;
  weight?: number;
  scriptType?: string;
  scriptDesc?: string;
  witness?: string[];
  coinbase?: boolean;
  confirmations?: number; // Optional confirmations field
  ancestors?: any[]; // Optional ancestors array for compatibility
  rawTxHex?: string; // Optional raw transaction hex for non-witness UTXOs
  redeemScript?: string; // Optional redeem script for P2SH inputs
}

export type BasicUTXO = Pick<UTXO, "txid" | "vout" | "value">;

export interface AncestorInfo {
  fees: number;
  vsize: number;
  effectiveRate: number;
  txid?: string;
  vout?: number;
  weight?: number;
  size?: number; // Raw size in bytes
  scriptType?: string; // Type of input script
  witness?: string[]; // Witness data of ancestor
  sequence?: number; // Sequence number (useful for RBF)
  blockHeight?: number; // Height when confirmed
  confirmations?: number; // Number of confirmations
}

export interface TransactionInput {
  type: ScriptType;
  isWitness: boolean;
  size: number;
  ancestor?: AncestorInfo;
}

export interface TransactionOutput {
  type: ScriptType;
  value: number;
  isWitness: boolean;
  size: number;
}

export interface FeeEstimationParams {
  type: "transfer" | "stamp" | "src20" | "fairmint" | "src20-transfer";
  fileSize?: number;
  feeRate: number;
  isMultisig?: boolean;
  satsPerVB?: number;
  satsPerKB?: number;
  outputTypes?: ScriptType[];
  userAddress?: string;
}

export interface FeeEstimationResult {
  minerFee: number;
  dustValue: number;
  outputs: TransactionOutput[];
  detectedInputType: ScriptType;
  estimatedSize?: number;
}

export type ScriptType =
  | "P2PKH"
  | "P2SH"
  | "P2WPKH"
  | "P2WSH"
  | "P2TR"
  | "OP_RETURN"
  | "UNKNOWN";

export interface FeeDetails {
  minerFee: number;
  estMinerFee?: number; // Temporary compatibility for existing code
  serviceFee?: number;
  itemPrice?: number;
  totalValue: number;
  hasExactFees?: boolean;
  dustValue?: number;
  effectiveFeeRate?: number;
  estimatedSize?: number;
  totalVsize?: number;
}

export interface TransferDetails {
  address: string;
  amount: number;
  token: string;
}

// New separate interface for stamp transfers
export interface StampTransferDetails {
  address: string;
  stamp: string;
  editions: number;
}

export interface MintDetails {
  amount: number;
  token: string;
}

export interface PSBTFees extends FeeDetails {
  // Additional PSBT-specific fields if needed
  hex?: string;
  inputsToSign?: Array<{ index: number; address: string }>;
}

export interface BTCBalance {
  confirmed: number;
  unconfirmed: number;
  total?: number;
  txCount?: number;
  unconfirmedTxCount?: number;
}

// Domain and Protocol Types --------------------------------------------------

/**
 * Root domain types supported by the application
 * These represent various Bitcoin-related domain extensions
 */
export type ROOT_DOMAIN_TYPES =
  | ".btc"
  | ".sats"
  | ".xbt"
  | ".x"
  | ".pink";

/**
 * Supported subprotocols for Bitcoin stamps and tokens
 */
export type SUBPROTOCOLS =
  | "STAMP"
  | "SRC-20"
  | "SRC-721"
  | "SRC-101";

/**
 * Base handler context for various Bitcoin-related operations
 */
export interface BaseHandlerContext {
  /** The Bitcoin address associated with the handler */
  address?: string;
  /** The transaction hash */
  txHash?: string;
  /** Block height or index */
  blockHeight?: number;
  /** Timestamp of the transaction/event */
  timestamp?: number | Date;
  /** Any additional metadata or context */
  metadata?: Record<string, unknown>;
}

/**
 * Handler context for address-related operations
 */
export interface AddressHandlerContext extends BaseHandlerContext {
  /** Bitcoin address being processed */
  address: string;
  /** Balance information */
  balance?: number;
  /** Transaction count */
  txCount?: number;
}

/**
 * Handler context for block-related operations
 */
export interface BlockHandlerContext extends BaseHandlerContext {
  /** Block hash */
  blockHash: string;
  /** Previous block hash */
  previousBlockHash?: string;
  /** Mining difficulty */
  difficulty?: number;
}

/**
 * Handler context for tick-related operations
 */
export interface TickHandlerContext extends BaseHandlerContext {
  /** Tick identifier */
  tick?: string;
  /** Subprotocol context */
  subprotocol?: SUBPROTOCOLS;
}

/**
 * Handler context for identifier-related operations
 */
export interface IdentHandlerContext extends BaseHandlerContext {
  /** Unique identifier */
  ident?: string;
  /** Associated data */
  data?: Record<string, unknown>;
}

/**
 * Address tick handler context for combined address and tick operations
 */
export interface AddressTickHandlerContext
  extends AddressHandlerContext, TickHandlerContext {
  /** Combined properties from both address and tick contexts */
}

// Bitcoin Block Types --------------------------------------------------------

/**
 * Represents a Bitcoin block row from the database
 * Contains comprehensive block information including hashes and metadata
 */
export interface BlockRow {
  /** The block height/index number */
  block_index: number;
  /** The block hash */
  block_hash: string;
  /** The timestamp when the block was mined */
  block_time: number | Date;
  /** The hash of the previous block */
  previous_block_hash: string;
  /** The mining difficulty of this block */
  difficulty: number;
  /** The ledger hash for this block */
  ledger_hash: string;
  /** The transaction list hash */
  txlist_hash: string;
  /** The messages hash for this block */
  messages_hash: string;
  /** Whether this block has been indexed (always 1) */
  indexed: 1;
  /** Optional: Number of issuances in this block */
  issuances?: number;
  /** Optional: Number of sends in this block */
  sends?: number;
}

// Bitcoin Address and Wallet Types -------------------------------------------

/**
 * Bitcoin address information including balances and transaction counts
 */
export interface BtcInfo {
  /** Bitcoin address */
  address: string;
  /** Confirmed balance in satoshis */
  balance: number;
  /** Total number of transactions */
  txCount: number;
  /** Unconfirmed balance in satoshis */
  unconfirmedBalance: number;
  /** Number of unconfirmed transactions */
  unconfirmedTxCount: number;
}

/**
 * Comprehensive wallet data types for wallet integrations
 */
export interface WalletDataTypes {
  /** Array of account addresses */
  accounts: string[];
  /** Primary wallet address */
  address: string;
  /** Public key of the wallet */
  publicKey: string;
  /** Bitcoin balance breakdown */
  btcBalance: {
    /** Confirmed balance */
    confirmed: number;
    /** Unconfirmed balance */
    unconfirmed: number;
    /** Total balance (confirmed + unconfirmed) */
    total: number;
  };
  /** Network type */
  network: "mainnet" | "testnet";
  /** Wallet provider name */
  provider: string;
}

// Counterparty (XCP) Types ---------------------------------------------------

/**
 * Parameters for Counterparty (XCP) protocol operations
 * Used for asset issuance, transfers, and other XCP transactions
 */
export interface XCPParams {
  /** Optional filters for querying */
  filters?: {
    field: string;
    op: string;
    value: string;
  }[];
  /** Bitcoin address */
  address?: string;
  /** Asset name */
  asset?: string;
  /** Source address */
  source?: string;
  /** Quantity of the asset */
  quantity?: number | string;
  /** Whether the asset is divisible */
  divisible?: boolean;
  /** Whether to lock the issuance */
  lock?: boolean;
  /** Asset description */
  description?: string;
  /** Whether to reset the asset */
  reset?: boolean;
  /** Allow unconfirmed inputs in transactions */
  allow_unconfirmed_inputs?: boolean;
  /** Include extended transaction information */
  extended_tx_info?: boolean;
  /** Disable UTXO locks */
  disable_utxo_locks?: boolean;
  /** Fee per kilobyte in satoshis */
  fee_per_kb?: number;
}

// Configuration Types --------------------------------------------------------

/**
 * Application configuration for minting services
 */
export interface Config {
  /** Whether minting service fee is enabled */
  MINTING_SERVICE_FEE_ENABLED: boolean;
  /** The minting service fee amount */
  MINTING_SERVICE_FEE: string | null;
  /** The address to receive minting service fees */
  MINTING_SERVICE_FEE_ADDRESS: string | null;
}

/**
 * CommonUTXOFetchOptions - Migrated from server/services/utxo/commonUtxoService.ts
 */
interface CommonUTXOFetchOptions extends UTXOFetchOptions {
  forcePublicAPI?: boolean;
}

// ============================================================================
// FEE CALCULATOR COMPONENT PROPS
// ============================================================================

/**
 * Base fee calculator props interface
 */
export interface BaseFeeCalculatorProps {
  fee?: number;
  handleChangeFee?: (fee: number) => void;
  BTCPrice?: number;
  isSubmitting?: boolean;
  onSubmit?: () => void;
  onCancel?: () => void;
  buttonName?: string;
  className?: string;
  showCoinToggle?: boolean;
  tosAgreed?: boolean;
  onTosChange?: (agreed: boolean) => void;
  feeDetails?: FeeDetails;
  mintDetails?: MintDetails;
  isModal?: boolean;
  disabled?: boolean;
  cancelText?: string;
  confirmText?: string;
  type?: string;
  fileType?: string;
  fileSize?: number;
  issuance?: string;
  bitname?: string;
}

/**
 * Extended fee calculator props interface
 */
export interface ExtendedBaseFeeCalculatorProps extends BaseFeeCalculatorProps {
  amount?: number;
  receive?: number;
  fromPage?: string;
  price?: number;
  edition?: number;
  ticker?: string;
  limit?: number;
  supply?: number;
  src20TransferDetails?: {
    address: string;
    token: string;
    amount: number;
  };
  stampTransferDetails?: {
    address: string;
    stamp: string;
    editions: number;
  };
  dec?: number;
  maraMode?: boolean;
  maraFeeRate?: number | null;
  isLoadingMaraFee?: boolean;
  progressIndicator?: any;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * Animation state props for components with animations
 */
export interface AnimationProps {
  animate?: boolean;
  duration?: number;
  delay?: number;
  easing?: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear";
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
}

/**
 * Async state props for components handling async operations
 */
export interface AsyncStateProps {
  loading?: boolean;
  error?: string | Error | null;
  data?: any;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

/**
 * Loading state props
 */
export interface LoadingStateProps {
  isLoading: boolean;
  loadingText?: string;
  showSpinner?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Empty state props for when no data is available
 */
export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
  showIcon?: boolean;
}

/**
 * Error state props for error handling
 */
export interface ErrorStateProps {
  error: string | Error;
  title?: string;
  description?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Transition props for component transitions
 */
export interface TransitionProps {
  show?: boolean;
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
  duration?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make specific keys of T optional
 */
export type PartialKeys<T, K extends keyof T> =
  & Omit<T, K>
  & Partial<Pick<T, K>>;

/**
 * Make specific keys of T required
 */
export type RequiredKeys<T, K extends keyof T> =
  & Omit<T, K>
  & Required<Pick<T, K>>;
