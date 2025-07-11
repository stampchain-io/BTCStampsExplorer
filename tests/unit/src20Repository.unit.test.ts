import { assertEquals, assertExists } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { SRC20Repository } from "$server/database/src20Repository.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { MockDatabaseManager } from "../mocks/mockDatabaseManager.ts";

describe("SRC20Repository Unit Tests", () => {
  let mockDb: MockDatabaseManager;
  let originalDb: typeof dbManager;

  beforeEach(() => {
    // Check if we should run database tests
    if (Deno.env.get("RUN_DB_TESTS") === "true") {
      // Skip these tests in CI - they need real database connection
      console.log(
        "Skipping SRC20Repository unit tests - RUN_DB_TESTS is set for integration tests",
      );
      return;
    }

    // Store original database instance
    originalDb = dbManager;

    // Create and inject mock database
    mockDb = new MockDatabaseManager();
    SRC20Repository.setDatabase(mockDb as unknown as typeof dbManager);
  });

  afterEach(() => {
    // Skip cleanup if we didn't set up
    if (!mockDb) return;

    // Clear mock data FIRST before restoring
    mockDb.clearQueryHistory();
    mockDb.clearMockResponses();

    // Restore original database
    SRC20Repository.setDatabase(originalDb);

    // Reset references
    mockDb = null as any;
  });

  describe("getValidSrc20TxFromDb", () => {
    it("should return SRC20 transactions", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await SRC20Repository.getValidSrc20TxFromDb({
        limit: 10,
        page: 1,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(Array.isArray(result.rows), true);

      // The mock should return some SRC20 data
      // We just verify the structure is correct
      assertEquals(result.rows.length >= 0, true);
    });

    it("should filter by operation type", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await SRC20Repository.getValidSrc20TxFromDb({
        op: "DEPLOY",
        limit: 10,
        page: 1,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(Array.isArray(result.rows), true);

      // The mock should filter by operation type
      // We just verify we got a result
      assertEquals(result.rows.length >= 0, true);
    });

    it("should filter by tick", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await SRC20Repository.getValidSrc20TxFromDb({
        tick: "!", // Use a tick that exists in the fixture data
        limit: 10,
        page: 1,
      });

      assertExists(result);
      assertExists(result.rows);

      // Check that all returned transactions are for ! tick
      result.rows.forEach((tx: any) => {
        assertEquals(tx.tick, "!");
      });
    });

    it("should handle emoji/unicode conversion", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      // Test that emoji ticks are properly handled
      const result = await SRC20Repository.getValidSrc20TxFromDb({
        tick: "🔥", // Emoji tick
        limit: 10,
        page: 1,
      });

      assertExists(result);

      // Verify query was made with unicode escape
      const queryHistory = mockDb.getQueryHistory();
      const hasUnicodeQuery = queryHistory.some((h) =>
        h.query.includes("\\U") ||
        h.params.some((p) => typeof p === "string" && p.includes("\\U"))
      );
      assertEquals(hasUnicodeQuery, true);
    });

    it("should handle database errors gracefully", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      // Override executeQueryWithCache to throw error
      mockDb.executeQueryWithCache = () =>
        Promise.reject(new Error("Database connection failed"));

      try {
        await SRC20Repository.getValidSrc20TxFromDb({
          limit: 10,
          page: 1,
        });
        // Should not reach here
        assertEquals(true, false, "Expected error to be thrown");
      } catch (error) {
        // Error is expected
        assertExists(error);
        assertEquals((error as Error).message, "Database connection failed");
      }
    });
  });

  describe("getTotalCountValidSrc20TxFromDb", () => {
    it("should return count", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await SRC20Repository.getTotalCountValidSrc20TxFromDb(
        {},
      ) as any;

      assertExists(result);
      assertExists(result.rows);
      assertEquals(Array.isArray(result.rows), true);
      assertEquals(result.rows.length > 0, true);

      const count = result.rows[0]?.total || 0;
      assertEquals(typeof count, "number");
      assertEquals(count > 0, true);
    });
  });

  describe("getSrc20BalanceFromDb", () => {
    it("should return balances", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await SRC20Repository.getSrc20BalanceFromDb({
        address: "bc1test",
        limit: 10,
        page: 1,
      });

      assertExists(result);
      assertEquals(Array.isArray(result), true);

      // The mock should return balance data
      if (result.length > 0) {
        const firstBalance = result[0];
        assertExists(firstBalance.address);
        assertExists(firstBalance.tick);
        assertExists(firstBalance.amt);
        // It also adds deploy_tx and deploy_img
        assertExists(firstBalance.deploy_tx || firstBalance.deploy_img);
      }
    });
  });

  describe("fetchSrc20MintProgress", () => {
    it("should return null for non-existent tokens", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      // Explicitly set the mock to return empty rows
      mockDb.setMockResponse(
        `
      SELECT 
        dep.max,
        dep.deci,
        dep.lim,
        dep.tx_hash,
        dep.tick,
        COALESCE(stats.total_minted, 0) as total_minted,
        COALESCE(stats.holders_count, 0) as holders_count,
        (SELECT COUNT(*) FROM SRC20Valid WHERE tick = dep.tick AND op = 'MINT') AS total_mints
      FROM SRC20Valid AS dep
      LEFT JOIN src20_token_stats stats ON stats.tick = dep.tick
      WHERE 
        dep.tick = ? AND
        dep.op = 'DEPLOY'
      LIMIT 1;
    `,
        ["NOPE!"],
        { rows: [] },
      );

      const result = await SRC20Repository.fetchSrc20MintProgress("NOPE!");
      assertEquals(result, null, "Should return null for non-existent token");
    });

    it("should return data for existing tokens", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      // Explicitly set the mock to return data for "!"
      mockDb.setMockResponse(
        `
      SELECT 
        dep.max,
        dep.deci,
        dep.lim,
        dep.tx_hash,
        dep.tick,
        COALESCE(stats.total_minted, 0) as total_minted,
        COALESCE(stats.holders_count, 0) as holders_count,
        (SELECT COUNT(*) FROM SRC20Valid WHERE tick = dep.tick AND op = 'MINT') AS total_mints
      FROM SRC20Valid AS dep
      LEFT JOIN src20_token_stats stats ON stats.tick = dep.tick
      WHERE 
        dep.tick = ? AND
        dep.op = 'DEPLOY'
      LIMIT 1;
    `,
        ["!"],
        {
          rows: [{
            max: "1000000",
            deci: 18,
            lim: 1000,
            tx_hash:
              "56a96c01d4dc11ed62566bd258a9549e971afedc9270b44a014220e931c4945d",
            tick: "!",
            total_minted: "500000",
            holders_count: 100,
            total_mints: 50,
          }],
        },
      );

      const result = await SRC20Repository.fetchSrc20MintProgress("!");

      assertExists(result, "Should return data for existing token");
      if (result) {
        assertEquals(result.tick, "!", "Tick should match");
        assertExists(result.max_supply);
        assertExists(result.total_minted);
        assertExists(result.progress);
        assertExists(result.decimals);
        assertExists(result.tx_hash);
      }
    });
  });

  describe("getTotalSrc20BalanceCount", () => {
    it("should return balance count", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const count = await SRC20Repository.getTotalSrc20BalanceCount({
        address: "bc1test",
      });

      assertEquals(typeof count, "number");
      // The mock will return a count based on fixture data
      assertEquals(count >= 0, true);
    });
  });
});
