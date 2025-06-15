# Task 25 Implementation Guide: BTC Price Service Optimization

## Overview

This guide provides detailed instructions for implementing Task 25, which optimizes BTC price fetching across the application by creating a dedicated `BTCPriceService`, migrating direct callers to use the centralized endpoint, and integrating BTC price warming into the background service.

## Current State Analysis

### ✅ Available Infrastructure

1. **Centralized BTC Price Endpoint** (`routes/api/internal/btcPrice.ts`)
   - Redis caching with 60-second TTL via `RouteType.PRICE`
   - Round-robin source selection (QuickNode → CoinGecko)
   - CSRF protection and trusted origin validation
   - Comprehensive error handling and fallback logic

2. **Background Service Integration** (`server/services/fee/backgroundFeeService.ts`)
   - 60-second cache warming intervals
   - BTC price fetched in parallel with fee data via `FeeService.getFeeData()`
   - Lifecycle management with status monitoring

3. **Redis Caching Infrastructure** (`server/services/cacheService.ts`)
   - `RouteType.PRICE` configuration (60-second cache)
   - `dbManager.handleCache()` with automatic fallback
   - Stale-while-revalidate and stale-if-error policies

4. **Existing BTC Price Service** (`server/services/price/btcPriceService.ts`)
   - Multi-source price fetching (QuickNode, CoinGecko)
   - Error handling and source validation
   - Price formatting and response structuring

### 🔍 Current BTC Price Usage Patterns

**✅ Optimized (Redis-cached):**
- Fee-related operations via `FeeService.getFeeData()`
- Background cache warming every 60 seconds
- `/api/internal/btcPrice` endpoint

**⚠️ Suboptimal (Direct API calls):**
- `server/controller/stampController.ts` - Line 225: `fetchBTCPriceInUSD(url?.origin)`
- `lib/utils/balanceUtils.ts` - Line 155: `fetchBTCPriceInUSD(options.apiBaseUrl)`
- Client-side hooks (partially migrated, some commented out)

**Current Flow Issues:**
```
Multiple Direct Calls → fetchBTCPriceInUSD() → /api/internal/btcPrice → Redis Cache
                                                                              ↓
                                                    [Cache Miss] → External APIs
```

**Target Optimized Flow:**
```
Background Service (60s) → BTCPriceService → Redis Cache
                                    ↓
All App Components → Centralized Service → [Cache Hit] → Instant Response
```

## Implementation Plan

### Subtask 25.1: Create Dedicated BTCPriceService

**Files to Create:**
- `server/services/price/btcPriceService.ts` (enhance existing)

**Files to Modify:**
- `routes/api/internal/btcPrice.ts`

**Implementation Steps:**

