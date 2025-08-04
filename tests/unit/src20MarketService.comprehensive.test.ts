/**
 * Comprehensive branch coverage tests for SRC20MarketService
 * Target: Improve from 3.1% to >80% branch coverage
 */

import type { SRC20MarketService } from "$server/services/src20/marketService.ts";
import { assertEquals } from "@std/assert";
import { FetchHttpClient } from "$server/interfaces/httpClient.ts";

// Mock fetch globally for testing
const originalFetch = globalThis.fetch;
// Track active fetch promises and timers
let activeFetches: Promise<Response>[] = [];
let activeTimers: number[] = [];

// Override setTimeout to track timers
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;

function trackTimers() {
  globalThis.setTimeout = ((fn: any, delay: number, ...args: any[]) => {
    const id = originalSetTimeout(fn, delay, ...args);
    activeTimers.push(id);
    return id;
  }) as any;

  globalThis.clearTimeout = ((id: number) => {
    originalClearTimeout(id);
    const index = activeTimers.indexOf(id);
    if (index >= 0) {
      activeTimers.splice(index, 1);
    }
  }) as any;
}

function restoreTimers() {
  // Clear all active timers
  activeTimers.forEach((id) => originalClearTimeout(id));
  activeTimers = [];

  // Restore original functions
  globalThis.setTimeout = originalSetTimeout;
  globalThis.clearTimeout = originalClearTimeout;
}

