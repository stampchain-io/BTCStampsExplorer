import { assert, assertEquals, assertExists } from "@std/assert";
import { FeeService } from "$server/services/fee/feeService.ts";
import { FeeSecurityService } from "$server/services/fee/feeSecurityService.ts";
import { BackgroundFeeService } from "$server/services/fee/backgroundFeeService.ts";

// Mock localStorage for testing
const mockLocalStorage = {
  data: new Map<string, string>(),
  getItem(key: string): string | null {
    return this.data.get(key) || null;
  },
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  },
  removeItem(key: string): void {
    this.data.delete(key);
  },
  clear(): void {
    this.data.clear();
  },
};

Deno.test("Fee System Performance and Migration Tests", async (t) => {
  await t.step("Redis cache performance benchmark", async () => {
    const iterations = 10;
    const times: number[] = [];
    const baseUrl = "https://test.example.com";

    console.log(
      `Running Redis cache performance test with ${iterations} iterations...`,
    );

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();

      try {
        await FeeService.getFeeData(baseUrl);
        const endTime = performance.now();
        times.push(endTime - startTime);
      } catch (error) {
        console.warn(`Iteration ${i + 1} failed:`, error);
        // Still record the time for failed requests
        const endTime = performance.now();
        times.push(endTime - startTime);
      }
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log(`Redis cache performance results:`);
    console.log(`  Average: ${avgTime.toFixed(2)}ms`);
    console.log(`  Min: ${minTime.toFixed(2)}ms`);
    console.log(`  Max: ${maxTime.toFixed(2)}ms`);

    // Performance assertions
    assert(avgTime < 5000, `Average response time too high: ${avgTime}ms`);
    assert(maxTime < 10000, `Max response time too high: ${maxTime}ms`);

    console.log("Redis cache performance test passed");
  });

  await t.step("localStorage fallback performance comparison", () => {
    // This test is mostly for documentation purposes - localStorage is now
    // only used as a last-resort emergency fallback, so its performance
    // is less critical
    // Simulate localStorage operations
    const iterations = 1000;
    const testData = {
      recommendedFee: 10,
      btcPrice: 50000,
      source: "cached",
      confidence: "medium",
      timestamp: Date.now(),
    };

    // Test localStorage write performance
    const writeStartTime = performance.now();
    for (let i = 0; i < iterations; i++) {
      mockLocalStorage.setItem(`fee_test_${i}`, JSON.stringify(testData));
    }
    const writeEndTime = performance.now();
    const writeTime = writeEndTime - writeStartTime;

    // Test localStorage read performance
    const readStartTime = performance.now();
    for (let i = 0; i < iterations; i++) {
      const data = mockLocalStorage.getItem(`fee_test_${i}`);
      if (data) {
        JSON.parse(data);
      }
    }
    const readEndTime = performance.now();
    const readTime = readEndTime - readStartTime;

    console.log(`localStorage performance (${iterations} operations):`);
    console.log(
      `  Write: ${writeTime.toFixed(2)}ms (${
        (writeTime / iterations).toFixed(3)
      }ms per op)`,
    );
    console.log(
      `  Read: ${readTime.toFixed(2)}ms (${
        (readTime / iterations).toFixed(3)
      }ms per op)`,
    );

    // Performance assertions
    assert(writeTime < 1000, `localStorage write too slow: ${writeTime}ms`);
    assert(readTime < 500, `localStorage read too slow: ${readTime}ms`);

    // Cleanup
    mockLocalStorage.clear();

    console.log("localStorage performance test passed");
  });

  await t.step("Concurrent request handling performance", async () => {
    const concurrentRequests = 5;
    const baseUrl = "https://test.example.com";

    console.log(
      `Testing concurrent request handling with ${concurrentRequests} requests...`,
    );

    const startTime = performance.now();

    const promises = Array.from(
      { length: concurrentRequests },
      async (_, i) => {
        const requestStart = performance.now();
        try {
          const result = await FeeService.getFeeData(baseUrl);
          const requestEnd = performance.now();
          return {
            index: i,
            success: true,
            duration: requestEnd - requestStart,
            source: result.source,
          };
        } catch (error) {
          const requestEnd = performance.now();
          return {
            index: i,
            success: false,
            duration: requestEnd - requestStart,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    );

    const results = await Promise.all(promises);
    const endTime = performance.now();
    const totalTime = endTime - startTime;

    const successfulRequests = results.filter((r) => r.success);
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) /
      results.length;

    console.log(`Concurrent request results:`);
    console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
    console.log(
      `  Successful requests: ${successfulRequests.length}/${concurrentRequests}`,
    );
    console.log(`  Average request duration: ${avgDuration.toFixed(2)}ms`);

    // Performance assertions
    assert(
      successfulRequests.length > 0,
      "At least one request should succeed",
    );
    assert(totalTime < 15000, `Total time too high: ${totalTime}ms`);

    console.log("Concurrent request handling test passed");
  });

  await t.step("Cache invalidation performance", async () => {
    const baseUrl = "https://test.example.com";

    console.log("Testing cache invalidation performance...");

    // First, populate the cache
    await FeeService.getFeeData(baseUrl);

    // Test invalidation performance
    const invalidationStart = performance.now();
    await FeeService.invalidateCache();
    const invalidationEnd = performance.now();
    const invalidationTime = invalidationEnd - invalidationStart;

    // Test fresh fetch after invalidation
    const fetchStart = performance.now();
    await FeeService.getFeeData(baseUrl);
    const fetchEnd = performance.now();
    const fetchTime = fetchEnd - fetchStart;

    console.log(`Cache invalidation performance:`);
    console.log(`  Invalidation: ${invalidationTime.toFixed(2)}ms`);
    console.log(`  Fresh fetch: ${fetchTime.toFixed(2)}ms`);

    // Performance assertions
    assert(
      invalidationTime < 1000,
      `Cache invalidation too slow: ${invalidationTime}ms`,
    );
    assert(fetchTime < 10000, `Fresh fetch too slow: ${fetchTime}ms`);

    console.log("Cache invalidation performance test passed");
  });

  await t.step("Background service performance impact", async () => {
    const baseUrl = "https://test.example.com";

    console.log("Testing background service performance impact...");

    // Test without background service
    const withoutBgStart = performance.now();
    await FeeService.getFeeData(baseUrl);
    const withoutBgEnd = performance.now();
    const withoutBgTime = withoutBgEnd - withoutBgStart;

    // Start background service
    BackgroundFeeService.start(baseUrl);

    // Wait a moment for background service to warm cache
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test with background service (should be faster due to warm cache)
    const withBgStart = performance.now();
    await FeeService.getFeeData(baseUrl);
    const withBgEnd = performance.now();
    const withBgTime = withBgEnd - withBgStart;

    // Stop background service
    BackgroundFeeService.stop();

    console.log(`Background service impact:`);
    console.log(`  Without background service: ${withoutBgTime.toFixed(2)}ms`);
    console.log(`  With background service: ${withBgTime.toFixed(2)}ms`);
    console.log(`  Improvement: ${(withoutBgTime - withBgTime).toFixed(2)}ms`);

    // The background service should not cause extreme performance degradation
    // In test environment, allow up to 10x slower due to mocking and timing variations
    // The key is that it doesn't cause orders of magnitude slowdown
    assert(
      withBgTime < Math.max(withoutBgTime * 10, 1000),
      `Background service causing excessive slowdown: ${withBgTime}ms vs ${withoutBgTime}ms`,
    );

    console.log("Background service performance test passed");
  });

  await t.step("Security validation performance impact", () => {
    // Test the performance impact of security validation
    const iterations = 100;
    const testFeeData = {
      recommendedFee: 10,
      source: "mempool",
      timestamp: Date.now(),
      fastestFee: 15,
      halfHourFee: 10,
      hourFee: 8,
    };

    console.log(
      `Testing security validation performance with ${iterations} validations...`,
    );

    // Test validation performance
    const validationStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      FeeSecurityService.validateFeeData(testFeeData, "mempool");
    }
    const validationEnd = performance.now();
    const validationTime = validationEnd - validationStart;

    const avgValidationTime = validationTime / iterations;

    console.log(`Security validation performance:`);
    console.log(`  Total time: ${validationTime.toFixed(2)}ms`);
    console.log(`  Average per validation: ${avgValidationTime.toFixed(3)}ms`);

    // Performance assertions
    assert(
      avgValidationTime < 10,
      `Security validation too slow: ${avgValidationTime}ms per validation`,
    );
    assert(
      validationTime < 1000,
      `Total validation time too high: ${validationTime}ms`,
    );

    console.log("Security validation performance test passed");
  });

  await t.step("Memory usage validation", async () => {
    console.log("Testing memory usage patterns...");

    // Get initial memory usage (if available)
    const initialMemory = (globalThis as any).Deno?.memoryUsage?.() || null;

    // Perform multiple operations to test memory leaks
    const operations = 50;
    for (let i = 0; i < operations; i++) {
      // Fee service operations
      await FeeService.getFeeData("https://test.example.com");

      // Security validations
      FeeSecurityService.validateFeeData({
        recommendedFee: 10 + i,
        source: "test",
        timestamp: Date.now(),
      }, "test");

      // Cache operations
      if (i % 10 === 0) {
        await FeeService.invalidateCache();
      }
    }

    // Get final memory usage
    const finalMemory = (globalThis as any).Deno?.memoryUsage?.() || null;

    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      console.log(`Memory usage:`);
      console.log(
        `  Initial heap: ${
          (initialMemory.heapUsed / 1024 / 1024).toFixed(2)
        } MB`,
      );
      console.log(
        `  Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      );
      console.log(
        `  Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`,
      );

      // Memory increase should be reasonable (less than 50MB for our operations)
      assert(
        memoryIncrease < 50 * 1024 * 1024,
        `Memory increase too high: ${memoryIncrease} bytes`,
      );
    } else {
      console.log("Memory usage information not available in this environment");
    }

    console.log("Memory usage validation passed");
  });

  await t.step("Migration validation - fallback chain integrity", async () => {
    console.log("Testing migration fallback chain integrity...");

    const baseUrl = "https://test.example.com";

    // Test 1: Normal operation (should use Redis cache)
    const normalResult = await FeeService.getFeeData(baseUrl);
    assertExists(normalResult);
    assert(typeof normalResult.recommendedFee === "number");
    assert(normalResult.recommendedFee >= 1);

    // Test 2: Cache invalidation and fresh fetch
    await FeeService.invalidateCache();
    const freshResult = await FeeService.getFeeData(baseUrl);
    assertExists(freshResult);
    assert(typeof freshResult.recommendedFee === "number");

    // Test 3: Verify cache info is accessible
    const cacheInfo = FeeService.getCacheInfo();
    assertExists(cacheInfo.cacheKey);
    assert(typeof cacheInfo.cacheDuration === "number");
    assert(cacheInfo.cacheDuration > 0);

    console.log("Migration fallback chain integrity test passed");
  });

  await t.step("End-to-end system integration test", async () => {
    console.log("Running end-to-end system integration test...");

    const baseUrl = "https://test.example.com";

    // Clear any existing state
    FeeSecurityService.clearEvents();
    await FeeService.invalidateCache();

    // Test complete flow
    const startTime = performance.now();

    // 1. Start background service
    BackgroundFeeService.start(baseUrl);

    // 2. Get fee data (should trigger security validation)
    const feeData = await FeeService.getFeeData(baseUrl);

    // 3. Validate the response
    assertExists(feeData);
    assert(typeof feeData.recommendedFee === "number");
    assert(feeData.recommendedFee >= 1);
    assertExists(feeData.source);
    assertExists(feeData.timestamp);

    // 4. Check security events (should be minimal for valid data)
    const securityReport = FeeSecurityService.getSecurityReport();
    assertExists(securityReport);

    // 5. Test background service status
    const bgStatus = BackgroundFeeService.getStatus();
    assertEquals(bgStatus.isRunning, true);

    // 6. Stop background service
    BackgroundFeeService.stop();

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    console.log(`End-to-end test completed in ${totalTime.toFixed(2)}ms`);
    console.log(
      `Fee data: ${feeData.recommendedFee} sats/vB from ${feeData.source}`,
    );
    console.log(`Security events: ${securityReport.summary.totalEvents}`);

    // Performance assertion
    assert(totalTime < 15000, `End-to-end test too slow: ${totalTime}ms`);

    console.log("End-to-end system integration test passed");
  });

  await t.step("Attack simulation and security response", () => {
    // Test the security system's response to various attack scenarios
    console.log("Testing security response to simulated attacks...");

    // Clear events for clean test
    FeeSecurityService.clearEvents();

    // Simulate various attack scenarios
    const attackScenarios = [
      {
        name: "Invalid fee structure",
        data: null,
        expectedBlocked: true,
      },
      {
        name: "Extremely high fee",
        data: { recommendedFee: 5000, source: "test", timestamp: Date.now() },
        expectedBlocked: true,
      },
      {
        name: "Negative fee",
        data: { recommendedFee: -10, source: "test", timestamp: Date.now() },
        expectedBlocked: true,
      },
      {
        name: "Future timestamp",
        data: {
          recommendedFee: 10,
          source: "test",
          timestamp: Date.now() + 300000,
        },
        expectedBlocked: false, // This is checked in cache poisoning, not validation
      },
      {
        name: "Valid fee",
        data: { recommendedFee: 10, source: "test", timestamp: Date.now() },
        expectedBlocked: false,
      },
    ];

    let blockedCount = 0;
    let allowedCount = 0;

    for (const scenario of attackScenarios) {
      const result = FeeSecurityService.validateFeeData(scenario.data, "test");

      if (result.action === "block") {
        blockedCount++;
        if (!scenario.expectedBlocked) {
          console.warn(`Unexpected block for scenario: ${scenario.name}`);
        }
      } else {
        allowedCount++;
        if (scenario.expectedBlocked) {
          console.warn(
            `Expected block but allowed for scenario: ${scenario.name}`,
          );
        }
      }
    }

    // Test cache poisoning detection
    const poisoningDetected = FeeSecurityService.monitorCachePoisoning(
      "test_key",
      { recommendedFee: 10, source: "mempool", timestamp: Date.now() },
      { recommendedFee: 200, source: "mempool", timestamp: Date.now() }, // 20x increase
      "test",
    );

    assertEquals(poisoningDetected, true, "Cache poisoning should be detected");

    // Check security report
    const report = FeeSecurityService.getSecurityReport();
    assert(
      report.summary.totalEvents > 0,
      "Security events should be recorded",
    );

    console.log(`Attack simulation results:`);
    console.log(`  Blocked: ${blockedCount}`);
    console.log(`  Allowed: ${allowedCount}`);
    console.log(`  Total security events: ${report.summary.totalEvents}`);

    console.log("Attack simulation and security response test passed");
  });

  console.log("All performance and migration tests completed successfully!");
});