1. **Enhance BTCPriceService** (`server/services/price/btcPriceService.ts`):
```typescript
import { dbManager } from "$server/database/databaseManager.ts";
import { RouteType, getCacheConfig } from "$server/services/cacheService.ts";
import { logger } from "$lib/utils/logger.ts";

export interface BTCPriceData {
  price: number;
  source: "quicknode" | "coingecko" | "cached" | "default";
  confidence: "high" | "medium" | "low";
  timestamp: number;
  details?: any;
  fallbackUsed?: boolean;
  errors?: string[];
}

export class BTCPriceService {
  private static readonly CACHE_KEY = "btc_price_data";
  private static readonly CACHE_CONFIG = getCacheConfig(RouteType.PRICE);
  private static sourceCounter = 0;
  private static readonly SOURCES = ["quicknode", "coingecko"] as const;

  /**
   * Get BTC price with Redis caching and comprehensive fallback
   */
  static async getPrice(preferredSource?: string): Promise<BTCPriceData> {
    const startTime = Date.now();

    try {
      logger.debug("stamps", {
        message: "Starting BTC price fetch with Redis caching",
        preferredSource,
        cacheConfig: this.CACHE_CONFIG,
      });

      // Use Redis cache with fallback chain
      const priceData = await dbManager.handleCache<BTCPriceData>(
        this.CACHE_KEY,
        () => this.fetchFreshPriceData(preferredSource),
        this.CACHE_CONFIG.duration,
      );

      const duration = Date.now() - startTime;
      logger.info("stamps", {
        message: "BTC price retrieved successfully",
        source: priceData.source,
        price: priceData.price,
        duration,
        fromCache: priceData.source === "cached",
      });

      return priceData;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("stamps", {
        message: "Critical error in BTC price retrieval",
        error: error instanceof Error ? error.message : String(error),
        duration,
      });

      // Emergency fallback to static default
      return this.getStaticFallbackPrice();
    }
  }

  /**
   * Fetch fresh price data from external sources with fallback chain
   */
  private static async fetchFreshPriceData(preferredSource?: string): Promise<BTCPriceData> {
    const errors: string[] = [];

    logger.debug("stamps", {
      message: "Fetching fresh BTC price from external sources",
      preferredSource,
    });

    // Determine source order
    const sources = preferredSource 
      ? [preferredSource, ...this.SOURCES.filter(s => s !== preferredSource)]
      : this.getNextSourceOrder();

    // Try each source in order
    for (const source of sources) {
      try {
        const result = await this.fetchFromSource(source);
        if (result) {
          logger.info("stamps", {
            message: `BTC price source (${source}) successful`,
            price: result.price,
          });

          return {
            ...result,
            timestamp: Date.now(),
            fallbackUsed: source !== sources[0],
            ...(errors.length > 0 && { errors }),
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${source}: ${errorMessage}`);
        logger.warn("stamps", {
          message: `BTC price source (${source}) failed`,
          error: errorMessage,
        });
      }
    }

    // All sources failed - use static fallback
    logger.warn("stamps", {
      message: "All BTC price sources failed, using static fallback",
      errors,
    });

    return {
      ...this.getStaticFallbackPrice(),
      errors,
    };
  }

  /**
   * Get round-robin source order
   */
  private static getNextSourceOrder(): string[] {
    const primaryIndex = this.sourceCounter % this.SOURCES.length;
    this.sourceCounter = (this.sourceCounter + 1) % Number.MAX_SAFE_INTEGER;
    
    const primary = this.SOURCES[primaryIndex];
    const secondary = this.SOURCES.find(s => s !== primary)!;
    
    return [primary, secondary];
  }

  /**
   * Fetch price from specific source
   */
  private static async fetchFromSource(source: string): Promise<Omit<BTCPriceData, 'timestamp' | 'fallbackUsed' | 'errors'> | null> {
    switch (source) {
      case "quicknode":
        return await this.fetchFromQuickNode();
      case "coingecko":
        return await this.fetchFromCoinGecko();
      default:
        throw new Error(`Unknown price source: ${source}`);
    }
  }

  /**
   * Fetch from QuickNode
   */
  private static async fetchFromQuickNode(): Promise<Omit<BTCPriceData, 'timestamp' | 'fallbackUsed' | 'errors'> | null> {
    // Implementation using existing QuickNode service
    // This would integrate with the existing price fetching logic
    return null; // Placeholder
  }

  /**
   * Fetch from CoinGecko
   */
  private static async fetchFromCoinGecko(): Promise<Omit<BTCPriceData, 'timestamp' | 'fallbackUsed' | 'errors'> | null> {
    // Implementation using CoinGecko API
    // This would integrate with the existing price fetching logic
    return null; // Placeholder
  }

  /**
   * Get static fallback price
   */
  private static getStaticFallbackPrice(): BTCPriceData {
    return {
      price: 0,
      source: "default",
      confidence: "low",
      timestamp: Date.now(),
      fallbackUsed: true,
      details: {
        static_fallback: true,
        reason: "All price sources failed",
      },
    };
  }

  /**
   * Invalidate price cache (useful for testing or manual refresh)
   */
  static async invalidateCache(): Promise<void> {
    try {
      await dbManager.handleCache(
        this.CACHE_KEY,
        () => Promise.resolve(null),
        1, // 1 second expiry
      );
      
      logger.info("stamps", {
        message: "BTC price cache invalidated",
      });
    } catch (error) {
      logger.error("stamps", {
        message: "Failed to invalidate BTC price cache",
        error: error instanceof Error ? error.message : String(error),
      });
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
```

2. **Update BTC Price API Endpoint** (`routes/api/internal/btcPrice.ts`):
```typescript
import { Handlers } from "$fresh/server.ts";
import { BTCPriceService } from "$server/services/price/btcPriceService.ts";
import { InternalRouteGuard } from "$server/services/security/internalRouteGuard.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const requestId = `price-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[${requestId}] BTC price request started from ${url.origin}`);

    try {
      const originError = await InternalRouteGuard.requireTrustedOrigin(req);
      if (originError) {
        console.warn(`[${requestId}] Origin validation failed for ${url.origin}`);
        return originError;
      }

      console.log(`[${requestId}] Fetching price from BTCPriceService...`);
      const result = await BTCPriceService.getPrice();
      console.log(`[${requestId}] BTCPriceService result:`, result);

      if (!result.price && result.source !== "default") {
        console.error(`[${requestId}] No price data available`);
        return ApiResponseUtil.internalError("No price data available");
      }

      const formattedResult = {
        data: {
          price: result.price,
          source: result.source,
          confidence: result.confidence,
          details: result.details,
        },
      };

      console.log(`[${requestId}] Sending response with price: ${result.price} from ${result.source}`);
      return ApiResponseUtil.success(formattedResult, {
        routeType: RouteType.PRICE,
        forceNoCache: false,
      });
    } catch (error) {
      console.error(`[${requestId}] Unexpected error:`, error);
      return ApiResponseUtil.internalError(
        error instanceof Error ? error.message : "Unknown error",
        "Failed to fetch BTC price",
      );
    }
  },
};
```

### Subtask 25.2: Migrate Direct Callers to Centralized Service

**Files to Modify:**
- `server/controller/stampController.ts`
- `lib/utils/balanceUtils.ts`
- `client/hooks/useSRC20Form.ts` (if needed)

**Implementation Steps:**

1. **Update Stamp Controller** (`server/controller/stampController.ts`):
```typescript
// Replace direct fetchBTCPriceInUSD call
// OLD:
// const btcPrice = await fetchBTCPriceInUSD(url?.origin);

