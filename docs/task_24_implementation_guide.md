# Task 24 Implementation Guide: Security Hardening and Redis Optimization for Fee System

## Overview

This guide provides detailed instructions for implementing Task 24, which addresses critical security vulnerabilities and performance inefficiencies in the current fee system's localStorage implementation by migrating to server-side Redis caching with proper security controls.

## Current State Analysis

### ✅ Available Infrastructure

1. **CSRF Protection System** (`server/services/security/securityService.ts`)
   - `SecurityService.generateCSRFToken()` - JWT-based tokens with 1-hour expiry
   - `SecurityService.validateCSRFToken()` - Full validation with error handling
   - `InternalRouteGuard.requireCSRF()` - Middleware for CSRF validation
   - CSRF token endpoint: `/api/internal/csrfToken`

2. **Redis Caching Infrastructure** (`server/services/cacheService.ts`)
   - `RouteType.PRICE` - 60-second cache duration with stale-while-revalidate
   - `dbManager.handleCache()` - Full Redis caching with fallback to in-memory
   - `dbManager.setCachedData()` / `getCachedData()` - Low-level Redis operations
   - Automatic fallback to in-memory cache when Redis unavailable

3. **QuickNode Caching Service** (`server/services/quicknode/cachedQuicknodeRpcService.ts`)
   - `CachedQuicknodeRPCService.executeRPC()` - 5-minute cache for RPC calls
   - Automatic error handling and cache management
   - Integration with existing dbManager caching

4. **Rate Limiting Constants** (`lib/utils/constants.ts`)
   - `RATE_LIMIT_REQUESTS = 100` requests
   - `RATE_LIMIT_WINDOW = 60 * 1000` (1 minute)
   - `ApiResponseUtil.tooManyRequests()` - 429 response helper

5. **Monitoring System** (`lib/utils/monitoring.ts`)
   - Real-time metrics tracking and alerting
   - API endpoint: `/api/internal/monitoring`
   - Fee source health monitoring already implemented

### 🔍 Current Fee System Structure

**Files to Modify:**
- `lib/utils/feeSignal.ts` - Global fee signal with localStorage caching
- `routes/api/internal/fees.ts` - Fee API endpoint with in-memory caching
- `server/services/quicknode/quicknodeService.ts` - QuickNode fee estimation

**Current Flow:**
```
Client → feeSignal.ts → /api/internal/fees → mempool.space/QuickNode → localStorage cache
```

**Target Flow:**
```
Client → feeSignal.ts → /api/internal/fees (with CSRF + rate limiting) → Redis cache → Background job → mempool.space/QuickNode
```

## Implementation Plan

### Subtask 24.1: Add CSRF Protection to Fee Endpoints

**Files to Modify:**
- `routes/api/internal/fees.ts`
- `lib/utils/feeSignal.ts`

**Implementation Steps:**

1. **Update Fee API Endpoint** (`routes/api/internal/fees.ts`):
```typescript
import { InternalRouteGuard } from "$server/services/security/internalRouteGuard.ts";

export const handler: Handlers = {
  async GET(req) {
    // Add CSRF protection
    const csrfError = await InternalRouteGuard.requireCSRF(req);
    if (csrfError) {
      return csrfError;
    }

    // Existing fee logic...
  }
};
```

2. **Update Fee Signal Client** (`lib/utils/feeSignal.ts`):
```typescript
// Add CSRF token fetching
const fetchCSRFToken = async (): Promise<string> => {
  const response = await axiod.get("/api/internal/csrfToken");
  return response.data.token;
};

// Update fetchFees function
const fetchFees = async (retryCount = 0): Promise<void> => {
  try {
    const csrfToken = await fetchCSRFToken();
    const response = await axiod.get<FeeData>("/api/internal/fees", {
      headers: {
        "X-CSRF-Token": csrfToken,
      },
    });
    // Rest of existing logic...
  } catch (error) {
    // Handle CSRF errors specifically
    if (error.response?.status === 400 && error.response?.data?.includes("CSRF")) {
      console.error("[feeSignal] CSRF validation failed");
    }
    // Existing error handling...
  }
};
```

