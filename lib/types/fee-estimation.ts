/**
 * Progressive Fee Estimation System Types
 *
 * Core TypeScript interfaces for the 3-phase progressive fee estimation system:
 * - Phase 1: Instant mathematical estimates
 * - Phase 2: Smart UTXO-based estimates with caching
 * - Phase 3: Exact transaction construction
 *
 * @author BTCStampsExplorer Team
 * @version 1.0.0
 */

import type { BasicUTXO, FeeDetails } from "./base.d.ts";

// ===== CORE UTXO INTERFACES =====

/**
 * Detailed UTXO with ancestor information for exact fee calculation
 * Extends BasicUTXO with additional data needed for transaction construction
 */
export interface DetailedUTXO extends BasicUTXO {
  /** Number of confirmations for this UTXO */
  confirmations: number;
  /** Block height when this UTXO was created */
  blockHeight: number;
  /** Script type (P2WPKH, P2SH, P2PKH, etc.) */
  scriptType: string;
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
 * UTXO Cache entry with TTL and access tracking
 */
export interface UTXOCache {
  /** Wallet address this cache belongs to */
  walletAddress: string;
  /** Cached UTXO data */
  utxos: BasicUTXO[];
  /** Cache creation timestamp */
  timestamp: number;
  /** Time-to-live in milliseconds (default: 30 seconds) */
  ttl: number;
  /** Number of times this cache has been accessed */
  accessCount: number;
  /** Last access timestamp for LRU eviction */
  lastAccessed: number;
}

// ===== FEE ESTIMATION INTERFACES =====

/**
 * Enhanced fee estimation result with phase information
 * Extends the existing FeeDetails interface
 */
export interface ProgressiveFeeEstimationResult extends FeeDetails {
  /** Which estimation phase produced this result */
  phase: "instant" | "cached" | "exact";
  /** Whether this came from cache */
  cacheHit?: boolean;
  /** Time taken for this estimation in milliseconds */
  estimationTime?: number;
  /** Timestamp when this result was generated */
  timestamp?: number;
  /** Confidence level (0-100) */
  confidence?: number;
  /** Selected UTXOs for this estimation (Phase 2/3 only) */
  selectedUtxos?: BasicUTXO[] | DetailedUTXO[];
  /** Transaction size breakdown */
  sizeBreakdown?: {
    inputs: number;
    outputs: number;
    overhead: number;
    witness: number;
  };
}

/**
 * Tool-specific parameters for fee estimation
 */
export interface ToolEstimationParams {
  /** Tool type identifier */
  toolType:
    | "stamp"
    | "src20-mint"
    | "src20-deploy"
    | "src20-transfer"
    | "send"
    | "src101-create";
  /** Fee rate in sat/vB */
  feeRate: number;
  /** User's wallet address */
  walletAddress?: string;
  /** Whether wallet is connected */
  isConnected: boolean;
  /** Whether a transaction is currently being submitted */
  isSubmitting?: boolean;

  // Tool-specific parameters (optional based on tool type)
  /** File data for stamp creation */
  file?: string;
  /** Filename for stamp creation */
  filename?: string;
  /** Quantity/issuance amount */
  quantity?: number;
  /** Whether asset is locked */
  locked?: boolean;
  /** Whether asset is divisible */
  divisible?: boolean;
  /** For POSH stamps */
  isPoshStamp?: boolean;
  /** Asset name for custom stamps */
  assetName?: string;
  /** Service fee configuration */
  service_fee?: string | null;
  /** Service fee address */
  service_fee_address?: string | null;

  // SRC-20 specific parameters
  /** Token ticker */
  ticker?: string;
  /** Token supply */
  supply?: number;
  /** Mint limit per transaction */
  limit?: number;
  /** Number of decimal places */
  decimals?: number;
  /** Token description */
  description?: string;

  // Transfer specific parameters
  /** Recipient address */
  recipientAddress?: string;
  /** Transfer amount */
  amount?: number;
  /** Asset to transfer */
  asset?: string;
}

/**
 * Progressive fee estimation options and configuration
 */
export interface ProgressiveFeeEstimationOptions {
  /** Phase 1: Instant estimation timeout (default: 100ms) */
  instantTimeout: number;
  /** Phase 2: Cached estimation timeout (default: 2000ms) */
  cachedTimeout: number;
  /** Phase 3: Exact estimation timeout (default: 10000ms) */
  exactTimeout: number;

  /** Whether to enable Phase 2 caching */
  enableCaching: boolean;
  /** Cache TTL in milliseconds (default: 30000ms) */
  cacheTtl: number;
  /** Maximum cache size per wallet (default: 1000 UTXOs) */
  maxCacheSize: number;

  /** Whether to pre-fetch Phase 2 data in background */
  enablePreFetch: boolean;
  /** Debounce delay for pre-fetching (default: 2000ms) */
  preFetchDebounce: number;

  /** Callback functions for phase completion */
  onPhaseComplete?: (
    phase: "instant" | "cached" | "exact",
    result: ProgressiveFeeEstimationResult,
  ) => void;
  /** Error callback */
  onError?: (error: Error, phase?: "instant" | "cached" | "exact") => void;

  /** Enable debug logging */
  debug?: boolean;
}

// ===== CACHE MANAGEMENT INTERFACES =====

/**
 * Cache statistics for monitoring and optimization
 */
export interface CacheStats {
  /** Total number of cache entries */
  totalEntries: number;
  /** Total number of cached UTXOs across all wallets */
  totalUtxos: number;
  /** Cache hit rate (0-1) */
  hitRate: number;
  /** Average cache age in milliseconds */
  averageAge: number;
  /** Memory usage estimate in bytes */
  estimatedMemoryUsage: number;
  /** Number of cache evictions due to TTL */
  ttlEvictions: number;
  /** Number of cache evictions due to LRU */
  lruEvictions: number;
}

/**
 * Cache manager configuration
 */
export interface CacheManagerConfig {
  /** Maximum number of wallet caches to maintain */
  maxWallets: number;
  /** Maximum UTXOs per wallet cache */
  maxUtxosPerWallet: number;
  /** Default TTL for cache entries */
  defaultTtl: number;
  /** Cleanup interval for expired entries */
  cleanupInterval: number;
  /** Enable LRU eviction when limits are reached */
  enableLruEviction: boolean;
  /** Enable automatic cleanup of expired entries */
  enableAutoCleanup: boolean;
}

// ===== ERROR INTERFACES =====

/**
 * Progressive fee estimation specific errors
 */
export interface FeeEstimationError extends Error {
  /** Which phase the error occurred in */
  phase?: "instant" | "cached" | "exact";
  /** Error code for programmatic handling */
  code:
    | "TIMEOUT"
    | "NETWORK_ERROR"
    | "VALIDATION_ERROR"
    | "CACHE_ERROR"
    | "UTXO_ERROR"
    | "UNKNOWN";
  /** Original error if this wraps another error */
  originalError?: Error;
  /** Additional context data */
  context?: Record<string, unknown>;
}

// ===== TYPE UTILITIES =====

/**
 * Tool type union for type safety
 */
export type ToolType = ToolEstimationParams["toolType"];

/**
 * Estimation phase union for type safety
 */
export type EstimationPhase = "instant" | "cached" | "exact";

/**
 * Cache operation result
 */
export type CacheResult<T> = {
  success: true;
  data: T;
  fromCache: boolean;
} | {
  success: false;
  error: string;
  fromCache: false;
};

/**
 * UTXO selection strategy
 */
export type UtxoSelectionStrategy =
  | "optimal"
  | "largest-first"
  | "smallest-first"
  | "random";
