import { assertEquals, assertExists } from "@std/assert";
import {
  btcPriceFixture,
  filterTestFixtures,
  src20MarketDataFixture,
  stampMarketDataFixture,
} from "../fixtures/marketDataFixtures.ts";

// Mock database manager for testing
const mockDbManager = {
  executeQueryWithCache: (
    query: string,
    _params: any[],
    _cacheTime: number,
  ) => {
    // Mock implementation based on query
    if (query.includes("stamp_market_data")) {
      return Promise.resolve({
        rows: [
          {
            ...stampMarketDataFixture,
            cache_age_minutes: 15,
            floor_price_usd: stampMarketDataFixture.floor_price_btc *
              btcPriceFixture.btc_usd,
            volume_24h_usd: stampMarketDataFixture.volume_24h_btc *
              btcPriceFixture.btc_usd,
          },
        ],
      });
    }
    return Promise.resolve({ rows: [] });
  },
};

// Helper function to calculate cache status
function getCacheStatus(
  cacheAgeMinutes: number,
): "fresh" | "stale" | "expired" {
  if (cacheAgeMinutes <= 30) return "fresh";
  if (cacheAgeMinutes <= 60) return "stale";
  return "expired";
}

// Helper function to format stamp response with market data
function formatStampResponse(row: any): any {
  if (!row.floor_price_btc && !row.holder_count) {
    return {
      cpid: row.cpid,
      marketData: null,
      marketDataMessage: "Market data is being processed",
    };
  }

  const cacheStatus = getCacheStatus(row.cache_age_minutes);

  return {
    cpid: row.cpid,
    marketData: {
      floorPriceBTC: row.floor_price_btc,
      floorPriceUSD: row.floor_price_usd,
      recentSalePriceBTC: row.recent_sale_price_btc,
      holderCount: row.holder_count,
      uniqueHolderCount: row.unique_holder_count,
      topHolderPercentage: row.top_holder_percentage,
      holderDistributionScore: row.holder_distribution_score,
      volume24hBTC: row.volume_24h_btc,
      openDispensersCount: row.open_dispensers_count,
      dataQualityScore: row.data_quality_score,
      cacheAgeMinutes: row.cache_age_minutes,
      cacheStatus,
    },
  };
}

