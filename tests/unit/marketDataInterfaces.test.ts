import { assertEquals, assertExists } from "@std/assert";
import type {
  CacheStatus,
  CollectionMarketData,
  CollectionMarketDataRow,
  ExchangeSources,
  SRC20MarketData,
  SRC20MarketDataRow,
  StampMarketData,
  StampMarketDataRow,
  VolumeSources,
} from "$lib/types/marketData.d.ts";
import {
  getCacheStatus,
  parseBTCDecimal,
  parseExchangeSources,
  parseVolumeSources,
} from "$lib/utils/marketData.ts";

// Test data fixtures
const stampMarketDataRowFixture: StampMarketDataRow = {
  cpid: "A123456789ABCDEF",
  floor_price_btc: "0.00015000",
  recent_sale_price_btc: "0.00018000",
  open_dispensers_count: 3,
  closed_dispensers_count: 7,
  total_dispensers_count: 10,
  holder_count: 42,
  unique_holder_count: 40,
  top_holder_percentage: "15.50",
  holder_distribution_score: "78.00",
  volume_24h_btc: "0.12500000",
  volume_7d_btc: "0.87500000",
  volume_30d_btc: "2.34500000",
  total_volume_btc: "5.67800000",
  price_source: "counterparty",
  volume_sources: '{"counterparty": 0.1, "exchange_a": 0.025}',
  data_quality_score: "8.5",
  confidence_level: "9.0",
  last_updated: new Date("2024-12-26T12:00:00Z"),
  last_price_update: new Date("2024-12-26T11:30:00Z"),
  update_frequency_minutes: 30,
};

const src20MarketDataRowFixture: SRC20MarketDataRow = {
  tick: "PEPE",
  price_btc: "0.00000012",
  price_usd: "0.01000000",
  floor_price_btc: "0.00000010",
  market_cap_btc: "1234.56000000",
  market_cap_usd: "123456.78",
  volume_24h_btc: "12.34000000",
  holder_count: 1523,
  circulating_supply: "1000000000000",
  price_change_24h_percent: "15.67",
  primary_exchange: "openstamp",
  exchange_sources: '["openstamp", "kucoin", "stampscan"]',
  data_quality_score: "9.2",
  last_updated: new Date("2024-12-26T12:00:00Z"),
};

const collectionMarketDataRowFixture: CollectionMarketDataRow = {
  collection_id: "rare-pepes",
  min_floor_price_btc: "0.00100000",
  max_floor_price_btc: "0.50000000",
  avg_floor_price_btc: "0.05000000",
  median_floor_price_btc: "0.03000000",
  total_volume_24h_btc: "2.50000000",
  stamps_with_prices_count: 45,
  min_holder_count: 5,
  max_holder_count: 150,
  avg_holder_count: "42.50",
  median_holder_count: 35,
  total_unique_holders: 500,
  avg_distribution_score: "65.25",
  total_stamps_count: 60,
  last_updated: new Date("2024-12-26T12:00:00Z"),
};

// Helper functions to parse database rows
function parseStampMarketDataRow(
  row: StampMarketDataRow,
): StampMarketData {
  return {
    cpid: row.cpid,
    floorPriceBTC: parseBTCDecimal(row.floor_price_btc),
    recentSalePriceBTC: parseBTCDecimal(row.recent_sale_price_btc),
    openDispensersCount: row.open_dispensers_count,
    closedDispensersCount: row.closed_dispensers_count,
    totalDispensersCount: row.total_dispensers_count,
    holderCount: row.holder_count,
    uniqueHolderCount: row.unique_holder_count,
    topHolderPercentage: parseFloat(row.top_holder_percentage),
    holderDistributionScore: parseFloat(row.holder_distribution_score),
    volume24hBTC: parseFloat(row.volume_24h_btc),
    volume7dBTC: parseFloat(row.volume_7d_btc),
    volume30dBTC: parseFloat(row.volume_30d_btc),
    totalVolumeBTC: parseFloat(row.total_volume_btc),
    priceSource: row.price_source,
    volumeSources: row.volume_sources
      ? parseVolumeSources(row.volume_sources)
      : null,
    dataQualityScore: parseFloat(row.data_quality_score),
    confidenceLevel: parseFloat(row.confidence_level),
    lastUpdated: row.last_updated,
    lastPriceUpdate: row.last_price_update,
    updateFrequencyMinutes: row.update_frequency_minutes,
  };
}

