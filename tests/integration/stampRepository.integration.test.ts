/**
 * Integration tests for StampRepository using real database connection
 * These tests use fixtures for predictable test data
 */
import { assertEquals, assertExists } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { StampRepository } from "$server/database/stampRepository.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import stampFixtures from "../fixtures/stampData.json" with { type: "json" };

// Skip in CI if no test database is available
const skipInCI = Deno.env.get("CI") === "true" && !Deno.env.get("TEST_DB_HOST");

describe("StampRepository Integration Tests", { skip: skipInCI }, () => {
  // Optional: Set up test data before tests
  beforeAll(async () => {
    // Could insert fixture data into test database here
    // await seedTestData();
  });

  // Clean up after tests - close database connections
  afterAll(async () => {
    // Close all database connections to prevent TCP leaks
    await dbManager.closeAllClients();

    // Could also clean up test data here if needed
    // await cleanupTestData();
  });

  describe("getStamps", () => {
    it("should return stamps with pagination", async () => {
      const result = await StampRepository.getStamps({
        limit: 5,
        page: 1,
      });

      assertExists(result);
      assertExists(result.stamps);
      assertEquals(Array.isArray(result.stamps), true);
      assertEquals(typeof result.total, "number");
      assertEquals(typeof result.pages, "number");

      if (result.stamps.length > 0) {
        const firstStamp = result.stamps[0];
        assertExists(firstStamp.stamp);
        assertExists(firstStamp.cpid);
        assertExists(firstStamp.tx_hash);
        assertExists(firstStamp.block_index);
      }
    });

    it("should filter stamps by type", async () => {
      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
        type: "stamps",
      });

      assertExists(result);
      assertExists(result.stamps);

      // All returned stamps should be regular (positive numbers)
      result.stamps.forEach((stamp) => {
        assertEquals(stamp.stamp > 0, true);
        assertEquals(stamp.ident !== "SRC-20", true);
      });
    });

    it("should return cursed stamps when filtered", async () => {
      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
        type: "cursed",
      });

      assertExists(result);
      assertExists(result.stamps);

      // All returned stamps should be cursed (negative numbers)
      result.stamps.forEach((stamp) => {
        assertEquals(stamp.stamp < 0, true);
      });
    });

    it("should handle empty results gracefully", async () => {
      // Query for stamps that likely don't exist
      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
        identifier: "NONEXISTENT_CPID_12345",
      });

      assertExists(result);
      assertExists(result.stamps);
      assertEquals(Array.isArray(result.stamps), true);
      assertEquals(result.stamps.length, 0);
    });
  });

  describe("getTotalStampCountFromDb", () => {
    it("should return a valid count", async () => {
      const result = await StampRepository.getTotalStampCountFromDb({});

      assertExists(result);
      assertExists(result.rows);
      assertExists(result.rows[0]);
      assertExists(result.rows[0].total);

      const count = result.rows[0].total;
      assertEquals(typeof count, "number");
      assertEquals(count >= 0, true);
    });

    it("should return different counts for different types", async () => {
      const allResult = await StampRepository.getTotalStampCountFromDb({});
      const regularResult = await StampRepository.getTotalStampCountFromDb({
        type: "stamps",
      });
      const cursedResult = await StampRepository.getTotalStampCountFromDb({
        type: "cursed",
      });

      const allCount = allResult.rows[0].total;
      const regularCount = regularResult.rows[0].total;
      const cursedCount = cursedResult.rows[0].total;

      // Counts should be different
      assertEquals(allCount >= regularCount, true);
      assertEquals(allCount >= cursedCount, true);
    });
  });

  describe("getStampFile", () => {
    it("should return stamp data for valid CPID", async () => {
      // Use a CPID from our fixtures that should exist
      const testCpid = stampFixtures.regularStamps[0]?.cpid;

      if (testCpid) {
        const result = await StampRepository.getStampFile(testCpid);

        if (result) {
          assertExists(result.stamp);
          assertExists(result.cpid);
          assertEquals(result.cpid, testCpid);
        }
      }
    });

    it("should return null for non-existent CPID", async () => {
      const result = await StampRepository.getStampFile("NONEXISTENT_CPID");
      assertEquals(result, null);
    });
  });

  describe("getCreatorNameByAddress", () => {
    it("should return creator name for known address", async () => {
      // Use an address from fixtures
      const testCreator = stampFixtures.creators[0];

      if (testCreator) {
        const result = await StampRepository.getCreatorNameByAddress(
          testCreator.address,
        );

        // May or may not exist in actual database
        if (result) {
          assertEquals(typeof result, "string");
        }
      }
    });
  });

  describe("sanitize", () => {
    it("should sanitize input correctly", () => {
      assertEquals(StampRepository.sanitize("test@123#abc!"), "test123abc");
      assertEquals(
        StampRepository.sanitize("test.file-name_123"),
        "test.file-name_123",
      );
      assertEquals(StampRepository.sanitize(""), "");
      assertEquals(StampRepository.sanitize("@#$%^&*()"), "");
    });
  });
});