// NEW:
import { BTCPriceService } from "$server/services/price/btcPriceService.ts";

// In the relevant function:
const btcPriceData = await BTCPriceService.getPrice();
const btcPrice = btcPriceData.price;

// Add logging for monitoring
console.log(`[StampController] BTC price: ${btcPrice} from ${btcPriceData.source}`);
```

2. **Update Balance Utils** (`lib/utils/balanceUtils.ts`):
```typescript
// Modify getBTCBalanceInfo function to use centralized service
export async function getBTCBalanceInfo(
  address: string,
  options: BTCBalanceInfoOptions = {},
): Promise<BTCBalanceInfo | null> {
  try {
    // ... existing balance fetching logic ...

    if (options.includeUSD) {
      // OLD: const btcPrice = await fetchBTCPriceInUSD(options.apiBaseUrl);
      // NEW: Use centralized service
      let btcPrice = 0;
      
      if (typeof window !== "undefined") {
        // Client-side: use the centralized endpoint
        try {
          const response = await fetch("/api/internal/btcPrice");
          if (response.ok) {
            const data = await response.json();
            btcPrice = data.data?.price || 0;
          }
        } catch (error) {
          console.warn("Failed to fetch BTC price for balance calculation:", error);
        }
      } else {
        // Server-side: use the service directly
        const btcPriceData = await BTCPriceService.getPrice();
        btcPrice = btcPriceData.price;
      }

      info.btcPrice = btcPrice;
      info.usdValue = formatUSDValue(confirmedBTC * btcPrice);
    }

    // ... rest of function ...
  }
}

