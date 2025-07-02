import { assertEquals, assertExists } from "@std/assert";
import type {
  CollectionMarketData,
  CollectionMarketDataRow,
  SRC20MarketDataRow,
  StampMarketData,
  StampMarketDataRow,
} from "$lib/types/marketData.d.ts";
import {
  getCacheStatus,
  parseBTCDecimal,
  parseExchangeSources,
  parseVolumeSources,
} from "$lib/utils/marketData.ts";

// Mock database manager for testing
class MockDatabaseManager {
  private stampMarketData: Map<string, StampMarketDataRow> = new Map();
  private src20MarketData: Map<string, SRC20MarketDataRow> = new Map();
  private collectionMarketData: Map<string, CollectionMarketDataRow> =
    new Map();

  getStampMarketData(cpid: string): Promise<StampMarketDataRow | null> {
    return Promise.resolve(this.stampMarketData.get(cpid) || null);
  }

  getSRC20MarketData(tick: string): Promise<SRC20MarketDataRow | null> {
    return Promise.resolve(this.src20MarketData.get(tick) || null);
  }

  getCollectionMarketData(
    collectionId: string,
  ): Promise<CollectionMarketDataRow | null> {
    return Promise.resolve(this.collectionMarketData.get(collectionId) || null);
  }

  upsertStampMarketData(data: StampMarketDataRow): Promise<void> {
    this.stampMarketData.set(data.cpid, data);
    return Promise.resolve();
  }

  upsertSRC20MarketData(data: SRC20MarketDataRow): Promise<void> {
    this.src20MarketData.set(data.tick, data);
    return Promise.resolve();
  }

  upsertCollectionMarketData(
    data: CollectionMarketDataRow,
  ): Promise<void> {
    this.collectionMarketData.set(data.collection_id, data);
    return Promise.resolve();
  }

  batchGetStampMarketData(
    cpids: string[],
  ): Promise<Map<string, StampMarketDataRow>> {
    const result = new Map<string, StampMarketDataRow>();
    for (const cpid of cpids) {
      const data = this.stampMarketData.get(cpid);
      if (data) {
        result.set(cpid, data);
      }
    }
    return Promise.resolve(result);
  }
}

// Mock service layer for testing
class MockMarketDataService {
  constructor(private db: MockDatabaseManager) {}

  async getStampWithMarketData(cpid: string): Promise<{
    stamp: any;
    marketData: StampMarketData | null;
    cacheStatus: "fresh" | "stale" | "expired";
  }> {
    const marketDataRow = await this.db.getStampMarketData(cpid);

    if (!marketDataRow) {
      return {
        stamp: { cpid },
        marketData: null,
        cacheStatus: "expired",
      };
    }

    const cacheAgeMinutes = Math.floor(
      (Date.now() - marketDataRow.last_updated.getTime()) / 1000 / 60,
    );

    const marketData: StampMarketData = {
      cpid: marketDataRow.cpid,
      floorPriceBTC: parseBTCDecimal(marketDataRow.floor_price_btc),
      recentSalePriceBTC: parseBTCDecimal(marketDataRow.recent_sale_price_btc),
      openDispensersCount: marketDataRow.open_dispensers_count,
      closedDispensersCount: marketDataRow.closed_dispensers_count,
      totalDispensersCount: marketDataRow.total_dispensers_count,
      holderCount: marketDataRow.holder_count,
      uniqueHolderCount: marketDataRow.unique_holder_count,
      topHolderPercentage: parseFloat(marketDataRow.top_holder_percentage),
      holderDistributionScore: parseFloat(
        marketDataRow.holder_distribution_score,
      ),
      volume24hBTC: parseFloat(marketDataRow.volume_24h_btc),
      volume7dBTC: parseFloat(marketDataRow.volume_7d_btc),
      volume30dBTC: parseFloat(marketDataRow.volume_30d_btc),
      totalVolumeBTC: parseFloat(marketDataRow.total_volume_btc),
      priceSource: marketDataRow.price_source,
      volumeSources: marketDataRow.volume_sources
        ? parseVolumeSources(marketDataRow.volume_sources)
        : null,
      dataQualityScore: parseFloat(marketDataRow.data_quality_score),
      confidenceLevel: parseFloat(marketDataRow.confidence_level),
      lastUpdated: marketDataRow.last_updated,
      lastPriceUpdate: marketDataRow.last_price_update,
      updateFrequencyMinutes: marketDataRow.update_frequency_minutes,
    };

    return {
      stamp: { cpid },
      marketData,
      cacheStatus: getCacheStatus(cacheAgeMinutes),
    };
  }