### Subtask 24.2: Implement Rate Limiting for Fee Endpoints

**Files to Create:**
- `server/middleware/rateLimitMiddleware.ts`

**Files to Modify:**
- `routes/api/internal/fees.ts`

**Implementation Steps:**

1. **Create Rate Limiting Middleware**:
```typescript
// server/middleware/rateLimitMiddleware.ts
import { RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW } from "$lib/utils/constants.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export class RateLimitMiddleware {
  static async checkRateLimit(req: Request, limit = RATE_LIMIT_REQUESTS, window = RATE_LIMIT_WINDOW): Promise<Response | null> {
    const clientIP = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    const now = Date.now();
    const key = `rate_limit_${clientIP}`;
    
    const entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + window,
      });
      return null; // No rate limit
    }
    
    if (entry.count >= limit) {
      return ApiResponseUtil.tooManyRequests(
        `Rate limit exceeded. Try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds.`
      );
    }
    
    entry.count++;
    return null; // No rate limit
  }
}
```

2. **Apply Rate Limiting to Fee Endpoint**:
```typescript
// routes/api/internal/fees.ts
import { RateLimitMiddleware } from "$server/middleware/rateLimitMiddleware.ts";

export const handler: Handlers = {
  async GET(req) {
    // Check rate limit first
    const rateLimitError = await RateLimitMiddleware.checkRateLimit(req);
    if (rateLimitError) {
      return rateLimitError;
    }

    // Then check CSRF
    const csrfError = await InternalRouteGuard.requireCSRF(req);
    if (csrfError) {
      return csrfError;
    }

    // Existing fee logic...
  }
};
```

### Subtask 24.3: Migrate Primary Fee Caching to Redis

**Files to Modify:**
- `routes/api/internal/fees.ts`
- `server/services/feeService.ts` (new file)

**Implementation Steps:**

1. **Create Fee Service** (`server/services/feeService.ts`):
```typescript
import { dbManager } from "$server/database/databaseManager.ts";
import { RouteType, getCacheConfig } from "$server/services/cacheService.ts";
import { QuicknodeService } from "$server/services/quicknode/quicknodeService.ts";

export class FeeService {
  private static readonly CACHE_KEY = "fee_estimation_data";
  private static readonly CACHE_TYPE = RouteType.PRICE; // 60-second cache

  static async getFeeEstimation(): Promise<FeeData> {
    const cacheConfig = getCacheConfig(this.CACHE_TYPE);
    
    return await dbManager.handleCache(
      this.CACHE_KEY,
      async () => {
        // Try mempool.space first, then QuickNode
        return await this.fetchFeeFromSources();
      },
      cacheConfig.duration
    );
  }

  private static async fetchFeeFromSources(): Promise<FeeData> {
    // Existing fee fetching logic from routes/api/internal/fees.ts
    // Move the cascading fallback logic here
  }

  static async invalidateCache(): Promise<void> {
    await dbManager.invalidateCache(this.CACHE_KEY);
  }
}
```

2. **Update Fee API to Use Service**:
```typescript
// routes/api/internal/fees.ts
import { FeeService } from "$server/services/feeService.ts";

export const handler: Handlers = {
  async GET(req) {
    // Security checks...
    
    try {
      const feeData = await FeeService.getFeeEstimation();
      return Response.json(feeData);
    } catch (error) {
      console.error("[fees.ts] Error fetching fees:", error);
      return Response.json(
        { error: "Failed to fetch fee estimation" },
        { status: 500 }
      );
    }
  }
};
```

### Subtask 24.4: Integrate with Existing QuickNode Caching Service

**Files to Modify:**
- `server/services/quicknode/quicknodeService.ts`
- `server/services/feeService.ts`

**Implementation Steps:**

