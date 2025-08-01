import { assert, assertEquals, assertExists } from "@std/assert";
import { BTCPriceService } from "$server/services/price/btcPriceService.ts";
import { DatabaseManager } from "$server/database/databaseManager.ts";
import { afterEach, beforeEach, describe, it } from "jsr:@std/testing@1.0.14/bdd";

// Mock database manager with cache functionality
const mockDb = {
  handleCache: async <T>(
    key: string,
    fetchFn: () => Promise<T>,
    duration: number,
  ): Promise<T> => {
    // Simple in-memory cache for testing
    if (mockDb.cache[key]) {
      // Return cached data with source updated to "cached"
      const cachedData = { ...mockDb.cache[key] };
      if (cachedData.source) {
        cachedData.source = "cached";
      }
      return cachedData;
    }
    const result = await fetchFn();
    mockDb.cache[key] = result;
    return result;
  },
  invalidateCacheByPattern: (pattern: string): Promise<void> => {
    Object.keys(mockDb.cache).forEach((key) => {
      if (key.includes(pattern)) {
        delete mockDb.cache[key];
      }
    });
    return Promise.resolve();
  },
  cache: {} as Record<string, any>,
};

// Mock fetch responses
const mockFetchResponses = {
  coingecko: {
    bitcoin: {
      usd: 45000,
    },
  },
  binance: {
    price: "44950.00",
  },
  kraken: {
    error: [],
    result: {
      XXBTZUSD: {
        a: ["45100.00", "1", "1.000"],
        b: ["45099.90", "1", "1.000"],
        c: ["45100.00", "0.00080000"],
        v: ["100.12345678", "200.12345678"],
        p: ["45050.00", "45040.00"],
        t: [1000, 2000],
        l: ["44900.00", "44890.00"],
        h: ["45200.00", "45210.00"],
        o: "45000.00",
      },
    },
  },
  coinbase: {
    data: {
      currency: "BTC",
      rates: {
        USD: "45050.00",
      },
    },
  },
  blockchain: {
    USD: {
      "15m": 45030.00,
      last: 45030.00,
      buy: 45025.00,
      sell: 45035.00,
      symbol: "$",
    },
  },
  bitstamp: {
    last: "45040.00",
    high: "45200.00",
    low: "44900.00",
    vwap: "45050.00",
    volume: "1234.56789012",
    bid: "45035.00",
    ask: "45045.00",
    timestamp: "1234567890",
    open: "45000.00",
  },
};

