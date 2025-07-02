// Market Data Test Fixtures
// These fixtures provide consistent test data for unit tests
// All timestamps are relative to ensure tests don't break over time

export const marketDataFixtures = {
  stampMarketData: {
    validStamp: {
      cpid: "A1234567890123456789",
      floor_price_btc: "0.001",
      floor_price_usd: "50",
      avg_price_btc: "0.0015",
      avg_price_usd: "75",
      median_price_btc: "0.0012",
      median_price_usd: "60",
      holder_count: 10,
      min_price_btc: "0.0008",
      max_price_btc: "0.002",
      total_volume_btc: "1.5",
      volume_stampscan: "0.5",
      volume_openstamp: "0.5",
      volume_others: "0.5",
      price_change_24h: "5.5",
      price_change_7d: "12.3",
      price_change_30d: "-2.1",
      distribution_score: "85",
      price_quality_score: "9",
      exchange_sources: "stampscan,openstamp",
      last_sale_price_btc: "0.0011",
      last_sale_timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      last_updated: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    },
    stampWithNulls: {
      cpid: "B9876543210987654321",
      floor_price_btc: null,
      floor_price_usd: null,
      avg_price_btc: null,
      avg_price_usd: null,
      median_price_btc: null,
      median_price_usd: null,
      holder_count: null,
      min_price_btc: null,
      max_price_btc: null,
      total_volume_btc: null,
      volume_stampscan: null,
      volume_openstamp: null,
      volume_others: null,
      price_change_24h: null,
      price_change_7d: null,
      price_change_30d: null,
      distribution_score: null,
      price_quality_score: null,
      exchange_sources: null,
      last_sale_price_btc: null,
      last_sale_timestamp: null,
      last_updated: new Date(),
    },
    multipleStamps: [
      {
        cpid: "A1234567890123456789",
        stamp: 1000,
        stamp_base64: "data:image/png;base64,iVBORw0KGgoAAAANS...",
        stamp_url: "https://example.com/stamp1.png",
        stamp_mimetype: "image/png",
        tx_hash: "abc123...",
        creator: "bc1creator1...",
        supply: 100,
        divisible: false,
        locked: true,
        floor_price_btc: "0.001",
        holder_count: 10,
        volume_stampscan: "0.5",
        volume_openstamp: "0.5",
        last_updated: new Date(Date.now() - 10 * 60 * 1000),
      },
      {
        cpid: "B9876543210987654321",
        stamp: 2000,
        stamp_base64: "data:image/png;base64,iVBORw0KGgoAAAANS...",
        stamp_url: "https://example.com/stamp2.png",
        stamp_mimetype: "image/png",
        tx_hash: "def456...",
        creator: "bc1creator2...",
        supply: 1,
        divisible: false,
        locked: true,
        floor_price_btc: "0.01",
        holder_count: 1,
        volume_stampscan: "0.01",
        volume_openstamp: "0",
        last_updated: new Date(Date.now() - 30 * 60 * 1000),
      },
    ],
  },

  src20MarketData: {
    validToken: {
      tick: "PEPE",
      tick_hash: "pepehash123",
      floor_price_btc: "0.00001",
      floor_price_usd: "0.5",
      market_cap_btc: "100",
      market_cap_usd: "5000000",
      volume_24h_btc: "10",
      volume_24h_usd: "500000",
      volume_7d_btc: "50",
      volume_30d_btc: "200",
      price_change_24h: "5.5",
      price_change_7d: "15.2",
      price_change_30d: "-3.1",
      holder_count: 1000,
      exchange_sources: "stampscan,openstamp",
      last_updated: new Date(Date.now() - 5 * 60 * 1000),
    },
    multipleTokens: [
      {
        tick: "PEPE",
        tick_hash: "pepehash123",
        floor_price_btc: "0.00001",
        market_cap_btc: "100",
        volume_24h_btc: "10",
        price_change_24h: "5.5",
        holder_count: 1000,
        exchange_sources: "stampscan,openstamp",
        last_updated: new Date(),
      },
      {
        tick: "WOJAK",
        tick_hash: "wojakhash456",
        floor_price_btc: "0.000005",
        market_cap_btc: "50",
        volume_24h_btc: "5",
        price_change_24h: "-2.1",
        holder_count: 500,
        exchange_sources: "stampscan",
        last_updated: new Date(),
      },
    ],
  },

  collectionMarketData: {
    validCollection: {
      collection_id: "rare-pepes",
      min_floor_price_btc: "0.001",
      max_floor_price_btc: "0.1",
      avg_floor_price_btc: "0.01",
      median_floor_price_btc: "0.008",
      total_volume_24h_btc: "5.5",
      stamps_with_prices_count: 50,
      min_holder_count: 1,
      max_holder_count: 100,
      avg_holder_count: "25.5",
      median_holder_count: "20",
      total_unique_holders: 500,
      avg_distribution_score: "75.5",
      total_stamps_count: 100,
      last_updated: new Date(),
    },
  },

  holderData: {
    validHolders: [
      {
        address: "bc1address1",
        quantity: "100",
        percentage: "50",
        rank_position: 1,
        is_creator: false,
        first_acquired: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        last_acquired: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        address: "bc1address2",
        quantity: "60",
        percentage: "30",
        rank_position: 2,
        is_creator: false,
        first_acquired: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        last_acquired: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        address: "bc1address3",
        quantity: "40",
        percentage: "20",
        rank_position: 3,
        is_creator: true,
        first_acquired: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        last_acquired: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
    ],
  },

  // Mock database connection for testing
  mockDatabaseManager: {
    getInstance: () => ({
      executeQuery: (_query: string, _params?: any[]) => {
        return { rows: [], rowCount: 0 };
      },
    }),
  },
};

// Individual exports for backward compatibility
export const btcPriceFixture = {
  btc_usd: 100000, // $100k BTC price for testing
};

export const src20MarketDataFixture = {
  tick: "PEPE",
  price_btc: 0.00000012,
  price_usd: 0.012,
  floor_price_btc: 0.00000012,
  market_cap_btc: 1234.56,
  market_cap_usd: 123456.78,
  volume_24h_btc: 12.34,
  holder_count: 1523,
  circulating_supply: "1000000000000",
  price_change_24h_percent: 15.67,
  primary_exchange: "openstamp",
  exchange_sources: '["openstamp", "kucoin", "stampscan"]',
  data_quality_score: 9.2,
  last_updated: new Date(),
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
  circulating_supply: "100000",
  price_change_24h_percent: 0,
  primary_exchange: null,
  exchange_sources: null,
  data_quality_score: 0,
  last_updated: new Date(),
};

export const stampMarketDataFixture = {
  cpid: "A123456789ABCDEF",
  floor_price_btc: 0.00015,
  recent_sale_price_btc: 0.00016,
  holder_count: 42,
  unique_holder_count: 40,
  top_holder_percentage: 25.5,
  holder_distribution_score: 75,
  volume_24h_btc: 0.125,
  volume_7d_btc: 0.875,
  volume_30d_btc: 3.75,
  total_volume_btc: 15.0,
  volume_sources: '{"counterparty": 0.1, "exchange_a": 0.025}',
  open_dispensers_count: 2,
  closed_dispensers_count: 3,
  total_dispensers_count: 5,
  price_source: "counterparty",
  update_frequency_minutes: 30,
  data_quality_score: 8.5,
  last_updated: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
};

export const stampMarketDataNullFixture = {
  cpid: "B987654321FEDCBA",
  floor_price_btc: null,
  recent_sale_price_btc: null,
  holder_count: 0,
  unique_holder_count: 0,
  top_holder_percentage: 0,
  holder_distribution_score: 0,
  volume_24h_btc: 0,
  volume_7d_btc: 0,
  volume_30d_btc: 0,
  total_volume_btc: 0,
  volume_sources: null,
  open_dispensers_count: 0,
  closed_dispensers_count: 0,
  total_dispensers_count: 0,
  price_source: null,
  update_frequency_minutes: 60,
  data_quality_score: 0,
  last_updated: new Date(),
};

export const cacheAgeFixtures = {
  fresh: {
    last_updated: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
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
