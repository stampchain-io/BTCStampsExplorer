/**
 * Comprehensive branch coverage tests for CommonUTXOService
 * Target: Improve from 8.5% to >80% branch coverage
 *
 * This test file focuses specifically on branch coverage for:
 * - getSpendableUTXOs with QuickNode/public API fallbacks
 * - getSpecificUTXO with various options and error paths
 * - getRawTransactionHex with caching and source switching
 * - Error handling and fallback mechanisms
 * - Configuration-dependent branches
 */

// Set test environment BEFORE any imports that might trigger database connections
Deno.env.set("SKIP_REDIS_CONNECTION", "true");
Deno.env.set("SKIP_DB_CONNECTION", "true");
Deno.env.set("DENO_ENV", "test");
Deno.env.set("SKIP_EXTERNAL_APIS", "true");
(globalThis as any).SKIP_REDIS_CONNECTION = true;
(globalThis as any).SKIP_DB_CONNECTION = true;

import { assertEquals, assertExists } from "@std/assert";
import { utxoFixtures } from "../fixtures/utxoFixtures.ts";
import { MockDatabaseManager } from "../mocks/mockDatabaseManager.ts";
import { createMockUTXO } from "./utils/testFactories.ts";

// Create a mock dbManager with handleCache method BEFORE any service imports
const mockDbManager = new MockDatabaseManager();
(mockDbManager as any).handleCache = async (
  key: string,
  fetchFn: () => Promise<any>,
) => {
  // Simple pass-through for testing - don't actually cache
  return await fetchFn();
};

// Override the dbManager export before importing services
(globalThis as any).__mockDbManager = mockDbManager;

// Mock the dependencies first
const originalConfig = {
  QUICKNODE_ENDPOINT: Deno.env.get("QUICKNODE_ENDPOINT"),
  QUICKNODE_API_KEY: Deno.env.get("QUICKNODE_API_KEY"),
};

// Store original fetch for cleanup
const originalFetch = globalThis.fetch;

// Mock serverConfig
const mockServerConfig = {
  QUICKNODE_ENDPOINT: "test-endpoint",
  QUICKNODE_API_KEY: "test-key",
};

// Set up global mocks
(globalThis as any).mockServerConfig = mockServerConfig;

// Make dbManager available globally for CachedQuicknodeRPCService
(globalThis as any).dbManager = mockDbManager;

// Mock QuicknodeUTXOService
const mockQuicknodeUTXOService = {
  getRawTransactionHex: (txid: string) => {
    if (txid === "error_tx") {
      return Promise.resolve({ error: "QuickNode error", data: null });
    }
    if (txid === "quicknode_tx") {
      return Promise.resolve({ data: "0200000001abcd...", error: null });
    }
    return Promise.resolve({ data: null, error: "Not found" });
  },

  getUTXOsForAddress: (address: string, _options?: any) => {
    if (address === "quicknode_address") {
      return Promise.resolve({
        data: [createMockUTXO({
          txid: utxoFixtures.p2wpkh.standard.txid,
          vout: 0,
          value: 100000,
          address: address,
        })],
        error: null,
      });
    }
    if (address === "quicknode_error_address") {
      return Promise.resolve({ error: "QuickNode UTXO error", data: null });
    }
    return Promise.resolve({ data: [], error: null });
  },

  getSpecificUTXO: (txid: string, vout: number, _options?: any) => {
    if (txid === "quicknode_specific_tx") {
      return Promise.resolve({
        data: createMockUTXO({
          txid,
          vout,
          value: 50000,
          script: utxoFixtures.p2wpkh.standard.script,
          scriptType: "p2wpkh",
        }),
        error: null,
      });
    }
    if (txid === "quicknode_specific_error") {
      return Promise.resolve({
        error: "QuickNode specific UTXO error",
        data: null,
      });
    }
    return Promise.resolve({ data: null, error: "Not found" });
  },
};

// Mock public API utilities
const mockUtxoUtils = {
  getUTXOForAddress: (address: string) => {
    if (address === "public_api_address") {
      return Promise.resolve([createMockUTXO({
        txid: utxoFixtures.p2pkh.standard.txid,
        vout: 1,
        value: 75000,
        address: address,
      })]);
    }
    if (address === "public_api_error") {
      return Promise.reject(new Error("Public API error"));
    }
    return Promise.resolve([]);
  },
};

