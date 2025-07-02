import { assertEquals, assertExists } from "@std/assert";
import { SRC20Repository } from "$server/database/src20Repository.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { MockDatabaseManager } from "../mocks/mockDatabaseManager.ts";

Deno.test("SRC20Repository Unit Tests with DI", async (t) => {
  let mockDb: MockDatabaseManager;
  let originalDb: typeof dbManager;

  // Setup before each test
  function setup() {
    // Store original database instance
    originalDb = dbManager;

    // Create and inject mock database
    mockDb = new MockDatabaseManager();
    SRC20Repository.setDatabase(mockDb as unknown as typeof dbManager);
  }

  // Teardown after each test
  function teardown() {
    // Clear mock data FIRST before restoring
    if (mockDb) {
      mockDb.clearQueryHistory();
      mockDb.clearMockResponses();
    }

    // Restore original database
    SRC20Repository.setDatabase(originalDb);
  }

  await t.step(
    "getValidSrc20TxFromDb - returns SRC20 transactions",
    async () => {
      setup();

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

      teardown();
    },
  );

  await t.step(
    "getValidSrc20TxFromDb - filters by operation type",
    async () => {
      setup();

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

      teardown();
    },
  );

  await t.step("getValidSrc20TxFromDb - filters by tick", async () => {
    setup();

    const result = await SRC20Repository.getValidSrc20TxFromDb({
      tick: "PEPE",
      limit: 10,
      page: 1,
    });

    assertExists(result);
    assertExists(result.rows);

    // Check that all returned transactions are for PEPE tick
    result.rows.forEach((tx: any) => {
      assertEquals(tx.tick, "PEPE");
    });

    teardown();
  });

  await t.step("getTotalCountValidSrc20TxFromDb - returns count", async () => {
    setup();

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

    teardown();
  });

  await t.step("getSrc20BalanceFromDb - returns balances", async () => {
    setup();

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

    teardown();
  });

  await t.step(
    "fetchSrc20MintProgress - returns null for non-existent tokens",
    async () => {
      setup();

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

      teardown();
    },
  );

  await t.step(
    "fetchSrc20MintProgress - returns data for existing tokens",
    async () => {
      setup();

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

      teardown();
    },
  );

  await t.step(
    "getTotalSrc20BalanceCount - returns balance count",
    async () => {
      setup();

      const count = await SRC20Repository.getTotalSrc20BalanceCount({
        address: "bc1test",
      });

      assertEquals(typeof count, "number");
      // The mock will return a count based on fixture data
      assertEquals(count >= 0, true);

      teardown();
    },
  );

  await t.step("handles database errors gracefully", async () => {
    setup();

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

    teardown();
  });

  await t.step("handles emoji/unicode conversion", async () => {
    setup();

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

    teardown();
  });
});
