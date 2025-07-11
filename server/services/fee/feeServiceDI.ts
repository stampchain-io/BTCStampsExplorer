/**
 * Dependency Injection-enabled FeeService
 * Refactored from static methods to injectable instance-based service
 */

import { logger } from "$lib/utils/logger.ts";
import {
  recordFallbackUsage,
  recordFeeFailure,
  recordFeeSuccess,
} from "$lib/utils/monitoring.ts";
import { FeeSecurityService as _FeeSecurityService } from "$server/services/fee/feeSecurityService.ts";

// Re-export the FeeData interface
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

// Interfaces for dependency injection
export interface CacheService {
  get<T>(key: string, factory: () => Promise<T>, durationSeconds: number): Promise<T>;
}

export interface PriceService {
  getPrice(): Promise<{ price: number }>;
}

export interface FeeProvider {
  getName(): string;
  getFeeEstimate(): Promise<{
    recommendedFee: number;
    confidence: "high" | "medium" | "low";
    debug_feesResponse?: any;
  }>;
}

export interface SecurityService {
  validateFeeData(feeData: any, source: string): {
    isValid: boolean;
    violations: string[];
    riskLevel: "low" | "medium" | "high" | "critical";
    action: "allow" | "warn" | "block";
  };
}

export interface FeeServiceDependencies {
  cacheService: CacheService;
  priceService: PriceService;
  feeProviders: FeeProvider[];
  securityService?: SecurityService;
}

export interface FeeServiceConfig {
  cacheKey: string;
  cacheDuration: number;
  maxRetries: number;
  retryDelay: number;
  staticFallbackRates: {
    conservative: number;
    normal: number;
    minimum: number;
  };
}

/**
 * Dependency-injected FeeService implementation
 */
export class FeeServiceDI {
  private readonly config: FeeServiceConfig;

  constructor(
    private dependencies: FeeServiceDependencies,
    config?: Partial<FeeServiceConfig>
  ) {
    this.config = {
      cacheKey: "fee_estimation_data",
      cacheDuration: 30, // 30 seconds
      maxRetries: 3,
      retryDelay: 1000, // 1 second
      staticFallbackRates: {
        conservative: 10,
        normal: 6,
        minimum: 1,
      },
      ...config,
    };
  }

