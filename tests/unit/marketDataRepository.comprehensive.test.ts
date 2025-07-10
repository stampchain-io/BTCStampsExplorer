/**
 * @fileoverview Comprehensive unit tests for MarketDataRepository class
 * Tests all public methods using MockDatabaseManager and fixtures
 * Ensures CI compatibility with proper mocking
 */

import { assertEquals, assertExists } from "@std/assert";
import { MockDatabaseManager } from "../mocks/mockDatabaseManager.ts";
import { MarketDataRepository } from "../../server/database/marketDataRepository.ts";
// Note: Type imports are not needed for this test file since we're testing behavior, not types

// Mock database manager instance
const mockDb = new MockDatabaseManager();

// Set up dependency injection
MarketDataRepository.setDatabase(mockDb as any);

// Helper to create mock market data row
function createMockStampMarketDataRow(cpid: string) {
  return {
    cpid,
    floor_price_btc: "0.01000000",
    recent_sale_price_btc: "0.01500000",
    open_dispensers_count: 2,
    closed_dispensers_count: 1,
    total_dispensers_count: 3,
    holder_count: 10,
    unique_holder_count: 8,
    top_holder_percentage: "25.50",
    holder_distribution_score: "7.8",
    volume_24h_btc: "0.05000000",
    volume_7d_btc: "0.20000000",
    volume_30d_btc: "0.80000000",
    total_volume_btc: "5.00000000",
    price_source: "dispenser",
    volume_sources: '{"counterparty": 1.0}',
    data_quality_score: "8.5",
    confidence_level: "9.0",
    last_updated: "2025-07-10T10:00:00.000Z",
    last_price_update: "2025-07-10T09:30:00.000Z",
    update_frequency_minutes: 30,
    last_sale_tx_hash: "abc123",
    last_sale_buyer_address: "buyer123",
    last_sale_dispenser_address: "dispenser123",
    last_sale_btc_amount: "0.01500000",
    last_sale_dispenser_tx_hash: "dispenser_tx_123",
    last_sale_block_index: 875000,
    activity_level: "high",
    last_activity_time: "2025-07-10T09:45:00.000Z",
    cache_age_minutes: 15,
  };
}

// Helper to create mock SRC20 market data row
function createMockSRC20MarketDataRow(tick: string) {
  return {
    tick,
    price_btc: "0.00001000",
    price_usd: "0.65",
    floor_price_btc: "0.00000800",
    market_cap_btc: "10.50000000",
    market_cap_usd: "682500.00",
    volume_24h_btc: "1.25000000",
    volume_7d_btc: "8.75000000",
    volume_30d_btc: "35.00000000",
    total_volume_btc: "150.00000000",
    holder_count: 500,
    circulating_supply: "1000000",
    price_change_24h_percent: "5.25",
    price_change_7d_percent: "-2.10",
    price_change_30d_percent: "15.80",
    primary_exchange: "counterparty",
    exchange_sources: '{"counterparty": 0.8, "emblem": 0.2}',
    data_quality_score: "9.2",
    last_updated: "2025-07-10T10:00:00.000Z",
    cache_age_minutes: 10,
  };
}

// Helper to create mock collection market data row
function createMockCollectionMarketDataRow(collectionId: string) {
  return {
    collection_id: collectionId,
    min_floor_price_btc: "0.00500000",
    max_floor_price_btc: "0.05000000",
    avg_floor_price_btc: "0.01750000",
    median_floor_price_btc: "0.01500000",
    total_volume_24h_btc: "2.50000000",
    stamps_with_prices_count: 25,
    min_holder_count: 1,
    max_holder_count: 50,
    avg_holder_count: "12.5",
    median_holder_count: 10,
    total_unique_holders: 200,
    avg_distribution_score: "6.8",
    total_stamps_count: 100,
    last_updated: "2025-07-10T09:00:00.000Z",
    cache_age_minutes: 60,
  };
}

// Helper to create mock holder cache row
function createMockHolderCacheRow(cpid: string, address: string, rank: number) {
  return {
    id: rank,
    cpid,
    address,
    quantity: "1000.00000000",
    percentage: "10.50",
    rank_position: rank,
    last_updated: "2025-07-10T08:00:00.000Z",
  };
}

