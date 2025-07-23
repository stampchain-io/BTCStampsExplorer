import { StampController } from "$server/controller/stampController.ts";
import { MarketDataRepository } from "$server/database/marketDataRepository.ts";
import { BTCPriceService } from "$server/services/price/btcPriceService.ts";
import { StampService } from "$server/services/stampService.ts";
import { assertEquals, assertExists, assertRejects } from "@std/assert";

// Mock the services
const originalGetPrice = BTCPriceService.getPrice;
const originalGetStamps = StampService.getStamps;

Deno.test("StampController.getStamps fetches BTC price once per request", async () => {
  let btcPriceFetchCount = 0;
  let stampServiceCallCount = 0;

  // Mock BTC price service
  BTCPriceService.getPrice = () => {
    btcPriceFetchCount++;
    return Promise.resolve({
      price: 50000,
      source: "default" as const,
      confidence: "high",
      timestamp: Date.now(),
    });
  };

  // Mock stamp service
  StampService.getStamps = (options: any) => {
    stampServiceCallCount++;
    assertEquals(
      options.btcPriceUSD,
      50000,
      "BTC price should be passed to service",
    );

    return Promise.resolve({
      stamps: [
        {
          cpid: "A123456789",
          stamp_url: "test.jpg",
          ident: "STAMP",
          marketData: {
            floorPriceBTC: 0.001,
            openDispensersCount: 5,
          },
          cacheStatus: "fresh",
        },
      ],
      last_block: 820000,
      page: 1,
      page_size: 20,
      pages: 1,
      total: 1,
    });
  };

  try {
    // Test collection page request
    const result = await StampController.getStamps({
      page: 1,
      limit: 20,
      collectionId: "test-collection",
    });

    // Verify BTC price was fetched only once
    assertEquals(
      btcPriceFetchCount,
      1,
      "BTC price should be fetched only once",
    );

    // Verify stamp service was called once (not twice for re-fetching)
    assertEquals(
      stampServiceCallCount,
      1,
      "Stamp service should be called only once",
    );

    // Verify response includes metadata
    assertExists(result.metadata, "Response should include metadata");
    assertEquals(result.metadata.btcPrice, 50000);
    assertEquals(result.metadata.cacheStatus, "fresh");
    assertEquals(result.metadata.source, "default");

    // Verify stamps data is included
    assertExists(result.data);
    assertEquals(result.data.length, 1);
    assertEquals(result.data[0].cpid, "A123456789");
  } finally {
    // Restore original methods
    BTCPriceService.getPrice = originalGetPrice;
    StampService.getStamps = originalGetStamps;
  }
});

Deno.test("StampController.getStamps includes market data for collections", async () => {
  // Mock services
  BTCPriceService.getPrice = () =>
    Promise.resolve({
      price: 60000,
      source: "default",
      confidence: "high",
      timestamp: new Date().toISOString(),
    });

  StampService.getStamps = (options: any) => {
    // Verify includeMarketData is set correctly for collection queries
    assertEquals(
      options.includeMarketData,
      true,
      "Market data should be included for collections",
    );

    return Promise.resolve({
      stamps: [{
        cpid: "A987654321",
        stamp_url: "test2.jpg",
        ident: "STAMP",
        floorPrice: 0.002,
        floorPriceUSD: 120, // 0.002 * 60000
        marketData: {
          floorPriceBTC: 0.002,
          floorPriceUSD: 120,
          openDispensersCount: 3,
          closedDispensersCount: 10,
          totalDispensersCount: 13,
        },
        cacheStatus: "recent",
      }],
      last_block: 820100,
      page: 1,
      page_size: 20,
      pages: 1,
      total: 1,
    });
  };

  try {
    const result = await StampController.getStamps({
      collectionId: "test-collection",
      page: 1,
      limit: 20,
    });

    // Verify market data is included in stamps
    const stamp = result.data[0];
    assertExists(stamp.marketData);
    assertEquals(stamp.marketData.floorPriceBTC, 0.002);
    assertEquals(stamp.marketData.floorPriceUSD, 120);
    assertEquals(stamp.marketData.openDispensersCount, 3);

    // Verify cache status
    assertEquals(stamp.cacheStatus, "recent");
  } finally {
    BTCPriceService.getPrice = originalGetPrice;
    StampService.getStamps = originalGetStamps;
  }
});

Deno.test("StampController.calculateWalletStampValues uses cached market data", async () => {
  // Store original methods
  const originalGetPrice = BTCPriceService.getPrice;
  const originalGetBulkStampMarketData =
    MarketDataRepository.getBulkStampMarketData;

  try {
    // Mock services
    BTCPriceService.getPrice = () =>
      Promise.resolve({
        price: 55000,
        source: "test",
        confidence: "high",
        timestamp: new Date().toISOString(),
      });

    MarketDataRepository.getBulkStampMarketData = (cpids: string[]) => {
      // Create a Map with the expected market data
      const marketDataMap = new Map();

      // STAMP1 has floor price
      marketDataMap.set("STAMP1", {
        floorPriceBTC: 0.001,
        recentSalePriceBTC: null,
      });

      // STAMP2 has recent sale price
      marketDataMap.set("STAMP2", {
        floorPriceBTC: null,
        recentSalePriceBTC: 0.002,
      });

      // STAMP3 has no market data (not in map)

      return Promise.resolve(marketDataMap);
    };

    const walletStamps = [
      { cpid: "STAMP1", balance: 10 },
      { cpid: "STAMP2", balance: 5 },
      { cpid: "STAMP3", balance: 20 },
    ];

    const result = await StampController.calculateWalletStampValues(
      walletStamps,
    );

    // Verify calculations
    assertEquals(result.stampValues["STAMP1"], 0.01); // 0.001 * 10
    assertEquals(result.stampValues["STAMP2"], 0.01); // 0.002 * 5
    assertEquals(result.stampValues["STAMP3"], 0); // No market data
    assertEquals(result.totalValue, 0.02); // 0.01 + 0.01 + 0
  } finally {
    BTCPriceService.getPrice = originalGetPrice;
    MarketDataRepository.getBulkStampMarketData =
      originalGetBulkStampMarketData;
  }
});

