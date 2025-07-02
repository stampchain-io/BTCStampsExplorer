import { assert, assertEquals, assertExists } from "@std/assert";
import { BTCPriceService } from "../server/services/price/btcPriceService.ts";

Deno.test("BTCPriceService - Core Functionality", async (t) => {
  await t.step("should fetch price with caching", async () => {
    console.log("Testing BTCPriceService price fetching with caching...");

    const price1 = await BTCPriceService.getPrice();
    console.log(`First price fetch: $${price1.price} from ${price1.source}`);

    assert(typeof price1.price === "number", "Price should be a number");
    assertExists(price1.source, "Source should be defined");
    assertExists(price1.timestamp, "Timestamp should be defined");
    assert(price1.timestamp > 0, "Timestamp should be positive");

    // Second call should be faster (cached)
    const start = performance.now();
    const price2 = await BTCPriceService.getPrice();
    const duration = performance.now() - start;

    console.log(
      `Second price fetch: $${price2.price} from ${price2.source} (${
        duration.toFixed(2)
      }ms)`,
    );

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
      `Cached call should be very fast, was ${duration.toFixed(2)}ms`,
    );

    console.log("✅ Price caching working correctly");
  });

  await t.step("should handle cache invalidation", async () => {
    console.log("Testing cache invalidation...");

    // Get initial price
    const initialPrice = await BTCPriceService.getPrice();
    console.log(
      `Initial price: $${initialPrice.price} from ${initialPrice.source}`,
    );

    // Invalidate cache
    await BTCPriceService.invalidateCache();
    console.log("Cache invalidated");

    // Get price again (should fetch fresh)
    const freshPrice = await BTCPriceService.getPrice();
    console.log(
      `Fresh price after invalidation: $${freshPrice.price} from ${freshPrice.source}`,
    );

    assert(
      typeof freshPrice.price === "number",
      "Fresh price should be a number",
    );
    assertExists(freshPrice.source, "Fresh source should be defined");

    console.log("✅ Cache invalidation working correctly");
  });

  await t.step("should provide cache info", () => {
    console.log("Testing cache info...");

    const info = BTCPriceService.getCacheInfo();
    console.log("Cache info:", info);

    assertExists(info.cacheKey, "Cache key should be defined");
    assert(
      typeof info.cacheDuration === "number",
      "Cache duration should be a number",
    );
    assert(info.cacheDuration > 0, "Cache duration should be positive");
    assert(
      typeof info.staleWhileRevalidate === "number",
      "Stale while revalidate should be a number",
    );
    assert(
      typeof info.staleIfError === "number",
      "Stale if error should be a number",
    );

    console.log("✅ Cache info structure correct");
  });

  await t.step("should handle preferred source", async () => {
    console.log("Testing preferred source selection...");

    // Test with preferred source
    const priceWithPreferred = await BTCPriceService.getPrice("coingecko");
    console.log(
      `Price with preferred source: $${priceWithPreferred.price} from ${priceWithPreferred.source}`,
    );

    assert(
      typeof priceWithPreferred.price === "number",
      "Price should be a number",
    );
    assertExists(priceWithPreferred.source, "Source should be defined");

    console.log("✅ Preferred source handling working");
  });

  await t.step("should include metadata in response", async () => {
    console.log("Testing response metadata...");

    const priceData = await BTCPriceService.getPrice();
    console.log("Price data structure:", Object.keys(priceData));

    // Check required fields
    assert(typeof priceData.price === "number", "Price should be a number");
    assert(typeof priceData.source === "string", "Source should be a string");
    assert(
      typeof priceData.confidence === "string",
      "Confidence should be a string",
    );
    assert(
      typeof priceData.timestamp === "number",
      "Timestamp should be a number",
    );

    // Check confidence levels
    const validConfidences = ["high", "medium", "low"];
    assert(
      validConfidences.includes(priceData.confidence),
      `Confidence should be one of ${validConfidences.join(", ")}`,
    );

    // Check source types
    const validSources = [
      "quicknode",
      "coingecko",
      "binance",
      "cached",
      "default",
    ];
    assert(
      validSources.includes(priceData.source),
      `Source should be one of ${validSources.join(", ")}`,
    );

    console.log("✅ Response metadata structure correct");
  });
});

