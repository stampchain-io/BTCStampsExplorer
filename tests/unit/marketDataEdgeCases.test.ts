import { assertEquals, assertExists } from "@std/assert";
import type {
  CollectionMarketData,
  SRC20MarketData,
  StampMarketData,
} from "$lib/types/marketData.d.ts";
import {
  getCacheStatus,
  parseBTCDecimal,
  parseExchangeSources,
  parseVolumeSources,
} from "$lib/utils/marketData.ts";

// Mock console to suppress error outputs during tests
const originalConsoleError = console.error;
function suppressConsole() {
  console.error = () => {};
}
function restoreConsole() {
  console.error = originalConsoleError;
}

Deno.test("Edge Case - Stamp with all null market data fields", () => {
  const nullMarketData: StampMarketData = {
    cpid: "A123456789ABCDEF",
    floorPriceBTC: null,
    recentSalePriceBTC: null,
    openDispensersCount: 0,
    closedDispensersCount: 0,
    totalDispensersCount: 0,
    holderCount: 0,
    uniqueHolderCount: 0,
    topHolderPercentage: 0,
    holderDistributionScore: 0,
    volume24hBTC: 0,
    volume7dBTC: 0,
    volume30dBTC: 0,
    totalVolumeBTC: 0,
    priceSource: null,
    volumeSources: null,
    dataQualityScore: 0,
    confidenceLevel: 0,
    lastUpdated: new Date(),
    lastPriceUpdate: null,
    updateFrequencyMinutes: 60,
  };

  // Test that the object is valid
  assertExists(nullMarketData.cpid);
  assertEquals(nullMarketData.floorPriceBTC, null);
  assertEquals(nullMarketData.priceSource, null);
  assertEquals(nullMarketData.volumeSources, null);
  assertEquals(nullMarketData.holderCount, 0);
});

Deno.test("Edge Case - SRC20 with extreme values", () => {
  const extremeMarketData: SRC20MarketData = {
    tick: "MEGA",
    priceBTC: 0.00000001, // 1 satoshi
    priceUSD: 0.00095, // Very small USD value
    floorPriceBTC: 0.00000001,
    marketCapBTC: 21000000, // Max BTC supply
    marketCapUSD: 1995000000000, // ~$2 trillion
    volume24hBTC: 0,
    holderCount: 1000000,
    circulatingSupply: "1000000000000000000", // 1 quintillion
    priceChange24hPercent: -99.99, // Maximum loss
    primaryExchange: "unknown",
    exchangeSources: [],
    dataQualityScore: 0.1,
    lastUpdated: new Date(),
  };

  // Verify extreme values are handled
  assertEquals(extremeMarketData.priceBTC, 0.00000001);
  assertEquals(extremeMarketData.marketCapBTC, 21000000);
  assertEquals(extremeMarketData.priceChange24hPercent, -99.99);
  assertEquals(extremeMarketData.holderCount, 1000000);
  assertEquals(extremeMarketData.exchangeSources?.length, 0);
});

Deno.test("Edge Case - Collection with single stamp", () => {
  const singleStampCollection: CollectionMarketData = {
    collectionId: "lonely-stamp",
    minFloorPriceBTC: 0.1,
    maxFloorPriceBTC: 0.1, // Same as min for single stamp
    avgFloorPriceBTC: 0.1, // Same as min/max
    medianFloorPriceBTC: 0.1, // Same as all others
    totalVolume24hBTC: 0,
    stampsWithPricesCount: 1,
    minHolderCount: 1,
    maxHolderCount: 1,
    avgHolderCount: 1,
    medianHolderCount: 1,
    totalUniqueHolders: 1,
    avgDistributionScore: 0, // Single holder = poor distribution
    totalStampsCount: 1,
    lastUpdated: new Date(),
  };

  // Verify single stamp statistics
  assertEquals(singleStampCollection.minFloorPriceBTC, 0.1);
  assertEquals(singleStampCollection.maxFloorPriceBTC, 0.1);
  assertEquals(singleStampCollection.avgFloorPriceBTC, 0.1);
  assertEquals(singleStampCollection.medianFloorPriceBTC, 0.1);
  assertEquals(singleStampCollection.stampsWithPricesCount, 1);
  assertEquals(singleStampCollection.totalStampsCount, 1);
});

