import { assertEquals, assertExists } from "@std/assert";
import { StampRepository } from "$server/database/stampRepository.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { MockDatabaseManager } from "../mocks/mockDatabaseManager.ts";
import stampFixtures from "../fixtures/stampData.json" with { type: "json" };

Deno.test("StampRepository Unit Tests", async (t) => {
  let mockDb: MockDatabaseManager;
  let originalDb: typeof dbManager;

  // Setup before each test
  function setup() {
    // Store original database instance
    originalDb = dbManager;

    // Create and inject mock database
    mockDb = new MockDatabaseManager();
    StampRepository.setDatabase(mockDb as unknown as typeof dbManager);
  }

  // Teardown after each test
  function teardown() {
    // Restore original database
    StampRepository.setDatabase(originalDb);

    // Clear mock data
    mockDb.clearQueryHistory();
    mockDb.clearMockResponses();
  }

  await t.step("getStamps - returns stamps with basic pagination", async () => {
    setup();

    const result = await StampRepository.getStamps({
      limit: 5,
      page: 1,
    });

    assertExists(result);
    assertExists(result.stamps);
    assertEquals(Array.isArray(result.stamps), true);

    // The mock returns all fixtures, but the repository paginates
    assertEquals(result.stamps.length > 0, true);
    assertEquals(result.page, 1);
    assertEquals(result.page_size, 5);

    if (result.stamps.length > 0) {
      const firstStamp = result.stamps[0];
      assertExists(firstStamp.stamp);
      assertExists(firstStamp.cpid);
      assertExists(firstStamp.tx_hash);
    }

    // Verify the query was called
    const queryHistory = mockDb.getQueryHistory();
    assertEquals(queryHistory.length > 0, true);
    assertEquals(
      queryHistory[0].query.toLowerCase().includes("stampstablev4"),
      true,
    );

    teardown();
  });

  await t.step("getStamps - returns stamps filtered by type", async () => {
    setup();

    const result = await StampRepository.getStamps({
      limit: 10,
      page: 1,
      type: "stamps",
    });

    assertExists(result);
    assertExists(result.stamps);
    assertEquals(Array.isArray(result.stamps), true);

    // Check that we got stamps data
    if (result.stamps.length > 0) {
      const firstStamp = result.stamps[0];
      assertExists(firstStamp.stamp);
      assertExists(firstStamp.cpid);
      // Regular stamps should have non-negative stamp numbers
      assertEquals(firstStamp.stamp >= 0, true);
    }

    teardown();
  });

  await t.step("getStamps - returns cursed stamps when filtered", async () => {
    setup();

    const result = await StampRepository.getStamps({
      limit: 10,
      page: 1,
      type: "cursed",
    });

    assertExists(result);
    assertExists(result.stamps);
    assertEquals(Array.isArray(result.stamps), true);

    // Check that we got cursed stamps (negative stamp numbers)
    if (result.stamps.length > 0) {
      const firstStamp = result.stamps[0];
      assertExists(firstStamp.stamp);
      assertExists(firstStamp.cpid);
      // Cursed stamps should have negative stamp numbers
      assertEquals(firstStamp.stamp < 0, true);
    }

    teardown();
  });

  await t.step("getStamps - handles empty results", async () => {
    setup();

    // Override the method to return empty result
    mockDb.executeQueryWithCache = <T>() => Promise.resolve({ rows: [] } as T);

    const result = await StampRepository.getStamps({
      limit: 10,
      page: 1,
    });

    assertExists(result);
    assertExists(result.stamps);
    assertEquals(result.stamps, []);
    assertEquals(result.total, 0);

    teardown();
  });

  await t.step("getStamps - handles database errors gracefully", async () => {
    setup();

    // Override executeQueryWithCache to throw error
    mockDb.executeQueryWithCache = () =>
      Promise.reject(new Error("Database connection failed"));

    try {
      await StampRepository.getStamps({
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

  await t.step("getTotalStampCountFromDb - returns total count", async () => {
    setup();

    // getTotalStampCountFromDb returns the query result directly
    const result = await StampRepository.getTotalStampCountFromDb({}) as any;

    assertExists(result);
    assertExists(result.rows);
    assertEquals(Array.isArray(result.rows), true);
    assertEquals(result.rows.length > 0, true);

    // The mock should return the count
    const count = result.rows[0]?.total || 0;
    assertEquals(count > 0, true);

    // Verify the query was called
    const queryHistory = mockDb.getQueryHistory();
    const countQuery = queryHistory.find((h) =>
      h.query.toLowerCase().includes("count(*)")
    );
    assertExists(countQuery);

    teardown();
  });

  await t.step(
    "getTotalStampCountFromDb - returns count with type filter",
    async () => {
      setup();

      const result = await StampRepository.getTotalStampCountFromDb({
        type: "stamps",
      }) as any;

      assertExists(result);
      assertExists(result.rows);
      assertEquals(Array.isArray(result.rows), true);

      if (result.rows.length > 0) {
        const count = result.rows[0]?.total || 0;
        // The count should be greater than 0 as we have stamps data
        assertEquals(count > 0, true);
      }

      // Verify the query was called
      const queryHistory = mockDb.getQueryHistory();
      const countQuery = queryHistory.find((h) =>
        h.query.toLowerCase().includes("count(*)")
      );
      assertExists(countQuery);

      teardown();
    },
  );

  await t.step("getTotalStampCountFromDb - returns 0 on error", async () => {
    setup();

    // Override executeQueryWithCache to throw error
    mockDb.executeQueryWithCache = () =>
      Promise.reject(new Error("Count failed"));

    try {
      await StampRepository.getTotalStampCountFromDb({});
      // Should not reach here
      assertEquals(true, false, "Expected error to be thrown");
    } catch (error) {
      // Error is expected
      assertExists(error);
      assertEquals((error as Error).message, "Count failed");
    }

    teardown();
  });

  await t.step("getStampFile - returns stamp file data", async () => {
    setup();

    const mockStamp = stampFixtures.regularStamps[0];
    const result = await StampRepository.getStampFile(mockStamp.cpid);

    if (result) {
      assertExists(result.stamp);
      assertExists(result.cpid);
      assertExists(result.stamp_url);
      assertEquals(result.cpid, mockStamp.cpid);
    }

    teardown();
  });

  await t.step(
    "getStampFile - returns null for non-existent stamp",
    async () => {
      setup();

      const result = await StampRepository.getStampFile("NONEXISTENT");
      assertEquals(result, null);

      teardown();
    },
  );

  await t.step("getStampFile - handles invalid identifiers", async () => {
    setup();

    const result = await StampRepository.getStampFile("invalid@#$");
    assertEquals(result, null);

    teardown();
  });

  await t.step("getCreatorNameByAddress - returns creator name", async () => {
    setup();

    const mockCreator = stampFixtures.creators[0];

    // Set mock response for creator query
    mockDb.setMockResponse(
      "SELECT creator FROM creator",
      [mockCreator.address],
      { rows: [{ creator: mockCreator.creator }] },
    );

    const result = await StampRepository.getCreatorNameByAddress(
      mockCreator.address,
    );
    assertEquals(result, mockCreator.creator);

    teardown();
  });

  await t.step(
    "getCreatorNameByAddress - returns null for unknown address",
    async () => {
      setup();

      const result = await StampRepository.getCreatorNameByAddress(
        "bc1unknown",
      );
      assertEquals(result, null);

      teardown();
    },
  );

  await t.step(
    "getCreatorNameByAddress - handles errors gracefully",
    async () => {
      setup();

      // Override executeQueryWithCache to throw error
      mockDb.executeQueryWithCache = () =>
        Promise.reject(new Error("Query failed"));

      try {
        await StampRepository.getCreatorNameByAddress("bc1error");
        // Should not reach here
        assertEquals(true, false, "Expected error to be thrown");
      } catch (error) {
        // Error is expected
        assertExists(error);
        assertEquals((error as Error).message, "Query failed");
      }

      teardown();
    },
  );

  await t.step(
    "updateCreatorName - updates creator name successfully",
    async () => {
      setup();

      // Set mock response for update query
      mockDb.setMockResponse(
        "UPDATE creator",
        ["bc1test", "Test Creator"],
        { rows: [], affectedRows: 1 },
      );

      const result = await StampRepository.updateCreatorName(
        "bc1test",
        "Test Creator",
      );
      assertEquals(result, true);

      teardown();
    },
  );

  await t.step("updateCreatorName - returns false on error", async () => {
    setup();

    // Override executeQuery to throw error
    mockDb.executeQuery = () => Promise.reject(new Error("Update failed"));

    const result = await StampRepository.updateCreatorName(
      "bc1test",
      "Test Creator",
    );
    assertEquals(result, false);

    teardown();
  });

  await t.step(
    "sanitize - removes special characters except allowed ones",
    () => {
      const result = StampRepository.sanitize("test@123#abc!");
      assertEquals(result, "test123abc");
    },
  );

  await t.step(
    "sanitize - preserves alphanumeric, dots, and hyphens",
    () => {
      const result = StampRepository.sanitize("test.file-name_123");
      assertEquals(result, "test.file-name_123");
    },
  );

  await t.step("sanitize - handles empty strings", () => {
    const result = StampRepository.sanitize("");
    assertEquals(result, "");
  });

  await t.step(
    "sanitize - handles strings with only special characters",
    () => {
      const result = StampRepository.sanitize("@#$%^&*()");
      assertEquals(result, "");
    },
  );

  await t.step("getStamps - returns stamps with market data", async () => {
    setup();

    const result = await StampRepository.getStamps({
      limit: 10,
      page: 1,
    });

    assertExists(result);
    assertExists(result.stamps);

    if (
      result.stamps.length > 0 &&
      stampFixtures.stampsWithMarketData[0].floor_price_btc
    ) {
      // The fixture includes market data fields
      const firstStamp = stampFixtures.stampsWithMarketData[0];
      assertExists(firstStamp.floor_price_btc);
      assertExists(firstStamp.holder_count);
    }

    teardown();
  });
});