Deno.test("StampController.getCollectionPageData includes metadata", async () => {
  // Mock services
  BTCPriceService.getPrice = () =>
    Promise.resolve({
      price: 65000,
      source: "test-api",
      confidence: "high",
      timestamp: new Date().toISOString(),
    });

  const originalGetMultipleStampCategories =
    StampController.getMultipleStampCategories;
  const originalGetStamps = StampController.getStamps;
  const originalGetCollectionByName =
    (await import("$server/services/collectionService.ts")).CollectionService
      .getCollectionByName;

  StampController.getMultipleStampCategories = () =>
    Promise.resolve([{
      types: ["SRC-721"],
      stamps: [],
      total: 0,
    }]);

  // Mock getStamps to avoid database connections
  StampController.getStamps = () =>
    Promise.resolve({
      data: [],
      page: 1,
      limit: 24,
      totalPages: 1,
      total: 0,
    });

  // Mock CollectionService to avoid database lookup
  const { CollectionService } = await import(
    "$server/services/collectionService.ts"
  );
  CollectionService.getCollectionByName = () =>
    Promise.resolve({
      collection_id: "test-collection-id",
      name: "posh",
    });

  try {
    const result = await StampController.getCollectionPageData({
      sortBy: "DESC",
    });

    // Verify metadata is included
    assertExists(result.metadata);
    assertEquals(result.metadata.btcPrice, 65000);
    assertEquals(result.metadata.source, "test-api");
  } finally {
    BTCPriceService.getPrice = originalGetPrice;
    StampController.getMultipleStampCategories =
      originalGetMultipleStampCategories;
    StampController.getStamps = originalGetStamps;
    CollectionService.getCollectionByName = originalGetCollectionByName;
  }
});

Deno.test("StampController.getStamps handles sort parameters", async () => {
  const originalGetStamps = StampService.getStamps;

  StampService.getStamps = (options: any) => {
    // Verify sort options are passed through correctly
    assertEquals(options.sortBy, "ASC");
    assertEquals(options.sortColumn, "block_index");

    return Promise.resolve({
      stamps: [{
        cpid: "A123456789",
        stamp_url: "test.jpg",
        ident: "STAMP",
        block_index: 800000,
      }],
      last_block: 820000,
      page: 1,
      page_size: 20,
      pages: 1,
      total: 1,
    });
  };

  BTCPriceService.getPrice = () =>
    Promise.resolve({
      price: 50000,
      source: "test",
      confidence: "high",
      timestamp: new Date().toISOString(),
    });

  try {
    const result = await StampController.getStamps({
      page: 1,
      limit: 20,
      sortBy: "ASC",
      sortColumn: "block_index",
    });

    assertExists(result.data);
    assertEquals(result.data[0].block_index, 800000);
  } finally {
    StampService.getStamps = originalGetStamps;
    BTCPriceService.getPrice = originalGetPrice;
  }
});

Deno.test("StampController.getStamps handles filter parameters", async () => {
  const originalGetStamps = StampService.getStamps;

  StampService.getStamps = (options: any) => {
    // Verify filter options are passed through
    assertEquals(options.filterBy, ["STAMP"]);
    assertEquals(options.type, "classic");
    // Note: creator parameter is not directly passed through in the current implementation

    return Promise.resolve({
      stamps: [{
        cpid: "A123456789",
        stamp_url: "test.jpg",
        ident: "STAMP",
        creator: "bc1qtest",
      }],
      last_block: 820000,
      page: 1,
      page_size: 20,
      pages: 1,
      total: 1,
    });
  };

  BTCPriceService.getPrice = () =>
    Promise.resolve({
      price: 50000,
      source: "test",
      confidence: "high",
      timestamp: new Date().toISOString(),
    });

  try {
    const result = await StampController.getStamps({
      page: 1,
      limit: 20,
      filterBy: ["STAMP"],
      type: "classic",
      creator: "bc1qtest",
    });

    assertExists(result.data);
    assertEquals(result.data[0].creator, "bc1qtest");
  } finally {
    StampService.getStamps = originalGetStamps;
    BTCPriceService.getPrice = originalGetPrice;
  }
});

