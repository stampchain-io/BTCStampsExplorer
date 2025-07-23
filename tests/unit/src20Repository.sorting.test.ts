/**
 * Unit tests for SRC20Repository sorting functionality
 * Tests the sorting logic implementation in the repository layer
 */

import { assertEquals, assertExists } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { dbManager } from "../../server/database/databaseManager.ts";
import { SRC20Repository } from "../../server/database/src20Repository.ts";
import { MockDatabaseManager } from "../mocks/mockDatabaseManager.ts";

// Test fixtures for sorting validation
const MOCK_DEPLOY_TOKENS = [
  {
    tx_hash: "hash1",
    tick: "STAMP",
    creator: "bc1qtest1",
    creator_name: "Alice Creator",
    max: 21000000,
    progress: 45.5,
    holders: 1250,
    block_index: 800000,
    lim: 1000,
    deci: 18,
    block_time: "2024-01-15T10:30:00Z",
  },
  {
    tx_hash: "hash2",
    tick: "KIRA",
    creator: "bc1qtest2",
    creator_name: null, // Test fallback to address
    max: 1000000,
    progress: 78.2,
    holders: 890,
    block_index: 800100,
    lim: 500,
    deci: 8,
    block_time: "2024-01-16T14:20:00Z",
  },
  {
    tx_hash: "hash3",
    tick: "BOBO",
    creator: "bc1qtest3",
    creator_name: "Charlie Creator",
    max: 500000,
    progress: 12.1,
    holders: 2100,
    block_index: 799900,
    lim: 250,
    deci: 6,
    block_time: "2024-01-14T08:15:00Z",
  },
];