  async getCollectionStampsWithMarketData(
    collectionId: string,
    stampCpids: string[],
  ): Promise<{
    stamps: any[];
    aggregatedMarketData: CollectionMarketData | null;
  }> {
    // Get individual stamp market data
    const stampMarketDataMap = await this.db.batchGetStampMarketData(
      stampCpids,
    );

    // Get collection aggregate data
    const collectionDataRow = await this.db.getCollectionMarketData(
      collectionId,
    );

    const stamps = stampCpids.map((cpid) => {
      const marketDataRow = stampMarketDataMap.get(cpid);
      return {
        cpid,
        marketData: marketDataRow
          ? this.parseStampMarketData(marketDataRow)
          : null,
      };
    });

    const aggregatedMarketData = collectionDataRow
      ? this.parseCollectionMarketData(collectionDataRow)
      : null;

    return { stamps, aggregatedMarketData };
  }

  private parseStampMarketData(row: StampMarketDataRow): StampMarketData {
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

  private parseCollectionMarketData(
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
}

Deno.test("Integration - Stamp market data retrieval with fresh cache", async () => {
  const db = new MockDatabaseManager();
  const service = new MockMarketDataService(db);

  // Insert fresh market data
  const freshData: StampMarketDataRow = {
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
    last_updated: new Date(),
    last_price_update: new Date(),
    update_frequency_minutes: 30,
  };

  await db.upsertStampMarketData(freshData);

  const result = await service.getStampWithMarketData("A123456789ABCDEF");

  assertEquals(result.stamp.cpid, "A123456789ABCDEF");
  assertExists(result.marketData);
  assertEquals(result.marketData?.floorPriceBTC, 0.00015);
  assertEquals(result.marketData?.holderCount, 42);
  assertEquals(result.cacheStatus, "fresh");
});

Deno.test("Integration - Stamp market data retrieval with no data", async () => {
  const db = new MockDatabaseManager();
  const service = new MockMarketDataService(db);

  const result = await service.getStampWithMarketData("NONEXISTENT");

  assertEquals(result.stamp.cpid, "NONEXISTENT");
  assertEquals(result.marketData, null);
  assertEquals(result.cacheStatus, "expired");
});

Deno.test("Integration - Collection market data aggregation", async () => {
  const db = new MockDatabaseManager();
  const service = new MockMarketDataService(db);

  // Insert stamp market data
  const stamps = [
    {
      cpid: "PEPE001",
      floor_price_btc: "0.10000000",
      holder_count: 50,
      volume_24h_btc: "0.50000000",
    },
    {
      cpid: "PEPE002",
      floor_price_btc: "0.05000000",
      holder_count: 30,
      volume_24h_btc: "0.30000000",
    },
    {
      cpid: "PEPE003",
      floor_price_btc: null, // No price
      holder_count: 10,
      volume_24h_btc: "0.00000000",
    },
  ];

  for (const stamp of stamps) {
    await db.upsertStampMarketData({
      cpid: stamp.cpid,
      floor_price_btc: stamp.floor_price_btc,
      recent_sale_price_btc: stamp.floor_price_btc,
      open_dispensers_count: 0,
      closed_dispensers_count: 0,
      total_dispensers_count: 0,
      holder_count: stamp.holder_count,
      unique_holder_count: stamp.holder_count,
      top_holder_percentage: "10.00",
      holder_distribution_score: "70.00",
      volume_24h_btc: stamp.volume_24h_btc,
      volume_7d_btc: "0.00000000",
      volume_30d_btc: "0.00000000",
      total_volume_btc: stamp.volume_24h_btc,
      price_source: "counterparty",
      volume_sources: null,
      data_quality_score: "7.0",
      confidence_level: "8.0",
      last_updated: new Date(),
      last_price_update: new Date(),
      update_frequency_minutes: 30,
    });
  }

  // Insert collection aggregate data
  await db.upsertCollectionMarketData({
    collection_id: "rare-pepes",
    min_floor_price_btc: "0.05000000",
    max_floor_price_btc: "0.10000000",
    avg_floor_price_btc: "0.07500000",
    median_floor_price_btc: "0.07500000",
    total_volume_24h_btc: "0.80000000",
    stamps_with_prices_count: 2,
    min_holder_count: 10,
    max_holder_count: 50,
    avg_holder_count: "30.00",
    median_holder_count: 30,
    total_unique_holders: 80,
    avg_distribution_score: "70.00",
    total_stamps_count: 3,
    last_updated: new Date(),
  });

  const result = await service.getCollectionStampsWithMarketData(
    "rare-pepes",
    ["PEPE001", "PEPE002", "PEPE003"],
  );

  assertEquals(result.stamps.length, 3);
  assertExists(result.stamps[0].marketData);
  assertExists(result.stamps[1].marketData);
  assertEquals(result.stamps[2].marketData?.floorPriceBTC, null);

  assertExists(result.aggregatedMarketData);
  assertEquals(result.aggregatedMarketData?.minFloorPriceBTC, 0.05);
  assertEquals(result.aggregatedMarketData?.maxFloorPriceBTC, 0.1);
  assertEquals(result.aggregatedMarketData?.stampsWithPricesCount, 2);
});

Deno.test("Integration - SRC20 market data with multiple exchanges", async () => {
  const db = new MockDatabaseManager();

  const src20Data: SRC20MarketDataRow = {
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
    last_updated: new Date(),
  };

  await db.upsertSRC20MarketData(src20Data);

  const result = await db.getSRC20MarketData("PEPE");
  assertExists(result);

  const exchangeSources = parseExchangeSources(result.exchange_sources!);
  assertEquals(exchangeSources.length, 3);
  assertEquals(exchangeSources.includes("openstamp"), true);
  assertEquals(exchangeSources.includes("kucoin"), true);
  assertEquals(exchangeSources.includes("stampscan"), true);
});

Deno.test(
  "Integration - Batch retrieval performance for collection page",
  async () => {
    const db = new MockDatabaseManager();

    // Simulate a collection with 50 stamps
    const cpids: string[] = [];
    for (let i = 1; i <= 50; i++) {
      const cpid = `STAMP${i.toString().padStart(3, "0")}`;
      cpids.push(cpid);

      // Insert market data for 80% of stamps (40 out of 50)
      if (i <= 40) {
        await db.upsertStampMarketData({
          cpid,
          floor_price_btc: (0.01 * i).toFixed(8),
          recent_sale_price_btc: (0.012 * i).toFixed(8),
          open_dispensers_count: i % 5,
          closed_dispensers_count: i % 3,
          total_dispensers_count: (i % 5) + (i % 3),
          holder_count: 10 + i,
          unique_holder_count: 8 + i,
          top_holder_percentage: (50 / (10 + i)).toFixed(2),
          holder_distribution_score: (60 + (i % 40)).toFixed(2),
          volume_24h_btc: (0.001 * i).toFixed(8),
          volume_7d_btc: (0.007 * i).toFixed(8),
          volume_30d_btc: (0.03 * i).toFixed(8),
          total_volume_btc: (0.1 * i).toFixed(8),
          price_source: i % 2 === 0 ? "counterparty" : "openstamp",
          volume_sources: `{"source1": ${(0.0005 * i).toFixed(8)}, "source2": ${
            (0.0005 * i).toFixed(8)
          }}`,
          data_quality_score: (7 + (i % 3)).toFixed(1),
          confidence_level: (8 + (i % 2)).toFixed(1),
          last_updated: new Date(),
          last_price_update: new Date(),
          update_frequency_minutes: 30,
        });
      }
    }

    // Measure batch retrieval time
    const startTime = performance.now();
    const marketDataMap = await db.batchGetStampMarketData(cpids);
    const endTime = performance.now();

    // Verify results
    assertEquals(marketDataMap.size, 40); // 40 stamps have market data
    assertEquals(cpids.length, 50); // Total 50 stamps

    // Performance should be fast for batch operations
    const elapsedMs = endTime - startTime;
    assertEquals(elapsedMs < 100, true); // Should complete within 100ms

    // Verify data integrity
    const firstStamp = marketDataMap.get("STAMP001");
    assertExists(firstStamp);
    assertEquals(firstStamp.floor_price_btc, "0.01000000");

    const lastStamp = marketDataMap.get("STAMP040");
    assertExists(lastStamp);
    assertEquals(lastStamp.floor_price_btc, "0.40000000");
  },
);

Deno.test("Integration - Cache invalidation and refresh logic", async () => {
  const db = new MockDatabaseManager();
  const service = new MockMarketDataService(db);

  // Insert stale data (45 minutes old)
  const staleDate = new Date();
  staleDate.setMinutes(staleDate.getMinutes() - 45);

  const staleData: StampMarketDataRow = {
    cpid: "STALE123",
    floor_price_btc: "0.10000000",
    recent_sale_price_btc: "0.11000000",
    open_dispensers_count: 2,
    closed_dispensers_count: 3,
    total_dispensers_count: 5,
    holder_count: 25,
    unique_holder_count: 24,
    top_holder_percentage: "20.00",
    holder_distribution_score: "65.00",
    volume_24h_btc: "0.50000000",
    volume_7d_btc: "3.50000000",
    volume_30d_btc: "15.00000000",
    total_volume_btc: "25.00000000",
    price_source: "counterparty",
    volume_sources: null,
    data_quality_score: "7.0",
    confidence_level: "7.5",
    last_updated: staleDate,
    last_price_update: staleDate,
    update_frequency_minutes: 30,
  };

  await db.upsertStampMarketData(staleData);

  // Get stale data
  let result = await service.getStampWithMarketData("STALE123");
  assertEquals(result.cacheStatus, "stale");

  // Simulate cache refresh with new data
  const freshData = { ...staleData };
  freshData.floor_price_btc = "0.12000000"; // Price increased
  freshData.volume_24h_btc = "0.75000000"; // Volume increased
  freshData.last_updated = new Date();
  freshData.last_price_update = new Date();

  await db.upsertStampMarketData(freshData);

  // Get fresh data
  result = await service.getStampWithMarketData("STALE123");
  assertEquals(result.cacheStatus, "fresh");
  assertEquals(result.marketData?.floorPriceBTC, 0.12);
  assertEquals(result.marketData?.volume24hBTC, 0.75);
});