Deno.test("StampController.getStamps handles pagination edge cases", async () => {
  const originalGetStamps = StampService.getStamps;

  StampService.getStamps = (options: any) => {
    // Test high page number
    assertEquals(options.page, 999);
    assertEquals(options.limit, 50);

    return Promise.resolve({
      stamps: [], // Empty result for high page
      last_block: 820000,
      page: 999,
      page_size: 50,
      pages: 100,
      total: 5000,
    });
  };

  BTCPriceService.getPrice = () =>
    Promise.resolve({
      price: 50000,
      source: "test",
      confidence: "high",
      timestamp: new Date().toISOString(),
    });

  try {
    const result = await StampController.getStamps({
      page: 999,
      limit: 50,
    });

    assertEquals(result.data.length, 0);
    assertEquals(result.page, 999);
    assertEquals(result.totalPages, 100);
  } finally {
    StampService.getStamps = originalGetStamps;
    BTCPriceService.getPrice = originalGetPrice;
  }
});

Deno.test("StampController.getStamps handles empty results", async () => {
  const originalGetStamps = StampService.getStamps;

  StampService.getStamps = (_options: any) => {
    return Promise.resolve({
      stamps: [],
      last_block: 820000,
      page: 1,
      page_size: 20,
      pages: 0,
      total: 0,
    });
  };

  BTCPriceService.getPrice = () =>
    Promise.resolve({
      price: 50000,
      source: "test",
      confidence: "high",
      timestamp: new Date().toISOString(),
    });

  try {
    const result = await StampController.getStamps({
      page: 1,
      limit: 20,
    });

    assertEquals(result.data.length, 0);
    assertEquals(result.total, 0);
    assertEquals(result.totalPages, 0);
  } finally {
    StampService.getStamps = originalGetStamps;
    BTCPriceService.getPrice = originalGetPrice;
  }
});

Deno.test("StampController.getStamps handles identifier lookup", async () => {
  const originalGetStamps = StampService.getStamps;

  StampService.getStamps = (options: any) => {
    assertEquals(
      options.identifier,
      "A123456789012345678901234567890123456789",
    );

    return Promise.resolve({
      stamps: [{
        cpid: "A123456789012345678901234567890123456789",
        stamp_url: "test.jpg",
        ident: "STAMP",
      }],
      last_block: 820000,
      page: 1,
      page_size: 1,
      pages: 1,
      total: 1,
    });
  };

  BTCPriceService.getPrice = () =>
    Promise.resolve({
      price: 50000,
      source: "test",
      confidence: "high",
      timestamp: new Date().toISOString(),
    });

  try {
    const result = await StampController.getStamps({
      identifier: "A123456789012345678901234567890123456789",
    });

    // When identifier is provided, response structure is { stamp: stampData }
    assertExists(result.data.stamp);
    assertEquals(
      result.data.stamp.cpid,
      "A123456789012345678901234567890123456789",
    );
  } finally {
    StampService.getStamps = originalGetStamps;
    BTCPriceService.getPrice = originalGetPrice;
  }
});

Deno.test("StampController.getStamps handles block identifier lookup", async () => {
  const originalGetStamps = StampService.getStamps;

  StampService.getStamps = (options: any) => {
    assertEquals(options.blockIdentifier, "800000");

    return Promise.resolve({
      stamps: [{
        cpid: "A123456789012345678901234567890123456789",
        stamp_url: "test.jpg",
        ident: "STAMP",
        block_index: 800000,
      }],
      last_block: 820000,
      page: 1,
      page_size: 20,
      pages: 1,
      total: 1,
    });
  };

  BTCPriceService.getPrice = () =>
    Promise.resolve({
      price: 50000,
      source: "test",
      confidence: "high",
      timestamp: new Date().toISOString(),
    });

  try {
    const result = await StampController.getStamps({
      blockIdentifier: "800000",
    });

    assertEquals(result.data.length, 1);
    assertEquals(result.data[0].block_index, 800000);
  } finally {
    StampService.getStamps = originalGetStamps;
    BTCPriceService.getPrice = originalGetPrice;
  }
});

Deno.test("StampController.getStamps handles noPagination option", async () => {
  const originalGetStamps = StampService.getStamps;

  StampService.getStamps = (options: any) => {
    assertEquals(options.noPagination, true);

    return Promise.resolve({
      stamps: [{
        cpid: "A123456789012345678901234567890123456789",
        stamp_url: "test.jpg",
        ident: "STAMP",
      }],
      last_block: 820000,
    });
  };

  BTCPriceService.getPrice = () =>
    Promise.resolve({
      price: 50000,
      source: "test",
      confidence: "high",
      timestamp: new Date().toISOString(),
    });

  try {
    const result = await StampController.getStamps({
      noPagination: true,
    });

    assertExists(result.data);
    assertEquals(result.data.length, 1);
  } finally {
    StampService.getStamps = originalGetStamps;
    BTCPriceService.getPrice = originalGetPrice;
  }
});

Deno.test("StampController.getStamps handles allColumns option", async () => {
  const originalGetStamps = StampService.getStamps;

  StampService.getStamps = (options: any) => {
    assertEquals(options.allColumns, true);

    return Promise.resolve({
      stamps: [{
        cpid: "A123456789012345678901234567890123456789",
        stamp_url: "test.jpg",
        ident: "STAMP",
        creator: "bc1qtest",
        block_index: 800000,
        tx_hash: "abc123",
      }],
      last_block: 820000,
      page: 1,
      page_size: 20,
      pages: 1,
      total: 1,
    });
  };

  BTCPriceService.getPrice = () =>
    Promise.resolve({
      price: 50000,
      source: "test",
      confidence: "high",
      timestamp: new Date().toISOString(),
    });

  try {
    const result = await StampController.getStamps({
      allColumns: true,
    });

    assertExists(result.data);
    assertEquals(result.data[0].creator, "bc1qtest");
    assertEquals(result.data[0].tx_hash, "abc123");
  } finally {
    StampService.getStamps = originalGetStamps;
    BTCPriceService.getPrice = originalGetPrice;
  }
});

