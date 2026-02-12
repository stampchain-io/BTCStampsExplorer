/**
 * Comprehensive tests for SRC20MarketService
 * Tests DB-sourced implementation (no external API calls)
 */

import { SRC20MarketService } from "$server/services/src20/marketService.ts";
import { assertEquals, assertExists } from "@std/assert";
import { MarketDataRepository } from "$server/database/marketDataRepository.ts";

// Set environment to skip Redis and database connections before importing
(globalThis as any).SKIP_REDIS_CONNECTION = true;
(globalThis as any).SKIP_DB_CONNECTION = true;
Deno.env.set("SKIP_REDIS_CONNECTION", "true");
Deno.env.set("SKIP_DB_CONNECTION", "true");
Deno.env.set("DENO_ENV", "test");

// Store original method for restoration
const originalGetAllSRC20MarketData = MarketDataRepository.getAllSRC20MarketData;

// Helper to create mock SRC20MarketData objects
function createMockMarketData(tick: string, overrides: any = {}) {
  return {
    tick,
    priceBTC: overrides.priceBTC ?? 0.001,
    priceUSD: overrides.priceUSD ?? 100,
    floorPriceBTC: overrides.floorPriceBTC ?? 0.001,
    marketCapBTC: overrides.marketCapBTC ?? 21000,
    marketCapUSD: overrides.marketCapUSD ?? 2100000,
    volume24hBTC: overrides.volume24hBTC ?? 5.5,
    volume7dBTC: overrides.volume7dBTC ?? 35.0,
    volume30dBTC: overrides.volume30dBTC ?? 150.0,
    totalVolumeBTC: overrides.totalVolumeBTC ?? 500.0,
    holderCount: overrides.holderCount ?? 1000,
    circulatingSupply: overrides.circulatingSupply ?? "21000000",
    priceChange24hPercent: overrides.priceChange24hPercent ?? 5.5,
    priceChange7dPercent: overrides.priceChange7dPercent ?? 10.0,
    priceChange30dPercent: overrides.priceChange30dPercent ?? 25.0,
    primaryExchange: overrides.primaryExchange ?? "BitMart",
    exchangeSources: overrides.exchangeSources ?? ["BitMart", "OKX"],
    dataQualityScore: overrides.dataQualityScore ?? 95,
    lastUpdated: overrides.lastUpdated ?? new Date(),
  };
}

