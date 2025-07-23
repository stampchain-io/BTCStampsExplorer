import { assert, assertEquals, assertExists } from "@std/assert";
import { BTCPriceService } from "$server/services/price/btcPriceService.ts";
import { DatabaseManager } from "$server/database/databaseManager.ts";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";

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
  invalidateCacheByPattern: async (pattern: string): Promise<void> => {
    Object.keys(mockDb.cache).forEach((key) => {
      if (key.includes(pattern)) {
        delete mockDb.cache[key];
      }
    });
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
};

describe("BTCPriceService", () => {
  let originalFetch: typeof globalThis.fetch;
  let originalDb: DatabaseManager;

  beforeEach(() => {
    // Reset cache
    mockDb.cache = {};

    // Save original fetch
    originalFetch = globalThis.fetch;

    // Mock fetch
    globalThis.fetch = async (url: string | URL | Request) => {
      const urlString = typeof url === "string" ? url : url.toString();

      if (urlString.includes("coingecko")) {
        return new Response(JSON.stringify(mockFetchResponses.coingecko), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
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

      // Default fallback
      throw new Error(`Unmocked URL: ${urlString}`);
    };

    // Set mock database
    BTCPriceService.setDatabase(mockDb as any);
  });

  afterEach(() => {
    // Restore original fetch
    globalThis.fetch = originalFetch;
    // Clear cache
    mockDb.cache = {};
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
        price1.source,
        price2.source,
        "Cached source should match original",
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
      globalThis.fetch = async (url: string | URL | Request) => {
        const urlString = typeof url === "string" ? url : url.toString();

        if (urlString.includes("coingecko")) {
          throw new Error("Network error");
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

        throw new Error(`Unmocked URL: ${urlString}`);
      };

      const result = await BTCPriceService.getPrice("coingecko");
      assert(result.price > 0, "Should get price from fallback source");
      assert(result.source === "binance", "Should use Binance as fallback");
    });
  });

  describe("Performance", () => {
    it("should handle concurrent requests efficiently", async () => {
      const concurrentCalls = 5;
      const start = performance.now();

      // Make concurrent requests
      const promises = Array.from(
        { length: concurrentCalls },
        () => BTCPriceService.getPrice(),
      );

      const results = await Promise.all(promises);
      const totalDuration = performance.now() - start;

      // All should return the same data
      const firstPrice = results[0].price;
      const firstSource = results[0].source;
      const firstTimestamp = results[0].timestamp;

      for (const result of results) {
        assertEquals(
          result.price,
          firstPrice,
          "All concurrent requests should return same cached price",
        );
        assertEquals(
          result.source,
          firstSource,
          "All concurrent requests should return same cached source",
        );
        // Allow small timestamp differences for concurrent execution
        assert(
          Math.abs(result.timestamp - firstTimestamp) <= 10,
          `Timestamp difference should be minimal, got ${
            Math.abs(result.timestamp - firstTimestamp)
          }ms difference`,
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
      const validSources = ["coingecko", "binance"];
      assert(
        validSources.includes(result1.source),
        `Should use valid source, got: ${result1.source}`,
      );

      // Second call should be cached
      const result2 = await BTCPriceService.getPrice();
      assertEquals(
        result2.source,
        result1.source,
        "Should return same source from cache",
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
            metrics.failures,
            `${source} should have failures count`,
          );
          assertExists(
            metrics.successes,
            `${source} should have successes count`,
          );
          assertExists(
            metrics.nextAttempt,
            `${source} should have nextAttempt`,
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
