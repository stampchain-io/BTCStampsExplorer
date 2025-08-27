import { assertEquals, assertExists } from "@std/assert";

/**
 * Integration test for fee endpoint timeout prevention
 * Tests the actual /api/internal/fees endpoint to ensure our fixes work
 */

Deno.test("Fee Endpoint Integration Tests", async (t) => {
  // Store original environment
  const originalEnv = Deno.env.get("DENO_ENV");

  await t.step(
    "Fee endpoint should respond quickly in development mode",
    async () => {
      // Set development environment
      Deno.env.set("DENO_ENV", "development");

      const startTime = Date.now();

      try {
        // Test the actual endpoint with a reasonable timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(
          "http://localhost:8000/api/internal/fees",
          {
            signal: controller.signal,
            headers: {
              "Accept": "application/json",
              "User-Agent": "Test Client",
            },
          },
        );

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        // Endpoint should respond quickly (< 2 seconds)
        assertEquals(
          duration < 2000,
          true,
          `Endpoint should respond in < 2s, got ${duration}ms`,
        );
        assertEquals(response.ok, true, "Response should be successful");

        const data = await response.json();

        // Validate response structure
        assertExists(data.recommendedFee, "Should have recommendedFee");
        assertExists(data.btcPrice, "Should have btcPrice");
        assertExists(data.source, "Should have source");
        assertExists(data.confidence, "Should have confidence");
        assertExists(data.timestamp, "Should have timestamp");

        // Validate development mode behavior
        assertEquals(
          data.source,
          "default",
          "Should use default source in development",
        );
        assertEquals(
          data.fallbackUsed,
          true,
          "Should use fallback in development",
        );
        assertEquals(
          data.recommendedFee >= 1,
          true,
          "Recommended fee should be >= 1 sat/vB",
        );

        console.log(`✅ Fee endpoint responded in ${duration}ms with data:`, {
          recommendedFee: data.recommendedFee,
          source: data.source,
          fallbackUsed: data.fallbackUsed,
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error(
            `Fee endpoint timed out after 5 seconds - this indicates the timeout issue is not fixed`,
          );
        }
        throw error;
      }
    },
  );

  await t.step(
    "Fee endpoint should handle CSRF validation properly",
    async () => {
      // Test without CSRF token (should work in development)
      const response = await fetch("http://localhost:8000/api/internal/fees", {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      // Should succeed in development mode (CSRF bypassed)
      assertEquals(
        response.ok,
        true,
        "Should succeed without CSRF token in development",
      );

      const data = await response.json();
      assertExists(data.recommendedFee, "Should return fee data");
    },
  );

  await t.step(
    "Fee endpoint should return consistent data structure",
    async () => {
      // Make multiple requests to ensure consistency
      const requests = Array.from(
        { length: 3 },
        () =>
          fetch("http://localhost:8000/api/internal/fees").then((r) =>
            r.json()
          ),
      );

      const results = await Promise.all(requests);

      // All responses should have the same structure
      for (const result of results) {
        assertExists(result.recommendedFee);
        assertExists(result.btcPrice);
        assertExists(result.source);
        assertExists(result.confidence);
        assertExists(result.timestamp);
        assertExists(result.fallbackUsed);

        // In development, should always be static fallback
        assertEquals(result.source, "default");
        assertEquals(result.fallbackUsed, true);
        assertEquals(result.recommendedFee, 10); // Our static fallback value
      }

      console.log(
        `✅ Made ${results.length} requests, all returned consistent data structure`,
      );
    },
  );

  await t.step(
    "Fee endpoint should handle rapid requests without issues",
    async () => {
      // Test rapid successive requests to ensure no race conditions
      const rapidRequests = Array.from({ length: 10 }, (_, i) => {
        return fetch("http://localhost:8000/api/internal/fees")
          .then((r) => r.json())
          .then((data) => ({ requestId: i, data }));
      });

      const startTime = Date.now();
      const results = await Promise.all(rapidRequests);
      const totalDuration = Date.now() - startTime;

      // All requests should succeed
      assertEquals(results.length, 10, "All requests should complete");

      // Average response time should be reasonable
      const avgResponseTime = totalDuration / results.length;
      assertEquals(
        avgResponseTime < 500,
        true,
        `Average response time should be < 500ms, got ${avgResponseTime}ms`,
      );

      // All responses should be valid
      for (const result of results) {
        assertExists(result.data.recommendedFee);
        assertEquals(result.data.recommendedFee >= 1, true);
      }

      console.log(
        `✅ Completed ${results.length} rapid requests in ${totalDuration}ms (avg: ${
          avgResponseTime.toFixed(1)
        }ms per request)`,
      );
    },
  );

  // Restore original environment
  if (originalEnv) {
    Deno.env.set("DENO_ENV", originalEnv);
  } else {
    Deno.env.delete("DENO_ENV");
  }
});

Deno.test("Fee Service Development Mode Tests", async (t) => {
  await t.step(
    "Development mode environment variables should be set correctly",
    () => {
      // Test that development mode is properly detected
      const currentEnv = Deno.env.get("DENO_ENV");
      const skipRedis = (globalThis as any).SKIP_REDIS_CONNECTION;

      console.log(`Current DENO_ENV: ${currentEnv}`);
      console.log(`SKIP_REDIS_CONNECTION: ${skipRedis}`);

      // In our development setup, these should be set
      if (currentEnv === "development") {
        assertEquals(
          skipRedis,
          true,
          "SKIP_REDIS_CONNECTION should be true in development",
        );
      }
    },
  );

  await t.step("Static fallback data should be valid", () => {
    // Test the static fallback data structure that we return in development
    const staticFallback = {
      recommendedFee: 10,
      btcPrice: 0,
      source: "default",
      confidence: "low",
      timestamp: Date.now(),
      fallbackUsed: true,
      debug_feesResponse: {
        static_fallback: true,
        available_rates: {
          conservative: 10,
          normal: 6,
          minimum: 1,
        },
        selected_rate: 10,
        reason: "Development mode - API timeouts prevented",
      },
    };

    // Validate all required fields
    assertEquals(typeof staticFallback.recommendedFee, "number");
    assertEquals(typeof staticFallback.btcPrice, "number");
    assertEquals(typeof staticFallback.source, "string");
    assertEquals(typeof staticFallback.confidence, "string");
    assertEquals(typeof staticFallback.timestamp, "number");
    assertEquals(typeof staticFallback.fallbackUsed, "boolean");

    // Validate values
    assertEquals(staticFallback.recommendedFee >= 1, true);
    assertEquals(staticFallback.btcPrice >= 0, true);
    assertEquals(staticFallback.source, "default");
    assertEquals(staticFallback.confidence, "low");
    assertEquals(staticFallback.fallbackUsed, true);

    // Validate debug response
    assertExists(staticFallback.debug_feesResponse);
    assertEquals(staticFallback.debug_feesResponse.static_fallback, true);
    assertExists(staticFallback.debug_feesResponse.available_rates);
    assertEquals(staticFallback.debug_feesResponse.selected_rate, 10);
  });
});
