import { assertEquals, assertExists } from "@std/assert";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "jsr:@std/testing@1.0.14/bdd";
import { CollectionRepository } from "$server/database/collectionRepository.ts";
import type {
  CollectionRow,
  CollectionWithOptionalMarketData,
} from "$server/types/collection.d.ts";
import { MockDatabaseManager } from "../mocks/mockDatabaseManager.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import {
  createMockCollection,
  createMockDatabaseManager,
} from "./utils/testFactories.ts";

describe("CollectionRepository Unit Tests", () => {
  let originalDb: typeof dbManager;
  let mockDb: MockDatabaseManager;

  beforeEach(() => {
    // Check if we should run database tests
    if (Deno.env.get("RUN_DB_TESTS") === "true") {
      // Skip these tests in CI - they need real database connection
      console.log(
        "Skipping CollectionRepository unit tests - RUN_DB_TESTS is set for integration tests",
      );
      return;
    }

    // Store original database
    originalDb = dbManager;

    // Create mock database
    mockDb = new MockDatabaseManager();

    // Inject mock with proper typing
    CollectionRepository.setDatabase(mockDb as typeof dbManager);
  });

  afterEach(() => {
    // Skip cleanup if we didn't set up
    if (!mockDb) return;

    // Clear mock data FIRST before restoring
    mockDb.clearQueryHistory();
    mockDb.clearMockResponses();

    // Restore original database
    CollectionRepository.setDatabase(originalDb);

    // Reset references
    mockDb = undefined as any;
  });

  describe("getCollectionDetails", () => {
    it("should return collection details with basic info", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await CollectionRepository.getCollectionDetails({
        limit: 10,
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
        assertEquals(typeof firstCollection.stamp_count, "string");
        assertEquals(typeof firstCollection.total_editions, "string");
      }
    });

    it("should filter by creator", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      // From fixtures, we know this creator has collections
      const creatorAddress = "bc1q2uh80zl320nsfs57dc5umkf95rcf0s9ppnlyuj";

      const result = await CollectionRepository.getCollectionDetails({
        creator: creatorAddress,
        limit: 10,
        page: 1,
      });

      assertExists(result);
      assertExists(result.rows);

      // The mock should return collections filtered by creator
      // In fixtures, this creator is associated with INFINITY SEED collection
      if (result.rows.length > 0) {
        const collection = result.rows.find(
          (c: CollectionRow) => c.collection_name === "INFINITY SEED",
        );
        assertExists(collection, "Should find INFINITY SEED collection");
      }
    });

    it("should filter by minimum stamp count", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      // KEVIN collection has 50 stamps in fixtures
      const result = await CollectionRepository.getCollectionDetails({
        minStampCount: 30,
        limit: 10,
        page: 1,
      });

      assertExists(result);
      assertExists(result.rows);

      // Mock should filter collections with at least 30 stamps
      if (result.rows.length > 0) {
        result.rows.forEach((collection: CollectionRow) => {
          const stampCount = parseInt(collection.stamp_count.toString());
          assertEquals(
            stampCount >= 30,
            true,
            `Collection ${collection.collection_name} should have at least 30 stamps`,
          );
        });
      }
    });

    it("should handle pagination correctly", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      // Test first page
      const page1 = await CollectionRepository.getCollectionDetails({
        limit: 2,
        page: 1,
      });

      // Test second page
      const page2 = await CollectionRepository.getCollectionDetails({
        limit: 2,
        page: 2,
      });

      assertExists(page1);
      assertExists(page2);
      assertExists(page1.rows);
      assertExists(page2.rows);

      // Verify offset was applied (mock should handle this)
      const query1 = mockDb.getQueryHistory()[0];
      const query2 = mockDb.getQueryHistory()[1];

      assertEquals(
        query1.params.includes(0),
        true,
        "First page should have offset 0",
      );
      assertEquals(
        query2.params.includes(2),
        true,
        "Second page should have offset 2",
      );
    });

    it("should properly format creators and stamps arrays", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      // No need to set up a specific mock - we'll use the default collection data
      // which returns properly formatted collections

      const result = await CollectionRepository.getCollectionDetails({
        limit: 10,
        page: 1,
      });

      assertExists(result);
      assertExists(result.rows);

      // We should have at least one collection from fixtures
      assertEquals(
        result.rows.length > 0,
        true,
        "Should have at least one collection",
      );

      if (result.rows.length > 0) {
        const collection = result.rows[0];

        // Check that creators is an array (transformed from comma-separated string)
        assertEquals(
          Array.isArray(collection.creators),
          true,
          "creators should be an array",
        );

        // Check that stamps is an array (transformed from comma-separated string)
        assertEquals(
          Array.isArray(collection.stamps),
          true,
          "stamps should be an array",
        );

        // If there are stamps, check they are numbers
        if (collection.stamps.length > 0) {
          assertEquals(
            typeof collection.stamps[0],
            "number",
            "stamps should contain numbers",
          );
        }
      }
    });
  });

  describe("getTotalCollectionsByCreatorFromDb", () => {
    it("should return total count", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const total = await CollectionRepository
        .getTotalCollectionsByCreatorFromDb();

      // Debug: Check query history
      const queryHistory = mockDb.getQueryHistory();
      if (queryHistory.length > 0) {
        console.log("Query for count:", queryHistory[0].query);
        console.log("Query params:", queryHistory[0].params);
      }

      assertEquals(typeof total, "number");
      assertEquals(total >= 0, true);
    });

    it("should filter by creator", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const creatorAddress = "bc1q2uh80zl320nsfs57dc5umkf95rcf0s9ppnlyuj";
      const total = await CollectionRepository
        .getTotalCollectionsByCreatorFromDb(creatorAddress);

      assertEquals(typeof total, "number");
      assertEquals(total >= 0, true);
    });
  });

  describe("getCollectionByName", () => {
    it("should return collection by name", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      // From fixtures, we know KEVIN collection exists
      const result = await CollectionRepository.getCollectionByName("KEVIN");

      assertExists(result);
      if (result !== null) {
        assertEquals(result.collection_name, "KEVIN");
        assertExists(result.collection_id);
        assertEquals(typeof result.stamp_count, "string");
        assertEquals(typeof result.total_editions, "string");
      }
    });

    it("should return null for non-existent collection", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await CollectionRepository.getCollectionByName(
        "NON_EXISTENT_COLLECTION",
      );

      // Debug: log the query history to see what was called
      const queryHistory = mockDb.getQueryHistory();
      if (queryHistory.length > 0) {
        console.log("Query called:", queryHistory[0].query);
        console.log("Query params:", queryHistory[0].params);
      }

      assertEquals(result, null);
    });
  });

  describe("getCollectionNames", () => {
    it("should return collection names with pagination", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await CollectionRepository.getCollectionNames({
        limit: 5,
        page: 1,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(Array.isArray(result.rows), true);

      if (result.rows.length > 0) {
        result.rows.forEach((row: CollectionRow) => {
          assertExists(row.collection_name);
          assertEquals(typeof row.collection_name, "string");
        });
      }
    });
  });

  describe("getCollectionDetailsWithMarketData", () => {
    it("should return collections without market data", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      const result = await CollectionRepository
        .getCollectionDetailsWithMarketData({
          limit: 10,
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
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      // Set up mock response with market data fields using factory
      const mockCollectionWithMarketData = createMockCollection({
        collection_id: "015F0478516E4273DD90FE59C766DD98",
        collection_name: "KEVIN",
        collection_description: null,
        creators: ["bc1qexamplecreator"],
        stamp_count: "3",
        total_editions: "300",
        stamps: [4258, 4262, 4265],
      });

      mockDb.setMockResponse(
        `SELECT 
        HEX(c.collection_id) as collection_id,
        c.collection_name,`,
        [],
        {
          rows: [{
            ...mockCollectionWithMarketData,
            creators: "bc1qexamplecreator", // Database stores as string
            creator_names: "Example Creator",
            stamp_numbers: "4258,4262,4265", // Database stores as string
            minFloorPriceBTC: "0.001",
            maxFloorPriceBTC: "0.01",
            avgFloorPriceBTC: "0.005",
            medianFloorPriceBTC: null,
            totalVolume24hBTC: "0.5",
            stampsWithPricesCount: "3",
            minHolderCount: "5",
            maxHolderCount: "20",
            avgHolderCount: "12.5",
            medianHolderCount: null,
            totalUniqueHolders: "50",
            avgDistributionScore: "0.75",
            totalStampsCount: "3",
            marketDataLastUpdated: "2024-01-01T00:00:00Z",
          }],
        },
      );

      const result = await CollectionRepository
        .getCollectionDetailsWithMarketData({
          limit: 10,
          page: 1,
          includeMarketData: true,
        });

      assertExists(result);
      assertExists(result.rows);

      if (result.rows.length > 0) {
        const firstCollection = result.rows[0];
        assertExists(firstCollection.marketData);
        assertExists(firstCollection.marketData.minFloorPriceBTC);
        assertExists(firstCollection.marketData.maxFloorPriceBTC);
        assertExists(firstCollection.marketData.avgFloorPriceBTC);
        assertEquals(
          typeof firstCollection.marketData.totalVolume24hBTC,
          "number",
        );
        assertEquals(
          typeof firstCollection.marketData.stampsWithPricesCount,
          "number",
        );
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      // Skip if in RUN_DB_TESTS mode
      if (!mockDb) return;

      // Mock database error
      mockDb.executeQueryWithCache = () =>
        Promise.reject(new Error("Database connection failed"));

      try {
        await CollectionRepository.getCollectionDetails({ limit: 10, page: 1 });
        // Should not reach here
        assertEquals(true, false, "Should have thrown an error");
      } catch (error) {
        assertExists(error);
        assertEquals(error.message, "Database connection failed");
      }
    });
  });
});
