/**
 * CI-friendly version of market data repository tests
 * This version properly isolates database dependencies for CI environments
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  getCacheStatus,
  parseBTCDecimal,
  parseExchangeSources,
  parseVolumeSources,
} from "../../lib/utils/marketData.ts";
import type {
  CollectionMarketData,
  SRC20MarketData,
  StampHolderCache,
  StampMarketData,
} from "../../lib/types/marketData.d.ts";

describe("MarketDataRepository Utils (CI Safe)", () => {
  describe("parseBTCDecimal", () => {
    it("should parse valid BTC decimal strings", () => {
      assertEquals(parseBTCDecimal("0.00123456"), 0.00123456);
      assertEquals(parseBTCDecimal("1.23456789"), 1.23456789);
      assertEquals(parseBTCDecimal("0"), 0);
    });

    it("should return null for invalid values", () => {
      assertEquals(parseBTCDecimal(null), null);
      assertEquals(parseBTCDecimal(undefined), null);
      assertEquals(parseBTCDecimal("invalid"), null);
      assertEquals(parseBTCDecimal(""), null);
    });
  });

  describe("parseVolumeSources", () => {
    it("should parse valid volume sources JSON", () => {
      const json = '{"counterparty": 0.5, "openstamp": 1.2}';
      const result = parseVolumeSources(json);
      assertEquals(result.counterparty, 0.5);
      assertEquals(result.openstamp, 1.2);
    });

    it("should return empty object for invalid JSON", () => {
      assertEquals(parseVolumeSources(null), {});
      assertEquals(parseVolumeSources(undefined), {});
      assertEquals(parseVolumeSources("invalid json"), {});
      assertEquals(parseVolumeSources("[]"), {});
    });
  });

  describe("parseExchangeSources", () => {
    it("should parse valid exchange sources JSON", () => {
      const json = '["openstamp", "kucoin", "stampscan"]';
      const result = parseExchangeSources(json);
      assertEquals(result.length, 3);
      assertEquals(result.includes("openstamp"), true);
      assertEquals(result.includes("kucoin"), true);
      assertEquals(result.includes("stampscan"), true);
    });

    it("should return empty array for invalid JSON", () => {
      assertEquals(parseExchangeSources(null), []);
      assertEquals(parseExchangeSources(undefined), []);
      assertEquals(parseExchangeSources("invalid json"), []);
      assertEquals(parseExchangeSources("{}"), []);
    });
  });

  describe("getCacheStatus", () => {
    it("should return 'fresh' for cache <= 30 minutes", () => {
      assertEquals(getCacheStatus(0), "fresh");
      assertEquals(getCacheStatus(15), "fresh");
      assertEquals(getCacheStatus(30), "fresh");
    });

    it("should return 'stale' for cache 31-60 minutes", () => {
      assertEquals(getCacheStatus(31), "stale");
      assertEquals(getCacheStatus(45), "stale");
      assertEquals(getCacheStatus(60), "stale");
    });

    it("should return 'expired' for cache > 60 minutes", () => {
      assertEquals(getCacheStatus(61), "expired");
      assertEquals(getCacheStatus(120), "expired");
      assertEquals(getCacheStatus(1440), "expired");
    });

    it("should return 'expired' for invalid values", () => {
      assertEquals(getCacheStatus(null), "expired");
      assertEquals(getCacheStatus(undefined), "expired");
      assertEquals(getCacheStatus(-1), "expired");
    });
  });
});

// Test data parsing functions that would be used by the repository
describe("Market Data Parsing (CI Safe)", () => {
  it("should correctly parse stamp market data", () => {
    const mockRow = {
      cpid: "A1234567890123456789012345678901234567890",
      floor_price_btc: "0.00123456",
      recent_sale_price_btc: null,
      open_dispensers_count: 2,
      closed_dispensers_count: 5,
      total_dispensers_count: 7,
      holder_count: 150,
      unique_holder_count: 145,
      top_holder_percentage: "15.50",
      holder_distribution_score: "78.50",
      volume_24h_btc: "0.05000000",
      volume_7d_btc: "0.25000000",
      volume_30d_btc: "1.00000000",
      total_volume_btc: "5.00000000",
      price_source: "counterparty",
      volume_sources: '{"counterparty": 0.03, "openstamp": 0.02}',
      data_quality_score: "8.5",
      confidence_level: "9.0",
      last_updated: new Date("2024-01-01T00:00:00Z"),
      last_price_update: new Date("2024-01-01T00:00:00Z"),
      update_frequency_minutes: 30,
    };

    // Simulate parsing
    const parsed: StampMarketData = {
      cpid: mockRow.cpid,
      floorPriceBTC: parseBTCDecimal(mockRow.floor_price_btc),
      recentSalePriceBTC: parseBTCDecimal(mockRow.recent_sale_price_btc),
      openDispensersCount: mockRow.open_dispensers_count,
      closedDispensersCount: mockRow.closed_dispensers_count,
      totalDispensersCount: mockRow.total_dispensers_count,
      holderCount: mockRow.holder_count,
      uniqueHolderCount: mockRow.unique_holder_count,
      topHolderPercentage: parseFloat(mockRow.top_holder_percentage),
      holderDistributionScore: parseFloat(mockRow.holder_distribution_score),
      volume24hBTC: parseBTCDecimal(mockRow.volume_24h_btc) || 0,
      volume7dBTC: parseBTCDecimal(mockRow.volume_7d_btc) || 0,
      volume30dBTC: parseBTCDecimal(mockRow.volume_30d_btc) || 0,
      totalVolumeBTC: parseBTCDecimal(mockRow.total_volume_btc) || 0,
      priceSource: mockRow.price_source,
      volumeSources: parseVolumeSources(mockRow.volume_sources),
      dataQualityScore: parseFloat(mockRow.data_quality_score),
      confidenceLevel: parseFloat(mockRow.confidence_level),
      lastUpdated: mockRow.last_updated,
      lastPriceUpdate: mockRow.last_price_update,
      updateFrequencyMinutes: mockRow.update_frequency_minutes,
    };

    assertEquals(parsed.cpid, "A1234567890123456789012345678901234567890");
    assertEquals(parsed.floorPriceBTC, 0.00123456);
    assertEquals(parsed.recentSalePriceBTC, null);
    assertEquals(parsed.holderCount, 150);
    assertEquals(parsed.topHolderPercentage, 15.5);
    assertEquals(parsed.volumeSources?.counterparty, 0.03);
  });

  it("should correctly parse SRC20 market data", () => {
    const mockRow = {
      tick: "PEPE",
      price_btc: "0.00000100",
      price_usd: "0.05",
      floor_price_btc: "0.00000095",
      market_cap_btc: "100.00000000",
      market_cap_usd: "5000000.00",
      volume_24h_btc: "5.00000000",
      holder_count: 5000,
      circulating_supply: "100000000000",
      price_change_24h_percent: "15.50",
      primary_exchange: "openstamp",
      exchange_sources: '["openstamp", "stampscan"]',
      data_quality_score: "9.0",
      last_updated: new Date("2024-01-01T00:00:00Z"),
    };

    // Simulate parsing
    const parsed: SRC20MarketData = {
      tick: mockRow.tick,
      priceBTC: parseBTCDecimal(mockRow.price_btc),
      priceUSD: parseBTCDecimal(mockRow.price_usd),
      floorPriceBTC: parseBTCDecimal(mockRow.floor_price_btc),
      marketCapBTC: parseBTCDecimal(mockRow.market_cap_btc) || 0,
      marketCapUSD: parseBTCDecimal(mockRow.market_cap_usd) || 0,
      volume24hBTC: parseBTCDecimal(mockRow.volume_24h_btc) || 0,
      holderCount: mockRow.holder_count,
      circulatingSupply: mockRow.circulating_supply,
      priceChange24hPercent: parseFloat(mockRow.price_change_24h_percent),
      primaryExchange: mockRow.primary_exchange,
      exchangeSources: parseExchangeSources(mockRow.exchange_sources),
      dataQualityScore: parseFloat(mockRow.data_quality_score),
      lastUpdated: mockRow.last_updated,
    };

    assertEquals(parsed.tick, "PEPE");
    assertEquals(parsed.priceBTC, 0.000001);
    assertEquals(parsed.marketCapBTC, 100);
    assertEquals(parsed.holderCount, 5000);
    assertEquals(parsed.exchangeSources?.includes("openstamp"), true);
  });

  it("should correctly parse collection market data", () => {
    const mockRow = {
      collection_id: "collection123",
      min_floor_price_btc: "0.00100000",
      max_floor_price_btc: "0.01000000",
      avg_floor_price_btc: "0.00350000",
      median_floor_price_btc: "0.00300000",
      total_volume_24h_btc: "0.50000000",
      stamps_with_prices_count: 25,
      min_holder_count: 5,
      max_holder_count: 500,
      avg_holder_count: "50.50",
      median_holder_count: 30,
      total_unique_holders: 1500,
      avg_distribution_score: "75.50",
      total_stamps_count: 100,
      last_updated: new Date("2024-01-01T00:00:00Z"),
    };

    // Simulate parsing
    const parsed: CollectionMarketData = {
      collectionId: mockRow.collection_id,
      minFloorPriceBTC: parseBTCDecimal(mockRow.min_floor_price_btc),
      maxFloorPriceBTC: parseBTCDecimal(mockRow.max_floor_price_btc),
      avgFloorPriceBTC: parseBTCDecimal(mockRow.avg_floor_price_btc),
      medianFloorPriceBTC: parseBTCDecimal(mockRow.median_floor_price_btc),
      totalVolume24hBTC: parseBTCDecimal(mockRow.total_volume_24h_btc) || 0,
      stampsWithPricesCount: mockRow.stamps_with_prices_count,
      minHolderCount: mockRow.min_holder_count,
      maxHolderCount: mockRow.max_holder_count,
      avgHolderCount: parseFloat(mockRow.avg_holder_count),
      medianHolderCount: mockRow.median_holder_count,
      totalUniqueHolders: mockRow.total_unique_holders,
      avgDistributionScore: parseFloat(mockRow.avg_distribution_score),
      totalStampsCount: mockRow.total_stamps_count,
      lastUpdated: mockRow.last_updated,
    };

    assertEquals(parsed.collectionId, "collection123");
    assertEquals(parsed.minFloorPriceBTC, 0.001);
    assertEquals(parsed.maxFloorPriceBTC, 0.01);
    assertEquals(parsed.avgFloorPriceBTC, 0.0035);
    assertEquals(parsed.totalUniqueHolders, 1500);
  });

  it("should correctly parse holder cache data", () => {
    const mockRow = {
      id: 1,
      cpid: "A1234567890123456789012345678901234567890",
      address: "1TopHolder123",
      quantity: "20.00000000",
      percentage: "20.00",
      rank_position: 1,
      last_updated: new Date("2024-01-01T00:00:00Z"),
    };

    // Simulate parsing
    const parsed: StampHolderCache = {
      id: mockRow.id,
      cpid: mockRow.cpid,
      address: mockRow.address,
      quantity: parseBTCDecimal(mockRow.quantity) || 0,
      percentage: parseFloat(mockRow.percentage),
      rankPosition: mockRow.rank_position,
      lastUpdated: mockRow.last_updated,
    };

    assertEquals(parsed.cpid, "A1234567890123456789012345678901234567890");
    assertEquals(parsed.address, "1TopHolder123");
    assertEquals(parsed.quantity, 20);
    assertEquals(parsed.percentage, 20);
    assertEquals(parsed.rankPosition, 1);
  });
});
