/**
 * @fileoverview Dependency-Injected QuicknodeService with abstracted dependencies
 * Enables better testing, flexibility, and maintainability
 */

import type { HttpClient } from "$server/interfaces/httpClient.ts";

// Core types and interfaces
export interface QuicknodeConfig {
  endpoint: string;
  apiKey: string;
  fallbackApiUrl?: string;
  maxRetries: number;
  retryDelay: number;
  requestTimeout: number;
}

export interface QuicknodeServiceDependencies {
  httpClient: HttpClient;
  config: QuicknodeConfig;
}

// RPC interfaces
export interface QuicknodeRPCRequest {
  id: number;
  jsonrpc: string;
  method: string;
  params: any[];
}

export interface QuicknodeRPCResponse<T = any> {
  id: number;
  jsonrpc: string;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// Fee estimation interfaces
export interface EstimateSmartFeeResponse {
  feerate?: number; // Fee rate in BTC/kB
  blocks?: number;  // Number of blocks for which estimate is valid
  errors?: string[]; // Any errors encountered
}

export interface NormalizedFeeEstimate {
  feeRateSatsPerVB: number; // Converted to sats/vB
  blocks: number;
  source: 'quicknode';
  confidence: 'high' | 'medium' | 'low';
}

export interface MultipleFeeEstimates {
  fast: NormalizedFeeEstimate | null;    // 1-2 blocks
  normal: NormalizedFeeEstimate | null;  // 6 blocks
  economy: NormalizedFeeEstimate | null; // 144 blocks
}

// Default configuration
const DEFAULT_CONFIG: Partial<QuicknodeConfig> = {
  fallbackApiUrl: "https://blockchain.info/api",
  maxRetries: 3,
  retryDelay: 1000,
  requestTimeout: (typeof Deno !== "undefined" && Deno?.env?.get("DENO_ENV") !== "production") ? 60000 : 30000,
};

export class QuicknodeServiceDI {
  private config: QuicknodeConfig;

  constructor(private dependencies: QuicknodeServiceDependencies) {
    this.config = { ...DEFAULT_CONFIG, ...dependencies.config } as QuicknodeConfig;

    // Validate required configuration
    if (!this.config.endpoint || !this.config.apiKey) {
      throw new Error("QuickNode API configuration is missing - endpoint and apiKey are required");
    }
  }