1. **Update QuickNode Service to Use Cached RPC**:
```typescript
// server/services/quicknode/quicknodeService.ts
import { CachedQuicknodeRPCService } from "./cachedQuicknodeRpcService.ts";

export class QuicknodeService {
  static async estimateSmartFee(confTarget: number = 6): Promise<number> {
    try {
      const result = await CachedQuicknodeRPCService.executeRPC<{ feerate: number }>(
        "estimatesmartfee",
        [confTarget],
        300 // 5-minute cache
      );

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.result?.feerate) {
        throw new Error("No fee rate returned from QuickNode");
      }

      // Convert BTC/kB to sats/vB
      const satsPerVByte = (result.result.feerate * 100_000_000) / 1000;
      return Math.max(1, Math.round(satsPerVByte)); // Minimum 1 sat/vB
    } catch (error) {
      console.error("QuickNode fee estimation failed:", error);
      throw error;
    }
  }
}
```

### Subtask 24.5: Implement Background Fee Updates

**Files to Create:**
- `server/services/backgroundJobs.ts`
- `server/cron/feeUpdater.ts`

**Implementation Steps:**

1. **Create Background Job Service**:
```typescript
// server/services/backgroundJobs.ts
import { FeeService } from "$server/services/feeService.ts";

export class BackgroundJobService {
  private static feeUpdateInterval: number | null = null;
  private static readonly FEE_UPDATE_INTERVAL = 60 * 1000; // 60 seconds

  static startFeeUpdates(): void {
    if (this.feeUpdateInterval) return;

    console.log("[BackgroundJobs] Starting fee update background job");
    
    // Initial update
    this.updateFees();
    
    // Schedule regular updates
    this.feeUpdateInterval = setInterval(() => {
      this.updateFees();
    }, this.FEE_UPDATE_INTERVAL);
  }

  static stopFeeUpdates(): void {
    if (this.feeUpdateInterval) {
      clearInterval(this.feeUpdateInterval);
      this.feeUpdateInterval = null;
      console.log("[BackgroundJobs] Stopped fee update background job");
    }
  }

  private static async updateFees(): Promise<void> {
    try {
      console.log("[BackgroundJobs] Updating fee cache...");
      await FeeService.invalidateCache();
      await FeeService.getFeeEstimation();
      console.log("[BackgroundJobs] Fee cache updated successfully");
    } catch (error) {
      console.error("[BackgroundJobs] Failed to update fee cache:", error);
    }
  }
}
```

2. **Start Background Jobs in Main**:
```typescript
// main.ts or appropriate startup file
import { BackgroundJobService } from "$server/services/backgroundJobs.ts";

// Start background jobs when server starts
if (Deno.env.get("DENO_ENV") === "production") {
  BackgroundJobService.startFeeUpdates();
}
```

### Subtask 24.6: Downgrade localStorage to Emergency Fallback

**Files to Modify:**
- `lib/utils/feeSignal.ts`

**Implementation Steps:**

1. **Update Fee Signal Fallback Logic**:
```typescript
// lib/utils/feeSignal.ts

// Update fetchFees function to use localStorage only as last resort
const fetchFees = async (retryCount = 0): Promise<void> => {
  try {
    // Primary: API call to Redis-backed endpoint
    const response = await axiod.get<FeeData>("/api/internal/fees", {
      headers: { "X-CSRF-Token": await fetchCSRFToken() },
    });
    
    // Success - save to localStorage as backup only
    saveFeeDataToStorage(response.data);
    
    feeSignal.value = {
      data: response.data,
      loading: false,
      lastUpdated: Date.now(),
      error: null,
      retryCount: 0,
      lastKnownGoodData: response.data,
    };
  } catch (error) {
    // Fallback hierarchy:
    // 1. Last known good data (in memory)
    // 2. localStorage (emergency offline fallback)
    // 3. Static defaults
    
    let fallbackData: FeeData | null = null;
    
    // Try last known good data first
    if (feeSignal.value.lastKnownGoodData) {
      fallbackData = {
        ...feeSignal.value.lastKnownGoodData,
        source: "cached",
        confidence: "medium",
        fallbackUsed: true,
      };
    }
    
    // Only use localStorage if no in-memory data available
    if (!fallbackData) {
      const localStorageData = loadFeeDataFromStorage();
      if (localStorageData && isValidCachedData(localStorageData)) {
        fallbackData = {
          ...localStorageData,
          source: "cached",
          confidence: "low",
          fallbackUsed: true,
        };
      }
    }
    
    // Final fallback to static defaults
    if (!fallbackData) {
      fallbackData = getStaticFallbackFees();
    }
    
    feeSignal.value = {
      data: fallbackData,
      loading: false,
      lastUpdated: feeSignal.value.lastUpdated,
      error: error.message,
      retryCount: retryCount + 1,
      lastKnownGoodData: feeSignal.value.lastKnownGoodData,
    };
  }
};

// Add validation for cached data
function isValidCachedData(data: FeeData): boolean {
  if (!data.timestamp) return false;
  
  // Only use localStorage data if it's less than 24 hours old
  const age = Date.now() - data.timestamp;
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  return age < maxAge && typeof data.recommendedFee === "number" && data.recommendedFee > 0;
}
```

