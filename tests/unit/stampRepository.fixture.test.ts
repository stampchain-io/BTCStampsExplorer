import { assertEquals, assertExists } from "@std/assert";
import { afterEach, describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import { StampRepository } from "$server/database/stampRepository.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import stampFixtures from "../fixtures/stampData.json" with { type: "json" };

describe("StampRepository Tests with Fixtures", () => {
  let queryStub: any;
  let executeQueryStub: any;

  afterEach(() => {
    if (queryStub) {
      queryStub.restore();
      queryStub = undefined;
    }
    if (executeQueryStub) {
      executeQueryStub.restore();
      executeQueryStub = undefined;
    }
  });

  describe("getStamps", () => {
    it("should return stamps with basic pagination", async () => {
      // Stub to return fixture data
      queryStub = stub(
        dbManager,
        "executeQueryWithCache",
        () => {
          // Map fixture data to match expected structure
          const mappedRows = stampFixtures.regularStamps.slice(0, 5).map(
            (stamp) => ({
              ...stamp,
              creator_name: null, // Add the joined field
            }),
          );
          return Promise.resolve({
            rows: mappedRows,
            rowCount: 5,
          });
        },
      );

      const result = await StampRepository.getStamps({
        limit: 5,
        page: 1,
      });

      assertExists(result);
      assertEquals(Array.isArray(result.stamps), true);
      assertEquals(result.stamps.length, 5);
      assertEquals(result.page, 1);
      assertEquals(result.page_size, 5);

      if (result.stamps.length > 0) {
        const firstStamp = result.stamps[0];
        assertExists(firstStamp.stamp);
        assertExists(firstStamp.cpid);
        assertExists(firstStamp.tx_hash);
      }
    });

    it("should return stamps filtered by type", async () => {
      // Return only regular stamps for "stamps" type
      queryStub = stub(
        dbManager,
        "executeQueryWithCache",
        () => {
          const mappedRows = stampFixtures.regularStamps.map((stamp) => ({
            ...stamp,
            creator_name: null,
          }));
          return Promise.resolve({
            rows: mappedRows,
            rowCount: mappedRows.length,
          });
        },
      );

      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
        type: "stamps",
      });

      assertExists(result);
      // All stamps should have positive numbers
      result.stamps.forEach((stamp) => {
        assertEquals(stamp.stamp > 0, true);
      });
    });

    it("should return cursed stamps when filtered", async () => {
      queryStub = stub(
        dbManager,
        "executeQueryWithCache",
        () => {
          const mappedRows = stampFixtures.cursedStamps.map((stamp) => ({
            ...stamp,
            creator_name: null,
          }));
          return Promise.resolve({
            rows: mappedRows,
            rowCount: mappedRows.length,
          });
        },
      );

      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
        type: "cursed",
      });

      assertExists(result);
      // All stamps should have negative numbers
      result.stamps.forEach((stamp) => {
        assertEquals(stamp.stamp < 0, true);
      });
    });

    it("should handle empty results", async () => {
      queryStub = stub(
        dbManager,
        "executeQueryWithCache",
        () => Promise.resolve({ rows: [], rowCount: 0 }),
      );

      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
      });

      assertEquals(result.stamps, []);
      assertEquals(result.page, 1);
      assertEquals(result.page_size, 10);
      assertEquals(result.total, 0);
    });

    it("should handle database errors gracefully", async () => {
      queryStub = stub(
        dbManager,
        "executeQueryWithCache",
        () => Promise.reject(new Error("Database connection failed")),
      );

      try {
        await StampRepository.getStamps({
          limit: 10,
          page: 1,
        });
        assertEquals(false, true, "Expected error to be thrown");
      } catch (error) {
        assertEquals(error.message, "Database connection failed");
      }
    });
  });

  describe("updateCreatorName", () => {
    it("should update creator name successfully", async () => {
      executeQueryStub = stub(
        dbManager,
        "executeQuery",
        () => Promise.resolve({ affectedRows: 1, rows: [], rowCount: 1 }),
      );

      const result = await StampRepository.updateCreatorName(
        "bc1test",
        "Test Creator",
      );
      assertEquals(result, true);
    });

    it("should return false on error", async () => {
      executeQueryStub = stub(
        dbManager,
        "executeQuery",
        () => Promise.reject(new Error("Update failed")),
      );

      const result = await StampRepository.updateCreatorName(
        "bc1test",
        "Test Creator",
      );
      assertEquals(result, false);
    });
  });

  describe("sanitize", () => {
    it("should remove special characters except allowed ones", () => {
      const result = StampRepository.sanitize("test@123#abc!");
      assertEquals(result, "test123abc");
    });

    it("should preserve alphanumeric, dots, and hyphens", () => {
      const result = StampRepository.sanitize("test.file-name_123");
      assertEquals(result, "test.file-name_123");
    });

    it("should handle empty strings", () => {
      const result = StampRepository.sanitize("");
      assertEquals(result, "");
    });

    it("should handle strings with only special characters", () => {
      const result = StampRepository.sanitize("@#$%^&*()");
      assertEquals(result, "");
    });
  });
});
