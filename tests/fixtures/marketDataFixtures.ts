// Test fixtures for market data cache integration testing

export const stampMarketDataFixture = {
  cpid: "A123456789ABCDEF",
  floor_price_btc: 0.00015,
  recent_sale_price_btc: 0.00018,
  open_dispensers_count: 3,
  closed_dispensers_count: 12,
  total_dispensers_count: 15,
  holder_count: 42,
  unique_holder_count: 38,
  top_holder_percentage: 15.5,
  holder_distribution_score: 78,
  volume_24h_btc: 0.125,
  volume_7d_btc: 0.875,
  volume_30d_btc: 2.345,
  total_volume_btc: 5.678,
  price_source: "counterparty",
  volume_sources: JSON.stringify({ counterparty: 0.1, exchange_a: 0.025 }),
  data_quality_score: 8.5,
  confidence_level: 9,
  last_updated: new Date("2024-12-26T10:00:00Z"),
  last_price_update: new Date("2024-12-26T09:30:00Z"),
  update_frequency_minutes: 30,
};

export const stampMarketDataNullFixture = {
  cpid: "B987654321FEDCBA",
  floor_price_btc: null,
  recent_sale_price_btc: null,
  open_dispensers_count: 0,
  closed_dispensers_count: 0,
  total_dispensers_count: 0,
  holder_count: 0,
  unique_holder_count: 0,
  top_holder_percentage: 0,
  holder_distribution_score: 0,
  volume_24h_btc: 0,
  volume_7d_btc: 0,
  volume_30d_btc: 0,
  total_volume_btc: 0,
  price_source: null,
  volume_sources: null,
  data_quality_score: 0,
  confidence_level: 0,
  last_updated: new Date("2024-12-26T10:00:00Z"),
  last_price_update: null,
  update_frequency_minutes: 60,
};

export const src20MarketDataFixture = {
  tick: "PEPE",
  price_btc: 0.00000012,
  price_usd: 0.012,
  floor_price_btc: 0.00000010,
  market_cap_btc: 1234.56,
  market_cap_usd: 123456.78,
  volume_24h_btc: 12.34,
  holder_count: 1523,
  circulating_supply: "1000000000000",
  price_change_24h_percent: 15.67,
  primary_exchange: "openstamp",
  exchange_sources: JSON.stringify(["openstamp", "kucoin", "stampscan"]),
  data_quality_score: 9.2,
  last_updated: new Date("2024-12-26T10:00:00Z"),
};

export const src20MarketDataNullFixture = {
  tick: "RARE",
  price_btc: null,
  price_usd: null,
  floor_price_btc: null,
  market_cap_btc: 0,
  market_cap_usd: 0,
  volume_24h_btc: 0,
  holder_count: 5,
  circulating_supply: "1000000",
  price_change_24h_percent: 0,
  primary_exchange: null,
  exchange_sources: null,
  data_quality_score: 0,
  last_updated: new Date("2024-12-26T10:00:00Z"),
};

// Cache age test fixtures
export const cacheAgeFixtures = {
  fresh: {
    last_updated: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    expected_status: "fresh" as const,
  },
  stale: {
    last_updated: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    expected_status: "stale" as const,
  },
  expired: {
    last_updated: new Date(Date.now() - 90 * 60 * 1000), // 90 minutes ago
    expected_status: "expired" as const,
  },
};

// Filter test fixtures based on validation report findings
export const filterTestFixtures = {
  volumeFilter: {
    volume: "24h",
    volumeMin: "0.1",
    volumeMax: "1.0",
  },
  marketplaceFilter: {
    listings: "premium",
    listingsMin: "0.001",
    listingsMax: "0.01",
    sales: "recent",
    salesMin: "0.0001",
    salesMax: "0.1",
  },
  fileSizeFilter: {
    fileSize: "medium",
    fileSizeMin: "100000",
    fileSizeMax: "1000000",
  },
};

// BTC price fixture for USD calculations
export const btcPriceFixture = {
  btc_usd: 95000,
  last_updated: new Date("2024-12-26T10:00:00Z"),
};
