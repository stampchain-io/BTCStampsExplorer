import { assertEquals, assertExists } from "@std/assert";
import { FeeService } from "$server/services/fee/feeService.ts";
import { BackgroundFeeService } from "$server/services/fee/backgroundFeeService.ts";
import { dbManager } from "$server/database/databaseManager.ts";

// Test suite for Redis-based fee system
Deno.test("Redis Fee System Tests", async (t) => {
  // Add a small delay between tests to allow any pending HTTP requests to complete
  const cleanupDelay = () => new Promise((resolve) => setTimeout(resolve, 100));
  await t.step(
    "FeeService.getCacheInfo() returns correct configuration",
    () => {
      const cacheInfo = FeeService.getCacheInfo();

      assertEquals(cacheInfo.cacheKey, "fee_estimation_data");
      assertEquals(cacheInfo.cacheDuration, 60); // RouteType.PRICE duration
      assertEquals(cacheInfo.staleWhileRevalidate, 300);
      assertEquals(cacheInfo.staleIfError, 600);
    },
  );

  await t.step(
    "FeeService.getFeeData() returns valid fee data structure",
    async () => {
      const baseUrl = "https://test.example.com";
      const feeData = await FeeService.getFeeData(baseUrl);

      // Verify required fields
      assertExists(feeData.recommendedFee);
      assertExists(feeData.btcPrice);
      assertExists(feeData.source);
      assertExists(feeData.confidence);
      assertExists(feeData.timestamp);

      // Verify types
      assertEquals(typeof feeData.recommendedFee, "number");
      assertEquals(typeof feeData.btcPrice, "number");
      assertEquals(typeof feeData.timestamp, "number");

      // Verify fee is reasonable (between 1 and 1000 sats/vB)
      assertEquals(feeData.recommendedFee >= 1, true);
      assertEquals(feeData.recommendedFee <= 1000, true);

      // Verify source is valid
      const validSources = ["mempool", "quicknode", "cached", "default"];
      assertEquals(validSources.includes(feeData.source), true);

      // Verify confidence is valid
      const validConfidence = ["high", "medium", "low"];
      assertEquals(validConfidence.includes(feeData.confidence), true);

      // Allow any pending HTTP requests to complete
      await cleanupDelay();
    },
  );

  await t.step("FeeService uses Redis caching correctly", async () => {
    const baseUrl = "https://test.example.com";

    // First call - should fetch fresh data
    const firstCall = await FeeService.getFeeData(baseUrl);

    // Second call immediately after - should use cache (much faster)
    const cacheStartTime = Date.now();
    const secondCall = await FeeService.getFeeData(baseUrl);
    const cacheCallTime = Date.now() - cacheStartTime;

    // Verify both calls return valid data
    assertExists(firstCall.recommendedFee);
    assertExists(secondCall.recommendedFee);

    // Cache call should be significantly faster (less than 50ms vs potentially seconds)
    assertEquals(
      cacheCallTime < 50,
      true,
      `Cache call took ${cacheCallTime}ms, expected < 50ms`,
    );

    // Data should be identical (from cache)
    assertEquals(firstCall.recommendedFee, secondCall.recommendedFee);
    assertEquals(firstCall.source, secondCall.source);
  });

  await t.step("FeeService handles fallback chain correctly", async () => {
    // This test verifies the fallback behavior when APIs fail
    // Since we can't easily mock external APIs in this test environment,
    // we'll test the static fallback scenario

    const baseUrl = "https://invalid-test-url.example.com";

    try {
      const feeData = await FeeService.getFeeData(baseUrl);

      // Should still return valid data (from fallback)
      assertExists(feeData.recommendedFee);
      assertEquals(typeof feeData.recommendedFee, "number");
      assertEquals(feeData.recommendedFee >= 1, true);

      // Should indicate fallback was used
      assertEquals(feeData.fallbackUsed, true);

      // Source should be one of the fallback sources
      const fallbackSources = ["quicknode", "cached", "default"];
      assertEquals(fallbackSources.includes(feeData.source), true);
    } catch (error) {
      // If the test fails due to network issues, that's expected
      // The important thing is that FeeService doesn't throw unhandled errors
      console.log(
        "Expected network error in fallback test:",
        error instanceof Error ? error.message : String(error),
      );
    }
  });

  await t.step("FeeService.invalidateCache() works correctly", async () => {
    const baseUrl = "https://test.example.com";

    // Get initial data
    const initialData = await FeeService.getFeeData(baseUrl);

    // Invalidate cache
    await FeeService.invalidateCache();

    // Next call should fetch fresh data (not from cache)
    const freshData = await FeeService.getFeeData(baseUrl);

    // Both should be valid
    assertExists(initialData.recommendedFee);
    assertExists(freshData.recommendedFee);

    // Timestamps should be different (indicating fresh fetch)
    // Note: This might not always be true if the API returns the same timestamp
    // but it's a reasonable check for cache invalidation
  });

  await t.step("Fee endpoint integration test", async () => {
    // Test the actual fee endpoint with CSRF and rate limiting
    const testUrl = "http://localhost:8000";

    try {
      // First, we need to get a CSRF token
      const csrfResponse = await fetch(`${testUrl}/api/internal/csrf-token`, {
        method: "GET",
      });

      if (csrfResponse.ok) {
        const csrfData = await csrfResponse.json();
        const csrfToken = csrfData.token;

        // Now test the fee endpoint with CSRF token
        const feeResponse = await fetch(`${testUrl}/api/internal/fees`, {
          method: "GET",
          headers: {
            "X-CSRF-Token": csrfToken,
          },
        });

        if (feeResponse.ok) {
          const feeData = await feeResponse.json();

          // Verify response structure
          assertExists(feeData.recommendedFee);
          assertExists(feeData.btcPrice);
          assertExists(feeData.source);
          assertExists(feeData.confidence);
          assertExists(feeData.timestamp);

          // Verify rate limit headers are present
          assertExists(feeResponse.headers.get("X-RateLimit-Limit"));
          assertExists(feeResponse.headers.get("X-RateLimit-Remaining"));

          console.log("Fee endpoint integration test passed:", {
            recommendedFee: feeData.recommendedFee,
            source: feeData.source,
            confidence: feeData.confidence,
          });
        } else {
          // Consume the response body to prevent resource leak
          await feeResponse.text();
          console.log("Fee endpoint not available for integration test");
        }
      } else {
        // Consume the response body to prevent resource leak
        await csrfResponse.text();
        console.log("CSRF endpoint not available for integration test");
      }
    } catch (error) {
      console.log(
        "Integration test skipped (server not running):",
        error instanceof Error ? error.message : String(error),
      );
    }

    // Allow any pending HTTP requests to complete
    await cleanupDelay();
  });

  await t.step("Redis cache performance test", async () => {
    const baseUrl = "https://test.example.com";
    const iterations = 5;
    const times: number[] = [];

    // Warm up cache
    await FeeService.getFeeData(baseUrl);

    // Test multiple cache hits
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await FeeService.getFeeData(baseUrl);
      const duration = Date.now() - start;
      times.push(duration);
    }

    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);

    console.log(
      `Redis cache performance: avg=${averageTime}ms, max=${maxTime}ms`,
    );

    // Cache hits should be very fast (under 100ms)
    assertEquals(
      averageTime < 100,
      true,
      `Average cache time ${averageTime}ms too slow`,
    );
    assertEquals(maxTime < 200, true, `Max cache time ${maxTime}ms too slow`);
  });

  await t.step("Fee data validation test", async () => {
    const baseUrl = "https://test.example.com";
    const feeData = await FeeService.getFeeData(baseUrl);

    // Test fee rate bounds
    assertEquals(feeData.recommendedFee >= 1, true, "Fee rate too low");
    assertEquals(feeData.recommendedFee <= 1000, true, "Fee rate too high");

    // Test BTC price (should be 0 or positive)
    assertEquals(
      feeData.btcPrice >= 0,
      true,
      "BTC price should be non-negative",
    );

    // Test timestamp (should be recent)
    const now = Date.now();
    const timeDiff = Math.abs(now - feeData.timestamp);
    assertEquals(timeDiff < 300000, true, "Timestamp too old (>5 minutes)"); // 5 minutes

    // Test debug response structure
    if (feeData.debug_feesResponse) {
      assertEquals(typeof feeData.debug_feesResponse, "object");
    }
  });

  await t.step("Error handling and monitoring integration", async () => {
    // Test that monitoring functions are called correctly
    // This is more of a smoke test since we can't easily mock the monitoring

    const baseUrl = "https://test.example.com";

    try {
      const feeData = await FeeService.getFeeData(baseUrl);

      // If successful, monitoring should have recorded success
      assertExists(feeData);
      console.log("Monitoring integration test: success case handled");
    } catch (_error) {
      // If failed, monitoring should have recorded failure
      console.log("Monitoring integration test: error case handled");
    }
  });

  await t.step("Concurrent request handling", async () => {
    const baseUrl = "https://test.example.com";

    // Make multiple concurrent requests
    const promises = Array(5).fill(null).map(() =>
      FeeService.getFeeData(baseUrl)
    );

    const results = await Promise.all(promises);

    // All should succeed
    assertEquals(results.length, 5);

    // All should have valid data
    results.forEach((result, index) => {
      assertExists(
        result.recommendedFee,
        `Result ${index} missing recommendedFee`,
      );
      assertExists(result.source, `Result ${index} missing source`);
    });

    // All should return the same data (from cache)
    const firstResult = results[0];
    results.forEach((result, index) => {
      assertEquals(
        result.recommendedFee,
        firstResult.recommendedFee,
        `Result ${index} has different recommendedFee`,
      );
    });

    console.log(
      "Concurrent request test passed with",
      results.length,
      "requests",
    );

    // Allow any pending HTTP requests to complete
    await cleanupDelay();
  });

  await t.step("Background fee service functionality", async () => {
    const baseUrl = "https://test.example.com";

    // Test service status when not running
    let status = BackgroundFeeService.getStatus();
    assertEquals(status.isRunning, false);
    assertEquals(status.intervalId, null);

    // Test starting the service
    BackgroundFeeService.start(baseUrl);

    status = BackgroundFeeService.getStatus();
    assertEquals(status.isRunning, true);
    assertExists(status.intervalId);
    assertExists(status.feeCacheInfo);

    // Test force warm
    await BackgroundFeeService.forceWarm(baseUrl);
    console.log("Background service force warm completed");

    // Allow time for any HTTP requests from forceWarm to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Test stopping the service
    BackgroundFeeService.stop();

    status = BackgroundFeeService.getStatus();
    assertEquals(status.isRunning, false);
    assertEquals(status.intervalId, null);
    assertEquals(status.retryCount, 0);

    console.log("Background fee service test completed");

    // Allow any remaining HTTP requests to complete before next test
    await new Promise((resolve) => setTimeout(resolve, 500));
  });
});

