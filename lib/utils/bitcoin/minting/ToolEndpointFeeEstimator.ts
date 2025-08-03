/**
 * Tool Endpoint Fee Estimator Service
 *
 * Service class that integrates tool endpoint adapters with the fee estimation system.
 * This replaces the redundant /api/internal/utxoquery calls by directly calling
 * tool endpoints with dryRun=true for Phase 2 estimation.
 */

import {
  AnyTransactionOptions,
  StandardFeeResponse,
  ToolEndpointError,
  ToolType,
} from "$lib/types/toolEndpointAdapter.ts";
import { logger } from "$lib/utils/logger.ts";
import {
  getToolAdapter,
  isSRC101TransactionOptions,
  isSRC20TransactionOptions,
  isStampTransactionOptions,
} from "$lib/utils/api/adapters/toolEndpointAdapters.ts";

/**
 * Cache entry for tool endpoint responses
 */
interface CacheEntry {
  response: StandardFeeResponse;
  timestamp: number;
  expiresAt: number;
}

/**
 * Configuration for the tool endpoint fee estimator
 */
export interface ToolEndpointFeeEstimatorConfig {
  /** Cache TTL in milliseconds (default: 30 seconds) */
  cacheTTL?: number;
  /** Request timeout in milliseconds (default: 10 seconds) */
  requestTimeout?: number;
  /** Maximum cache size (default: 100 entries) */
  maxCacheSize?: number;
  /** Enable request logging (default: true in development) */
  enableLogging?: boolean;
}

/**
 * Tool Endpoint Fee Estimator Service
 *
 * Provides fee estimation by calling tool endpoints directly with dryRun=true,
 * eliminating the need for separate UTXO queries in Phase 2.
 */
export class ToolEndpointFeeEstimator {
  private cache: Map<string, CacheEntry> = new Map();
  private config: Required<ToolEndpointFeeEstimatorConfig>;

  constructor(config: ToolEndpointFeeEstimatorConfig = {}) {
    this.config = {
      cacheTTL: config.cacheTTL ?? 30_000, // 30 seconds default
      requestTimeout: config.requestTimeout ?? 10_000, // 10 seconds default
      maxCacheSize: config.maxCacheSize ?? 100,
      enableLogging: config.enableLogging ??
        (Deno.env.get("DENO_ENV") === "development"),
    };
  }