### Subtask 24.7: Add Security Validation and Monitoring

**Files to Modify:**
- `server/services/feeService.ts`
- `lib/utils/monitoring.ts`

**Implementation Steps:**

1. **Add Fee Data Validation**:
```typescript
// server/services/feeService.ts

interface FeeValidationResult {
  isValid: boolean;
  errors: string[];
}

export class FeeService {
  private static validateFeeData(data: any): FeeValidationResult {
    const errors: string[] = [];
    
    // Validate fee values are reasonable
    if (typeof data.recommendedFee !== "number" || data.recommendedFee < 1 || data.recommendedFee > 1000) {
      errors.push("Invalid recommendedFee value");
    }
    
    if (data.fastestFee && (data.fastestFee < 1 || data.fastestFee > 1000)) {
      errors.push("Invalid fastestFee value");
    }
    
    // Validate source
    const validSources = ["mempool", "quicknode", "cached", "default"];
    if (data.source && !validSources.includes(data.source)) {
      errors.push("Invalid fee source");
    }
    
    // Check for suspicious patterns
    if (data.recommendedFee === 0 || data.recommendedFee > 500) {
      errors.push("Suspicious fee value detected");
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static async getFeeEstimation(): Promise<FeeData> {
    const feeData = await dbManager.handleCache(/* ... */);
    
    // Validate before returning
    const validation = this.validateFeeData(feeData);
    if (!validation.isValid) {
      console.error("[FeeService] Fee validation failed:", validation.errors);
      // Log security event
      recordSecurityEvent("fee_validation_failed", {
        errors: validation.errors,
        data: feeData,
      });
      
      // Return safe fallback
      return this.getSafeFallbackFees();
    }
    
    return feeData;
  }
}
```

2. **Add Security Event Monitoring**:
```typescript
// lib/utils/monitoring.ts

export function recordSecurityEvent(eventType: string, details: any): void {
  const securityEvent = {
    type: eventType,
    timestamp: Date.now(),
    details,
    severity: "medium" as const,
  };
  
  console.warn("[SECURITY]", securityEvent);
  
  // In production, this could send to security monitoring service
  if (Deno.env.get("DENO_ENV") === "production") {
    // Send to security monitoring system
  }
}
```

### Subtask 24.8: Performance Testing and Migration Validation

**Files to Create:**
- `tests/fee-security.test.ts`
- `tests/fee-performance.test.ts`

**Implementation Steps:**

1. **Create Security Tests**:
```typescript
// tests/fee-security.test.ts
import { assertEquals, assertRejects } from "@std/assert";
import { FeeService } from "$server/services/feeService.ts";

Deno.test("Fee Security Tests", async (t) => {
  await t.step("should reject invalid CSRF tokens", async () => {
    const response = await fetch("/api/internal/fees", {
      headers: { "X-CSRF-Token": "invalid-token" },
    });
    assertEquals(response.status, 400);
  });

  await t.step("should enforce rate limiting", async () => {
    // Make 101 requests rapidly
    const promises = Array.from({ length: 101 }, () =>
      fetch("/api/internal/fees", {
        headers: { "X-CSRF-Token": await getValidCSRFToken() },
      })
    );
    
    const responses = await Promise.all(promises);
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    
    assert(rateLimitedResponses.length > 0, "Rate limiting should be enforced");
  });

  await t.step("should validate fee data", async () => {
    const invalidFeeData = { recommendedFee: -1 };
    assertRejects(() => FeeService.validateAndCache(invalidFeeData));
  });
});
```

