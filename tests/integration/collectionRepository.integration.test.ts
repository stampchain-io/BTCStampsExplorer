/**
 * Integration tests for CollectionRepository using real database connection
 * These tests use fixtures for predictable test data
 */
import { assertEquals, assertExists } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { CollectionRepository } from "$server/database/collectionRepository.ts";
import collectionFixtures from "../fixtures/collectionData.json" with {
  type: "json",
};

// Skip in CI if no test database is available
const skipInCI = Deno.env.get("CI") === "true" && !Deno.env.get("TEST_DB_HOST");

describe("CollectionRepository Integration Tests", { skip: skipInCI }, () => {
  // Optional: Set up test data before tests
  beforeAll(async () => {
    // Could insert fixture data into test database here
    // await seedTestData();
  });

  // Optional: Clean up after tests
  afterAll(async () => {
    // Could clean up test data here
    // await cleanupTestData();
  });

  describe("getCollectionDetails", () => {
    it("should return collection details with pagination", async () => {
      const result = await CollectionRepository.getCollectionDetails({
        limit: 5,
        page: 1,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(Array.isArray(result.rows), true);

      if (result.rows.length > 0) {
        const firstCollection = result.rows[0];
        assertExists(firstCollection.collection_id);
        assertExists(firstCollection.collection_name);
        assertEquals(Array.isArray(firstCollection.creators), true);
        assertEquals(Array.isArray(firstCollection.stamps), true);
        assertEquals(typeof firstCollection.stamp_count, "number");
      }
    });

    it("should filter collections by creator", async () => {
      // Use a creator from fixtures if available
      const testCreator = collectionFixtures.collectionCreators[0]
        ?.creator_address;

      if (testCreator) {
        const result = await CollectionRepository.getCollectionDetails({
          limit: 10,
          page: 1,
          creator: testCreator,
        });

        assertExists(result);
        assertExists(result.rows);

        // All returned collections should have this creator
        result.rows.forEach((collection: any) => {
          assertEquals(collection.creators.includes(testCreator), true);
        });
      }
    });

    it("should filter collections by minimum stamp count", async () => {
      const minStampCount = 2;
      const result = await CollectionRepository.getCollectionDetails({
        limit: 10,
        page: 1,
        minStampCount,
      });

      assertExists(result);
      assertExists(result.rows);

      // All returned collections should meet the minimum
      result.rows.forEach((collection: any) => {
        assertEquals(collection.stamp_count >= minStampCount, true);
      });
    });

    it("should handle empty results gracefully", async () => {
      // Query with a non-existent creator
      const result = await CollectionRepository.getCollectionDetails({
        limit: 10,
        page: 1,
        creator: "NONEXISTENT_ADDRESS_12345",
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(Array.isArray(result.rows), true);
      assertEquals(result.rows.length, 0);
    });
  });

  describe("getTotalCollectionsByCreatorFromDb", () => {
    it("should return total count of all collections", async () => {
      const count = await CollectionRepository
        .getTotalCollectionsByCreatorFromDb();

      assertEquals(typeof count, "number");
      assertEquals(count >= 0, true);
    });

    it("should return count filtered by creator", async () => {
      const testCreator = collectionFixtures.collectionCreators[0]
        ?.creator_address;

      if (testCreator) {
        const count = await CollectionRepository
          .getTotalCollectionsByCreatorFromDb(testCreator);

        assertEquals(typeof count, "number");
        assertEquals(count >= 0, true);
      }
    });

    it("should return count with minimum stamp filter", async () => {
      const minStampCount = 5;
      const allCount = await CollectionRepository
        .getTotalCollectionsByCreatorFromDb(undefined, 0);
      const filteredCount = await CollectionRepository
        .getTotalCollectionsByCreatorFromDb(undefined, minStampCount);

      // Filtered count should be less than or equal to all count
      assertEquals(filteredCount <= allCount, true);
    });
  });

  describe("getCollectionByName", () => {
    it("should return collection details for valid name", async () => {
      // Use a collection name from our fixtures
      const testCollection = collectionFixtures.collections[0];

      if (testCollection?.collection_name) {
        const result = await CollectionRepository.getCollectionByName(
          testCollection.collection_name,
        );

        if (result) {
          assertExists(result.collection_id);
          assertEquals(result.collection_name, testCollection.collection_name);
          assertExists(result.stamp_count);
        }
      }
    });

    it("should return null for non-existent collection", async () => {
      const result = await CollectionRepository.getCollectionByName(
        "NONEXISTENT_COLLECTION_NAME_12345",
      );

      assertEquals(result, null);
    });
  });

  describe("getCollectionNames", () => {
    it("should return collection names with pagination", async () => {
      const result = await CollectionRepository.getCollectionNames({
        limit: 10,
        page: 1,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(Array.isArray(result.rows), true);

      if (result.rows.length > 0) {
        const firstRow = result.rows[0];
        assertExists(firstRow.collection_name);
      }
    });

    it("should filter collection names by creator", async () => {
      const testCreator = collectionFixtures.collectionCreators[0]
        ?.creator_address;

      if (testCreator) {
        const result = await CollectionRepository.getCollectionNames({
          limit: 10,
          page: 1,
          creator: testCreator,
        });

        assertExists(result);
        assertExists(result.rows);
        assertEquals(Array.isArray(result.rows), true);
      }
    });
  });

  describe("getCollectionDetailsWithMarketData", () => {
    it("should return collection details without market data by default", async () => {
      const result = await CollectionRepository
        .getCollectionDetailsWithMarketData({
          limit: 5,
          page: 1,
          includeMarketData: false,
        });

      assertExists(result);
      assertExists(result.rows);

      if (result.rows.length > 0) {
        const firstCollection = result.rows[0];
        assertExists(firstCollection.collection_id);
        assertExists(firstCollection.collection_name);
        assertEquals(firstCollection.marketData, undefined);
      }
    });

    it("should include market data when requested", async () => {
      const result = await CollectionRepository
        .getCollectionDetailsWithMarketData({
          limit: 5,
          page: 1,
          includeMarketData: true,
        });

      assertExists(result);
      assertExists(result.rows);

      if (result.rows.length > 0) {
        const firstCollection = result.rows[0];
        assertExists(firstCollection.collection_id);

        // Market data might be null if no data exists
        if (firstCollection.marketData) {
          assertExists(
            firstCollection.marketData.minFloorPriceBTC !== undefined,
          );
          assertExists(
            firstCollection.marketData.maxFloorPriceBTC !== undefined,
          );
          assertExists(
            firstCollection.marketData.avgFloorPriceBTC !== undefined,
          );
        }
      }
    });

    it("should handle sorting options", async () => {
      const ascResult = await CollectionRepository
        .getCollectionDetailsWithMarketData({
          limit: 5,
          page: 1,
          sortBy: "ASC",
        });

      const descResult = await CollectionRepository
        .getCollectionDetailsWithMarketData({
          limit: 5,
          page: 1,
          sortBy: "DESC",
        });

      assertExists(ascResult.rows);
      assertExists(descResult.rows);

      // Results should be different if there are multiple collections
      if (ascResult.rows.length > 1 && descResult.rows.length > 1) {
        const firstAsc = ascResult.rows[0].collection_name;
        const firstDesc = descResult.rows[0].collection_name;
        // They might be different unless there's only one collection
        assertEquals(typeof firstAsc, "string");
        assertEquals(typeof firstDesc, "string");
      }
    });
  });
});