Deno.test("MarketDataRepository.getStampMarketData", async (t) => {
  await t.step("returns market data for existing stamp", async () => {
    const cpid = "A123456789012345678";
    const mockRow = createMockStampMarketDataRow(cpid);

    mockDb.setMockResponse(
      "SELECT cpid, floor_price_btc, recent_sale_price_btc, open_dispensers_count, closed_dispensers_count, total_dispensers_count, holder_count, unique_holder_count, top_holder_percentage, holder_distribution_score, volume_24h_btc, volume_7d_btc, volume_30d_btc, total_volume_btc, price_source, volume_sources, data_quality_score, confidence_level, last_updated, last_price_update, update_frequency_minutes, last_sale_tx_hash, last_sale_buyer_address, last_sale_dispenser_address, last_sale_btc_amount, last_sale_dispenser_tx_hash, last_sale_block_index, activity_level, last_activity_time, TIMESTAMPDIFF(MINUTE, last_updated, UTC_TIMESTAMP()) as cache_age_minutes FROM stamp_market_data WHERE cpid = ? LIMIT 1",
      [cpid],
      { rows: [mockRow] },
    );

    const result = await MarketDataRepository.getStampMarketData(cpid);

    assertExists(result);
    assertEquals(result.cpid, cpid);
    assertEquals(result.floorPriceBTC, 0.01);
    assertEquals(result.recentSalePriceBTC, 0.015);
    assertEquals(result.openDispensersCount, 2);
    assertEquals(result.holderCount, 10);
    assertEquals(result.priceSource, "dispenser");
    assertEquals(result.lastSaleTxHash, "abc123");
    assertEquals(result.activityLevel, "high");
  });

  await t.step("returns null for non-existent stamp", async () => {
    const cpid = "NONEXISTENT";

    mockDb.setMockResponse(
      "SELECT cpid, floor_price_btc, recent_sale_price_btc, open_dispensers_count, closed_dispensers_count, total_dispensers_count, holder_count, unique_holder_count, top_holder_percentage, holder_distribution_score, volume_24h_btc, volume_7d_btc, volume_30d_btc, total_volume_btc, price_source, volume_sources, data_quality_score, confidence_level, last_updated, last_price_update, update_frequency_minutes, last_sale_tx_hash, last_sale_buyer_address, last_sale_dispenser_address, last_sale_btc_amount, last_sale_dispenser_tx_hash, last_sale_block_index, activity_level, last_activity_time, TIMESTAMPDIFF(MINUTE, last_updated, UTC_TIMESTAMP()) as cache_age_minutes FROM stamp_market_data WHERE cpid = ? LIMIT 1",
      [cpid],
      { rows: [] },
    );

    const result = await MarketDataRepository.getStampMarketData(cpid);
    assertEquals(result, null);
  });

  await t.step("handles database errors gracefully", async () => {
    const cpid = "ERROR_CASE";

    // Mock will throw error by default for unmatched queries
    const result = await MarketDataRepository.getStampMarketData(cpid);
    assertEquals(result, null);
  });
});

Deno.test("MarketDataRepository.getSRC20MarketData", async (t) => {
  await t.step("returns market data for existing SRC20 token", async () => {
    const tick = "PEPE";
    const mockRow = createMockSRC20MarketDataRow(tick);

    mockDb.setMockResponse(
      "SELECT tick, price_btc, price_usd, floor_price_btc, market_cap_btc, market_cap_usd, volume_24h_btc, volume_7d_btc, volume_30d_btc, total_volume_btc, holder_count, circulating_supply, price_change_24h_percent, price_change_7d_percent, price_change_30d_percent, primary_exchange, exchange_sources, data_quality_score, last_updated, TIMESTAMPDIFF(MINUTE, last_updated, UTC_TIMESTAMP()) as cache_age_minutes FROM src20_market_data WHERE tick = ? LIMIT 1",
      [tick],
      { rows: [mockRow] },
    );

    const result = await MarketDataRepository.getSRC20MarketData(tick);

    assertExists(result);
    assertEquals(result.tick, tick);
    assertEquals(result.priceBTC, 0.00001);
    assertEquals(result.priceUSD, 0.65);
    assertEquals(result.marketCapBTC, 10.5);
    assertEquals(result.holderCount, 500);
    assertEquals(result.priceChange24hPercent, 5.25);
    assertEquals(result.primaryExchange, "counterparty");
  });

  await t.step("returns null for non-existent SRC20 token", async () => {
    const tick = "NONEXISTENT";

    mockDb.setMockResponse(
      "SELECT tick, price_btc, price_usd, floor_price_btc, market_cap_btc, market_cap_usd, volume_24h_btc, volume_7d_btc, volume_30d_btc, total_volume_btc, holder_count, circulating_supply, price_change_24h_percent, price_change_7d_percent, price_change_30d_percent, primary_exchange, exchange_sources, data_quality_score, last_updated, TIMESTAMPDIFF(MINUTE, last_updated, UTC_TIMESTAMP()) as cache_age_minutes FROM src20_market_data WHERE tick = ? LIMIT 1",
      [tick],
      { rows: [] },
    );

    const result = await MarketDataRepository.getSRC20MarketData(tick);
    assertEquals(result, null);
  });
});

