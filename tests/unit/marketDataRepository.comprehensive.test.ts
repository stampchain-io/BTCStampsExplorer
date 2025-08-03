import { dbManager } from "$server/database/databaseManager.ts";
import { MarketDataRepository } from "$server/database/marketDataRepository.ts";
import { assertEquals, assertExists } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "jsr:@std/testing@1.0.14/bdd";
import { stub } from "@std/testing@1.0.14/mock";
import { MockDatabaseManager } from "../mocks/mockDatabaseManager.ts";

describe("MarketDataRepository Comprehensive Tests", () => {
  let queryStub: any;
  let mockDb: MockDatabaseManager;

  beforeEach(() => {
    mockDb = new MockDatabaseManager();
    MarketDataRepository.setDatabase(mockDb as any);
  });

  afterEach(() => {
    MarketDataRepository.setDatabase(dbManager);
    if (queryStub) {
      queryStub.restore();
      queryStub = undefined;
    }
  });

  describe("setDatabase", () => {
    it("should allow setting a custom database instance", () => {
      MarketDataRepository.setDatabase(mockDb as any);
      // Reset to original after test (handled in afterEach)
    });
  });

  describe("getStampsWithMarketData - edge cases", () => {
    it("should handle collectionId parameter", async () => {
      const mockRows = [{
        stamp: 1,
        block_index: 100,
        cpid: "TEST001",
        creator: "test_creator",
        creator_name: "Test Creator",
        divisible: false,
        keyburn: null,
        locked: 0,
        stamp_url: "https://test.com/stamp.png",
        stamp_mimetype: "image/png",
        supply: 1000,
        block_time: new Date(),
        tx_hash: "test_hash",
        ident: "STAMP",
        stamp_hash: "hash123",
        file_hash: "file123",
        stamp_base64: "base64data",
        unbound_quantity: 0,
        market_data_last_updated: null,
      }];

      queryStub = stub(
        mockDb,
        "executeQueryWithCache",
        (query: string, params: any[]) => {
          // Verify the query includes the collection join
          assertEquals(query.includes("JOIN collection_stamps"), true);
          assertEquals(params.includes("collection123"), true);
          return Promise.resolve({ rows: mockRows });
        },
      );

      const result = await MarketDataRepository.getStampsWithMarketData({
        collectionId: "collection123",
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertEquals(result.length, 1);
    });

    it("should handle stamps with market data", async () => {
      const mockRows = [{
        stamp: 1,
        block_index: 100,
        cpid: "TEST001",
        creator: "test_creator",
        creator_name: "Test Creator",
        divisible: false,
        keyburn: null,
        locked: 0,
        stamp_url: "https://test.com/stamp.png",
        stamp_mimetype: "image/png",
        supply: 1000,
        block_time: new Date(),
        tx_hash: "test_hash",
        ident: "STAMP",
        stamp_hash: "hash123",
        file_hash: "file123",
        stamp_base64: "base64data",
        unbound_quantity: 0,
        // Market data fields
        market_data_last_updated: new Date(),
        floor_price_btc: "0.00001500",
        recent_sale_price_btc: "0.00002000",
        open_dispensers_count: 5,
        closed_dispensers_count: 10,
        total_dispensers_count: 15,
        holder_count: 100,
        unique_holder_count: 95,
        top_holder_percentage: "15.5",
        holder_distribution_score: "8.5",
        volume_24h_btc: "0.10000000",
        volume_7d_btc: "0.50000000",
        volume_30d_btc: "2.00000000",
        total_volume_btc: "10.00000000",
        price_source: "dispensers",
        volume_sources: '{"dispensers": 0.8, "openstamp": 0.2}',
        data_quality_score: "9.5",
        confidence_level: "0.95",
        last_price_update: new Date(),
        update_frequency_minutes: 60,
        last_sale_tx_hash: "sale_tx_123",
        last_sale_buyer_address: "buyer_address",
        last_sale_dispenser_address: "dispenser_address",
        last_sale_btc_amount: "0.00002000",
        last_sale_dispenser_tx_hash: "dispenser_tx_123",
        last_sale_block_index: 99,
        activity_level: "high",
        last_activity_time: Date.now(),
        cache_age_minutes: 5,
      }];

      queryStub = stub(
        mockDb,
        "executeQueryWithCache",
        () => Promise.resolve({ rows: mockRows }),
      );

      const result = await MarketDataRepository.getStampsWithMarketData({
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertEquals(result.length, 1);
      const stamp = result[0];
      assertExists(stamp.marketData);
      assertEquals(stamp.marketData?.cpid, "TEST001");
      assertEquals(stamp.marketData?.floorPriceBTC, 0.000015);
      assertEquals(stamp.marketData?.holderCount, 100);
      assertEquals(stamp.cacheStatus, "FRESH"); // Implementation returns uppercase
      assertEquals(stamp.cacheAgeMinutes, 5);
    });

    it("should handle stamps without market data", async () => {
      const mockRows = [{
        stamp: 1,
        block_index: 100,
        cpid: "TEST002",
        creator: "test_creator",
        creator_name: "Test Creator",
        divisible: false,
        keyburn: null,
        locked: 0,
        stamp_url: "https://test.com/stamp2.png",
        stamp_mimetype: "image/png",
        supply: 1000,
        block_time: new Date(),
        tx_hash: "test_hash2",
        ident: "STAMP",
        stamp_hash: "hash456",
        file_hash: "file456",
        stamp_base64: "base64data2",
        unbound_quantity: 0,
        market_data_last_updated: null,
      }];

      queryStub = stub(
        mockDb,
        "executeQueryWithCache",
        () => Promise.resolve({ rows: mockRows }),
      );

      const result = await MarketDataRepository.getStampsWithMarketData({
        limit: 10,
        offset: 0,
      });

      assertExists(result);
      assertEquals(result.length, 1);
      const stamp = result[0];
      assertEquals(stamp.marketData, null);
      assertEquals(
        stamp.marketDataMessage,
        "No market data available for this stamp",
      );
      assertEquals(stamp.cacheStatus, undefined);
      assertEquals(stamp.cacheAgeMinutes, undefined);
    });

    it("should handle database error in getStampsWithMarketData", async () => {
      queryStub = stub(
        mockDb,
        "executeQueryWithCache",
        () => Promise.reject(new Error("Database connection failed")),
      );

      const result = await MarketDataRepository.getStampsWithMarketData({
        limit: 10,
        offset: 0,
      });

      assertEquals(result, []);
    });

    it("should handle filters parameter", async () => {
      queryStub = stub(
        mockDb,
        "executeQueryWithCache",
        () => Promise.resolve({ rows: [] }),
      );

      const result = await MarketDataRepository.getStampsWithMarketData({
        filters: {
          market: "",
          dispensers: false,
          atomics: false,
          listings: "",
          listingsMin: "",
          listingsMax: "",
          sales: "",
          salesMin: "",
          salesMax: "",
          volume: "",
          volumeMin: "",
          volumeMax: "",
          fileType: [],
          fileSize: null,
          fileSizeMin: "",
          fileSizeMax: "",
          editions: [],
          range: null,
          rangeMin: "",
          rangeMax: "",
        },
        limit: 10,
        offset: 0,
      });

      assertEquals(result, []);
    });

    it("should handle sorting parameters", async () => {
      queryStub = stub(
        mockDb,
        "executeQueryWithCache",
        (query: string) => {
          // Verify the query includes the correct ORDER BY
          assertEquals(query.includes("ORDER BY st.cpid ASC"), true);
          return Promise.resolve({ rows: [] });
        },
      );

      await MarketDataRepository.getStampsWithMarketData({
        sortBy: "cpid",
        sortOrder: "ASC",
        limit: 10,
        offset: 0,
      });
    });

    it("should handle result without rows property", async () => {
      queryStub = stub(
        mockDb,
        "executeQueryWithCache",
        () => Promise.resolve({}), // No rows property
      );

      const result = await MarketDataRepository.getStampsWithMarketData({
        limit: 10,
        offset: 0,
      });

      assertEquals(result, []);
    });
  });

  describe("parseStampMarketDataRow error handling", () => {
    it("should handle parsing errors gracefully", async () => {
      const invalidRow = {
        cpid: "TEST001",
        floor_price_btc: "invalid_number",
        recent_sale_price_btc: null,
        open_dispensers_count: null,
        closed_dispensers_count: null,
        total_dispensers_count: null,
        holder_count: null,
        unique_holder_count: null,
        top_holder_percentage: "not_a_number",
        holder_distribution_score: "not_a_number",
        volume_24h_btc: null,
        volume_7d_btc: null,
        volume_30d_btc: null,
        total_volume_btc: null,
        price_source: null,
        volume_sources: "invalid_json",
        data_quality_score: "not_a_number",
        confidence_level: "not_a_number",
        last_updated: "invalid_date",
        last_price_update: null,
        update_frequency_minutes: null,
        cache_age_minutes: 10,
      };

      queryStub = stub(
        mockDb,
        "executeQueryWithCache",
        () => Promise.resolve({ rows: [invalidRow] }),
      );

      const result = await MarketDataRepository.getStampMarketData("TEST001");
      // Even with parsing errors, it should still return a result with defaults
      assertExists(result);
    });
  });

  describe("getSRC20MarketData error handling", () => {
    it("should handle database error", async () => {
      queryStub = stub(
        mockDb,
        "executeQueryWithCache",
        () => Promise.reject(new Error("Connection timeout")),
      );

      const result = await MarketDataRepository.getSRC20MarketData("ERROR");
      assertEquals(result, null);
    });
  });

  describe("getCollectionMarketData error handling", () => {
    it("should handle database error", async () => {
      queryStub = stub(
        mockDb,
        "executeQueryWithCache",
        () => Promise.reject(new Error("Query failed")),
      );

      const result = await MarketDataRepository.getCollectionMarketData(
        "collection123",
      );
      assertEquals(result, null);
    });
  });

  describe("getStampHoldersFromCache error handling", () => {
    it("should handle database error", async () => {
      queryStub = stub(
        mockDb,
        "executeQueryWithCache",
        () => Promise.reject(new Error("Cache unavailable")),
      );

      const result = await MarketDataRepository.getStampHoldersFromCache(
        "TEST001",
      );
      assertEquals(result, []);
    });
  });

  describe("getBulkStampMarketData error handling", () => {
    it("should handle database error", async () => {
      queryStub = stub(
        mockDb,
        "executeQueryWithCache",
        () => Promise.reject(new Error("Bulk query failed")),
      );

      const result = await MarketDataRepository.getBulkStampMarketData([
        "TEST001",
        "TEST002",
      ]);
      assertExists(result);
      assertEquals(result.size, 0);
    });

    it("should handle result without rows", async () => {
      queryStub = stub(
        mockDb,
        "executeQueryWithCache",
        () => Promise.resolve({}), // No rows property
      );

      const result = await MarketDataRepository.getBulkStampMarketData([
        "TEST001",
      ]);
      assertExists(result);
      assertEquals(result.size, 0);
    });
  });

  describe("parseSRC20MarketDataRow error handling", () => {
    it("should handle invalid row data", async () => {
      const invalidRow = {
        tick: "TEST",
        price_btc: "invalid",
        price_usd: "invalid",
        floor_price_btc: "invalid",
        market_cap_btc: "invalid",
        market_cap_usd: "invalid",
        volume_24h_btc: "invalid",
        volume_7d_btc: "invalid",
        volume_30d_btc: "invalid",
        total_volume_btc: "invalid",
        holder_count: null,
        circulating_supply: null,
        price_change_24h_percent: "invalid",
        price_change_7d_percent: "invalid",
        price_change_30d_percent: "invalid",
        primary_exchange: null,
        exchange_sources: "invalid_json",
        data_quality_score: "invalid",
        last_updated: "invalid_date",
        cache_age_minutes: 5,
      };

      queryStub = stub(
        mockDb,
        "executeQueryWithCache",
        () => Promise.resolve({ rows: [invalidRow] }),
      );

      const result = await MarketDataRepository.getSRC20MarketData("TEST");
      // Should still return a result with defaults
      assertExists(result);
    });
  });

  describe("parseCollectionMarketDataRow error handling", () => {
    it("should handle invalid row data", async () => {
      const invalidRow = {
        collection_id: "test_collection",
        min_floor_price_btc: "invalid",
        max_floor_price_btc: "invalid",
        avg_floor_price_btc: "invalid",
        median_floor_price_btc: "invalid",
        total_volume_24h_btc: "invalid",
        stamps_with_prices_count: null,
        min_holder_count: null,
        max_holder_count: null,
        avg_holder_count: "invalid",
        median_holder_count: null,
        total_unique_holders: null,
        avg_distribution_score: "invalid",
        total_stamps_count: null,
        last_updated: "invalid_date",
        cache_age_minutes: 5,
      };

      queryStub = stub(
        mockDb,
        "executeQueryWithCache",
        () => Promise.resolve({ rows: [invalidRow] }),
      );

      const result = await MarketDataRepository.getCollectionMarketData(
        "test_collection",
      );
      // Should still return a result with defaults
      assertExists(result);
    });
  });
});