  /**
   * Execute a QuickNode RPC call with retry logic
   */
  async executeRPC<T = any>(
    method: string,
    params: any[] = [],
    customRetries?: number
  ): Promise<QuicknodeRPCResponse<T>> {
    const maxRetries = customRetries ?? this.config.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[QuicknodeServiceDI] Executing RPC: ${method}`, {
          method,
          paramsCount: params.length,
          endpoint: this.getSafeEndpointForLogs(),
          attempt: attempt + 1,
        });

        const response = await this.makeRPCRequest<T>(method, params);

        // Check for RPC-level errors
        if (response.error) {
          throw new Error(`RPC Error: ${response.error.message} (Code: ${response.error.code})`);
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        console.error(`[QuicknodeServiceDI] RPC attempt ${attempt + 1} failed:`, {
          error: lastError.message,
          method,
          endpoint: this.getSafeEndpointForLogs(),
        });

        if (attempt < maxRetries) {
          console.log(`[QuicknodeServiceDI] Retrying in ${this.config.retryDelay}ms...`);
          await this.delay(this.config.retryDelay);
        }
      }
    }

    console.error(`[QuicknodeServiceDI] All retry attempts failed for ${method}`);
    throw lastError || new Error(`Failed to execute RPC ${method} after ${maxRetries + 1} attempts`);
  }

  /**
   * Get public key from Bitcoin address
   */
  async getPublicKeyFromAddress(address: string): Promise<any> {
    try {
      const response = await this.executeRPC("validateaddress", [address]);
      return response.result?.scriptPubKey;
    } catch (error) {
      console.error(`[QuicknodeServiceDI] Error getting public key from address:`, error);
      throw error;
    }
  }

  /**
   * Get raw transaction with fallback to external API
   */
  async getRawTx(txHash: string): Promise<string> {
    try {
      const response = await this.executeRPC<string>("getrawtransaction", [txHash, 0]);

      if (!response.result) {
        return await this.fallbackGetRawTx(txHash);
      }

      return response.result;
    } catch (error) {
      console.error(`[QuicknodeServiceDI] Error getting raw tx from QuickNode:`, error);
      return await this.fallbackGetRawTx(txHash);
    }
  }

  /**
   * Decode raw transaction hex
   */
  async getDecodedTx(txHex: string): Promise<any> {
    try {
      const response = await this.executeRPC("decoderawtransaction", [txHex]);
      return response.result;
    } catch (error) {
      console.error(`[QuicknodeServiceDI] Error getting decoded tx:`, error);
      throw error;
    }
  }

  /**
   * Get complete transaction data (raw + decoded)
   */
  async getTransaction(txHash: string): Promise<any> {
    const hex = await this.getRawTx(txHash);
    const txData = await this.getDecodedTx(hex);
    return { ...txData, hex };
  }

  /**
   * Estimate smart fee using QuickNode's Bitcoin Core RPC
   */
  async estimateSmartFee(
    confTarget: number = 6,
    estimateMode: 'economical' | 'conservative' = 'economical'
  ): Promise<NormalizedFeeEstimate | null> {
    try {
      console.log(`[QuicknodeServiceDI] Estimating smart fee for ${confTarget} blocks (${estimateMode} mode)`);

      const response = await this.executeRPC<EstimateSmartFeeResponse>(
        "estimatesmartfee",
        [confTarget, estimateMode]
      );

      if (!response.result) {
        console.error("[QuicknodeServiceDI] estimatesmartfee: No result in response");
        return null;
      }

      const feeData = response.result;

      // Check for errors in the response
      if (feeData.errors && feeData.errors.length > 0) {
        console.error("[QuicknodeServiceDI] estimatesmartfee errors:", feeData.errors);
        return null;
      }

      // Validate feerate exists and is a valid number
      if (typeof feeData.feerate !== 'number' || feeData.feerate <= 0) {
        console.error("[QuicknodeServiceDI] estimatesmartfee: Invalid or missing feerate", feeData);
        return null;
      }

      // Convert BTC/kB to sats/vB
      // 1 BTC = 100,000,000 satoshis
      // 1 kB = 1000 vB (virtual bytes)
      // Formula: (feerate_btc_per_kb * 100000000) / 1000
      const feeRateSatsPerVB = Math.round((feeData.feerate * 100000000) / 1000);

      // Ensure minimum fee rate of 1 sat/vB
      const normalizedFeeRate = Math.max(feeRateSatsPerVB, 1);

      // Determine confidence based on confirmation target
      let confidence: 'high' | 'medium' | 'low';
      if (confTarget <= 2) {
        confidence = 'high';
      } else if (confTarget <= 6) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      const estimate: NormalizedFeeEstimate = {
        feeRateSatsPerVB: normalizedFeeRate,
        blocks: feeData.blocks || confTarget,
        source: 'quicknode',
        confidence
      };

      console.log(`[QuicknodeServiceDI] Fee estimate successful:`, {
        originalBtcPerKb: feeData.feerate,
        convertedSatsPerVb: normalizedFeeRate,
        blocks: estimate.blocks,
        confidence: estimate.confidence
      });

      return estimate;

    } catch (error) {
      console.error("[QuicknodeServiceDI] estimateSmartFee failed:", {
        error: error instanceof Error ? error.message : String(error),
        confTarget,
        estimateMode,
        endpoint: this.getSafeEndpointForLogs()
      });
      return null;
    }
  }

  /**
   * Get multiple fee estimates for different confirmation targets
   */
  async getMultipleFeeEstimates(): Promise<MultipleFeeEstimates> {
    try {
      console.log("[QuicknodeServiceDI] Fetching multiple fee estimates");

      // Fetch all estimates in parallel
      const [fastEstimate, normalEstimate, economyEstimate] = await Promise.all([
        this.estimateSmartFee(1, 'conservative'),  // Fast: 1 block, conservative
        this.estimateSmartFee(6, 'economical'),   // Normal: 6 blocks, economical
        this.estimateSmartFee(144, 'economical')  // Economy: 144 blocks, economical
      ]);

      return {
        fast: fastEstimate,
        normal: normalEstimate,
        economy: economyEstimate
      };

    } catch (error) {
      console.error("[QuicknodeServiceDI] getMultipleFeeEstimates failed:", error);
      return {
        fast: null,
        normal: null,
        economy: null
      };
    }
  }

  /**
   * Get configuration information (safe for logging)
   */
  getConfig(): Omit<QuicknodeConfig, 'apiKey'> {
    const { apiKey: _apiKey, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Make HTTP RPC request to QuickNode
   */
  private async makeRPCRequest<T>(method: string, params: any[]): Promise<QuicknodeRPCResponse<T>> {
    const url = this.getQuickNodeUrl();

    const requestBody: QuicknodeRPCRequest = {
      id: 1,
      jsonrpc: "2.0",
      method,
      params,
    };

    const response = await this.dependencies.httpClient.post(url, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: this.config.requestTimeout,
    });

    if (!response.ok) {
      const errorMessage = response.data ? String(response.data) : `HTTP ${response.status}`;

      // Check for client errors that shouldn't be retried
      if (response.status === 402 || (response.status >= 400 && response.status < 500)) {
        throw new Error(`Fatal QuickNode error: ${response.status} - ${errorMessage}`);
      }

      throw new Error(`QuickNode HTTP error: ${response.status} - ${errorMessage}`);
    }

    return response.data as QuicknodeRPCResponse<T>;
  }

  /**
   * Fallback method to get raw transaction from external API
   */
  private async fallbackGetRawTx(txHash: string): Promise<string> {
    if (!this.config.fallbackApiUrl) {
      throw new Error(`Unable to retrieve transaction ${txHash} - no fallback API configured`);
    }

    console.log(`[QuicknodeServiceDI] Attempting fallback for transaction: ${txHash}`);

    try {
      const fallbackUrl = `${this.config.fallbackApiUrl}/rawtx/${txHash}?format=hex`;
      const response = await this.dependencies.httpClient.get(fallbackUrl, {
        timeout: this.config.requestTimeout,
      });

      if (!response.ok) {
        throw new Error(`Fallback API error: ${response.status}`);
      }

      if (typeof response.data !== 'string') {
        throw new Error("Invalid fallback API response format");
      }

      return response.data;
    } catch (error) {
      console.error(`[QuicknodeServiceDI] Fallback failed for tx:`, error);
      throw new Error(`Unable to retrieve transaction ${txHash} from any source`);
    }
  }

  /**
   * Get QuickNode URL with API key
   */
  private getQuickNodeUrl(): string {
    const { endpoint, apiKey } = this.config;

    // Ensure the endpoint doesn't already contain a protocol
    const formattedEndpoint = endpoint.replace(/^https?:\/\//, '');

    // Return the properly formatted URL
    return `https://${formattedEndpoint}/${apiKey}`;
  }

