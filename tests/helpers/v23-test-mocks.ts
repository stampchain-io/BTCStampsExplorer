/**
 * V2.3 API Test Mocks & Utilities
 *
 * Provides standardized mocks for v2.3 API testing that align with:
 * - Updated BTCPriceService interfaces
 * - New StampController response structures
 * - Standardized market_data field names
 * - Correct TypeScript interfaces
 */

import type { StampBalance } from "$lib/types/wallet.d.ts";
import type { BTCPriceData } from "$server/services/price/btcPriceService.ts";
import type { Collection } from "../../globals.d.ts";

// XcpBalance - define locally since not found in standard imports
interface XcpBalance {
  address: string;
  asset: string;
  cpid: string;
  quantity: number;
  utxo: string;
  utxo_address: string;
  divisible: boolean;
}

// =============================================================================
// BTC PRICE SERVICE MOCKS
// =============================================================================

export const createValidBTCPriceMock = (
  overrides: Partial<BTCPriceData> = {},
): BTCPriceData => ({
  price: 50000,
  source: "cached" as const,
  confidence: "high",
  timestamp: Date.now(),
  ...overrides,
});

export const mockBTCPriceService = (mockData: Partial<BTCPriceData> = {}) => {
  const mockPrice = createValidBTCPriceMock(mockData);
  return () => Promise.resolve(mockPrice);
};

// =============================================================================
// STAMP CONTROLLER RESPONSE MOCKS
// =============================================================================

export const createStampControllerResponse = (
  data: any[],
  options: {
    includePagination?: boolean;
    includeMetadata?: boolean;
    page?: number;
    limit?: number;
    total?: number;
    last_block?: number;
  } = {},
) => {
  const {
    includePagination = true,
    includeMetadata = true,
    page = 1,
    limit = 50,
    total = data.length,
    last_block = 12345,
  } = options;

  if (includePagination && includeMetadata) {
    // Full response with pagination and metadata
    return {
      data,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total,
      last_block,
      metadata: {
        btcPrice: 50000,
        cacheStatus: "fresh",
        source: "cached" as const,
      },
    };
  } else if (includePagination) {
    // Pagination only
    return {
      data,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total,
      last_block,
    };
  } else {
    // Simple response
    return {
      data,
      last_block,
    };
  }
};

// =============================================================================
// INTERFACE-COMPLIANT MOCK DATA
// =============================================================================

export const createMockStampBalance = (
  overrides: Partial<StampBalance> = {},
): StampBalance => ({
  cpid: "A123456789",
  type: "STAMP" as const,
  quantity: 1000,
  stamp: 12345,
  divisible: false,
  ...overrides,
});

export const createMockXcpBalance = (
  overrides: Partial<XcpBalance> = {},
): XcpBalance => ({
  address: "bc1qtest123",
  asset: "STAMP",
  cpid: "A123456789",
  quantity: 1000,
  utxo: "abc123:0",
  utxo_address: "bc1qtest123",
  divisible: true,
  ...overrides,
});

export const createMockCollection = (
  overrides: Partial<Collection> = {},
): Collection => ({
  collection_id: "test-collection",
  collection_name: "Test Collection",
  collection_description: "A test collection",
  creators: ["creator1"],
  stamp_count: 10,
  total_editions: 10,
  img: "test-collection-image.svg",
  ...overrides,
});

// =============================================================================
// MARKET DATA MOCKS (V2.3 STANDARDIZED)
// =============================================================================

export const createMockMarketData = (overrides: any = {}) => ({
  floor_price_btc: "0.00001234",
  market_cap_btc: "123456789",
  volume_24h_btc: "5000.123",
  volume_7d_btc: "35000.456",
  volume_30d_btc: "150000.789",
  holder_count: 13520,
  market_data_sources: ["OpenStamp", "StampScan"],
  ...overrides,
});

// =============================================================================
// SERVICE MOCK UTILITIES
// =============================================================================

export const mockStampService = {
  getRecentSales: (page: number = 1, limit: number = 50, options: any = {}) =>
    Promise.resolve({
      recentSales: [],
      total: 0,
      btcPriceUSD: 50000,
      metadata: {
        dayRange: options.dayRange || 30,
        lastUpdated: new Date().toISOString(),
      },
    }),

  getStamps: (options: any) =>
    Promise.resolve({
      stamps: [],
      total: 0,
      last_block: 12345,
    }),
};

export const mockStampController = {
  getStampHolders: (
    id: string,
    page: number = 1,
    limit: number = 50,
    cacheType: any = "DYNAMIC",
  ) =>
    Promise.resolve({
      holders: [],
      total: 0,
      page,
      limit,
    }),
};

// =============================================================================
// REPOSITORY MOCK UTILITIES
// =============================================================================

export const mockStampRepository = {
  getStampsCreatedCount: (address: string) => Promise.resolve({ total: 0 }),
};

// =============================================================================
// COLLECTION SERVICE MOCKS
// =============================================================================

export const mockCollectionService = {
  getCollectionByName: (name: string) =>
    Promise.resolve(createMockCollection({ collection_name: name })),
};

// =============================================================================
// XCP MANAGER MOCKS
// =============================================================================

export const mockCounterpartyApiManager = {
  getAllXcpBalancesByAddress: (address: string, normalized: boolean = false) =>
    Promise.resolve({
      balances: [createMockXcpBalance({ address })],
      total: 1,
    }),
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Apply v2.3 mocks to global services for testing
 */
export const applyV23TestMocks = (customMocks: any = {}) => {
  // Apply BTC Price Service mock
  if (globalThis.BTCPriceService) {
    globalThis.BTCPriceService.getPrice = mockBTCPriceService(
      customMocks.btcPrice,
    );
  }

  // Apply other service mocks as needed
  Object.assign(globalThis, {
    mockStampService,
    mockStampController,
    mockStampRepository,
    mockCollectionService,
    mockCounterpartyApiManager,
    ...customMocks,
  });
};

/**
 * Clean up test mocks after testing
 */
export const cleanupV23TestMocks = () => {
  // Reset any global mocks if needed
  if (globalThis.BTCPriceService) {
    delete globalThis.BTCPriceService.getPrice;
  }
};