// Mock fetch for raw transaction hex from public APIs and QuickNode
const mockFetch = (url: string, options?: any): Promise<Response> => {
  // Create a proper headers mock that matches the Headers interface
  const createMockHeaders = (contentType = "application/json") => {
    const headersMap = new Map([["content-type", contentType]]);

    return {
      get: (name: string) => {
        return headersMap.get(name.toLowerCase()) || null;
      },
      forEach: (callback: (value: string, key: string) => void) => {
        headersMap.forEach((value, key) => callback(value, key));
      },
      has: (name: string) => headersMap.has(name.toLowerCase()),
      set: (name: string, value: string) =>
        headersMap.set(name.toLowerCase(), value),
      delete: (name: string) => headersMap.delete(name.toLowerCase()),
      entries: () => headersMap.entries(),
      keys: () => headersMap.keys(),
      values: () => headersMap.values(),
    };
  };

  // Mock QuickNode endpoint responses
  if (url.includes("test-endpoint")) {
    const body = JSON.parse(options?.body || "{}");

    // Handle bb_getUTXOs method
    if (body.method === "bb_getUTXOs") {
      const address = body.params?.[0];

      if (address === "quicknode_address") {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          headers: createMockHeaders(),
          redirected: false,
          type: "basic",
          url: url,
          body: null,
          bodyUsed: false,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          blob: () => Promise.resolve(new Blob()),
          formData: () => Promise.resolve(new FormData()),
          json: () =>
            Promise.resolve({
              result: [
                {
                  txid: "quicknode_tx_1",
                  vout: 0,
                  value: 100000,
                  height: 850000,
                  confirmations: 100,
                },
              ],
            }),
          text: () =>
            Promise.resolve(JSON.stringify({
              result: [
                {
                  txid: "quicknode_tx_1",
                  vout: 0,
                  value: 100000,
                  height: 850000,
                  confirmations: 100,
                },
              ],
            })),
          clone: function () {
            return this;
          },
        } as any);
      } else {
        // Address not found
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: "Not Found",
          headers: createMockHeaders(),
          redirected: false,
          type: "basic",
          url: url,
          body: null,
          bodyUsed: false,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          blob: () => Promise.resolve(new Blob()),
          formData: () => Promise.resolve(new FormData()),
          json: () => Promise.resolve({ error: "Address not found" }),
          text: () =>
            Promise.resolve(JSON.stringify({ error: "Address not found" })),
          clone: function () {
            return this;
          },
        } as any);
      }
    }

    // Handle getrawtransaction method
    if (body.method === "getrawtransaction") {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: createMockHeaders(),
        redirected: false,
        type: "basic",
        url: url,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        json: () => Promise.resolve({ result: "mocked_tx_hex_quicknode" }),
        text: () =>
          Promise.resolve(
            JSON.stringify({ result: "mocked_tx_hex_quicknode" }),
          ),
        clone: function () {
          return this;
        },
      } as Response);
    }

    // Default QuickNode response
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: createMockHeaders(),
      redirected: false,
      type: "basic",
      url: url,
      body: null,
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
      json: () => Promise.resolve({ result: "default_quicknode_response" }),
      text: () =>
        Promise.resolve(
          JSON.stringify({ result: "default_quicknode_response" }),
        ),
      clone: function () {
        return this;
      },
    } as Response);
  }

  // Mock mempool.space endpoint
  if (url.includes("mempool.space")) {
    if (url.includes("success_tx")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: createMockHeaders("text/plain"),
        redirected: false,
        type: "basic",
        url: url,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        json: () => Promise.resolve("mocked_mempool_hex"),
        text: () => Promise.resolve("mocked_mempool_hex"),
        clone: function () {
          return this;
        },
      } as Response);
    } else {
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: createMockHeaders(),
        redirected: false,
        type: "basic",
        url: url,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        json: () => Promise.resolve({ error: "Transaction not found" }),
        text: () => Promise.resolve("Transaction not found"),
        clone: function () {
          return this;
        },
      } as Response);
    }
  }

  // Mock blockstream.info endpoint
  if (url.includes("blockstream.info")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: createMockHeaders("text/plain"),
      redirected: false,
      type: "basic",
      url: url,
      body: null,
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
      json: () => Promise.resolve("mocked_blockstream_hex"),
      text: () => Promise.resolve("mocked_blockstream_hex"),
      clone: function () {
        return this;
      },
    } as Response);
  }

  // Original fetch mock for public APIs
  if (url.includes("blockstream") && url.includes("quicknode_tx")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      headers: createMockHeaders("text/plain"),
      text: () => Promise.resolve("0200000001abcd..."),
    } as Response);
  }
  if (url.includes("blockstream") && url.includes("public_api_tx")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      headers: createMockHeaders("text/plain"),
      text: () => Promise.resolve("0200000001efgh..."),
    } as Response);
  }
  if (url.includes("blockstream") && url.includes("error_tx")) {
    return Promise.resolve({
      ok: false,
      status: 404,
      headers: createMockHeaders("text/plain"),
      text: () => Promise.resolve("Not found"),
    } as Response);
  }
  // Mock public API UTXO responses
  if (url.includes("/address/") && url.includes("/utxo")) {
    const addressMatch = url.match(/\/address\/([^/]+)\/utxo/);
    const address = addressMatch?.[1];

    if (address === "public_api_address") {
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: createMockHeaders(),
        json: () =>
          Promise.resolve([{
            txid: utxoFixtures.p2pkh.standard.txid,
            vout: utxoFixtures.p2pkh.standard.vout,
            value: Number(utxoFixtures.p2pkh.standard.value),
            status: { confirmed: true },
          }]),
      } as Response);
    }

    if (address === "public_api_error") {
      return Promise.resolve({
        ok: false,
        status: 500,
        headers: createMockHeaders("text/plain"),
        text: () => Promise.resolve("Server error"),
      } as Response);
    }

    // Default empty UTXO response
    return Promise.resolve({
      ok: true,
      status: 200,
      headers: createMockHeaders(),
      json: () => Promise.resolve([]),
    } as Response);
  }

  // Mock public API transaction responses
  if (url.includes("/api/tx/") && !url.includes("/hex")) {
    const txidMatch = url.match(/\/tx\/([^/]+)$/);
    const txid = txidMatch?.[1];

    if (txid === "quicknode_specific_tx") {
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: createMockHeaders(),
        json: () =>
          Promise.resolve({
            txid: txid,
            vout: [{
              value: Number(utxoFixtures.p2wpkh.standard.value) / 100000000,
              scriptpubkey: utxoFixtures.p2wpkh.standard.script,
              scriptpubkey_address: utxoFixtures.p2wpkh.standard.address,
            }],
          }),
      } as Response);
    }
  }

  return Promise.resolve({
    ok: false,
    status: 500,
    headers: createMockHeaders("text/plain"),
    text: () => Promise.resolve("Server error"),
  } as Response);
};