// Keep fetchBTCPriceInUSD for backward compatibility but mark as deprecated
/**
 * @deprecated Use BTCPriceService.getPrice() for server-side or /api/internal/btcPrice for client-side
 */
export async function fetchBTCPriceInUSD(apiBaseUrl?: string): Promise<number> {
  console.warn("fetchBTCPriceInUSD is deprecated. Use BTCPriceService.getPrice() or /api/internal/btcPrice");
  
  // Fallback implementation for compatibility
  if (typeof window !== "undefined" || !apiBaseUrl) {
    // Client-side or no baseUrl: use centralized endpoint
    try {
      const baseUrl = apiBaseUrl || (typeof window !== "undefined" ? window.location.origin : "http://localhost:8000");
      const response = await fetch(`${baseUrl}/api/internal/btcPrice`);
      if (response.ok) {
        const data = await response.json();
        return data.data?.price || 0;
      }
    } catch (error) {
      console.error("Failed to fetch BTC price:", error);
    }
    return 0;
  } else {
    // Server-side with baseUrl: use service directly
    const btcPriceData = await BTCPriceService.getPrice();
    return btcPriceData.price;
  }
}
```

3. **Update Client Hooks** (if needed):
```typescript
// client/hooks/useSRC20Form.ts
// Ensure any remaining direct calls are migrated to use the centralized endpoint

// Instead of direct fetchBTCPriceInUSD calls, use:
const fetchBTCPrice = async (): Promise<number> => {
  try {
    const response = await fetch("/api/internal/btcPrice");
    if (response.ok) {
      const data = await response.json();
      return data.data?.price || 0;
    }
  } catch (error) {
    console.warn("Failed to fetch BTC price:", error);
  }
  return 0;
};
```

### Subtask 25.3: Integrate BTC Price Warming into Background Service

**Files to Modify:**
- `server/services/fee/backgroundFeeService.ts`

**Implementation Steps:**

1. **Enhance Background Service for Dedicated BTC Price Warming**:
```typescript
// server/services/fee/backgroundFeeService.ts
import { FeeService } from "$server/services/fee/feeService.ts";
import { BTCPriceService } from "$server/services/price/btcPriceService.ts";
import { logger } from "$lib/utils/logger.ts";

export class BackgroundFeeService {
  private static intervalId: number | null = null;
  private static priceIntervalId: number | null = null;
  private static isRunning = false;
  private static readonly CACHE_WARM_INTERVAL = 60000; // 60 seconds
  private static readonly PRICE_WARM_INTERVAL = 60000; // 60 seconds (can be different)
  private static readonly MAX_RETRIES = 3;
  private static retryCount = 0;
  private static priceRetryCount = 0;

  /**
   * Start the background services (fees + BTC price)
   */
  static start(baseUrl: string): void {
    if (this.isRunning) {
      logger.warn("stamps", {
        message: "Background services already running",
      });
      return;
    }

    logger.info("stamps", {
      message: "Starting background cache warming services",
      feeInterval: this.CACHE_WARM_INTERVAL,
      priceInterval: this.PRICE_WARM_INTERVAL,
      baseUrl,
    });

    this.isRunning = true;

    // Initial cache warming
    this.warmFeeCache(baseUrl);
    this.warmPriceCache();

    // Set up intervals for regular cache warming
    this.intervalId = setInterval(() => {
      this.warmFeeCache(baseUrl);
    }, this.CACHE_WARM_INTERVAL);

    this.priceIntervalId = setInterval(() => {
      this.warmPriceCache();
    }, this.PRICE_WARM_INTERVAL);

    logger.info("stamps", {
      message: "Background services started successfully",
    });
  }

