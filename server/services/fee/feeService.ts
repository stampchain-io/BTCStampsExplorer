import { dbManager } from "$server/database/databaseManager.ts";
import { RouteType, getCacheConfig } from "$server/services/cacheService.ts";
import { getRecommendedFees } from "$lib/utils/mempool.ts";
import { fetchBTCPriceInUSD } from "$lib/utils/balanceUtils.ts";
import { QuicknodeService } from "$server/services/quicknode/quicknodeService.ts";
import { logger } from "$lib/utils/logger.ts";
import {
  recordFallbackUsage,
  recordFeeFailure,
  recordFeeSuccess,
} from "$lib/utils/monitoring.ts";
import { FeeSecurityService } from "$server/services/fee/feeSecurityService.ts";

// Enhanced fee response interface
export interface FeeData {
  recommendedFee: number;
  btcPrice: number;
  source: "mempool" | "quicknode" | "cached" | "default";
  confidence: "high" | "medium" | "low";
  timestamp: number;
  debug_feesResponse?: any;
  fallbackUsed?: boolean;
  errors?: string[];
  fastestFee?: number;
  halfHourFee?: number;
  hourFee?: number;
  economyFee?: number;
  minimumFee?: number;
}

// Static fallback rates based on network conditions
const STATIC_FALLBACK_RATES = {
  conservative: 10, // sats/vB - safe for most conditions
  normal: 6, // sats/vB - current default
  minimum: 1, // sats/vB - absolute minimum
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export class FeeService {
  private static readonly CACHE_KEY = "fee_estimation_data";
  private static readonly CACHE_CONFIG = getCacheConfig(RouteType.PRICE);

  /**
   * Get fee data with Redis caching and comprehensive fallback
   */
  static async getFeeData(baseUrl: string): Promise<FeeData> {
    const startTime = Date.now();

    try {
      logger.debug("stamps", {
        message: "Starting fee data fetch with Redis caching",
        cacheConfig: this.CACHE_CONFIG,
      });

      // Use Redis cache with fallback chain
      const feeData = await dbManager.handleCache<FeeData>(
        this.CACHE_KEY,
        () => this.fetchFreshFeeData(baseUrl),
        this.CACHE_CONFIG.duration,
      );

      const duration = Date.now() - startTime;
      logger.info("stamps", {
        message: "Fee data retrieved successfully",
        source: feeData.source,
        duration,
        fromCache: feeData.source === "cached",
      });

      return feeData;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("stamps", {
        message: "Critical error in fee data retrieval",
        error: error instanceof Error ? error.message : String(error),
        duration,
      });

      // Emergency fallback to static rates
      return this.getStaticFallbackFees();
    }
  }

  /**
   * Fetch fresh fee data from external sources with fallback chain
   */
  private static async fetchFreshFeeData(baseUrl: string): Promise<FeeData> {
    const errors: string[] = [];

    logger.debug("stamps", {
      message: "Fetching fresh fee data from external sources",
    });

    // Get BTC price in parallel (don't let this block fee estimation)
    const btcPricePromise = fetchBTCPriceInUSD(baseUrl)
      .catch((error) => {
        logger.warn("stamps", {
          message: "BTC price fetch failed",
          error: error instanceof Error ? error.message : String(error),
        });
        return 0;
      });

    // 1. Try mempool.space (primary source)
    const mempoolResult = await this.getMempoolFees();
    if (mempoolResult) {
      logger.info("stamps", {
        message: "Primary source (mempool.space) successful",
        recommendedFee: mempoolResult.recommendedFee,
      });

      // Wait for BTC price
      const btcPrice = await btcPricePromise;

      // Build final response
      const response: FeeData = {
        recommendedFee: mempoolResult.recommendedFee,
        btcPrice: btcPrice || 0,
        source: mempoolResult.source,
        confidence: mempoolResult.confidence,
        timestamp: Date.now(),
        debug_feesResponse: mempoolResult.debug_feesResponse,
        fallbackUsed: false,
        ...(errors.length > 0 && { errors }),
      };

      // Security validation
      const validation = FeeSecurityService.validateFeeData(response, "mempool");
      if (validation.action === "block") {
        logger.warn("stamps", {
          message: "Mempool fee data blocked by security validation",
          violations: validation.violations,
          riskLevel: validation.riskLevel,
        });
        // Fall through to QuickNode fallback
      } else {
        if (validation.action === "warn") {
          logger.warn("stamps", {
            message: "Mempool fee data has security warnings",
            violations: validation.violations,
            riskLevel: validation.riskLevel,
          });
        }
        return response;
      }
    }

    errors.push("Mempool.space API failed after retries");

    // 2. Try QuickNode (fallback source)
    logger.info("stamps", {
      message: "Falling back to QuickNode",
    });
    recordFallbackUsage(
      "mempool",
      "quicknode",
      "Primary source failed after retries",
    );
    
    const quicknodeResult = await this.getQuickNodeFees();
    if (quicknodeResult) {
      logger.info("stamps", {
        message: "Fallback source (QuickNode) successful",
        recommendedFee: quicknodeResult.recommendedFee,
      });

      // Wait for BTC price
      const btcPrice = await btcPricePromise;

      // Build final response
      const response: FeeData = {
        recommendedFee: quicknodeResult.recommendedFee,
        btcPrice: btcPrice || 0,
        source: quicknodeResult.source,
        confidence: quicknodeResult.confidence,
        timestamp: Date.now(),
        debug_feesResponse: quicknodeResult.debug_feesResponse,
        fallbackUsed: true,
        ...(errors.length > 0 && { errors }),
      };

      // Security validation
      const validation = FeeSecurityService.validateFeeData(response, "quicknode");
      if (validation.action === "block") {
        logger.warn("stamps", {
          message: "QuickNode fee data blocked by security validation",
          violations: validation.violations,
          riskLevel: validation.riskLevel,
        });
        // Fall through to static fallback
      } else {
        if (validation.action === "warn") {
          logger.warn("stamps", {
            message: "QuickNode fee data has security warnings",
            violations: validation.violations,
            riskLevel: validation.riskLevel,
          });
        }
        return response;
      }
    }

    errors.push("QuickNode API failed after retries");

    // 3. Use static fallback (always succeeds)
    logger.warn("stamps", {
      message: "Using static fallback rates",
    });
    recordFallbackUsage(
      "quicknode",
      "default",
      "Secondary source failed after retries",
    );
    
    // Wait for BTC price and add it to static fallback
    const btcPrice = await btcPricePromise;
    const staticFallback = this.getStaticFallbackFees();
    
    const response: FeeData = {
      ...staticFallback,
      btcPrice: btcPrice || 0,
      ...(errors.length > 0 && { errors }),
    };

    logger.info("stamps", {
      message: "Fresh fee data fetched successfully",
      source: response.source,
      recommendedFee: response.recommendedFee,
      fallbackUsed: response.fallbackUsed,
    });

    return response;
  }

  /**
   * Exponential backoff delay calculation
   */
  private static getRetryDelay(attempt: number): number {
    return RETRY_DELAY * Math.pow(2, attempt);
  }

  /**
   * Attempt to get fees from mempool.space with retry logic
   */
  private static async getMempoolFees(retryCount = 0): Promise<
    {
      recommendedFee: number;
      debug_feesResponse: any;
      source: "mempool";
      confidence: "high";
    } | null
  > {
    const startTime = Date.now();

    try {
      logger.debug("stamps", {
        message: "Attempting mempool.space fees",
        attempt: retryCount + 1,
        maxRetries: MAX_RETRIES,
      });

      const feesResponse = await getRecommendedFees();

      if (!feesResponse) {
        throw new Error("No response from mempool.space");
      }

      let recommendedFee = STATIC_FALLBACK_RATES.normal; // Default fallback

      if (
        typeof feesResponse.fastestFee === "number" &&
        feesResponse.fastestFee >= 1
      ) {
        recommendedFee = feesResponse.fastestFee;
      } else if (
        typeof feesResponse.halfHourFee === "number" &&
        feesResponse.halfHourFee >= 1
      ) {
        recommendedFee = feesResponse.halfHourFee;
        logger.debug("stamps", {
          message: "Using halfHourFee as fastestFee was not suitable",
          halfHourFee: recommendedFee,
        });
      } else {
        logger.debug("stamps", {
          message: "Both fastestFee and halfHourFee unsuitable, using default",
          defaultFee: recommendedFee,
        });
      }

      // Record successful fee estimation
      const responseTime = Date.now() - startTime;
      recordFeeSuccess("mempool", responseTime);

      logger.info("stamps", {
        message: "Mempool.space success",
        recommendedFee,
        responseTime,
      });

      return {
        recommendedFee,
        debug_feesResponse: feesResponse,
        source: "mempool",
        confidence: "high",
      };
    } catch (error) {
      logger.error("stamps", {
        message: "Mempool.space attempt failed",
        attempt: retryCount + 1,
        error: error instanceof Error ? error.message : String(error),
      });

      // Record failure
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      recordFeeFailure("mempool", errorMessage, responseTime);

      if (retryCount < MAX_RETRIES - 1) {
        const delay = this.getRetryDelay(retryCount);
        logger.debug("stamps", {
          message: "Retrying mempool.space",
          delay,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.getMempoolFees(retryCount + 1);
      }

      return null;
    }
  }

  /**
   * Attempt to get fees from QuickNode with retry logic
   */
  private static async getQuickNodeFees(retryCount = 0): Promise<
    {
      recommendedFee: number;
      debug_feesResponse: any;
      source: "quicknode";
      confidence: "medium" | "high";
    } | null
  > {
    const startTime = Date.now();

    try {
      logger.debug("stamps", {
        message: "Attempting QuickNode fees",
        attempt: retryCount + 1,
        maxRetries: MAX_RETRIES,
      });

      // Try to get normal fee estimate (6 blocks)
      const feeEstimate = await QuicknodeService.estimateSmartFee(
        6,
        "economical",
      );

      if (!feeEstimate) {
        throw new Error("No fee estimate from QuickNode");
      }

      // Record successful fee estimation
      const responseTime = Date.now() - startTime;
      recordFeeSuccess("quicknode", responseTime);

      logger.info("stamps", {
        message: "QuickNode success",
        recommendedFee: feeEstimate.feeRateSatsPerVB,
        confidence: feeEstimate.confidence,
        responseTime,
      });

      return {
        recommendedFee: feeEstimate.feeRateSatsPerVB,
        debug_feesResponse: {
          quicknode_estimate: feeEstimate,
          blocks: feeEstimate.blocks,
          confidence: feeEstimate.confidence,
        },
        source: "quicknode",
        confidence: feeEstimate.confidence === "high" ? "high" : "medium",
      };
    } catch (error) {
      logger.error("stamps", {
        message: "QuickNode attempt failed",
        attempt: retryCount + 1,
        error: error instanceof Error ? error.message : String(error),
      });

      // Record failure
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      recordFeeFailure("quicknode", errorMessage, responseTime);

      if (retryCount < MAX_RETRIES - 1) {
        const delay = this.getRetryDelay(retryCount);
        logger.debug("stamps", {
          message: "Retrying QuickNode",
          delay,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.getQuickNodeFees(retryCount + 1);
      }

      return null;
    }
  }

  /**
   * Get static fallback fees as last resort
   */
  private static getStaticFallbackFees(): FeeData {
    logger.warn("stamps", {
      message: "Using static fallback",
      rate: STATIC_FALLBACK_RATES.conservative,
    });

    return {
      recommendedFee: STATIC_FALLBACK_RATES.conservative,
      btcPrice: 0,
      source: "default",
      confidence: "low",
      timestamp: Date.now(),
      fallbackUsed: true,
      debug_feesResponse: {
        static_fallback: true,
        available_rates: STATIC_FALLBACK_RATES,
        selected_rate: STATIC_FALLBACK_RATES.conservative,
        reason: "All API sources failed",
      },
    };
  }

  /**
   * Invalidate fee cache (useful for testing or manual refresh)
   */
  static invalidateCache(): Promise<void> {
    try {
      // Note: dbManager doesn't expose a direct cache invalidation method
      // but we can set a very short expiry to effectively invalidate
      return dbManager.handleCache(
        this.CACHE_KEY,
        () => Promise.resolve(null),
        1, // 1 second expiry
      ).then(() => {
        logger.info("stamps", {
          message: "Fee cache invalidated",
        });
      });
    } catch (_error) {
      logger.error("stamps", {
        message: "Failed to invalidate fee cache",
        error: _error instanceof Error ? _error.message : String(_error),
      });
      return Promise.resolve();
    }
  }

  /**
   * Get cache status information
   */
  static getCacheInfo(): {
    cacheKey: string;
    cacheDuration: number;
    staleWhileRevalidate: number;
    staleIfError: number;
  } {
    return {
      cacheKey: this.CACHE_KEY,
      cacheDuration: this.CACHE_CONFIG.duration,
      staleWhileRevalidate: this.CACHE_CONFIG.staleWhileRevalidate,
      staleIfError: this.CACHE_CONFIG.staleIfError,
    };
  }
} 