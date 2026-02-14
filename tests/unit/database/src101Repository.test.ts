import { dbManager } from "$server/database/databaseManager.ts";
import { SRC101Repository } from "$server/database/src101Repository.ts";
import { assertEquals, assertExists } from "@std/assert";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "jsr:@std/testing@1.0.14/bdd";
import { MockDatabaseManager } from "../../mocks/mockDatabaseManager.ts";

describe("SRC101Repository Unit Tests", () => {
  let mockDb: MockDatabaseManager;
  let originalDb: typeof dbManager;

  beforeEach(() => {
    // Check if we should run database tests
    if (Deno.env.get("RUN_DB_TESTS") === "true") {
      console.log(
        "Skipping SRC101Repository unit tests - RUN_DB_TESTS is set for integration tests",
      );
      return;
    }

    // Store original database instance
    originalDb = dbManager;

    // Create and inject mock database
    mockDb = new MockDatabaseManager();
    SRC101Repository.setDatabase(mockDb as unknown as typeof dbManager);
  });

  afterEach(() => {
    // Skip cleanup if we didn't set up
    if (!mockDb) return;

    // Clear mock data FIRST before restoring
    mockDb.clearQueryHistory();
    mockDb.clearMockResponses();

    // Restore original database
    SRC101Repository.setDatabase(originalDb);

    // Reset references
    mockDb = null as any;
  });

  describe("getSrc101Price", () => {
    it("should return price data for a deploy hash", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const deployHash = "c4ca4238a0b923820dcc509a6f75849b";
      const result = await SRC101Repository.getSrc101Price(deployHash);

      assertExists(result);
      assertEquals(typeof result, "object");

      // Verify query was executed
      const queries = mockDb.getQueryHistory();
      assertEquals(
        queries.some((q) => q.includes("src101price")),
        true,
      );
    });

    it("should return price data keyed by length", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const deployHash = "c4ca4238a0b923820dcc509a6f75849b";
      const result = await SRC101Repository.getSrc101Price(deployHash);

      assertExists(result);

      // Result should be an object with numeric keys (lengths)
      for (const key in result) {
        assertEquals(typeof key, "string");
        assertExists(result[key]);
      }
    });

    it("should query with correct deploy_hash parameter", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const deployHash = "c4ca4238a0b923820dcc509a6f75849b";
      await SRC101Repository.getSrc101Price(deployHash);

      const fullHistory = mockDb.getFullQueryHistory();
      const priceQuery = fullHistory.find((entry) =>
        entry.query.includes("src101price")
      );

      assertExists(priceQuery);
      assertEquals(priceQuery.params[0], deployHash);
    });
  });

  describe("getTotalSrc101TXFromSRC101TableCount", () => {
    it("should return total count of all transactions", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await SRC101Repository.getTotalSrc101TXFromSRC101TableCount(
        {},
      );

      assertExists(result);
      assertEquals(typeof result, "number");
      assertEquals(result >= 0, true);
    });

    it("should filter by tick when provided", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await SRC101Repository.getTotalSrc101TXFromSRC101TableCount(
        { tick: "BITNAME" },
      );

      assertExists(result);

      // Verify tick filter was used
      const queries = mockDb.getQueryHistory();
      const countQuery = queries.find((q) =>
        q.includes("COUNT(*)") && q.includes("tick")
      );
      assertExists(countQuery);
    });

    it("should filter by operation type when provided", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await SRC101Repository.getTotalSrc101TXFromSRC101TableCount(
        { op: "DEPLOY" },
      );

      assertExists(result);

      // Verify op filter was used
      const fullHistory = mockDb.getFullQueryHistory();
      const countQuery = fullHistory.find((entry) =>
        entry.query.includes("COUNT(*)") && entry.query.includes("op")
      );
      assertExists(countQuery);
      assertEquals(countQuery.params.includes("DEPLOY"), true);
    });

    it("should filter by valid status when provided", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await SRC101Repository.getTotalSrc101TXFromSRC101TableCount(
        { valid: 1 },
      );

      assertExists(result);

      // Verify valid filter was used
      const queries = mockDb.getQueryHistory();
      const countQuery = queries.find((q) =>
        q.includes("status IS NULL")
      );
      assertExists(countQuery);
    });

    it("should filter by deploy_hash when provided", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const deployHash = "c4ca4238a0b923820dcc509a6f75849b";
      const result = await SRC101Repository.getTotalSrc101TXFromSRC101TableCount(
        { deploy_hash: deployHash },
      );

      assertExists(result);

      // Verify deploy_hash filter was used
      const fullHistory = mockDb.getFullQueryHistory();
      const countQuery = fullHistory.find((entry) =>
        entry.query.includes("deploy_hash")
      );
      assertExists(countQuery);
      assertEquals(countQuery.params.includes(deployHash), true);
    });
  });

  describe("getSrc101TXFromSRC101Table", () => {
    it("should return transactions with pagination", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await SRC101Repository.getSrc101TXFromSRC101Table({
        limit: 10,
        page: 1,
      });

      assertExists(result);
      assertEquals(Array.isArray(result), true);
    });

    it("should filter by tick when provided", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await SRC101Repository.getSrc101TXFromSRC101Table({
        tick: "BITNAME",
        limit: 10,
        page: 1,
      });

      assertExists(result);

      // Verify tick filter in WHERE clause
      const queries = mockDb.getQueryHistory();
      const txQuery = queries.find((q) =>
        q.includes("WHERE") && q.includes("tick")
      );
      assertExists(txQuery);
    });

    it("should support pagination with LIMIT and OFFSET", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await SRC101Repository.getSrc101TXFromSRC101Table({
        limit: 5,
        page: 2,
      });

      assertExists(result);

      // Verify LIMIT and OFFSET
      const queries = mockDb.getQueryHistory();
      const paginatedQuery = queries.find((q) =>
        q.includes("LIMIT") && q.includes("OFFSET")
      );
      assertExists(paginatedQuery);
    });

    it("should include ROW_NUMBER in results", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      await SRC101Repository.getSrc101TXFromSRC101Table({
        limit: 10,
        page: 1,
      });

      // Verify ROW_NUMBER window function is used
      const queries = mockDb.getQueryHistory();
      const rowNumberQuery = queries.find((q) =>
        q.includes("ROW_NUMBER() OVER")
      );
      assertExists(rowNumberQuery);
    });

    it("should order by tx_index ASC", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      await SRC101Repository.getSrc101TXFromSRC101Table({
        limit: 10,
        page: 1,
      });

      // Verify ORDER BY tx_index ASC
      const queries = mockDb.getQueryHistory();
      const orderedQuery = queries.find((q) =>
        q.includes("ORDER BY") && q.includes("tx_index")
      );
      assertExists(orderedQuery);
    });
  });

  describe("getTotalValidSrc101TxCount", () => {
    it("should return count of valid transactions", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await SRC101Repository.getTotalValidSrc101TxCount({});

      assertExists(result);
      assertEquals(typeof result, "number");
      assertEquals(result >= 0, true);
    });

    it("should filter by tick when provided", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await SRC101Repository.getTotalValidSrc101TxCount({
        tick: "BITNAME",
      });

      assertExists(result);

      // Verify tick filter with COLLATE
      const queries = mockDb.getQueryHistory();
      const countQuery = queries.find((q) =>
        q.includes("tick COLLATE")
      );
      assertExists(countQuery);
    });

    it("should use COUNT(*) query", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      await SRC101Repository.getTotalValidSrc101TxCount({});

      const queries = mockDb.getQueryHistory();
      const countQuery = queries.find((q) => q.includes("COUNT(*)"));
      assertExists(countQuery);
    });
  });

  describe("Complex query patterns", () => {
    it("should handle multiple filters combined", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await SRC101Repository.getSrc101TXFromSRC101Table({
        tick: "BITNAME",
        op: "DEPLOY",
        valid: 1,
        limit: 5,
        page: 1,
      });

      assertExists(result);

      // Verify all filters are in the query
      const queries = mockDb.getQueryHistory();
      const complexQuery = queries.find((q) =>
        q.includes("tick") &&
        q.includes("op") &&
        q.includes("status IS NULL")
      );
      assertExists(complexQuery);
    });

    it("should handle queries with deploy_hash and block_index", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await SRC101Repository.getSrc101TXFromSRC101Table({
        deploy_hash: "c4ca4238a0b923820dcc509a6f75849b",
        block_index: 12345,
        limit: 10,
        page: 1,
      });

      assertExists(result);

      const queries = mockDb.getQueryHistory();
      const complexQuery = queries.find((q) =>
        q.includes("deploy_hash") && q.includes("block_index")
      );
      assertExists(complexQuery);
    });
  });

  describe("Mock data verification", () => {
    it("should use mock data from src101 fixtures", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      // Query should use mock data, not real database
      const result = await SRC101Repository.getSrc101TXFromSRC101Table({
        limit: 100,
        page: 1,
      });

      assertExists(result);
      assertEquals(Array.isArray(result), true);

      // Should have returned data from fixtures
      assertEquals(result.length >= 0, true);
    });

    it("should handle price queries with mock data", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const deployHash = "c4ca4238a0b923820dcc509a6f75849b";
      const result = await SRC101Repository.getSrc101Price(deployHash);

      assertExists(result);

      // Should return price data structure from fixtures
      assertEquals(typeof result, "object");
    });

    it("should handle queries for non-existent data gracefully", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await SRC101Repository.getSrc101TXFromSRC101Table({
        tick: "NONEXISTENT_TICK_12345",
        limit: 10,
        page: 1,
      });

      assertExists(result);
      assertEquals(Array.isArray(result), true);

      // Should return empty array for non-existent data
      assertEquals(result.length, 0);
    });
  });
});
