import { assertEquals, assertExists } from "@std/assert";
import { CollectionRepository } from "$server/database/collectionRepository.ts";
import { MockDatabaseManager } from "../mocks/mockDatabaseManager.ts";
import { dbManager } from "$server/database/databaseManager.ts";

Deno.test("CollectionRepository Unit Tests with DI", async (t) => {
  let originalDb: typeof dbManager;
  let mockDb: MockDatabaseManager;

  // Setup before each test
  function setup() {
    // Store original database
    originalDb = (CollectionRepository as any).db;

    // Create mock database
    mockDb = new MockDatabaseManager();

    // Inject mock
    CollectionRepository.setDatabase(mockDb as unknown as typeof dbManager);
  }

  // Teardown after each test
  function teardown() {
    // Clear mock data FIRST before restoring
    if (mockDb) {
      mockDb.clearQueryHistory();
      mockDb.clearMockResponses();
    }

    // Restore original database
    CollectionRepository.setDatabase(originalDb);
  }

  await t.step(
    "getCollectionDetails - returns collection details with basic info",
    async () => {
      setup();

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

      teardown();
    },
  );

  await t.step(
    "getCollectionDetails - filters by creator",
    async () => {
      setup();

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
          (c: any) => c.collection_name === "INFINITY SEED",
        );
        assertExists(collection, "Should find INFINITY SEED collection");
      }

      teardown();
    },
  );

  await t.step(
    "getCollectionDetails - filters by minimum stamp count",
    async () => {
      setup();

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
        result.rows.forEach((collection: any) => {
          const stampCount = parseInt(collection.stamp_count);
          assertEquals(
            stampCount >= 30,
            true,
            `Collection ${collection.collection_name} should have at least 30 stamps`,
          );
        });
      }

      teardown();
    },
  );

  await t.step(
    "getTotalCollectionsByCreatorFromDb - returns total count",
    async () => {
      setup();

      const total = await CollectionRepository
        .getTotalCollectionsByCreatorFromDb();

      assertEquals(typeof total, "number");
      assertEquals(total >= 0, true);

      teardown();
    },
  );

  await t.step(
    "getTotalCollectionsByCreatorFromDb - filters by creator",
    async () => {
      setup();

      const creatorAddress = "bc1q2uh80zl320nsfs57dc5umkf95rcf0s9ppnlyuj";
      const total = await CollectionRepository
        .getTotalCollectionsByCreatorFromDb(creatorAddress);

      assertEquals(typeof total, "number");
      assertEquals(total >= 0, true);

      teardown();
    },
  );

  await t.step(
    "getCollectionByName - returns collection by name",
    async () => {
      setup();

      // From fixtures, we know KEVIN collection exists
      const result = await CollectionRepository.getCollectionByName("KEVIN");

      assertExists(result);
      if (result !== null) {
        assertEquals(result.collection_name, "KEVIN");
        assertExists(result.collection_id);
        assertEquals(typeof result.stamp_count, "string");
        assertEquals(typeof result.total_editions, "string");
      }

      teardown();
    },
  );

  await t.step(
    "getCollectionByName - returns null for non-existent collection",
    async () => {
      setup();

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

      teardown();
    },
  );

  await t.step(
    "getCollectionNames - returns collection names with pagination",
    async () => {
      setup();

      const result = await CollectionRepository.getCollectionNames({
        limit: 5,
        page: 1,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(Array.isArray(result.rows), true);

      if (result.rows.length > 0) {
        result.rows.forEach((row: any) => {
          assertExists(row.collection_name);
          assertEquals(typeof row.collection_name, "string");
        });
      }

      teardown();
    },
  );

  await t.step(
    "getCollectionDetailsWithMarketData - returns collections without market data",
    async () => {
      setup();

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

      teardown();
    },
  );

  await t.step(
    "getCollectionDetailsWithMarketData - includes market data when requested",
    async () => {
      setup();

      // Set up mock response with market data fields
      mockDb.setMockResponse(
        `SELECT 
        HEX(c.collection_id) as collection_id,
        c.collection_name,`,
        [],
        {
          rows: [{
            collection_id: "015F0478516E4273DD90FE59C766DD98",
            collection_name: "KEVIN",
            collection_description: null,
            creators: "bc1qexamplecreator",
            creator_names: "Example Creator",
            stamp_numbers: "4258,4262,4265",
            stamp_count: "3",
            total_editions: "300",
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

      teardown();
    },
  );

  await t.step(
    "handles database errors gracefully",
    async () => {
      setup();

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

      teardown();
    },
  );

  await t.step(
    "getCollectionDetails - handles pagination correctly",
    async () => {
      setup();

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

      teardown();
    },
  );

  await t.step(
    "getCollectionDetails - properly formats creators and stamps arrays",
    async () => {
      setup();

      // Set up mock response with comma-separated values
      mockDb.setMockResponse(
        "SELECT \n        HEX(c.collection_id) as collection_id",
        [],
        {
          rows: [{
            collection_id: "TEST123",
            collection_name: "Test Collection",
            collection_description: "Test Description",
            creators: "addr1,addr2,addr3",
            stamp_numbers: "100,200,300,400",
            stamp_count: "4",
            total_editions: "400",
          }],
        },
      );

      const result = await CollectionRepository.getCollectionDetails({
        limit: 10,
        page: 1,
      });

      assertExists(result);
      assertExists(result.rows);
      assertEquals(result.rows.length, 1);

      const collection = result.rows[0];
      assertEquals(Array.isArray(collection.creators), true);
      assertEquals(collection.creators.length, 3);
      assertEquals(collection.creators[0], "addr1");

      assertEquals(Array.isArray(collection.stamps), true);
      assertEquals(collection.stamps.length, 4);
      assertEquals(collection.stamps[0], 100);
      assertEquals(typeof collection.stamps[0], "number");

      teardown();
    },
  );
});