Deno.test("BTCPriceService - Error Handling", async (t) => {
  await t.step("should handle fallback gracefully", async () => {
    console.log("Testing fallback behavior...");

    // This test assumes that if external APIs fail, we get a fallback response
    const priceData = await BTCPriceService.getPrice();

    // Even in error cases, we should get a valid response structure
    assert(
      typeof priceData.price === "number",
      "Should return a number even on errors",
    );
    assertExists(priceData.source, "Should have a source even on errors");
    assertExists(
      priceData.confidence,
      "Should have confidence level even on errors",
    );

    console.log(
      `Fallback test result: $${priceData.price} from ${priceData.source} (confidence: ${priceData.confidence})`,
    );
    console.log("✅ Fallback behavior validated");
  });
});

Deno.test("BTCPriceService - Performance", async (t) => {
  await t.step("should meet performance requirements", async () => {
    console.log("Testing performance requirements...");

    // Test cache hit performance
    await BTCPriceService.getPrice(); // Prime the cache

    const cacheHitTimes: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      await BTCPriceService.getPrice();
      const duration = performance.now() - start;
      cacheHitTimes.push(duration);
    }

    const avgCacheHit = cacheHitTimes.reduce((a, b) => a + b, 0) /
      cacheHitTimes.length;
    console.log(`Average cache hit time: ${avgCacheHit.toFixed(2)}ms`);
    console.log(
      `Cache hit times: ${cacheHitTimes.map((t) => t.toFixed(2)).join(", ")}ms`,
    );

    // Cache hits should be very fast (< 50ms)
    assert(
      avgCacheHit < 50,
      `Average cache hit time should be < 50ms, was ${
        avgCacheHit.toFixed(2)
      }ms`,
    );

    console.log("✅ Performance requirements met");
  });

  await t.step("should handle concurrent requests efficiently", async () => {
    console.log("Testing concurrent request handling...");

    // Prime cache first to ensure consistent results
    await BTCPriceService.getPrice();

    const concurrentRequests = 5;
    const start = performance.now();

    const promises = Array(concurrentRequests).fill(null).map(() =>
      BTCPriceService.getPrice()
    );
    const results = await Promise.all(promises);

    const totalDuration = performance.now() - start;
    console.log(
      `${concurrentRequests} concurrent requests completed in ${
        totalDuration.toFixed(2)
      }ms`,
    );

    // All results should be identical (same cached value)
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
      assertEquals(
        result.timestamp,
        firstTimestamp,
        "All concurrent requests should return same cached timestamp",
      );
    }

    // Cached requests should be very fast
    assert(
      totalDuration < 100,
      `Concurrent cached requests should be fast, took ${
        totalDuration.toFixed(2)
      }ms`,
    );

    console.log("✅ Concurrent request handling efficient");
  });
});