  /**
   * Stop the background services
   */
  static stop(): void {
    if (!this.isRunning) {
      logger.warn("stamps", {
        message: "Background services not running",
      });
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.priceIntervalId) {
      clearInterval(this.priceIntervalId);
      this.priceIntervalId = null;
    }

    this.isRunning = false;
    this.retryCount = 0;
    this.priceRetryCount = 0;

    logger.info("stamps", {
      message: "Background services stopped",
    });
  }

  /**
   * Warm the fee cache by fetching fresh data
   */
  private static async warmFeeCache(baseUrl: string): Promise<void> {
    const startTime = Date.now();

    try {
      logger.debug("stamps", {
        message: "Starting background fee cache warming",
        attempt: this.retryCount + 1,
      });

      await FeeService.invalidateCache();
      const feeData = await FeeService.getFeeData(baseUrl);

      const duration = Date.now() - startTime;
      this.retryCount = 0;

      logger.info("stamps", {
        message: "Background fee cache warmed successfully",
        source: feeData.source,
        recommendedFee: feeData.recommendedFee,
        duration,
        fallbackUsed: feeData.fallbackUsed,
      });

      console.log(
        `[Background] Fee cache warmed: ${feeData.recommendedFee} sats/vB from ${feeData.source} (${duration}ms)`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.retryCount++;

      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error("stamps", {
        message: "Background fee cache warming failed",
        error: errorMessage,
        duration,
        attempt: this.retryCount,
        maxRetries: this.MAX_RETRIES,
      });

      console.error(
        `[Background] Fee cache warming failed (attempt ${this.retryCount}/${this.MAX_RETRIES}):`,
        errorMessage,
      );

      if (this.retryCount >= this.MAX_RETRIES) {
        this.retryCount = 0;
      }
    }
  }

  /**
   * Warm the BTC price cache by fetching fresh data
   */
  private static async warmPriceCache(): Promise<void> {
    const startTime = Date.now();

    try {
      logger.debug("stamps", {
        message: "Starting background BTC price cache warming",
        attempt: this.priceRetryCount + 1,
      });

      await BTCPriceService.invalidateCache();
      const priceData = await BTCPriceService.getPrice();

      const duration = Date.now() - startTime;
      this.priceRetryCount = 0;

      logger.info("stamps", {
        message: "Background BTC price cache warmed successfully",
        source: priceData.source,
        price: priceData.price,
        duration,
        fallbackUsed: priceData.fallbackUsed,
      });

      console.log(
        `[Background] BTC price cache warmed: $${priceData.price} from ${priceData.source} (${duration}ms)`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.priceRetryCount++;

      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error("stamps", {
        message: "Background BTC price cache warming failed",
        error: errorMessage,
        duration,
        attempt: this.priceRetryCount,
        maxRetries: this.MAX_RETRIES,
      });

      console.error(
        `[Background] BTC price cache warming failed (attempt ${this.priceRetryCount}/${this.MAX_RETRIES}):`,
        errorMessage,
      );

      if (this.priceRetryCount >= this.MAX_RETRIES) {
        this.priceRetryCount = 0;
      }
    }
  }

  /**
   * Get the current status of the background services
   */
  static getStatus(): {
    isRunning: boolean;
    intervalId: number | null;
    priceIntervalId: number | null;
    retryCount: number;
    priceRetryCount: number;
    feeCacheInfo: ReturnType<typeof FeeService.getCacheInfo>;
    priceCacheInfo: ReturnType<typeof BTCPriceService.getCacheInfo>;
  } {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId,
      priceIntervalId: this.priceIntervalId,
      retryCount: this.retryCount,
      priceRetryCount: this.priceRetryCount,
      feeCacheInfo: FeeService.getCacheInfo(),
      priceCacheInfo: BTCPriceService.getCacheInfo(),
    };
  }

  /**
   * Force immediate cache warming (useful for testing or manual refresh)
   */
  static async forceWarm(baseUrl: string): Promise<void> {
    logger.info("stamps", {
      message: "Forcing immediate cache warming for fees and BTC price",
    });

    await Promise.all([
      this.warmFeeCache(baseUrl),
      this.warmPriceCache(),
    ]);
  }

  /**
   * Force immediate BTC price cache warming only
   */
  static async forceWarmPrice(): Promise<void> {
    logger.info("stamps", {
      message: "Forcing immediate BTC price cache warming",
    });

    await this.warmPriceCache();
  }
}
```

### Subtask 25.4: Add Monitoring and Status Endpoints

**Files to Create:**
- `routes/api/internal/btc-price-status.ts`

**Files to Modify:**
- `routes/api/internal/background-fee-status.ts`

**Implementation Steps:**

1. **Create BTC Price Status Endpoint**:
```typescript
// routes/api/internal/btc-price-status.ts
import { Handlers } from "$fresh/server.ts";
import { BTCPriceService } from "$server/services/price/btcPriceService.ts";
import { InternalRouteGuard } from "$server/services/security/internalRouteGuard.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const originError = await InternalRouteGuard.requireTrustedOrigin(req);
      if (originError) return originError;

