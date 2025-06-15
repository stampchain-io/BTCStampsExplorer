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

    // Invalidate cache to test concurrent fresh fetches
    await BTCPriceService.invalidateCache();

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

    for (const result of results) {
      assertEquals(
        result.price,
        firstPrice,
        "All concurrent requests should return same price",
      );
      assertEquals(
        result.source,
        firstSource,
        "All concurrent requests should return same source",
      );
    }

    // Total time should be reasonable (not much more than a single request)
    assert(
      totalDuration < 5000,
      `Concurrent requests should complete in reasonable time, took ${
        totalDuration.toFixed(2)
      }ms`,
    );

    console.log("✅ Concurrent request handling efficient");
  });
});