Deno.test("StampController.getStamps handles skipTotalCount option", async () => {
  const originalGetStamps = StampService.getStamps;

  StampService.getStamps = (options: any) => {
    assertEquals(options.skipTotalCount, true);

    return Promise.resolve({
      stamps: [{
        cpid: "A123456789012345678901234567890123456789",
        stamp_url: "test.jpg",
        ident: "STAMP",
      }],
      last_block: 820000,
      page: 1,
      page_size: 20,
      pages: 1,
    });
  };

  BTCPriceService.getPrice = () =>
    Promise.resolve({
      price: 50000,
      source: "test",
      confidence: "high",
      timestamp: new Date().toISOString(),
    });

  try {
    const result = await StampController.getStamps({
      skipTotalCount: true,
    });

    assertExists(result.data);
    assertEquals(result.total, undefined);
  } finally {
    StampService.getStamps = originalGetStamps;
    BTCPriceService.getPrice = originalGetPrice;
  }
});

Deno.test("StampController.getStampDetailsById calls getStamps with correct parameters", async () => {
  const originalGetStamps = StampController.getStamps;

  let capturedParams: any;
  StampController.getStamps = (params: any) => {
    capturedParams = params;
    return Promise.resolve({
      data: {
        stamp: {
          cpid: "A123456789012345678901234567890123456789",
          stamp_url: "test.jpg",
          ident: "STAMP",
          asset_longname: "A123456789012345678901234567890123456789",
        },
      },
      page: 1,
      limit: 1,
      totalPages: 1,
      total: 1,
    });
  };

  try {
    const result = await StampController.getStampDetailsById(
      "A123456789012345678901234567890123456789",
      "all",
      undefined,
      undefined,
      true,
      false,
    );

    assertEquals(
      capturedParams.identifier,
      "A123456789012345678901234567890123456789",
    );
    assertEquals(capturedParams.type, "all");
    assertEquals(capturedParams.allColumns, false);
    assertEquals(capturedParams.noPagination, true);
    assertEquals(capturedParams.skipTotalCount, true);
    assertEquals(capturedParams.enrichWithAssetInfo, true);
    assertEquals(capturedParams.includeSecondary, true);

    assertExists(result.data);
  } finally {
    StampController.getStamps = originalGetStamps;
  }
});

Deno.test("StampController.getStampDetailsById handles cache parameters", async () => {
  const originalGetStamps = StampController.getStamps;

  let capturedParams: any;
  StampController.getStamps = (params: any) => {
    capturedParams = params;
    return Promise.resolve({
      data: {
        stamp: {
          cpid: "A123456789012345678901234567890123456789",
          stamp_url: "test.jpg",
          ident: "STAMP",
        },
      },
    });
  };

  try {
    await StampController.getStampDetailsById(
      "A123456789012345678901234567890123456789",
      "stamps",
      undefined,
      3600,
      false,
    );

    assertEquals(capturedParams.cacheDuration, 3600);
    assertEquals(capturedParams.includeSecondary, false);
    assertEquals(capturedParams.type, "stamps");
  } finally {
    StampController.getStamps = originalGetStamps;
  }
});

Deno.test("StampController.getRecentSales returns formatted response", async () => {
  const originalGetRecentSales =
    (await import("$server/services/stampService.ts")).StampService
      .getRecentSales;
  const originalGetLastBlock =
    (await import("$server/services/blockService.ts")).BlockService
      .getLastBlock;

  const { StampService } = await import("$server/services/stampService.ts");
  const { BlockService } = await import("$server/services/blockService.ts");

  StampService.getRecentSales = (_page: any, _limit: any, _options: any) => {
    return Promise.resolve({
      recentSales: [{
        tx_hash: "abc123",
        cpid: "A123456789012345678901234567890123456789",
        sale_price_btc: 0.001,
        sale_price_usd: 50,
        block_time: "2023-01-01T00:00:00Z",
        buyer_address: "bc1qbuyer",
        seller_address: "bc1qseller",
      }],
      total: 1,
      btcPriceUSD: 50000,
      metadata: { source: "test" },
    });
  };

  BlockService.getLastBlock = () => Promise.resolve(820000);

  try {
    const result = await StampController.getRecentSales(1, 10);

    assertEquals(result.page, 1);
    assertEquals(result.limit, 10);
    assertEquals(result.totalPages, 1);
    assertEquals(result.last_block, 820000);
    assertExists(result.data);
    assertEquals(result.data.length, 1);
    assertEquals(
      result.data[0].cpid,
      "A123456789012345678901234567890123456789",
    );
    assertEquals(result.btcPriceUSD, 50000);
    assertExists(result.metadata);
  } finally {
    StampService.getRecentSales = originalGetRecentSales;
    BlockService.getLastBlock = originalGetLastBlock;
  }
});

