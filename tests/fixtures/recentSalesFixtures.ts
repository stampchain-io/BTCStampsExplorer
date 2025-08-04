import type {StampRow} from "$types/stamp.d.ts";

// Mock stamp data with various sale scenarios
export const mockStamps: StampRow[] = [
  // Recently sold stamp (1 hour ago)
  {
    stamp: 1001,
    cpid: "A123456789",
    stamp_url: "https://example.com/stamp1.png",
    stamp_mimetype: "image/png",
    creator: "1TestAddress1",
    tx_hash: "tx_hash_1",
    block_index: 800000,
    block_time: new Date("2024-01-01"),
    ident: "STAMP",
    supply: 100,
    divisible: 0,
    locked: 1,
  },
  // Sold 5 days ago
  {
    stamp: 1002,
    cpid: "A987654321",
    stamp_url: "https://example.com/stamp2.png",
    stamp_mimetype: "image/png",
    creator: "1TestAddress2",
    tx_hash: "tx_hash_2",
    block_index: 800100,
    block_time: new Date("2024-01-02"),
    ident: "STAMP",
    supply: 50,
    divisible: 0,
    locked: 1,
  },
  // Sold 25 days ago (within 30-day window)
  {
    stamp: 1003,
    cpid: "A111111111",
    stamp_url: "https://example.com/stamp3.png",
    stamp_mimetype: "image/png",
    creator: "1TestAddress3",
    tx_hash: "tx_hash_3",
    block_index: 800200,
    block_time: new Date("2024-01-03"),
    ident: "STAMP",
    supply: 200,
    divisible: 0,
    locked: 1,
  },
  // Sold 40 days ago (outside 30-day window)
  {
    stamp: 1004,
    cpid: "A222222222",
    stamp_url: "https://example.com/stamp4.png",
    stamp_mimetype: "image/png",
    creator: "1TestAddress4",
    tx_hash: "tx_hash_4",
    block_index: 800300,
    block_time: new Date("2024-01-04"),
    ident: "STAMP",
    supply: 1000,
    divisible: 0,
    locked: 1,
  },
  // No market data stamp
  {
    stamp: 1005,
    cpid: "A333333333",
    stamp_url: "https://example.com/stamp5.png",
    stamp_mimetype: "image/png",
    creator: "1TestAddress5",
    tx_hash: "tx_hash_5",
    block_index: 800400,
    block_time: new Date("2024-01-05"),
    ident: "STAMP",
    supply: 10,
    divisible: 0,
    locked: 1,
  },
];

// Mock market data with various quality scores and sale times
export const mockMarketData = [
  // High quality, recent sale
  {
    cpid: "A123456789",
    recent_sale_price_btc: 0.005,
    floor_price_btc: 0.004,
    last_price_update: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    last_sale_block_index: 850000,
    volume_24h_btc: 0.1,
    volume_7d_btc: 0.5,
    volume_30d_btc: 2.5,
    holder_count: 25,
    data_quality_score: 8.5,
  },
  // High quality, 5 days ago
  {
    cpid: "A987654321",
    recent_sale_price_btc: 0.01,
    floor_price_btc: 0.009,
    last_price_update: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    last_sale_block_index: 849000,
    volume_24h_btc: 0.05,
    volume_7d_btc: 0.2,
    volume_30d_btc: 1.0,
    holder_count: 15,
    data_quality_score: 9.0,
  },
  // Borderline quality, 25 days ago
  {
    cpid: "A111111111",
    recent_sale_price_btc: 0.002,
    floor_price_btc: 0.0018,
    last_price_update: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25), // 25 days ago
    last_sale_block_index: 848000,
    volume_24h_btc: 0.01,
    volume_7d_btc: 0.05,
    volume_30d_btc: 0.5,
    holder_count: 5,
    data_quality_score: 7.1, // Just above threshold
  },
  // Old sale, outside window
  {
    cpid: "A222222222",
    recent_sale_price_btc: 0.001,
    floor_price_btc: 0.0009,
    last_price_update: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40), // 40 days ago
    last_sale_block_index: 847000,
    volume_24h_btc: 0,
    volume_7d_btc: 0,
    volume_30d_btc: 0.1,
    holder_count: 3,
    data_quality_score: 8.0,
  },
  // Low quality data (should be filtered out)
  {
    cpid: "A444444444",
    recent_sale_price_btc: 0.003,
    floor_price_btc: 0.0025,
    last_price_update: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    last_sale_block_index: 850500,
    volume_24h_btc: 0.2,
    volume_7d_btc: 1.0,
    volume_30d_btc: 5.0,
    holder_count: 50,
    data_quality_score: 5.0, // Below threshold
  },
];

// Expected results for various test scenarios
export const expectedResults = {
  // Default query (30 days, quality >= 7)
  default: {
    count: 3,
    cpids: ["A123456789", "A987654321", "A111111111"],
    order: ["A123456789", "A987654321", "A111111111"], // Most recent first
  },
  // High quality only (score >= 8)
  highQuality: {
    count: 2,
    cpids: ["A123456789", "A987654321"],
  },
  // Recent only (last 7 days)
  recentOnly: {
    count: 2,
    cpids: ["A123456789", "A987654321"],
  },
  // Pagination test
  pagination: {
    page1: ["A123456789", "A987654321"],
    page2: ["A111111111"],
  },
};

// Mock dispense events from old XCP API approach
export const mockDispenseEvents = [
  // Multiple sales of same stamp
  {
    cpid: "A123456789",
    btc_amount: 0.005,
    block_index: 850000,
    tx_hash: "dispense_tx_1",
    timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
  },
  {
    cpid: "A123456789",
    btc_amount: 0.0045,
    block_index: 849950,
    tx_hash: "dispense_tx_2",
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
  },
  {
    cpid: "A123456789",
    btc_amount: 0.004,
    block_index: 849900,
    tx_hash: "dispense_tx_3",
    timestamp: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
  },
  // Different stamps
  {
    cpid: "A987654321",
    btc_amount: 0.01,
    block_index: 849000,
    tx_hash: "dispense_tx_4",
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
  },
  {
    cpid: "A111111111",
    btc_amount: 0.002,
    block_index: 848000,
    tx_hash: "dispense_tx_5",
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 25, // 25 days ago
  },
];

// Comparison between old and new approach
export const approachComparison = {
  oldApproach: {
    description: "XCP API fetchDispenseEvents",
    characteristics: {
      dataGranularity: "transaction-level",
      recordsPerStamp: "multiple (all recent sales)",
      apiCalls: "external XCP API",
      performance: "slow (external API)",
      dateFreshness: "real-time",
      limitation: "last 500 transactions only",
    },
    exampleOutput:
      "5 records (3 for A123456789, 1 for A987654321, 1 for A111111111)",
  },
  newApproach: {
    description: "Local market data cache",
    characteristics: {
      dataGranularity: "summary-level",
      recordsPerStamp: "one (most recent sale)",
      apiCalls: "local database",
      performance: "fast (local query)",
      dateFreshness: "cached (updated periodically)",
      limitation: "30-day window, one sale per stamp",
    },
    exampleOutput: "3 records (1 for each stamp with recent activity)",
  },
};