function parseSRC20MarketDataRow(row: SRC20MarketDataRow): SRC20MarketData {
  return {
    tick: row.tick,
    priceBTC: parseBTCDecimal(row.price_btc),
    priceUSD: parseBTCDecimal(row.price_usd),
    floorPriceBTC: parseBTCDecimal(row.floor_price_btc),
    marketCapBTC: parseFloat(row.market_cap_btc),
    marketCapUSD: parseFloat(row.market_cap_usd),
    volume24hBTC: parseFloat(row.volume_24h_btc),
    holderCount: row.holder_count,
    circulatingSupply: row.circulating_supply,
    priceChange24hPercent: parseFloat(row.price_change_24h_percent),
    primaryExchange: row.primary_exchange,
    exchangeSources: row.exchange_sources
      ? parseExchangeSources(row.exchange_sources)
      : null,
    dataQualityScore: parseFloat(row.data_quality_score),
    lastUpdated: row.last_updated,
  };
}

function parseCollectionMarketDataRow(
  row: CollectionMarketDataRow,
): CollectionMarketData {
  return {
    collectionId: row.collection_id,
    minFloorPriceBTC: parseBTCDecimal(row.min_floor_price_btc),
    maxFloorPriceBTC: parseBTCDecimal(row.max_floor_price_btc),
    avgFloorPriceBTC: parseBTCDecimal(row.avg_floor_price_btc),
    medianFloorPriceBTC: parseBTCDecimal(row.median_floor_price_btc),
    totalVolume24hBTC: parseFloat(row.total_volume_24h_btc),
    stampsWithPricesCount: row.stamps_with_prices_count,
    minHolderCount: row.min_holder_count,
    maxHolderCount: row.max_holder_count,
    avgHolderCount: parseFloat(row.avg_holder_count),
    medianHolderCount: row.median_holder_count,
    totalUniqueHolders: row.total_unique_holders,
    avgDistributionScore: parseFloat(row.avg_distribution_score),
    totalStampsCount: row.total_stamps_count,
    lastUpdated: row.last_updated,
  };
}

Deno.test("StampMarketData interface - DECIMAL string to number conversion", () => {
  const parsed = parseStampMarketDataRow(stampMarketDataRowFixture);

  // Test DECIMAL conversions
  assertEquals(parsed.floorPriceBTC, 0.00015);
  assertEquals(parsed.recentSalePriceBTC, 0.00018);
  assertEquals(parsed.topHolderPercentage, 15.5);
  assertEquals(parsed.holderDistributionScore, 78);
  assertEquals(parsed.volume24hBTC, 0.125);
  assertEquals(parsed.volume7dBTC, 0.875);
  assertEquals(parsed.volume30dBTC, 2.345);
  assertEquals(parsed.totalVolumeBTC, 5.678);
  assertEquals(parsed.dataQualityScore, 8.5);
  assertEquals(parsed.confidenceLevel, 9);

  // Test non-decimal fields
  assertEquals(parsed.cpid, "A123456789ABCDEF");
  assertEquals(parsed.holderCount, 42);
  assertEquals(parsed.priceSource, "counterparty");
  assertEquals(parsed.updateFrequencyMinutes, 30);

  // Test JSON parsing
  assertExists(parsed.volumeSources);
  assertEquals(parsed.volumeSources?.counterparty, 0.1);
  assertEquals(parsed.volumeSources?.exchange_a, 0.025);

  // Test date fields
  assertExists(parsed.lastUpdated);
  assertExists(parsed.lastPriceUpdate);
});