Deno.test("StampController.getRecentSales handles options parameter", async () => {
  const originalGetRecentSales =
    (await import("$server/services/stampService.ts")).StampService
      .getRecentSales;
  const originalGetLastBlock =
    (await import("$server/services/blockService.ts")).BlockService
      .getLastBlock;

  const { StampService } = await import("$server/services/stampService.ts");
  const { BlockService } = await import("$server/services/blockService.ts");

  let capturedOptions: any;
  StampService.getRecentSales = (_page: any, _limit: any, options: any) => {
    capturedOptions = options;
    return Promise.resolve({
      recentSales: [],
      total: 0,
      btcPriceUSD: 50000,
      metadata: {},
    });
  };

  BlockService.getLastBlock = () => Promise.resolve(820000);

  try {
    await StampController.getRecentSales(1, 10, {
      dayRange: 30,
      includeFullDetails: true,
    });

    assertEquals(capturedOptions.dayRange, 30);
    assertEquals(capturedOptions.includeFullDetails, true);
  } finally {
    StampService.getRecentSales = originalGetRecentSales;
    BlockService.getLastBlock = originalGetLastBlock;
  }
});

Deno.test("StampController.getRecentSales calculates totalPages correctly", async () => {
  const originalGetRecentSales =
    (await import("$server/services/stampService.ts")).StampService
      .getRecentSales;
  const originalGetLastBlock =
    (await import("$server/services/blockService.ts")).BlockService
      .getLastBlock;

  const { StampService } = await import("$server/services/stampService.ts");
  const { BlockService } = await import("$server/services/blockService.ts");

  StampService.getRecentSales = (_page: any, _limit: any, _options: any) => {
    return Promise.resolve({
      recentSales: Array(25).fill({
        tx_hash: "abc123",
        cpid: "A123456789012345678901234567890123456789",
        sale_price_btc: 0.001,
      }),
      total: 125,
      btcPriceUSD: 50000,
      metadata: {},
    });
  };

  BlockService.getLastBlock = () => Promise.resolve(820000);

  try {
    const result = await StampController.getRecentSales(1, 25);

    assertEquals(result.totalPages, 5); // 125 / 25 = 5
    assertExists(result.data);
    assertEquals(result.data.length, 25);
  } finally {
    StampService.getRecentSales = originalGetRecentSales;
    BlockService.getLastBlock = originalGetLastBlock;
  }
});

Deno.test("StampController.getMultipleStampCategories processes multiple categories", async () => {
  const originalGetStamps = StampService.getStamps;

  let callCount = 0;
  StampService.getStamps = (options: any) => {
    callCount++;

    if (options.ident.includes("STAMP")) {
      return Promise.resolve({
        stamps: [{
          cpid: "STAMP123",
          ident: "STAMP",
          stamp_url: "stamp.jpg",
        }],
        total: 1,
      });
    } else if (options.ident.includes("SRC-721")) {
      return Promise.resolve({
        stamps: [{
          cpid: "SRC721_123",
          ident: "SRC-721",
          stamp_url: "src721.jpg",
        }],
        total: 1,
      });
    }

    return Promise.resolve({ stamps: [], total: 0 });
  };

  try {
    const categories = [
      { idents: ["STAMP"], limit: 8, type: "stamps", sortBy: "DESC" },
      { idents: ["SRC-721"], limit: 12, type: "stamps", sortBy: "ASC" },
    ];

    const result = await StampController.getMultipleStampCategories(
      categories as any,
    );

    assertEquals(result.length, 2);
    assertEquals(callCount, 2);

    // Check first category (STAMP)
    assertEquals(result[0].types, ["STAMP"]);
    assertEquals(result[0].stamps.length, 1);
    assertEquals(result[0].stamps[0].ident, "STAMP");
    assertEquals(result[0].total, 1);

    // Check second category (SRC-721)
    assertEquals(result[1].types, ["SRC-721"]);
    assertEquals(result[1].stamps.length, 1);
    assertEquals(result[1].stamps[0].ident, "SRC-721");
    assertEquals(result[1].total, 1);
  } finally {
    StampService.getStamps = originalGetStamps;
  }
});

Deno.test("StampController.getMultipleStampCategories passes correct parameters", async () => {
  const originalGetStamps = StampService.getStamps;

  const capturedCalls: any[] = [];
  StampService.getStamps = (options: any) => {
    capturedCalls.push(options);
    return Promise.resolve({ stamps: [], total: 0 });
  };

  try {
    const categories = [
      {
        idents: ["STAMP", "SRC-721"],
        limit: 24,
        type: "stamps",
        sortBy: "DESC",
      },
    ];

    await StampController.getMultipleStampCategories(categories as any);

    assertEquals(capturedCalls.length, 1);

    const call = capturedCalls[0];
    assertEquals(call.page, 1);
    assertEquals(call.limit, 24);
    assertEquals(call.sortBy, "DESC");
    assertEquals(call.type, "stamps");
    assertEquals(call.ident, ["STAMP", "SRC-721"]);
    assertEquals(call.noPagination, false);
    assertEquals(call.skipTotalCount, true);
    assertEquals(call.includeSecondary, false);
  } finally {
    StampService.getStamps = originalGetStamps;
  }
});

Deno.test("StampController.getMultipleStampCategories defaults sortBy to ASC", async () => {
  const originalGetStamps = StampService.getStamps;

  let capturedSortBy: string | undefined;
  StampService.getStamps = (options: any) => {
    capturedSortBy = options.sortBy;
    return Promise.resolve({ stamps: [], total: 0 });
  };

  try {
    const categories = [
      { idents: ["STAMP"], limit: 8, type: "stamps" }, // No sortBy specified
    ];

    await StampController.getMultipleStampCategories(categories as any);

    assertEquals(capturedSortBy, "ASC");
  } finally {
    StampService.getStamps = originalGetStamps;
  }
});

