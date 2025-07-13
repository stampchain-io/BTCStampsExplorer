/**
 * Test factory utilities for creating properly typed mock data
 * These factories ensure test data matches production interfaces
 * Enhanced with fixture data for realistic test scenarios
 */

import type { SRC20MarketData, StampMarketData } from "$types/marketData.d.ts";
import type { CollectionRow } from "$server/types/collection.d.ts";
import type { PSBTInput, UTXO } from "$types/index.d.ts";
import type { BTCBalance } from "$types/wallet.d.ts";
import type { StampRow } from "$globals";
import {
  getRandomCollection,
  getRandomMarketData,
  getRandomSRC20Stats,
  getRandomSRC20Token,
  getRandomStamp,
  getRealisticBitcoinAddresses,
  getRealisticCPIDs,
  getRealisticTxHashes,
} from "./fixtureLoader.ts";

/**
 * Creates a properly typed StampMarketData object with all required fields
 * @param overrides - Optional partial data to override defaults
 * @param useFixtureData - When true, uses realistic data from fixture files instead of hardcoded defaults
 */
export function createMockStampMarketData(
  overrides?: Partial<StampMarketData>,
  useFixtureData = false,
): StampMarketData {
  let baseData: Partial<StampMarketData> = {};

  if (useFixtureData) {
    try {
      const fixtureData = getRandomMarketData("stamp");
      // Type guard to ensure we have stamp market data
      if ("cpid" in fixtureData) {
        baseData = {
          cpid: fixtureData.cpid || "A111111111111111",
          floorPriceBTC: fixtureData.floor_price_btc
            ? parseFloat(fixtureData.floor_price_btc)
            : null,
          recentSalePriceBTC: fixtureData.recent_sale_price_btc
            ? parseFloat(fixtureData.recent_sale_price_btc)
            : null,
          openDispensersCount: fixtureData.open_dispensers_count || 0,
          closedDispensersCount: fixtureData.closed_dispensers_count || 0,
          totalDispensersCount: fixtureData.total_dispensers_count || 0,
          holderCount: fixtureData.holder_count || 1,
          uniqueHolderCount: fixtureData.unique_holder_count || 1,
          topHolderPercentage: parseFloat(
            fixtureData.top_holder_percentage || "100",
          ),
          holderDistributionScore: parseFloat(
            fixtureData.holder_distribution_score || "0",
          ),
          volume24hBTC: parseFloat(fixtureData.volume_24h_btc || "0"),
          volume7dBTC: parseFloat(fixtureData.volume_7d_btc || "0"),
          volume30dBTC: parseFloat(fixtureData.volume_30d_btc || "0"),
          totalVolumeBTC: parseFloat(fixtureData.total_volume_btc || "0"),
          priceSource: fixtureData.price_source || null,
          volumeSources: fixtureData.volume_sources
            ? JSON.parse(fixtureData.volume_sources)
            : null,
          dataQualityScore: parseFloat(fixtureData.data_quality_score || "5"),
          confidenceLevel: parseFloat(fixtureData.confidence_level || "5"),
          lastUpdated: fixtureData.last_updated
            ? new Date(fixtureData.last_updated)
            : new Date(),
          lastPriceUpdate: fixtureData.last_price_update
            ? new Date(fixtureData.last_price_update)
            : null,
          updateFrequencyMinutes: fixtureData.update_frequency_minutes || 60,
        };
      }
    } catch (error) {
      // Fallback to default data if fixture loading fails
      baseData = {};
    }
  }

  return {
    cpid: "A111111111111111",
    floorPriceBTC: null,
    recentSalePriceBTC: null,
    openDispensersCount: 0,
    closedDispensersCount: 0,
    totalDispensersCount: 0,
    holderCount: 1,
    uniqueHolderCount: 1,
    topHolderPercentage: 100,
    holderDistributionScore: 0,
    volume24hBTC: 0,
    volume7dBTC: 0,
    volume30dBTC: 0,
    totalVolumeBTC: 0,
    priceSource: null,
    volumeSources: null,
    dataQualityScore: 0,
    confidenceLevel: 0,
    lastUpdated: new Date(),
    lastPriceUpdate: null,
    updateFrequencyMinutes: 60,
    // Transaction detail fields
    lastSaleTxHash: null,
    lastSaleBuyerAddress: null,
    lastSaleDispenserAddress: null,
    lastSaleBtcAmount: null,
    lastSaleDispenserTxHash: null,
    lastSaleBlockIndex: null,
    // Activity tracking fields
    activityLevel: null,
    lastActivityTime: null,
    ...baseData,
    ...overrides,
  };
}

/**
 * Creates a properly typed UTXO object
 * @param overrides - Optional partial data to override defaults
 * @param useFixtureData - When true, uses realistic txid and address data from fixture files
 */
