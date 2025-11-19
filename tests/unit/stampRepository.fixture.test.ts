import { assertEquals, assertExists } from "@std/assert";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "jsr:@std/testing@1.0.14/bdd";
import { stub } from "@std/testing@1.0.14/mock";
import { StampRepository } from "$server/database/stampRepository.ts";
import stampFixtures from "../fixtures/stampData.json" with { type: "json" };
import { createMockStampRow } from "./utils/testFactories.ts";
import type { StampRow } from "$types/stamp.d.ts";

// Mock database manager for testing
class MockDatabaseManager {
  executeQueryWithCache: any;
  executeQuery: any;

  async invalidateCacheByCategory(category: string): Promise<void> {
    // Mock implementation - just log for testing
    console.log(`[MOCK] Invalidating cache for category: ${category}`);
    return Promise.resolve();
  }
}

describe("StampRepository Tests with Fixtures", () => {
  let mockDb: MockDatabaseManager;
  let queryStub: any;
  let executeQueryStub: any;

  beforeEach(() => {
    mockDb = new MockDatabaseManager();
    StampRepository.setDatabase(mockDb as any);
  });

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
        mockDb,
        "executeQueryWithCache",
        (
          _query: unknown,
          _params: unknown,
          _cacheDuration: unknown,
        ) => {
          // Use factory to create properly typed stamps based on fixtures
          const mappedRows = stampFixtures.regularStamps.slice(0, 5).map(
            (fixtureStamp) =>
              createMockStampRow({
                ...fixtureStamp,
                creator_name: null, // Add the joined field expected by query
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
        mockDb,
        "executeQueryWithCache",
        (
          _query: unknown,
          _params: unknown,
          _cacheDuration: unknown,
        ) => {
          const mappedRows = stampFixtures.regularStamps.map((fixtureStamp) =>
            createMockStampRow({
              ...fixtureStamp,
              creator_name: null,
            })
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
        type: "stamps",
      });

      assertExists(result);
      // All stamps should have positive numbers
      result.stamps.forEach(
        (stamp: StampRow & { creator_name: string | null }) => {
          assertEquals(stamp.stamp! > 0, true);
        },
      );
    });

    it("should return cursed stamps when filtered", async () => {
      queryStub = stub(
        mockDb,
        "executeQueryWithCache",
        (
          _query: unknown,
          _params: unknown,
          _cacheDuration: unknown,
        ) => {
          const mappedRows = stampFixtures.cursedStamps.map((fixtureStamp) =>
            createMockStampRow({
              ...fixtureStamp,
              creator_name: null,
            })
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
        type: "cursed",
      });

      assertExists(result);
      // All stamps should have negative numbers
      result.stamps.forEach(
        (stamp: StampRow & { creator_name: string | null }) => {
          assertEquals(stamp.stamp! < 0, true);
        },
      );
    });

    it("should handle empty results", async () => {
      queryStub = stub(
        mockDb,
        "executeQueryWithCache",
        (
          _query: unknown,
          _params: unknown,
          _cacheDuration: unknown,
        ) => Promise.resolve({ rows: [], rowCount: 0 }),
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
        mockDb,
        "executeQueryWithCache",
        (
          _query: unknown,
          _params: unknown,
          _cacheDuration: unknown,
        ) => Promise.reject(new Error("Database connection failed")),
      );

      try {
        await StampRepository.getStamps({
          limit: 10,
          page: 1,
        });
        assertEquals(false, true, "Expected error to be thrown");
      } catch (error) {
        assertEquals((error as Error).message, "Database connection failed");
      }
    });
  });

  describe("updateCreatorName", () => {
    it("should update creator name successfully", async () => {
      executeQueryStub = stub(
        mockDb,
        "executeQuery",
        (_query: unknown, _params: unknown) =>
          Promise.resolve({ affectedRows: 1, rows: [], rowCount: 1 }),
      );

      const result = await StampRepository.updateCreatorName(
        "bc1test",
        "Test Creator",
      );
      assertEquals(result, true);
    });

    it("should return false on error", async () => {
      executeQueryStub = stub(
        mockDb,
        "executeQuery",
        (_query: unknown, _params: unknown) =>
          Promise.reject(new Error("Update failed")),
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