Deno.test("StampController.getMultipleStampCategories handles empty results", async () => {
  const originalGetStamps = StampService.getStamps;

  StampService.getStamps = (_options: any) => {
    return Promise.resolve({ stamps: null, total: undefined });
  };

  try {
    const categories = [
      { idents: ["STAMP"], limit: 8, type: "stamps", sortBy: "DESC" },
    ];

    const result = await StampController.getMultipleStampCategories(
      categories as any,
    );

    assertEquals(result.length, 1);
    assertEquals(result[0].stamps, []);
    assertEquals(result[0].total, 0);
  } finally {
    StampService.getStamps = originalGetStamps;
  }
});

Deno.test("StampController.getStampHolders processes holders correctly (tests processHolders)", async () => {
  const originalResolveToCpid = StampController.resolveToCpid;
  const originalGetStampHolders =
    (await import("$server/services/stampService.ts")).StampService
      .getStampHolders;

  const { StampService } = await import("$server/services/stampService.ts");

  StampController.resolveToCpid = (_id: string) =>
    Promise.resolve("A123456789012345678901234567890123456789");

  StampService.getStampHolders = (
    _cpid: string,
    _page: number,
    _limit: number,
    _options: any,
  ) => {
    return Promise.resolve({
      holders: [
        { address: "bc1qholder1", quantity: 10000000000, divisible: true }, // 100 tokens (divisible)
        { address: "bc1qholder2", quantity: 5000000000, divisible: true }, // 50 tokens (divisible)
        { address: "bc1qholder3", quantity: 25, divisible: false }, // 25 tokens (non-divisible)
      ],
      total: 3,
    });
  };

  try {
    const result = await StampController.getStampHolders(
      "A123456789012345678901234567890123456789",
      1,
      10,
    );

    assertEquals(result.data.length, 3);
    assertEquals(result.total, 3);

    // Test processHolders calculations for divisible tokens (should be divided by 100000000)
    assertEquals(result.data[0].address, "bc1qholder1");
    assertEquals(result.data[0].amt, 100); // 10000000000 / 100000000
    assertEquals(result.data[0].percentage, 57.14); // 100 / (100+50+25) * 100

    assertEquals(result.data[1].address, "bc1qholder2");
    assertEquals(result.data[1].amt, 50); // 5000000000 / 100000000
    assertEquals(result.data[1].percentage, 28.57); // 50 / 175 * 100

    assertEquals(result.data[2].address, "bc1qholder3");
    assertEquals(result.data[2].amt, 25); // Non-divisible, kept as-is
    assertEquals(result.data[2].percentage, 14.29); // 25 / 175 * 100
  } finally {
    StampController.resolveToCpid = originalResolveToCpid;
    StampService.getStampHolders = originalGetStampHolders;
  }
});

Deno.test("StampController.getStampHolders handles empty holders (tests processHolders)", async () => {
  const originalResolveToCpid = StampController.resolveToCpid;
  const originalGetStampHolders =
    (await import("$server/services/stampService.ts")).StampService
      .getStampHolders;

  const { StampService } = await import("$server/services/stampService.ts");

  StampController.resolveToCpid = (_id: string) =>
    Promise.resolve("A123456789012345678901234567890123456789");

  StampService.getStampHolders = (
    _cpid: string,
    _page: number,
    _limit: number,
    _options: any,
  ) => {
    return Promise.resolve({
      holders: [],
      total: 0,
    });
  };

  try {
    const result = await StampController.getStampHolders(
      "A123456789012345678901234567890123456789",
      1,
      10,
    );

    assertEquals(result.data.length, 0);
    assertEquals(result.total, 0);
  } finally {
    StampController.resolveToCpid = originalResolveToCpid;
    StampService.getStampHolders = originalGetStampHolders;
  }
});

Deno.test("StampController.getStampHolders handles single holder 100% (tests processHolders)", async () => {
  const originalResolveToCpid = StampController.resolveToCpid;
  const originalGetStampHolders =
    (await import("$server/services/stampService.ts")).StampService
      .getStampHolders;

  const { StampService } = await import("$server/services/stampService.ts");

  StampController.resolveToCpid = (_id: string) =>
    Promise.resolve("A123456789012345678901234567890123456789");

  StampService.getStampHolders = (
    _cpid: string,
    _page: number,
    _limit: number,
    _options: any,
  ) => {
    return Promise.resolve({
      holders: [
        { address: "bc1qsingle", quantity: 1000, divisible: false },
      ],
      total: 1,
    });
  };

  try {
    const result = await StampController.getStampHolders(
      "A123456789012345678901234567890123456789",
      1,
      10,
    );

    assertEquals(result.data.length, 1);
    assertEquals(result.data[0].address, "bc1qsingle");
    assertEquals(result.data[0].amt, 1000);
    assertEquals(result.data[0].percentage, 100); // 100% for single holder
  } finally {
    StampController.resolveToCpid = originalResolveToCpid;
    StampService.getStampHolders = originalGetStampHolders;
  }
});

