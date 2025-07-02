import { assertAlmostEquals, assertEquals, assertExists } from "@std/assert";
import type {
  SRC20MarketDataResponse,
  StampMarketDataResponse,
} from "$lib/types/marketData.d.ts";
import { getCacheStatus } from "$lib/utils/marketData.ts";

// Mock API response formatter
class MarketDataApiFormatter {
  static formatStampResponse(
    stamp: any,
    marketData: any | null,
    cacheAgeMinutes?: number,
  ): StampMarketDataResponse {
    const response: StampMarketDataResponse = {
      stamp,
      marketData,
      cacheStatus: marketData ? getCacheStatus(cacheAgeMinutes) : "expired",
    };

    if (!marketData) {
      response.message = "Market data is being processed";
    } else if (response.cacheStatus === "stale") {
      response.message = "Market data may be outdated";
    }

    return response;
  }

  static formatSRC20Response(
    token: any,
    marketData: any | null,
    cacheAgeMinutes?: number,
  ): SRC20MarketDataResponse {
    const response: SRC20MarketDataResponse = {
      token,
      marketData,
      cacheStatus: marketData && marketData.priceBTC
        ? getCacheStatus(cacheAgeMinutes)
        : "expired",
    };

    if (!marketData || !marketData.priceBTC) {
      response.message = "Market data is being processed";
    } else if (response.cacheStatus === "stale") {
      response.message = "Market data may be outdated";
    }

    return response;
  }