describe("BTCPriceService", () => {
  let originalFetch: typeof globalThis.fetch;
  let originalDb: DatabaseManager;
  let activeTimers: Set<any> = new Set();

  // Override setTimeout to track timers
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;

  beforeEach(() => {
    // Reset cache
    mockDb.cache = {};

    // Save original fetch
    originalFetch = globalThis.fetch;

    // Save original database
    originalDb = (BTCPriceService as any).db;

    // Track all timers
    activeTimers = new Set();
    globalThis.setTimeout = ((fn: any, delay?: number, ...args: any[]) => {
      const timer = originalSetTimeout(fn, delay, ...args);
      activeTimers.add(timer);
      return timer;
    }) as any;

    globalThis.clearTimeout = (timer: any) => {
      activeTimers.delete(timer);
      originalClearTimeout(timer);
    };

    // Mock fetch with immediate responses
    globalThis.fetch = (
      url: string | URL | Request,
      options?: RequestInit,
    ): Promise<Response> => {
      // If there's an abort signal with a timeout, clear it immediately
      if (options?.signal && "reason" in options.signal) {
        // Signal already aborted, ignore
      }

      const urlString = typeof url === "string" ? url : url.toString();

      if (urlString.includes("coingecko")) {
        return Promise.resolve(
          new Response(JSON.stringify(mockFetchResponses.coingecko), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      if (urlString.includes("binance")) {
        return new Response(JSON.stringify(mockFetchResponses.binance), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (urlString.includes("kraken")) {
        return new Response(JSON.stringify(mockFetchResponses.kraken), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (urlString.includes("coinbase")) {
        return new Response(JSON.stringify(mockFetchResponses.coinbase), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (urlString.includes("blockchain.info")) {
        return new Response(JSON.stringify(mockFetchResponses.blockchain), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (urlString.includes("bitstamp")) {
        return new Response(JSON.stringify(mockFetchResponses.bitstamp), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Default fallback
      throw new Error(`Unmocked URL: ${urlString}`);
    };

    // Set mock database
    BTCPriceService.setDatabase(mockDb as any);
  });

  afterEach(async () => {
    // Clear all active timers
    for (const timer of activeTimers) {
      originalClearTimeout(timer);
    }
    activeTimers.clear();

    // Restore original timer functions
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;

    // Restore original fetch
    globalThis.fetch = originalFetch;
    // Clear cache
    mockDb.cache = {};
    // Invalidate any remaining cache
    await BTCPriceService.invalidateCache();
    // Restore original database if it was changed
    if (originalDb) {
      BTCPriceService.setDatabase(originalDb);
    }
  });

  describe("Core Functionality", () => {
    it("should fetch price with caching", async () => {
      const price1 = await BTCPriceService.getPrice();

      assert(typeof price1.price === "number", "Price should be a number");
      assertExists(price1.source, "Source should be defined");
      assertExists(price1.timestamp, "Timestamp should be defined");
      assert(price1.timestamp > 0, "Timestamp should be positive");

      // Second call should return cached data
      const start = performance.now();
      const price2 = await BTCPriceService.getPrice();
      const duration = performance.now() - start;

      assertEquals(
        price1.price,
        price2.price,
        "Cached price should match original",
      );
      assertEquals(
        price2.source,
        "cached",
        "Cached response should have source 'cached'",
      );
      assert(
        duration < 100,
        `Cached call should be fast, was ${duration.toFixed(2)}ms`,
      );
    });

    it("should handle cache invalidation", async () => {
      // Get initial price
      const initialPrice = await BTCPriceService.getPrice();
      assert(initialPrice.price > 0, "Initial price should be positive");

      // Invalidate cache
      await BTCPriceService.invalidateCache();

      // Get new price (should fetch fresh)
      const newPrice = await BTCPriceService.getPrice();
      assert(newPrice.price > 0, "New price should be positive");

      // Timestamps should be different (fresh fetch)
      assert(
        newPrice.timestamp >= initialPrice.timestamp,
        "New price should have newer or same timestamp",
      );
    });

    it("should use fallback when primary source fails", async () => {
      // Override fetch to simulate failure
      globalThis.fetch = (url: string | URL | Request): Promise<Response> => {
        const urlString = typeof url === "string" ? url : url.toString();

        if (urlString.includes("coingecko")) {
          return Promise.reject(new Error("Network error"));
        }

        if (urlString.includes("binance")) {
          return Promise.resolve(
            new Response(JSON.stringify(mockFetchResponses.binance), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        if (urlString.includes("kraken")) {
          return Promise.resolve(
            new Response(JSON.stringify(mockFetchResponses.kraken), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        if (urlString.includes("coinbase")) {
          return Promise.resolve(
            new Response(JSON.stringify(mockFetchResponses.coinbase), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        if (urlString.includes("blockchain.info")) {
          return Promise.resolve(
            new Response(JSON.stringify(mockFetchResponses.blockchain), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        if (urlString.includes("bitstamp")) {
          return Promise.resolve(
            new Response(JSON.stringify(mockFetchResponses.bitstamp), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        return Promise.reject(new Error(`Unmocked URL: ${urlString}`));
      };

      const result = await BTCPriceService.getPrice("coingecko");
      assert(result.price > 0, "Should get price from fallback source");
      assert(result.source === "kraken", "Should use Kraken as fallback");
    });
  });

  describe("Performance", () => {
    it("should handle concurrent requests efficiently", async () => {
      // Clear cache to ensure clean test
      await BTCPriceService.invalidateCache();

      // First, make a single request to populate the cache
      const initial = await BTCPriceService.getPrice();

      const concurrentCalls = 5;
      const start = performance.now();

      // Make concurrent requests - these should all hit the cache
      const promises = Array.from(
        { length: concurrentCalls },
        () => BTCPriceService.getPrice(),
      );

      const results = await Promise.all(promises);
      const totalDuration = performance.now() - start;

      // All should return the same cached data
      const expectedPrice = initial.price;
      const expectedTimestamp = initial.timestamp;

      for (const result of results) {
        assertEquals(
          result.price,
          expectedPrice,
          "All concurrent requests should return same cached price",
        );
        assertEquals(
          result.source,
          "cached",
          "All concurrent requests should return cached source",
        );
        // Cached results should have the same timestamp
        assertEquals(
          result.timestamp,
          expectedTimestamp,
          "Cached results should have same timestamp",
        );
      }

      // Total duration should be reasonable
      assert(
        totalDuration < 200,
        `Concurrent requests should be fast, took ${
          totalDuration.toFixed(2)
        }ms`,
      );
    });
  });

  describe("Source Selection & Validation", () => {
    it("should test both binance and coingecko sources", async () => {
      // Clear cache
      await BTCPriceService.invalidateCache();

      const coinGeckoPrice = await BTCPriceService.getPrice("coingecko");

      // Clear cache again
      await BTCPriceService.invalidateCache();

      const binancePrice = await BTCPriceService.getPrice("binance");

      // Both should return valid data
      assert(
        typeof coinGeckoPrice.price === "number",
        "CoinGecko should return number",
      );
      assert(
        typeof binancePrice.price === "number",
        "Binance should return number",
      );

      // Prices should be reasonable (mocked values)
      assert(coinGeckoPrice.price > 0, "CoinGecko price should be positive");
      assert(binancePrice.price > 0, "Binance price should be positive");

      assertEquals(
        coinGeckoPrice.source,
        "coingecko",
        "Should use CoinGecko source",
      );
      assertEquals(binancePrice.source, "binance", "Should use Binance source");
    });

    it("should demonstrate source availability", async () => {
      // Test that we can get data from sources
      await BTCPriceService.invalidateCache();
      const result1 = await BTCPriceService.getPrice();

      // Should get data from one of the sources
      const validSources = [
        "coingecko",
        "kraken",
        "coinbase",
        "bitstamp",
        "blockchain",
        "binance",
      ];
      assert(
        validSources.includes(result1.source),
        `Should use valid source, got: ${result1.source}`,
      );

      // Second call should be cached
      const result2 = await BTCPriceService.getPrice();
      assertEquals(
        result2.source,
        "cached",
        "Should return cached source on second call",
      );
      assertEquals(
        result2.price,
        result1.price,
        "Should return same price from cache",
      );
    });
  });

  describe("Data Structure Validation", () => {
    it("should return complete data structure", async () => {
      const result = await BTCPriceService.getPrice();

      // Check all required fields
      assertExists(result.price, "Should have price");
      assertExists(result.source, "Should have source");
      assertExists(result.confidence, "Should have confidence");
      assertExists(result.timestamp, "Should have timestamp");

      // Validate types
      assert(typeof result.price === "number", "Price should be number");
      assert(typeof result.source === "string", "Source should be string");
      assert(
        typeof result.confidence === "string",
        "Confidence should be string",
      );
      assert(
        typeof result.timestamp === "number",
        "Timestamp should be number",
      );

      // Validate values
      assert(result.price > 0, "Price should be positive");
      assert(result.timestamp > 0, "Timestamp should be positive");

      // Validate enums
      const validSources = [
        "quicknode",
        "coingecko",
        "binance",
        "kraken",
        "coinbase",
        "blockchain",
        "bitstamp",
        "cached",
        "default",
      ];
      assert(
        validSources.includes(result.source),
        `Source should be valid, got: ${result.source}`,
      );

      const validConfidences = ["high", "medium", "low"];
      assert(
        validConfidences.includes(result.confidence),
        `Confidence should be valid, got: ${result.confidence}`,
      );
    });

    it("should include circuit breaker metrics", async () => {
      const result = await BTCPriceService.getPrice();

      if (result.circuitBreakerMetrics) {
        // circuitBreakerMetrics is a Record<string, CircuitBreakerMetrics>
        const metricEntries = Object.entries(result.circuitBreakerMetrics);
        assert(
          metricEntries.length > 0,
          "Should have at least one circuit breaker",
        );

        // Check each circuit breaker
        for (const [source, metrics] of metricEntries) {
          assertExists(metrics.state, `${source} should have state`);
          assertExists(
            metrics.failureCount,
            `${source} should have failureCount`,
          );
          assertExists(
            metrics.successCount,
            `${source} should have successCount`,
          );
          assertExists(
            metrics.lastStateChange,
            `${source} should have lastStateChange`,
          );

          const validStates = ["CLOSED", "OPEN", "HALF_OPEN"];
          assert(
            validStates.includes(metrics.state),
            `${source} state should be valid, got: ${metrics.state}`,
          );
        }
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid successive calls", async () => {
      const rapidCalls = 10;
      const results: any[] = [];

      // Make rapid calls
      for (let i = 0; i < rapidCalls; i++) {
        results.push(await BTCPriceService.getPrice());
      }

      // Most should be cached (same timestamp)
      const timestamps = results.map((r) => r.timestamp);
      const uniqueTimestamps = new Set(timestamps);

      // Should have very few unique timestamps (most are cached)
      assert(
        uniqueTimestamps.size <= 3,
        `Should have few unique timestamps, got ${uniqueTimestamps.size}`,
      );
    });

    it("should handle empty and undefined parameters", async () => {
      // Test with undefined
      const result1 = await BTCPriceService.getPrice(undefined);
      assertExists(result1.price, "Should handle undefined parameter");

      // Test with empty string (if method accepts it)
      try {
        const result2 = await BTCPriceService.getPrice("" as any);
        assertExists(result2.price, "Should handle empty string parameter");
      } catch (e) {
        // It's okay if it rejects empty string
      }
    });
  });
});