function mockFetch(
  responses: { url: string; response: Response | (() => Promise<Response>) }[],
) {
  activeFetches = []; // Clear any previous fetches
  globalThis.fetch = async (url: string | URL) => {
    const urlStr = url.toString();
    const match = responses.find((r) => urlStr.includes(r.url));
    if (!match) {
      throw new Error(`No mock response found for URL: ${urlStr}`);
    }
    const fetchPromise = typeof match.response === "function"
      ? match.response()
      : Promise.resolve(match.response);

    activeFetches.push(fetchPromise);
    return await fetchPromise;
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
  // Track timers from the start
  trackTimers();

  // Ensure cleanup after all tests
  let cleanupNeeded = false;

  const cleanup = async () => {
    if (cleanupNeeded) {
      // Wait for all active fetches to complete
      if (activeFetches.length > 0) {
        await Promise.allSettled(activeFetches);
        activeFetches = [];
      }
      restoreFetch();
      cleanupNeeded = false;
    }
  };

  try {
    await t.step("Success path - both APIs return valid data", async () => {
      cleanupNeeded = true;
      const stampScanData = [
        {
          tick: "PEPE",
          floor_unit_price: 0.001,
          volume_24h_btc: 5.5, // Fix: Use the field name the service expects
          holder_count: 1000,
          stamp_url: "https://example.com/stamp.jpg",
          tx_hash: "abc123def456",
        },
      ];

      const openStampData = {
        data: [
          {
            name: "PEPE",
            price: "100000", // 0.001 BTC in sats
            totalSupply: 21000000,
            change24: "+5.5%",
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
      assertEquals(result[0].floor_price_btc, 0.001);

      await cleanup();
    });

    await t.step("StampScan API error handling", async () => {
      cleanupNeeded = true;
      const openStampData = {
        data: [{ name: "TEST", price: "50000", totalSupply: 1000000 }],
      };

      mockFetch([
        { url: "stampscan.xyz", response: createMockErrorResponse() },
        { url: "openstamp.io", response: createMockResponse(openStampData) },
      ]);

      const result = await SRC20MarketService.fetchMarketListingSummary();
      assertEquals(result.length, 1);
      assertEquals(result[0].tick, "TEST");

      await cleanup();
    });

    await t.step("OpenStamp API error handling", async () => {
      cleanupNeeded = true;
      const stampScanData = [
        { tick: "ERROR_TEST", floor_unit_price: 0.002, volume_24h_btc: 1.0 },
      ];

      mockFetch([
        { url: "stampscan.xyz", response: createMockResponse(stampScanData) },
        { url: "openstamp.io", response: createMockErrorResponse(403) },
      ]);

      const result = await SRC20MarketService.fetchMarketListingSummary();
      assertEquals(result.length, 1);
      assertEquals(result[0].tick, "ERROR_TEST");

      await cleanup();
    });

    await t.step("Both APIs fail gracefully", async () => {
      cleanupNeeded = true;
      mockFetch([
        { url: "stampscan.xyz", response: createMockErrorResponse() },
        { url: "openstamp.io", response: createMockErrorResponse() },
      ]);

      const result = await SRC20MarketService.fetchMarketListingSummary();
      assertEquals(result.length, 0);

      await cleanup();
    });

    await t.step("Missing tick field handling", async () => {
      cleanupNeeded = true;
      const stampScanData = [
        { floor_unit_price: 0.001, volume_24h_btc: 5.5 }, // Missing tick
      ];

      mockFetch([
        { url: "stampscan.xyz", response: createMockResponse(stampScanData) },
        { url: "openstamp.io", response: createMockResponse({ data: [] }) },
      ]);

      const result = await SRC20MarketService.fetchMarketListingSummary();
      // ✅ UPDATED: Service now creates entries with random keys for missing ticks
      assertEquals(result.length, 1);
      // Verify the item has a fallback key that starts with "MISSING_TICK_"
      assertEquals(result[0].tick.startsWith("MISSING_TICK_"), true);

      await cleanup();
    });

    await t.step("Missing name field handling", async () => {
      cleanupNeeded = true;
      const openStampData = {
        data: [{ price: "100000", totalSupply: 1000 }], // Missing name
      };

      mockFetch([
        { url: "stampscan.xyz", response: createMockResponse([]) },
        { url: "openstamp.io", response: createMockResponse(openStampData) },
      ]);

      const result = await SRC20MarketService.fetchMarketListingSummary();
      // ✅ UPDATED: Service now creates entries with random keys for missing names
      assertEquals(result.length, 1);
      // Verify the item has a fallback key that starts with "MISSING_NAME_"
      assertEquals(result[0].tick.startsWith("MISSING_NAME_"), true);

      await cleanup();
    });

    await t.step("Infinity price handling", async () => {
      cleanupNeeded = true;
      const openStampData = {
        data: [
          {
            name: "INFINITY",
            price: "Infinity",
            totalSupply: 1000,
            change24: "+0%",
          },
        ],
      };

      mockFetch([
        { url: "stampscan.xyz", response: createMockResponse([]) },
        { url: "openstamp.io", response: createMockResponse(openStampData) },
      ]);

      const result = await SRC20MarketService.fetchMarketListingSummary();
      assertEquals(result.length, 1);
      // ✅ UPDATED: Service returns null for floor_price_btc when price is Infinity
      assertEquals(result[0].floor_price_btc, null);

      await cleanup();
    });

    await t.step("Market cap calculation edge cases", async () => {
      cleanupNeeded = true;
      const openStampData = {
        data: [
          {
            name: "EDGE",
            price: "0", // Zero price
            totalSupply: 1000000,
            change24: "+0%",
          },
        ],
      };

      mockFetch([
        { url: "stampscan.xyz", response: createMockResponse([]) },
        { url: "openstamp.io", response: createMockResponse(openStampData) },
      ]);

      const result = await SRC20MarketService.fetchMarketListingSummary();
      assertEquals(result.length, 1);
      // ✅ UPDATED: Service correctly converts "0" price to 0 (not null)
      assertEquals(result[0].floor_price_btc, 0);
      assertEquals(result[0].market_cap_btc, 0);

      await cleanup();
    });

    await t.step("Change24 parsing - valid percentage", async () => {
      cleanupNeeded = true;
      const openStampData = {
        data: [
          {
            name: "CHANGE",
            price: "50000",
            totalSupply: 1000,
            change_24h: "+15.5%",
          },
        ],
      };

      mockFetch([
        { url: "stampscan.xyz", response: createMockResponse([]) },
        { url: "openstamp.io", response: createMockResponse(openStampData) },
      ]);

      const result = await SRC20MarketService.fetchMarketListingSummary();
      assertEquals(result.length, 1);
      // ✅ UPDATED: Service correctly parses change_24h field and maps to change_24h
      assertEquals(result[0].change_24h, 15.5);

      await cleanup();
    });

    await t.step("Change24 parsing - invalid format", async () => {
      cleanupNeeded = true;
      const openStampData = {
        data: [
          {
            name: "INVALID",
            price: "50000",
            totalSupply: 1000,
            change_24h: "not-a-number%",
          },
        ],
      };

      mockFetch([
        { url: "stampscan.xyz", response: createMockResponse([]) },
        { url: "openstamp.io", response: createMockResponse(openStampData) },
      ]);

      const result = await SRC20MarketService.fetchMarketListingSummary();
      assertEquals(result.length, 1);
      // ✅ UPDATED: Service returns undefined for invalid change_24h format
      assertEquals(result[0].change_24h, undefined);

      await cleanup();
    });

    await t.step("StampScan JSON parsing error", async () => {
      cleanupNeeded = true;
      mockFetch([
        {
          url: "stampscan.xyz",
          response: new Response("invalid json", { status: 200 }),
        },
        { url: "openstamp.io", response: createMockResponse({ data: [] }) },
      ]);

      const result = await SRC20MarketService.fetchMarketListingSummary();
      assertEquals(result.length, 0);

      await cleanup();
    });

    await t.step("StampScan nested data structure", async () => {
      cleanupNeeded = true;
      const stampScanData = {
        data: [
          {
            tick: "NESTED",
            floor_unit_price: 0.003,
            volume_24h_btc: 2.5,
            holder_count: 500,
          },
        ],
      };

      mockFetch([
        { url: "stampscan.xyz", response: createMockResponse(stampScanData) },
        { url: "openstamp.io", response: createMockResponse({ data: [] }) },
      ]);

      const result = await SRC20MarketService.fetchMarketListingSummary();
      assertEquals(result.length, 1);
      assertEquals(result[0].tick, "NESTED");

      await cleanup();
    });

    await t.step("OpenStamp response as root array", async () => {
      cleanupNeeded = true;
      const openStampData = [
        { name: "ROOT", price: "75000", totalSupply: 2000000 },
      ];

      mockFetch([
        { url: "stampscan.xyz", response: createMockResponse([]) },
        { url: "openstamp.io", response: createMockResponse(openStampData) },
      ]);

      const result = await SRC20MarketService.fetchMarketListingSummary();
      assertEquals(result.length, 1);
      assertEquals(result[0].tick, "ROOT");

      await cleanup();
    });

    await t.step("OpenStamp unexpected data format", async () => {
      cleanupNeeded = true;
      const openStampData = {
        result: "some other structure",
        items: [],
      };

      mockFetch([
        { url: "stampscan.xyz", response: createMockResponse([]) },
        { url: "openstamp.io", response: createMockResponse(openStampData) },
      ]);

      const result = await SRC20MarketService.fetchMarketListingSummary();
      assertEquals(result.length, 0);

      await cleanup();
    });

    await t.step("OpenStamp network error handling", async () => {
      cleanupNeeded = true;
      mockFetch([
        { url: "stampscan.xyz", response: createMockResponse([]) },
        {
          url: "openstamp.io",
          response: createMockErrorResponse(500, "Error"),
        },
      ]);

      const result = await SRC20MarketService.fetchMarketListingSummary();
      assertEquals(result.length, 0);

      await cleanup();
    });

    await t.step(
      "Price calculation with missing OpenStamp price field",
      async () => {
        cleanupNeeded = true;
        const openStampData = {
          data: [{ name: "NOPRICE", totalSupply: 1000 }], // Missing price
        };

        mockFetch([
          { url: "stampscan.xyz", response: createMockResponse([]) },
          { url: "openstamp.io", response: createMockResponse(openStampData) },
        ]);

        const result = await SRC20MarketService.fetchMarketListingSummary();
        assertEquals(result.length, 1);
        // ✅ UPDATED: Service returns null when no valid price is available
        assertEquals(result[0].floor_price_btc, null);

        await cleanup();
      },
    );

    await t.step("Metadata preference - StampScan over OpenStamp", async () => {
      cleanupNeeded = true;
      const stampScanData = [
        {
          tick: "PREFER",
          floor_unit_price: 0.001,
          volume_24h_btc: 5.5,
          holder_count: 1500, // StampScan value
          stamp_url: "https://stampscan.com/image.jpg",
          tx_hash: "stampscan123",
        },
      ];

      const openStampData = {
        data: [
          {
            name: "PREFER",
            price: "100000",
            totalSupply: 1000000,
            change24: "+10%",
            // Different metadata that should be ignored
          },
        ],
      };

      mockFetch([
        { url: "stampscan.xyz", response: createMockResponse(stampScanData) },
        { url: "openstamp.io", response: createMockResponse(openStampData) },
      ]);

      const result = await SRC20MarketService.fetchMarketListingSummary();
      assertEquals(result.length, 1);
      assertEquals(result[0].holder_count, 1500); // Should prefer StampScan
      assertEquals(result[0].stamp_url, "https://stampscan.com/image.jpg");

      await cleanup();
    });

    await t.step(
      "Fallback to OpenStamp metadata when StampScan missing",
      async () => {
        cleanupNeeded = true;
        const stampScanData = [
          {
            tick: "FALLBACK",
            floor_unit_price: 0.002,
            volume_24h_btc: 3.0,
            // Missing holder_count and other metadata
          },
        ];

        const openStampData = {
          data: [
            {
              name: "FALLBACK",
              price: "200000",
              totalSupply: 500000,
              change_24h: "-2.5%",
              holdersCount: 250, // ✅ UPDATED: Service looks for holdersCount field
            },
          ],
        };

        mockFetch([
          { url: "stampscan.xyz", response: createMockResponse(stampScanData) },
          { url: "openstamp.io", response: createMockResponse(openStampData) },
        ]);

        const result = await SRC20MarketService.fetchMarketListingSummary();
        assertEquals(result.length, 1);
        assertEquals(result[0].holder_count, 250); // Fallback to OpenStamp
        assertEquals(result[0].stamp_url, null);
        assertEquals(result[0].tx_hash, "");

        await cleanup();
      },
    );
  } finally {
    // Final cleanup in case any step failed
    await cleanup();
    // Restore timer functions and clear all timers
    restoreTimers();
  }
});
