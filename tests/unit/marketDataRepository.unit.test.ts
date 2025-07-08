import { assertEquals, assertExists } from "@std/assert";
import { MarketDataRepository } from "$server/database/marketDataRepository.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { MockDatabaseManager } from "../mocks/mockDatabaseManager.ts";
import marketDataFixtures from "../fixtures/marketData.json" with {
  type: "json",
};

Deno.test("MarketDataRepository Unit Tests with DI", async (t) => {
  let mockDb: MockDatabaseManager;
  let originalDb: typeof dbManager;

  // Setup before each test
  function setup() {
    // Store original database instance
    originalDb = dbManager;

    // Create and inject mock database
    mockDb = new MockDatabaseManager();
    MarketDataRepository.setDatabase(mockDb as unknown as typeof dbManager);
  }

  // Teardown after each test
  function teardown() {
    // Restore original database
    MarketDataRepository.setDatabase(originalDb);

    // Clear mock data
    mockDb.clearQueryHistory();
    mockDb.clearMockResponses();
  }

  await t.step(
    "getStampMarketData - returns market data for stamp",
    async () => {
      setup();

      const testCpid = marketDataFixtures.stampMarketData[0].cpid;
      const result = await MarketDataRepository.getStampMarketData(
        testCpid,
      );

      assertExists(result);
      assertEquals(result?.cpid, testCpid);
      assertExists(result?.floorPriceBTC);
      assertExists(result?.holderCount);
      assertExists(result?.lastUpdated);

      // Verify the query was called
      assertEquals(
        mockDb.verifyQueryCalled("stamp_market_data"),
        true,
      );

      teardown();
    },
  );

  await t.step(
    "getStampMarketData - returns null for non-existent CPID",
    async () => {
      setup();

      const result = await MarketDataRepository.getStampMarketData(
        "NONEXISTENT",
      );

      assertEquals(result, null);

      teardown();
    },
  );

  await t.step(
    "getSRC20MarketData - returns market data for token",
    async () => {
      setup();

      const testTick = marketDataFixtures.src20MarketData[0].tick;
      const result = await MarketDataRepository.getSRC20MarketData(
        testTick,
      );

      assertExists(result);
      assertEquals(result?.tick, testTick);
      assertExists(result?.priceBTC);
      assertExists(result?.marketCapBTC);
      assertExists(result?.holderCount);

      // Verify the query was called
      assertEquals(
        mockDb.verifyQueryCalled("src20_market_data"),
        true,
      );

      teardown();
    },
  );

  await t.step(
    "getStampsWithMarketData - returns stamps with joined market data",
    async () => {
      setup();

      const result = await MarketDataRepository.getStampsWithMarketData({
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertEquals(Array.isArray(result), true);

      if (result.length > 0) {
        const firstStamp = result[0];
        // Should have stamp data
        assertExists(firstStamp.stamp);
        assertExists(firstStamp.cpid);

        // Should have market data if available
        if (firstStamp.marketData) {
          assertExists(firstStamp.marketData.floorPriceBTC);
          assertExists(firstStamp.cacheStatus);
        }
      }

      // Verify JOIN query was used
      assertEquals(
        mockDb.verifyQueryCalled("LEFT JOIN stamp_market_data"),
        true,
      );

      teardown();
    },
  );

  await t.step(
    "getBulkStampMarketData - returns market data for multiple CPIDs",
    async () => {
      setup();

      const cpids = marketDataFixtures.stampMarketData
        .slice(0, 3)
        .map((m) => m.cpid);

      const result = await MarketDataRepository.getBulkStampMarketData(cpids);

      assertExists(result);
      assertEquals(result instanceof Map, true);

      // Should return data for requested CPIDs
      result.forEach((data: any) => {
        assertEquals(cpids.includes(data.cpid), true);
        assertExists(data.floorPriceBTC);
      });

      // Verify IN clause was used
      assertEquals(mockDb.verifyQueryCalled("cpid IN"), true);

      teardown();
    },
  );

  await t.step(
    "getStampHoldersFromCache - returns holder distribution data",
    async () => {
      setup();

      const testCpid = marketDataFixtures.stampMarketData[0].cpid;

      // Set mock response for holder data
      mockDb.setMockResponse(
        "SELECT id, cpid, address",
        [testCpid],
        { rows: marketDataFixtures.holderData || [] },
      );

      const result = await MarketDataRepository.getStampHoldersFromCache(
        testCpid,
      );

      assertExists(result);
      assertEquals(Array.isArray(result), true);

      teardown();
    },
  );

  await t.step("handles database errors gracefully", async () => {
    setup();

    // Override method to throw error
    mockDb.executeQueryWithCache = () =>
      Promise.reject(new Error("Database connection failed"));

    const result = await MarketDataRepository.getStampMarketData("TEST");

    // Should handle error and return null or empty result
    assertEquals(result, null);

    teardown();
  });

  await t.step(
    "cache behavior - verifies cache duration is passed",
    async () => {
      setup();

      // Track the calls
      const originalMethod = mockDb.executeQueryWithCache.bind(mockDb);
      let cacheDurationCaptured: number | "never" | undefined;

      mockDb.executeQueryWithCache = (
        query: string,
        params: unknown[],
        cacheDuration: number | "never",
      ) => {
        cacheDurationCaptured = cacheDuration;
        return originalMethod(query, params, cacheDuration);
      };

      await MarketDataRepository.getStampMarketData("TEST");

      // Market data should use caching
      assertExists(cacheDurationCaptured);
      assertEquals(typeof cacheDurationCaptured, "number");
      assertEquals((cacheDurationCaptured as number) > 0, true);

      teardown();
    },
  );
});