Deno.test("MarketDataRepository.getCollectionMarketData", async (t) => {
  await t.step("returns market data for existing collection", async () => {
    const collectionId = "abc123def456";
    const mockRow = createMockCollectionMarketDataRow(collectionId);

    mockDb.setMockResponse(
      "SELECT collection_id, min_floor_price_btc, max_floor_price_btc, avg_floor_price_btc, median_floor_price_btc, total_volume_24h_btc, stamps_with_prices_count, min_holder_count, max_holder_count, avg_holder_count, median_holder_count, total_unique_holders, avg_distribution_score, total_stamps_count, last_updated, TIMESTAMPDIFF(MINUTE, last_updated, UTC_TIMESTAMP()) as cache_age_minutes FROM collection_market_data WHERE collection_id = ? LIMIT 1",
      [collectionId],
      { rows: [mockRow] },
    );

    const result = await MarketDataRepository.getCollectionMarketData(
      collectionId,
    );

    assertExists(result);
    assertEquals(result.collectionId, collectionId);
    assertEquals(result.minFloorPriceBTC, 0.005);
    assertEquals(result.maxFloorPriceBTC, 0.05);
    assertEquals(result.avgFloorPriceBTC, 0.0175);
    assertEquals(result.stampsWithPricesCount, 25);
    assertEquals(result.totalStampsCount, 100);
    assertEquals(result.avgHolderCount, 12.5);
  });

  await t.step("returns null for non-existent collection", async () => {
    const collectionId = "nonexistent";

    mockDb.setMockResponse(
      "SELECT collection_id, min_floor_price_btc, max_floor_price_btc, avg_floor_price_btc, median_floor_price_btc, total_volume_24h_btc, stamps_with_prices_count, min_holder_count, max_holder_count, avg_holder_count, median_holder_count, total_unique_holders, avg_distribution_score, total_stamps_count, last_updated, TIMESTAMPDIFF(MINUTE, last_updated, UTC_TIMESTAMP()) as cache_age_minutes FROM collection_market_data WHERE collection_id = ? LIMIT 1",
      [collectionId],
      { rows: [] },
    );

    const result = await MarketDataRepository.getCollectionMarketData(
      collectionId,
    );
    assertEquals(result, null);
  });
});

Deno.test("MarketDataRepository.getStampHoldersFromCache", async (t) => {
  await t.step("returns holder data for existing stamp", async () => {
    const cpid = "A123456789012345678";
    const mockRows = [
      createMockHolderCacheRow(cpid, "address1", 1),
      createMockHolderCacheRow(cpid, "address2", 2),
      createMockHolderCacheRow(cpid, "address3", 3),
    ];

    mockDb.setMockResponse(
      "SELECT id, cpid, address, quantity, percentage, rank_position, last_updated FROM stamp_holder_cache WHERE cpid = ? ORDER BY rank_position ASC",
      [cpid],
      { rows: mockRows },
    );

    const result = await MarketDataRepository.getStampHoldersFromCache(cpid);

    assertEquals(result.length, 3);
    assertEquals(result[0].cpid, cpid);
    assertEquals(result[0].address, "address1");
    assertEquals(result[0].rankPosition, 1);
    assertEquals(result[0].quantity, 1000);
    assertEquals(result[0].percentage, 10.5);
    assertEquals(result[1].rankPosition, 2);
    assertEquals(result[2].rankPosition, 3);
  });

  await t.step("returns empty array for stamp with no holders", async () => {
    const cpid = "NOHOLDERS";

    mockDb.setMockResponse(
      "SELECT id, cpid, address, quantity, percentage, rank_position, last_updated FROM stamp_holder_cache WHERE cpid = ? ORDER BY rank_position ASC",
      [cpid],
      { rows: [] },
    );

    const result = await MarketDataRepository.getStampHoldersFromCache(cpid);
    assertEquals(result.length, 0);
  });
});

