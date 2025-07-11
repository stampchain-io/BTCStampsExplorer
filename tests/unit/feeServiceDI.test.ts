/**
 * @fileoverview Comprehensive tests for Dependency-Injected FeeService
 * Tests all providers, fallback logic, caching, and error scenarios
 */

import { assertEquals, assertExists } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";

// Set test environment
(globalThis as any).SKIP_REDIS_CONNECTION = true;
Deno.env.set("SKIP_REDIS_CONNECTION", "true");
Deno.env.set("DENO_ENV", "test");

import {
  type CacheService,
  type FeeData,
  type FeeProvider,
  type FeeServiceDependencies,
  FeeServiceDI,
  type PriceService,
  type SecurityService,
} from "$server/services/fee/feeServiceDI.ts";

// Mock implementations
class MockCacheService implements CacheService {
  private cache = new Map<string, { value: any; expiry: number }>();

  async get<T>(
    key: string,
    factory: () => Promise<T>,
    durationSeconds: number,
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && cached.expiry > now) {
      return cached.value as T;
    }

    // Cache miss - compute new value
    const value = await factory();
    this.cache.set(key, {
      value,
      expiry: now + (durationSeconds * 1000),
    });

    return value;
  }

  clear(): void {
    this.cache.clear();
  }
}

class MockPriceService implements PriceService {
  constructor(
    private mockPrice: number = 50000,
    private shouldFail: boolean = false,
  ) {}

  async getPrice(): Promise<{ price: number }> {
    if (this.shouldFail) {
      throw new Error("Mock price service configured to fail");
    }
    await Promise.resolve(); // Simulate async operation
    return { price: this.mockPrice };
  }

  setPrice(price: number): void {
    this.mockPrice = price;
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }
}

class MockFeeProvider implements FeeProvider {
  constructor(
    private name: string,
    private mockFee: number = 10,
    private confidence: "high" | "medium" | "low" = "high",
    private shouldFail: boolean = false,
    private debugResponse?: any,
  ) {}

  getName(): string {
    return this.name;
  }

  async getFeeEstimate(): Promise<{
    recommendedFee: number;
    confidence: "high" | "medium" | "low";
    debug_feesResponse?: any;
  }> {
    if (this.shouldFail) {
      throw new Error(`Mock provider ${this.name} configured to fail`);
    }

    await Promise.resolve(); // Simulate async operation
    return {
      recommendedFee: this.mockFee,
      confidence: this.confidence,
      debug_feesResponse: this.debugResponse ||
        { mock: true, provider: this.name },
    };
  }