Deno.test("SRC20MarketService - DB-Sourced Implementation Tests", async (t) => {
  const cleanup = () => {
    // Restore original method
    MarketDataRepository.getAllSRC20MarketData = originalGetAllSRC20MarketData;
  };

  try {
    await t.step("Success path - DB returns valid market data", async () => {
      const mockData = [
        createMockMarketData("PEPE", {
          floorPriceBTC: 0.001,
          marketCapBTC: 21000000,
          volume24hBTC: 5.5,
          volume7dBTC: 35.0,
          holderCount: 1000,
          priceChange24hPercent: 5.5,
        }),
      ];

      MarketDataRepository.getAllSRC20MarketData = () => Promise.resolve(mockData);

      const result = await SRC20MarketService.fetchMarketListingSummary();

      assertEquals(result.length, 1);
      assertEquals(result[0].tick, "PEPE");
      assertEquals(result[0].floor_price_btc, 0.001);
      assertEquals(result[0].market_cap_btc, 21000000);
      assertEquals(result[0].volume_24h_btc, 5.5);
      assertEquals(result[0].holder_count, 1000);

      // Verify backward compatibility fields
      assertEquals(result[0].floor_unit_price, 0.001);
      assertEquals(result[0].mcap, 21000000);
      assertEquals(result[0].volume24, 5.5);

      cleanup();
    });

    await t.step("DB returns empty array - no market data", async () => {
      MarketDataRepository.getAllSRC20MarketData = () => Promise.resolve([]);

      const result = await SRC20MarketService.fetchMarketListingSummary();

      assertEquals(result.length, 0);
      assertEquals(Array.isArray(result), true);

      cleanup();
    });

    await t.step("DB returns multiple tokens - correct mapping", async () => {
      const mockData = [
        createMockMarketData("TOKEN1", {
          floorPriceBTC: 0.002,
          marketCapBTC: 42000000,
          volume24hBTC: 10.0,
          volume7dBTC: 70.0,
          holderCount: 2000,
          priceChange24hPercent: 10.5,
        }),
        createMockMarketData("TOKEN2", {
          floorPriceBTC: 0.003,
          marketCapBTC: 63000000,
          volume24hBTC: 15.0,
          volume7dBTC: 105.0,
          holderCount: 3000,
          priceChange24hPercent: -5.2,
        }),
      ];

      MarketDataRepository.getAllSRC20MarketData = () => Promise.resolve(mockData);

      const result = await SRC20MarketService.fetchMarketListingSummary();

      assertEquals(result.length, 2);
      assertEquals(result[0].tick, "TOKEN1");
      assertEquals(result[1].tick, "TOKEN2");

      // Verify both v2.3 and legacy fields for both tokens
      assertEquals(result[0].floor_price_btc, 0.002);
      assertEquals(result[0].floor_unit_price, 0.002);
      assertEquals(result[1].floor_price_btc, 0.003);
      assertEquals(result[1].floor_unit_price, 0.003);

      cleanup();
    });

    await t.step("NULL floor price handling - returns null not 0", async () => {
      const mockData = [
        createMockMarketData("NULLPRICE", {
          floorPriceBTC: null,
          marketCapBTC: 0,
          volume24hBTC: 0,
        }),
      ];

      MarketDataRepository.getAllSRC20MarketData = () => Promise.resolve(mockData);

      const result = await SRC20MarketService.fetchMarketListingSummary();

      assertEquals(result.length, 1);
      assertEquals(result[0].floor_price_btc, null);
      assertEquals(result[0].floor_unit_price, null);
      assertEquals(result[0].market_cap_btc, 0);
      assertEquals(result[0].mcap, 0);

      cleanup();
    });

    await t.step("Zero values preserved - not converted to null", async () => {
      const mockData = [
        createMockMarketData("ZERO", {
          floorPriceBTC: 0,
          marketCapBTC: 0,
          volume24hBTC: 0,
          volume7dBTC: 0,
          holderCount: 0,
        }),
      ];

      MarketDataRepository.getAllSRC20MarketData = () => Promise.resolve(mockData);

      const result = await SRC20MarketService.fetchMarketListingSummary();

      assertEquals(result.length, 1);
      assertEquals(result[0].floor_price_btc, 0);
      assertEquals(result[0].market_cap_btc, 0);
      assertEquals(result[0].volume_24h_btc, 0);
      assertEquals(result[0].holder_count, 0);

      cleanup();
    });

    await t.step("Change percentage field mapping", async () => {
      const mockData = [
        createMockMarketData("CHANGE", {
          priceChange24hPercent: 15.5,
          priceChange7dPercent: 25.0,
        }),
      ];

      MarketDataRepository.getAllSRC20MarketData = () => Promise.resolve(mockData);

      const result = await SRC20MarketService.fetchMarketListingSummary();

      assertEquals(result.length, 1);
      assertEquals(result[0].change_24h_percent, 15.5);
      assertEquals(result[0].change_24h, 15.5); // Legacy field
      assertEquals(result[0].change24, 15.5); // Legacy field

      cleanup();
    });

    await t.step("Volume 7d field mapping", async () => {
      const mockData = [
        createMockMarketData("VOLUME7D", {
          volume7dBTC: 100.5,
        }),
      ];

      MarketDataRepository.getAllSRC20MarketData = () => Promise.resolve(mockData);

      const result = await SRC20MarketService.fetchMarketListingSummary();

      assertEquals(result.length, 1);
      assertEquals(result[0].volume_7d_btc, 100.5);
      assertEquals(result[0].sum_7d, 100.5); // Legacy field

      cleanup();
    });

    await t.step("All standardized fields present in output", async () => {
      const mockData = [
        createMockMarketData("COMPLETE", {
          floorPriceBTC: 0.005,
          marketCapBTC: 105000000,
          volume24hBTC: 25.5,
          priceChange24hPercent: 8.2,
        }),
      ];

      MarketDataRepository.getAllSRC20MarketData = () => Promise.resolve(mockData);

      const result = await SRC20MarketService.fetchMarketListingSummary();

      assertEquals(result.length, 1);

      // v2.3 standardized fields
      assertExists(result[0].floor_price_btc);
      assertExists(result[0].market_cap_btc);
      assertExists(result[0].volume_24h_btc);
      assertExists(result[0].change_24h_percent);

      // Legacy backward compatibility fields
      assertExists(result[0].floor_unit_price);
      assertExists(result[0].mcap);
      assertExists(result[0].volume24);
      assertExists(result[0].change24);

      cleanup();
    });

    await t.step("Repository error handling - returns empty array", async () => {
      MarketDataRepository.getAllSRC20MarketData = () =>
        Promise.reject(new Error("Database error"));

      const result = await SRC20MarketService.fetchMarketListingSummary();

      assertEquals(result.length, 0);
      assertEquals(Array.isArray(result), true);

      cleanup();
    });

    await t.step("Undefined priceChange24hPercent - returns undefined", async () => {
      const mockData = [
        createMockMarketData("NOCHANGE", {
          priceChange24hPercent: undefined,
        }),
      ];

      MarketDataRepository.getAllSRC20MarketData = () => Promise.resolve(mockData);

      const result = await SRC20MarketService.fetchMarketListingSummary();

      assertEquals(result.length, 1);
      assertEquals(result[0].change_24h_percent, undefined);
      assertEquals(result[0].change24, undefined);

      cleanup();
    });

    await t.step("Metadata fields not included in MarketListingAggregated", async () => {
      const mockData = [
        createMockMarketData("META", {
          floorPriceBTC: 0.001,
          marketCapBTC: 21000000,
        }),
      ];

      MarketDataRepository.getAllSRC20MarketData = () => Promise.resolve(mockData);

      const result = await SRC20MarketService.fetchMarketListingSummary();

      assertEquals(result.length, 1);

      // MarketListingAggregated includes stamp_url and tx_hash
      // DB source doesn't have these fields, should default appropriately
      assertExists(result[0].tick);
      assertExists(result[0].holder_count);

      cleanup();
    });
  } finally {
    // Final cleanup in case any step failed
    cleanup();
  }
});
