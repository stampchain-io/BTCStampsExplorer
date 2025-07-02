import { assertEquals, assertExists } from "@std/assert";
import type { StampMarketDataRow } from "$lib/types/marketData.d.ts";
import {
  parseBTCDecimal,
  parseExchangeSources,
  parseVolumeSources,
} from "$lib/utils/marketData.ts";

// Performance benchmarking helper
function measurePerformance(
  name: string,
  fn: () => void,
  iterations: number = 1000,
): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  const avgTime = (end - start) / iterations;
  console.log(
    `${name}: ${avgTime.toFixed(4)}ms average (${iterations} iterations)`,
  );
  return avgTime;
}

Deno.test("Performance - BTC decimal parsing", () => {
  const testValues = [
    "0.12345678",
    "1.00000000",
    "0.00000001",
    "21000000.00000000",
    "0.00015000",
    "1234.56789012",
    null,
    undefined,
    "",
  ];

  const avgTime = measurePerformance("parseBTCDecimal", () => {
    testValues.forEach((value) => parseBTCDecimal(value as any));
  }, 10000);

  // Should be very fast - under 0.01ms per operation
  assertEquals(avgTime < 0.01, true);
});

Deno.test("Performance - Volume sources JSON parsing", () => {
  const testCases = [
    '{"counterparty": 0.5, "exchange_a": 1.2, "exchange_b": 0.3}',
    '{"single": 1.0}',
    '{"a": 0.1, "b": 0.2, "c": 0.3, "d": 0.4, "e": 0.5}',
    "{}",
    null,
    '{"complex": 123.456789, "nested": 0.000001, "large": 999999.999999}',
  ];

  const avgTime = measurePerformance("parseVolumeSources", () => {
    testCases.forEach((json) => parseVolumeSources(json as any));
  }, 5000);

  // JSON parsing should be reasonably fast - under 0.05ms per operation
  assertEquals(avgTime < 0.05, true);
});

Deno.test("Performance - Exchange sources array parsing", () => {
  const testCases = [
    '["openstamp", "kucoin", "stampscan"]',
    '["single"]',
    '["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]',
    "[]",
    null,
  ];

  const avgTime = measurePerformance("parseExchangeSources", () => {
    testCases.forEach((json) => parseExchangeSources(json as any));
  }, 5000);

  // Array parsing should be fast - under 0.03ms per operation
  assertEquals(avgTime < 0.03, true);
});

Deno.test("Performance - Large collection data processing", () => {
  // Simulate processing a large collection with 1000 stamps
  const generateStampMarketData = (index: number): StampMarketDataRow => ({
    cpid: `STAMP${index.toString().padStart(6, "0")}`,
    floor_price_btc: (Math.random() * 10).toFixed(8),
    recent_sale_price_btc: (Math.random() * 10).toFixed(8),
    open_dispensers_count: Math.floor(Math.random() * 10),
    closed_dispensers_count: Math.floor(Math.random() * 20),
    total_dispensers_count: Math.floor(Math.random() * 30),
    holder_count: Math.floor(Math.random() * 1000),
    unique_holder_count: Math.floor(Math.random() * 900),
    top_holder_percentage: (Math.random() * 50).toFixed(2),
    holder_distribution_score: (Math.random() * 100).toFixed(2),
    volume_24h_btc: (Math.random() * 5).toFixed(8),
    volume_7d_btc: (Math.random() * 35).toFixed(8),
    volume_30d_btc: (Math.random() * 150).toFixed(8),
    total_volume_btc: (Math.random() * 1000).toFixed(8),
    price_source: Math.random() > 0.5 ? "counterparty" : "openstamp",
    volume_sources: JSON.stringify({
      source1: Math.random(),
      source2: Math.random(),
      source3: Math.random(),
    }),
    data_quality_score: (5 + Math.random() * 5).toFixed(1),
    confidence_level: (5 + Math.random() * 5).toFixed(1),
    last_updated: new Date(),
    last_price_update: Math.random() > 0.2 ? new Date() : null,
    update_frequency_minutes: 30,
  });

  const stamps: StampMarketDataRow[] = [];
  for (let i = 0; i < 1000; i++) {
    stamps.push(generateStampMarketData(i));
  }

  // Measure parsing performance
  const start = performance.now();
  const parsedData = stamps.map((row) => ({
    cpid: row.cpid,
    floorPriceBTC: parseBTCDecimal(row.floor_price_btc),
    recentSalePriceBTC: parseBTCDecimal(row.recent_sale_price_btc),
    volumeSources: row.volume_sources
      ? parseVolumeSources(row.volume_sources)
      : null,
    holderCount: row.holder_count,
    volume24hBTC: parseFloat(row.volume_24h_btc),
  }));
  const end = performance.now();

  const totalTime = end - start;
  console.log(`Parsed 1000 stamp records in ${totalTime.toFixed(2)}ms`);

  // Should process 1000 records in under 50ms
  assertEquals(totalTime < 50, true);
  assertEquals(parsedData.length, 1000);
});

