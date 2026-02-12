/**
 * Integration test for /api/v2/src20/tick/[tick] endpoint with market_data field
 *
 * Tests:
 * 1. market_data field is present in response
 * 2. market_data is populated for tokens with market data (STAMP, KEVIN)
 * 3. market_data is null for tokens without market data
 * 4. All existing fields are preserved (backward compatibility)
 * 5. Response structure matches PaginatedTickResponseBody type
 */

import { assertEquals, assertExists } from "$std/assert/mod.ts";
import type { PaginatedTickResponseBody } from "$types/api.d.ts";
import type { SRC20MarketData } from "$types/marketData.d.ts";

const BASE_URL = Deno.env.get("TEST_API_URL") || "http://localhost:8000";

Deno.test({
  name: "GET /api/v2/src20/tick/[tick] - should include market_data field for token with market data",
  async fn() {
    const tick = "STAMP"; // Known token with market data
    const response = await fetch(
      `${BASE_URL}/api/v2/src20/tick/${encodeURIComponent(tick)}?page=1&limit=10`
    );

    assertEquals(response.status, 200, "Response status should be 200");

    const body = await response.json() as { data: PaginatedTickResponseBody };
    const data = body.data;

    // Verify all existing fields are present (backward compatibility)
    assertExists(data.page, "page field should exist");
    assertExists(data.limit, "limit field should exist");
    assertExists(data.total, "total field should exist");
    assertExists(data.totalPages, "totalPages field should exist");
    assertExists(data.last_block, "last_block field should exist");
    assertExists(data.mint_status, "mint_status field should exist");
    assertExists(data.data, "data array should exist");

    // Verify mint_status structure
    assertExists(data.mint_status.max_supply, "mint_status.max_supply should exist");
    assertExists(data.mint_status.total_minted, "mint_status.total_minted should exist");
    assertExists(data.mint_status.total_mints, "mint_status.total_mints should exist");
    assertExists(data.mint_status.progress, "mint_status.progress should exist");
    assertExists(data.mint_status.decimals, "mint_status.decimals should exist");
    assertExists(data.mint_status.limit, "mint_status.limit should exist");

    // NEW: Verify market_data field exists
    assertExists(data.market_data, "market_data field should exist in response");

    // For STAMP token, market_data should be populated (not null)
    if (data.market_data !== null && data.market_data !== undefined) {
      const marketData = data.market_data as SRC20MarketData;

      assertEquals(marketData.tick, tick, "market_data.tick should match requested tick");
      assertExists(marketData.holderCount, "market_data.holderCount should exist");
      assertExists(marketData.marketCapBTC, "market_data.marketCapBTC should exist");
      assertExists(marketData.volume24hBTC, "market_data.volume24hBTC should exist");
      assertExists(marketData.lastUpdated, "market_data.lastUpdated should exist");
      assertExists(marketData.dataQualityScore, "market_data.dataQualityScore should exist");
    }

    // Verify pagination fields have correct values
    assertEquals(data.page, 1, "page should be 1");
    assertEquals(data.limit, 10, "limit should be 10");
    assertEquals(typeof data.total, "number", "total should be a number");
    assertEquals(typeof data.totalPages, "number", "totalPages should be a number");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "GET /api/v2/src20/tick/[tick] - should return market_data as null for token without market data",
  async fn() {
    const tick = "TESTNODATA"; // Token without market data
    const response = await fetch(
      `${BASE_URL}/api/v2/src20/tick/${encodeURIComponent(tick)}?page=1&limit=10`
    );

    assertEquals(response.status, 200, "Response status should be 200");

    const body = await response.json() as { data: PaginatedTickResponseBody };
    const data = body.data;

    // Verify all existing fields are still present
    assertExists(data.page, "page field should exist");
    assertExists(data.limit, "limit field should exist");
    assertExists(data.mint_status, "mint_status field should exist");
    assertExists(data.data, "data array should exist");

    // market_data field should exist in response structure
    // It should be explicitly set (either null or an object)
    assertEquals(
      "market_data" in data,
      true,
      "market_data key should be present in response object"
    );

    // For token without market data, it should be null
    assertEquals(
      data.market_data,
      null,
      "market_data should be null for token without market data"
    );
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "GET /api/v2/src20/tick/[tick] - should verify KEVIN token has market_data populated",
  async fn() {
    const tick = "KEVIN"; // Known token with market data
    const response = await fetch(
      `${BASE_URL}/api/v2/src20/tick/${encodeURIComponent(tick)}?page=1&limit=10`
    );

    assertEquals(response.status, 200, "Response status should be 200");

    const body = await response.json() as { data: PaginatedTickResponseBody };
    const data = body.data;

    // Verify market_data field is present and populated
    assertExists(data.market_data, "market_data field should exist in response");

    if (data.market_data !== null && data.market_data !== undefined) {
      const marketData = data.market_data as SRC20MarketData;

      assertEquals(marketData.tick, tick, "market_data.tick should match KEVIN");
      assertExists(marketData.holderCount, "market_data.holderCount should exist");
      assertExists(marketData.marketCapBTC, "market_data.marketCapBTC should exist");

      // Verify numeric fields are valid numbers
      assertEquals(
        typeof marketData.holderCount,
        "number",
        "holderCount should be a number"
      );
      assertEquals(
        typeof marketData.marketCapBTC,
        "number",
        "marketCapBTC should be a number"
      );
      assertEquals(
        typeof marketData.volume24hBTC,
        "number",
        "volume24hBTC should be a number"
      );
      assertEquals(
        typeof marketData.dataQualityScore,
        "number",
        "dataQualityScore should be a number"
      );
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "GET /api/v2/src20/tick/[tick] - should maintain backward compatibility with existing API consumers",
  async fn() {
    const tick = "STAMP";
    const response = await fetch(
      `${BASE_URL}/api/v2/src20/tick/${encodeURIComponent(tick)}?page=1&limit=5`
    );

    assertEquals(response.status, 200, "Response status should be 200");

    const body = await response.json() as { data: PaginatedTickResponseBody };
    const data = body.data;

    // Verify ALL required fields from original schema are present
    const requiredFields = [
      "page",
      "limit",
      "total",
      "totalPages",
      "last_block",
      "mint_status",
      "data",
    ];

    for (const field of requiredFields) {
      assertEquals(
        field in data,
        true,
        `Required field '${field}' should exist in response`
      );
    }

    // Verify mint_status has all required fields
    const mintStatusFields = [
      "max_supply",
      "total_minted",
      "total_mints",
      "progress",
      "decimals",
      "limit",
      "tx_hash",
    ];

    for (const field of mintStatusFields) {
      assertEquals(
        field in data.mint_status,
        true,
        `Required field 'mint_status.${field}' should exist`
      );
    }

    // Verify data array contains transaction records with expected fields
    if (data.data.length > 0) {
      const firstTx = data.data[0];
      assertExists(firstTx.tick, "Transaction should have tick field");
      assertExists(firstTx.op, "Transaction should have op field");
    }

    // New field: market_data should be present but additive (non-breaking)
    assertEquals(
      "market_data" in data,
      true,
      "market_data field should be present (additive change)"
    );
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "GET /api/v2/src20/tick/[tick] - should handle URL-encoded tick parameters correctly",
  async fn() {
    const tick = "🔥"; // Emoji tick that requires URL encoding
    const response = await fetch(
      `${BASE_URL}/api/v2/src20/tick/${encodeURIComponent(tick)}?page=1&limit=10`
    );

    // Should not error even if tick doesn't exist
    assertEquals(
      response.status >= 200 && response.status < 500,
      true,
      "Should handle encoded tick parameter"
    );

    if (response.status === 200) {
      const body = await response.json() as { data: PaginatedTickResponseBody };
      const data = body.data;

      // market_data field should exist in structure
      assertEquals(
        "market_data" in data,
        true,
        "market_data field should exist even for special characters"
      );
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