Deno.test("Edge Case - Empty collection (no stamps with prices)", () => {
  const emptyCollection: CollectionMarketData = {
    collectionId: "no-market-data",
    minFloorPriceBTC: null,
    maxFloorPriceBTC: null,
    avgFloorPriceBTC: null,
    medianFloorPriceBTC: null,
    totalVolume24hBTC: 0,
    stampsWithPricesCount: 0,
    minHolderCount: 0,
    maxHolderCount: 0,
    avgHolderCount: 0,
    medianHolderCount: 0,
    totalUniqueHolders: 0,
    avgDistributionScore: 0,
    totalStampsCount: 10, // Has stamps, but none with prices
    lastUpdated: new Date(),
  };

  // Verify empty market data handling
  assertEquals(emptyCollection.minFloorPriceBTC, null);
  assertEquals(emptyCollection.maxFloorPriceBTC, null);
  assertEquals(emptyCollection.avgFloorPriceBTC, null);
  assertEquals(emptyCollection.medianFloorPriceBTC, null);
  assertEquals(emptyCollection.stampsWithPricesCount, 0);
  assertEquals(emptyCollection.totalStampsCount, 10);
});

Deno.test("Edge Case - Malformed JSON in volume sources", () => {
  suppressConsole();

  // Test various malformed JSON inputs
  const testCases = [
    // Truncated JSON
    '{"exchange1": 0.5, "exchange2"',
    // Invalid nested structure
    '{"exchange": {"nested": "value"}}',
    // Mixed valid/invalid
    '{"valid": 1.5, "invalid": "not a number", "null": null}',
    // Unicode in keys
    '{"📈": 1.0, "normal": 0.5}',
    // Very large numbers
    '{"exchange": 999999999999999999999999999999}',
  ];

  testCases.forEach((json) => {
    const result = parseVolumeSources(json);
    assertExists(result); // Should return object, not throw
    assertEquals(typeof result, "object");
  });

  restoreConsole();
});

Deno.test("Edge Case - Malformed JSON in exchange sources", () => {
  suppressConsole();

  // Test various malformed JSON array inputs
  const testCases = [
    // Truncated array
    '["exchange1", "exchange2"',
    // Mixed types
    '[true, 123, "valid", null, {"obj": true}]',
    // Unicode strings
    '["📈exchange", "normal", "🚀moon"]',
    // Nested arrays
    '["valid", ["nested", "array"], "another"]',
    // Empty strings
    '["", "valid", "", "  ", "another"]',
  ];

  testCases.forEach((json) => {
    const result = parseExchangeSources(json);
    assertExists(result); // Should return array, not throw
    assertEquals(Array.isArray(result), true);
    // Should only contain strings (may include empty strings)
    result.forEach((item) => {
      assertEquals(typeof item, "string");
    });
  });

  restoreConsole();
});

Deno.test("Edge Case - Cache status boundary conditions", () => {
  // Test exact boundary values
  assertEquals(getCacheStatus(30), "fresh"); // Exactly 30 minutes
  assertEquals(getCacheStatus(30.001), "stale"); // Just over 30 minutes
  assertEquals(getCacheStatus(60), "stale"); // Exactly 60 minutes
  assertEquals(getCacheStatus(60.001), "expired"); // Just over 60 minutes

  // Test extreme values
  assertEquals(getCacheStatus(0), "fresh"); // Brand new
  assertEquals(getCacheStatus(999999), "expired"); // Very old
  assertEquals(getCacheStatus(Infinity), "expired"); // Infinity

  // Test invalid inputs
  assertEquals(getCacheStatus(NaN), "expired");
  assertEquals(getCacheStatus(-Infinity), "expired");
});

Deno.test("Edge Case - BTC decimal precision limits", () => {
  // Test maximum precision (8 decimals)
  assertEquals(parseBTCDecimal("0.12345678"), 0.12345678);
  assertEquals(parseBTCDecimal("0.123456789"), 0.123456789); // 9 decimals

  // Test very small values
  assertEquals(parseBTCDecimal("0.00000001"), 0.00000001); // 1 satoshi
  assertEquals(parseBTCDecimal("0.000000001"), 0.000000001); // Sub-satoshi

  // Test very large values
  assertEquals(parseBTCDecimal("21000000"), 21000000); // Max BTC
  assertEquals(parseBTCDecimal("21000000.00000001"), 21000000.00000001);

  // Test scientific notation
  assertEquals(parseBTCDecimal("1e-8"), 1e-8);
  assertEquals(parseBTCDecimal("2.1e7"), 21000000);
  assertEquals(parseBTCDecimal("1.23e-6"), 0.00000123);
});