Deno.test("BTCPriceService - Source Selection & Validation", async (t) => {
  await t.step(
    "should handle invalid preferred source gracefully",
    async () => {
      console.log("Testing invalid preferred source handling...");

      // Test with invalid source - should fallback to default sources
      const priceData = await BTCPriceService.getPrice("invalid_source");

      assert(typeof priceData.price === "number", "Should return valid price");
      assertExists(priceData.source, "Should have a valid source");

      // Should use one of the valid sources, not the invalid one
      const validSources = ["coingecko", "binance", "cached", "default"];
      assert(
        validSources.includes(priceData.source),
        `Should use valid source, got: ${priceData.source}`,
      );

      console.log(
        `✅ Invalid source handled gracefully, used: ${priceData.source}`,
      );
    },
  );

  await t.step("should test both binance and coingecko sources", async () => {
    console.log("Testing specific source preferences...");

    // Clear cache to ensure fresh fetches
    await BTCPriceService.invalidateCache();

    // Test CoinGecko specifically
    const coinGeckoPrice = await BTCPriceService.getPrice("coingecko");
    console.log(
      `CoinGecko result: $${coinGeckoPrice.price} from ${coinGeckoPrice.source}`,
    );

    // Clear cache again
    await BTCPriceService.invalidateCache();

    // Test Binance specifically
    const binancePrice = await BTCPriceService.getPrice("binance");
    console.log(
      `Binance result: $${binancePrice.price} from ${binancePrice.source}`,
    );

    // Both should return valid prices
    assert(
      typeof coinGeckoPrice.price === "number",
      "CoinGecko should return number",
    );
    assert(
      typeof binancePrice.price === "number",
      "Binance should return number",
    );

    // Prices should be reasonable (between $1,000 and $1,000,000)
    assert(coinGeckoPrice.price > 1000, "CoinGecko price should be reasonable");
    assert(
      coinGeckoPrice.price < 1000000,
      "CoinGecko price should be reasonable",
    );
    assert(binancePrice.price > 1000, "Binance price should be reasonable");
    assert(binancePrice.price < 1000000, "Binance price should be reasonable");

    console.log("✅ Both sources working correctly");
  });

  await t.step("should demonstrate source availability", async () => {
    console.log("Testing source availability...");

    // Test that we can get data from external sources
    await BTCPriceService.invalidateCache();
    const result1 = await BTCPriceService.getPrice();
    console.log(`First call: Source = ${result1.source}`);

    // Wait longer to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await BTCPriceService.invalidateCache();
    const result2 = await BTCPriceService.getPrice();
    console.log(`Second call: Source = ${result2.source}`);

    // Both should be external sources (not cached or default)
    const validExternalSources = ["coingecko", "binance"];
    assert(
      validExternalSources.includes(result1.source),
      `First call should use external source, got: ${result1.source}`,
    );
    assert(
      validExternalSources.includes(result2.source),
      `Second call should use external source, got: ${result2.source}`,
    );

    console.log("✅ External sources working correctly");
  });
});

Deno.test("BTCPriceService - Data Structure Validation", async (t) => {
  await t.step("should return complete data structure", async () => {
    console.log("Testing complete data structure...");

    const priceData = await BTCPriceService.getPrice();
    console.log("Full price data:", priceData);

    // Required fields
    assertExists(priceData.price, "Price should exist");
    assertExists(priceData.source, "Source should exist");
    assertExists(priceData.confidence, "Confidence should exist");
    assertExists(priceData.timestamp, "Timestamp should exist");

    // Type validation
    assert(typeof priceData.price === "number", "Price should be number");
    assert(typeof priceData.source === "string", "Source should be string");
    assert(
      typeof priceData.confidence === "string",
      "Confidence should be string",
    );
    assert(
      typeof priceData.timestamp === "number",
      "Timestamp should be number",
    );

    // Value validation
    assert(priceData.price > 0, "Price should be positive");
    assert(priceData.timestamp > 0, "Timestamp should be positive");

    // Timestamp should be recent (within last hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    assert(priceData.timestamp > oneHourAgo, "Timestamp should be recent");

    // Optional fields type checking
    if (priceData.details) {
      assert(typeof priceData.details === "object", "Details should be object");
    }

    if (priceData.fallbackUsed !== undefined) {
      assert(
        typeof priceData.fallbackUsed === "boolean",
        "FallbackUsed should be boolean",
      );
    }

    if (priceData.errors) {
      assert(Array.isArray(priceData.errors), "Errors should be array");
    }

    console.log("✅ Data structure validation passed");
  });

  await t.step("should handle confidence levels correctly", async () => {
    console.log("Testing confidence level logic...");

    const priceData = await BTCPriceService.getPrice();

    // Confidence should be one of the expected values
    const validConfidences = ["high", "medium", "low"];
    assert(
      validConfidences.includes(priceData.confidence),
      `Confidence should be valid, got: ${priceData.confidence}`,
    );

    // External sources should typically have high confidence
    if (priceData.source === "coingecko" || priceData.source === "binance") {
      assertEquals(
        priceData.confidence,
        "high",
        "External sources should have high confidence",
      );
    }

    // Default fallback should have low confidence
    if (priceData.source === "default") {
      assertEquals(
        priceData.confidence,
        "low",
        "Default source should have low confidence",
      );
    }

    console.log(
      `✅ Confidence level '${priceData.confidence}' is appropriate for source '${priceData.source}'`,
    );
  });
});