  setFee(fee: number): void {
    this.mockFee = fee;
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setConfidence(confidence: "high" | "medium" | "low"): void {
    this.confidence = confidence;
  }
}

// Mock security service
class MockSecurityService implements SecurityService {
  validateFeeData(_feeData: FeeData, _source: string) {
    // Allow all data by default for testing
    return {
      isValid: true,
      action: "allow" as const,
      violations: [],
      riskLevel: "low" as const,
    };
  }
}

describe("FeeServiceDI", () => {
  let mockCache: MockCacheService;
  let mockPriceService: MockPriceService;
  let mockMempoolProvider: MockFeeProvider;
  let mockQuicknodeProvider: MockFeeProvider;
  let mockStaticProvider: MockFeeProvider;
  let dependencies: FeeServiceDependencies;
  let feeService: FeeServiceDI;

  beforeEach(() => {
    mockCache = new MockCacheService();
    mockPriceService = new MockPriceService(50000);
    mockMempoolProvider = new MockFeeProvider("mempool", 15, "high", false, {
      fastestFee: 15,
      halfHourFee: 12,
      hourFee: 8,
    });
    mockQuicknodeProvider = new MockFeeProvider(
      "quicknode",
      10,
      "medium",
      false,
    );
    mockStaticProvider = new MockFeeProvider("static", 5, "low", false);

    dependencies = {
      cacheService: mockCache,
      priceService: mockPriceService,
      feeProviders: [
        mockMempoolProvider,
        mockQuicknodeProvider,
        mockStaticProvider,
      ],
      securityService: new MockSecurityService(),
    };

    feeService = new FeeServiceDI(dependencies);
  });

  describe("Basic Fee Estimation", () => {
    it("should return fee data from primary provider", async () => {
      const feeData = await feeService.getFeeData();

      assertEquals(feeData.recommendedFee, 15);
      assertEquals(feeData.source, "mempool");
      assertEquals(feeData.confidence, "high");
      assertEquals(feeData.btcPrice, 50000);
      assertEquals(feeData.fallbackUsed, false);
      assertExists(feeData.timestamp);
      assertExists(feeData.debug_feesResponse);
    });

    it("should include BTC price in response", async () => {
      mockPriceService.setPrice(60000);
      const feeData = await feeService.getFeeData();

      assertEquals(feeData.btcPrice, 60000);
    });

    it("should handle price service failure gracefully", async () => {
      mockPriceService.setShouldFail(true);
      const feeData = await feeService.getFeeData();

      assertEquals(feeData.recommendedFee, 15);
      assertEquals(feeData.btcPrice, 0); // Should fallback to 0
      assertEquals(feeData.source, "mempool");
    });
  });

  describe("Provider Fallback Logic", () => {
    it("should fallback to secondary provider when primary fails", async () => {
      mockMempoolProvider.setShouldFail(true);
      const feeData = await feeService.getFeeData();

      assertEquals(feeData.recommendedFee, 10);
      assertEquals(feeData.source, "quicknode");
      assertEquals(feeData.confidence, "medium");
      assertEquals(feeData.fallbackUsed, true);
      assertEquals(feeData.errors?.length, 1);
    });

    it("should fallback through multiple providers", async () => {
      mockMempoolProvider.setShouldFail(true);
      mockQuicknodeProvider.setShouldFail(true);
      const feeData = await feeService.getFeeData();

      assertEquals(feeData.recommendedFee, 5);
      assertEquals(feeData.source, "static");
      assertEquals(feeData.confidence, "low");
      assertEquals(feeData.fallbackUsed, true);
      assertEquals(feeData.errors?.length, 2);
    });

    it("should use static fallback when all providers fail", async () => {
      mockMempoolProvider.setShouldFail(true);
      mockQuicknodeProvider.setShouldFail(true);
      mockStaticProvider.setShouldFail(true);

      const feeData = await feeService.getFeeData();

      assertEquals(feeData.recommendedFee, 10); // Conservative static rate
      assertEquals(feeData.source, "default");
      assertEquals(feeData.confidence, "low");
      assertEquals(feeData.fallbackUsed, true);
      assertExists(feeData.debug_feesResponse?.static_fallback);
    });
  });

  describe("Caching Behavior", () => {
    it("should cache fee data", async () => {
      // First call
      const feeData1 = await feeService.getFeeData();
      assertEquals(feeData1.recommendedFee, 15);

      // Change provider data
      mockMempoolProvider.setFee(20);

      // Second call should return cached data
      const feeData2 = await feeService.getFeeData();
      assertEquals(feeData2.recommendedFee, 15); // Still cached value
    });

    it("should return fresh data after cache expiry", async () => {
      // Create service with very short cache duration
      const shortCacheFeeService = new FeeServiceDI(dependencies, {
        cacheDuration: 0.1, // 0.1 seconds
      });

      // First call
      const feeData1 = await shortCacheFeeService.getFeeData();
      assertEquals(feeData1.recommendedFee, 15);

      // Change provider data
      mockMempoolProvider.setFee(25);

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Second call should return fresh data
      const feeData2 = await shortCacheFeeService.getFeeData();
      assertEquals(feeData2.recommendedFee, 25);
    });

    it("should clear cache properly", async () => {
      await feeService.getFeeData();
      mockCache.clear();
      mockMempoolProvider.setFee(30);

      const feeData = await feeService.getFeeData();
      assertEquals(feeData.recommendedFee, 30);
    });
  });

  describe("Configuration and Customization", () => {
    it("should use custom configuration", () => {
      const customFeeService = new FeeServiceDI(dependencies, {
        cacheKey: "custom_fee_key",
        cacheDuration: 60,
        maxRetries: 5,
        retryDelay: 500,
        staticFallbackRates: {
          conservative: 20,
          normal: 15,
          minimum: 5,
        },
      });

      const config = customFeeService.getConfig();
      assertEquals(config.cacheKey, "custom_fee_key");
      assertEquals(config.cacheDuration, 60);
      assertEquals(config.maxRetries, 5);
      assertEquals(config.retryDelay, 500);
      assertEquals(config.staticFallbackRates.conservative, 20);
    });

    it("should return cache info", () => {
      const cacheInfo = feeService.getCacheInfo();
      assertEquals(cacheInfo.cacheKey, "fee_estimation_data");
      assertEquals(cacheInfo.cacheDuration, 30);
    });

    it("should return provider list", () => {
      const providers = feeService.getProviders();
      assertEquals(providers, ["mempool", "quicknode", "static"]);
    });
  });

  describe("Security Validation", () => {
    it("should block fee data when security validation fails", async () => {
      // Mock security service to block data
      class BlockingSecurityService implements SecurityService {
        validateFeeData(_feeData: any, source: string) {
          // Block only the mempool provider, allow others
          if (source === "mempool") {
            return {
              isValid: false,
              action: "block" as const,
              violations: ["fee_too_high"],
              riskLevel: "high" as const,
            };
          }
          return {
            isValid: true,
            action: "allow" as const,
            violations: [],
            riskLevel: "low" as const,
          };
        }
      }

      const secureService = new FeeServiceDI({
        ...dependencies,
        securityService: new BlockingSecurityService(),
      });

      const feeData = await secureService.getFeeData();

      // Should fallback to next provider due to security block
      assertEquals(feeData.source, "quicknode");
    });

    it("should warn but allow fee data with security warnings", async () => {
      // Mock security service to warn
      class WarningSecurityService implements SecurityService {
        validateFeeData() {
          return {
            isValid: true,
            action: "warn" as const,
            violations: ["fee_slightly_high"],
            riskLevel: "medium" as const,
          };
        }
      }

      const secureService = new FeeServiceDI({
        ...dependencies,
        securityService: new WarningSecurityService(),
      });

      const feeData = await secureService.getFeeData();

      // Should still use primary provider despite warning
      assertEquals(feeData.source, "mempool");
      assertEquals(feeData.recommendedFee, 15);
    });

    it("should work without security service", async () => {
      const {
        securityService: _securityService,
        ...dependenciesWithoutSecurity
      } = dependencies;
      const unsecuredService = new FeeServiceDI(dependenciesWithoutSecurity);

      const feeData = await unsecuredService.getFeeData();
      assertEquals(feeData.source, "mempool");
      assertEquals(feeData.recommendedFee, 15);
    });
  });

  describe("Error Handling and Resilience", () => {
    it("should handle provider throwing unexpected errors", async () => {
      // Create a provider that throws a non-Error object
      const badProvider: FeeProvider = {
        getName: () => "bad_provider",
        getFeeEstimate: () => {
          throw "String error instead of Error object";
        },
      };

      const serviceWithBadProvider = new FeeServiceDI({
        ...dependencies,
        feeProviders: [badProvider, mockQuicknodeProvider],
      });

      const feeData = await serviceWithBadProvider.getFeeData();
      assertEquals(feeData.source, "quicknode");
      assertEquals(feeData.fallbackUsed, true);
    });

    it("should handle cache service failures", async () => {
      const failingCache: CacheService = {
        get: async () => {
          await Promise.resolve();
          throw new Error("Cache service failure");
        },
      };

      const serviceWithFailingCache = new FeeServiceDI({
        ...dependencies,
        cacheService: failingCache,
      });

      const feeData = await serviceWithFailingCache.getFeeData();
      // Should fallback to static rates
      assertEquals(feeData.source, "default");
      assertEquals(feeData.confidence, "low");
    });

    it("should return static fallback on complete service failure", async () => {
      // Make everything fail
      const failingDependencies: FeeServiceDependencies = {
        cacheService: {
          get: async () => {
            await Promise.resolve();
            throw new Error("Cache failed");
          },
        },
        priceService: {
          getPrice: async () => {
            await Promise.resolve();
            throw new Error("Price failed");
          },
        },
        feeProviders: [],
      };

      const failingService = new FeeServiceDI(failingDependencies);
      const feeData = await failingService.getFeeData();

      assertEquals(feeData.source, "default");
      assertEquals(feeData.confidence, "low");
      assertEquals(feeData.fallbackUsed, true);
      assertEquals(feeData.btcPrice, 0);
    });
  });

  describe("Provider Confidence Levels", () => {
    it("should preserve provider confidence levels", async () => {
      mockMempoolProvider.setConfidence("medium");
      const feeData = await feeService.getFeeData();

      assertEquals(feeData.confidence, "medium");
    });

    it("should handle different provider confidence levels", async () => {
      mockMempoolProvider.setShouldFail(true);
      mockQuicknodeProvider.setConfidence("low");

      const feeData = await feeService.getFeeData();
      assertEquals(feeData.confidence, "low");
    });
  });

  describe("Performance and Timing", () => {
    it("should include timestamp in response", async () => {
      const before = Date.now();
      const feeData = await feeService.getFeeData();
      const after = Date.now();

      assertEquals(feeData.timestamp >= before, true);
      assertEquals(feeData.timestamp <= after, true);
    });

    it("should handle concurrent requests properly", async () => {
      const promises = Array(5).fill(null).map(() => feeService.getFeeData());
      const results = await Promise.all(promises);

      // All results should be identical (cached)
      for (const result of results) {
        assertEquals(result.recommendedFee, 15);
        assertEquals(result.source, "mempool");
      }
    });
  });
});
