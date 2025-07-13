/**
 * Comprehensive branch coverage tests for SRC20MarketService
 * Target: Improve from 3.1% to >80% branch coverage
 */

import { assertEquals, assertNotEquals, assertRejects } from "@std/assert";
import { SRC20MarketService } from "$server/services/src20/marketService.ts";

// Mock fetch globally for testing
const originalFetch = globalThis.fetch;

function mockFetch(
  responses: { url: string; response: Response | (() => Promise<Response>) }[],
) {
  globalThis.fetch = async (url: string | URL) => {
    const urlStr = url.toString();
    const match = responses.find((r) => urlStr.includes(r.url));
    if (!match) {
      throw new Error(`No mock response found for URL: ${urlStr}`);
    }
    return typeof match.response === "function"
      ? await match.response()
      : match.response;
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

// Helper to create mock responses
function createMockResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    statusText: status === 200 ? "OK" : "Error",
  });
}

function createMockErrorResponse(
  status = 500,
  statusText = "Internal Server Error",
): Response {
  return new Response("Server Error", {
    status,
    statusText,
  });
}

Deno.test("SRC20MarketService - Comprehensive Branch Coverage", async (t) => {
  await t.step("Success path - both APIs return valid data", async () => {
    const stampScanData = [
      {
        tick: "PEPE",
        floor_unit_price: 0.001,
        sum_1d: 5.5,
        stamp_url: "https://example.com/pepe.png",
        tx_hash: "hash123",
        holder_count: 100,
      },
    ];

    const openStampData = {
      data: [
        {
          name: "PEPE",
          price: "100000", // 0.001 BTC in satoshis
          totalSupply: 1000,
          volume24: "550000000", // 5.5 BTC in satoshis
          change24: "15.5%",
          holdersCount: 150,
        },
      ],
    };

    mockFetch([
      { url: "stampscan.xyz", response: createMockResponse(stampScanData) },
      { url: "openstamp.io", response: createMockResponse(openStampData) },
    ]);

    const result = await SRC20MarketService.fetchMarketListingSummary();

    assertEquals(result.length, 1);
    assertEquals(result[0].tick, "PEPE");
    assertEquals(result[0].floor_unit_price, 0.001);
    assertEquals(result[0].mcap, 1); // 0.001 * 1000
    assertEquals(result[0].volume24, 11); // 5.5 + 5.5

    restoreFetch();
  });

  await t.step("StampScan API error handling", async () => {
    mockFetch([
      { url: "stampscan.xyz", response: createMockErrorResponse(500) },
      { url: "openstamp.io", response: createMockResponse({ data: [] }) },
    ]);

    const result = await SRC20MarketService.fetchMarketListingSummary();
    assertEquals(result.length, 0);

    restoreFetch();
  });

  await t.step("OpenStamp API error handling", async () => {
    mockFetch([
      { url: "stampscan.xyz", response: createMockResponse([]) },
      { url: "openstamp.io", response: createMockErrorResponse(403) },
    ]);

    const result = await SRC20MarketService.fetchMarketListingSummary();
    assertEquals(result.length, 0);

    restoreFetch();
  });

  await t.step("Both APIs fail gracefully", async () => {
    mockFetch([
      { url: "stampscan.xyz", response: createMockErrorResponse(500) },
      { url: "openstamp.io", response: createMockErrorResponse(500) },
    ]);

    const result = await SRC20MarketService.fetchMarketListingSummary();
    assertEquals(result.length, 0);

    restoreFetch();
  });

  await t.step("Missing tick field handling", async () => {
    const stampScanData = [
      {
        // Missing tick field
        floor_unit_price: 0.001,
        sum_1d: 5.5,
      },
    ];

    mockFetch([
      { url: "stampscan.xyz", response: createMockResponse(stampScanData) },
      { url: "openstamp.io", response: createMockResponse({ data: [] }) },
    ]);

    const result = await SRC20MarketService.fetchMarketListingSummary();
    assertEquals(result.length, 1);
    // Should have generated a random key starting with "MISSING_TICK_"
    assertEquals(result[0].tick.startsWith("MISSING_TICK_"), true);

    restoreFetch();
  });

  await t.step("Missing name field handling", async () => {
    const openStampData = {
      data: [
        {
          // Missing name field
          price: "100000",
          totalSupply: 1000,
        },
      ],
    };

    mockFetch([
      { url: "stampscan.xyz", response: createMockResponse([]) },
      { url: "openstamp.io", response: createMockResponse(openStampData) },
    ]);

    const result = await SRC20MarketService.fetchMarketListingSummary();
    assertEquals(result.length, 1);
    // Should have generated a random key starting with "MISSING_NAME_"
    assertEquals(result[0].tick.startsWith("MISSING_NAME_"), true);

    restoreFetch();
  });

  await t.step("Infinity price handling", async () => {
    const stampScanData = [
      {
        tick: "RARE",
        // Missing floor_unit_price (should default to Infinity)
        sum_1d: 0,
      },
    ];

    const openStampData = {
      data: [
        {
          name: "RARE",
          // Missing price (should default to Infinity)
          totalSupply: 1000,
        },
      ],
    };

    mockFetch([
      { url: "stampscan.xyz", response: createMockResponse(stampScanData) },
      { url: "openstamp.io", response: createMockResponse(openStampData) },
    ]);

    const result = await SRC20MarketService.fetchMarketListingSummary();
    assertEquals(result.length, 1);
    assertEquals(result[0].floor_unit_price, Infinity);
    assertEquals(result[0].mcap, 0); // Should avoid Infinity * number

    restoreFetch();
  });

  await t.step("Market cap calculation edge cases", async () => {
    const openStampData = {
      data: [
        {
          name: "ZERO",
          price: "100000", // 0.001 BTC
          totalSupply: 0, // Zero supply
        },
      ],
    };

    mockFetch([
      { url: "stampscan.xyz", response: createMockResponse([]) },
      { url: "openstamp.io", response: createMockResponse(openStampData) },
    ]);

    const result = await SRC20MarketService.fetchMarketListingSummary();
    assertEquals(result.length, 1);
    assertEquals(result[0].mcap, 0); // 0.001 * 0 = 0

    restoreFetch();
  });

  await t.step("Change24 parsing - valid percentage", async () => {
    const openStampData = {
      data: [
        {
          name: "TEST",
          change24: "-25.75%",
        },
      ],
    };

    mockFetch([
      { url: "stampscan.xyz", response: createMockResponse([]) },
      { url: "openstamp.io", response: createMockResponse(openStampData) },
    ]);

    const result = await SRC20MarketService.fetchMarketListingSummary();
    assertEquals(result.length, 1);
    // Test that change24 parsing doesn't crash (result type doesn't include change24)

    restoreFetch();
  });

  await t.step("Change24 parsing - invalid format", async () => {
    const openStampData = {
      data: [
        {
          name: "INVALID",
          change24: "not-a-number%",
        },
      ],
    };

    mockFetch([
      { url: "stampscan.xyz", response: createMockResponse([]) },
      { url: "openstamp.io", response: createMockResponse(openStampData) },
    ]);

    const result = await SRC20MarketService.fetchMarketListingSummary();
    assertEquals(result.length, 1);
    // Test that invalid change24 parsing doesn't crash

    restoreFetch();
  });

  await t.step("StampScan JSON parsing error", async () => {
    mockFetch([
      {
        url: "stampscan.xyz",
        response: new Response("invalid json", { status: 200 }),
      },
      { url: "openstamp.io", response: createMockResponse({ data: [] }) },
    ]);

    // JSON parsing error is caught and handled gracefully, returning empty array
    const result = await SRC20MarketService.fetchMarketListingSummary();
    assertEquals(result.length, 0);

    restoreFetch();
  });

  await t.step("StampScan nested data structure", async () => {
    const nestedResponse = {
      data: [
        {
          tick: "NESTED",
          floor_unit_price: 0.002,
        },
      ],
    };

    mockFetch([
      { url: "stampscan.xyz", response: createMockResponse(nestedResponse) },
      { url: "openstamp.io", response: createMockResponse({ data: [] }) },
    ]);

    const result = await SRC20MarketService.fetchMarketListingSummary();
    assertEquals(result.length, 1);
    assertEquals(result[0].tick, "NESTED");

    restoreFetch();
  });

  await t.step("OpenStamp response as root array", async () => {
    const directArray = [
      {
        name: "DIRECT",
        price: "50000",
      },
    ];

    mockFetch([
      { url: "stampscan.xyz", response: createMockResponse([]) },
      { url: "openstamp.io", response: createMockResponse(directArray) },
    ]);

    const result = await SRC20MarketService.fetchMarketListingSummary();
    assertEquals(result.length, 1);
    assertEquals(result[0].tick, "DIRECT");

    restoreFetch();
  });

  await t.step("OpenStamp unexpected data format", async () => {
    const unexpectedFormat = {
      result: "some other structure",
      items: [],
    };

    mockFetch([
      { url: "stampscan.xyz", response: createMockResponse([]) },
      { url: "openstamp.io", response: createMockResponse(unexpectedFormat) },
    ]);

    const result = await SRC20MarketService.fetchMarketListingSummary();
    assertEquals(result.length, 0);

    restoreFetch();
  });

  await t.step("OpenStamp network error handling", async () => {
    mockFetch([
      { url: "stampscan.xyz", response: createMockResponse([]) },
      {
        url: "openstamp.io",
        response: () => Promise.reject(new Error("Network error")),
      },
    ]);

    const result = await SRC20MarketService.fetchMarketListingSummary();
    assertEquals(result.length, 0);

    restoreFetch();
  });

  await t.step(
    "Price calculation with missing OpenStamp price field",
    async () => {
      const openStampData = {
        data: [
          {
            name: "NOPRICE",
            // Missing price field
            totalSupply: 1000,
            volume24: "0",
          },
        ],
      };

      mockFetch([
        { url: "stampscan.xyz", response: createMockResponse([]) },
        { url: "openstamp.io", response: createMockResponse(openStampData) },
      ]);

      const result = await SRC20MarketService.fetchMarketListingSummary();
      assertEquals(result.length, 1);
      assertEquals(result[0].market_data.openstamp.price, 0); // Infinity converted to 0

      restoreFetch();
    },
  );

  await t.step("Metadata preference - StampScan over OpenStamp", async () => {
    const stampScanData = [
      {
        tick: "META",
        stamp_url: "stampscan-url",
        tx_hash: "stampscan-hash",
        holder_count: 200,
      },
    ];

    const openStampData = {
      data: [
        {
          name: "META",
          holdersCount: 300, // Should be ignored in favor of StampScan
        },
      ],
    };

    mockFetch([
      { url: "stampscan.xyz", response: createMockResponse(stampScanData) },
      { url: "openstamp.io", response: createMockResponse(openStampData) },
    ]);

    const result = await SRC20MarketService.fetchMarketListingSummary();
    assertEquals(result.length, 1);
    assertEquals(result[0].stamp_url, "stampscan-url");
    assertEquals(result[0].tx_hash, "stampscan-hash");
    assertEquals(result[0].holder_count, 200); // StampScan value preferred

    restoreFetch();
  });

  await t.step(
    "Fallback to OpenStamp metadata when StampScan missing",
    async () => {
      const openStampData = {
        data: [
          {
            name: "FALLBACK",
            holdersCount: 250,
          },
        ],
      };

      mockFetch([
        { url: "stampscan.xyz", response: createMockResponse([]) },
        { url: "openstamp.io", response: createMockResponse(openStampData) },
      ]);

      const result = await SRC20MarketService.fetchMarketListingSummary();
      assertEquals(result.length, 1);
      assertEquals(result[0].holder_count, 250); // Fallback to OpenStamp
      assertEquals(result[0].stamp_url, null);
      assertEquals(result[0].tx_hash, "");

      restoreFetch();
    },
  );
});
