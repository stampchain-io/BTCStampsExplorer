import { assertEquals, assertExists } from "@std/assert";
import {
  fetchBTCPriceInUSD,
  getBTCBalanceInfo,
} from "$lib/utils/balanceUtils.ts";

// Mock fetch for testing
const originalFetch = globalThis.fetch;
const fetchMockResponses: Map<string, any> = new Map();

// Mock console methods
const originalConsole = {
  error: console.error,
  warn: console.warn,
  log: console.log,
};

function suppressConsole() {
  console.error = () => {};
  console.warn = () => {};
  console.log = () => {};
}

function restoreConsole() {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.log = originalConsole.log;
}

function mockFetch(url: string | URL | Request): Promise<Response> {
  const urlString = url.toString();

  // Find matching mock response
  for (const [pattern, response] of fetchMockResponses) {
    if (urlString.includes(pattern)) {
      if (response.error) {
        return Promise.reject(new Error(response.error));
      }
      return Promise.resolve(
        new Response(
          JSON.stringify(response.data),
          {
            status: response.status || 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    }
  }

  // Default to 404
  return Promise.resolve(new Response(null, { status: 404 }));
}

function setupFetchMock() {
  fetchMockResponses.clear();
  globalThis.fetch = mockFetch as any;
  suppressConsole();
}

function teardownFetchMock() {
  globalThis.fetch = originalFetch;
  fetchMockResponses.clear();
  restoreConsole();
}

// Mock window object for client-side tests
const originalWindow = globalThis.window;

function mockClientSide() {
  (globalThis as any).window = {
    location: {
      origin: "http://localhost:3000",
    },
  };
  // Also set globalThis.location for the fetch URL construction
  (globalThis as any).location = {
    origin: "http://localhost:3000",
  };
}

function restoreServerSide() {
  if (originalWindow === undefined) {
    delete (globalThis as any).window;
  } else {
    (globalThis as any).window = originalWindow;
  }
  delete (globalThis as any).location;
}

Deno.test("fetchBTCPriceInUSD - client-side with successful response", async () => {
  setupFetchMock();
  mockClientSide();

  // Mock successful price response
  fetchMockResponses.set("/api/internal/btcPrice", {
    data: {
      data: {
        price: 45678.90,
      },
    },
  });

  const price = await fetchBTCPriceInUSD();

  assertEquals(price, 45678.9, "Should return formatted price"); // formatUSDValue removes trailing zeros

  restoreServerSide();
  teardownFetchMock();
});

Deno.test("fetchBTCPriceInUSD - client-side with failed response", async () => {
  setupFetchMock();
  mockClientSide();

  // Mock failed response
  fetchMockResponses.set("/api/internal/btcPrice", {
    status: 500,
  });

  const price = await fetchBTCPriceInUSD();

  assertEquals(price, 0, "Should return 0 on error");

  restoreServerSide();
  teardownFetchMock();
});

Deno.test("fetchBTCPriceInUSD - client-side with network error", async () => {
  setupFetchMock();
  mockClientSide();

  // Mock network error
  fetchMockResponses.set("/api/internal/btcPrice", {
    error: "Network error",
  });

  const price = await fetchBTCPriceInUSD();

  assertEquals(price, 0, "Should return 0 on network error");

  restoreServerSide();
  teardownFetchMock();
});

Deno.test("fetchBTCPriceInUSD - server-side with apiBaseUrl", async () => {
  setupFetchMock();

  // Mock successful response from custom URL
  fetchMockResponses.set("https://api.example.com/api/internal/btcPrice", {
    data: {
      data: {
        price: 50000,
      },
    },
  });

  const price = await fetchBTCPriceInUSD("https://api.example.com");

  assertEquals(price, 50000, "Should return price from custom URL");

  teardownFetchMock();
});

Deno.test("fetchBTCPriceInUSD - server-side with localhost URL", async () => {
  setupFetchMock();

  // Mock failed response from localhost
  fetchMockResponses.set("http://localhost:8000/api/internal/btcPrice", {
    status: 500,
  });

  const price = await fetchBTCPriceInUSD("http://localhost:8000");

  // Will try to import BTCPriceService which will fail in test environment
  assertEquals(price, 0, "Should return 0 when all methods fail");

  teardownFetchMock();
});

Deno.test("fetchBTCPriceInUSD - no apiBaseUrl server-side", async () => {
  setupFetchMock();

  // Ensure we're in server-side mode (no window)
  restoreServerSide();

  const price = await fetchBTCPriceInUSD();

  assertEquals(price, 0, "Should return 0 when no URL provided server-side");

  teardownFetchMock();
});

Deno.test("getBTCBalanceInfo - with negative unconfirmed balance", async () => {
  setupFetchMock();

  // Mock response with negative unconfirmed (spent from mempool)
  fetchMockResponses.set("mempool.space/api/address/", {
    data: {
      address: "1TestAddress",
      chain_stats: {
        funded_txo_count: 10,
        funded_txo_sum: 500000000, // 5 BTC
        spent_txo_count: 5,
        spent_txo_sum: 200000000, // 2 BTC
        tx_count: 15,
      },
      mempool_stats: {
        funded_txo_count: 0,
        funded_txo_sum: 0,
        spent_txo_count: 2,
        spent_txo_sum: 100000000, // 1 BTC spent (negative unconfirmed)
        tx_count: 2,
      },
    },
  });

  const result = await getBTCBalanceInfo("1TestAddress");

  assertExists(result);
  assertEquals(result?.balance, 3, "Confirmed balance should be 3 BTC");
  assertEquals(result?.unconfirmedBalance, -1, "Unconfirmed should be -1 BTC");

  teardownFetchMock();
});

Deno.test("getBTCBalanceInfo - mempool returns null, blockcypher succeeds", async () => {
  setupFetchMock();

  // Mock mempool returning null (not just error)
  fetchMockResponses.set("mempool.space/api/address/", {
    data: null,
  });

  // Mock successful blockcypher
  fetchMockResponses.set("blockcypher.com", {
    data: {
      address: "1TestAddress",
      balance: 250000000, // 2.5 BTC
      unconfirmed_balance: 0,
      n_tx: 10,
      unconfirmed_n_tx: 0,
    },
  });

  const result = await getBTCBalanceInfo("1TestAddress");

  assertExists(result);
  assertEquals(result?.balance, 2.5, "Should get balance from blockcypher");
  assertEquals(result?.txCount, 10);

  teardownFetchMock();
});

Deno.test("getBTCBalanceInfo - very large balance values", async () => {
  setupFetchMock();

  // Mock response with very large values
  fetchMockResponses.set("mempool.space/api/address/", {
    data: {
      address: "1LargeBalance",
      chain_stats: {
        funded_txo_count: 1000,
        funded_txo_sum: 2100000000000000, // 21,000,000 BTC (all Bitcoin)
        spent_txo_count: 0,
        spent_txo_sum: 0,
        tx_count: 1000,
      },
      mempool_stats: {
        funded_txo_count: 0,
        funded_txo_sum: 0,
        spent_txo_count: 0,
        spent_txo_sum: 0,
        tx_count: 0,
      },
    },
  });

  const result = await getBTCBalanceInfo("1LargeBalance");

  assertExists(result);
  assertEquals(result?.balance, 21000000, "Should handle large balances");
  assertEquals(result?.txCount, 1000);

  teardownFetchMock();
});

Deno.test("getBTCBalanceInfo - includeUSD option server-side", async () => {
  setupFetchMock();

  // Ensure server-side
  restoreServerSide();

  // Mock balance response
  fetchMockResponses.set("mempool.space/api/address/", {
    data: {
      address: "1TestUSD",
      chain_stats: {
        funded_txo_count: 1,
        funded_txo_sum: 100000000, // 1 BTC
        spent_txo_count: 0,
        spent_txo_sum: 0,
        tx_count: 1,
      },
      mempool_stats: {
        funded_txo_count: 0,
        funded_txo_sum: 0,
        spent_txo_count: 0,
        spent_txo_sum: 0,
        tx_count: 0,
      },
    },
  });

  const result = await getBTCBalanceInfo("1TestUSD", { includeUSD: true });

  assertExists(result);
  assertEquals(result?.balance, 1);
  // In test environment, BTCPriceService import will fail
  assertEquals(result?.btcPrice, 0);
  assertEquals(result?.usdValue, 0);

  teardownFetchMock();
});

Deno.test("getBTCBalanceInfo - includeUSD option client-side", async () => {
  setupFetchMock();
  mockClientSide();

  // Mock balance response
  fetchMockResponses.set("mempool.space/api/address/", {
    data: {
      address: "1TestUSD",
      chain_stats: {
        funded_txo_count: 1,
        funded_txo_sum: 100000000, // 1 BTC
        spent_txo_count: 0,
        spent_txo_sum: 0,
        tx_count: 1,
      },
      mempool_stats: {
        funded_txo_count: 0,
        funded_txo_sum: 0,
        spent_txo_count: 0,
        spent_txo_sum: 0,
        tx_count: 0,
      },
    },
  });

  // Mock price response
  fetchMockResponses.set("/api/internal/btcPrice", {
    data: {
      data: {
        price: 40000,
      },
    },
  });

  const result = await getBTCBalanceInfo("1TestUSD", { includeUSD: true });

  assertExists(result);
  assertEquals(result?.balance, 1);
  assertEquals(result?.btcPrice, 40000);
  assertEquals(result?.usdValue, 40000);

  restoreServerSide();
  teardownFetchMock();
});

Deno.test("getBTCBalanceInfo - exception in main try block", async () => {
  setupFetchMock();

  // Mock a response that will cause JSON parsing to fail
  globalThis.fetch = () => {
    throw new Error("Simulated fetch error");
  };

  const result = await getBTCBalanceInfo("1ErrorAddress");

  assertEquals(result, null, "Should return null on exception");

  teardownFetchMock();
});
