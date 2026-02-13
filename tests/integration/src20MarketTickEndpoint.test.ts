import { assertEquals, assertExists } from "$std/assert/mod.ts";
import type { SRC20MarketDataRow } from "$types/marketData.d.ts";

/**
 * Integration tests for /api/v2/src20/market/[tick] endpoint
 *
 * Tests:
 * 1. Returns market data for known tokens (STAMP, KEVIN)
 * 2. Case-insensitive tick matching works
 * 3. Returns 404 for non-existent tokens
 * 4. All SRC20MarketDataRow fields are present
 * 5. NULL vs 0 distinction is preserved for volume fields
 */

const BASE_URL = "http://localhost:8000";
const TIMEOUT_MS = 8000;

Deno.test({
  name: "SRC20 Market Tick Endpoint - Returns market data for known token STAMP",
  async fn() {
    const response = await fetch(`${BASE_URL}/api/v2/src20/market/STAMP`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await response.json();

    // Verify successful response
    assertEquals(response.status, 200);
    assertExists(data);

    // Verify it's a valid SRC20MarketDataRow structure
    assertExists(data.tick);
    assertEquals(data.tick, "STAMP");

    // Verify all required fields exist (may be null but should be present)
    const requiredFields: (keyof SRC20MarketDataRow)[] = [
      "tick",
      "price_btc",
      "price_usd",
      "floor_price_btc",
      "market_cap_btc",
      "market_cap_usd",
      "volume_24h_btc",
      "volume_7d_btc",
      "volume_30d_btc",
      "total_volume_btc",
      "holder_count",
      "circulating_supply",
      "price_change_24h_percent",
      "price_change_7d_percent",
      "price_change_30d_percent",
      "primary_exchange",
      "exchange_sources",
      "data_quality_score",
      "last_updated",
    ];

    for (const field of requiredFields) {
      assertEquals(
        field in data,
        true,
        `Field ${field} should exist in response`
      );
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SRC20 Market Tick Endpoint - Returns market data for known token KEVIN",
  async fn() {
    const response = await fetch(`${BASE_URL}/api/v2/src20/market/KEVIN`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await response.json();

    // Verify successful response
    assertEquals(response.status, 200);
    assertExists(data);
    assertExists(data.tick);
    assertEquals(data.tick, "KEVIN");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SRC20 Market Tick Endpoint - Case-insensitive matching (lowercase)",
  async fn() {
    const response = await fetch(`${BASE_URL}/api/v2/src20/market/stamp`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await response.json();

    // Should find the token regardless of case
    assertEquals(response.status, 200);
    assertExists(data);
    assertExists(data.tick);
    // The returned tick should match the database value (likely "STAMP")
    assertEquals(data.tick.toUpperCase(), "STAMP");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SRC20 Market Tick Endpoint - Case-insensitive matching (mixed case)",
  async fn() {
    const response = await fetch(`${BASE_URL}/api/v2/src20/market/KeViN`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await response.json();

    // Should find the token regardless of case
    assertEquals(response.status, 200);
    assertExists(data);
    assertExists(data.tick);
    assertEquals(data.tick.toUpperCase(), "KEVIN");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SRC20 Market Tick Endpoint - Returns 404 for non-existent token",
  async fn() {
    const response = await fetch(`${BASE_URL}/api/v2/src20/market/NONEXISTENTTOKEN123`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    // Should return 404 for non-existent token
    assertEquals(response.status, 404);

    const data = await response.json();
    assertExists(data);
    // Should contain an error message
    assertExists(data.error || data.message);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SRC20 Market Tick Endpoint - Returns 400 for empty tick",
  async fn() {
    const response = await fetch(`${BASE_URL}/api/v2/src20/market/`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    // Should return 400 for empty tick
    assertEquals(response.status, 400);

    const data = await response.json();
    assertExists(data);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SRC20 Market Tick Endpoint - Handles URL-encoded tick parameter",
  async fn() {
    const encodedTick = encodeURIComponent("STAMP");
    const response = await fetch(`${BASE_URL}/api/v2/src20/market/${encodedTick}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await response.json();

    // Should successfully decode and find the token
    assertEquals(response.status, 200);
    assertExists(data);
    assertExists(data.tick);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SRC20 Market Tick Endpoint - Preserves NULL vs 0 distinction in volume fields",
  async fn() {
    const response = await fetch(`${BASE_URL}/api/v2/src20/market/STAMP`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await response.json();

    assertEquals(response.status, 200);
    assertExists(data);

    // Check that volume fields are either null, "0", or a valid string number
    // They should NOT be converted to JavaScript numbers that lose NULL distinction
    const volumeFields = [
      "volume_24h_btc",
      "volume_7d_btc",
      "volume_30d_btc",
      "total_volume_btc",
    ];

    for (const field of volumeFields) {
      const value = data[field];

      // Value should be either null or a string (DECIMAL values from DB)
      const isValid = value === null || typeof value === "string";

      assertEquals(
        isValid,
        true,
        `Field ${field} should be null or string, got: ${typeof value} (${value})`
      );

      // If it's a string, it should be a valid number format
      if (typeof value === "string") {
        const parsed = parseFloat(value);
        assertEquals(
          isNaN(parsed),
          false,
          `Field ${field} should be a valid numeric string`
        );
      }
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SRC20 Market Tick Endpoint - Response structure matches SRC20MarketDataRow type",
  async fn() {
    const response = await fetch(`${BASE_URL}/api/v2/src20/market/STAMP`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await response.json();

    assertEquals(response.status, 200);

    // Verify type of each field matches SRC20MarketDataRow definition
    assertEquals(typeof data.tick, "string");

    // price_btc, price_usd, floor_price_btc are nullable strings
    assertEquals(
      data.price_btc === null || typeof data.price_btc === "string",
      true
    );
    assertEquals(
      data.price_usd === null || typeof data.price_usd === "string",
      true
    );
    assertEquals(
      data.floor_price_btc === null || typeof data.floor_price_btc === "string",
      true
    );

    // market_cap fields are strings (DECIMAL in DB)
    assertEquals(typeof data.market_cap_btc, "string");
    assertEquals(typeof data.market_cap_usd, "string");

    // volume fields are strings (DECIMAL in DB)
    assertEquals(typeof data.volume_24h_btc, "string");
    assertEquals(typeof data.volume_7d_btc, "string");
    assertEquals(typeof data.volume_30d_btc, "string");
    assertEquals(typeof data.total_volume_btc, "string");

    // holder_count is a number
    assertEquals(typeof data.holder_count, "number");

    // circulating_supply is a string
    assertEquals(typeof data.circulating_supply, "string");

    // price_change fields are strings (DECIMAL in DB)
    assertEquals(typeof data.price_change_24h_percent, "string");
    assertEquals(typeof data.price_change_7d_percent, "string");
    assertEquals(typeof data.price_change_30d_percent, "string");

    // primary_exchange is nullable string
    assertEquals(
      data.primary_exchange === null || typeof data.primary_exchange === "string",
      true
    );

    // exchange_sources is nullable string (JSON)
    assertEquals(
      data.exchange_sources === null || typeof data.exchange_sources === "string",
      true
    );

    // data_quality_score is a string
    assertEquals(typeof data.data_quality_score, "string");

    // last_updated is a Date (but JSON serializes to string)
    assertExists(data.last_updated);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