Deno.test("MarketDataRepository.getBulkStampMarketData", async (t) => {
  await t.step("returns market data for multiple stamps", async () => {
    const cpids = ["A111", "A222", "A333"];
    const mockRows = [
      createMockStampMarketDataRow("A111"),
      createMockStampMarketDataRow("A222"),
      createMockStampMarketDataRow("A333"),
    ];

    mockDb.setMockResponse(
      "SELECT cpid, floor_price_btc, recent_sale_price_btc, open_dispensers_count, closed_dispensers_count, total_dispensers_count, holder_count, unique_holder_count, top_holder_percentage, holder_distribution_score, volume_24h_btc, volume_7d_btc, volume_30d_btc, total_volume_btc, price_source, volume_sources, data_quality_score, confidence_level, last_updated, last_price_update, update_frequency_minutes, last_sale_tx_hash, last_sale_buyer_address, last_sale_dispenser_address, last_sale_btc_amount, last_sale_dispenser_tx_hash, last_sale_block_index, activity_level, last_activity_time, TIMESTAMPDIFF(MINUTE, last_updated, UTC_TIMESTAMP()) as cache_age_minutes FROM stamp_market_data WHERE cpid IN (?,?,?)",
      cpids,
      { rows: mockRows },
    );

    const result = await MarketDataRepository.getBulkStampMarketData(cpids);

    assertEquals(result.size, 3);
    assertEquals(result.has("A111"), true);
    assertEquals(result.has("A222"), true);
    assertEquals(result.has("A333"), true);

    const marketDataA111 = result.get("A111");
    assertExists(marketDataA111);
    assertEquals(marketDataA111.cpid, "A111");
  });

  await t.step("returns empty map for empty cpid array", async () => {
    const result = await MarketDataRepository.getBulkStampMarketData([]);
    assertEquals(result.size, 0);
  });

  await t.step("handles partial results gracefully", async () => {
    const cpids = ["A111", "A222", "A333"];
    const mockRows = [
      createMockStampMarketDataRow("A111"),
      // Missing A222 and A333
    ];

    mockDb.setMockResponse(
      "SELECT cpid, floor_price_btc, recent_sale_price_btc, open_dispensers_count, closed_dispensers_count, total_dispensers_count, holder_count, unique_holder_count, top_holder_percentage, holder_distribution_score, volume_24h_btc, volume_7d_btc, volume_30d_btc, total_volume_btc, price_source, volume_sources, data_quality_score, confidence_level, last_updated, last_price_update, update_frequency_minutes, last_sale_tx_hash, last_sale_buyer_address, last_sale_dispenser_address, last_sale_btc_amount, last_sale_dispenser_tx_hash, last_sale_block_index, activity_level, last_activity_time, TIMESTAMPDIFF(MINUTE, last_updated, UTC_TIMESTAMP()) as cache_age_minutes FROM stamp_market_data WHERE cpid IN (?,?,?)",
      cpids,
      { rows: mockRows },
    );

    const result = await MarketDataRepository.getBulkStampMarketData(cpids);

    assertEquals(result.size, 1);
    assertEquals(result.has("A111"), true);
    assertEquals(result.has("A222"), false);
    assertEquals(result.has("A333"), false);
  });
});