      const cacheInfo = BTCPriceService.getCacheInfo();
      
      const status = {
        service: "BTCPriceService",
        cache: cacheInfo,
        timestamp: new Date().toISOString(),
      };

      return ApiResponseUtil.success(status);
    } catch (error) {
      return ApiResponseUtil.internalError(
        error instanceof Error ? error.message : "Unknown error",
        "Failed to get BTC price status",
      );
    }
  },

  async POST(req) {
    try {
      const originError = await InternalRouteGuard.requireTrustedOrigin(req);
      if (originError) return originError;

      const url = new URL(req.url);
      const action = url.searchParams.get("action");

      if (action === "invalidate") {
        await BTCPriceService.invalidateCache();
        return ApiResponseUtil.success({ message: "BTC price cache invalidated" });
      }

      if (action === "warm") {
        const baseUrl = url.searchParams.get("baseUrl") || req.headers.get("origin") || "http://localhost:8000";
        await BTCPriceService.getPrice(); // This will warm the cache
        return ApiResponseUtil.success({ message: "BTC price cache warmed" });
      }

      return ApiResponseUtil.badRequest("Invalid action. Use 'invalidate' or 'warm'");
    } catch (error) {
      return ApiResponseUtil.internalError(
        error instanceof Error ? error.message : "Unknown error",
        "Failed to perform BTC price action",
      );
    }
  },
};
```

2. **Update Background Service Status** (`routes/api/internal/background-fee-status.ts`):
```typescript
// Add BTC price status to existing endpoint
import { BackgroundFeeService } from "$server/services/fee/backgroundFeeService.ts";

// In the GET handler, enhance the status response:
const status = BackgroundFeeService.getStatus();

const enhancedStatus = {
  ...status,
  services: {
    fees: {
      isRunning: status.isRunning,
      intervalId: status.intervalId,
      retryCount: status.retryCount,
      cacheInfo: status.feeCacheInfo,
    },
    btcPrice: {
      isRunning: status.isRunning,
      intervalId: status.priceIntervalId,
      retryCount: status.priceRetryCount,
      cacheInfo: status.priceCacheInfo,
    },
  },
  timestamp: new Date().toISOString(),
};

// In the POST handler, add support for BTC price actions:
if (action === "force-warm-price") {
  await BackgroundFeeService.forceWarmPrice();
  return ApiResponseUtil.success({ message: "BTC price cache force-warmed" });
}
```

### Subtask 25.5: Update Tests and Documentation

**Files to Create:**
- `tests/btc-price-service.test.ts`

**Files to Modify:**
- `tests/btc-price-caching.test.ts`
- `docs/fee_system_architecture.md`

**Implementation Steps:**

1. **Create BTCPriceService Tests**:
```typescript
// tests/btc-price-service.test.ts
import { assert, assertEquals } from "@std/assert";
import { BTCPriceService } from "../server/services/price/btcPriceService.ts";