  /**
   * Estimate fees for a transaction using the appropriate tool endpoint
   *
   * @param toolType Type of tool to use for estimation
   * @param options Transaction options specific to the tool
   * @returns Standardized fee response
   */
  async estimateFees(
    toolType: ToolType,
    options: AnyTransactionOptions,
  ): Promise<StandardFeeResponse> {
    const adapter = getToolAdapter(toolType);

    // Validate options for the specific tool
    this.validateOptionsForTool(toolType, options);

    // Check cache first
    const cacheKey = adapter.getCacheKey(options);
    const cachedResponse = this.getCachedResponse(cacheKey);
    if (cachedResponse) {
      if (this.config.enableLogging) {
        logger.debug("system", {
          message: "Using cached fee estimate",
          toolType,
          cacheKey,
          cacheAge: Date.now() - cachedResponse.timestamp,
        });
      }
      return cachedResponse.response;
    }

    // Make API request
    const startTime = Date.now();
    try {
      // Ensure dryRun is true for estimation
      const estimationOptions = { ...options, dryRun: true };

      const requestBody = adapter.buildRequestBody(estimationOptions);

      if (this.config.enableLogging) {
        logger.debug("system", {
          message: "Making tool endpoint request",
          toolType,
          endpoint: adapter.endpoint,
          requestBody: {
            ...requestBody,
            file: requestBody.file ? "[BASE64_DATA]" : undefined,
          },
        });
      }

      const response = await this.makeRequest(adapter.endpoint, requestBody);
      const standardResponse = adapter.parseResponse(response);

      // Cache the response
      this.cacheResponse(cacheKey, standardResponse);

      const duration = Date.now() - startTime;
      if (this.config.enableLogging) {
        logger.debug("system", {
          message: "Tool endpoint request completed",
          toolType,
          duration,
          estimatedSize: standardResponse.estimatedSize,
          minerFee: standardResponse.minerFee,
          totalCost: standardResponse.totalCost,
        });
      }

      return standardResponse;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (this.config.enableLogging) {
        logger.error("tool-endpoint-estimator", {
          message: "Tool endpoint request failed",
          toolType,
          endpoint: adapter.endpoint,
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Re-throw as ToolEndpointError for better error handling
      if (error instanceof ToolEndpointError) {
        throw error;
      }

      throw new ToolEndpointError(
        `Failed to estimate fees for ${toolType}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        toolType,
        adapter.endpoint,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Make HTTP request to tool endpoint with timeout and error handling
   */
  private async makeRequest(endpoint: string, requestBody: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.requestTimeout,
    );

    try {
      // 🔧 FIX: Ensure absolute URL for browser context
      const absoluteUrl = endpoint.startsWith("http")
        ? endpoint
        : `${
          globalThis.location?.origin || "http://localhost:8000"
        }${endpoint}`;

      const response = await fetch(absoluteUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Check for API error responses
      if (data.status === "error" || data.error) {
        throw new Error(
          data.error || data.message || "API returned error status",
        );
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          `Request timeout after ${this.config.requestTimeout}ms`,
        );
      }

      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Validate options for specific tool type using type guards
   */
  private validateOptionsForTool(
    toolType: ToolType,
    options: AnyTransactionOptions,
  ): void {
    switch (toolType) {
      case "stamp":
        if (!isStampTransactionOptions(options)) {
          throw new Error(
            "Invalid options for stamp tool: missing required stamp fields",
          );
        }
        break;
      case "src20":
        if (!isSRC20TransactionOptions(options)) {
          throw new Error(
            "Invalid options for SRC-20 tool: missing required SRC-20 fields",
          );
        }
        break;
      case "src101":
        if (!isSRC101TransactionOptions(options)) {
          throw new Error(
            "Invalid options for SRC-101 tool: missing required SRC-101 fields",
          );
        }
        break;
      default:
        throw new Error(`Unsupported tool type: ${toolType}`);
    }
  }

  /**
   * Get cached response if still valid
   */
  private getCachedResponse(cacheKey: string): CacheEntry | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry;
  }

  /**
   * Cache a response with TTL
   */
  private cacheResponse(cacheKey: string, response: StandardFeeResponse): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.config.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: CacheEntry = {
      response,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.cacheTTL,
    };

    this.cache.set(cacheKey, entry);
  }

  /**
   * Clear all cached responses
   */
  clearCache(): void {
    this.cache.clear();
    if (this.config.enableLogging) {
      logger.debug("system", {
        message: "Cache cleared",
      });
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: number | null;
  } {
    const entries = Array.from(this.cache.values());
    const oldestTimestamp = entries.length > 0
      ? Math.min(...entries.map((e) => e.timestamp))
      : null;

    return {
      size: this.cache.size,
      maxSize: this.config.maxCacheSize,
      hitRate: 0, // TODO(@btcstamps): Implement hit rate tracking if needed
      oldestEntry: oldestTimestamp,
    };
  }

  /**
   * Check if a tool type is supported
   */
  isToolSupported(toolType: string): toolType is ToolType {
    return ["stamp", "src20", "src101"].includes(toolType);
  }
}

/**
 * Singleton instance for use throughout the application
 */
export const toolEndpointFeeEstimator = new ToolEndpointFeeEstimator({
  cacheTTL: 30_000, // 30 seconds
  requestTimeout: 15_000, // 15 seconds for tool endpoints (can be slower than UTXO queries)
  maxCacheSize: 50, // Reasonable cache size for fee estimates
  enableLogging: true,
});

/**
 * Convenience function for estimating fees
 */
export function estimateFeesWithToolEndpoint(
  toolType: ToolType,
  options: AnyTransactionOptions,
): Promise<StandardFeeResponse> {
  return toolEndpointFeeEstimator.estimateFees(toolType, options);
}