Deno.test("StampController.getStampBalancesByAddress returns paginated response", async () => {
  const originalGetAllXcpBalancesByAddress =
    (await import("$server/services/xcpService.ts")).XcpManager
      .getAllXcpBalancesByAddress;
  const originalGetStampBalancesByAddress =
    (await import("$server/services/stampService.ts")).StampService
      .getStampBalancesByAddress;
  const originalGetLastBlock =
    (await import("$server/services/blockService.ts")).BlockService
      .getLastBlock;

  const { XcpManager } = await import("$server/services/xcpService.ts");
  const { StampService } = await import("$server/services/stampService.ts");
  const { BlockService } = await import("$server/services/blockService.ts");

  XcpManager.getAllXcpBalancesByAddress = (
    _address: string,
    _normalized: boolean,
  ) => {
    return Promise.resolve({
      balances: [
        { asset: "A123456789012345678901234567890123456789", quantity: 1000 },
        { asset: "B123456789012345678901234567890123456789", quantity: 500 },
      ],
      total: 2,
    });
  };

  StampService.getStampBalancesByAddress = (
    _address: string,
    _limit: number,
    _page: number,
    _xcpBalances: any,
    _sortBy: string,
  ) => {
    return Promise.resolve({
      stamps: [
        {
          cpid: "A123456789012345678901234567890123456789",
          stamp_url: "test1.jpg",
          balance: 1000,
          ident: "STAMP",
        },
        {
          cpid: "B123456789012345678901234567890123456789",
          stamp_url: "test2.jpg",
          balance: 500,
          ident: "SRC-721",
        },
      ],
      total: 2,
    });
  };

  BlockService.getLastBlock = () => Promise.resolve(820000);

  try {
    const result = await StampController.getStampBalancesByAddress(
      "bc1qtest",
      10,
      1,
      "DESC",
    );

    assertEquals(result.page, 1);
    assertEquals(result.limit, 10);
    assertEquals(result.totalPages, 1); // Math.ceil(2 / 10)
    assertEquals(result.last_block, 820000);
    assertEquals(result.data.length, 2);
    assertEquals(
      result.data[0].cpid,
      "A123456789012345678901234567890123456789",
    );
    assertEquals(result.data[0].balance, 1000);
    assertEquals(
      result.data[1].cpid,
      "B123456789012345678901234567890123456789",
    );
    assertEquals(result.data[1].balance, 500);
  } finally {
    XcpManager.getAllXcpBalancesByAddress = originalGetAllXcpBalancesByAddress;
    StampService.getStampBalancesByAddress = originalGetStampBalancesByAddress;
    BlockService.getLastBlock = originalGetLastBlock;
  }
});

Deno.test("StampController.getStampBalancesByAddress handles pagination correctly", async () => {
  const originalGetAllXcpBalancesByAddress =
    (await import("$server/services/xcpService.ts")).XcpManager
      .getAllXcpBalancesByAddress;
  const originalGetStampBalancesByAddress =
    (await import("$server/services/stampService.ts")).StampService
      .getStampBalancesByAddress;
  const originalGetLastBlock =
    (await import("$server/services/blockService.ts")).BlockService
      .getLastBlock;

  const { XcpManager } = await import("$server/services/xcpService.ts");
  const { StampService } = await import("$server/services/stampService.ts");
  const { BlockService } = await import("$server/services/blockService.ts");

  XcpManager.getAllXcpBalancesByAddress = (
    _address: string,
    _normalized: boolean,
  ) => {
    return Promise.resolve({
      balances: Array(100).fill({
        asset: "A123456789012345678901234567890123456789",
        quantity: 1,
      }),
      total: 100,
    });
  };

  let capturedPage: number;
  let capturedLimit: number;
  let capturedSortBy: string;
  StampService.getStampBalancesByAddress = (
    _address: string,
    limit: number,
    page: number,
    _xcpBalances: any,
    sortBy: string,
  ) => {
    capturedPage = page;
    capturedLimit = limit;
    capturedSortBy = sortBy;
    return Promise.resolve({
      stamps: Array(25).fill({
        cpid: "A123456789012345678901234567890123456789",
        balance: 1,
      }),
      total: 75, // Total stamps for this address
    });
  };

  BlockService.getLastBlock = () => Promise.resolve(820000);

  try {
    const result = await StampController.getStampBalancesByAddress(
      "bc1qtest",
      25,
      3,
      "ASC",
    );

    assertEquals(capturedPage, 3);
    assertEquals(capturedLimit, 25);
    assertEquals(capturedSortBy, "ASC");
    assertEquals(result.page, 3);
    assertEquals(result.limit, 25);
    assertEquals(result.totalPages, 3); // Math.ceil(75 / 25)
    assertEquals(result.data.length, 25);
  } finally {
    XcpManager.getAllXcpBalancesByAddress = originalGetAllXcpBalancesByAddress;
    StampService.getStampBalancesByAddress = originalGetStampBalancesByAddress;
    BlockService.getLastBlock = originalGetLastBlock;
  }
});