export function createMockUTXO(
  overrides?: Partial<UTXO>,
  useFixtureData = false,
): UTXO {
  let baseData: Partial<UTXO> = {};

  if (useFixtureData) {
    try {
      const txHashes = getRealisticTxHashes();
      const addresses = getRealisticBitcoinAddresses();
      if (txHashes.length > 0 && addresses.length > 0) {
        baseData = {
          txid: txHashes[Math.floor(Math.random() * txHashes.length)],
          address: addresses[Math.floor(Math.random() * addresses.length)],
        };
      }
    } catch (error) {
      // Fallback to default data if fixture loading fails
      baseData = {};
    }
  }

  return {
    txid: "0".repeat(64),
    vout: 0,
    value: 50000,
    script: "76a914" + "0".repeat(40) + "88ac",
    scriptType: "P2PKH",
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    confirmations: 6,
    ancestors: [],
    ...baseData,
    ...overrides,
  };
}

/**
 * Creates a properly typed PSBTInput object with BigInt values
 */
export function createMockPSBTInput(overrides?: Partial<PSBTInput>): PSBTInput {
  return {
    hash: "0".repeat(64),
    index: 0,
    witnessUtxo: {
      script: new Uint8Array([0x76, 0xa9, 0x14]),
      value: BigInt(50000),
    },
    sequence: 0xffffffff,
    ...overrides,
  };
}

/**
 * Creates a properly typed Collection object
 * @param overrides - Optional partial data to override defaults
 * @param useFixtureData - When true, uses realistic collection data from fixture files
 */
export function createMockCollection(
  overrides?: Partial<CollectionRow>,
  useFixtureData = false,
): CollectionRow {
  let baseData: Partial<CollectionRow> = {};

  if (useFixtureData) {
    try {
      const fixtureData = getRandomCollection();
      baseData = {
        collection_id: fixtureData.collection_id,
        collection_name: fixtureData.collection_name,
        collection_description: fixtureData.collection_description,
        // Collections in fixtures don't have these fields, so use defaults
        creators: ["bc1qcreator"],
        stamp_count: 10,
        total_editions: 100,
        stamps: [1, 2, 3, 4, 5],
        img: "https://example.com/collection.png",
      };
    } catch (error) {
      // Fallback to default data if fixture loading fails
      baseData = {};
    }
  }

  return {
    collection_id: "test-collection",
    collection_name: "Test Collection",
    collection_description: "A test collection",
    creators: ["bc1qcreator"],
    stamp_count: 10,
    total_editions: 100,
    stamps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    img: "https://example.com/collection.png",
    ...baseData,
    ...overrides,
  };
}

/**
 * Creates a properly typed SRC20MarketData object
 * @param overrides - Optional partial data to override defaults
 * @param useFixtureData - When true, uses realistic SRC20 token data from fixture files
 */
export function createMockSRC20MarketData(
  overrides?: Partial<SRC20MarketData>,
  useFixtureData = false,
): SRC20MarketData {
  let baseData: Partial<SRC20MarketData> = {};

  if (useFixtureData) {
    try {
      // Use SRC20 token stats for realistic data
      const tokenData = getRandomSRC20Token();
      const statsData = getRandomSRC20Stats();
      if (tokenData && statsData) {
        baseData = {
          tick: tokenData.tick || statsData.tick || "TEST",
          holderCount: statsData.holders_count || 0,
          circulatingSupply: statsData.total_minted || "0",
          lastUpdated: statsData.last_updated
            ? new Date(statsData.last_updated)
            : new Date(),
          // Generate reasonable random values for price/volume data
          priceBTC: Math.random() > 0.7 ? Math.random() * 0.001 : null,
          volume24hBTC: Math.random() * 0.1,
          dataQualityScore: 5 + Math.floor(Math.random() * 5),
        };
      }
    } catch (error) {
      // Fallback to default data if fixture loading fails
      baseData = {};
    }
  }

  return {
    tick: "TEST",
    priceBTC: null,
    priceUSD: null,
    floorPriceBTC: null,
    marketCapBTC: 0,
    marketCapUSD: 0,
    volume24hBTC: 0,
    volume7dBTC: 0,
    volume30dBTC: 0,
    totalVolumeBTC: 0,
    holderCount: 0,
    circulatingSupply: "0",
    priceChange24hPercent: 0,
    priceChange7dPercent: 0,
    priceChange30dPercent: 0,
    primaryExchange: null,
    exchangeSources: null,
    dataQualityScore: 0,
    lastUpdated: new Date(),
    ...baseData,
    ...overrides,
  };
}

/**
 * Creates a properly typed BTCBalance object
 */
export function createMockBTCBalance(
  overrides?: Partial<BTCBalance>,
): BTCBalance {
  return {
    confirmed: 100000000,
    unconfirmed: 0,
    total: 100000000,
    txCount: 1,
    unconfirmedTxCount: 0,
    ...overrides,
  };
}

/**
 * Creates a mock database manager with common methods
 */
export function createMockDatabaseManager() {
  return {
    query: (_query: string, _params?: any[]) => Promise.resolve({ rows: [] }),
    queryObject: (_query: string, _params?: any[]) =>
      Promise.resolve({ rows: [] }),
    execute: (_query: string, _params?: any[]) =>
      Promise.resolve({ affectedRows: 0 }),
    transaction: async (fn: () => Promise<any>) => await fn(),
    close: () => Promise.resolve(),
  };
}