Deno.test("MarketDataRepository.getAllSRC20MarketData", async (t) => {
  await t.step("returns all SRC20 market data with default limit", async () => {
    const mockRows = [
      createMockSRC20MarketDataRow("PEPE"),
      createMockSRC20MarketDataRow("DOGE"),
      createMockSRC20MarketDataRow("MEME"),
    ];

    mockDb.setMockResponse(
      "SELECT tick, price_btc, price_usd, floor_price_btc, market_cap_btc, market_cap_usd, volume_24h_btc, volume_7d_btc, volume_30d_btc, total_volume_btc, holder_count, circulating_supply, price_change_24h_percent, price_change_7d_percent, price_change_30d_percent, primary_exchange, exchange_sources, data_quality_score, last_updated, TIMESTAMPDIFF(MINUTE, last_updated, UTC_TIMESTAMP()) as cache_age_minutes FROM src20_market_data ORDER BY CAST(market_cap_btc AS DECIMAL(20,8)) DESC LIMIT ?",
      [1000],
      { rows: mockRows },
    );

    const result = await MarketDataRepository.getAllSRC20MarketData();

    assertEquals(result.length, 3);
    assertEquals(result[0].tick, "PEPE");
    assertEquals(result[1].tick, "DOGE");
    assertEquals(result[2].tick, "MEME");
  });

  await t.step("returns all SRC20 market data with custom limit", async () => {
    const mockRows = [
      createMockSRC20MarketDataRow("PEPE"),
      createMockSRC20MarketDataRow("DOGE"),
    ];

    mockDb.setMockResponse(
      "SELECT tick, price_btc, price_usd, floor_price_btc, market_cap_btc, market_cap_usd, volume_24h_btc, volume_7d_btc, volume_30d_btc, total_volume_btc, holder_count, circulating_supply, price_change_24h_percent, price_change_7d_percent, price_change_30d_percent, primary_exchange, exchange_sources, data_quality_score, last_updated, TIMESTAMPDIFF(MINUTE, last_updated, UTC_TIMESTAMP()) as cache_age_minutes FROM src20_market_data ORDER BY CAST(market_cap_btc AS DECIMAL(20,8)) DESC LIMIT ?",
      [2],
      { rows: mockRows },
    );

    const result = await MarketDataRepository.getAllSRC20MarketData(2);

    assertEquals(result.length, 2);
    assertEquals(result[0].tick, "PEPE");
    assertEquals(result[1].tick, "DOGE");
  });

  await t.step("returns empty array when no data exists", async () => {
    mockDb.setMockResponse(
      "SELECT tick, price_btc, price_usd, floor_price_btc, market_cap_btc, market_cap_usd, volume_24h_btc, volume_7d_btc, volume_30d_btc, total_volume_btc, holder_count, circulating_supply, price_change_24h_percent, price_change_7d_percent, price_change_30d_percent, primary_exchange, exchange_sources, data_quality_score, last_updated, TIMESTAMPDIFF(MINUTE, last_updated, UTC_TIMESTAMP()) as cache_age_minutes FROM src20_market_data ORDER BY CAST(market_cap_btc AS DECIMAL(20,8)) DESC LIMIT ?",
      [1000],
      { rows: [] },
    );

    const result = await MarketDataRepository.getAllSRC20MarketData();
    assertEquals(result.length, 0);
  });
});

