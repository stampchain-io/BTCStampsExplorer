/**
 * Unified Transaction Fee Estimator
 *
 * Provides consistent client-side fee estimation for all Bitcoin transaction types
 * used across the BTC Stamps Explorer application.
 */

export interface TransactionOutput {
  type: "P2WPKH" | "P2SH" | "P2PKH" | "OP_RETURN" | "MULTISIG";
  value: number;
  script?: string;
}

export interface FeeEstimate {
  estMinerFee: number;
  totalDustValue: number;
  totalValue: number;
  hasExactFees: boolean;
  est_tx_size: number;
  transactionType: string;
  estimationMethod:
    | "client_side_calculation"
    | "mempool_api"
    | "cached"
    | "fallback";
  priority?: FeePriority;
  feeRate?: number;
}

export type FeePriority = "economy" | "standard" | "priority" | "urgent";

export interface FeeRateData {
  economy: number; // ~1 hour
  standard: number; // ~30 minutes
  priority: number; // ~10 minutes
  urgent: number; // ~5 minutes
  timestamp: number;
  source: string;
}

export interface FeeEstimationError {
  type:
    | "NetworkError"
    | "ValidationError"
    | "InsufficientDataError"
    | "APIError";
  message: string;
  details?: unknown;
}

/**
 * Transaction size constants for different Bitcoin transaction types
 * These are empirically derived averages based on actual transaction patterns
 */
export const TRANSACTION_SIZE_CONSTANTS = {
  // Stamp creation (~321 bytes average)
  STAMP: 321,

  // Fairmint transactions (~250 bytes average)
  FAIRMINT: 250,

  // SRC-20 transactions (~280 bytes average)
  SRC20: 280,

  // SRC-101 transactions (~300 bytes average)
  SRC101: 300,

  // Base transaction overhead
  BASE_TX_SIZE: 10,

  // Input sizes (bytes)
  P2WPKH_INPUT: 68,
  P2SH_INPUT: 91,
  P2PKH_INPUT: 148,

  // Output sizes (bytes)
  P2WPKH_OUTPUT: 31,
  P2SH_OUTPUT: 32,
  P2PKH_OUTPUT: 34,
  OP_RETURN_OUTPUT: 43, // Base size + typical data
  MULTISIG_OUTPUT: 71,
} as const;

/**
 * Dust limits for different output types (in satoshis)
 */
export const DUST_LIMITS = {
  P2WPKH: 294,
  P2SH: 540,
  P2PKH: 546,
  OP_RETURN: 0,
  MULTISIG: 546,
} as const;

/**
 * Default fee rates for different priorities (sat/vB)
 * Used as fallback when API sources are unavailable
 */
export const DEFAULT_FEE_RATES: Record<FeePriority, number> = {
  economy: 1,
  standard: 5,
  priority: 15,
  urgent: 30,
} as const;

/**
 * Fee estimation cache with TTL
 */
class FeeRateCache {
  private cache: FeeRateData | null = null;
  private readonly TTL = 30000; // 30 seconds

  set(data: FeeRateData): void {
    this.cache = { ...data, timestamp: Date.now() };
  }

  get(): FeeRateData | null {
    if (!this.cache) return null;

    const age = Date.now() - this.cache.timestamp;
    if (age > this.TTL) {
      this.cache = null;
      return null;
    }

    return this.cache;
  }

  clear(): void {
    this.cache = null;
  }

  isValid(): boolean {
    return this.get() !== null;
  }
}

export class TransactionFeeEstimator {
  private static feeCache = new FeeRateCache();
  private static pendingRequests = new Map<string, Promise<FeeRateData>>();