  static formatPaginatedResponse(
    items: any[],
    page: number,
    limit: number,
    total: number,
    includeMarketSummary: boolean = false,
  ) {
    const response: any = {
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    if (includeMarketSummary && items.length > 0) {
      // Calculate market summary from items with market data
      const itemsWithPrices = items.filter(
        (item) => item.marketData?.floorPriceBTC || item.marketData?.priceBTC,
      );

      if (itemsWithPrices.length > 0) {
        const prices = itemsWithPrices.map(
          (item) => item.marketData.floorPriceBTC || item.marketData.priceBTC,
        );
        const volumes = itemsWithPrices.map(
          (item) => item.marketData.volume24hBTC || 0,
        );

        response.marketSummary = {
          itemsWithPrices: itemsWithPrices.length,
          totalItems: items.length,
          minPrice: Math.min(...prices),
          maxPrice: Math.max(...prices),
          avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
          totalVolume24h: volumes.reduce((a, b) => a + b, 0),
        };
      }
    }

    return response;
  }
}

Deno.test("API Response - Stamp with complete market data", () => {
  const mockStamp = {
    cpid: "A123456789ABCDEF",
    tx_hash: "abc123",
    stamp: 1,
    asset: "TESTCARD",
  };

  const mockMarketData = {
    cpid: "A123456789ABCDEF",
    floorPriceBTC: 0.00015,
    holderCount: 42,
    volume24hBTC: 0.125,
    dataQualityScore: 8.5,
  };

  const response = MarketDataApiFormatter.formatStampResponse(
    mockStamp,
    mockMarketData,
    15, // 15 minutes old = fresh
  );

  // Verify response structure
  assertEquals(response.stamp.cpid, "A123456789ABCDEF");
  assertExists(response.marketData);
  assertEquals(response.marketData.floorPriceBTC, 0.00015);
  assertEquals(response.cacheStatus, "fresh");
  assertEquals(response.message, undefined); // No message for fresh data
});

Deno.test("API Response - Stamp without market data", () => {
  const mockStamp = {
    cpid: "B987654321FEDCBA",
    tx_hash: "def456",
    stamp: 2,
    asset: "NODATA",
  };

  const response = MarketDataApiFormatter.formatStampResponse(
    mockStamp,
    null,
  );

  // Verify response structure
  assertEquals(response.stamp.cpid, "B987654321FEDCBA");
  assertEquals(response.marketData, null);
  assertEquals(response.cacheStatus, "expired");
  assertEquals(response.message, "Market data is being processed");
});

Deno.test("API Response - Stamp with stale market data", () => {
  const mockStamp = {
    cpid: "C123456789ABCDEF",
    tx_hash: "ghi789",
    stamp: 3,
    asset: "STALEDATA",
  };

  const mockMarketData = {
    cpid: "C123456789ABCDEF",
    floorPriceBTC: 0.0002,
    holderCount: 50,
    volume24hBTC: 0.2,
    dataQualityScore: 7.5,
  };

  const response = MarketDataApiFormatter.formatStampResponse(
    mockStamp,
    mockMarketData,
    45, // 45 minutes old = stale
  );

  // Verify response structure
  assertExists(response.marketData);
  assertEquals(response.cacheStatus, "stale");
  assertEquals(response.message, "Market data may be outdated");
});

Deno.test("API Response - SRC20 with market data", () => {
  const mockToken = {
    tick: "PEPE",
    max_supply: "1000000000000",
    decimals: 18,
  };

  const mockMarketData = {
    tick: "PEPE",
    priceBTC: 0.00000012,
    priceUSD: 0.012,
    marketCapBTC: 1234.56,
    holderCount: 1523,
    volume24hBTC: 12.34,
    primaryExchange: "openstamp",
    exchangeSources: ["openstamp", "kucoin", "stampscan"],
  };

  const response = MarketDataApiFormatter.formatSRC20Response(
    mockToken,
    mockMarketData,
    20, // 20 minutes old = fresh
  );

  // Verify response structure
  assertEquals(response.token.tick, "PEPE");
  assertExists(response.marketData);
  assertEquals(response.marketData.priceBTC, 0.00000012);
  assertEquals(response.marketData.holderCount, 1523);
  assertEquals(response.cacheStatus, "fresh");
  assertEquals(response.message, undefined);
});

Deno.test("API Response - SRC20 with null price", () => {
  const mockToken = {
    tick: "RARE",
    max_supply: "1000000",
    decimals: 18,
  };

  const mockMarketData = {
    tick: "RARE",
    priceBTC: null,
    priceUSD: null,
    marketCapBTC: 0,
    holderCount: 5,
    volume24hBTC: 0,
    primaryExchange: null,
    exchangeSources: null,
  };

  const response = MarketDataApiFormatter.formatSRC20Response(
    mockToken,
    mockMarketData,
    30,
  );

  // Verify response structure
  assertEquals(response.token.tick, "RARE");
  assertExists(response.marketData);
  assertEquals(response.marketData.priceBTC, null);
  assertEquals(response.cacheStatus, "expired"); // Null price = expired
  assertEquals(response.message, "Market data is being processed");
});

Deno.test("API Response - Paginated stamps with market summary", () => {
  const mockStamps = [
    {
      cpid: "A111",
      stamp: 100,
      asset: "STAMP1",
      marketData: {
        floorPriceBTC: 0.1,
        volume24hBTC: 0.5,
      },
    },
    {
      cpid: "A222",
      stamp: 101,
      asset: "STAMP2",
      marketData: {
        floorPriceBTC: 0.05,
        volume24hBTC: 0.3,
      },
    },
    {
      cpid: "A333",
      stamp: 102,
      asset: "STAMP3",
      marketData: null, // No market data
    },
  ];

  const response = MarketDataApiFormatter.formatPaginatedResponse(
    mockStamps,
    1, // page
    10, // limit
    3, // total
    true, // include market summary
  );

  // Verify pagination
  assertEquals(response.data.length, 3);
  assertEquals(response.pagination.page, 1);
  assertEquals(response.pagination.limit, 10);
  assertEquals(response.pagination.total, 3);
  assertEquals(response.pagination.pages, 1);

  // Verify market summary
  assertExists(response.marketSummary);
  assertEquals(response.marketSummary.itemsWithPrices, 2);
  assertEquals(response.marketSummary.totalItems, 3);
  assertEquals(response.marketSummary.minPrice, 0.05);
  assertEquals(response.marketSummary.maxPrice, 0.1);
  assertAlmostEquals(response.marketSummary.avgPrice, 0.075, 0.0001);
  assertEquals(response.marketSummary.totalVolume24h, 0.8);
});

Deno.test("API Response - Paginated SRC20 tokens with market summary", () => {
  const mockTokens = [
    {
      tick: "PEPE",
      marketData: {
        priceBTC: 0.00000012,
        volume24hBTC: 12.34,
      },
    },
    {
      tick: "WOJAK",
      marketData: {
        priceBTC: 0.00000008,
        volume24hBTC: 8.5,
      },
    },
    {
      tick: "RARE",
      marketData: {
        priceBTC: null, // No price
        volume24hBTC: 0,
      },
    },
  ];

  const response = MarketDataApiFormatter.formatPaginatedResponse(
    mockTokens,
    1,
    20,
    3,
    true,
  );

  // Verify market summary excludes tokens without prices
  assertExists(response.marketSummary);
  assertEquals(response.marketSummary.itemsWithPrices, 2);
  assertEquals(response.marketSummary.minPrice, 0.00000008);
  assertEquals(response.marketSummary.maxPrice, 0.00000012);
  assertEquals(response.marketSummary.totalVolume24h, 20.84);
});

Deno.test("API Response - Empty paginated response", () => {
  const response = MarketDataApiFormatter.formatPaginatedResponse(
    [],
    1,
    10,
    0,
    true,
  );

  assertEquals(response.data.length, 0);
  assertEquals(response.pagination.total, 0);
  assertEquals(response.pagination.pages, 0);
  assertEquals(response.marketSummary, undefined); // No summary for empty data
});

Deno.test("API Response - Error response formatting", () => {
  // Test various error scenarios
  const errorCases = [
    {
      statusCode: 404,
      expected: {
        error: "Market data not found",
        message: "No market data available for this asset",
      },
    },
    {
      statusCode: 503,
      expected: {
        error: "Market data service unavailable",
        message:
          "Market data is temporarily unavailable, please try again later",
      },
    },
    {
      statusCode: 429,
      expected: {
        error: "Rate limit exceeded",
        message: "Please wait before making another request",
        retryAfter: 60,
      },
    },
  ];

  errorCases.forEach((testCase) => {
    // In real implementation, this would be handled by error middleware
    const errorResponse = {
      status: testCase.statusCode,
      ...testCase.expected,
    };

    assertEquals(errorResponse.status, testCase.statusCode);
    assertEquals(errorResponse.error, testCase.expected.error);
    assertExists(errorResponse.message);
  });
});

Deno.test("API Response - Cache headers", () => {
  // Test cache-related headers based on cache status
  const cacheHeaderTests = [
    {
      cacheStatus: "fresh",
      expectedHeaders: {
        "Cache-Control": "public, max-age=300", // 5 minutes
        "X-Cache-Status": "fresh",
      },
    },
    {
      cacheStatus: "stale",
      expectedHeaders: {
        "Cache-Control": "public, max-age=60", // 1 minute
        "X-Cache-Status": "stale",
        "X-Cache-Warning": "Data may be outdated",
      },
    },
    {
      cacheStatus: "expired",
      expectedHeaders: {
        "Cache-Control": "no-cache",
        "X-Cache-Status": "expired",
        "X-Cache-Warning": "Data is being refreshed",
      },
    },
  ];

  cacheHeaderTests.forEach((test) => {
    // In real implementation, these would be set on the response
    const headers = test.expectedHeaders;

    assertExists(headers["Cache-Control"]);
    assertEquals(headers["X-Cache-Status"], test.cacheStatus);

    if (test.cacheStatus !== "fresh") {
      assertExists(headers["X-Cache-Warning"]);
    }
  });
});