Deno.test("BTCPriceService - Core Functionality", async (t) => {
  await t.step("should fetch price with caching", async () => {
    const price1 = await BTCPriceService.getPrice();
    assert(typeof price1.price === "number");
    assert(price1.source);
    assert(price1.timestamp);

    // Second call should be faster (cached)
    const start = performance.now();
    const price2 = await BTCPriceService.getPrice();
    const duration = performance.now() - start;

    assertEquals(price1.price, price2.price);
    assert(duration < 10, "Cached call should be very fast");
  });

  await t.step("should handle cache invalidation", async () => {
    await BTCPriceService.invalidateCache();
    const price = await BTCPriceService.getPrice();
    assert(typeof price.price === "number");
  });

  await t.step("should provide cache info", () => {
    const info = BTCPriceService.getCacheInfo();
    assert(info.cacheKey);
    assert(typeof info.cacheDuration === "number");
  });
});
```

2. **Update Existing Tests** (`tests/btc-price-caching.test.ts`):
```typescript
// Add tests for the new service integration
await t.step("BTCPriceService integration", async () => {
  const servicePrice = await BTCPriceService.getPrice();
  const endpointPrice = await fetchBTCPriceInUSD(TEST_CONFIG.baseUrl);
  
  // Both should return the same cached value
  assertEquals(servicePrice.price, endpointPrice);
  console.log(`✅ Service and endpoint prices consistent: $${servicePrice.price}`);
});
```

## Expected Outcomes

### Performance Improvements
- **Reduced API Calls**: Background warming eliminates redundant external API calls
- **Faster Response Times**: All BTC price requests served from Redis cache (<5ms)
- **Better Resource Utilization**: Centralized caching reduces memory and network overhead

### Reliability Improvements
- **Consistent Data**: All components use the same cached price data
- **Improved Uptime**: Background warming ensures cache is always fresh
- **Better Error Handling**: Centralized error handling and fallback logic

### Monitoring Improvements
- **Unified Monitoring**: BTC price metrics integrated with existing fee monitoring
- **Status Endpoints**: Dedicated endpoints for BTC price service health
- **Enhanced Logging**: Comprehensive logging for debugging and performance analysis

### Code Quality Improvements
- **Reduced Duplication**: Single source of truth for BTC price fetching
- **Better Separation of Concerns**: Dedicated service for price-related operations
- **Improved Testability**: Centralized service easier to test and mock

## Migration Strategy

### Phase 1: Service Creation (Subtask 25.1)
- Create `BTCPriceService` with full Redis integration
- Update `/api/internal/btcPrice` to use new service
- Maintain backward compatibility

### Phase 2: Migration (Subtask 25.2)
- Update direct callers one by one
- Add deprecation warnings to old functions
- Ensure no breaking changes

### Phase 3: Background Integration (Subtask 25.3)
- Integrate BTC price warming into background service
- Add separate intervals for fees and price
- Monitor performance impact

### Phase 4: Monitoring (Subtask 25.4)
- Add status endpoints and enhanced monitoring
- Update existing monitoring to include BTC price metrics
- Add alerting for price service issues

### Phase 5: Testing & Documentation (Subtask 25.5)
- Comprehensive test coverage for new service
- Update documentation with new architecture
- Performance benchmarking and optimization

## Rollback Plan

If issues arise during implementation:

1. **Service Issues**: Revert to direct `fetchBTCPriceInUSD` calls
2. **Background Service Issues**: Disable BTC price warming, keep fee warming
3. **Cache Issues**: Fall back to direct API calls with in-memory caching
4. **Performance Issues**: Adjust cache TTL or disable background warming

Each subtask can be rolled back independently without affecting the overall system stability. 