/**
 * Helper to convert number to BigInt for test data
 */
export function toBigInt(value: number | string | bigint): bigint {
  return BigInt(value);
}

/**
 * Creates a properly typed Src20Detail object
 */
export function createMockSrc20Detail(
  overrides?: Partial<any>, // Using any for flexibility in tests
): any {
  return {
    tx_hash: "0".repeat(64),
    block_index: 12345,
    p: "src-20",
    op: "deploy",
    tick: "TEST",
    creator: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    amt: null,
    deci: 18,
    lim: "1000",
    max: "1000000",
    destination: "",
    block_time: "2024-01-01T00:00:00.000Z",
    creator_name: null,
    destination_name: "",
    ...overrides,
  };
}

/**
 * Creates a properly typed mint progress response
 */
export function createMockMintProgress(overrides?: Partial<any>): any {
  return {
    max_supply: "1000000",
    total_minted: "500000",
    limit: "1000",
    total_mints: 500,
    progress: "50.000",
    decimals: 18,
    holders: 25,
    tx_hash: "0".repeat(64),
    tick: "TEST",
    ...overrides,
  };
}

/**
 * Creates a properly typed SRC20 balance response
 */
export function createMockSrc20BalanceResponse(overrides?: Partial<any>): any {
  return {
    last_block: 12345,
    data: {
      amt: "1000",
      tick: "TEST",
      address: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    },
    ...overrides,
  };
}

/**
 * Creates a simple balance object for direct amt access (for utility functions)
 */
export function createMockSimpleBalance(overrides?: Partial<any>): any {
  return {
    amt: "1000",
    tick: "TEST",
    address: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    ...overrides,
  };
}

/**
 * Helper to create BigInt literals for tests
 */
export const BIG = {
  ZERO: BigInt(0),
  ONE: BigInt(1),
  SATOSHI: BigInt(1),
  DUST: BigInt(546),
  FEE: BigInt(1000),
  COIN: BigInt(100000000),
};

/**
 * Mock network objects for testing Bitcoin-related functionality
 */
export const createMockNetworks = () => ({
  bitcoin: {
    bech32: "bc",
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
  },
  testnet: {
    bech32: "tb",
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
    bip32: {
      public: 0x043587cf,
      private: 0x04358394,
    },
  },
});

/**
 * Creates mock Bitcoin address test data
 */
export function createMockAddressTestData() {
  return {
    mainnet: {
      p2wpkh: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
      p2pkh: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      p2sh: "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
    },
    testnet: {
      p2wpkh: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
      p2pkh: "mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn",
      p2sh: "2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc",
    },
    invalid: ["invalid-address", "", "bc1invalid", "1invalid"],
  };
}

/**
 * Creates a properly typed StampRow object with all required fields
 * @param overrides - Optional partial data to override defaults
 * @param useFixtureData - When true, uses realistic stamp data from fixture files
 */
export function createMockStampRow(
  overrides?: Partial<StampRow>,
  useFixtureData = false,
): StampRow {
  let baseData: Partial<StampRow> = {};

  if (useFixtureData) {
    try {
      const fixtureData = getRandomStamp();
      baseData = {
        stamp: fixtureData.stamp,
        block_index: fixtureData.block_index,
        cpid: fixtureData.cpid,
        creator: fixtureData.creator,
        divisible: fixtureData.divisible === 1,
        keyburn: fixtureData.keyburn,
        locked: fixtureData.locked,
        stamp_base64: "", // stamp_base64 not available in fixtures
        stamp_mimetype: fixtureData.stamp_mimetype,
        stamp_url: fixtureData.stamp_url,
        supply: fixtureData.supply,
        block_time: new Date(fixtureData.block_time),
        tx_hash: fixtureData.tx_hash,
        tx_index: fixtureData.tx_index,
        ident: fixtureData.ident as any, // Cast to match enum
        creator_name: null, // Not available in fixtures
        stamp_hash: fixtureData.stamp_hash || "",
        file_hash: fixtureData.file_hash || "",
        unbound_quantity: 0, // Default value
      };
    } catch (error) {
      // Fallback to default data if fixture loading fails
      baseData = {};
    }
  }

  return {
    stamp: 1,
    block_index: 780000,
    cpid: "A111111111111111",
    creator: "bc1qcreator123456789abcdef",
    divisible: false,
    keyburn: null,
    locked: 0,
    stamp_base64:
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    stamp_mimetype: "image/png",
    stamp_url: "https://stampchain.io/stamps/1",
    supply: 1,
    block_time: new Date("2023-05-01T00:00:00Z"),
    tx_hash: "abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    tx_index: 0,
    ident: "STAMP",
    creator_name: null,
    stamp_hash: "test_stamp_hash",
    file_hash: "test_file_hash",
    unbound_quantity: 0,
    ...baseData,
    ...overrides,
  };
}