Deno.test("MarketDataRepository.getStampsWithMarketData", async (t) => {
  await t.step("returns stamps with market data and pagination", async () => {
    const mockRows = [
      {
        // Stamp fields
        stamp: 1,
        block_index: 875000,
        cpid: "A111",
        creator: "bc1qaddress1",
        creator_name: "Creator1",
        divisible: 0,
        keyburn: 0,
        locked: 0,
        stamp_url: "https://example.com/stamp1",
        stamp_mimetype: "image/png",
        supply: "1",
        block_time: "2025-07-10T10:00:00.000Z",
        tx_hash: "tx1",
        tx_index: 1,
        ident: "STAMP",
        stamp_hash: "hash1",
        file_hash: "filehash1",
        stamp_base64: null,
        asset_longname: null,
        message_index: 1,
        src_data: null,
        is_btc_stamp: 1,
        is_reissue: 0,
        is_valid_base64: 1,
        // Market data fields
        floor_price_btc: "0.01000000",
        recent_sale_price_btc: "0.01500000",
        open_dispensers_count: 1,
        closed_dispensers_count: 0,
        total_dispensers_count: 1,
        holder_count: 5,
        unique_holder_count: 4,
        top_holder_percentage: "40.0",
        holder_distribution_score: "6.5",
        volume_24h_btc: "0.02000000",
        volume_7d_btc: "0.10000000",
        volume_30d_btc: "0.50000000",
        total_volume_btc: "2.00000000",
        price_source: "dispenser",
        volume_sources: '{"counterparty": 1.0}',
        data_quality_score: "8.0",
        confidence_level: "7.5",
        market_data_last_updated: "2025-07-10T09:00:00.000Z",
        last_price_update: "2025-07-10T08:30:00.000Z",
        update_frequency_minutes: 30,
        cache_age_minutes: 60,
      },
    ];

    mockDb.setMockResponse(
      "SELECT st.*, cr.creator AS creator_name, smd.floor_price_btc, smd.recent_sale_price_btc, smd.open_dispensers_count, smd.closed_dispensers_count, smd.total_dispensers_count, smd.holder_count, smd.unique_holder_count, smd.top_holder_percentage, smd.holder_distribution_score, smd.volume_24h_btc, smd.volume_7d_btc, smd.volume_30d_btc, smd.total_volume_btc, smd.price_source, smd.volume_sources, smd.data_quality_score, smd.confidence_level, smd.last_updated as market_data_last_updated, smd.last_price_update, smd.update_frequency_minutes, TIMESTAMPDIFF(MINUTE, smd.last_updated, UTC_TIMESTAMP()) as cache_age_minutes FROM stamps st LEFT JOIN creator cr ON st.creator = cr.address LEFT JOIN stamp_market_data smd ON st.cpid = smd.cpid ORDER BY st.block_index DESC LIMIT ? OFFSET ?",
      [100, 0],
      { rows: mockRows },
    );

    const result = await MarketDataRepository.getStampsWithMarketData({
      offset: 0,
      limit: 100,
    });

    assertEquals(result.length, 1);
    assertEquals(result[0].cpid, "A111");
    assertEquals(result[0].creator, "bc1qaddress1");
    assertEquals(result[0].creator_name, "Creator1");
    assertExists(result[0].marketData);
    assertEquals(result[0].marketData!.floorPriceBTC, 0.01);
    assertEquals(result[0].marketData!.holderCount, 5);
    assertExists(result[0].cacheStatus);
    assertEquals(result[0].cacheAgeMinutes, 60);
  });

  await t.step("returns stamps without market data", async () => {
    const mockRows = [
      {
        // Stamp fields only, no market data
        stamp: 2,
        block_index: 874999,
        cpid: "A222",
        creator: "bc1qaddress2",
        creator_name: "Creator2",
        divisible: 0,
        keyburn: 0,
        locked: 0,
        stamp_url: "https://example.com/stamp2",
        stamp_mimetype: "image/png",
        supply: "1",
        block_time: "2025-07-09T10:00:00.000Z",
        tx_hash: "tx2",
        tx_index: 2,
        ident: "STAMP",
        stamp_hash: "hash2",
        file_hash: "filehash2",
        stamp_base64: null,
        asset_longname: null,
        message_index: 2,
        src_data: null,
        is_btc_stamp: 1,
        is_reissue: 0,
        is_valid_base64: 1,
        // No market data fields (null)
        floor_price_btc: null,
        market_data_last_updated: null,
        cache_age_minutes: null,
      },
    ];

    mockDb.setMockResponse(
      "SELECT st.*, cr.creator AS creator_name, smd.floor_price_btc, smd.recent_sale_price_btc, smd.open_dispensers_count, smd.closed_dispensers_count, smd.total_dispensers_count, smd.holder_count, smd.unique_holder_count, smd.top_holder_percentage, smd.holder_distribution_score, smd.volume_24h_btc, smd.volume_7d_btc, smd.volume_30d_btc, smd.total_volume_btc, smd.price_source, smd.volume_sources, smd.data_quality_score, smd.confidence_level, smd.last_updated as market_data_last_updated, smd.last_price_update, smd.update_frequency_minutes, TIMESTAMPDIFF(MINUTE, smd.last_updated, UTC_TIMESTAMP()) as cache_age_minutes FROM stamps st LEFT JOIN creator cr ON st.creator = cr.address LEFT JOIN stamp_market_data smd ON st.cpid = smd.cpid ORDER BY st.block_index DESC LIMIT ? OFFSET ?",
      [100, 0],
      { rows: mockRows },
    );

    const result = await MarketDataRepository.getStampsWithMarketData({
      offset: 0,
      limit: 100,
    });

    assertEquals(result.length, 1);
    assertEquals(result[0].cpid, "A222");
    assertEquals(result[0].creator, "bc1qaddress2");
    assertEquals(result[0].marketData, null);
    assertEquals(
      result[0].marketDataMessage,
      "No market data available for this stamp",
    );
    assertEquals(result[0].cacheStatus, undefined);
    assertEquals(result[0].cacheAgeMinutes, undefined);
  });

  await t.step("handles collection filter", async () => {
    const collectionId = "abc123";

    mockDb.setMockResponse(
      "SELECT st.*, cr.creator AS creator_name, smd.floor_price_btc, smd.recent_sale_price_btc, smd.open_dispensers_count, smd.closed_dispensers_count, smd.total_dispensers_count, smd.holder_count, smd.unique_holder_count, smd.top_holder_percentage, smd.holder_distribution_score, smd.volume_24h_btc, smd.volume_7d_btc, smd.volume_30d_btc, smd.total_volume_btc, smd.price_source, smd.volume_sources, smd.data_quality_score, smd.confidence_level, smd.last_updated as market_data_last_updated, smd.last_price_update, smd.update_frequency_minutes, TIMESTAMPDIFF(MINUTE, smd.last_updated, UTC_TIMESTAMP()) as cache_age_minutes FROM stamps st LEFT JOIN creator cr ON st.creator = cr.address LEFT JOIN stamp_market_data smd ON st.cpid = smd.cpid JOIN collection_stamps cs ON st.stamp = cs.stamp WHERE cs.collection_id = UNHEX(?) ORDER BY st.block_index DESC LIMIT ? OFFSET ?",
      [collectionId, 100, 0],
      { rows: [] },
    );

    const result = await MarketDataRepository.getStampsWithMarketData({
      collectionId,
      offset: 0,
      limit: 100,
    });

    assertEquals(result.length, 0);
  });
});