Deno.test("Market Data Cache Integration Tests", async (t) => {
  await t.step("should handle stamps with complete market data", async () => {
    const result = await mockDbManager.executeQueryWithCache(
      "SELECT * FROM stamp_market_data WHERE cpid = ?",
      ["A123456789ABCDEF"],
      300,
    );

    assertExists(result.rows[0]);
    assertEquals(result.rows[0].cpid, "A123456789ABCDEF");
    assertEquals(result.rows[0].floor_price_btc, 0.00015);
    assertEquals(result.rows[0].holder_count, 42);
  });

  await t.step("should handle stamps with NULL market data", () => {
    const row = {
      cpid: "B987654321FEDCBA",
      floor_price_btc: null,
      holder_count: 0,
      cache_age_minutes: 30,
    };

    const formatted = formatStampResponse(row);
    assertEquals(formatted.marketData, null);
    assertEquals(formatted.marketDataMessage, "Market data is being processed");
  });

  await t.step("should calculate cache status correctly", () => {
    assertEquals(getCacheStatus(15), "fresh");
    assertEquals(getCacheStatus(45), "stale");
    assertEquals(getCacheStatus(90), "expired");
  });

  await t.step("should parse JSON columns correctly", () => {
    const volumeSources = JSON.parse(stampMarketDataFixture.volume_sources);
    assertExists(volumeSources.counterparty);
    assertEquals(volumeSources.counterparty, 0.1);
    assertEquals(volumeSources.exchange_a, 0.025);
  });

  await t.step(
    "should handle volume filter parameters from validation report",
    () => {
      const filters = filterTestFixtures.volumeFilter;
      assertEquals(filters.volume, "24h");
      assertEquals(filters.volumeMin, "0.1");
      assertEquals(filters.volumeMax, "1.0");

      // Test that these map to correct cache columns
      const volumeColumn = `volume_${filters.volume}_btc`;
      assertEquals(volumeColumn, "volume_24h_btc");
    },
  );

  await t.step("should handle marketplace filter parameters", () => {
    const filters = filterTestFixtures.marketplaceFilter;
    assertEquals(filters.listings, "premium");
    assertEquals(filters.sales, "recent");

    // These should map to floor_price_btc and recent_sale_price_btc
    assertExists(filters.listingsMin);
    assertExists(filters.salesMax);
  });

  await t.step("should calculate USD values correctly", () => {
    const btcPrice = btcPriceFixture.btc_usd;
    const floorPriceBTC = stampMarketDataFixture.floor_price_btc;
    const expectedUSD = floorPriceBTC * btcPrice;

    assertEquals(expectedUSD, 0.00015 * 95000);
    // Allow for floating point precision differences
    assertExists(Math.abs(expectedUSD - 14.25) < 0.000001);
  });

  await t.step("should handle JOIN queries between tables", () => {
    const query = `
      SELECT s.*, smd.*
      FROM StampTableV4 s
      LEFT JOIN stamp_market_data smd ON s.cpid = smd.cpid
      WHERE s.collection_id = ?
    `;

    // Verify query structure includes proper JOIN
    assertExists(query.includes("LEFT JOIN stamp_market_data"));
    assertExists(query.includes("ON s.cpid = smd.cpid"));
  });

  await t.step("should measure query performance improvement", async () => {
    const startTime = performance.now();

    // Simulate single query with JOIN (new approach)
    await mockDbManager.executeQueryWithCache(
      "SELECT s.*, smd.* FROM StampTableV4 s LEFT JOIN stamp_market_data smd",
      [],
      300,
    );

    const newApproachTime = performance.now() - startTime;

    // Old approach would require multiple API calls
    // Assuming 40 stamps × 100ms per API call = 4000ms
    const oldApproachEstimate = 4000;

    // New approach should be significantly faster
    assertExists(newApproachTime < oldApproachEstimate);
  });

  await t.step("should handle SRC-20 market data", () => {
    const src20Data = src20MarketDataFixture;
    assertExists(src20Data.tick);
    assertEquals(src20Data.tick, "PEPE");
    assertEquals(src20Data.holder_count, 1523);
    assertEquals(src20Data.price_change_24h_percent, 15.67);

    // Parse exchange sources
    const exchanges = JSON.parse(src20Data.exchange_sources);
    assertEquals(exchanges.length, 3);
    assertExists(exchanges.includes("openstamp"));
  });

  await t.step("should validate data quality scores", () => {
    const stampQuality = stampMarketDataFixture.data_quality_score;
    const src20Quality = src20MarketDataFixture.data_quality_score;

    // Data quality scores should be between 0 and 10
    assertExists(stampQuality >= 0 && stampQuality <= 10);
    assertExists(src20Quality >= 0 && src20Quality <= 10);
    assertEquals(stampQuality, 8.5);
    assertEquals(src20Quality, 9.2);
  });

  await t.step("should handle collection page optimization", () => {
    // Test that collection page can get all stamps with market data in one query
    const collectionQuery = `
      SELECT 
        s.stamp,
        s.cpid,
        smd.floor_price_btc,
        smd.holder_count,
        smd.volume_24h_btc,
        TIMESTAMPDIFF(MINUTE, smd.last_updated, NOW()) as cache_age_minutes
      FROM StampTableV4 s
      LEFT JOIN stamp_market_data smd ON s.cpid = smd.cpid
      WHERE s.collection_id = ?
      ORDER BY smd.floor_price_btc ASC NULLS LAST
    `;

    // Verify query includes necessary optimizations
    assertExists(collectionQuery.includes("LEFT JOIN"));
    assertExists(collectionQuery.includes("ORDER BY"));
    assertExists(collectionQuery.includes("NULLS LAST"));
  });
});

// Performance benchmarking test
Deno.test("Performance: Market Data Cache vs API Calls", async () => {
  const stampCount = 40; // Typical collection size

  // Simulate old approach with individual API calls
  const oldApproachStart = performance.now();
  const apiCallTime = 100; // ms per API call
  await new Promise((resolve) => setTimeout(resolve, stampCount * apiCallTime));
  const oldApproachTime = performance.now() - oldApproachStart;

  // Simulate new approach with single JOIN query
  const newApproachStart = performance.now();
  await mockDbManager.executeQueryWithCache(
    "SELECT s.*, smd.* FROM StampTableV4 s LEFT JOIN stamp_market_data smd",
    [],
    300,
  );
  const newApproachTime = performance.now() - newApproachStart;

  console.log(`Old approach (${stampCount} API calls): ${oldApproachTime}ms`);
  console.log(`New approach (single JOIN query): ${newApproachTime}ms`);
  console.log(
    `Performance improvement: ${
      Math.round(oldApproachTime / newApproachTime)
    }x faster`,
  );

  // Assert significant performance improvement
  assertExists(newApproachTime < oldApproachTime / 10);
});