Deno.test("Performance - Concurrent market data updates", () => {
  // Simulate concurrent updates to market data
  const updates: Array<() => any> = [];

  // Create 100 update operations
  for (let i = 0; i < 100; i++) {
    updates.push(() => ({
      cpid: `UPDATE${i}`,
      floorPriceBTC: parseBTCDecimal((Math.random() * 0.1).toFixed(8)),
      volume24hBTC: parseFloat((Math.random() * 10).toFixed(8)),
      volumeSources: parseVolumeSources(
        JSON.stringify({
          source1: Math.random(),
          source2: Math.random(),
        }),
      ),
      timestamp: Date.now(),
    }));
  }

  // Measure concurrent processing
  const start = performance.now();
  const results = updates.map((update) => update());
  const end = performance.now();

  const totalTime = end - start;
  console.log(`Processed 100 concurrent updates in ${totalTime.toFixed(2)}ms`);

  // Should handle 100 updates in under 10ms
  assertEquals(totalTime < 10, true);
  assertEquals(results.length, 100);
});

Deno.test("Performance - Memory efficiency with large datasets", () => {
  // Test memory efficiency by processing data in chunks
  const CHUNK_SIZE = 100;
  const TOTAL_RECORDS = 10000;

  let processedCount = 0;
  const startTime = performance.now();

  // Process in chunks to avoid memory spikes
  for (let chunk = 0; chunk < TOTAL_RECORDS / CHUNK_SIZE; chunk++) {
    const chunkData: any[] = [];

    for (let i = 0; i < CHUNK_SIZE; i++) {
      const index = chunk * CHUNK_SIZE + i;
      chunkData.push({
        cpid: `MEM${index}`,
        floorPriceBTC: parseBTCDecimal((Math.random() * 0.1).toFixed(8)),
        volumeSources: parseVolumeSources('{"test": 0.5}'),
      });
    }

    processedCount += chunkData.length;
    // Simulate chunk processing
    chunkData.forEach((item) => {
      assertExists(item.cpid);
      assertExists(item.floorPriceBTC);
    });
  }

  const endTime = performance.now();
  const totalTime = endTime - startTime;

  console.log(
    `Processed ${processedCount} records in chunks in ${
      totalTime.toFixed(2)
    }ms`,
  );

  assertEquals(processedCount, TOTAL_RECORDS);
  // Should complete within reasonable time - under 200ms for 10k records
  assertEquals(totalTime < 200, true);
});

Deno.test("Performance - Cache lookup efficiency", () => {
  // Simulate a cache with market data
  const cache = new Map<string, any>();

  // Populate cache with 5000 entries
  for (let i = 0; i < 5000; i++) {
    cache.set(`CACHE${i}`, {
      floorPriceBTC: Math.random() * 0.1,
      lastUpdated: Date.now() - Math.random() * 3600000, // Random time in last hour
    });
  }

  // Test cache lookup performance
  const lookupKeys: string[] = [];
  for (let i = 0; i < 1000; i++) {
    lookupKeys.push(`CACHE${Math.floor(Math.random() * 5000)}`);
  }

  const start = performance.now();
  const results = lookupKeys.map((key) => cache.get(key));
  const end = performance.now();

  const lookupTime = end - start;
  console.log(`1000 cache lookups completed in ${lookupTime.toFixed(2)}ms`);

  // Map lookups should be very fast - under 1ms for 1000 lookups
  assertEquals(lookupTime < 1, true);
  assertEquals(results.length, 1000);
  results.forEach((result) => assertExists(result));
});

