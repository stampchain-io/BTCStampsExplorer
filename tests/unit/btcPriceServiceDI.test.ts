/**
 * @fileoverview Comprehensive tests for Dependency-Injected BTCPriceService
 * Tests all providers, fallback logic, caching, and error scenarios
 */

import { assertEquals, assertExists } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";

// Set test environment
(globalThis as any).SKIP_REDIS_CONNECTION = true;
Deno.env.set("SKIP_REDIS_CONNECTION", "true");
Deno.env.set("DENO_ENV", "test");

import {
  BinancePriceProvider,
  BTCPriceServiceDI,
  CoinGeckoPriceProvider,
  MockPriceProvider,
  type PriceProvider,
  type PriceServiceDependencies,
} from "$server/services/price/btcPriceServiceDI.ts";
import type { CacheService } from "$server/interfaces/cacheService.ts";
import type {
  HttpClient,
  HttpResponse,
} from "$server/interfaces/httpClient.ts";

// Mock implementations
class MockCacheService implements CacheService {
  private cache = new Map<string, { value: any; expiry: number }>();

  async get<T>(
    key: string,
    factory: () => Promise<T>,
    config: { ttl: number },
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
      expiry: now + (config.ttl * 1000),
    });

    return value;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await Promise.resolve(); // Simulate async operation
    const expiry = ttlSeconds
      ? Date.now() + (ttlSeconds * 1000)
      : Date.now() + 300000;
    this.cache.set(key, { value, expiry });
  }

  async delete(key: string): Promise<void> {
    await Promise.resolve(); // Simulate async operation
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

class MockHttpClient implements HttpClient {
  private mockResponses = new Map<string, HttpResponse<any>>();
  private shouldFail = false;

  setMockResponse(url: string, response: HttpResponse<any>): void {
    this.mockResponses.set(url, response);
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  clearMockResponses(): void {
    this.mockResponses.clear();
  }

  async get<T = any>(url: string, _config?: any): Promise<HttpResponse<T>> {
    await Promise.resolve(); // Simulate async operation
    if (this.shouldFail) {
      throw new Error("Mock HTTP client configured to fail");
    }

    const mockResponse = this.mockResponses.get(url);
    if (mockResponse) {
      return mockResponse as HttpResponse<T>;
    }

    // Default successful response for unknown URLs
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      data: { mock: true, url } as T,
      headers: {},
    };
  }

  async post<T = any>(): Promise<HttpResponse<T>> {
    await Promise.resolve();
    throw new Error("POST not implemented in mock");
  }

  async put<T = any>(): Promise<HttpResponse<T>> {
    await Promise.resolve();
    throw new Error("PUT not implemented in mock");
  }

  async delete<T = any>(): Promise<HttpResponse<T>> {
    await Promise.resolve();
    throw new Error("DELETE not implemented in mock");
  }

  async request<T = any>(): Promise<HttpResponse<T>> {
    await Promise.resolve();
    throw new Error("Generic request not implemented in mock");
  }
}

describe("BTCPriceServiceDI", () => {
  let mockCache: MockCacheService;
  let mockHttpClient: MockHttpClient;
  let mockCoinGeckoProvider: MockPriceProvider;
  let mockBinanceProvider: MockPriceProvider;
  let dependencies: PriceServiceDependencies;
  let priceService: BTCPriceServiceDI;

  beforeEach(() => {
    mockCache = new MockCacheService();
    mockHttpClient = new MockHttpClient();
    mockCoinGeckoProvider = new MockPriceProvider("coingecko", 50000, "high");
    mockBinanceProvider = new MockPriceProvider("binance", 49500, "high");

    dependencies = {
      cacheService: mockCache,
      httpClient: mockHttpClient,
      priceProviders: [mockCoinGeckoProvider, mockBinanceProvider],
    };

    priceService = new BTCPriceServiceDI(dependencies);
  });

  describe("Basic Price Fetching", () => {
    it("should return price data from primary provider", async () => {
      const priceData = await priceService.getPrice();

      assertEquals(priceData.price, 50000);
      assertEquals(priceData.source, "coingecko");
      assertEquals(priceData.confidence, "high");
      assertEquals(priceData.fallbackUsed, false);
      assertExists(priceData.timestamp);
      assertExists(priceData.details);
    });

    it("should use preferred source when specified", async () => {
      const priceData = await priceService.getPrice("binance");

      assertEquals(priceData.price, 49500);
      assertEquals(priceData.source, "binance");
      assertEquals(priceData.confidence, "high");
      assertEquals(priceData.fallbackUsed, false);
    });

    it("should handle provider rotation", async () => {
      // First call should use first provider
      const price1 = await priceService.getPrice();
      assertEquals(price1.source, "coingecko");

      // Clear cache to force fresh fetch
      mockCache.clear();

      // Second call should rotate to second provider
      const price2 = await priceService.getPrice();
      assertEquals(price2.source, "binance");
    });
  });

  describe("Provider Fallback Logic", () => {
    it("should fallback to secondary provider when primary fails", async () => {
      mockCoinGeckoProvider.setShouldFail(true);
      const priceData = await priceService.getPrice();

      assertEquals(priceData.price, 49500);
      assertEquals(priceData.source, "binance");
      assertEquals(priceData.confidence, "high");
      assertEquals(priceData.fallbackUsed, true);
      assertEquals(priceData.errors?.length, 1);
    });

    it("should use static fallback when all providers fail", async () => {
      mockCoinGeckoProvider.setShouldFail(true);
      mockBinanceProvider.setShouldFail(true);

      const priceData = await priceService.getPrice();

      assertEquals(priceData.price, 0); // Default static fallback
      assertEquals(priceData.source, "default");
      assertEquals(priceData.confidence, "low");
      assertEquals(priceData.fallbackUsed, true);
      assertExists(priceData.details?.static_fallback);
      assertEquals(priceData.errors?.length, 2);
    });

    it("should handle custom static fallback price", async () => {
      const customService = new BTCPriceServiceDI(dependencies, {
        staticFallbackPrice: 45000,
      });

      mockCoinGeckoProvider.setShouldFail(true);
      mockBinanceProvider.setShouldFail(true);

      const priceData = await customService.getPrice();

      assertEquals(priceData.price, 45000);
      assertEquals(priceData.source, "default");
      assertEquals(priceData.details?.fallbackPrice, 45000);
    });
  });

  describe("Caching Behavior", () => {
    it("should cache price data", async () => {
      // First call
      const price1 = await priceService.getPrice();
      assertEquals(price1.price, 50000);

      // Change provider data
      mockCoinGeckoProvider.setPrice(60000);

      // Second call should return cached data
      const price2 = await priceService.getPrice();
      assertEquals(price2.price, 50000); // Still cached value
    });

    it("should return fresh data after cache invalidation", async () => {
      // First call with preferred source to avoid rotation
      const price1 = await priceService.getPrice("coingecko");
      assertEquals(price1.price, 50000);

      // Change provider data
      mockCoinGeckoProvider.setPrice(55000);

      // Invalidate cache
      await priceService.invalidateCache();

      // Next call should return fresh data (same preferred source)
      const price2 = await priceService.getPrice("coingecko");
      assertEquals(price2.price, 55000);
    });

    it("should use custom cache configuration", () => {
      const customService = new BTCPriceServiceDI(dependencies, {
        cacheKey: "custom_btc_price",
        cacheDuration: 60,
      });

      const cacheInfo = customService.getCacheInfo();
      assertEquals(cacheInfo.cacheKey, "custom_btc_price");
      assertEquals(cacheInfo.cacheDuration, 60);
    });
  });

  describe("Configuration and Customization", () => {
    it("should use custom configuration", () => {
      const customService = new BTCPriceServiceDI(dependencies, {
        cacheKey: "custom_price_key",
        cacheDuration: 120,
        maxRetries: 5,
        retryDelay: 500,
        providerRotation: false,
      });

      const config = customService.getConfig();
      assertEquals(config.cacheKey, "custom_price_key");
      assertEquals(config.cacheDuration, 120);
      assertEquals(config.maxRetries, 5);
      assertEquals(config.retryDelay, 500);
      assertEquals(config.providerRotation, false);
    });

    it("should return provider list", () => {
      const providers = priceService.getProviders();
      assertEquals(providers, ["coingecko", "binance"]);
    });

    it("should handle disabled provider rotation", async () => {
      const nonRotatingService = new BTCPriceServiceDI(dependencies, {
        providerRotation: false,
      });

      // Multiple calls should always use first provider
      mockCache.clear();
      const price1 = await nonRotatingService.getPrice();
      assertEquals(price1.source, "coingecko");

      mockCache.clear();
      const price2 = await nonRotatingService.getPrice();
      assertEquals(price2.source, "coingecko");
    });
  });

  describe("Error Handling and Resilience", () => {
    it("should handle provider throwing unexpected errors", async () => {
      // Create a provider that throws a non-Error object
      const badProvider: PriceProvider = {
        getName: () => "bad_provider",
        getPrice: () => {
          throw "String error instead of Error object";
        },
      };

      const serviceWithBadProvider = new BTCPriceServiceDI({
        ...dependencies,
        priceProviders: [badProvider, mockBinanceProvider],
      });

      const priceData = await serviceWithBadProvider.getPrice();
      assertEquals(priceData.source, "binance");
      assertEquals(priceData.fallbackUsed, true);
    });

    it("should handle cache service failures", async () => {
      const failingCache: CacheService = {
        get: async () => {
          await Promise.resolve();
          throw new Error("Cache service failure");
        },
        set: async () => {
          await Promise.resolve();
          throw new Error("Cache set failure");
        },
        delete: async () => {
          await Promise.resolve();
          throw new Error("Cache delete failure");
        },
      };

      const serviceWithFailingCache = new BTCPriceServiceDI({
        ...dependencies,
        cacheService: failingCache,
      });

      const priceData = await serviceWithFailingCache.getPrice();
      // Should fallback to static price due to cache failure
      assertEquals(priceData.source, "default");
      assertEquals(priceData.confidence, "low");
    });

    it("should return static fallback on complete service failure", async () => {
      const failingDependencies: PriceServiceDependencies = {
        cacheService: {
          get: async () => {
            await Promise.resolve();
            throw new Error("Cache failed");
          },
          set: async () => {
            await Promise.resolve();
          },
          delete: async () => {
            await Promise.resolve();
          },
        },
        httpClient: mockHttpClient,
        priceProviders: [],
      };

      const failingService = new BTCPriceServiceDI(failingDependencies);
      const priceData = await failingService.getPrice();

      assertEquals(priceData.source, "default");
      assertEquals(priceData.confidence, "low");
      assertEquals(priceData.fallbackUsed, true);
      assertEquals(priceData.price, 0);
    });

    it("should validate price data", async () => {
      // Provider returning invalid price
      const invalidProvider = new MockPriceProvider("invalid", -100, "high");

      const serviceWithInvalidProvider = new BTCPriceServiceDI({
        ...dependencies,
        priceProviders: [invalidProvider, mockBinanceProvider],
      });

      const priceData = await serviceWithInvalidProvider.getPrice();
      // Should fallback to valid provider
      assertEquals(priceData.source, "binance");
      assertEquals(priceData.price, 49500);
    });
  });

  describe("Provider Confidence Levels", () => {
    it("should preserve provider confidence levels", async () => {
      mockCoinGeckoProvider.setConfidence("medium");
      const priceData = await priceService.getPrice();

      assertEquals(priceData.confidence, "medium");
    });

    it("should handle different provider confidence levels", async () => {
      mockCoinGeckoProvider.setShouldFail(true);
      mockBinanceProvider.setConfidence("low");

      const priceData = await priceService.getPrice();
      assertEquals(priceData.confidence, "low");
    });
  });

  describe("Performance and Timing", () => {
    it("should include timestamp in response", async () => {
      const before = Date.now();
      const priceData = await priceService.getPrice();
      const after = Date.now();

      assertEquals(priceData.timestamp >= before, true);
      assertEquals(priceData.timestamp <= after, true);
    });

    it("should handle concurrent requests properly", async () => {
      // Use preferred source to ensure consistent results
      const promises = Array(5).fill(null).map(() =>
        priceService.getPrice("coingecko")
      );
      const results = await Promise.all(promises);

      // All results should be identical (cached)
      for (const result of results) {
        assertEquals(result.price, 50000);
        assertEquals(result.source, "coingecko");
      }
    });
  });
});

describe("CoinGeckoPriceProvider", () => {
  let mockHttpClient: MockHttpClient;
  let provider: CoinGeckoPriceProvider;

  beforeEach(() => {
    mockHttpClient = new MockHttpClient();
    provider = new CoinGeckoPriceProvider(mockHttpClient);
  });

  it("should fetch price from CoinGecko API", async () => {
    mockHttpClient.setMockResponse(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
      {
        ok: true,
        status: 200,
        statusText: "OK",
        data: { bitcoin: { usd: 52000 } },
        headers: {},
      },
    );

    const result = await provider.getPrice();

    assertEquals(result.price, 52000);
    assertEquals(result.confidence, "high");
    assertExists(result.details);
  });

  it("should handle API errors", async () => {
    mockHttpClient.setMockResponse(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
      {
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        data: null,
        headers: {},
      },
    );

    try {
      await provider.getPrice();
      assertEquals(true, false, "Should have thrown an error");
    } catch (error) {
      assertEquals((error as Error).message.includes("429"), true);
    }
  });

  it("should handle invalid response structure", async () => {
    mockHttpClient.setMockResponse(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
      {
        ok: true,
        status: 200,
        statusText: "OK",
        data: { invalid: "structure" },
        headers: {},
      },
    );

    try {
      await provider.getPrice();
      assertEquals(true, false, "Should have thrown an error");
    } catch (error) {
      assertEquals((error as Error).message.includes("Invalid"), true);
    }
  });
});

describe("BinancePriceProvider", () => {
  let mockHttpClient: MockHttpClient;
  let provider: BinancePriceProvider;

  beforeEach(() => {
    mockHttpClient = new MockHttpClient();
    provider = new BinancePriceProvider(mockHttpClient);
  });

  it("should fetch price from Binance API", async () => {
    mockHttpClient.setMockResponse(
      "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
      {
        ok: true,
        status: 200,
        statusText: "OK",
        data: { symbol: "BTCUSDT", price: "51500.00" },
        headers: {},
      },
    );

    const result = await provider.getPrice();

    assertEquals(result.price, 51500);
    assertEquals(result.confidence, "high");
    assertExists(result.details);
  });

  it("should handle invalid price strings", async () => {
    mockHttpClient.setMockResponse(
      "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
      {
        ok: true,
        status: 200,
        statusText: "OK",
        data: { symbol: "BTCUSDT", price: "invalid" },
        headers: {},
      },
    );

    try {
      await provider.getPrice();
      assertEquals(true, false, "Should have thrown an error");
    } catch (error) {
      assertEquals((error as Error).message.includes("Invalid price"), true);
    }
  });
});

describe("MockPriceProvider", () => {
  it("should return configured mock data", async () => {
    const provider = new MockPriceProvider("test", 45000, "medium");

    const result = await provider.getPrice();

    assertEquals(result.price, 45000);
    assertEquals(result.confidence, "medium");
    assertEquals(result.details.mock, true);
  });

  it("should fail when configured to fail", async () => {
    const provider = new MockPriceProvider("test", 45000, "medium", true);

    try {
      await provider.getPrice();
      assertEquals(true, false, "Should have thrown an error");
    } catch (error) {
      assertEquals(
        (error as Error).message.includes("configured to fail"),
        true,
      );
    }
  });

  it("should allow configuration changes", async () => {
    const provider = new MockPriceProvider("test", 45000, "medium");

    provider.setPrice(55000);
    provider.setConfidence("low");

    const result = await provider.getPrice();

    assertEquals(result.price, 55000);
    assertEquals(result.confidence, "low");
  });
});