  /**
   * Fetch current fee rates from multiple sources with fallback
   */
  static async getFeeRates(): Promise<FeeRateData> {
    // Check cache first
    const cached = this.feeCache.get();
    if (cached) {
      return cached;
    }

    // Prevent duplicate requests
    const cacheKey = "fee_rates";
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    const request = this.fetchFeeRatesWithFallback();
    this.pendingRequests.set(cacheKey, request);

    try {
      const result = await request;
      this.feeCache.set(result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Fetch fee rates with multiple source fallback
   */
  private static async fetchFeeRatesWithFallback(): Promise<FeeRateData> {
    const sources = [
      () => this.fetchFromMempoolSpace(),
      () => this.fetchFromBlockstream(),
      () => this.createFallbackRates(),
    ];

    for (const source of sources) {
      try {
        const result = await source();
        if (this.validateFeeRates(result)) {
          return result;
        }
      } catch (error) {
        console.warn("Fee rate source failed:", error);
        continue;
      }
    }

    // Final fallback
    return this.createFallbackRates();
  }

  /**
   * Fetch fee rates from mempool.space API
   */
  private static async fetchFromMempoolSpace(): Promise<FeeRateData> {
    const response = await fetch(
      "https://mempool.space/api/v1/fees/recommended",
      {
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) {
      throw new Error(`Mempool API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      economy: data.hourFee || DEFAULT_FEE_RATES.economy,
      standard: data.halfHourFee || DEFAULT_FEE_RATES.standard,
      priority: data.fastestFee || DEFAULT_FEE_RATES.priority,
      urgent: Math.max(data.fastestFee * 1.5, DEFAULT_FEE_RATES.urgent),
      timestamp: Date.now(),
      source: "mempool.space",
    };
  }

  /**
   * Fetch fee rates from blockstream API
   */
  private static async fetchFromBlockstream(): Promise<FeeRateData> {
    const response = await fetch("https://blockstream.info/api/fee-estimates", {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Blockstream API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      economy: data["144"] || DEFAULT_FEE_RATES.economy,
      standard: data["6"] || DEFAULT_FEE_RATES.standard,
      priority: data["3"] || DEFAULT_FEE_RATES.priority,
      urgent: data["1"] || DEFAULT_FEE_RATES.urgent,
      timestamp: Date.now(),
      source: "blockstream.info",
    };
  }

  /**
   * Create fallback fee rates
   */
  private static createFallbackRates(): FeeRateData {
    return {
      ...DEFAULT_FEE_RATES,
      timestamp: Date.now(),
      source: "fallback",
    };
  }

  /**
   * Validate fee rate data
   */
  private static validateFeeRates(rates: FeeRateData): boolean {
    return (
      typeof rates.economy === "number" && rates.economy > 0 &&
      typeof rates.standard === "number" && rates.standard > 0 &&
      typeof rates.priority === "number" && rates.priority > 0 &&
      typeof rates.urgent === "number" && rates.urgent > 0 &&
      rates.standard >= rates.economy &&
      rates.priority >= rates.standard &&
      rates.urgent >= rates.priority
    );
  }

  /**
   * Get fee rate for specific priority
   */
  static async getFeeRate(priority: FeePriority = "standard"): Promise<number> {
    try {
      const rates = await this.getFeeRates();
      return rates[priority];
    } catch (error) {
      console.warn("Failed to get live fee rates, using fallback:", error);
      return DEFAULT_FEE_RATES[priority];
    }
  }

  /**
   * Estimate fees for stamp creation transactions
   */
  static async estimateStampFees(
    priority: FeePriority = "standard",
    editions?: number,
  ): Promise<FeeEstimate> {
    const feeRate = await this.getFeeRate(priority);

    // For large stamps with many outputs, scale the transaction size
    const baseSize = TRANSACTION_SIZE_CONSTANTS.STAMP;
    const outputCount = editions || 1;

    // Each additional output adds ~31 bytes for P2WPKH
    const scaledSize = outputCount > 1000
      ? baseSize + (outputCount * 0.5) // Rough scaling for large batches
      : baseSize;

    const estMinerFee = Math.ceil(scaledSize * feeRate);
    const totalDustValue = 333; // Standard stamp dust value

    return {
      estMinerFee,
      totalDustValue,
      totalValue: estMinerFee + totalDustValue,
      hasExactFees: false,
      est_tx_size: Math.ceil(scaledSize),
      transactionType: "stamp",
      estimationMethod: this.feeCache.isValid() ? "mempool_api" : "fallback",
      priority,
      feeRate,
    };
  }

  /**
   * Estimate fees for SRC-20 transactions
   */
  static async estimateSRC20Fees(
    priority: FeePriority = "standard",
  ): Promise<FeeEstimate> {
    const feeRate = await this.getFeeRate(priority);
    const txSize = TRANSACTION_SIZE_CONSTANTS.SRC20;
    const estMinerFee = Math.ceil(txSize * feeRate);
    const totalDustValue = 333; // SRC-20 dust value

    return {
      estMinerFee,
      totalDustValue,
      totalValue: estMinerFee + totalDustValue,
      hasExactFees: false,
      est_tx_size: txSize,
      transactionType: "src20",
      estimationMethod: this.feeCache.isValid() ? "mempool_api" : "fallback",
      priority,
      feeRate,
    };
  }

  /**
   * Estimate fees for fairmint transactions
   */
  static async estimateFairmintFees(
    priority: FeePriority = "standard",
  ): Promise<FeeEstimate> {
    const feeRate = await this.getFeeRate(priority);
    const txSize = TRANSACTION_SIZE_CONSTANTS.FAIRMINT;
    const estMinerFee = Math.ceil(txSize * feeRate);
    const totalDustValue = 546; // Standard P2WPKH dust

    return {
      estMinerFee,
      totalDustValue,
      totalValue: estMinerFee + totalDustValue,
      hasExactFees: false,
      est_tx_size: txSize,
      transactionType: "fairmint",
      estimationMethod: this.feeCache.isValid() ? "mempool_api" : "fallback",
      priority,
      feeRate,
    };
  }

  /**
   * Estimate fees for SRC-101 transactions
   */
  static async estimateSRC101Fees(
    priority: FeePriority = "standard",
  ): Promise<FeeEstimate> {
    const feeRate = await this.getFeeRate(priority);
    const txSize = TRANSACTION_SIZE_CONSTANTS.SRC101;
    const estMinerFee = Math.ceil(txSize * feeRate);
    const totalDustValue = 546; // Standard P2WPKH dust

    return {
      estMinerFee,
      totalDustValue,
      totalValue: estMinerFee + totalDustValue,
      hasExactFees: false,
      est_tx_size: txSize,
      transactionType: "src101",
      estimationMethod: this.feeCache.isValid() ? "mempool_api" : "fallback",
      priority,
      feeRate,
    };
  }

  /**
   * Estimate fees for stamp/asset transfer transactions
   */
  static async estimateTransferFees(
    priority: FeePriority = "standard",
  ): Promise<FeeEstimate> {
    const feeRate = await this.getFeeRate(priority);

    // Transfer transactions are typically smaller than minting
    // Usually 1 input + 2 outputs (recipient + change)
    const baseSize = TRANSACTION_SIZE_CONSTANTS.BASE_TX_SIZE;
    const inputSize = TRANSACTION_SIZE_CONSTANTS.P2WPKH_INPUT;
    const outputSize = TRANSACTION_SIZE_CONSTANTS.P2WPKH_OUTPUT * 2; // recipient + change

    const txSize = baseSize + inputSize + outputSize;
    const estMinerFee = Math.ceil(txSize * feeRate);
    const totalDustValue = 0; // Transfers don't typically have dust outputs

    return {
      estMinerFee,
      totalDustValue,
      totalValue: estMinerFee + totalDustValue,
      hasExactFees: false,
      est_tx_size: txSize,
      transactionType: "transfer",
      estimationMethod: this.feeCache.isValid() ? "mempool_api" : "fallback",
      priority,
      feeRate,
    };
  }

  /**
   * Generic fee estimation based on outputs
   * Fallback method for custom transaction structures
   */
  static async estimateCustomTransactionFees(
    outputs: TransactionOutput[],
    priority: FeePriority = "standard",
    inputCount: number = 1,
  ): Promise<FeeEstimate> {
    const feeRate = await this.getFeeRate(priority);

    // Calculate transaction size
    let txSize = TRANSACTION_SIZE_CONSTANTS.BASE_TX_SIZE;

    // Add input sizes (assume P2WPKH for simplicity)
    txSize += inputCount * TRANSACTION_SIZE_CONSTANTS.P2WPKH_INPUT;

    // Add output sizes
    for (const output of outputs) {
      switch (output.type) {
        case "P2WPKH":
          txSize += TRANSACTION_SIZE_CONSTANTS.P2WPKH_OUTPUT;
          break;
        case "P2SH":
          txSize += TRANSACTION_SIZE_CONSTANTS.P2SH_OUTPUT;
          break;
        case "P2PKH":
          txSize += TRANSACTION_SIZE_CONSTANTS.P2PKH_OUTPUT;
          break;
        case "OP_RETURN":
          txSize += TRANSACTION_SIZE_CONSTANTS.OP_RETURN_OUTPUT;
          break;
        case "MULTISIG":
          txSize += TRANSACTION_SIZE_CONSTANTS.MULTISIG_OUTPUT;
          break;
      }
    }

    const estMinerFee = Math.ceil(txSize * feeRate);

    // Calculate total dust value
    const totalDustValue = outputs.reduce((sum, output) => {
      if (output.type === "OP_RETURN") return sum;
      const dustLimit = DUST_LIMITS[output.type] || DUST_LIMITS.P2WPKH;
      return sum + Math.max(output.value, dustLimit);
    }, 0);

    return {
      estMinerFee,
      totalDustValue,
      totalValue: estMinerFee + totalDustValue,
      hasExactFees: false,
      est_tx_size: txSize,
      transactionType: "custom",
      estimationMethod: this.feeCache.isValid() ? "mempool_api" : "fallback",
      priority,
      feeRate,
    };
  }

  /**
   * Get transaction type-specific estimation method
   */
  static getEstimatorForType(type: string) {
    switch (type.toLowerCase()) {
      case "stamp":
      case "stamping":
        return this.estimateStampFees;
      case "src20":
      case "src-20":
        return this.estimateSRC20Fees;
      case "fairmint":
        return this.estimateFairmintFees;
      case "src101":
      case "src-101":
        return this.estimateSRC101Fees;
      case "transfer":
        return this.estimateTransferFees;
      default:
        return this.estimateCustomTransactionFees;
    }
  }

  /**
   * Validate fee estimate result
   */
  static validateEstimate(estimate: FeeEstimate): boolean {
    return (
      estimate.estMinerFee > 0 &&
      estimate.totalDustValue >= 0 &&
      estimate.totalValue > 0 &&
      estimate.est_tx_size > 0
    );
  }

  /**
   * Clear fee rate cache (useful for testing or manual refresh)
   */
  static clearCache(): void {
    this.feeCache.clear();
  }

  /**
   * Get cache status
   */
  static getCacheStatus(): { isValid: boolean; age?: number; source?: string } {
    const cached = this.feeCache.get();
    if (!cached) {
      return { isValid: false };
    }

    return {
      isValid: true,
      age: Date.now() - cached.timestamp,
      source: cached.source,
    };
  }

  // Legacy methods for backward compatibility (synchronous versions)

  /**
   * @deprecated Use estimateStampFees instead
   */
  static estimateStampFeesSync(
    feeRate: number,
    editions?: number,
  ): FeeEstimate {
    const baseSize = TRANSACTION_SIZE_CONSTANTS.STAMP;
    const outputCount = editions || 1;
    const scaledSize = outputCount > 1000
      ? baseSize + (outputCount * 0.5)
      : baseSize;

    const estMinerFee = Math.ceil(scaledSize * feeRate);
    const totalDustValue = 333;

    return {
      estMinerFee,
      totalDustValue,
      totalValue: estMinerFee + totalDustValue,
      hasExactFees: false,
      est_tx_size: Math.ceil(scaledSize),
      transactionType: "stamp",
      estimationMethod: "client_side_calculation",
      feeRate,
    };
  }

  /**
   * @deprecated Use estimateSRC20Fees instead
   */
  static estimateSRC20FeesSync(feeRate: number): FeeEstimate {
    const txSize = TRANSACTION_SIZE_CONSTANTS.SRC20;
    const estMinerFee = Math.ceil(txSize * feeRate);
    const totalDustValue = 333;

    return {
      estMinerFee,
      totalDustValue,
      totalValue: estMinerFee + totalDustValue,
      hasExactFees: false,
      est_tx_size: txSize,
      transactionType: "src20",
      estimationMethod: "client_side_calculation",
      feeRate,
    };
  }

  /**
   * @deprecated Use estimateFairmintFees instead
   */
  static estimateFairmintFeesSync(feeRate: number): FeeEstimate {
    const txSize = TRANSACTION_SIZE_CONSTANTS.FAIRMINT;
    const estMinerFee = Math.ceil(txSize * feeRate);
    const totalDustValue = 546;

    return {
      estMinerFee,
      totalDustValue,
      totalValue: estMinerFee + totalDustValue,
      hasExactFees: false,
      est_tx_size: txSize,
      transactionType: "fairmint",
      estimationMethod: "client_side_calculation",
      feeRate,
    };
  }

  /**
   * @deprecated Use estimateSRC101Fees instead
   */
  static estimateSRC101FeesSync(feeRate: number): FeeEstimate {
    const txSize = TRANSACTION_SIZE_CONSTANTS.SRC101;
    const estMinerFee = Math.ceil(txSize * feeRate);
    const totalDustValue = 546;

    return {
      estMinerFee,
      totalDustValue,
      totalValue: estMinerFee + totalDustValue,
      hasExactFees: false,
      est_tx_size: txSize,
      transactionType: "src101",
      estimationMethod: "client_side_calculation",
      feeRate,
    };
  }

  /**
   * @deprecated Use estimateTransferFees instead
   */
  static estimateTransferFeesSync(feeRate: number): FeeEstimate {
    const baseSize = TRANSACTION_SIZE_CONSTANTS.BASE_TX_SIZE;
    const inputSize = TRANSACTION_SIZE_CONSTANTS.P2WPKH_INPUT;
    const outputSize = TRANSACTION_SIZE_CONSTANTS.P2WPKH_OUTPUT * 2;

    const txSize = baseSize + inputSize + outputSize;
    const estMinerFee = Math.ceil(txSize * feeRate);
    const totalDustValue = 0;

    return {
      estMinerFee,
      totalDustValue,
      totalValue: estMinerFee + totalDustValue,
      hasExactFees: false,
      est_tx_size: txSize,
      transactionType: "transfer",
      estimationMethod: "client_side_calculation",
      feeRate,
    };
  }
}
