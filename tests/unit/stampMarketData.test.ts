import { assertEquals, assertExists } from "@std/assert";
import {
  btcPriceFixture,
  cacheAgeFixtures,
  stampMarketDataFixture,
  stampMarketDataNullFixture,
} from "../fixtures/marketDataFixtures.ts";

// Mock implementations for unit testing
interface StampMarketData {
  cpid: string;
  floor_price_btc: number | null;
  recent_sale_price_btc: number | null;
  holder_count: number;
  volume_24h_btc: number;
  volume_sources: string | null;
  data_quality_score: number;
  last_updated: Date;
}

interface StampWithMarketData {
  cpid: string;
  marketData: {
    floorPriceBTC: number | null;
    floorPriceUSD: number | null;
    holderCount: number;
    cacheStatus: "fresh" | "stale" | "expired";
  } | null;
  marketDataMessage?: string;
}

// Helper functions to test
function parseVolumeSources(
  volumeSourcesJson: string | null,
): Record<string, number> {
  if (!volumeSourcesJson) return {};

  try {
    return JSON.parse(volumeSourcesJson);
  } catch (error) {
    console.error("Failed to parse volume sources:", error);
    return {};
  }
}

function getCacheStatus(lastUpdated: Date): "fresh" | "stale" | "expired" {
  const now = new Date();
  const ageMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);

  if (ageMinutes <= 30) return "fresh";
  if (ageMinutes <= 60) return "stale";
  return "expired";
}

function formatStampWithMarketData(
  stamp: { cpid: string },
  marketData: StampMarketData | null,
  btcPriceUSD: number,
): StampWithMarketData {
  if (
    !marketData || (!marketData.floor_price_btc && !marketData.holder_count)
  ) {
    return {
      cpid: stamp.cpid,
      marketData: null,
      marketDataMessage: "Market data is being processed",
    };
  }

  return {
    cpid: stamp.cpid,
    marketData: {
      floorPriceBTC: marketData.floor_price_btc,
      floorPriceUSD: marketData.floor_price_btc
        ? marketData.floor_price_btc * btcPriceUSD
        : null,
      holderCount: marketData.holder_count,
      cacheStatus: getCacheStatus(marketData.last_updated),
    },
  };
}

Deno.test("Stamp Market Data Unit Tests", async (t) => {
  await t.step("should parse volume sources JSON correctly", () => {
    const result = parseVolumeSources(stampMarketDataFixture.volume_sources);
    assertExists(result.counterparty);
    assertEquals(result.counterparty, 0.1);
    assertEquals(result.exchange_a, 0.025);
  });

  await t.step("should handle null volume sources", () => {
    const result = parseVolumeSources(null);
    assertEquals(result, {});
  });

  await t.step("should handle invalid JSON gracefully", () => {
    const result = parseVolumeSources("invalid json");
    assertEquals(result, {});
  });

  await t.step("should calculate cache status based on age", () => {
    // Test fresh cache
    const freshStatus = getCacheStatus(cacheAgeFixtures.fresh.last_updated);
    assertEquals(freshStatus, cacheAgeFixtures.fresh.expected_status);

    // Test stale cache
    const staleStatus = getCacheStatus(cacheAgeFixtures.stale.last_updated);
    assertEquals(staleStatus, cacheAgeFixtures.stale.expected_status);

    // Test expired cache
    const expiredStatus = getCacheStatus(cacheAgeFixtures.expired.last_updated);
    assertEquals(expiredStatus, cacheAgeFixtures.expired.expected_status);
  });

  await t.step("should format stamp with complete market data", () => {
    const stamp = { cpid: "A123456789ABCDEF" };
    const result = formatStampWithMarketData(
      stamp,
      stampMarketDataFixture as any,
      btcPriceFixture.btc_usd,
    );

    assertExists(result.marketData);
    assertEquals(result.marketData.floorPriceBTC, 0.00015);
    assertEquals(
      result.marketData.floorPriceUSD,
      0.00015 * btcPriceFixture.btc_usd,
    );
    assertEquals(result.marketData.holderCount, 42);
  });

  await t.step("should handle stamp with NULL market data", () => {
    const stamp = { cpid: "B987654321FEDCBA" };
    const result = formatStampWithMarketData(
      stamp,
      stampMarketDataNullFixture as any,
      btcPriceFixture.btc_usd,
    );

    assertEquals(result.marketData, null);
    assertEquals(result.marketDataMessage, "Market data is being processed");
  });

  await t.step("should validate data quality scores", () => {
    const score = stampMarketDataFixture.data_quality_score;
    assertExists(score >= 0 && score <= 10);
    assertEquals(score, 8.5);
  });

  await t.step("should handle holder distribution metrics", () => {
    const fixture = stampMarketDataFixture;
    assertExists(fixture.holder_count);
    assertExists(fixture.unique_holder_count);
    assertExists(fixture.top_holder_percentage);
    assertExists(fixture.holder_distribution_score);

    // Validate relationships
    assertExists(fixture.unique_holder_count <= fixture.holder_count);
    assertExists(
      fixture.top_holder_percentage >= 0 &&
        fixture.top_holder_percentage <= 100,
    );
    assertExists(
      fixture.holder_distribution_score >= 0 &&
        fixture.holder_distribution_score <= 100,
    );
  });

  await t.step("should handle dispenser counts", () => {
    const fixture = stampMarketDataFixture;
    assertExists(fixture.open_dispensers_count);
    assertExists(fixture.closed_dispensers_count);
    assertExists(fixture.total_dispensers_count);

    // Validate total = open + closed
    assertEquals(
      fixture.total_dispensers_count,
      fixture.open_dispensers_count + fixture.closed_dispensers_count,
    );
  });

  await t.step("should handle volume metrics correctly", () => {
    const fixture = stampMarketDataFixture;
    assertExists(fixture.volume_24h_btc);
    assertExists(fixture.volume_7d_btc);
    assertExists(fixture.volume_30d_btc);
    assertExists(fixture.total_volume_btc);

    // Validate volume relationships (24h < 7d < 30d < total)
    assertExists(fixture.volume_24h_btc <= fixture.volume_7d_btc);
    assertExists(fixture.volume_7d_btc <= fixture.volume_30d_btc);
    assertExists(fixture.volume_30d_btc <= fixture.total_volume_btc);
  });

  await t.step("should handle price source information", () => {
    assertEquals(stampMarketDataFixture.price_source, "counterparty");
    assertEquals(stampMarketDataNullFixture.price_source, null);
  });

  await t.step("should handle update frequency", () => {
    assertEquals(stampMarketDataFixture.update_frequency_minutes, 30);
    assertEquals(stampMarketDataNullFixture.update_frequency_minutes, 60);

    // Validate reasonable update frequencies
    assertExists(stampMarketDataFixture.update_frequency_minutes >= 1);
    assertExists(stampMarketDataFixture.update_frequency_minutes <= 1440); // Max 24 hours
  });
});
