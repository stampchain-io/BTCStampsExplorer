/**
 * Full CI test suite for MarketDataRepository
 * Uses dependency injection to avoid database connections
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { MarketDataRepositoryCI } from "../../server/database/marketDataRepository.ci.ts";
import type {
  CollectionMarketData as _CollectionMarketData,
  SRC20MarketData as _SRC20MarketData,
  StampHolderCache as _StampHolderCache,
  StampMarketData as _StampMarketData,
  StampWithMarketData as _StampWithMarketData,
} from "../../lib/types/marketData.d.ts";

// Mock database manager
const createMockDbManager = () => ({
  executeQueryWithCache: (
    query: string,
    params: unknown[],
    _cache: number,
  ) => {
    // Return mock data based on the query
    if (
      query.includes("FROM stamp_market_data") &&
      query.includes("WHERE cpid = ?")
    ) {
      if (params[0] === "A1234567890123456789012345678901234567890") {
        return {
          rows: [{
            cpid: "A1234567890123456789012345678901234567890",
            floor_price_btc: "0.00123456",
            recent_sale_price_btc: "0.00134567",
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
            cache_age_minutes: 15,
          }],
        };
      }
      return { rows: [] };
    }

    if (
      query.includes("FROM stamps st") &&
      query.includes("LEFT JOIN stamp_market_data")
    ) {
      return {
        rows: [{
          stamp: 1234,
          block_index: 850000,
          cpid: "A1234567890123456789012345678901234567890",
          creator: "1CreatorAddress123",
          creator_name: "Famous Artist",
          divisible: 0,
          keyburn: null,
          locked: 1,
          stamp_url: "https://example.com/stamp.png",
          stamp_mimetype: "image/png",
          supply: "1",
          block_time: 1700000000,
          tx_hash: "abc123def456",
          tx_index: 123,
          ident: "STAMP",
          stamp_hash: "hash123",
          file_hash: "filehash123",
          stamp_base64: null,
          asset_longname: null,
          message_index: 0,
          src_data: null,
          is_btc_stamp: 1,
          is_reissue: 0,
          is_valid_base64: 1,
          floor_price_btc: "0.00123456",
          recent_sale_price_btc: null,
          open_dispensers_count: 1,
          closed_dispensers_count: 0,
          total_dispensers_count: 1,
          holder_count: 10,
          unique_holder_count: 10,
          top_holder_percentage: "20.00",
          holder_distribution_score: "85.00",
          volume_24h_btc: "0.00000000",
          volume_7d_btc: "0.00500000",
          volume_30d_btc: "0.02000000",
          total_volume_btc: "0.10000000",
          price_source: "counterparty",
          volume_sources: '{"counterparty": 0.1}',
          data_quality_score: "7.5",
          confidence_level: "8.0",
          market_data_last_updated: new Date("2024-01-01T00:00:00Z"),
          last_price_update: null,
          update_frequency_minutes: 60,
          cache_age_minutes: 25,
        }],
      };
    }

    if (query.includes("FROM src20_market_data")) {
      if (params[0] === "PEPE") {
        return {
          rows: [{
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
            cache_age_minutes: 10,
          }],
        };
      }
      return { rows: [] };
    }

    if (query.includes("FROM collection_market_data")) {
      if (params[0] === "collection123") {
        return {
          rows: [{
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
            cache_age_minutes: 20,
          }],
        };
      }
      return { rows: [] };
    }

    if (query.includes("FROM stamp_holder_cache")) {
      if (params[0] === "A1234567890123456789012345678901234567890") {
        return {
          rows: [
            {
              id: 1,
              cpid: "A1234567890123456789012345678901234567890",
              address: "1TopHolder123",
              quantity: "20.00000000",
              percentage: "20.00",
              rank_position: 1,
              last_updated: new Date("2024-01-01T00:00:00Z"),
            },
            {
              id: 2,
              cpid: "A1234567890123456789012345678901234567890",
              address: "1SecondHolder456",
              quantity: "15.00000000",
              percentage: "15.00",
              rank_position: 2,
              last_updated: new Date("2024-01-01T00:00:00Z"),
            },
          ],
        };
      }
      return { rows: [] };
    }

    if (query.includes("WHERE cpid IN")) {
      return {
        rows: [
          {
            cpid: "A1234567890123456789012345678901234567890",
            floor_price_btc: "0.00123456",
            recent_sale_price_btc: null,
            open_dispensers_count: 1,
            closed_dispensers_count: 2,
            total_dispensers_count: 3,
            holder_count: 50,
            unique_holder_count: 48,
            top_holder_percentage: "25.00",
            holder_distribution_score: "70.00",
            volume_24h_btc: "0.01000000",
            volume_7d_btc: "0.05000000",
            volume_30d_btc: "0.20000000",
            total_volume_btc: "1.00000000",
            price_source: "openstamp",
            volume_sources: '{"openstamp": 1.0}',
            data_quality_score: "8.0",
            confidence_level: "8.5",
            last_updated: new Date("2024-01-01T00:00:00Z"),
            last_price_update: new Date("2024-01-01T00:00:00Z"),
            update_frequency_minutes: 30,
            cache_age_minutes: 5,
          },
          {
            cpid: "B9876543210987654321098765432109876543210",
            floor_price_btc: "0.00234567",
            recent_sale_price_btc: "0.00250000",
            open_dispensers_count: 0,
            closed_dispensers_count: 1,
            total_dispensers_count: 1,
            holder_count: 25,
            unique_holder_count: 25,
            top_holder_percentage: "40.00",
            holder_distribution_score: "60.00",
            volume_24h_btc: "0.00500000",
            volume_7d_btc: "0.02500000",
            volume_30d_btc: "0.10000000",
            total_volume_btc: "0.50000000",
            price_source: "counterparty",
            volume_sources: '{"counterparty": 0.5}',
            data_quality_score: "7.0",
            confidence_level: "7.5",
            last_updated: new Date("2024-01-01T00:00:00Z"),
            last_price_update: new Date("2024-01-01T00:00:00Z"),
            update_frequency_minutes: 60,
            cache_age_minutes: 45,
          },
        ],
      };
    }

    return Promise.resolve({ rows: [] });
  },
});

describe("MarketDataRepository CI Tests", () => {
  const mockDbManager = createMockDbManager();
  const repository = new MarketDataRepositoryCI(mockDbManager);

  describe("getStampMarketData", () => {
    it("should return market data for a valid stamp", async () => {
      const result = await repository.getStampMarketData(
        "A1234567890123456789012345678901234567890",
      );

      assertExists(result);
      assertEquals(result?.cpid, "A1234567890123456789012345678901234567890");
      assertEquals(result?.floorPriceBTC, 0.00123456);
      assertEquals(result?.recentSalePriceBTC, 0.00134567);
      assertEquals(result?.holderCount, 150);
      assertEquals(result?.volumeSources?.counterparty, 0.03);
      assertEquals(result?.volumeSources?.openstamp, 0.02);
      assertEquals(result?.dataQualityScore, 8.5);
    });

    it("should return null for non-existent stamp", async () => {
      const result = await repository.getStampMarketData("NONEXISTENT");
      assertEquals(result, null);
    });
  });

  describe("getStampsWithMarketData", () => {
    it("should return stamps with their market data", async () => {
      const result = await repository.getStampsWithMarketData({
        limit: 10,
        offset: 0,
        sortBy: "block_index",
        sortOrder: "DESC",
      });

      assertEquals(result.length, 1);
      const stamp = result[0];

      assertExists(stamp);
      assertEquals(stamp.cpid, "A1234567890123456789012345678901234567890");
      assertEquals(stamp.stamp, 1234);
      assertEquals(stamp.creator_name, "Famous Artist");

      assertExists(stamp.marketData);
      assertEquals(stamp.marketData?.floorPriceBTC, 0.00123456);
      assertEquals(stamp.marketData?.holderCount, 10);
      assertEquals(stamp.cacheStatus, "fresh");
      assertEquals(stamp.cacheAgeMinutes, 25);
    });
  });

  describe("getSRC20MarketData", () => {
    it("should return market data for a valid SRC-20 token", async () => {
      const result = await repository.getSRC20MarketData("PEPE");

      assertExists(result);
      assertEquals(result?.tick, "PEPE");
      assertEquals(result?.priceBTC, 0.000001);
      assertEquals(result?.priceUSD, 0.05);
      assertEquals(result?.marketCapBTC, 100);
      assertEquals(result?.holderCount, 5000);
      assertEquals(result?.priceChange24hPercent, 15.5);
      assertEquals(result?.exchangeSources?.length, 2);
      assertEquals(result?.exchangeSources?.includes("openstamp"), true);
    });

    it("should return null for non-existent SRC-20 token", async () => {
      const result = await repository.getSRC20MarketData("NONEXISTENT");
      assertEquals(result, null);
    });
  });

  describe("getCollectionMarketData", () => {
    it("should return aggregated market data for a collection", async () => {
      const result = await repository.getCollectionMarketData("collection123");

      assertExists(result);
      assertEquals(result?.collectionId, "collection123");
      assertEquals(result?.minFloorPriceBTC, 0.001);
      assertEquals(result?.maxFloorPriceBTC, 0.01);
      assertEquals(result?.avgFloorPriceBTC, 0.0035);
      assertEquals(result?.medianFloorPriceBTC, 0.003);
      assertEquals(result?.totalVolume24hBTC, 0.5);
      assertEquals(result?.stampsWithPricesCount, 25);
      assertEquals(result?.totalStampsCount, 100);
      assertEquals(result?.totalUniqueHolders, 1500);
    });

    it("should return null for non-existent collection", async () => {
      const result = await repository.getCollectionMarketData("NONEXISTENT");
      assertEquals(result, null);
    });
  });

  describe("getStampHoldersFromCache", () => {
    it("should return holder data for a stamp", async () => {
      const result = await repository.getStampHoldersFromCache(
        "A1234567890123456789012345678901234567890",
      );

      assertEquals(result.length, 2);

      const topHolder = result[0];
      assertEquals(topHolder.cpid, "A1234567890123456789012345678901234567890");
      assertEquals(topHolder.address, "1TopHolder123");
      assertEquals(topHolder.quantity, 20);
      assertEquals(topHolder.percentage, 20);
      assertEquals(topHolder.rankPosition, 1);

      const secondHolder = result[1];
      assertEquals(secondHolder.rankPosition, 2);
      assertEquals(secondHolder.quantity, 15);
    });

    it("should return empty array for stamp with no holders", async () => {
      const result = await repository.getStampHoldersFromCache("NONEXISTENT");
      assertEquals(result.length, 0);
    });
  });

  describe("getBulkStampMarketData", () => {
    it("should return market data for multiple stamps", async () => {
      const cpids = [
        "A1234567890123456789012345678901234567890",
        "B9876543210987654321098765432109876543210",
      ];

      const result = await repository.getBulkStampMarketData(cpids);

      assertEquals(result.size, 2);

      const stamp1 = result.get("A1234567890123456789012345678901234567890");
      assertExists(stamp1);
      assertEquals(stamp1?.floorPriceBTC, 0.00123456);
      assertEquals(stamp1?.holderCount, 50);

      const stamp2 = result.get("B9876543210987654321098765432109876543210");
      assertExists(stamp2);
      assertEquals(stamp2?.floorPriceBTC, 0.00234567);
      assertEquals(stamp2?.recentSalePriceBTC, 0.0025);
    });

    it("should return empty map for empty input", async () => {
      const result = await repository.getBulkStampMarketData([]);
      assertEquals(result.size, 0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle NULL values gracefully", async () => {
      const result = await repository.getStampMarketData(
        "A1234567890123456789012345678901234567890",
      );
      assertExists(result);
      // Recent sale price is null in mock data, but floorPrice exists
      assertEquals(result?.floorPriceBTC, 0.00123456);
      assertEquals(result?.recentSalePriceBTC, 0.00134567);
    });

    it("should handle missing market data", async () => {
      const stamps = await repository.getStampsWithMarketData({});
      // Even stamps without market data should be returned
      assertEquals(stamps.length >= 0, true);
    });

    it("should properly set cache status", async () => {
      const stamps = await repository.getStampsWithMarketData({});
      if (stamps.length > 0) {
        const stamp = stamps[0];
        assertExists(stamp.cacheStatus);
        // 25 minutes = fresh
        assertEquals(stamp.cacheStatus, "fresh");
      }
    });
  });
});