Deno.test("StampMarketData interface - handles null values correctly", () => {
  const nullRow: StampMarketDataRow = {
    ...stampMarketDataRowFixture,
    floor_price_btc: null,
    recent_sale_price_btc: null,
    price_source: null,
    volume_sources: null,
    last_price_update: null,
  };

  const parsed = parseStampMarketDataRow(nullRow);

  assertEquals(parsed.floorPriceBTC, null);
  assertEquals(parsed.recentSalePriceBTC, null);
  assertEquals(parsed.priceSource, null);
  assertEquals(parsed.volumeSources, null);
  assertEquals(parsed.lastPriceUpdate, null);
});

Deno.test("SRC20MarketData interface - DECIMAL string to number conversion", () => {
  const parsed = parseSRC20MarketDataRow(src20MarketDataRowFixture);

  // Test DECIMAL conversions
  assertEquals(parsed.priceBTC, 0.00000012);
  assertEquals(parsed.priceUSD, 0.01);
  assertEquals(parsed.floorPriceBTC, 0.0000001);
  assertEquals(parsed.marketCapBTC, 1234.56);
  assertEquals(parsed.marketCapUSD, 123456.78);
  assertEquals(parsed.volume24hBTC, 12.34);
  assertEquals(parsed.priceChange24hPercent, 15.67);
  assertEquals(parsed.dataQualityScore, 9.2);

  // Test non-decimal fields
  assertEquals(parsed.tick, "PEPE");
  assertEquals(parsed.holderCount, 1523);
  assertEquals(parsed.circulatingSupply, "1000000000000");
  assertEquals(parsed.primaryExchange, "openstamp");

  // Test JSON array parsing
  assertExists(parsed.exchangeSources);
  assertEquals(parsed.exchangeSources?.length, 3);
  assertEquals(parsed.exchangeSources?.[0], "openstamp");
  assertEquals(parsed.exchangeSources?.[1], "kucoin");
  assertEquals(parsed.exchangeSources?.[2], "stampscan");
});

Deno.test("SRC20MarketData interface - handles null values correctly", () => {
  const nullRow: SRC20MarketDataRow = {
    ...src20MarketDataRowFixture,
    price_btc: null,
    price_usd: null,
    floor_price_btc: null,
    primary_exchange: null,
    exchange_sources: null,
  };

  const parsed = parseSRC20MarketDataRow(nullRow);

  assertEquals(parsed.priceBTC, null);
  assertEquals(parsed.priceUSD, null);
  assertEquals(parsed.floorPriceBTC, null);
  assertEquals(parsed.primaryExchange, null);
  assertEquals(parsed.exchangeSources, null);
});

Deno.test("CollectionMarketData interface - aggregated data conversion", () => {
  const parsed = parseCollectionMarketDataRow(collectionMarketDataRowFixture);

  // Test DECIMAL conversions
  assertEquals(parsed.minFloorPriceBTC, 0.001);
  assertEquals(parsed.maxFloorPriceBTC, 0.5);
  assertEquals(parsed.avgFloorPriceBTC, 0.05);
  assertEquals(parsed.medianFloorPriceBTC, 0.03);
  assertEquals(parsed.totalVolume24hBTC, 2.5);
  assertEquals(parsed.avgHolderCount, 42.5);
  assertEquals(parsed.avgDistributionScore, 65.25);

  // Test integer fields
  assertEquals(parsed.stampsWithPricesCount, 45);
  assertEquals(parsed.minHolderCount, 5);
  assertEquals(parsed.maxHolderCount, 150);
  assertEquals(parsed.medianHolderCount, 35);
  assertEquals(parsed.totalUniqueHolders, 500);
  assertEquals(parsed.totalStampsCount, 60);

  // Test string fields
  assertEquals(parsed.collectionId, "rare-pepes");
});