Deno.test("StampController.getStampBalancesByAddress handles empty balances", async () => {
  const originalGetAllXcpBalancesByAddress =
    (await import("$server/services/xcpService.ts")).XcpManager
      .getAllXcpBalancesByAddress;
  const originalGetStampBalancesByAddress =
    (await import("$server/services/stampService.ts")).StampService
      .getStampBalancesByAddress;
  const originalGetLastBlock =
    (await import("$server/services/blockService.ts")).BlockService
      .getLastBlock;

  const { XcpManager } = await import("$server/services/xcpService.ts");
  const { StampService } = await import("$server/services/stampService.ts");
  const { BlockService } = await import("$server/services/blockService.ts");

  XcpManager.getAllXcpBalancesByAddress = (
    _address: string,
    _normalized: boolean,
  ) => {
    return Promise.resolve({
      balances: [],
      total: 0,
    });
  };

  StampService.getStampBalancesByAddress = (
    _address: string,
    _limit: number,
    _page: number,
    _xcpBalances: any,
    _sortBy: string,
  ) => {
    return Promise.resolve({
      stamps: [],
      total: 0,
    });
  };

  BlockService.getLastBlock = () => Promise.resolve(820000);

  try {
    const result = await StampController.getStampBalancesByAddress(
      "bc1qempty",
      10,
      1,
    );

    assertEquals(result.page, 1);
    assertEquals(result.limit, 10);
    assertEquals(result.totalPages, 0); // Math.ceil(0 / 10)
    assertEquals(result.data.length, 0);
    assertEquals(result.last_block, 820000);
  } finally {
    XcpManager.getAllXcpBalancesByAddress = originalGetAllXcpBalancesByAddress;
    StampService.getStampBalancesByAddress = originalGetStampBalancesByAddress;
    BlockService.getLastBlock = originalGetLastBlock;
  }
});

Deno.test("StampController.resolveToCpid returns cpid when input is already cpid", async () => {
  // Use a mathematically valid CPID: A + (26^12 + 1) minimum
  const validCpid = "A95428956661682177";

  const result = await StampController.resolveToCpid(validCpid);
  assertEquals(result, validCpid);
});

Deno.test("StampController.resolveToCpid resolves stamp number to cpid", async () => {
  const originalResolveToCpid =
    (await import("$server/services/stampService.ts")).StampService
      .resolveToCpid;

  const { StampService } = await import("$server/services/stampService.ts");

  StampService.resolveToCpid = (_id: string) => {
    return Promise.resolve({
      cpid: "A123456789012345678901234567890123456789",
      stamp: 12345,
    });
  };

  try {
    const result = await StampController.resolveToCpid("12345");

    assertEquals(result, "A123456789012345678901234567890123456789");
  } finally {
    StampService.resolveToCpid = originalResolveToCpid;
  }
});

Deno.test("StampController.resolveToCpid throws error when resolution fails", async () => {
  const originalResolveToCpid =
    (await import("$server/services/stampService.ts")).StampService
      .resolveToCpid;

  const { StampService } = await import("$server/services/stampService.ts");

  StampService.resolveToCpid = (_id: string) => {
    return Promise.resolve(null);
  };

  try {
    await assertRejects(
      () => StampController.resolveToCpid("invalid"),
      Error,
      "Could not resolve identifier invalid to a cpid",
    );
  } finally {
    StampService.resolveToCpid = originalResolveToCpid;
  }
});

Deno.test("StampController.resolveToCpid throws error when result has no cpid", async () => {
  const originalResolveToCpid =
    (await import("$server/services/stampService.ts")).StampService
      .resolveToCpid;

  const { StampService } = await import("$server/services/stampService.ts");

  StampService.resolveToCpid = (_id: string) => {
    return Promise.resolve({ stamp: 12345 }); // Missing cpid field
  };

  try {
    await assertRejects(
      () => StampController.resolveToCpid("12345"),
      Error,
      "Could not resolve identifier 12345 to a cpid",
    );
  } finally {
    StampService.resolveToCpid = originalResolveToCpid;
  }
});

Deno.test("StampController.getStampsCreatedCount returns count from repository", async () => {
  const originalGetStampsCreatedCount =
    (await import("$server/database/stampRepository.ts")).StampRepository
      .getStampsCreatedCount;

  const { StampRepository } = await import(
    "$server/database/stampRepository.ts"
  );

  StampRepository.getStampsCreatedCount = (_address: string) => {
    return Promise.resolve({ total: 42 });
  };

  try {
    const result = await StampController.getStampsCreatedCount("bc1qtest");

    assertEquals(result, 42);
  } finally {
    StampRepository.getStampsCreatedCount = originalGetStampsCreatedCount;
  }
});

Deno.test("StampController.getStampsCreatedCount handles missing total field", async () => {
  const originalGetStampsCreatedCount =
    (await import("$server/database/stampRepository.ts")).StampRepository
      .getStampsCreatedCount;

  const { StampRepository } = await import(
    "$server/database/stampRepository.ts"
  );

  StampRepository.getStampsCreatedCount = (_address: string) => {
    return Promise.resolve({}); // Missing total field
  };

  try {
    const result = await StampController.getStampsCreatedCount("bc1qtest");

    assertEquals(result, 0);
  } finally {
    StampRepository.getStampsCreatedCount = originalGetStampsCreatedCount;
  }
});

Deno.test("StampController.getStampsCreatedCount handles repository errors", async () => {
  const originalGetStampsCreatedCount =
    (await import("$server/database/stampRepository.ts")).StampRepository
      .getStampsCreatedCount;

  const { StampRepository } = await import(
    "$server/database/stampRepository.ts"
  );

  StampRepository.getStampsCreatedCount = (_address: string) => {
    throw new Error("Database connection failed");
  };

  try {
    const result = await StampController.getStampsCreatedCount("bc1qtest");

    assertEquals(result, 0); // Should return 0 on error
  } finally {
    StampRepository.getStampsCreatedCount = originalGetStampsCreatedCount;
  }
});