  /**
   * Get safe endpoint for logging (without API key)
   */
  private getSafeEndpointForLogs(): string {
    if (!this.config.endpoint) return "undefined-endpoint";
    return this.config.endpoint.replace(/^https?:\/\//, '');
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Provider interface for use in higher-level services
export interface QuicknodeProvider {
  executeRPC<T = any>(method: string, params: any[]): Promise<QuicknodeRPCResponse<T>>;
  getPublicKeyFromAddress(address: string): Promise<any>;
  getRawTx(txHash: string): Promise<string>;
  getDecodedTx(txHex: string): Promise<any>;
  getTransaction(txHash: string): Promise<any>;
  estimateSmartFee(confTarget?: number, estimateMode?: 'economical' | 'conservative'): Promise<NormalizedFeeEstimate | null>;
  getMultipleFeeEstimates(): Promise<MultipleFeeEstimates>;
}

// Mock implementation for testing
export class MockQuicknodeProvider implements QuicknodeProvider {
  private mockResponses = new Map<string, any>();
  private shouldFail = false;
  private failureCount = 0;
  private maxFailures = 0;

  setMockResponse(method: string, params: any[], response: any): void {
    const key = `${method}:${JSON.stringify(params)}`;
    this.mockResponses.set(key, response);
  }

  setShouldFail(shouldFail: boolean, maxFailures = 0): void {
    this.shouldFail = shouldFail;
    this.failureCount = 0;
    this.maxFailures = maxFailures;
  }

  clearMockResponses(): void {
    this.mockResponses.clear();
  }

  async executeRPC<T = any>(method: string, params: any[]): Promise<QuicknodeRPCResponse<T>> {
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate network delay

    if (this.shouldFail && this.failureCount < this.maxFailures) {
      this.failureCount++;
      throw new Error(`Mock QuickNode provider configured to fail (${this.failureCount}/${this.maxFailures})`);
    }

    const key = `${method}:${JSON.stringify(params)}`;
    const mockResponse = this.mockResponses.get(key);

    if (mockResponse) {
      return mockResponse;
    }

    // Default successful response
    return {
      id: 1,
      jsonrpc: "2.0",
      result: {
        mock: true,
        method,
        params,
        timestamp: Date.now(),
      } as T,
    };
  }

  async getPublicKeyFromAddress(address: string): Promise<any> {
    const response = await this.executeRPC("validateaddress", [address]);
    return response.result?.scriptPubKey || `mock_script_${address}`;
  }

  async getRawTx(txHash: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate network delay
    return `mock_raw_tx_${txHash}`;
  }

  async getDecodedTx(txHex: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate network delay
    return { mock: true, txHex, decoded: true };
  }

  async getTransaction(txHash: string): Promise<any> {
    const hex = await this.getRawTx(txHash);
    const txData = await this.getDecodedTx(hex);
    return { ...txData, hex };
  }

  async estimateSmartFee(
    confTarget: number = 6,
    estimateMode: 'economical' | 'conservative' = 'economical'
  ): Promise<NormalizedFeeEstimate | null> {
    const response = await this.executeRPC<EstimateSmartFeeResponse>(
      "estimatesmartfee",
      [confTarget, estimateMode]
    );

    if (!response.result) {
      return null;
    }

    // Mock fee rate calculation
    const baseFee = 10; // Base 10 sats/vB
    const targetMultiplier = confTarget <= 2 ? 2 : confTarget <= 6 ? 1.5 : 1;
    const modeMultiplier = estimateMode === 'conservative' ? 1.2 : 1;

    const feeRateSatsPerVB = Math.round(baseFee * targetMultiplier * modeMultiplier);

    return {
      feeRateSatsPerVB,
      blocks: confTarget,
      source: 'quicknode',
      confidence: confTarget <= 2 ? 'high' : confTarget <= 6 ? 'medium' : 'low',
    };
  }

  async getMultipleFeeEstimates(): Promise<MultipleFeeEstimates> {
    const [fast, normal, economy] = await Promise.all([
      this.estimateSmartFee(1, 'conservative'),
      this.estimateSmartFee(6, 'economical'),
      this.estimateSmartFee(144, 'economical'),
    ]);

    return { fast, normal, economy };
  }
}
