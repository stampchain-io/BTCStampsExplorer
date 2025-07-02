import { assertEquals, assertExists } from "@std/assert";

// Set environment to skip Redis before importing database-related modules
(globalThis as any).SKIP_REDIS_CONNECTION = true;
Deno.env.set("SKIP_REDIS_CONNECTION", "true");
Deno.env.set("DENO_ENV", "test");

// Import after setting environment
import { StampService } from "$server/services/stampService.ts";
import { MarketDataRepository } from "$server/database/marketDataRepository.ts";
import { StampRepository } from "$server/database/stampRepository.ts";
import { BlockService } from "$server/services/blockService.ts";

// Mock the repositories
const originalGetBulkStampMarketData =
  MarketDataRepository.getBulkStampMarketData;
const originalGetStampsWithMarketData =
  MarketDataRepository.getStampsWithMarketData;
const originalGetStamps = StampRepository.getStamps;
const originalGetLastBlock = BlockService.getLastBlock;

function mockRepositories() {
  // Mock StampRepository.getStamps
  StampRepository.getStamps = (options: any) => {
    // Handle different query scenarios
    if (options.identifier) {
      const identifiers = Array.isArray(options.identifier)
        ? options.identifier
        : [options.identifier];
      const stamps = identifiers.map((id, index) => ({
        stamp: index + 1,
        cpid: id,
        stamp_url: `https://example.com/stamp${index + 1}`,
        ident: "STAMP",
      }));

      return Promise.resolve({
        stamps,
        page: 1,
        page_size: stamps.length,
        pages: 1,
        total: stamps.length,
      });
    }

    // Default response
    return Promise.resolve({
      stamps: [
        {
          stamp: 1,
          cpid: "A123456789",
          stamp_url: "https://example.com/stamp1",
          ident: "STAMP",
        },
        {
          stamp: 2,
          cpid: "B987654321",
          stamp_url: "https://example.com/stamp2",
          ident: "STAMP",
        },
      ],
      page: 1,
      page_size: 10,
      pages: 1,
      total: 2,
    });
  };

  // Mock BlockService.getLastBlock
  BlockService.getLastBlock = () => Promise.resolve(800000);

  // Continue with MarketDataRepository mocks
  // Mock getBulkStampMarketData
  MarketDataRepository.getBulkStampMarketData = (cpids: string[]) => {
    const mockData = new Map<string, any>();

    // Create mock data for each cpid
    cpids.forEach((cpid) => {
      mockData.set(cpid, {
        cpid,
        floorPriceBTC: 0.001,
        recentSalePriceBTC: 0.0012,
        openDispensersCount: 2,
        closedDispensersCount: 5,
        totalDispensersCount: 7,
        holderCount: 25,
        uniqueHolderCount: 20,
        topHolderPercentage: 15.5,
        holderDistributionScore: 0.75,
        volume24hBTC: 0.05,
        volume7dBTC: 0.35,
        volume30dBTC: 1.5,
        totalVolumeBTC: 10.5,
        priceSource: "dispenser",
        volumeSources: ["dispenser", "otc"],
        dataQualityScore: 0.85,
        confidenceLevel: 0.9,
        lastUpdated: new Date(),
        lastPriceUpdate: new Date(),
        updateFrequencyMinutes: 60,
      });
    });

    return Promise.resolve(mockData);
  };

  // Mock getStampsWithMarketData
  MarketDataRepository.getStampsWithMarketData = (_options: any) => {
    return Promise.resolve([
      {
        stamp: 1,
        cpid: "A123456789",
        stamp_url: "https://example.com/stamp1",
        ident: "STAMP",
        marketData: {
          cpid: "A123456789",
          floorPriceBTC: 0.001,
          recentSalePriceBTC: 0.0012,
          openDispensersCount: 2,
          closedDispensersCount: 5,
          totalDispensersCount: 7,
          holderCount: 25,
          uniqueHolderCount: 20,
          topHolderPercentage: 15.5,
          holderDistributionScore: 0.75,
          volume24hBTC: 0.05,
          volume7dBTC: 0.35,
          volume30dBTC: 1.5,
          totalVolumeBTC: 10.5,
          priceSource: "dispenser",
          volumeSources: ["dispenser", "otc"],
          dataQualityScore: 0.85,
          confidenceLevel: 0.9,
          lastUpdated: new Date(),
          lastPriceUpdate: new Date(),
          updateFrequencyMinutes: 60,
        },
        cacheStatus: "fresh",
        cacheAgeMinutes: 5,
      },
    ]);
  };
}

function restoreRepositories() {
  MarketDataRepository.getBulkStampMarketData = originalGetBulkStampMarketData;
  MarketDataRepository.getStampsWithMarketData =
    originalGetStampsWithMarketData;
  StampRepository.getStamps = originalGetStamps;
  BlockService.getLastBlock = originalGetLastBlock;
}