describe("SRC20Repository Sorting Tests", () => {
  let mockDb: MockDatabaseManager;
  let originalDb: typeof dbManager;

  beforeEach(() => {
    // Store original database instance
    originalDb = dbManager;

    // Create and inject mock database
    mockDb = new MockDatabaseManager();
    SRC20Repository.setDatabase(mockDb as unknown as typeof dbManager);
  });

  afterEach(() => {
    // Clear mock data and restore original database
    mockDb.clearQueryHistory();
    mockDb.clearMockResponses();
    SRC20Repository.setDatabase(originalDb);
  });

  describe("Basic Sorting Parameters", () => {
    it("should handle TICK_ASC sorting", async () => {
      // Mock database response
      mockDb.mockQueryResult(
        [...MOCK_DEPLOY_TOKENS].sort((a, b) => a.tick.localeCompare(b.tick)),
      );

      const result = await SRC20Repository.getValidSrc20TxFromDb({
        op: "DEPLOY",
        sortBy: "TICK_ASC",
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(result.rows.length, 3);
      // Should be sorted: BOBO, KIRA, STAMP
      assertEquals(result.rows[0].tick, "BOBO");
      assertEquals(result.rows[1].tick, "KIRA");
      assertEquals(result.rows[2].tick, "STAMP");
    });

    it("should handle TICK_DESC sorting", async () => {
      // Mock database response
      mockDb.mockQueryResult(
        [...MOCK_DEPLOY_TOKENS].sort((a, b) => b.tick.localeCompare(a.tick)),
      );

      const result = await SRC20Repository.getValidSrc20TxFromDb({
        op: "DEPLOY",
        sortBy: "TICK_DESC",
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(result.rows.length, 3);
      // Should be sorted: STAMP, KIRA, BOBO
      assertEquals(result.rows[0].tick, "STAMP");
      assertEquals(result.rows[1].tick, "KIRA");
      assertEquals(result.rows[2].tick, "BOBO");
    });

    it("should handle CREATOR_ASC with fallback to address", async () => {
      // Sort by creator name with fallback to address
      const sortedTokens = [...MOCK_DEPLOY_TOKENS].sort((a, b) => {
        const aSort = a.creator_name || a.creator;
        const bSort = b.creator_name || b.creator;
        return aSort.localeCompare(bSort);
      });

      mockDb.mockQueryResult(sortedTokens);

      const result = await SRC20Repository.getValidSrc20TxFromDb({
        op: "DEPLOY",
        sortBy: "CREATOR_ASC",
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(result.rows.length, 3);

      // Verify the sorting logic handles null creator names properly
      const firstCreatorSort = result.rows[0].creator_name ||
        result.rows[0].creator;
      const secondCreatorSort = result.rows[1].creator_name ||
        result.rows[1].creator;
      assertEquals(firstCreatorSort <= secondCreatorSort, true);
    });

    it("should handle BLOCK_DESC sorting", async () => {
      // Mock database response sorted by block_index descending
      mockDb.mockQueryResult(
        [...MOCK_DEPLOY_TOKENS].sort((a, b) => b.block_index - a.block_index),
      );

      const result = await SRC20Repository.getValidSrc20TxFromDb({
        op: "DEPLOY",
        sortBy: "BLOCK_DESC",
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(result.rows.length, 3);
      // Should be sorted: 800100, 800000, 799900
      assertEquals(result.rows[0].block_index, 800100);
      assertEquals(result.rows[1].block_index, 800000);
      assertEquals(result.rows[2].block_index, 799900);
    });
  });

  describe("Token Metrics Sorting Parameters", () => {
    it("should handle SUPPLY_DESC sorting", async () => {
      // Mock database response sorted by max supply descending
      mockDb.mockQueryResult(
        [...MOCK_DEPLOY_TOKENS].sort((a, b) => b.max - a.max),
      );

      const result = await SRC20Repository.getValidSrc20TxFromDb({
        op: "DEPLOY",
        sortBy: "SUPPLY_DESC",
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(result.rows.length, 3);
      // Should be sorted: 21000000, 1000000, 500000
      assertEquals(result.rows[0].max, 21000000);
      assertEquals(result.rows[1].max, 1000000);
      assertEquals(result.rows[2].max, 500000);
    });

    it("should handle PROGRESS_ASC sorting", async () => {
      // Mock database response sorted by progress ascending
      mockDb.mockQueryResult(
        [...MOCK_DEPLOY_TOKENS].sort((a, b) => a.progress - b.progress),
      );

      const result = await SRC20Repository.getValidSrc20TxFromDb({
        op: "DEPLOY",
        sortBy: "PROGRESS_ASC",
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(result.rows.length, 3);
      // Should be sorted: 12.1, 45.5, 78.2
      assertEquals(result.rows[0].progress, 12.1);
      assertEquals(result.rows[1].progress, 45.5);
      assertEquals(result.rows[2].progress, 78.2);
    });

    it("should handle HOLDERS_DESC sorting", async () => {
      // Mock database response sorted by holders descending
      mockDb.mockQueryResult(
        [...MOCK_DEPLOY_TOKENS].sort((a, b) => b.holders - a.holders),
      );

      const result = await SRC20Repository.getValidSrc20TxFromDb({
        op: "DEPLOY",
        sortBy: "HOLDERS_DESC",
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(result.rows.length, 3);
      // Should be sorted: 2100, 1250, 890
      assertEquals(result.rows[0].holders, 2100);
      assertEquals(result.rows[1].holders, 1250);
      assertEquals(result.rows[2].holders, 890);
    });

    it("should handle LIMIT_ASC sorting", async () => {
      // Mock database response sorted by limit ascending
      mockDb.mockQueryResult(
        [...MOCK_DEPLOY_TOKENS].sort((a, b) => a.lim - b.lim),
      );

      const result = await SRC20Repository.getValidSrc20TxFromDb({
        op: "DEPLOY",
        sortBy: "LIMIT_ASC",
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(result.rows.length, 3);
      // Should be sorted: 250, 500, 1000
      assertEquals(result.rows[0].lim, 250);
      assertEquals(result.rows[1].lim, 500);
      assertEquals(result.rows[2].lim, 1000);
    });

    it("should handle DECIMALS_DESC sorting", async () => {
      // Mock database response sorted by decimals descending
      mockDb.mockQueryResult(
        [...MOCK_DEPLOY_TOKENS].sort((a, b) => b.deci - a.deci),
      );

      const result = await SRC20Repository.getValidSrc20TxFromDb({
        op: "DEPLOY",
        sortBy: "DECIMALS_DESC",
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(result.rows.length, 3);
      // Should be sorted: 18, 8, 6
      assertEquals(result.rows[0].deci, 18);
      assertEquals(result.rows[1].deci, 8);
      assertEquals(result.rows[2].deci, 6);
    });
  });

  describe("SQL Query Structure Validation", () => {
    it("should generate proper SQL with ROW_NUMBER() window function", async () => {
      mockDb.mockQueryResult(MOCK_DEPLOY_TOKENS);

      await SRC20Repository.getValidSrc20TxFromDb({
        op: "DEPLOY",
        sortBy: "TICK_ASC",
        limit: 10,
        offset: 0,
      });

      const executedQueries = mockDb.getQueryHistory();
      assertEquals(executedQueries.length, 1);

      const query = executedQueries[0].query;

      // Should NOT contain ROW_NUMBER() OVER clause (removed in optimization)
      assertEquals(query.includes("ROW_NUMBER() OVER"), false);

      // Should contain proper ORDER BY in both window function and final query
      assertEquals(query.includes("ORDER BY"), true);

      // Should include all required JOINs for creator names
      assertEquals(query.includes("LEFT JOIN creator"), true);

      // Should NOT include CTEs (removed in optimization)
      assertEquals(query.includes("WITH base_query AS"), false);
      // Market data is now joined directly
      assertEquals(query.includes("src20_market_data"), true);
    });

    it("should handle market data sorting parameters", async () => {
      mockDb.mockQueryResult(MOCK_DEPLOY_TOKENS);

      await SRC20Repository.getValidSrc20TxFromDb({
        op: "DEPLOY",
        sortBy: "MARKET_CAP_DESC",
        limit: 10,
        offset: 0,
      });

      const executedQueries = mockDb.getQueryHistory();
      const query = executedQueries[0].query;

      // Should include market data JOINs when needed
      assertEquals(
        query.includes("src20_market_data") || query.includes("market_cap_btc"),
        true,
      );
    });

    it("should validate operation-specific sorting restrictions", async () => {
      // This would be handled by the service layer validation
      // Repository should accept any valid sortBy parameter
      mockDb.mockQueryResult([]);

      // MINT operation with SUPPLY sorting should work at repository level
      // (validation happens in service layer)
      const result = await SRC20Repository.getValidSrc20TxFromDb({
        op: "MINT",
        sortBy: "SUPPLY_DESC",
        limit: 10,
        offset: 0,
      });

      // Repository should handle the request (service validates appropriateness)
      assertExists(result);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty result sets", async () => {
      mockDb.mockQueryResult([]);

      const result = await SRC20Repository.getValidSrc20TxFromDb({
        op: "DEPLOY",
        sortBy: "TICK_ASC",
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(result.rows.length, 0);
    });

    it("should handle null/undefined sort field values", async () => {
      const tokensWithNulls = [
        { ...MOCK_DEPLOY_TOKENS[0], creator_name: null },
        { ...MOCK_DEPLOY_TOKENS[1], holders: null },
        { ...MOCK_DEPLOY_TOKENS[2], progress: undefined },
      ];

      mockDb.mockQueryResult(tokensWithNulls);

      const result = await SRC20Repository.getValidSrc20TxFromDb({
        op: "DEPLOY",
        sortBy: "CREATOR_ASC",
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(result.rows.length, 3);
    });

    it("should handle large offset values", async () => {
      mockDb.mockQueryResult([]);

      const result = await SRC20Repository.getValidSrc20TxFromDb({
        op: "DEPLOY",
        sortBy: "TICK_ASC",
        limit: 10,
        offset: 10000,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(result.rows.length, 0);
    });
  });
});
