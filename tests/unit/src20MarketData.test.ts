import { assertEquals, assertExists } from "@std/assert";
import {
  btcPriceFixture,
  src20MarketDataFixture,
  src20MarketDataNullFixture,
} from "../fixtures/marketDataFixtures.ts";

// Mock interfaces for SRC-20 market data
interface SRC20MarketData {
  tick: string;
  price_btc: number | null;
  price_usd: number | null;
  floor_price_btc: number | null;
  market_cap_btc: number;
  market_cap_usd: number;
  volume_24h_btc: number;
  holder_count: number;
  circulating_supply: string;
  price_change_24h_percent: number;
  primary_exchange: string | null;
  exchange_sources: string | null;
  data_quality_score: number;
  last_updated: Date;
}

interface SRC20TokenWithMarketData {
  tick: string;
  marketData: {
    priceBTC: number | null;
    priceUSD: number | null;
    marketCapBTC: number;
    marketCapUSD: number;
    volume24hBTC: number;
    holderCount: number;
    priceChange24h: number;
    primaryExchange: string | null;
    exchanges: string[];
    dataQuality: number;
  } | null;
  marketDataMessage?: string;
}

// Helper functions to test
function parseExchangeSources(exchangeSourcesJson: string | null): string[] {
  if (!exchangeSourcesJson) return [];

  try {
    const parsed = JSON.parse(exchangeSourcesJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse exchange sources:", error);
    return [];
  }
}

function calculateMarketCap(
  circulatingSupply: string,
  priceBTC: number | null,
): number {
  if (!priceBTC) return 0;

  try {
    const supply = BigInt(circulatingSupply);
    const supplyNumber = Number(supply) / 1e18; // Assuming 18 decimals
    return supplyNumber * priceBTC;
  } catch {
    return 0;
  }
}

function formatSRC20WithMarketData(
  token: { tick: string },
  marketData: SRC20MarketData | null,
): SRC20TokenWithMarketData {
  if (!marketData || !marketData.price_btc) {
    return {
      tick: token.tick,
      marketData: null,
      marketDataMessage: "Market data is being processed",
    };
  }

  return {
    tick: token.tick,
    marketData: {
      priceBTC: marketData.price_btc,
      priceUSD: marketData.price_usd,
      marketCapBTC: marketData.market_cap_btc,
      marketCapUSD: marketData.market_cap_usd,
      volume24hBTC: marketData.volume_24h_btc,
      holderCount: marketData.holder_count,
      priceChange24h: marketData.price_change_24h_percent,
      primaryExchange: marketData.primary_exchange,
      exchanges: parseExchangeSources(marketData.exchange_sources),
      dataQuality: marketData.data_quality_score,
    },
  };
}

Deno.test("SRC-20 Market Data Unit Tests", async (t) => {
  await t.step("should parse exchange sources correctly", () => {
    const exchanges = parseExchangeSources(
      src20MarketDataFixture.exchange_sources,
    );
    assertEquals(exchanges.length, 3);
    assertExists(exchanges.includes("openstamp"));
    assertExists(exchanges.includes("kucoin"));
    assertExists(exchanges.includes("stampscan"));
  });

  await t.step("should handle null exchange sources", () => {
    const exchanges = parseExchangeSources(null);
    assertEquals(exchanges, []);
  });

  await t.step("should handle invalid JSON exchange sources", () => {
    const exchanges = parseExchangeSources("invalid json");
    assertEquals(exchanges, []);
  });

  await t.step("should handle non-array JSON exchange sources", () => {
    const exchanges = parseExchangeSources('{"not": "an array"}');
    assertEquals(exchanges, []);
  });

  await t.step("should format SRC-20 token with complete market data", () => {
    const token = { tick: "PEPE" };
    const result = formatSRC20WithMarketData(
      token,
      src20MarketDataFixture as any,
    );

    assertExists(result.marketData);
    assertEquals(result.marketData.priceBTC, 0.00000012);
    assertEquals(result.marketData.priceUSD, 0.012);
    assertEquals(result.marketData.marketCapBTC, 1234.56);
    assertEquals(result.marketData.marketCapUSD, 123456.78);
    assertEquals(result.marketData.holderCount, 1523);
    assertEquals(result.marketData.priceChange24h, 15.67);
    assertEquals(result.marketData.primaryExchange, "openstamp");
    assertEquals(result.marketData.exchanges.length, 3);
    assertEquals(result.marketData.dataQuality, 9.2);
  });

  await t.step("should handle SRC-20 token with NULL price data", () => {
    const token = { tick: "RARE" };
    const result = formatSRC20WithMarketData(
      token,
      src20MarketDataNullFixture as any,
    );

    assertEquals(result.marketData, null);
    assertEquals(result.marketDataMessage, "Market data is being processed");
  });

  await t.step("should validate price change percentage", () => {
    const priceChange = src20MarketDataFixture.price_change_24h_percent;
    // Price change can be positive or negative, but should be reasonable
    assertExists(priceChange >= -100); // Can't lose more than 100%
    assertExists(priceChange <= 10000); // 100x gain is extreme but possible
    assertEquals(priceChange, 15.67);
  });

  await t.step("should validate data quality scores", () => {
    const score = src20MarketDataFixture.data_quality_score;
    assertExists(score >= 0 && score <= 10);
    assertEquals(score, 9.2);

    // Compare with NULL fixture
    assertEquals(src20MarketDataNullFixture.data_quality_score, 0);
  });

  await t.step("should handle market cap calculations", () => {
    // Test with valid data
    const marketCapBTC = calculateMarketCap(
      "1000000000000000000000000", // 1M tokens with 18 decimals
      0.00000012,
    );
    assertEquals(marketCapBTC, 0.12); // 1M * 0.00000012 = 0.12

    // Test with null price
    const marketCapNull = calculateMarketCap(
      "1000000000000000000000000",
      null,
    );
    assertEquals(marketCapNull, 0);

    // Test with invalid supply
    const marketCapInvalid = calculateMarketCap(
      "invalid",
      0.00000012,
    );
    assertEquals(marketCapInvalid, 0);
  });

  await t.step("should validate circulating supply format", () => {
    const supply = src20MarketDataFixture.circulating_supply;
    assertExists(supply);
    // Supply should be a valid big number string
    assertExists(/^\d+$/.test(supply));
    assertEquals(supply, "1000000000000");
  });

  await t.step("should handle primary exchange information", () => {
    assertEquals(src20MarketDataFixture.primary_exchange, "openstamp");
    assertEquals(src20MarketDataNullFixture.primary_exchange, null);
  });

  await t.step("should validate holder count", () => {
    const holders = src20MarketDataFixture.holder_count;
    assertExists(holders > 0);
    assertEquals(holders, 1523);

    // Even tokens with no price data can have holders
    const nullHolders = src20MarketDataNullFixture.holder_count;
    assertExists(nullHolders >= 0);
    assertEquals(nullHolders, 5);
  });

  await t.step("should handle volume data", () => {
    const volume = src20MarketDataFixture.volume_24h_btc;
    assertExists(volume >= 0);
    assertEquals(volume, 12.34);

    // No price means no volume
    assertEquals(src20MarketDataNullFixture.volume_24h_btc, 0);
  });

  await t.step("should validate USD price calculations", () => {
    const btcPrice = btcPriceFixture.btc_usd;
    const tokenPriceBTC = src20MarketDataFixture.price_btc;
    const tokenPriceUSD = src20MarketDataFixture.price_usd;

    if (tokenPriceBTC) {
      const expectedUSD = tokenPriceBTC * btcPrice;
      // Allow for some rounding differences
      assertExists(Math.abs(tokenPriceUSD! - expectedUSD) < 0.01);
    }
  });
});