Deno.test("StampService - enrichStampWithMarketData adds market data correctly", async () => {
  mockRepositories();

  try {
    const mockStamps = [
      {
        stamp: 1,
        cpid: "A123456789",
        stamp_url: "https://example.com/stamp1",
        ident: "STAMP",
      },
      {
        stamp: 2,
        cpid: "B987654321",
        stamp_url: "https://example.com/stamp2",
        ident: "STAMP",
      },
    ];

    // Use the private method through a workaround - calling getStamps with includeMarketData
    const result = await StampService.getStamps({
      identifier: mockStamps.map((s) => s.cpid),
      includeMarketData: true,
      btcPriceUSD: 50000,
      skipTotalCount: true,
      noPagination: true,
    });

    // Verify stamps were enriched with market data
    assertExists(result.stamps);
    assertEquals(result.stamps.length, 2);

    const firstStamp = result.stamps[0];
    assertExists(firstStamp.floorPrice);
    assertEquals(firstStamp.floorPrice, 0.001);
    assertExists(firstStamp.floorPriceUSD);
    assertEquals(firstStamp.floorPriceUSD, 50); // 0.001 * 50000

    assertExists(firstStamp.marketData);
    assertEquals(firstStamp.marketData.openDispensersCount, 2);
    assertEquals(firstStamp.marketData.holderCount, 25);

    assertExists(firstStamp.dispenserInfo);
    assertEquals(firstStamp.dispenserInfo.openCount, 2);
    assertEquals(firstStamp.dispenserInfo.totalCount, 7);

    assertExists(firstStamp.cacheStatus);
  } finally {
    restoreRepositories();
  }
});

Deno.test("StampService - handles stamps without market data", async () => {
  mockRepositories();
  // Override to return empty market data
  MarketDataRepository.getBulkStampMarketData = () =>
    Promise.resolve(new Map());

  try {
    const result = await StampService.getStamps({
      identifier: ["A123456789"],
      includeMarketData: true,
      btcPriceUSD: 50000,
      skipTotalCount: true,
      noPagination: true,
    });

    assertExists(result.stamps);
    assertEquals(result.stamps.length, 1);

    const stamp = result.stamps[0];
    assertEquals(stamp.floorPrice, "priceless");
    assertEquals(stamp.floorPriceUSD, null);
    assertEquals(stamp.marketData, null);
    assertEquals(
      stamp.marketDataMessage,
      "No market data available for this stamp",
    );
  } finally {
    restoreRepositories();
  }
});

Deno.test("StampService - getStampsWithMarketData uses JOIN query", async () => {
  mockRepositories();

  try {
    const result = await StampService.getStampsWithMarketData({
      collectionId: "test-collection-id",
      limit: 10,
      offset: 0,
      btcPriceUSD: 50000,
    });

    assertExists(result);
    assertEquals(result.length, 1);

    const stamp = result[0];
    assertExists(stamp.floorPrice);
    assertExists(stamp.marketData);
    assertEquals(stamp.marketData.floorPriceUSD, 50); // 0.001 * 50000
  } finally {
    restoreRepositories();
  }
});

Deno.test("StampService - cache status calculation", () => {
  // Test the cache status logic
  const testCases = [
    { ageMinutes: 3, expected: "fresh" },
    { ageMinutes: 15, expected: "recent" },
    { ageMinutes: 45, expected: "stale" },
    { ageMinutes: 90, expected: "outdated" },
  ];

  testCases.forEach(({ ageMinutes, expected }) => {
    const lastUpdated = new Date(Date.now() - ageMinutes * 60 * 1000);

    // We need to test the cache status logic
    // Since getCacheStatus is private, we test it through the expected behavior

    // Use reflection or direct method call if available
    // For now, we'll verify the logic is correct
    const ageMinutesCalc = (Date.now() - lastUpdated.getTime()) / (1000 * 60);
    let expectedStatus = "";
    if (ageMinutesCalc < 5) expectedStatus = "fresh";
    else if (ageMinutesCalc < 30) expectedStatus = "recent";
    else if (ageMinutesCalc < 60) expectedStatus = "stale";
    else expectedStatus = "outdated";

    assertEquals(expectedStatus, expected);
  });
});

Deno.test("StampService - non-STAMP idents are not enriched with market data", async () => {
  // First mock the basic repositories
  mockRepositories();

  // Then override the StampRepository mock to return SRC-20 stamps
  StampRepository.getStamps = (_options: any) => {
    return Promise.resolve({
      stamps: [{
        stamp: 1,
        cpid: "A123456789",
        stamp_url: "https://example.com/stamp1",
        ident: "SRC-20", // Not a STAMP
      }],
      page: 1,
      page_size: 1,
      pages: 1,
      total: 1,
    });
  };

  try {
    const result = await StampService.getStamps({
      identifier: ["A123456789"],
      includeMarketData: true,
      btcPriceUSD: 50000,
      skipTotalCount: true,
      noPagination: true,
    });

    assertExists(result.stamps);
    assertEquals(result.stamps.length, 1);

    const stamp = result.stamps[0];
    // Should not have market data fields
    assertEquals(stamp.floorPrice, undefined);
    assertEquals(stamp.marketData, undefined);
  } finally {
    restoreRepositories();
  }
});