  /**
   * Get fee data with caching and comprehensive fallback
   */
  async getFeeData(): Promise<FeeData> {
    const startTime = Date.now();

    try {
      logger.debug("stamps", {
        message: "Starting fee data fetch with DI caching",
        cacheKey: this.config.cacheKey,
        cacheDuration: this.config.cacheDuration,
      });

      // Use injected cache service
      const feeData = await this.dependencies.cacheService.get(
        this.config.cacheKey,
        () => this.fetchFreshFeeData(),
        this.config.cacheDuration
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
   * Fetch fresh fee data from providers with fallback chain
   */
  private async fetchFreshFeeData(): Promise<FeeData> {
    const errors: string[] = [];

    logger.debug("stamps", {
      message: "Fetching fresh fee data from providers",
      providerCount: this.dependencies.feeProviders.length,
    });

    // Get BTC price in parallel (don't let this block fee estimation)
    const btcPricePromise = this.dependencies.priceService.getPrice()
      .then((priceData) => priceData.price)
      .catch((error) => {
        logger.warn("stamps", {
          message: "BTC price fetch failed",
          error: error instanceof Error ? error.message : String(error),
        });
        return 0;
      });

    // Try each fee provider in order
    for (const provider of this.dependencies.feeProviders) {
      try {
        logger.debug("stamps", {
          message: `Attempting fee provider: ${provider.getName()}`,
        });

        const feeResult = await this.retryOperation(
          () => provider.getFeeEstimate(),
          provider.getName()
        );

        if (feeResult) {
          logger.info("stamps", {
            message: `Fee provider ${provider.getName()} successful`,
            recommendedFee: feeResult.recommendedFee,
            confidence: feeResult.confidence,
          });

          // Wait for BTC price
          const btcPrice = await btcPricePromise;

          // Build temporary response for security validation
          const tempResponse: FeeData = {
            recommendedFee: feeResult.recommendedFee,
            btcPrice: btcPrice || 0,
            source: provider.getName() as any,
            confidence: feeResult.confidence,
            timestamp: Date.now(),
            debug_feesResponse: feeResult.debug_feesResponse,
            fallbackUsed: provider !== this.dependencies.feeProviders[0],
          };

          // Security validation if available
          if (this.dependencies.securityService) {
            const validation = this.dependencies.securityService.validateFeeData(
              tempResponse,
              provider.getName()
            );
            
            if (validation.action === "block") {
              logger.warn("stamps", {
                message: `Fee data from ${provider.getName()} blocked by security validation`,
                violations: validation.violations,
                riskLevel: validation.riskLevel,
              });
              errors.push(`${provider.getName()} blocked by security validation`);
              continue; // Try next provider
            }
            
            if (validation.action === "warn") {
              logger.warn("stamps", {
                message: `Fee data from ${provider.getName()} has security warnings`,
                violations: validation.violations,
                riskLevel: validation.riskLevel,
              });
            }
          }

          // Build final response with errors included
          const finalResponse: FeeData = {
            ...tempResponse,
            ...(errors.length > 0 && { errors }),
          };

          return finalResponse;
        } else {
          // retryOperation failed and returned null
          const errorMessage = `${provider.getName()} failed after ${this.config.maxRetries} attempts`;
          errors.push(errorMessage);
          logger.error("stamps", {
            message: `Fee provider ${provider.getName()} failed`,
            error: errorMessage,
          });

          // Record fallback usage if this isn't the last provider
          if (provider !== this.dependencies.feeProviders[this.dependencies.feeProviders.length - 1]) {
            recordFallbackUsage(
              provider.getName(),
              "next_provider",
              errorMessage
            );
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${provider.getName()}: ${errorMessage}`);
        logger.error("stamps", {
          message: `Fee provider ${provider.getName()} failed`,
          error: errorMessage,
        });

        // Record fallback usage if this isn't the last provider
        if (provider !== this.dependencies.feeProviders[this.dependencies.feeProviders.length - 1]) {
          recordFallbackUsage(
            provider.getName(),
            "next_provider",
            errorMessage
          );
        }
      }
    }

    // All providers failed - use static fallback
    logger.warn("stamps", {
      message: "All fee providers failed, using static fallback",
      errors,
    });

    recordFallbackUsage(
      "all_providers",
      "static",
      "All fee providers failed"
    );

    // Wait for BTC price and add it to static fallback
    const btcPrice = await btcPricePromise;
    const staticFallback = this.getStaticFallbackFees();

    return {
      ...staticFallback,
      btcPrice: btcPrice || 0,
      ...(errors.length > 0 && { errors }),
    };
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    providerName: string
  ): Promise<T | null> {
    let lastError: Error;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      const startTime = Date.now();

      try {
        const result = await operation();
        
        // Record successful operation
        const responseTime = Date.now() - startTime;
        recordFeeSuccess(providerName, responseTime);
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Record failure
        const responseTime = Date.now() - startTime;
        recordFeeFailure(providerName, lastError.message, responseTime);

        if (attempt < this.config.maxRetries - 1) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          logger.debug("stamps", {
            message: `Retrying ${providerName}`,
            attempt: attempt + 1,
            delay,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    logger.error("stamps", {
      message: `${providerName} failed after ${this.config.maxRetries} attempts`,
      error: lastError!.message,
    });

    return null;
  }

  /**
   * Get static fallback fees as last resort
   */
  private getStaticFallbackFees(): FeeData {
    logger.warn("stamps", {
      message: "Using static fallback",
      rate: this.config.staticFallbackRates.conservative,
    });

    return {
      recommendedFee: this.config.staticFallbackRates.conservative,
      btcPrice: 0,
      source: "default",
      confidence: "low",
      timestamp: Date.now(),
      fallbackUsed: true,
      debug_feesResponse: {
        static_fallback: true,
        available_rates: this.config.staticFallbackRates,
        selected_rate: this.config.staticFallbackRates.conservative,
        reason: "All providers failed",
      },
    };
  }

  /**
   * Get cache status information
   */
  getCacheInfo(): {
    cacheKey: string;
    cacheDuration: number;
  } {
    return {
      cacheKey: this.config.cacheKey,
      cacheDuration: this.config.cacheDuration,
    };
  }

  /**
   * Get configuration information
   */
  getConfig(): FeeServiceConfig {
    return { ...this.config };
  }

  /**
   * Get list of configured providers
   */
  getProviders(): string[] {
    return this.dependencies.feeProviders.map(p => p.getName());
  }
}