Deno.test("CollectionMarketData interface - handles null price ranges", () => {
  const nullRow: CollectionMarketDataRow = {
    ...collectionMarketDataRowFixture,
    min_floor_price_btc: null,
    max_floor_price_btc: null,
    avg_floor_price_btc: null,
    median_floor_price_btc: null,
  };

  const parsed = parseCollectionMarketDataRow(nullRow);

  assertEquals(parsed.minFloorPriceBTC, null);
  assertEquals(parsed.maxFloorPriceBTC, null);
  assertEquals(parsed.avgFloorPriceBTC, null);
  assertEquals(parsed.medianFloorPriceBTC, null);
});

Deno.test("JSON parsing with malformed data", () => {
  // Test volume sources parsing
  const malformedVolume = '{"invalid": "not a number", "valid": 1.5}';
  const volumeResult = parseVolumeSources(malformedVolume);
  assertEquals(volumeResult, { valid: 1.5 }); // Invalid entry filtered out

  // Test exchange sources parsing
  const malformedExchanges = '["valid", null, 123, "another"]';
  const exchangeResult = parseExchangeSources(malformedExchanges);
  assertEquals(exchangeResult, ["valid", "another"]); // Non-strings filtered out

  // Test completely invalid JSON
  const invalidJson = "{this is not json}";
  assertEquals(parseVolumeSources(invalidJson), {});
  assertEquals(parseExchangeSources(invalidJson), []);
});

Deno.test("Cache status type validation", () => {
  // Test type assignment
  const freshStatus: CacheStatus = "fresh";
  const staleStatus: CacheStatus = "stale";
  const expiredStatus: CacheStatus = "expired";

  assertEquals(freshStatus, "fresh");
  assertEquals(staleStatus, "stale");
  assertEquals(expiredStatus, "expired");

  // Test with getCacheStatus function
  assertEquals(getCacheStatus(15), "fresh");
  assertEquals(getCacheStatus(45), "stale");
  assertEquals(getCacheStatus(90), "expired");
});

Deno.test("Volume and Exchange sources type validation", () => {
  // Test VolumeSources type
  const volumeSources: VolumeSources = {
    counterparty: 0.5,
    openstamp: 1.2,
    stampscan: 0.3,
  };

  assertExists(volumeSources.counterparty);
  assertEquals(typeof volumeSources.counterparty, "number");

  // Test ExchangeSources type
  const exchangeSources: ExchangeSources = ["openstamp", "kucoin", "stampscan"];

  assertEquals(Array.isArray(exchangeSources), true);
  assertEquals(exchangeSources.length, 3);
  assertEquals(typeof exchangeSources[0], "string");
});

Deno.test("Interface extension with market data", () => {
  // Mock stamp with market data
  const stampWithMarketData = {
    cpid: "A123456789ABCDEF",
    // ... other stamp fields
    marketData: parseStampMarketDataRow(stampMarketDataRowFixture),
    marketDataMessage: undefined,
    cacheStatus: "fresh" as CacheStatus,
    cacheAgeMinutes: 15,
  };

  assertExists(stampWithMarketData.marketData);
  assertEquals(stampWithMarketData.marketData.cpid, "A123456789ABCDEF");
  assertEquals(stampWithMarketData.cacheStatus, "fresh");
  assertEquals(stampWithMarketData.cacheAgeMinutes, 15);

  // Mock stamp without market data
  const stampWithoutMarketData = {
    cpid: "B987654321FEDCBA",
    // ... other stamp fields
    marketData: null,
    marketDataMessage: "Market data is being processed",
    cacheStatus: "expired" as CacheStatus,
    cacheAgeMinutes: undefined,
  };

  assertEquals(stampWithoutMarketData.marketData, null);
  assertEquals(
    stampWithoutMarketData.marketDataMessage,
    "Market data is being processed",
  );
  assertEquals(stampWithoutMarketData.cacheStatus, "expired");
});
