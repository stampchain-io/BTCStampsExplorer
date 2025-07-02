import { assertEquals, assertExists } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { returnsNext, stub } from "@std/testing/mock";
import { StampRepository } from "$server/database/stampRepository.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import stampFixtures from "../fixtures/stampData.json" with { type: "json" };

describe("StampRepository Tests with Fixtures", () => {
  beforeEach(() => {
    // Mock the database manager methods before each test
    stub(
      dbManager,
      "executeQueryWithCache",
      returnsNext([
        // First call - getStamps with basic pagination
        Promise.resolve({
          rows: stampFixtures.regularStamps.slice(0, 5).map((stamp) => ({
            ...stamp,
            creator_name: null,
          })),
          rowCount: 5,
        }),
        // Second call - getStamps filtered by type
        Promise.resolve({
          rows: stampFixtures.regularStamps.map((stamp) => ({
            ...stamp,
            creator_name: null,
          })),
          rowCount: stampFixtures.regularStamps.length,
        }),
        // Third call - cursed stamps
        Promise.resolve({
          rows: stampFixtures.cursedStamps.map((stamp) => ({
            ...stamp,
            creator_name: null,
          })),
          rowCount: stampFixtures.cursedStamps.length,
        }),
        // Fourth call - empty results
        Promise.resolve({ rows: [], rowCount: 0 }),
        // Fifth call - error case
        Promise.reject(new Error("Database connection failed")),
      ]),
    );

    stub(
      dbManager,
      "executeQuery",
      returnsNext([
        // For updateCreatorName success
        Promise.resolve({ affectedRows: 1, rows: [], rowCount: 0 }),
        // For updateCreatorName error
        Promise.reject(new Error("Update failed")),
      ]),
    );
  });

  afterEach(() => {
    // Restore all stubs
    (dbManager.executeQueryWithCache as any).restore?.();
    (dbManager.executeQuery as any).restore?.();
  });

  describe("getStamps", () => {
    it("should return stamps with basic pagination", async () => {
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
    });

    it("should return stamps filtered by type", async () => {
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
    });

    it("should return cursed stamps when filtered", async () => {
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
    });

    it("should handle empty results", async () => {
      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
      });

      assertEquals(result, []);
    });

    it("should handle database errors gracefully", async () => {
      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
      });

      assertEquals(result, []);
    });
  });

  describe("updateCreatorName", () => {
    it("should update creator name successfully", async () => {
      const result = await StampRepository.updateCreatorName(
        "bc1test",
        "Test Creator",
      );
      assertEquals(result, true);
    });

    it("should return false on error", async () => {
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