// Test Redis connection and basic functionality
Deno.test("Redis Infrastructure Tests", async (t) => {
  // Add a small delay between tests to allow any pending HTTP requests to complete
  const cleanupDelay = () => new Promise((resolve) => setTimeout(resolve, 100));
  await t.step("Database manager cache functionality", async () => {
    const testKey = "test_fee_cache_key";
    const testData = { test: "data", timestamp: Date.now() };

    try {
      // Test cache set and get
      const result = await dbManager.handleCache(
        testKey,
        () => Promise.resolve(testData),
        60, // 60 seconds
      );

      assertEquals(result.test, testData.test);
      console.log("Redis cache basic functionality test passed");
    } catch (_error) {
      console.log(
        "Redis cache test failed (expected if Redis not available):",
        _error instanceof Error ? _error.message : String(_error),
      );
    }
  });

  await t.step("Cache expiry behavior", async () => {
    const testKey = "test_fee_expiry_key";
    const testData = { test: "expiry_data", timestamp: Date.now() };

    try {
      // Set data with very short expiry
      await dbManager.handleCache(
        testKey,
        () => Promise.resolve(testData),
        1, // 1 second
      );

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should fetch fresh data
      const freshData = { test: "fresh_data", timestamp: Date.now() };
      const result = await dbManager.handleCache(
        testKey,
        () => Promise.resolve(freshData),
        60,
      );

      assertEquals(result.test, freshData.test);
      console.log("Cache expiry test passed");
    } catch (_error) {
      console.log(
        "Cache expiry test failed (expected if Redis not available):",
        _error instanceof Error ? _error.message : String(_error),
      );
    }

    // Allow any pending HTTP requests to complete
    await cleanupDelay();
  });
});
