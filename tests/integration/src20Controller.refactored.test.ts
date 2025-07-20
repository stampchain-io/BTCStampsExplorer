/**
 * @fileoverview Integration Tests for Refactored SRC20Controller Endpoints
 * @description Tests the refactored handleSrc20BalanceRequest, fetchFullyMintedByMarketCapV2,
 * and fetchTrendingActiveMintingTokensV2 methods to ensure MarketDataEnrichmentService
 * integration works correctly and maintains backward compatibility.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";

const BASE_URL = "http://localhost:8000";
const TIMEOUT_MS = 10000; // 10 seconds timeout for integration tests

// Skip tests in CI if no test server is available
const skipInCI = Deno.env.get("CI") === "true" &&
  !Deno.env.get("TEST_SERVER_AVAILABLE");

describe("SRC20Controller Refactored Endpoints Integration Tests", () => {
  beforeAll(async () => {
    // Wait for server to be ready
    console.log("🔄 Waiting for test server to be ready...");

    let retries = 10;
    while (retries > 0) {
      try {
        const response = await fetch(`${BASE_URL}/api/v2/health`, {
          signal: AbortSignal.timeout(2000),
        });
        if (response.ok) {
          console.log("✅ Test server is ready");
          break;
        }
      } catch (_error) {
        console.log(
          `⏳ Server not ready, retrying... (${retries} attempts left)`,
        );
        retries--;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (retries === 0) {
      console.warn("⚠️ Test server may not be available, tests might fail");
    }
  });

  afterAll(() => {
    console.log("🧹 SRC20Controller integration tests completed");
  });

  describe("handleSrc20BalanceRequest - Refactored with MarketDataEnrichmentService", () => {
    it("should return enriched SRC20 data with market_data in v2.3", async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(
          `${BASE_URL}/api/v2/src20/DEPLOY?sortBy=DESC&limit=5&page=1`,
          {
            headers: {
              "X-API-Version": "2.3",
              "Accept": "application/json",
            },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);
        assertEquals(response.ok, true, "Response should be successful");

        const data = await response.json();
        assertExists(data.data, "Should have data array");
        assert(Array.isArray(data.data), "Data should be an array");

        if (data.data.length > 0) {
          const firstToken = data.data[0];

          // Core SRC20 fields should still exist
          assertExists(firstToken.tick, "Should have tick");
          assertExists(firstToken.op, "Should have operation");
          assertExists(firstToken.creator, "Should have creator");

          // NEW: market_data should be present (even if null)
          assert(
            "market_data" in firstToken,
            "Should have market_data property",
          );

          if (firstToken.market_data) {
            // Validate market_data structure
            assertExists(
              firstToken.market_data.tick,
              "Market data should have tick",
            );
            assertEquals(
              typeof firstToken.market_data.floor_price_btc,
              "number",
              "Floor price should be number",
            );
            assertEquals(
              typeof firstToken.market_data.market_cap_btc,
              "number",
              "Market cap should be number",
            );
            assertEquals(
              typeof firstToken.market_data.volume_24h_btc,
              "number",
              "Volume should be number",
            );
            assertEquals(
              typeof firstToken.market_data.holder_count,
              "number",
              "Holder count should be number",
            );
          }
        }
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });

    it("should maintain backward compatibility in v2.2 (no market_data duplication)", async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(
          `${BASE_URL}/api/v2/src20/DEPLOY?sortBy=DESC&limit=3&page=1`,
          {
            headers: {
              "X-API-Version": "2.2",
              "Accept": "application/json",
            },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);
        assertEquals(response.ok, true, "Response should be successful");

        const data = await response.json();
        assertExists(data.data, "Should have data array");

        if (data.data.length > 0) {
          const firstToken = data.data[0];

          // Core SRC20 fields should exist
          assertExists(firstToken.tick, "Should have tick");
          assertExists(firstToken.op, "Should have operation");

          // v2.2 should NOT have root-level market fields OR nested market_data
          assert(
            !("floor_unit_price" in firstToken),
            "Should not have deprecated root-level floor_unit_price",
          );
          assert(
            !("mcap" in firstToken),
            "Should not have deprecated root-level mcap",
          );
          assert(
            !("volume24" in firstToken),
            "Should not have deprecated root-level volume24",
          );
          assert(
            !("market_data" in firstToken),
            "Should not have market_data in v2.2",
          );
        }
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });

    it("should handle different sorting parameters correctly", async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        // Test ASC sorting
        const ascResponse = await fetch(
          `${BASE_URL}/api/v2/src20/DEPLOY?sortBy=ASC&limit=3&page=1`,
          {
            headers: {
              "X-API-Version": "2.3",
              "Accept": "application/json",
            },
            signal: controller.signal,
          },
        );

        assertEquals(ascResponse.ok, true, "ASC response should be successful");
        const ascData = await ascResponse.json();
        assertExists(ascData.data, "Should have ASC data");

        // Test DESC sorting
        const descResponse = await fetch(
          `${BASE_URL}/api/v2/src20/DEPLOY?sortBy=DESC&limit=3&page=1`,
          {
            headers: {
              "X-API-Version": "2.3",
              "Accept": "application/json",
            },
            signal: controller.signal,
          },
        );

        assertEquals(
          descResponse.ok,
          true,
          "DESC response should be successful",
        );
        const descData = await descResponse.json();
        assertExists(descData.data, "Should have DESC data");

        // If both have data, verify sorting is different
        if (ascData.data.length > 0 && descData.data.length > 0) {
          // Block indices should be in different order
          const ascBlockIndex = ascData.data[0].block_index;
          const descBlockIndex = descData.data[0].block_index;

          // They should be different if there's more than one record
          if (ascData.data.length > 1 || descData.data.length > 1) {
            assert(
              ascBlockIndex <= descBlockIndex,
              "Sorting should work correctly",
            );
          }
        }
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });
  });

  describe("fetchFullyMintedByMarketCapV2 - Refactored Endpoint", () => {
    it("should return fully minted tokens with market data enrichment", async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(
          `${BASE_URL}/api/v2/src20/tickers/fully-minted?limit=5&page=1`,
          {
            headers: {
              "X-API-Version": "2.3",
              "Accept": "application/json",
            },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);
        assertEquals(response.ok, true, "Response should be successful");

        const data = await response.json();
        assertExists(data.data, "Should have data array");
        assert(Array.isArray(data.data), "Data should be an array");

        // Validate pagination metadata
        assertExists(data.total, "Should have total count");
        assertExists(data.page, "Should have page number");
        assertExists(data.limit, "Should have limit");
        assertEquals(data.limit, 5, "Should respect limit parameter");

        if (data.data.length > 0) {
          const firstToken = data.data[0];

          // Should have SRC20 fields
          assertExists(firstToken.tick, "Should have tick");
          assertExists(firstToken.max, "Should have max supply");

          // Should have progress indicating fully minted
          if (firstToken.progress) {
            assertEquals(
              firstToken.progress,
              "100.00",
              "Should be fully minted",
            );
          }

          // NEW: Should have market_data enrichment
          assert(
            "market_data" in firstToken,
            "Should have market_data property",
          );

          if (firstToken.market_data) {
            assertExists(
              firstToken.market_data.tick,
              "Market data should have tick",
            );
            assertEquals(
              firstToken.market_data.tick,
              firstToken.tick,
              "Market data tick should match token tick",
            );
          }
        }
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });

    it("should handle pagination correctly", async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        // Test first page
        const page1Response = await fetch(
          `${BASE_URL}/api/v2/src20/tickers/fully-minted?limit=3&page=1`,
          {
            headers: {
              "X-API-Version": "2.3",
              "Accept": "application/json",
            },
            signal: controller.signal,
          },
        );

        assertEquals(
          page1Response.ok,
          true,
          "Page 1 response should be successful",
        );
        const page1Data = await page1Response.json();

        assertExists(page1Data.data, "Page 1 should have data");
        assertEquals(page1Data.page, 1, "Should be page 1");
        assertEquals(page1Data.limit, 3, "Should have limit 3");

        // Test second page if there are enough records
        if (page1Data.total > 3) {
          const page2Response = await fetch(
            `${BASE_URL}/api/v2/src20/tickers/fully-minted?limit=3&page=2`,
            {
              headers: {
                "X-API-Version": "2.3",
                "Accept": "application/json",
              },
              signal: controller.signal,
            },
          );

          assertEquals(
            page2Response.ok,
            true,
            "Page 2 response should be successful",
          );
          const page2Data = await page2Response.json();

          assertEquals(page2Data.page, 2, "Should be page 2");

          // Data should be different between pages
          if (page1Data.data.length > 0 && page2Data.data.length > 0) {
            const page1Ticks = page1Data.data.map((t: any) => t.tick);
            const page2Ticks = page2Data.data.map((t: any) => t.tick);

            // Should have different ticks (no overlap)
            const overlap = page1Ticks.filter((tick: string) =>
              page2Ticks.includes(tick)
            );
            assertEquals(overlap.length, 0, "Pages should have different data");
          }
        }
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });
  });

  describe("fetchTrendingActiveMintingTokensV2 - Refactored Trending Endpoint", () => {
    it("should return trending tokens with market data enrichment", async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(
          `${BASE_URL}/api/v2/src20/tickers/trending?limit=5&page=1`,
          {
            headers: {
              "X-API-Version": "2.3",
              "Accept": "application/json",
            },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);
        assertEquals(response.ok, true, "Response should be successful");

        const data = await response.json();
        assertExists(data.data, "Should have data array");
        assert(Array.isArray(data.data), "Data should be an array");

        // Validate response structure
        assertExists(data.last_block, "Should have last_block");
        assertExists(data.total, "Should have total");
        assertExists(data.page, "Should have page");
        assertEquals(data.limit, 5, "Should respect limit");

        if (data.data.length > 0) {
          const firstToken = data.data[0];

          // Should have trending/deployment fields
          assertExists(firstToken.tick, "Should have tick");

          // Should have deployment info (merged from deployment data)
          if (firstToken.max) {
            assertEquals(
              typeof firstToken.max,
              "string",
              "Max should be string",
            );
          }

          // NEW: Should have market_data enrichment
          assert(
            "market_data" in firstToken,
            "Should have market_data property",
          );

          if (firstToken.market_data) {
            assertExists(
              firstToken.market_data.tick,
              "Market data should have tick",
            );
            assertEquals(
              firstToken.market_data.tick,
              firstToken.tick,
              "Market data tick should match token tick",
            );

            // Validate enriched fields structure
            assert(
              "floor_price_btc" in firstToken.market_data,
              "Should have floor_price_btc",
            );
            assert(
              "market_cap_btc" in firstToken.market_data,
              "Should have market_cap_btc",
            );
            assert(
              "volume_24h_btc" in firstToken.market_data,
              "Should have volume_24h_btc",
            );
          }
        }
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });

    it("should maintain consistent data structure across endpoints", async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        // Fetch from multiple endpoints
        const [deployResponse, trendingResponse, fullyMintedResponse] =
          await Promise.all([
            fetch(`${BASE_URL}/api/v2/src20/DEPLOY?limit=2`, {
              headers: { "X-API-Version": "2.3" },
              signal: controller.signal,
            }),
            fetch(`${BASE_URL}/api/v2/src20/tickers/trending?limit=2`, {
              headers: { "X-API-Version": "2.3" },
              signal: controller.signal,
            }),
            fetch(`${BASE_URL}/api/v2/src20/tickers/fully-minted?limit=2`, {
              headers: { "X-API-Version": "2.3" },
              signal: controller.signal,
            }),
          ]);

        clearTimeout(timeoutId);

        assertEquals(deployResponse.ok, true, "Deploy endpoint should work");
        assertEquals(
          trendingResponse.ok,
          true,
          "Trending endpoint should work",
        );
        assertEquals(
          fullyMintedResponse.ok,
          true,
          "Fully minted endpoint should work",
        );

        const [deployData, trendingData, fullyMintedData] = await Promise.all([
          deployResponse.json(),
          trendingResponse.json(),
          fullyMintedResponse.json(),
        ]);

        // All should have consistent response structure
        for (
          const [name, data] of [
            ["deploy", deployData],
            ["trending", trendingData],
            ["fullyMinted", fullyMintedData],
          ]
        ) {
          assertExists(data.data, `${name} should have data array`);
          assert(Array.isArray(data.data), `${name} data should be array`);
          assertExists(data.page, `${name} should have page`);
          assertExists(data.limit, `${name} should have limit`);

          // All tokens should have market_data property in v2.3
          if (data.data.length > 0) {
            const firstToken = data.data[0];
            assert(
              "market_data" in firstToken,
              `${name} tokens should have market_data property`,
            );
          }
        }
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });
  });

  describe("Performance and Error Handling", () => {
    it("should handle invalid parameters gracefully", async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        // Test invalid limit
        const invalidLimitResponse = await fetch(
          `${BASE_URL}/api/v2/src20/DEPLOY?limit=invalid&page=1`,
          {
            headers: { "X-API-Version": "2.3" },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        // Should either return default limit or handle gracefully
        const data = await invalidLimitResponse.json();

        // Should not crash and should return some response
        assertExists(
          data,
          "Should return some response even with invalid parameters",
        );
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });

    it("should respond within reasonable time limits", async () => {
      const startTime = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(
          `${BASE_URL}/api/v2/src20/DEPLOY?limit=10`,
          {
            headers: { "X-API-Version": "2.3" },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        assertEquals(response.ok, true, "Response should be successful");

        // Should respond within 5 seconds (generous for integration test)
        assert(duration < 5000, `Response should be fast, took ${duration}ms`);

        console.log(`📊 Endpoint performance: ${duration}ms`);
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });

    it("should handle empty results gracefully", async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        // Test with very high page number to likely get empty results
        const response = await fetch(
          `${BASE_URL}/api/v2/src20/DEPLOY?page=9999&limit=10`,
          {
            headers: { "X-API-Version": "2.3" },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);
        assertEquals(
          response.ok,
          true,
          "Should handle empty results gracefully",
        );

        const data = await response.json();
        assertExists(data.data, "Should have data array even if empty");
        assert(Array.isArray(data.data), "Data should be an array");
        assertEquals(
          data.data.length,
          0,
          "Should be empty array for high page number",
        );
        assertExists(data.page, "Should still have pagination info");
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });
  });

  describe("API Versioning Compliance", () => {
    it("should handle requests without version header (default behavior)", async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(
          `${BASE_URL}/api/v2/src20/DEPLOY?limit=3`,
          {
            headers: { "Accept": "application/json" },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);
        assertEquals(response.ok, true, "Should work without version header");

        const data = await response.json();
        assertExists(data.data, "Should have data");

        // Default behavior should be the latest version
        if (data.data.length > 0) {
          const firstToken = data.data[0];
          assert(
            "market_data" in firstToken,
            "Default should include market_data (latest version)",
          );
        }
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });

    it("should respect Accept-Version header", async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(
          `${BASE_URL}/api/v2/src20/DEPLOY?limit=2`,
          {
            headers: {
              "Accept-Version": "2.2",
              "Accept": "application/json",
            },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);
        assertEquals(
          response.ok,
          true,
          "Should work with Accept-Version header",
        );

        const data = await response.json();
        if (data.data.length > 0) {
          const firstToken = data.data[0];
          assert(
            !("market_data" in firstToken),
            "v2.2 should not include market_data",
          );
        }
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });
  });
});
