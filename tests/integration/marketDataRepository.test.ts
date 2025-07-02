import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { MarketDataRepository } from "$server/database/marketDataRepository.ts";
import { dbManager } from "$server/database/databaseManager.ts";

describe("MarketDataRepository Integration Tests", () => {
  beforeAll(() => {
    console.log("Starting MarketDataRepository integration tests...");
    // Ensure database connection is established
  });

  afterAll(() => {
    console.log("Cleaning up database connections...");
    // dbManager doesn't have a close method - it manages connections internally
  });

  describe("getStampMarketData", () => {
    it("should return market data for stamps with market activity", async () => {
      // First, get some stamps that might have market data
      const query = `
        SELECT DISTINCT cpid 
        FROM market_data_cache 
        WHERE cpid IS NOT NULL 
        LIMIT 5
      `;

      const result = await dbManager.executeQuery(query);

      if (result.rows.length > 0) {
        const testCpid = result.rows[0].cpid;
        const marketData = await MarketDataRepository.getStampMarketData(
          testCpid,
        );

        if (marketData) {
          assertExists(marketData.cpid);
          assertEquals(marketData.cpid, testCpid);
          assertEquals(typeof marketData.floorPriceBTC, "number");
          assertEquals(typeof marketData.holderCount, "number");
          assertExists(marketData.volumeSources);
          assertExists(marketData.cacheAge);
          assertEquals(typeof marketData.cacheAge, "number");
        }
      }
    });

    it("should return null for non-existent CPID", async () => {
      const result = await MarketDataRepository.getStampMarketData(
        "NONEXISTENT_CPID_99999",
      );
      assertEquals(result, null);
    });
  });

  describe("getStampsWithMarketData", () => {
    it("should return stamps with market data using pagination", async () => {
      const result = await MarketDataRepository.getStampsWithMarketData({
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertEquals(Array.isArray(result), true);
      assertEquals(result.length <= 10, true);

      if (result.length > 0) {
        const firstStamp = result[0];
        assertExists(firstStamp.stamp);
        assertExists(firstStamp.cpid);

        if (firstStamp.marketData) {
          assertExists(firstStamp.marketData.floorPriceBTC);
          assertExists(firstStamp.marketData.volumeSources);
        }
      }
    });

    it("should handle sorting by market data fields", async () => {
      const result = await MarketDataRepository.getStampsWithMarketData({
        limit: 5,
        offset: 0,
        sortBy: "floor_price_btc",
        sortOrder: "DESC",
      });

      if (result.length > 1) {
        // Check that items are sorted by floor price descending
        for (let i = 0; i < result.length - 1; i++) {
          const current = result[i].marketData?.floorPriceBTC || 0;
          const next = result[i + 1].marketData?.floorPriceBTC || 0;
          assertEquals(current >= next, true);
        }
      }
    });
  });

  describe("getSRC20MarketData", () => {
    it("should return market data for known SRC20 tokens", async () => {
      // Try to find a token with market data
      const query = `
        SELECT DISTINCT tick 
        FROM src20_market_data_cache 
        WHERE tick IS NOT NULL 
        LIMIT 5
      `;

      const result = await dbManager.executeQuery(query);

      if (result.rows.length > 0) {
        const testTick = result.rows[0].tick;
        const marketData = await MarketDataRepository.getSRC20MarketData(
          testTick,
        );

        if (marketData) {
          assertExists(marketData.tick);
          assertEquals(marketData.tick, testTick);
          assertEquals(typeof marketData.floorPriceBTC, "number");
          assertEquals(typeof marketData.marketCapBTC, "number");
          assertEquals(typeof marketData.volume24hBTC, "number");
          assertEquals(Array.isArray(marketData.exchangeSources), true);
        }
      }
    });

    it("should return null for non-existent token", async () => {
      const result = await MarketDataRepository.getSRC20MarketData(
        "NONEXISTENT_TOKEN_12345",
      );
      assertEquals(result, null);
    });
  });

  describe("getAllSRC20MarketData", () => {
    it("should return top SRC20 tokens by market cap", async () => {
      const result = await MarketDataRepository.getAllSRC20MarketData(10);

      assertExists(result);
      assertEquals(Array.isArray(result), true);
      assertEquals(result.length <= 10, true);

      if (result.length > 1) {
        // Check that tokens are sorted by market cap descending
        for (let i = 0; i < result.length - 1; i++) {
          const current = result[i].marketCapBTC;
          const next = result[i + 1].marketCapBTC;
          assertEquals(current >= next, true);
        }
      }
    });
  });

  describe("getBulkStampMarketData", () => {
    it("should return Map with market data for multiple CPIDs", async () => {
      // Get some CPIDs with market data
      const query = `
        SELECT DISTINCT cpid 
        FROM market_data_cache 
        WHERE cpid IS NOT NULL 
        LIMIT 3
      `;

      const queryResult = await dbManager.executeQuery(query);

      if (queryResult.rows.length > 0) {
        const cpids = queryResult.rows.map((row) => row.cpid);
        const result = await MarketDataRepository.getBulkStampMarketData(cpids);

        assertInstanceOf(result, Map);
        assertEquals(result.size <= cpids.length, true);

        // Check that returned data matches requested CPIDs
        for (const [cpid, data] of result) {
          assertEquals(cpids.includes(cpid), true);
          assertExists(data.floorPriceBTC);
          assertExists(data.volumeSources);
        }
      }
    });

    it("should return empty Map for empty array", async () => {
      const result = await MarketDataRepository.getBulkStampMarketData([]);
      assertInstanceOf(result, Map);
      assertEquals(result.size, 0);
    });
  });

  describe("getStampHoldersFromCache", () => {
    it("should return holder data for stamps with holder cache", async () => {
      // Find a stamp with holder data
      const query = `
        SELECT DISTINCT cpid 
        FROM stamp_holder_cache 
        WHERE cpid IS NOT NULL 
        LIMIT 1
      `;

      const queryResult = await dbManager.executeQuery(query);

      if (queryResult.rows.length > 0) {
        const testCpid = queryResult.rows[0].cpid;
        const holders = await MarketDataRepository.getStampHoldersFromCache(
          testCpid,
        );

        assertExists(holders);
        assertEquals(Array.isArray(holders), true);

        if (holders.length > 0) {
          const firstHolder = holders[0];
          assertExists(firstHolder.address);
          assertEquals(typeof firstHolder.quantity, "number");
          assertEquals(typeof firstHolder.percentage, "number");

          // Check sorting by rank
          if (holders.length > 1) {
            for (let i = 0; i < holders.length - 1; i++) {
              assertEquals(
                holders[i].rankPosition <= holders[i + 1].rankPosition,
                true,
              );
            }
          }
        }
      }
    });

    it("should return empty array for CPID without holder data", async () => {
      const result = await MarketDataRepository.getStampHoldersFromCache(
        "NONEXISTENT_CPID_99999",
      );
      assertEquals(Array.isArray(result), true);
      assertEquals(result.length, 0);
    });
  });

  describe("getCollectionMarketData", () => {
    it("should return market data for collections", async () => {
      // Find a collection with market data
      const query = `
        SELECT DISTINCT collection_id 
        FROM collection_market_data_cache 
        WHERE collection_id IS NOT NULL 
        LIMIT 1
      `;

      const queryResult = await dbManager.executeQuery(query);

      if (queryResult.rows.length > 0) {
        const collectionId = queryResult.rows[0].collection_id;
        const marketData = await MarketDataRepository.getCollectionMarketData(
          collectionId,
        );

        if (marketData) {
          assertExists(marketData.collectionId);
          assertEquals(marketData.collectionId, collectionId);
          assertEquals(typeof marketData.minFloorPriceBTC, "number");
          assertEquals(typeof marketData.maxFloorPriceBTC, "number");
          assertEquals(typeof marketData.avgFloorPriceBTC, "number");
          assertEquals(typeof marketData.totalStampsCount, "number");
        }
      }
    });
  });
});
