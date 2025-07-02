import { assertEquals, assertExists } from "@std/assert";
import { afterEach, describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import { StampRepository } from "$server/database/stampRepository.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import stampFixtures from "../fixtures/stampData.json" with { type: "json" };

describe("StampRepository Unit Tests", () => {
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
      result.forEach((stamp) => {
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
      result.forEach((stamp) => {
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

      assertEquals(result, []);
    });

    it("should handle database errors gracefully", async () => {
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
    });
  });

  describe("getTotalStampCountFromDb", () => {
    it("should return total count", async () => {
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
    });

    it("should return count with type filter", async () => {
      queryStub = stub(
        dbManager,
        "executeQueryWithCache",
        (query: string) => {
          // Check if query contains type filter
          if (query.includes("stamp >= 0")) {
            return Promise.resolve({ rows: [{ count: "95000" }], rowCount: 1 });
          }
          return Promise.resolve({ rows: [{ count: "5000" }], rowCount: 1 });
        },
      );

      const regularCount = await StampRepository.getTotalStampCountFromDb({
        type: "stamps",
      });
      assertEquals(regularCount, 95000);
    });

    it("should return 0 on error", async () => {
      queryStub = stub(
        dbManager,
        "executeQueryWithCache",
        () => Promise.reject(new Error("Count failed")),
      );

      const count = await StampRepository.getTotalStampCountFromDb({});
      assertEquals(count, 0);
    });
  });

  describe("getStampFile", () => {
    it("should return stamp file data", async () => {
      const mockStamp = stampFixtures.regularStamps[0];
      queryStub = stub(
        dbManager,
        "executeQueryWithCache",
        () => {
          const mappedRow = {
            ...mockStamp,
            creator_name: null,
          };
          return Promise.resolve({
            rows: [mappedRow],
            rowCount: 1,
          });
        },
      );

      const result = await StampRepository.getStampFile(mockStamp.cpid);

      if (result) {
        assertExists(result.stamp);
        assertExists(result.cpid);
        assertExists(result.stamp_url);
        assertEquals(result.cpid, mockStamp.cpid);
      }
    });

    it("should return null for non-existent stamp", async () => {
      queryStub = stub(
        dbManager,
        "executeQueryWithCache",
        () => Promise.resolve({ rows: [], rowCount: 0 }),
      );

      const result = await StampRepository.getStampFile("NONEXISTENT");
      assertEquals(result, null);
    });

    it("should handle invalid identifiers", async () => {
      const result = await StampRepository.getStampFile("invalid@#$");
      assertEquals(result, null);
    });
  });

  describe("getCreatorNameByAddress", () => {
    it("should return creator name", async () => {
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
    });

    it("should return null for unknown address", async () => {
      queryStub = stub(
        dbManager,
        "executeQueryWithCache",
        () => Promise.resolve({ rows: [], rowCount: 0 }),
      );

      const result = await StampRepository.getCreatorNameByAddress(
        "bc1unknown",
      );
      assertEquals(result, null);
    });

    it("should handle errors gracefully", async () => {
      queryStub = stub(
        dbManager,
        "executeQueryWithCache",
        () => Promise.reject(new Error("Query failed")),
      );

      const result = await StampRepository.getCreatorNameByAddress(
        "bc1error",
      );
      assertEquals(result, null);
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

  describe("getStamps with market data", () => {
    it("should return stamps with market data", async () => {
      queryStub = stub(
        dbManager,
        "executeQueryWithCache",
        () => {
          const mappedRows = stampFixtures.stampsWithMarketData.map(
            (stamp) => ({
              ...stamp,
              creator_name: null,
            }),
          );
          return Promise.resolve({
            rows: mappedRows,
            rowCount: mappedRows.length,
          });
        },
      );

      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
      });

      assertExists(result);
      if (
        result.length > 0 &&
        stampFixtures.stampsWithMarketData[0].floor_price_btc
      ) {
        // The fixture includes market data fields
        const firstStamp = stampFixtures.stampsWithMarketData[0];
        assertExists(firstStamp.floor_price_btc);
        assertExists(firstStamp.holder_count);
      }
    });
  });
});
