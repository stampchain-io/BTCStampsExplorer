import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { MarketDataRepository } from "$server/database/marketDataRepository.ts";
import marketDataFixtures from "../fixtures/marketData.json" with {
  type: "json",
};
import stampFixtures from "../fixtures/stampData.json" with { type: "json" };
import {
  fixtureHelpers,
  FixtureTestHelper,
} from "../helpers/fixtureTestHelper.ts";

describe("MarketDataRepository Unit Tests (with shared helper)", () => {
  let helper: FixtureTestHelper;

  beforeEach(() => {
    helper = new FixtureTestHelper();
  });

  afterEach(() => {
    helper.restoreAll();
  });

  describe("getStampMarketData", () => {
    it("should return market data for valid CPID", async () => {
      const mockData = marketDataFixtures.stampMarketData[0];
      fixtureHelpers.mockMarketDataQuery(helper, [mockData]);

      const result = await MarketDataRepository.getStampMarketData(
        mockData.cpid,
      );

      assertExists(result);
      assertEquals(result?.cpid, mockData.cpid);
      assertEquals(typeof result?.floorPriceBTC, "number");
      assertEquals(typeof result?.holderCount, "number");
      assertExists(result?.volumeSources);
      assertExists(result?.cacheAge);
    });

    it("should return null for non-existent CPID", async () => {
      helper.mockEmpty();

      const result = await MarketDataRepository.getStampMarketData(
        "NONEXISTENT",
      );
      assertEquals(result, null);
    });

    it("should handle database errors", async () => {
      helper.mockError("Database error");

      const result = await MarketDataRepository.getStampMarketData("ERROR");
      assertEquals(result, null);
    });

    it("should calculate cache age correctly", async () => {
      const mockData = {
        ...marketDataFixtures.stampMarketData[0],
        last_updated: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      };

      fixtureHelpers.mockMarketDataQuery(helper, [mockData]);

      const result = await MarketDataRepository.getStampMarketData(
        mockData.cpid,
      );
      assertExists(result?.cacheAge);
      // Cache age should be approximately 15 minutes
      assertEquals(result!.cacheAge >= 14 && result!.cacheAge <= 16, true);
    });
  });

  describe("getStampsWithMarketData", () => {
    it("should return stamps with market data", async () => {
      // Combine stamp data with market data
      const mockRows = stampFixtures.stampsWithMarketData.map((stamp) => ({
        ...stamp,
        ...marketDataFixtures.stampMarketData.find((m) =>
          m.cpid === stamp.cpid
        ) || {},
      }));

      fixtureHelpers.mockMarketDataQuery(helper, mockRows);

      const result = await MarketDataRepository.getStampsWithMarketData({
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertEquals(Array.isArray(result), true);

      if (result.length > 0) {
        const firstStamp = result[0];
        assertExists(firstStamp.stamp);
        assertExists(firstStamp.cpid);
        if (firstStamp.marketData) {
          assertExists(firstStamp.marketData.floorPriceBTC);
        }
      }
    });

    it("should handle empty results", async () => {
      helper.mockEmpty();

      const result = await MarketDataRepository.getStampsWithMarketData({
        limit: 10,
        offset: 0,
      });

      assertEquals(result, []);
    });
  });

  describe("getSRC20MarketData", () => {
    it("should return market data for valid token", async () => {
      const mockData = marketDataFixtures.src20MarketData[0];
      fixtureHelpers.mockSrc20Query(helper, [mockData]);

      const result = await MarketDataRepository.getSRC20MarketData(
        mockData.tick,
      );

      assertExists(result);
      assertEquals(result?.tick, mockData.tick);
      assertEquals(typeof result?.floorPriceBTC, "number");
      assertEquals(typeof result?.marketCapBTC, "number");
      assertEquals(typeof result?.volume24hBTC, "number");
      assertEquals(Array.isArray(result?.exchangeSources), true);
    });

    it("should return null for non-existent token", async () => {
      helper.mockEmpty();

      const result = await MarketDataRepository.getSRC20MarketData("NOTOKEN");
      assertEquals(result, null);
    });

    it("should handle token with multiple exchange sources", async () => {
      const mockData = {
        ...marketDataFixtures.src20MarketData[0],
        exchange_sources: '["openstamp", "dispensers", "openordex"]',
      };

      fixtureHelpers.mockSrc20Query(helper, [mockData]);

      const result = await MarketDataRepository.getSRC20MarketData(
        mockData.tick,
      );
      assertExists(result);
      assertEquals(result?.exchangeSources.length, 3);
      assertEquals(result?.exchangeSources.includes("openstamp"), true);
      assertEquals(result?.exchangeSources.includes("dispensers"), true);
      assertEquals(result?.exchangeSources.includes("openordex"), true);
    });

    it("should handle token with high holder count", async () => {
      const highHolderToken = marketDataFixtures.src20MarketData.find(
        (t) => t.tick === "STAMPS",
      );

      if (highHolderToken) {
        fixtureHelpers.mockSrc20Query(helper, [highHolderToken]);

        const result = await MarketDataRepository.getSRC20MarketData(
          highHolderToken.tick,
        );
        assertExists(result);
        assertEquals(result?.holderCount > 1000, true);
      }
    });

    it("should parse decimal values correctly", async () => {
      const mockData = marketDataFixtures.src20MarketData[0];
      fixtureHelpers.mockSrc20Query(helper, [mockData]);

      const result = await MarketDataRepository.getSRC20MarketData(
        mockData.tick,
      );
      assertExists(result);

      // Check that decimal values are parsed as numbers
      assertEquals(typeof result?.priceBTC, "number");
      assertEquals(typeof result?.marketCapBTC, "number");
      assertEquals(typeof result?.volume24hBTC, "number");
      assertEquals(typeof result?.priceChange24hPercent, "number");
    });
  });

  describe("getAllSRC20MarketData", () => {
    it("should return sorted tokens by market cap", async () => {
      const mockData = marketDataFixtures.src20MarketData
        .sort((a, b) =>
          parseFloat(b.market_cap_btc) - parseFloat(a.market_cap_btc)
        );

      fixtureHelpers.mockSrc20Query(helper, mockData);

      const result = await MarketDataRepository.getAllSRC20MarketData(10);

      assertExists(result);
      assertEquals(Array.isArray(result), true);

      if (result.length > 1) {
        // Check sorting
        for (let i = 0; i < result.length - 1; i++) {
          assertEquals(
            result[i].marketCapBTC >= result[i + 1].marketCapBTC,
            true,
          );
        }
      }
    });

    it("should handle empty result set", async () => {
      helper.mockEmpty();

      const result = await MarketDataRepository.getAllSRC20MarketData(10);
      assertEquals(result, []);
    });

    it("should limit results correctly", async () => {
      const allData = marketDataFixtures.src20MarketData;

      fixtureHelpers.mockSrc20Query(helper, allData.slice(0, 5));

      const result = await MarketDataRepository.getAllSRC20MarketData(5);
      assertEquals(result.length, 5);
    });
  });

  describe("getBulkStampMarketData", () => {
    it("should return Map with market data", async () => {
      const cpids = marketDataFixtures.stampMarketData
        .slice(0, 3)
        .map((m) => m.cpid);

      fixtureHelpers.mockMarketDataQuery(
        helper,
        marketDataFixtures.stampMarketData.slice(0, 3),
      );

      const result = await MarketDataRepository.getBulkStampMarketData(cpids);

      assertInstanceOf(result, Map);
      assertEquals(result.size, 3);

      for (const cpid of cpids) {
        assertExists(result.get(cpid));
      }
    });

    it("should return empty Map for empty array", async () => {
      const result = await MarketDataRepository.getBulkStampMarketData([]);
      assertInstanceOf(result, Map);
      assertEquals(result.size, 0);
    });
  });

  describe("getStampHoldersFromCache", () => {
    it("should return sorted holder data", async () => {
      const mockHolders = marketDataFixtures.holderData;

      fixtureHelpers.mockMarketDataQuery(helper, mockHolders);

      const result = await MarketDataRepository.getStampHoldersFromCache(
        mockHolders[0].cpid,
      );

      assertExists(result);
      assertEquals(Array.isArray(result), true);

      if (result.length > 1) {
        // Check sorting by rank
        for (let i = 0; i < result.length - 1; i++) {
          assertEquals(
            result[i].rankPosition <= result[i + 1].rankPosition,
            true,
          );
        }
      }
    });

    it("should return empty array for no holders", async () => {
      helper.mockEmpty();

      const result = await MarketDataRepository.getStampHoldersFromCache(
        "NO_HOLDERS",
      );
      assertEquals(result, []);
    });
  });

  describe("getCollectionMarketData", () => {
    it("should return collection market data", async () => {
      const mockData = marketDataFixtures.collectionMarketData[0];

      fixtureHelpers.mockMarketDataQuery(helper, [mockData]);

      const result = await MarketDataRepository.getCollectionMarketData(
        mockData.collection_id,
      );

      if (result) {
        assertExists(result.collectionId);
        assertEquals(result.collectionId, mockData.collection_id);
        assertEquals(typeof result.minFloorPriceBTC, "number");
        assertEquals(typeof result.maxFloorPriceBTC, "number");
        assertEquals(typeof result.avgFloorPriceBTC, "number");
      }
    });

    it("should return null for non-existent collection", async () => {
      helper.mockEmpty();

      const result = await MarketDataRepository.getCollectionMarketData(
        "NO_COLLECTION",
      );
      assertEquals(result, null);
    });
  });
});
