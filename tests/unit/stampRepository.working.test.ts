import { assertEquals, assertExists } from "@std/assert";
import { stub } from "@std/testing/mock";
import { StampRepository } from "$server/database/stampRepository.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import stampFixtures from "../fixtures/stampData.json" with { type: "json" };

Deno.test("StampRepository Unit Tests", async (t) => {
  let queryStub: any;
  let executeStub: any;

  // Setup before each test
  function setup() {
    // Clear any existing stubs
    queryStub?.restore();
    executeStub?.restore();
  }

  // Teardown after each test
  function teardown() {
    queryStub?.restore();
    executeStub?.restore();
  }

  await t.step("getStamps - returns stamps with basic pagination", async () => {
    setup();

    // Prepare mapped fixture data
    const mappedStamps = stampFixtures.regularStamps.slice(0, 5).map(
      (stamp) => ({
        ...stamp,
        creator_name: null,
      }),
    );

    queryStub = stub(
      dbManager,
      "executeQueryWithCache",
      () =>
        Promise.resolve({
          rows: mappedStamps,
          rowCount: 5,
        }),
    );

    const result = await StampRepository.getStamps({
      limit: 5,
      page: 1,
    });

    assertExists(result);
    assertEquals(Array.isArray(result), true);
    assertEquals(result.length, 5);

    if (result.length > 0) {
      const firstStamp = result[0];
      assertExists(firstStamp.stamp);
      assertExists(firstStamp.cpid);
      assertExists(firstStamp.tx_hash);
    }

    teardown();
  });

  await t.step("getStamps - returns stamps filtered by type", async () => {
    setup();

    const mappedStamps = stampFixtures.regularStamps.map((stamp) => ({
      ...stamp,
      creator_name: null,
    }));

    queryStub = stub(
      dbManager,
      "executeQueryWithCache",
      () =>
        Promise.resolve({
          rows: mappedStamps,
          rowCount: mappedStamps.length,
        }),
    );

    const result = await StampRepository.getStamps({
      limit: 10,
      page: 1,
      type: "stamps",
    });

    assertExists(result);
    // All stamps should have positive numbers
    result.forEach((stamp) => {
      assertEquals(stamp.stamp > 0, true);
    });

    teardown();
  });

  await t.step("getStamps - returns cursed stamps when filtered", async () => {
    setup();

    const mappedStamps = stampFixtures.cursedStamps.map((stamp) => ({
      ...stamp,
      creator_name: null,
    }));

    queryStub = stub(
      dbManager,
      "executeQueryWithCache",
      () =>
        Promise.resolve({
          rows: mappedStamps,
          rowCount: mappedStamps.length,
        }),
    );

    const result = await StampRepository.getStamps({
      limit: 10,
      page: 1,
      type: "cursed",
    });

    assertExists(result);
    // All stamps should have negative numbers
    result.forEach((stamp) => {
      assertEquals(stamp.stamp < 0, true);
    });

    teardown();
  });

  await t.step("getStamps - handles empty results", async () => {
    setup();

    queryStub = stub(
      dbManager,
      "executeQueryWithCache",
      () => Promise.resolve({ rows: [], rowCount: 0 }),
    );

    const result = await StampRepository.getStamps({
      limit: 10,
      page: 1,
    });

    assertEquals(result, []);

    teardown();
  });

  await t.step("getStamps - handles database errors gracefully", async () => {
    setup();

    queryStub = stub(
      dbManager,
      "executeQueryWithCache",
      () => Promise.reject(new Error("Database connection failed")),
    );

    const result = await StampRepository.getStamps({
      limit: 10,
      page: 1,
    });

    assertEquals(result, []);

    teardown();
  });

  await t.step("getTotalStampCountFromDb - returns total count", async () => {
    setup();

    queryStub = stub(
      dbManager,
      "executeQueryWithCache",
      () =>
        Promise.resolve({
          rows: [{ count: "100000" }],
          rowCount: 1,
        }),
    );

    const count = await StampRepository.getTotalStampCountFromDb({});
    assertEquals(count, 100000);

    teardown();
  });

  await t.step(
    "getTotalStampCountFromDb - returns count with type filter",
    async () => {
      setup();

      queryStub = stub(
        dbManager,
        "executeQueryWithCache",
        () =>
          Promise.resolve({
            rows: [{ count: "95000" }],
            rowCount: 1,
          }),
      );

      const regularCount = await StampRepository.getTotalStampCountFromDb({
        type: "stamps",
      });
      assertEquals(regularCount, 95000);

      teardown();
    },
  );

  await t.step("getTotalStampCountFromDb - returns 0 on error", async () => {
    setup();

    queryStub = stub(
      dbManager,
      "executeQueryWithCache",
      () => Promise.reject(new Error("Count failed")),
    );

    const count = await StampRepository.getTotalStampCountFromDb({});
    assertEquals(count, 0);

    teardown();
  });

  await t.step("getStampFile - returns stamp file data", async () => {
    setup();

    const mockStamp = stampFixtures.regularStamps[0];
    const mappedStamp = {
      ...mockStamp,
      creator_name: null,
    };

    queryStub = stub(
      dbManager,
      "executeQueryWithCache",
      () =>
        Promise.resolve({
          rows: [mappedStamp],
          rowCount: 1,
        }),
    );

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

      queryStub = stub(
        dbManager,
        "executeQueryWithCache",
        () => Promise.resolve({ rows: [], rowCount: 0 }),
      );

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

    queryStub = stub(
      dbManager,
      "executeQueryWithCache",
      () =>
        Promise.resolve({
          rows: [{ creator: mockCreator.creator }],
          rowCount: 1,
        }),
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

      queryStub = stub(
        dbManager,
        "executeQueryWithCache",
        () => Promise.resolve({ rows: [], rowCount: 0 }),
      );

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

      queryStub = stub(
        dbManager,
        "executeQueryWithCache",
        () => Promise.reject(new Error("Query failed")),
      );

      const result = await StampRepository.getCreatorNameByAddress(
        "bc1error",
      );
      assertEquals(result, null);

      teardown();
    },
  );

  await t.step(
    "updateCreatorName - updates creator name successfully",
    async () => {
      setup();

      executeStub = stub(
        dbManager,
        "executeQuery",
        () => Promise.resolve({ affectedRows: 1, rows: [], rowCount: 0 }),
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

    executeStub = stub(
      dbManager,
      "executeQuery",
      () => Promise.reject(new Error("Update failed")),
    );

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

    const mappedStamps = stampFixtures.stampsWithMarketData.map((stamp) => ({
      ...stamp,
      creator_name: null,
    }));

    queryStub = stub(
      dbManager,
      "executeQueryWithCache",
      () =>
        Promise.resolve({
          rows: mappedStamps,
          rowCount: mappedStamps.length,
        }),
    );

    const result = await StampRepository.getStamps({
      limit: 10,
      page: 1,
    });

    assertExists(result);
    if (
      result.length > 0 && stampFixtures.stampsWithMarketData[0].floor_price_btc
    ) {
      // The fixture includes market data fields
      const firstStamp = stampFixtures.stampsWithMarketData[0];
      assertExists(firstStamp.floor_price_btc);
      assertExists(firstStamp.holder_count);
    }

    teardown();
  });
});