2. **Create Performance Tests**:
```typescript
// tests/fee-performance.test.ts
import { assertEquals } from "@std/assert";

Deno.test("Fee Performance Tests", async (t) => {
  await t.step("Redis caching should be faster than localStorage", async () => {
    const redisStart = performance.now();
    await FeeService.getFeeEstimation();
    const redisTime = performance.now() - redisStart;

    const localStorageStart = performance.now();
    const localData = loadFeeDataFromStorage();
    const localStorageTime = performance.now() - localStorageStart;

    console.log(`Redis: ${redisTime}ms, localStorage: ${localStorageTime}ms`);
    // Redis should be comparable or faster for cached data
  });

  await t.step("should handle concurrent requests efficiently", async () => {
    const start = performance.now();
    const promises = Array.from({ length: 10 }, () => FeeService.getFeeEstimation());
    await Promise.all(promises);
    const duration = performance.now() - start;

    // Should complete within reasonable time
    assert(duration < 5000, `Concurrent requests took too long: ${duration}ms`);
  });
});
```

## Migration Strategy

### Phase 1: Security Hardening (Subtasks 24.1-24.2)
1. Deploy CSRF protection
2. Implement rate limiting
3. Test security measures
4. Monitor for security events

### Phase 2: Redis Migration (Subtasks 24.3-24.4)
1. Deploy FeeService with Redis caching
2. Update QuickNode integration
3. Test fallback behavior
4. Monitor performance improvements

### Phase 3: Background Jobs (Subtask 24.5)
1. Deploy background fee updates
2. Monitor cache warming
3. Verify reduced API calls

### Phase 4: localStorage Downgrade (Subtask 24.6)
1. Update client-side fallback logic
2. Test offline scenarios
3. Verify security improvements

### Phase 5: Validation & Monitoring (Subtasks 24.7-24.8)
1. Deploy security validation
2. Run performance tests
3. Monitor production metrics
4. Document improvements

## Environment Variables Required

Add to `.env` and `.cursor/mcp.json`:
```bash
# Already available
CSRF_SECRET_KEY=your-secret-key
REDIS_URL=redis://localhost:6379
QUICKNODE_ENDPOINT=your-quicknode-endpoint
QUICKNODE_API_KEY=your-api-key

# Optional for enhanced monitoring
SECURITY_MONITORING_ENDPOINT=your-security-service
```

## Success Metrics

### Security Improvements
- ✅ CSRF protection on all fee endpoints
- ✅ Rate limiting prevents abuse (429 responses)
- ✅ Server-side fee data validation
- ✅ Security event monitoring and alerting

### Performance Improvements
- ✅ Reduced client-side API calls (shared Redis cache)
- ✅ Faster fee data retrieval (Redis vs localStorage)
- ✅ Background cache warming (60-second updates)
- ✅ Improved cache hit rates

### Reliability Improvements
- ✅ Graceful degradation when Redis unavailable
- ✅ Maintained zero downtime during API failures
- ✅ Enhanced monitoring and alerting
- ✅ Comprehensive test coverage

## Rollback Plan

If issues arise during deployment:

1. **Immediate Rollback**: Revert to localStorage-only caching
2. **Partial Rollback**: Disable specific features (CSRF, rate limiting, Redis)
3. **Feature Flags**: Use environment variables to toggle new features
4. **Monitoring**: Watch for increased error rates or performance degradation

## Next Steps for Implementation

1. **Review Current Implementation**: Understand the existing fee system thoroughly
2. **Set Up Development Environment**: Ensure Redis is available for testing
3. **Implement Security First**: Start with CSRF and rate limiting (lowest risk)
4. **Test Thoroughly**: Each subtask should have comprehensive tests
5. **Deploy Incrementally**: Use feature flags for gradual rollout
6. **Monitor Continuously**: Watch metrics during and after deployment

This implementation will provide a production-ready, secure, and performant fee system that addresses all the concerns identified in the original localStorage implementation. 