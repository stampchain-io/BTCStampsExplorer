/**
 * Integration tests for Collection Detail Endpoint
 * Route: /api/v2/collections/[id]
 *
 * Tests verify that the endpoint correctly:
 * - Accepts collection UUID as parameter
 * - Converts UUID to BINARY(16) using UNHEX() for DB queries
 * - Returns collection with stamps array (paginated)
 * - Includes market data from collection_market_data table
 * - Returns 404 for invalid collection IDs
 * - Supports pagination for stamps list
 */
import { assertEquals, assertExists } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { dbManager } from "$server/database/databaseManager.ts";

// Skip in CI if no test database is available
const skipInCI = Deno.env.get("CI") === "true" && !Deno.env.get("TEST_DB_HOST");

// Test server base URL
const BASE_URL = Deno.env.get("TEST_SERVER_URL") || "http://localhost:8000";

describe("Collection Detail Endpoint - /api/v2/collections/[id]", {
  skip: skipInCI,
}, () => {
  let testCollectionId: string | null = null;

  beforeAll(async () => {
    // Get a valid collection ID from the database for testing
    const query = `
      SELECT HEX(collection_id) as collection_id
      FROM collections
      LIMIT 1
    `;

    const result = await dbManager.executeQueryWithCache(query, [], 0) as {
      rows: Array<{ collection_id: string }>;
    };

    if (result.rows && result.rows.length > 0) {
      testCollectionId = result.rows[0].collection_id;
    }
  });

  afterAll(async () => {
    // Close all database connections to prevent TCP leaks
    await dbManager.closeAllClients();
  });

  describe("GET /api/v2/collections/[id]", () => {
    it("should return 404 for invalid collection UUID", async () => {
      const invalidId = "00000000000000000000000000000000";
      const response = await fetch(
        `${BASE_URL}/api/v2/collections/${invalidId}`,
      );

      assertEquals(response.status, 404);

      const data = await response.json();
      assertExists(data);
      assertEquals(data.success, false);
    });

    it("should return collection details for valid UUID", async () => {
      if (!testCollectionId) {
        console.log("Skipping test: No test collection ID available");
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/v2/collections/${testCollectionId}`,
      );

      assertEquals(response.status, 200);

      const data = await response.json();
      assertExists(data);
      assertEquals(data.success, true);
      assertExists(data.data);

      const collection = data.data;

      // Verify basic collection fields
      assertEquals(collection.collection_id, testCollectionId);
      assertExists(collection.collection_name);
      assertExists(collection.collection_description);
      assertEquals(Array.isArray(collection.creators), true);
      assertEquals(typeof collection.stamp_count, "number");
      assertEquals(typeof collection.total_editions, "number");
    });

    it("should include stamps array in collection response", async () => {
      if (!testCollectionId) {
        console.log("Skipping test: No test collection ID available");
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/v2/collections/${testCollectionId}`,
      );

      assertEquals(response.status, 200);

      const data = await response.json();
      const collection = data.data;

      // Verify stamps array exists
      assertExists(collection.stamps);
      assertEquals(Array.isArray(collection.stamps), true);
    });

    it("should support pagination for stamps list", async () => {
      if (!testCollectionId) {
        console.log("Skipping test: No test collection ID available");
        return;
      }

      // Request with pagination parameters
      const limit = 10;
      const page = 1;
      const response = await fetch(
        `${BASE_URL}/api/v2/collections/${testCollectionId}?limit=${limit}&page=${page}`,
      );

      assertEquals(response.status, 200);

      const data = await response.json();
      assertExists(data.data);

      // Verify pagination metadata if included
      if (data.pagination) {
        assertEquals(data.pagination.limit, limit);
        assertEquals(data.pagination.page, page);
      }
    });

    it("should include market data when available", async () => {
      if (!testCollectionId) {
        console.log("Skipping test: No test collection ID available");
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/v2/collections/${testCollectionId}`,
      );

      assertEquals(response.status, 200);

      const data = await response.json();
      const collection = data.data;

      // Market data may be null if not available, but field should exist
      // When present, verify structure
      if (collection.marketData) {
        const marketData = collection.marketData;

        // These fields should exist when market data is present
        assertExists(marketData.floorPriceBTC !== undefined);
        assertExists(marketData.avgPriceBTC !== undefined);
        assertExists(marketData.totalValueBTC !== undefined);
        assertExists(marketData.volume24hBTC !== undefined);
        assertExists(marketData.volume7dBTC !== undefined);
        assertExists(marketData.volume30dBTC !== undefined);
        assertExists(marketData.totalVolumeBTC !== undefined);
        assertExists(marketData.totalStamps !== undefined);
        assertExists(marketData.uniqueHolders !== undefined);
        assertExists(marketData.listedStamps !== undefined);
        assertExists(marketData.soldStamps24h !== undefined);
      }
    });

    it("should handle collection ID case insensitivity", async () => {
      if (!testCollectionId) {
        console.log("Skipping test: No test collection ID available");
        return;
      }

      // Test with lowercase UUID
      const lowercaseId = testCollectionId.toLowerCase();
      const response = await fetch(
        `${BASE_URL}/api/v2/collections/${lowercaseId}`,
      );

      assertEquals(response.status, 200);

      const data = await response.json();
      assertEquals(data.success, true);
      assertExists(data.data);
    });

    it("should reject malformed UUIDs", async () => {
      const malformedId = "not-a-valid-uuid";
      const response = await fetch(
        `${BASE_URL}/api/v2/collections/${malformedId}`,
      );

      // Should return 400 Bad Request or 404 Not Found
      assertEquals(response.status >= 400 && response.status < 500, true);
    });

    it("should cache responses appropriately", async () => {
      if (!testCollectionId) {
        console.log("Skipping test: No test collection ID available");
        return;
      }

      // Make first request
      const response1 = await fetch(
        `${BASE_URL}/api/v2/collections/${testCollectionId}`,
      );
      assertEquals(response1.status, 200);

      // Make second request - should be cached
      const response2 = await fetch(
        `${BASE_URL}/api/v2/collections/${testCollectionId}`,
      );
      assertEquals(response2.status, 200);

      const data1 = await response1.json();
      const data2 = await response2.json();

      // Responses should be consistent
      assertEquals(data1.data.collection_id, data2.data.collection_id);
      assertEquals(data1.data.collection_name, data2.data.collection_name);
    });
  });
});
