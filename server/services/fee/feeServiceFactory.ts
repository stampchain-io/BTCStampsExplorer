/**
 * Factory for creating FeeService instances with proper dependencies
 * This bridges the gap between the DI architecture and production usage
 */

import { getRecommendedFees } from "$lib/utils/bitcoin/network/mempool.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { RouteType, getCacheConfig } from "$server/services/infrastructure/cacheService.ts";
import { FeeSecurityService } from "$server/services/fee/feeSecurityService.ts";
import {
    FeeServiceDI,
    type CacheService,
    type FeeProvider,
    type PriceService,
    type SecurityService,
} from "$server/services/fee/feeServiceDI.ts";
import { BTCPriceService } from "$server/services/price/btcPriceService.ts";
import { QuicknodeService } from "$server/services/quicknode/quicknodeService.ts";

// Adapter for DatabaseManager to match CacheService interface
class DatabaseCacheService implements CacheService {
  async get<T>(key: string, factory: () => Promise<T>, durationSeconds: number): Promise<T> {
    return await dbManager.handleCache(key, factory, durationSeconds) as T;
  }
}

// Adapter for BTCPriceService to match PriceService interface
class BTCPriceServiceAdapter implements PriceService {
  async getPrice(): Promise<{ price: number }> {
    const result = await BTCPriceService.getPrice();
    return { price: result.price };
  }
}

// Mempool.space fee provider
class MempoolFeeProvider implements FeeProvider {
  getName(): string {
    return "mempool";
  }

  async getFeeEstimate(): Promise<{
    recommendedFee: number;
    confidence: "high" | "medium" | "low";
    debug_feesResponse?: any;
  }> {
    const feesResponse = await getRecommendedFees();

    if (!feesResponse) {
      throw new Error("No response from mempool.space");
    }

    let recommendedFee = 6; // Default fallback

    if (typeof feesResponse.fastestFee === "number" && feesResponse.fastestFee >= 1) {
      recommendedFee = feesResponse.fastestFee;
    } else if (typeof feesResponse.halfHourFee === "number" && feesResponse.halfHourFee >= 1) {
      recommendedFee = feesResponse.halfHourFee;
    }

    return {
      recommendedFee,
      confidence: "high",
      debug_feesResponse: feesResponse,
    };
  }
}

// QuickNode fee provider
class QuickNodeFeeProvider implements FeeProvider {
  getName(): string {
    return "quicknode";
  }

  async getFeeEstimate(): Promise<{
    recommendedFee: number;
    confidence: "high" | "medium" | "low";
    debug_feesResponse?: any;
  }> {
    const feeEstimate = await QuicknodeService.estimateSmartFee(6, "economical");

    if (!feeEstimate) {
      throw new Error("No fee estimate from QuickNode");
    }

    return {
      recommendedFee: feeEstimate.feeRateSatsPerVB,
      confidence: feeEstimate.confidence === "high" ? "high" : "medium",
      debug_feesResponse: {
        quicknode_estimate: feeEstimate,
        blocks: feeEstimate.blocks,
        confidence: feeEstimate.confidence,
      },
    };
  }
}

// Security service adapter
class FeeSecurityServiceAdapter implements SecurityService {
  validateFeeData(feeData: any, source: string): {
    isValid: boolean;
    violations: string[];
    riskLevel: "low" | "medium" | "high" | "critical";
    action: "allow" | "warn" | "block";
  } {
    const result = FeeSecurityService.validateFeeData(feeData, source);
    return {
      isValid: result.action === "allow",
      violations: result.violations,
      riskLevel: result.riskLevel,
      action: result.action,
    };
  }
}

/**
 * Create a production-ready FeeService instance
 */
export function createProductionFeeService(): FeeServiceDI {
  const cacheConfig = getCacheConfig(RouteType.PRICE);

  return new FeeServiceDI(
    {
      cacheService: new DatabaseCacheService(),
      priceService: new BTCPriceServiceAdapter(),
      feeProviders: [
        new MempoolFeeProvider(),
        new QuickNodeFeeProvider(),
      ],
      securityService: new FeeSecurityServiceAdapter(),
    },
    {
      cacheKey: "fee_estimation_data",
      cacheDuration: cacheConfig.duration,
      maxRetries: 3,
      retryDelay: 1000,
      staticFallbackRates: {
        conservative: 10,
        normal: 6,
        minimum: 1,
      },
    }
  );
}

/**
 * Singleton instance for production use
 */
let _productionFeeService: FeeServiceDI | null = null;

export function getProductionFeeService(): FeeServiceDI {
  if (!_productionFeeService) {
    _productionFeeService = createProductionFeeService();
  }
  return _productionFeeService;
}