Deno.test("Performance - Complex aggregation calculations", () => {
  // Generate test data for aggregation
  const stamps = Array.from({ length: 500 }, (_, i) => ({
    cpid: `AGG${i}`,
    floorPriceBTC: Math.random() * 0.5,
    holderCount: Math.floor(Math.random() * 100) + 1,
    volume24hBTC: Math.random() * 2,
    dataQualityScore: Math.random() * 10,
  }));

  const start = performance.now();

  // Perform aggregations
  const aggregations = {
    minPrice: Math.min(...stamps.map((s) => s.floorPriceBTC)),
    maxPrice: Math.max(...stamps.map((s) => s.floorPriceBTC)),
    avgPrice: stamps.reduce((sum, s) => sum + s.floorPriceBTC, 0) /
      stamps.length,
    medianPrice: (() => {
      const sorted = stamps.map((s) => s.floorPriceBTC).sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    })(),
    totalVolume: stamps.reduce((sum, s) => sum + s.volume24hBTC, 0),
    totalHolders: stamps.reduce((sum, s) => sum + s.holderCount, 0),
    avgQualityScore: stamps.reduce((sum, s) => sum + s.dataQualityScore, 0) /
      stamps.length,
    stampsWithHighQuality: stamps.filter((s) => s.dataQualityScore > 7)
      .length,
  };

  const end = performance.now();
  const aggregationTime = end - start;

  console.log(
    `Complex aggregations on 500 stamps completed in ${
      aggregationTime.toFixed(2)
    }ms`,
  );

  // Aggregations should complete quickly - under 5ms
  assertEquals(aggregationTime < 5, true);
  assertExists(aggregations.minPrice);
  assertExists(aggregations.maxPrice);
  assertExists(aggregations.avgPrice);
  assertExists(aggregations.medianPrice);
  assertEquals(aggregations.minPrice <= aggregations.avgPrice, true);
  assertEquals(aggregations.avgPrice <= aggregations.maxPrice, true);
});

Deno.test("Performance - JSON serialization for API responses", () => {
  // Create complex nested data structure
  const apiResponse = {
    data: Array.from({ length: 100 }, (_, i) => ({
      cpid: `API${i}`,
      marketData: {
        floorPriceBTC: Math.random() * 0.1,
        volumeSources: {
          source1: Math.random(),
          source2: Math.random(),
          source3: Math.random(),
        },
        holderStats: {
          count: Math.floor(Math.random() * 1000),
          distribution: Array.from({ length: 10 }, () => Math.random()),
        },
      },
      cacheStatus: i % 3 === 0 ? "fresh" : i % 3 === 1 ? "stale" : "expired",
    })),
    pagination: {
      page: 1,
      limit: 100,
      total: 1000,
      pages: 10,
    },
    marketSummary: {
      totalMarketCap: 123456.78,
      totalVolume24h: 12345.67,
      averageDataQuality: 8.5,
    },
  };

  // Measure serialization performance
  const start = performance.now();
  const serialized = JSON.stringify(apiResponse);
  const end = performance.now();

  const serializationTime = end - start;
  console.log(
    `JSON serialization of complex response completed in ${
      serializationTime.toFixed(2)
    }ms`,
  );

  // Measure deserialization performance
  const deserializeStart = performance.now();
  const deserialized = JSON.parse(serialized);
  const deserializeEnd = performance.now();

  const deserializationTime = deserializeEnd - deserializeStart;
  console.log(
    `JSON deserialization completed in ${deserializationTime.toFixed(2)}ms`,
  );

  // Both operations should be fast - under 2ms each
  assertEquals(serializationTime < 2, true);
  assertEquals(deserializationTime < 2, true);
  assertEquals(deserialized.data.length, 100);
  assertExists(deserialized.marketSummary);
});
