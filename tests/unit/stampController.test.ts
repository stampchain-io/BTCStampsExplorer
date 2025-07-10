import { assertEquals, assertExists } from "@std/assert";
import { StampController } from "$server/controller/stampController.ts";
import { BTCPriceService } from "$server/services/price/btcPriceService.ts";
import { StampService } from "$server/services/stampService.ts";

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
      source: "test",
      confidence: "high",
      timestamp: new Date().toISOString(),
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
    assertEquals(result.metadata.source, "test");

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
      source: "test",
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
  // Mock services
  BTCPriceService.getPrice = () =>
    Promise.resolve({
      price: 55000,
      source: "test",
      confidence: "high",
      timestamp: new Date().toISOString(),
    });

  StampService.getStamps = (options: any) => {
    // Verify market data is requested
    assertEquals(options.includeMarketData, true);

    return Promise.resolve({
      stamps: [
        {
          cpid: "STAMP1",
          marketData: {
            floorPriceBTC: 0.001,
            recentSalePriceBTC: null,
          },
        },
        {
          cpid: "STAMP2",
          marketData: {
            floorPriceBTC: null,
            recentSalePriceBTC: 0.002,
          },
        },
        {
          cpid: "STAMP3",
          marketData: null, // No market data
        },
      ],
    });
  };

  try {
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
    assertEquals(result.totalValue, 0.02); // 0.01 + 0.01
  } finally {
    BTCPriceService.getPrice = originalGetPrice;
    StampService.getStamps = originalGetStamps;
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
    assertEquals(options.filterBy, ["SRC-20"]);
    assertEquals(options.type, "collection");
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
      filterBy: ["SRC-20"],
      type: "collection",
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