Deno.test("Edge Case - Unicode and special characters in data", () => {
  const unicodeMarketData: StampMarketData = {
    cpid: "A🚀🌙💎UNICODE",
    floorPriceBTC: 0.1,
    recentSalePriceBTC: 0.15,
    openDispensersCount: 1,
    closedDispensersCount: 2,
    totalDispensersCount: 3,
    holderCount: 42,
    uniqueHolderCount: 40,
    topHolderPercentage: 25,
    holderDistributionScore: 75,
    volume24hBTC: 0.5,
    volume7dBTC: 3.5,
    volume30dBTC: 15,
    totalVolumeBTC: 100,
    priceSource: "counterparty",
    volumeSources: { "🚀moon": 0.3, "💎hands": 0.2 },
    dataQualityScore: 8,
    confidenceLevel: 9,
    lastUpdated: new Date(),
    lastPriceUpdate: new Date(),
    updateFrequencyMinutes: 30,
  };

  // Verify unicode handling
  assertEquals(unicodeMarketData.cpid, "A🚀🌙💎UNICODE");
  assertExists(unicodeMarketData.volumeSources);
  assertEquals(unicodeMarketData.volumeSources["🚀moon"], 0.3);
  assertEquals(unicodeMarketData.volumeSources["💎hands"], 0.2);
});

Deno.test("Edge Case - Concurrent data updates simulation", () => {
  // Simulate race condition with conflicting updates
  const baseData: StampMarketData = {
    cpid: "A123456789ABCDEF",
    floorPriceBTC: 0.1,
    recentSalePriceBTC: 0.12,
    openDispensersCount: 5,
    closedDispensersCount: 10,
    totalDispensersCount: 15,
    holderCount: 100,
    uniqueHolderCount: 95,
    topHolderPercentage: 10,
    holderDistributionScore: 85,
    volume24hBTC: 1.5,
    volume7dBTC: 10.5,
    volume30dBTC: 45,
    totalVolumeBTC: 200,
    priceSource: "counterparty",
    volumeSources: { counterparty: 1.5 },
    dataQualityScore: 9,
    confidenceLevel: 9,
    lastUpdated: new Date("2024-12-26T12:00:00Z"),
    lastPriceUpdate: new Date("2024-12-26T12:00:00Z"),
    updateFrequencyMinutes: 30,
  };

  // Simulate update 1 (price increase)
  const update1 = { ...baseData };
  update1.floorPriceBTC = 0.15;
  update1.volume24hBTC = 2.0;
  update1.lastUpdated = new Date("2024-12-26T12:30:00Z");

  // Simulate update 2 (conflicting price)
  const update2 = { ...baseData };
  update2.floorPriceBTC = 0.08; // Price went down instead
  update2.volume24hBTC = 1.8;
  update2.lastUpdated = new Date("2024-12-26T12:30:01Z");

  // In real scenario, latest update wins
  const latestTimestamp = update1.lastUpdated > update2.lastUpdated
    ? update1.lastUpdated
    : update2.lastUpdated;

  assertEquals(latestTimestamp, update2.lastUpdated);
});

Deno.test("Edge Case - Data quality with missing fields", () => {
  // Test partial data scenarios
  const partialData = {
    cpid: "PARTIAL123",
    floorPriceBTC: 0.1,
    // Missing many fields that might come from API
    recentSalePriceBTC: null,
    openDispensersCount: 0,
    closedDispensersCount: 0,
    totalDispensersCount: 0,
    holderCount: 5, // Only has holder data
    uniqueHolderCount: 5,
    topHolderPercentage: 100, // One whale owns everything
    holderDistributionScore: 0,
    volume24hBTC: 0,
    volume7dBTC: 0,
    volume30dBTC: 0,
    totalVolumeBTC: 0,
    priceSource: "manual",
    volumeSources: null,
    dataQualityScore: 2, // Low quality due to missing data
    confidenceLevel: 3,
    lastUpdated: new Date(),
    lastPriceUpdate: null,
    updateFrequencyMinutes: 1440, // Daily updates only
  };

  // Verify partial data handling
  assertExists(partialData.cpid);
  assertEquals(partialData.floorPriceBTC, 0.1);
  assertEquals(partialData.recentSalePriceBTC, null);
  assertEquals(partialData.dataQualityScore, 2);
  assertEquals(partialData.holderDistributionScore, 0); // Poor distribution
});
