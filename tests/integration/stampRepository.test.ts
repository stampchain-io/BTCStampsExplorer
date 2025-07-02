import { assertEquals, assertExists } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { StampRepository } from "$server/database/stampRepository.ts";
import { dbManager as _dbManager } from "$server/database/databaseManager.ts";

describe("StampRepository Integration Tests", () => {
  beforeAll(() => {
    // Ensure database connection is established
    console.log("Connecting to database for integration tests...");
    // The dbManager should already be connected via the import
  });

  afterAll(() => {
    // Clean up database connections
    console.log("Cleaning up database connections...");
    // dbManager doesn't have a close method - it manages connections internally
  });

  describe("getStamps", () => {
    it("should return stamps with basic pagination", async () => {
      const result = await StampRepository.getStamps({
        limit: 5,
        page: 1,
      });

      assertExists(result);
      assertEquals(Array.isArray(result), true);
      assertEquals(result.length <= 5, true);

      if (result.length > 0) {
        // Check first stamp has required fields
        const firstStamp = result[0];
        assertExists(firstStamp.stamp);
        assertExists(firstStamp.cpid);
        assertExists(firstStamp.tx_hash);
      }
    });

    it("should return stamps with type filter", async () => {
      const result = await StampRepository.getStamps({
        limit: 5,
        page: 1,
        type: "stamps", // Regular stamps (positive numbers)
      });

      assertExists(result);
      if (result.length > 0) {
        // All stamps should have positive stamp numbers
        result.forEach((stamp) => {
          assertEquals(stamp.stamp > 0, true);
        });
      }
    });

    it("should return cursed stamps with type filter", async () => {
      const result = await StampRepository.getStamps({
        limit: 5,
        page: 1,
        type: "cursed", // Cursed stamps (negative numbers)
      });

      assertExists(result);
      if (result.length > 0) {
        // All stamps should have negative stamp numbers
        result.forEach((stamp) => {
          assertEquals(stamp.stamp < 0, true);
        });
      }
    });

    it("should handle sorting", async () => {
      const resultDesc = await StampRepository.getStamps({
        limit: 5,
        page: 1,
        sortBy: "DESC",
      });

      const resultAsc = await StampRepository.getStamps({
        limit: 5,
        page: 1,
        sortBy: "ASC",
      });

      if (resultDesc.length > 1 && resultAsc.length > 1) {
        // DESC should have higher stamp numbers first
        assertEquals(resultDesc[0].stamp > resultDesc[1].stamp, true);
        // ASC should have lower stamp numbers first
        assertEquals(resultAsc[0].stamp < resultAsc[1].stamp, true);
      }
    });

    it("should return stamps by specific identifiers", async () => {
      // First get a stamp to test with
      const stamps = await StampRepository.getStamps({ limit: 1, page: 1 });
      if (stamps.length > 0) {
        const testStamp = stamps[0];

        // Test by stamp number
        const byNumber = await StampRepository.getStamps({
          ident: [testStamp.stamp.toString()],
          limit: 10,
          page: 1,
        });
        assertEquals(byNumber.length, 1);
        assertEquals(byNumber[0].stamp, testStamp.stamp);

        // Test by CPID
        const byCpid = await StampRepository.getStamps({
          ident: [testStamp.cpid],
          limit: 10,
          page: 1,
        });
        assertEquals(byCpid.length >= 1, true);
        assertEquals(
          byCpid.find((s) => s.cpid === testStamp.cpid) !== undefined,
          true,
        );
      }
    });
  });

  describe("getTotalStampCountFromDb", () => {
    it("should return total count with no filters", async () => {
      const count = await StampRepository.getTotalStampCountFromDb({});
      assertEquals(typeof count, "number");
      assertEquals(count > 0, true);
    });

    it("should return count with type filter", async () => {
      const regularCount = await StampRepository.getTotalStampCountFromDb({
        type: "stamps",
      });
      const cursedCount = await StampRepository.getTotalStampCountFromDb({
        type: "cursed",
      });

      assertEquals(typeof regularCount, "number");
      assertEquals(typeof cursedCount, "number");
      assertEquals(regularCount >= 0, true);
      assertEquals(cursedCount >= 0, true);
    });
  });

  describe("getStampFile", () => {
    it("should return stamp file data for valid stamp", async () => {
      // Get a stamp first
      const stamps = await StampRepository.getStamps({ limit: 1, page: 1 });
      if (stamps.length > 0) {
        const testStamp = stamps[0];

        const fileData = await StampRepository.getStampFile(testStamp.cpid);
        if (fileData) {
          assertExists(fileData.stamp);
          assertExists(fileData.cpid);
          assertExists(fileData.stamp_url);
          assertEquals(fileData.cpid, testStamp.cpid);
        }
      }
    });

    it("should return null for invalid identifier", async () => {
      const result = await StampRepository.getStampFile("INVALID_CPID_12345");
      assertEquals(result, null);
    });
  });

  describe("getCreatorNameByAddress", () => {
    it("should handle valid and invalid addresses", async () => {
      // Test with a known creator address if available
      const stamps = await StampRepository.getStamps({ limit: 10, page: 1 });
      if (stamps.length > 0) {
        const stampWithCreator = stamps.find((s) => s.creator);
        if (stampWithCreator) {
          const creatorName = await StampRepository.getCreatorNameByAddress(
            stampWithCreator.creator,
          );
          // Could be null or a string
          assertEquals(
            typeof creatorName === "string" || creatorName === null,
            true,
          );
        }
      }

      // Test with invalid address
      const invalidResult = await StampRepository.getCreatorNameByAddress(
        "bc1invalid_address",
      );
      assertEquals(invalidResult, null);
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
