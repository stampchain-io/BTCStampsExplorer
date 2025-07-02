import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

// Skip these tests in CI environment since they require database connection
const shouldRunDatabaseTests = Deno.env.get("DENO_ENV") !== "test" ||
  Deno.env.get("RUN_DB_TESTS") === "true";

if (!shouldRunDatabaseTests) {
  Deno.test("Market Data Filters - NULL handling", () => {
    console.log("Skipping database tests in CI environment");
  });

  Deno.test("Market Data Filters - Query Performance", () => {
    console.log("Skipping database performance tests in CI environment");
  });
} else {
  const { StampRepository } = await import(
    "../../server/database/stampRepository.ts"
  );

  Deno.test("Market Data Filters - NULL handling", async (t) => {
    await t.step("Should handle stamps with NULL market data", async () => {
      // Test that filters gracefully handle NULL values in market data
      // This should not throw an error even if some stamps have NULL market data
      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
        minHolderCount: "10",
        minFloorPriceBTC: "0.001",
        minDistributionScore: "50",
        noPagination: false,
        skipTotalCount: false,
      });

      assertExists(result);
      assertExists(result.stamps);
      assertEquals(Array.isArray(result.stamps), true);
    });

    await t.step(
      "Should only return stamps matching filter criteria",
      async () => {
        const result = await StampRepository.getStamps({
          limit: 10,
          page: 1,
          minHolderCount: "100",
          maxHolderCount: "500",
          noPagination: false,
          skipTotalCount: false,
        });

        // All returned stamps should have holder counts within range
        for (const stamp of result.stamps) {
          if (stamp.marketData && stamp.marketData.holderCount !== null) {
            assertEquals(stamp.marketData.holderCount >= 100, true);
            assertEquals(stamp.marketData.holderCount <= 500, true);
          }
        }
      },
    );

    await t.step("Should handle distribution score filtering", async () => {
      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
        minDistributionScore: "75", // High distribution score
        noPagination: false,
        skipTotalCount: false,
      });

      // Check that returned stamps have high distribution scores
      for (const stamp of result.stamps) {
        if (
          stamp.marketData && stamp.marketData.holderDistributionScore !== null
        ) {
          assertEquals(stamp.marketData.holderDistributionScore >= 75, true);
        }
      }
    });

    await t.step("Should filter by price source", async () => {
      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
        priceSource: "counterparty,openstamp",
        noPagination: false,
        skipTotalCount: false,
      });

      // Check that returned stamps have the correct price sources
      for (const stamp of result.stamps) {
        if (stamp.marketData && stamp.marketData.priceSource) {
          const validSources = ["counterparty", "openstamp"];
          assertEquals(
            validSources.includes(stamp.marketData.priceSource),
            true,
          );
        }
      }
    });

    await t.step("Should filter by cache age", async () => {
      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
        maxCacheAgeMinutes: "60", // Only data updated within last hour
        noPagination: false,
        skipTotalCount: false,
      });

      // Verify cache age for returned stamps
      const now = new Date();
      for (const stamp of result.stamps) {
        if (stamp.marketData && stamp.marketData.lastUpdated) {
          const lastUpdated = new Date(stamp.marketData.lastUpdated);
          const ageMinutes = (now.getTime() - lastUpdated.getTime()) /
            (1000 * 60);
          assertEquals(ageMinutes <= 60, true);
        }
      }
    });

    await t.step("Should combine multiple filters", async () => {
      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
        minHolderCount: "50",
        minFloorPriceBTC: "0.01",
        minDataQualityScore: "7",
        maxTopHolderPercentage: "30",
        noPagination: false,
        skipTotalCount: false,
      });

      // Verify all filters are applied
      for (const stamp of result.stamps) {
        if (stamp.marketData) {
          if (stamp.marketData.holderCount !== null) {
            assertEquals(stamp.marketData.holderCount >= 50, true);
          }
          if (stamp.marketData.floorPriceBTC !== null) {
            assertEquals(stamp.marketData.floorPriceBTC >= 0.01, true);
          }
          if (stamp.marketData.dataQualityScore !== null) {
            assertEquals(stamp.marketData.dataQualityScore >= 7, true);
          }
          if (stamp.marketData.topHolderPercentage !== null) {
            assertEquals(stamp.marketData.topHolderPercentage <= 30, true);
          }
        }
      }
    });
  });

  Deno.test("Market Data Filters - Query Performance", async (t) => {
    await t.step(
      "Should execute efficiently with indexed columns",
      async () => {
        const startTime = performance.now();

        const result = await StampRepository.getStamps({
          limit: 100,
          page: 1,
          minHolderCount: "100",
          minFloorPriceBTC: "0.001",
          minDistributionScore: "50",
          noPagination: false,
          skipTotalCount: false,
        });

        const endTime = performance.now();
        const executionTime = endTime - startTime;

        // Query should execute in reasonable time (< 2 seconds)
        assertEquals(executionTime < 2000, true);
        assertExists(result);
      },
    );
  });
}
