import { dbManager } from "$server/database/databaseManager.ts";
import { MarketDataRepository } from "$server/database/marketDataRepository.ts";
import { assertEquals, assertExists } from "@std/assert";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "jsr:@std/testing@1.0.14/bdd";
import { MockDatabaseManager } from "../../mocks/mockDatabaseManager.ts";

describe("MarketDataRepository Unit Tests", () => {
  let mockDb: MockDatabaseManager;
  let originalDb: typeof dbManager;

  beforeEach(() => {
    // Check if we should run database tests
    if (Deno.env.get("RUN_DB_TESTS") === "true") {
      // Skip these tests in CI - they need real database connection
      console.log(
        "Skipping MarketDataRepository unit tests - RUN_DB_TESTS is set for integration tests",
      );
      return;
    }

    // Store original database instance
    originalDb = dbManager;

    // Create and inject mock database
    mockDb = new MockDatabaseManager();
    MarketDataRepository.setDatabase(mockDb as unknown as typeof dbManager);
  });

  afterEach(() => {
    // Skip cleanup if we didn't set up
    if (!mockDb) return;

    // Clear mock data FIRST before restoring
    mockDb.clearQueryHistory();
    mockDb.clearMockResponses();

    // Restore original database
    MarketDataRepository.setDatabase(originalDb);

    // Reset references
    mockDb = null as any;
  });

  describe("getStampMarketData", () => {
    it("should return market data for a stamp by CPID or null", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await MarketDataRepository.getStampMarketData(
        "A123456789012345678901234567890",
      );

      // Result can be null for non-existent stamps or an object with market data
      if (result !== null) {
        assertEquals(typeof result, "object");
      }

      // Verify the query was executed
      const queries = mockDb.getQueryHistory();
      assertEquals(
        queries.some((q) => q.includes("stamp_market_data")),
        true,
      );
    });

    it("should return null for non-existent stamp", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await MarketDataRepository.getStampMarketData(
        "NONEXISTENT",
      );

      // Should return null for non-existent stamps
      assertEquals(result, null);
    });

    it("should include cache age in query", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      await MarketDataRepository.getStampMarketData(
        "A123456789012345678901234567890",
      );

      const queries = mockDb.getQueryHistory();
      const marketDataQuery = queries.find((q) =>
        q.includes("stamp_market_data")
      );

      assertExists(marketDataQuery);
      assertEquals(marketDataQuery.includes("cache_age_minutes"), true);
      assertEquals(marketDataQuery.includes("TIMESTAMPDIFF"), true);
    });
  });

  describe("getStampsWithMarketData", () => {
    it("should return stamps with market data using JOIN", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await MarketDataRepository.getStampsWithMarketData({
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertEquals(Array.isArray(result), true);

      // Verify JOIN query was executed
      const queries = mockDb.getQueryHistory();
      const joinQuery = queries.find((q) =>
        q.includes("LEFT JOIN stamp_market_data")
      );
      assertExists(joinQuery);
    });

    it("should support pagination with LIMIT and OFFSET", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await MarketDataRepository.getStampsWithMarketData({
        limit: 5,
        offset: 10,
      });

      assertExists(result);
      assertEquals(Array.isArray(result), true);

      // Verify pagination params were used
      const fullHistory = mockDb.getFullQueryHistory();
      const paginatedQuery = fullHistory.find((entry) =>
        entry.query.includes("LIMIT") && entry.query.includes("OFFSET")
      );

      assertExists(paginatedQuery);
      assertEquals(paginatedQuery.params.includes(5), true);
      assertEquals(paginatedQuery.params.includes(10), true);
    });

    it("should filter by collection ID when provided", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const collectionId = "1234567890ABCDEF1234567890ABCDEF";

      const result = await MarketDataRepository.getStampsWithMarketData({
        collectionId,
        limit: 10,
        offset: 0,
      });

      assertExists(result);

      // Verify collection JOIN was added
      const queries = mockDb.getQueryHistory();
      const collectionQuery = queries.find((q) =>
        q.includes("JOIN collection_stamps")
      );
      assertExists(collectionQuery);
      assertEquals(collectionQuery.includes("collection_id = UNHEX(?)"), true);
    });

    it("should support sorting by different fields", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await MarketDataRepository.getStampsWithMarketData({
        sortBy: "stamp",
        sortOrder: "ASC",
        limit: 10,
      });

      assertExists(result);

      const queries = mockDb.getQueryHistory();
      const sortedQuery = queries.find((q) =>
        q.includes("ORDER BY st.stamp ASC")
      );
      assertExists(sortedQuery);
    });
  });

  describe("getSRC20MarketData", () => {
    it("should return market data for SRC-20 token by tick or null", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await MarketDataRepository.getSRC20MarketData("KEVIN");

      // Result can be null for non-existent tokens or an object with market data
      if (result !== null) {
        assertExists(result);
      }

      // Verify query was executed
      const queries = mockDb.getQueryHistory();
      assertEquals(
        queries.some((q) => q.includes("src20_market_data")),
        true,
      );
    });

    it("should return null for non-existent token", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await MarketDataRepository.getSRC20MarketData(
        "NONEXISTENT",
      );

      assertEquals(result, null);
    });

    it("should include cache age calculation", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      await MarketDataRepository.getSRC20MarketData("KEVIN");

      const queries = mockDb.getQueryHistory();
      const marketDataQuery = queries.find((q) =>
        q.includes("src20_market_data")
      );

      assertExists(marketDataQuery);
      assertEquals(marketDataQuery.includes("cache_age_minutes"), true);
    });
  });

  describe("getSRC20MarketDataBatch", () => {
    it("should fetch multiple tokens in a single query", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const ticks = ["KEVIN", "STAMP", "PEPE"];
      const result = await MarketDataRepository.getSRC20MarketDataBatch(ticks);

      assertExists(result);
      assertEquals(result instanceof Map, true);

      // Verify IN clause was used
      const queries = mockDb.getQueryHistory();
      const batchQuery = queries.find((q) => q.includes("tick IN"));
      assertExists(batchQuery);
    });

    it("should return empty map for empty array", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await MarketDataRepository.getSRC20MarketDataBatch([]);

      assertEquals(result instanceof Map, true);
      assertEquals(result.size, 0);
    });

    it("should map results by tick", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const ticks = ["KEVIN", "STAMP"];
      const result = await MarketDataRepository.getSRC20MarketDataBatch(ticks);

      assertExists(result);
      assertEquals(result instanceof Map, true);

      // Each entry should be keyed by tick
      for (const [tick, data] of result.entries()) {
        assertEquals(typeof tick, "string");
        assertExists(data);
        assertEquals(data.tick, tick);
      }
    });
  });

  describe("getCollectionMarketData", () => {
    it("should return market data for collection by ID or null", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const collectionId = "1234567890ABCDEF1234567890ABCDEF";
      const result = await MarketDataRepository.getCollectionMarketData(
        collectionId,
      );

      // Result can be null for non-existent collections or an object with market data
      if (result !== null) {
        assertExists(result);
      }

      // Verify query was executed
      const queries = mockDb.getQueryHistory();
      const collectionQuery = queries.find((q) =>
        q.includes("collection_market_data")
      );
      assertExists(collectionQuery);
      assertEquals(collectionQuery.includes("UNHEX(?)"), true);
    });

    it("should return null for non-existent collection", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await MarketDataRepository.getCollectionMarketData(
        "NONEXISTENT",
      );

      assertEquals(result, null);
    });

    it("should use HEX() to convert binary collection_id", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      await MarketDataRepository.getCollectionMarketData(
        "1234567890ABCDEF1234567890ABCDEF",
      );

      const queries = mockDb.getQueryHistory();
      const hexQuery = queries.find((q) =>
        q.includes("HEX(collection_id)")
      );
      assertExists(hexQuery);
    });
  });

  describe("getStampHoldersFromCache", () => {
    it("should return holder data ordered by rank", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await MarketDataRepository.getStampHoldersFromCache(
        "A123456789012345678901234567890",
      );

      assertExists(result);
      assertEquals(Array.isArray(result), true);

      // Verify ORDER BY rank_position was used
      const queries = mockDb.getQueryHistory();
      const holderQuery = queries.find((q) =>
        q.includes("stamp_holder_cache")
      );
      assertExists(holderQuery);
      assertEquals(holderQuery.includes("ORDER BY rank_position"), true);
    });

    it("should return empty array for stamps with no holders", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await MarketDataRepository.getStampHoldersFromCache(
        "NONEXISTENT",
      );

      assertEquals(Array.isArray(result), true);
      assertEquals(result.length, 0);
    });
  });

  describe("getBulkStampMarketData", () => {
    it("should fetch market data for multiple stamps", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const cpids = [
        "A123456789012345678901234567890",
        "A987654321098765432109876543210",
      ];

      const result = await MarketDataRepository.getBulkStampMarketData(cpids);

      assertExists(result);
      assertEquals(result instanceof Map, true);

      // Verify IN clause was used
      const queries = mockDb.getQueryHistory();
      const bulkQuery = queries.find((q) => q.includes("cpid IN"));
      assertExists(bulkQuery);
    });

    it("should return empty map for empty array", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await MarketDataRepository.getBulkStampMarketData([]);

      assertEquals(result instanceof Map, true);
      assertEquals(result.size, 0);
    });
  });

  describe("getAllSRC20MarketData", () => {
    it("should return all tokens sorted by market cap", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await MarketDataRepository.getAllSRC20MarketData(100);

      assertExists(result);
      assertEquals(Array.isArray(result), true);

      // Verify ORDER BY market_cap_btc DESC
      const queries = mockDb.getQueryHistory();
      const sortedQuery = queries.find((q) =>
        q.includes("ORDER BY") && q.includes("market_cap_btc")
      );
      assertExists(sortedQuery);
      assertEquals(sortedQuery.includes("DESC"), true);
    });

    it("should respect limit parameter", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const limit = 50;
      await MarketDataRepository.getAllSRC20MarketData(limit);

      const fullHistory = mockDb.getFullQueryHistory();
      const limitQuery = fullHistory.find((entry) =>
        entry.query.includes("LIMIT")
      );

      assertExists(limitQuery);
      assertEquals(limitQuery.params.includes(limit), true);
    });
  });

  describe("getPaginatedSRC20MarketData", () => {
    it("should return paginated results with metadata", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await MarketDataRepository.getPaginatedSRC20MarketData({
        limit: 10,
        page: 1,
      });

      assertExists(result);
      assertExists(result.data);
      assertExists(result.total);
      assertExists(result.page);
      assertExists(result.limit);
      assertExists(result.totalPages);

      assertEquals(Array.isArray(result.data), true);
      assertEquals(result.page, 1);
      assertEquals(result.limit, 10);
    });

    it("should execute COUNT query for total", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      await MarketDataRepository.getPaginatedSRC20MarketData({
        limit: 10,
        page: 2,
      });

      // Should execute both COUNT and data queries
      const queries = mockDb.getQueryHistory();
      const countQuery = queries.find((q) =>
        q.includes("COUNT(*)") && q.includes("src20_market_data")
      );
      assertExists(countQuery);
    });

    it("should support custom sorting", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      await MarketDataRepository.getPaginatedSRC20MarketData({
        limit: 10,
        page: 1,
        sortBy: "volume_24h_btc",
        sortOrder: "ASC",
      });

      const queries = mockDb.getQueryHistory();
      const sortedQuery = queries.find((q) =>
        q.includes("volume_24h_btc") && q.includes("ASC")
      );
      assertExists(sortedQuery);
    });

    it("should calculate correct offset for page 2", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const limit = 10;
      const page = 2;

      await MarketDataRepository.getPaginatedSRC20MarketData({
        limit,
        page,
      });

      const fullHistory = mockDb.getFullQueryHistory();
      const paginatedQuery = fullHistory.find((entry) =>
        entry.query.includes("LIMIT") && entry.query.includes("OFFSET")
      );

      assertExists(paginatedQuery);
      // Offset should be (page - 1) * limit = 10
      assertEquals(paginatedQuery.params.includes(10), true); // offset
      assertEquals(paginatedQuery.params.includes(limit), true);
    });

    it("should filter by price > 0", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      await MarketDataRepository.getPaginatedSRC20MarketData({
        limit: 10,
        page: 1,
      });

      const queries = mockDb.getQueryHistory();
      const filteredQuery = queries.find((q) =>
        q.includes("WHERE price_btc > 0")
      );
      assertExists(filteredQuery);
    });
  });
});