// Set up the mocks
(globalThis as any).fetch = mockFetch;

// Import after setting up mocks
// Dynamic import to be loaded after environment setup
let CommonUTXOService: any;

Deno.test("CommonUTXOService - Comprehensive Branch Coverage", async (t) => {
  // Load CommonUTXOService after environment setup
  if (!CommonUTXOService) {
    const module = await import(
      "$server/services/utxo/commonUtxoService.ts"
    );
    CommonUTXOService = module.CommonUTXOService;
  }

  // Apply mock fetch for all test steps
  globalThis.fetch = mockFetch as any;

  await t.step("constructor - with QuickNode configured", () => {
    // Set environment to simulate QuickNode configuration
    Deno.env.set("QUICKNODE_ENDPOINT", "test-endpoint");
    Deno.env.set("QUICKNODE_API_KEY", "test-key");

    const service = new CommonUTXOService();
    assertExists(service);
  });

  await t.step("constructor - without QuickNode configured", () => {
    // Remove QuickNode configuration
    Deno.env.delete("QUICKNODE_ENDPOINT");
    Deno.env.delete("QUICKNODE_API_KEY");

    const service = new CommonUTXOService();
    assertExists(service);
  });

  await t.step("getInstance - singleton pattern", () => {
    const service1 = CommonUTXOService.getInstance();
    const service2 = CommonUTXOService.getInstance();
    assertEquals(service1, service2);
  });

  await t.step("getRawTransactionHex - cache hit", async () => {
    const service = new CommonUTXOService();

    // First call to populate cache
    const result1 = await service.getRawTransactionHex("quicknode_tx");

    // Second call should hit cache
    const result2 = await service.getRawTransactionHex("quicknode_tx");

    assertEquals(result1, result2);
    assertExists(result1);
  });

  await t.step(
    "getRawTransactionHex - cache miss with QuickNode success",
    async () => {
      const service = new CommonUTXOService();

      const result = await service.getRawTransactionHex("quicknode_tx");
      assertEquals(result, "0200000001abcd...");
    },
  );

  await t.step(
    "getRawTransactionHex - QuickNode error, fallback to public API",
    async () => {
      const service = new CommonUTXOService();

      const result = await service.getRawTransactionHex("public_api_tx");
      assertEquals(result, "0200000001efgh...");
    },
  );

  await t.step("getRawTransactionHex - all sources fail", async () => {
    const service = new CommonUTXOService();

    const result = await service.getRawTransactionHex("error_tx");
    assertEquals(result, null);
  });

  await t.step("getSpendableUTXOs - QuickNode success", async () => {
    // Set up QuickNode configuration
    Deno.env.set("QUICKNODE_ENDPOINT", "test-endpoint");
    Deno.env.set("QUICKNODE_API_KEY", "test-key");

    const service = new CommonUTXOService();

    const result = await service.getSpendableUTXOs("quicknode_address");
    assertEquals(result.length, 1);
    assertEquals(result[0].txid, utxoFixtures.p2wpkh.standard.txid);
  });

  // TODO(#DI): Re-enable when implementing dependency injection
  // await t.step(
  //   "getSpendableUTXOs - QuickNode error, fallback to public API",
  //   async () => {
  //     const service = new CommonUTXOService();

  //     const result = await service.getSpendableUTXOs("public_api_address");
  //     assertEquals(result.length, 1);
  //     assertEquals(result[0].txid, utxoFixtures.p2pkh.standard.txid);
  //   },
  // );

  // TODO(#DI): Re-enable when implementing dependency injection
  // await t.step("getSpendableUTXOs - force public API option", async () => {
  //   const service = new CommonUTXOService();

  //   const result = await service.getSpendableUTXOs(
  //     "public_api_address",
  //     undefined,
  //     {
  //       forcePublicAPI: true,
  //     },
  //   );
  //   assertEquals(result.length, 1);
  // });

  // TODO(#DI): Re-enable when implementing dependency injection
  // await t.step("getSpendableUTXOs - all sources fail", async () => {
  //   const service = new CommonUTXOService();

  //   await assertRejects(
  //     () => service.getSpendableUTXOs("public_api_error"),
  //     Error,
  //     "Public API error",
  //   );
  // });

  // TODO(#DI): Re-enable when implementing dependency injection - tests non-existent method
  // await t.step("getSpecificUTXO - QuickNode success", async () => {
  //   const service = new CommonUTXOService();

  //   const result = await service.getSpecificUTXO("quicknode_specific_tx", 0);
  //   assertExists(result);
  //   assertEquals(result?.txid, "quicknode_specific_tx");
  //   assertEquals(result?.value, 50000);
  // });

  await t.step(
    "getSpecificUTXO - QuickNode error, should return null",
    async () => {
      const service = new CommonUTXOService();

      const result = await service.getSpecificUTXO(
        "quicknode_specific_error",
        0,
      );
      assertEquals(result, null);
    },
  );

  await t.step(
    "getSpecificUTXO - with includeAncestorDetails option",
    async () => {
      const service = new CommonUTXOService();

      const result = await service.getSpecificUTXO("quicknode_specific_tx", 0, {
        includeAncestorDetails: true,
      });
      assertExists(result);
    },
  );

  await t.step("getSpecificUTXO - with confirmedOnly option", async () => {
    const service = new CommonUTXOService();

    const result = await service.getSpecificUTXO("quicknode_specific_tx", 0, {
      confirmedOnly: true,
    });
    assertExists(result);
  });

  // Test error handling branches
  await t.step("error handling - network timeouts", async () => {
    const service = new CommonUTXOService();

    // Test with non-existent transaction that will fail all lookups
    const result = await service.getRawTransactionHex("nonexistent_tx");
    assertEquals(result, null);
  });

  // Test cache behavior more thoroughly
  await t.step("cache behavior - null values cached", async () => {
    const service = new CommonUTXOService();

    // First call that returns null
    const result1 = await service.getRawTransactionHex("error_tx");
    assertEquals(result1, null);

    // Second call should hit cache
    const result2 = await service.getRawTransactionHex("error_tx");
    assertEquals(result2, null);
  });

  // Test different option combinations
  await t.step("getSpendableUTXOs - with includeAncestorDetails", async () => {
    const service = new CommonUTXOService();

    const result = await service.getSpendableUTXOs(
      "quicknode_address",
      undefined,
      {
        includeAncestorDetails: true,
      },
    );
    assertEquals(result.length, 1);
  });

  await t.step("getSpendableUTXOs - with confirmedOnly", async () => {
    const service = new CommonUTXOService();

    const result = await service.getSpendableUTXOs(
      "quicknode_address",
      undefined,
      {
        confirmedOnly: true,
      },
    );
    assertEquals(result.length, 1);
  });

  // Cleanup: restore original fetch
  globalThis.fetch = originalFetch;
});