Deno.test("BTCPriceService - Cache Behavior", async (t) => {
  await t.step("should respect cache duration", async () => {
    console.log("Testing cache duration behavior...");

    // Get cache info
    const cacheInfo = BTCPriceService.getCacheInfo();
    console.log("Cache configuration:", cacheInfo);

    // Clear cache and get fresh data
    await BTCPriceService.invalidateCache();
    const firstFetch = await BTCPriceService.getPrice();
    const firstTimestamp = firstFetch.timestamp;

    // Immediate second call should be cached (same timestamp)
    const secondFetch = await BTCPriceService.getPrice();
    assertEquals(
      secondFetch.timestamp,
      firstTimestamp,
      "Second call should return cached data with same timestamp",
    );

    // Verify cache info structure
    assert(
      typeof cacheInfo.cacheKey === "string",
      "Cache key should be string",
    );
    assert(
      typeof cacheInfo.cacheDuration === "number",
      "Cache duration should be number",
    );
    assert(cacheInfo.cacheDuration > 0, "Cache duration should be positive");

    console.log(
      `✅ Cache duration: ${cacheInfo.cacheDuration}s, key: ${cacheInfo.cacheKey}`,
    );
  });

  await t.step("should handle cache invalidation properly", async () => {
    console.log("Testing cache invalidation behavior...");

    // Get initial data
    const initialData = await BTCPriceService.getPrice();
    const initialTimestamp = initialData.timestamp;

    // Invalidate cache
    await BTCPriceService.invalidateCache();
    console.log("Cache invalidated");

    // Small delay to allow any pending requests to complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Next call should fetch fresh data (different timestamp)
    const freshData = await BTCPriceService.getPrice();

    // Should have different timestamp (fresh fetch)
    assert(
      freshData.timestamp !== initialTimestamp,
      "Fresh fetch should have different timestamp",
    );

    // Should still be valid data
    assert(
      typeof freshData.price === "number",
      "Fresh data should have valid price",
    );
    assertExists(freshData.source, "Fresh data should have source");

    console.log("✅ Cache invalidation working correctly");
  });
});

Deno.test("BTCPriceService - Edge Cases", async (t) => {
  await t.step("should handle rapid successive calls", async () => {
    console.log("Testing rapid successive calls...");

    // Make multiple rapid calls
    const rapidCalls = 10;
    const promises = Array(rapidCalls).fill(null).map(() =>
      BTCPriceService.getPrice()
    );

    const results = await Promise.all(promises);

    // All should succeed
    assert(results.length === rapidCalls, "All calls should complete");

    // All should return valid data
    for (const result of results) {
      assert(
        typeof result.price === "number",
        "Each result should have valid price",
      );
      assertExists(result.source, "Each result should have source");
    }

    // Most should be cached (same timestamp)
    const timestamps = results.map((r) => r.timestamp);
    const uniqueTimestamps = new Set(timestamps);

    // Should have very few unique timestamps (most are cached)
    assert(
      uniqueTimestamps.size <= 3,
      `Should have few unique timestamps, got ${uniqueTimestamps.size}`,
    );

    console.log(
      `✅ ${rapidCalls} rapid calls completed, ${uniqueTimestamps.size} unique timestamps`,
    );
  });

  await t.step("should handle empty and undefined parameters", async () => {
    console.log("Testing parameter edge cases...");

    // Test with undefined (should work normally)
    const undefinedResult = await BTCPriceService.getPrice(undefined);
    assert(
      typeof undefinedResult.price === "number",
      "Undefined param should work",
    );

    // Test with empty string (should work normally)
    const emptyResult = await BTCPriceService.getPrice("");
    assert(
      typeof emptyResult.price === "number",
      "Empty string param should work",
    );

    // Test with null (should work normally)
    const nullResult = await BTCPriceService.getPrice(null as any);
    assert(typeof nullResult.price === "number", "Null param should work");

    console.log("✅ Parameter edge cases handled correctly");
  });
});
