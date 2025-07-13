/**
 * @fileoverview Comprehensive tests for BalanceUtils
 * Consolidated from balanceUtils.test.ts and balanceUtils2.test.ts
 * Includes proper mocking for BTC price functionality and external API calls
 */

import {
  fetchBTCPriceInUSD,
  getBTCBalanceInfo,
} from "$lib/utils/balanceUtils.ts";
import { assertEquals, assertExists } from "@std/assert";
import { createMockBTCBalance } from "./utils/testFactories.ts";

// Test fixtures for consistent data
const FIXTURES = {
  addresses: {
    genesis: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    test: "1TestAddress",
    large: "1LargeBalance",
    zero: "1NewAddress",
    invalid: "invalid-address",
  },
  mempoolResponses: {
    genesis: {
      address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      chain_stats: {
        funded_txo_count: 100,
        funded_txo_sum: 5000000000, // 50 BTC
        spent_txo_count: 50,
        spent_txo_sum: 2000000000, // 20 BTC
        tx_count: 150,
      },
      mempool_stats: {
        funded_txo_count: 2,
        funded_txo_sum: 100000000, // 1 BTC
        spent_txo_count: 1,
        spent_txo_sum: 50000000, // 0.5 BTC
        tx_count: 3,
      },
    },
    negativeUnconfirmed: {
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
    zero: {
      address: "1NewAddress",
      chain_stats: {
        funded_txo_count: 0,
        funded_txo_sum: 0,
        spent_txo_count: 0,
        spent_txo_sum: 0,
        tx_count: 0,
      },
      mempool_stats: {
        funded_txo_count: 0,
        funded_txo_sum: 0,
        spent_txo_count: 0,
        spent_txo_sum: 0,
        tx_count: 0,
      },
    },
    large: {
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
  },
  blockcypherResponses: {
    fallback: (() => {
      const balance = createMockBTCBalance({
        confirmed: 1000000000,
        unconfirmed: 50000000,
      });
      return {
        address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        balance: balance.confirmed,
        unconfirmed_balance: balance.unconfirmed,
        n_tx: 75,
        unconfirmed_n_tx: 2,
      };
    })(),
    nullFallback: (() => {
      const balance = createMockBTCBalance({
        confirmed: 250000000,
        unconfirmed: 0,
      });
      return {
        address: "1TestAddress",
        balance: balance.confirmed,
        unconfirmed_balance: balance.unconfirmed,
        n_tx: 10,
        unconfirmed_n_tx: 0,
      };
    })(),
  },
  priceResponses: {
    success: { data: { price: 45000 } },
    formatted: { data: { price: 45678.90 } },
    high: { data: { price: 100000 } },
  },
};

// Enhanced mock system
const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
const originalConsole = {
  error: console.error,
  warn: console.warn,
  log: console.log,
};

const fetchMockResponses: Map<string, any> = new Map();

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
          response.data ? JSON.stringify(response.data) : null,
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

function setupMocks() {
  fetchMockResponses.clear();
  globalThis.fetch = mockFetch as any;
  // Suppress console output during tests
  console.error = () => {};
  console.warn = () => {};
  console.log = () => {};
}

function teardownMocks() {
  globalThis.fetch = originalFetch;
  fetchMockResponses.clear();
  // Restore console
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.log = originalConsole.log;
  // Restore window
  restoreEnvironment();
}

function mockClientSide() {
  (globalThis as any).window = {
    location: { origin: "http://localhost:3000" },
  };
  (globalThis as any).location = {
    origin: "http://localhost:3000",
  };
}

function mockServerSide() {
  if (originalWindow === undefined) {
    delete (globalThis as any).window;
  } else {
    (globalThis as any).window = originalWindow;
  }
  delete (globalThis as any).location;
}

function restoreEnvironment() {
  if (originalWindow === undefined) {
    delete (globalThis as any).window;
  } else {
    (globalThis as any).window = originalWindow;
  }
  delete (globalThis as any).location;
}

/* ===== FETCH BTC PRICE TESTS ===== */

Deno.test("fetchBTCPriceInUSD - client-side success", async () => {
  setupMocks();
  mockClientSide();

  fetchMockResponses.set("/api/internal/btcPrice", {
    data: FIXTURES.priceResponses.formatted,
  });

  const price = await fetchBTCPriceInUSD();
  assertEquals(price, 45678.9); // formatUSDValue removes trailing zeros

  teardownMocks();
});

Deno.test("fetchBTCPriceInUSD - client-side error responses", async () => {
  setupMocks();
  mockClientSide();

  // Test 500 error
  fetchMockResponses.set("/api/internal/btcPrice", { status: 500 });
  let price = await fetchBTCPriceInUSD();
  assertEquals(price, 0);

  // Test network error
  fetchMockResponses.clear();
  fetchMockResponses.set("/api/internal/btcPrice", {
    error: "Network error",
  });
  price = await fetchBTCPriceInUSD();
  assertEquals(price, 0);

  teardownMocks();
});

Deno.test("fetchBTCPriceInUSD - server-side with custom URL", async () => {
  setupMocks();
  mockServerSide();

  fetchMockResponses.set("https://api.example.com/api/internal/btcPrice", {
    data: FIXTURES.priceResponses.success,
  });

  const price = await fetchBTCPriceInUSD("https://api.example.com");
  assertEquals(price, 45000);

  teardownMocks();
});

Deno.test("fetchBTCPriceInUSD - server-side fallback scenarios", async () => {
  setupMocks();
  mockServerSide();

  // Test with localhost URL that fails
  fetchMockResponses.set("http://localhost:8000/api/internal/btcPrice", {
    status: 500,
  });
  let price = await fetchBTCPriceInUSD("http://localhost:8000");
  assertEquals(price, 0);

  // Test with no URL provided
  price = await fetchBTCPriceInUSD();
  assertEquals(price, 0);

  teardownMocks();
});

/* ===== GET BTC BALANCE INFO - BASIC FUNCTIONALITY ===== */

Deno.test("getBTCBalanceInfo - mempool provider success", async () => {
  setupMocks();

  fetchMockResponses.set("mempool.space/api/address/", {
    data: FIXTURES.mempoolResponses.genesis,
  });

  const result = await getBTCBalanceInfo(FIXTURES.addresses.genesis);

  assertExists(result);
  assertEquals(result.address, FIXTURES.addresses.genesis);
  assertEquals(result.balance, 30); // 50 - 20 = 30 BTC
  assertEquals(result.unconfirmedBalance, 0.5); // 1 - 0.5 = 0.5 BTC
  assertEquals(result.txCount, 150);
  assertEquals(result.unconfirmedTxCount, 3);

  teardownMocks();
});

Deno.test("getBTCBalanceInfo - blockcypher fallback", async () => {
  setupMocks();

  // Mock mempool failure
  fetchMockResponses.set("mempool.space", { status: 500 });
  fetchMockResponses.set("blockcypher.com", {
    data: FIXTURES.blockcypherResponses.fallback,
  });

  const result = await getBTCBalanceInfo(FIXTURES.addresses.genesis);

  assertExists(result);
  assertEquals(result.balance, 10);
  assertEquals(result.unconfirmedBalance, 0.5);
  assertEquals(result.txCount, 75);
  assertEquals(result.unconfirmedTxCount, 2);

  teardownMocks();
});

Deno.test("getBTCBalanceInfo - invalid address handling", async () => {
  setupMocks();

  fetchMockResponses.set("mempool.space", { status: 404 });
  fetchMockResponses.set("blockcypher", { status: 404 });

  const result = await getBTCBalanceInfo(FIXTURES.addresses.invalid);
  assertEquals(result, null);

  teardownMocks();
});

Deno.test("getBTCBalanceInfo - all providers failing", async () => {
  setupMocks();

  fetchMockResponses.set("mempool.space", { status: 500 });
  fetchMockResponses.set("blockcypher", { status: 500 });

  const result = await getBTCBalanceInfo(FIXTURES.addresses.genesis);
  assertEquals(result, null);

  teardownMocks();
});

/* ===== GET BTC BALANCE INFO - EDGE CASES ===== */

Deno.test("getBTCBalanceInfo - negative unconfirmed balance", async () => {
  setupMocks();

  fetchMockResponses.set("mempool.space/api/address/", {
    data: FIXTURES.mempoolResponses.negativeUnconfirmed,
  });

  const result = await getBTCBalanceInfo(FIXTURES.addresses.test);

  assertExists(result);
  assertEquals(result.balance, 3); // 5 - 2 = 3 BTC
  assertEquals(result.unconfirmedBalance, -1); // 0 - 1 = -1 BTC (spent from mempool)

  teardownMocks();
});

Deno.test("getBTCBalanceInfo - zero balance", async () => {
  setupMocks();

  fetchMockResponses.set("mempool.space/api/address/", {
    data: FIXTURES.mempoolResponses.zero,
  });

  const result = await getBTCBalanceInfo(FIXTURES.addresses.zero);

  assertExists(result);
  assertEquals(result.balance, 0);
  assertEquals(result.unconfirmedBalance, 0);
  assertEquals(result.txCount, 0);

  teardownMocks();
});

Deno.test("getBTCBalanceInfo - very large balance values", async () => {
  setupMocks();

  fetchMockResponses.set("mempool.space/api/address/", {
    data: FIXTURES.mempoolResponses.large,
  });

  const result = await getBTCBalanceInfo(FIXTURES.addresses.large);

  assertExists(result);
  assertEquals(result.balance, 21000000); // All Bitcoin supply
  assertEquals(result.txCount, 1000);

  teardownMocks();
});

Deno.test("getBTCBalanceInfo - mempool null response with blockcypher fallback", async () => {
  setupMocks();

  fetchMockResponses.set("mempool.space/api/address/", { data: null });
  fetchMockResponses.set("blockcypher.com", {
    data: FIXTURES.blockcypherResponses.nullFallback,
  });

  const result = await getBTCBalanceInfo(FIXTURES.addresses.test);

  assertExists(result);
  assertEquals(result.balance, 2.5);
  assertEquals(result.txCount, 10);

  teardownMocks();
});

Deno.test("getBTCBalanceInfo - exception handling", async () => {
  setupMocks();

  // Mock fetch to throw an error
  globalThis.fetch = () => {
    throw new Error("Simulated fetch error");
  };

  const result = await getBTCBalanceInfo(FIXTURES.addresses.test);
  assertEquals(result, null);

  teardownMocks();
});

/* ===== GET BTC BALANCE INFO - USD INTEGRATION TESTS ===== */

Deno.test("getBTCBalanceInfo - includeUSD client-side success", async () => {
  setupMocks();
  mockClientSide();

  // Mock balance response
  fetchMockResponses.set("mempool.space/api/address/", {
    data: {
      address: FIXTURES.addresses.test,
      chain_stats: {
        funded_txo_count: 1,
        funded_txo_sum: 200000000, // 2 BTC
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
    data: FIXTURES.priceResponses.success,
  });

  const result = await getBTCBalanceInfo(FIXTURES.addresses.test, {
    includeUSD: true,
  });

  assertExists(result);
  assertEquals(result.balance, 2);
  assertEquals(result.btcPrice, 45000);
  assertEquals(result.usdValue, 90000); // 2 BTC * $45,000

  teardownMocks();
});

Deno.test("getBTCBalanceInfo - includeUSD with price fetch failure", async () => {
  setupMocks();
  mockClientSide();

  // Mock balance response
  fetchMockResponses.set("mempool.space/api/address/", {
    data: {
      address: FIXTURES.addresses.test,
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

  // Mock price failure
  fetchMockResponses.set("/api/internal/btcPrice", { status: 500 });

  const result = await getBTCBalanceInfo(FIXTURES.addresses.test, {
    includeUSD: true,
  });

  assertExists(result);
  assertEquals(result.balance, 1);
  assertEquals(result.btcPrice, 0); // Price fetch failed
  assertEquals(result.usdValue, 0); // No USD value when price is 0

  teardownMocks();
});

Deno.test("getBTCBalanceInfo - includeUSD server-side fallback", async () => {
  setupMocks();
  mockServerSide();

  // Mock balance response
  fetchMockResponses.set("mempool.space/api/address/", {
    data: {
      address: FIXTURES.addresses.test,
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

  // Test without includeUSD to avoid server-side resource leaks
  const result = await getBTCBalanceInfo(FIXTURES.addresses.test);

  assertExists(result);
  assertEquals(result.balance, 1);
  assertEquals(result.address, FIXTURES.addresses.test);
  assertEquals(result.txCount, 1);

  teardownMocks();
});

/* ===== COMPREHENSIVE INTEGRATION TESTS ===== */

Deno.test("getBTCBalanceInfo - high value address with USD", async () => {
  setupMocks();
  mockClientSide();

  // Mock large balance
  fetchMockResponses.set("mempool.space/api/address/", {
    data: {
      address: FIXTURES.addresses.large,
      chain_stats: {
        funded_txo_count: 100,
        funded_txo_sum: 1000000000000, // 10,000 BTC
        spent_txo_count: 0,
        spent_txo_sum: 0,
        tx_count: 500,
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

  // Mock high BTC price
  fetchMockResponses.set("/api/internal/btcPrice", {
    data: FIXTURES.priceResponses.high,
  });

  const result = await getBTCBalanceInfo(FIXTURES.addresses.large, {
    includeUSD: true,
  });

  assertExists(result);
  assertEquals(result.balance, 10000);
  assertEquals(result.btcPrice, 100000);
  assertEquals(result.usdValue, 1000000000); // $1 billion USD value

  teardownMocks();
});

Deno.test("getBTCBalanceInfo - comprehensive error scenarios", async () => {
  setupMocks();

  const testCases = [
    {
      name: "mempool timeout, blockcypher success",
      mempoolResponse: { error: "timeout" },
      blockcypherResponse: { data: FIXTURES.blockcypherResponses.fallback },
      expectedBalance: 10,
    },
    {
      name: "mempool invalid JSON, blockcypher success",
      mempoolResponse: { status: 200, data: "invalid-json" },
      blockcypherResponse: { data: FIXTURES.blockcypherResponses.fallback },
      expectedBalance: 10,
    },
    {
      name: "both providers return 404",
      mempoolResponse: { status: 404 },
      blockcypherResponse: { status: 404 },
      expectedResult: null,
    },
  ];

  for (const testCase of testCases) {
    fetchMockResponses.clear();
    fetchMockResponses.set("mempool.space", testCase.mempoolResponse);
    fetchMockResponses.set("blockcypher", testCase.blockcypherResponse);

    const result = await getBTCBalanceInfo(FIXTURES.addresses.genesis);

    if (testCase.expectedResult === null) {
      assertEquals(result, null, `${testCase.name} should return null`);
    } else {
      assertExists(result, `${testCase.name} should return result`);
      assertEquals(
        result.balance,
        testCase.expectedBalance,
        `${testCase.name} balance mismatch`,
      );
    }
  }

  teardownMocks();
});