// Test error handling in parsing methods
Deno.test("MarketDataRepository error handling", async (t) => {
  await t.step("handles malformed stamp market data gracefully", async () => {
    const cpid = "MALFORMED";
    const malformedRow = {
      cpid,
      floor_price_btc: "invalid_number",
      recent_sale_price_btc: null,
      // Missing required fields
      last_updated: "invalid_date",
    };

    mockDb.setMockResponse(
      "SELECT cpid, floor_price_btc, recent_sale_price_btc, open_dispensers_count, closed_dispensers_count, total_dispensers_count, holder_count, unique_holder_count, top_holder_percentage, holder_distribution_score, volume_24h_btc, volume_7d_btc, volume_30d_btc, total_volume_btc, price_source, volume_sources, data_quality_score, confidence_level, last_updated, last_price_update, update_frequency_minutes, last_sale_tx_hash, last_sale_buyer_address, last_sale_dispenser_address, last_sale_btc_amount, last_sale_dispenser_tx_hash, last_sale_block_index, activity_level, last_activity_time, TIMESTAMPDIFF(MINUTE, last_updated, UTC_TIMESTAMP()) as cache_age_minutes FROM stamp_market_data WHERE cpid = ? LIMIT 1",
      [cpid],
      { rows: [malformedRow] },
    );

    const result = await MarketDataRepository.getStampMarketData(cpid);
    // Should handle gracefully and return null for malformed data
    assertEquals(result, null);
  });

  await t.step("handles empty result sets gracefully", async () => {
    mockDb.setMockResponse(
      "SELECT tick, price_btc, price_usd, floor_price_btc, market_cap_btc, market_cap_usd, volume_24h_btc, volume_7d_btc, volume_30d_btc, total_volume_btc, holder_count, circulating_supply, price_change_24h_percent, price_change_7d_percent, price_change_30d_percent, primary_exchange, exchange_sources, data_quality_score, last_updated, TIMESTAMPDIFF(MINUTE, last_updated, UTC_TIMESTAMP()) as cache_age_minutes FROM src20_market_data ORDER BY CAST(market_cap_btc AS DECIMAL(20,8)) DESC LIMIT ?",
      [1000],
      { rows: null as any }, // Simulate null rows
    );

    const result = await MarketDataRepository.getAllSRC20MarketData();
    assertEquals(result.length, 0);
  });
});

// Test dependency injection
Deno.test("MarketDataRepository dependency injection", async (t) => {
  await t.step("allows database dependency injection", () => {
    const originalDb = (MarketDataRepository as any).db;
    const newMockDb = new MockDatabaseManager();

    MarketDataRepository.setDatabase(newMockDb as any);
    assertEquals((MarketDataRepository as any).db, newMockDb);

    // Restore original
    MarketDataRepository.setDatabase(originalDb);
  });
});

// Cleanup test
Deno.test("Cleanup MarketDataRepository tests", () => {
  mockDb.clearQueryHistory();
  mockDb.clearMockResponses();
});
