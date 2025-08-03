/**
 * @fileoverview Comprehensive tests for Dependency-Injected QuicknodeService
 * Tests all RPC methods, retry logic, fallback mechanisms, and error scenarios
 */

import { assertEquals, assertExists } from "@std/assert";
import { beforeEach, describe, it } from "jsr:@std/testing@1.0.14/bdd";

// Set test environment
(globalThis as any).SKIP_REDIS_CONNECTION = true;
Deno.env.set("SKIP_REDIS_CONNECTION", "true");
Deno.env.set("DENO_ENV", "test");

import {
  MockQuicknodeProvider,
  type QuicknodeConfig,
  type QuicknodeRPCResponse,
  type QuicknodeServiceDependencies,
  QuicknodeServiceDI,
} from "$server/services/quicknode/quicknodeServiceDI.ts";
import type {
  HttpClient,
  HttpResponse,
} from "$server/interfaces/httpClient.ts";

// Mock HTTP Client
class MockHttpClient implements HttpClient {
  private mockResponses = new Map<string, HttpResponse<any>>();
  private shouldFail = false;
  private failureCount = 0;
  private maxFailures = 0;

  setMockResponse(url: string, response: HttpResponse<any>): void {
    this.mockResponses.set(url, response);
  }

  setShouldFail(shouldFail: boolean, maxFailures = 0): void {
    this.shouldFail = shouldFail;
    this.failureCount = 0;
    this.maxFailures = maxFailures;
  }

  clearMockResponses(): void {
    this.mockResponses.clear();
  }

  async get<T = any>(url: string, _config?: any): Promise<HttpResponse<T>> {
    await Promise.resolve(); // Simulate async operation

    if (this.shouldFail && this.failureCount < this.maxFailures) {
      this.failureCount++;
      throw new Error(
        `Mock HTTP client configured to fail (${this.failureCount}/${this.maxFailures})`,
      );
    }

    const mockResponse = this.mockResponses.get(url);
    if (mockResponse) {
      return mockResponse as HttpResponse<T>;
    }

    // Default successful response for GET requests
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      data: `mock_data_for_${url}` as T,
      headers: {},
    };
  }

  async post<T = any>(
    url: string,
    _data?: any,
    _config?: any,
  ): Promise<HttpResponse<T>> {
    await Promise.resolve(); // Simulate async operation

    if (this.shouldFail && this.failureCount < this.maxFailures) {
      this.failureCount++;
      throw new Error(
        `Mock HTTP client configured to fail (${this.failureCount}/${this.maxFailures})`,
      );
    }

    // Extract method from request body for specific responses
    const method = _data?.method;
    const key = `${url}:${method}`;

    const mockResponse = this.mockResponses.get(key) ||
      this.mockResponses.get(url);
    if (mockResponse) {
      return mockResponse as HttpResponse<T>;
    }

    // Default successful RPC response
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      data: {
        id: 1,
        jsonrpc: "2.0",
        result: `mock_result_for_${method || "unknown"}`,
      } as T,
      headers: {},
    };
  }

  async put<T = any>(): Promise<HttpResponse<T>> {
    await Promise.resolve();
    throw new Error("PUT not implemented in mock");
  }

  async delete<T = any>(): Promise<HttpResponse<T>> {
    await Promise.resolve();
    throw new Error("DELETE not implemented in mock");
  }

  async request<T = any>(): Promise<HttpResponse<T>> {
    await Promise.resolve();
    throw new Error("Generic request not implemented in mock");
  }
}

describe("QuicknodeServiceDI", () => {
  let mockHttpClient: MockHttpClient;
  let config: QuicknodeConfig;
  let dependencies: QuicknodeServiceDependencies;
  let quicknodeService: QuicknodeServiceDI;

  beforeEach(() => {
    mockHttpClient = new MockHttpClient();
    config = {
      endpoint: "test-endpoint.btc.quiknode.pro",
      apiKey: "test-api-key",
      fallbackApiUrl: "https://blockchain.info/api",
      maxRetries: 3,
      retryDelay: 100, // Faster for tests
      requestTimeout: 5000,
    };
    dependencies = {
      httpClient: mockHttpClient,
      config,
    };

    quicknodeService = new QuicknodeServiceDI(dependencies);
  });

  describe("Initialization and Configuration", () => {
    it("should initialize with valid configuration", () => {
      const serviceConfig = quicknodeService.getConfig();
      assertEquals(serviceConfig.endpoint, "test-endpoint.btc.quiknode.pro");
      assertEquals(serviceConfig.maxRetries, 3);
      assertEquals(serviceConfig.retryDelay, 100);
      // API key should not be included in getConfig
      assertEquals("apiKey" in serviceConfig, false);
    });

    it("should throw error with missing endpoint", () => {
      const invalidConfig = { ...config, endpoint: "" };
      try {
        new QuicknodeServiceDI({ ...dependencies, config: invalidConfig });
        assertEquals(true, false, "Should have thrown an error");
      } catch (error) {
        assertEquals((error as Error).message.includes("missing"), true);
      }
    });

    it("should throw error with missing API key", () => {
      const invalidConfig = { ...config, apiKey: "" };
      try {
        new QuicknodeServiceDI({ ...dependencies, config: invalidConfig });
        assertEquals(true, false, "Should have thrown an error");
      } catch (error) {
        assertEquals((error as Error).message.includes("missing"), true);
      }
    });
  });

  describe("RPC Execution", () => {
    it("should execute successful RPC call", async () => {
      const mockResponse: QuicknodeRPCResponse<string> = {
        id: 1,
        jsonrpc: "2.0",
        result: "test_result",
      };

      mockHttpClient.setMockResponse(
        "https://test-endpoint.btc.quiknode.pro/test-api-key:validateaddress",
        {
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
          headers: {},
        },
      );

      const result = await quicknodeService.executeRPC<string>(
        "validateaddress",
        ["test_address"],
      );
      assertEquals(result.result, "test_result");
      assertEquals(result.id, 1);
      assertEquals(result.jsonrpc, "2.0");
    });

    it("should handle RPC error responses", async () => {
      const errorResponse: QuicknodeRPCResponse = {
        id: 1,
        jsonrpc: "2.0",
        error: {
          code: -32602,
          message: "Invalid params",
        },
      };

      mockHttpClient.setMockResponse(
        "https://test-endpoint.btc.quiknode.pro/test-api-key:invalidmethod",
        {
          ok: true,
          status: 200,
          statusText: "OK",
          data: errorResponse,
          headers: {},
        },
      );

      try {
        await quicknodeService.executeRPC("invalidmethod", []);
        assertEquals(true, false, "Should have thrown an error");
      } catch (error) {
        assertEquals((error as Error).message.includes("Invalid params"), true);
      }
    });

    it("should retry on HTTP errors", async () => {
      mockHttpClient.setShouldFail(true, 2); // Fail first 2 attempts

      // Set success response for the final attempt
      mockHttpClient.setMockResponse(
        "https://test-endpoint.btc.quiknode.pro/test-api-key:getinfo",
        {
          ok: true,
          status: 200,
          statusText: "OK",
          data: {
            id: 1,
            jsonrpc: "2.0",
            result: "success_after_retries",
          },
          headers: {},
        },
      );

      const result = await quicknodeService.executeRPC("getinfo", []);
      assertEquals(result.result, "success_after_retries");
    });

    it("should fail after max retries", async () => {
      mockHttpClient.setShouldFail(true, 10); // More failures than max retries

      try {
        await quicknodeService.executeRPC("failingmethod", []);
        assertEquals(true, false, "Should have thrown an error");
      } catch (error) {
        assertEquals(
          (error as Error).message.includes("configured to fail"),
          true,
        );
      }
    });
  });

  describe("Address Validation", () => {
    it("should get public key from address", async () => {
      const mockResponse = {
        id: 1,
        jsonrpc: "2.0",
        result: {
          scriptPubKey: "mock_script_pub_key",
        },
      };

      mockHttpClient.setMockResponse(
        "https://test-endpoint.btc.quiknode.pro/test-api-key:validateaddress",
        {
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
          headers: {},
        },
      );

      const result = await quicknodeService.getPublicKeyFromAddress(
        "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      );
      assertEquals(result, "mock_script_pub_key");
    });

    it("should handle address validation errors", async () => {
      mockHttpClient.setShouldFail(true, 10);

      try {
        await quicknodeService.getPublicKeyFromAddress("invalid_address");
        assertEquals(true, false, "Should have thrown an error");
      } catch (error) {
        assertEquals(
          (error as Error).message.includes("configured to fail"),
          true,
        );
      }
    });
  });

  describe("Transaction Operations", () => {
    it("should get raw transaction", async () => {
      const mockResponse = {
        id: 1,
        jsonrpc: "2.0",
        result: "mock_raw_transaction_hex",
      };

      mockHttpClient.setMockResponse(
        "https://test-endpoint.btc.quiknode.pro/test-api-key:getrawtransaction",
        {
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
          headers: {},
        },
      );

      const result = await quicknodeService.getRawTx("mock_txid");
      assertEquals(result, "mock_raw_transaction_hex");
    });

    it("should fallback to external API when QuickNode fails", async () => {
      // Make QuickNode RPC fail
      mockHttpClient.setMockResponse(
        "https://test-endpoint.btc.quiknode.pro/test-api-key:getrawtransaction",
        {
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          data: null,
          headers: {},
        },
      );

      // Set fallback API response
      mockHttpClient.setMockResponse(
        "https://blockchain.info/api/rawtx/mock_txid?format=hex",
        {
          ok: true,
          status: 200,
          statusText: "OK",
          data: "fallback_raw_transaction_hex",
          headers: {},
        },
      );

      const result = await quicknodeService.getRawTx("mock_txid");
      assertEquals(result, "fallback_raw_transaction_hex");
    });

    it("should get decoded transaction", async () => {
      const mockResponse = {
        id: 1,
        jsonrpc: "2.0",
        result: {
          txid: "mock_txid",
          version: 1,
          inputs: [],
          outputs: [],
        },
      };

      mockHttpClient.setMockResponse(
        "https://test-endpoint.btc.quiknode.pro/test-api-key:decoderawtransaction",
        {
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
          headers: {},
        },
      );

      const result = await quicknodeService.getDecodedTx("mock_hex");
      assertEquals(result.txid, "mock_txid");
      assertEquals(result.version, 1);
    });

    it("should get complete transaction data", async () => {
      // Mock raw transaction response
      mockHttpClient.setMockResponse(
        "https://test-endpoint.btc.quiknode.pro/test-api-key:getrawtransaction",
        {
          ok: true,
          status: 200,
          statusText: "OK",
          data: {
            id: 1,
            jsonrpc: "2.0",
            result: "mock_raw_hex",
          },
          headers: {},
        },
      );

      // Mock decoded transaction response
      mockHttpClient.setMockResponse(
        "https://test-endpoint.btc.quiknode.pro/test-api-key:decoderawtransaction",
        {
          ok: true,
          status: 200,
          statusText: "OK",
          data: {
            id: 1,
            jsonrpc: "2.0",
            result: {
              txid: "mock_txid",
              version: 1,
            },
          },
          headers: {},
        },
      );

      const result = await quicknodeService.getTransaction("mock_txid");
      assertEquals(result.txid, "mock_txid");
      assertEquals(result.version, 1);
      assertEquals(result.hex, "mock_raw_hex");
    });
  });

  describe("Fee Estimation", () => {
    it("should estimate smart fee", async () => {
      const mockResponse = {
        id: 1,
        jsonrpc: "2.0",
        result: {
          feerate: 0.00001, // 0.00001 BTC/kB
          blocks: 6,
        },
      };

      mockHttpClient.setMockResponse(
        "https://test-endpoint.btc.quiknode.pro/test-api-key:estimatesmartfee",
        {
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
          headers: {},
        },
      );

      const result = await quicknodeService.estimateSmartFee(6, "economical");
      assertExists(result);
      assertEquals(result!.feeRateSatsPerVB, 1); // Minimum 1 sat/vB
      assertEquals(result!.blocks, 6);
      assertEquals(result!.source, "quicknode");
      assertEquals(result!.confidence, "medium");
    });

    it("should handle fee estimation with higher rates", async () => {
      const mockResponse = {
        id: 1,
        jsonrpc: "2.0",
        result: {
          feerate: 0.0001, // 0.0001 BTC/kB = 10 sats/vB
          blocks: 2,
        },
      };

      mockHttpClient.setMockResponse(
        "https://test-endpoint.btc.quiknode.pro/test-api-key:estimatesmartfee",
        {
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
          headers: {},
        },
      );

      const result = await quicknodeService.estimateSmartFee(2, "conservative");
      assertExists(result);
      assertEquals(result!.feeRateSatsPerVB, 10);
      assertEquals(result!.confidence, "high"); // confTarget <= 2
    });

    it("should handle fee estimation errors", async () => {
      const mockResponse = {
        id: 1,
        jsonrpc: "2.0",
        result: {
          errors: ["Insufficient data"],
        },
      };

      mockHttpClient.setMockResponse(
        "https://test-endpoint.btc.quiknode.pro/test-api-key:estimatesmartfee",
        {
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
          headers: {},
        },
      );

      const result = await quicknodeService.estimateSmartFee(1);
      assertEquals(result, null);
    });

    it("should get multiple fee estimates", async () => {
      // Mock fast fee (1 block, conservative)
      mockHttpClient.setMockResponse(
        "https://test-endpoint.btc.quiknode.pro/test-api-key:estimatesmartfee",
        {
          ok: true,
          status: 200,
          statusText: "OK",
          data: {
            id: 1,
            jsonrpc: "2.0",
            result: { feerate: 0.0002, blocks: 1 }, // 20 sats/vB
          },
          headers: {},
        },
      );

      const estimates = await quicknodeService.getMultipleFeeEstimates();

      assertExists(estimates.fast);
      assertExists(estimates.normal);
      assertExists(estimates.economy);

      assertEquals(estimates.fast!.confidence, "high");
      assertEquals(estimates.normal!.confidence, "medium");
      assertEquals(estimates.economy!.confidence, "low");
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle HTTP client errors gracefully", async () => {
      mockHttpClient.setShouldFail(true, 10);

      try {
        await quicknodeService.executeRPC("testmethod", []);
        assertEquals(true, false, "Should have thrown an error");
      } catch (error) {
        assertEquals(
          (error as Error).message.includes("configured to fail"),
          true,
        );
      }
    });

    it("should handle fallback API failures", async () => {
      // Make QuickNode fail
      mockHttpClient.setMockResponse(
        "https://test-endpoint.btc.quiknode.pro/test-api-key:getrawtransaction",
        {
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          data: null,
          headers: {},
        },
      );

      // Make fallback fail too
      mockHttpClient.setMockResponse(
        "https://blockchain.info/api/rawtx/mock_txid?format=hex",
        {
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          data: null,
          headers: {},
        },
      );

      try {
        await quicknodeService.getRawTx("mock_txid");
        assertEquals(true, false, "Should have thrown an error");
      } catch (error) {
        assertEquals(
          (error as Error).message.includes("Unable to retrieve"),
          true,
        );
      }
    });

    it("should handle invalid fee estimation responses", async () => {
      const mockResponse = {
        id: 1,
        jsonrpc: "2.0",
        result: {
          feerate: -1, // Invalid negative fee rate
          blocks: 6,
        },
      };

      mockHttpClient.setMockResponse(
        "https://test-endpoint.btc.quiknode.pro/test-api-key:estimatesmartfee",
        {
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
          headers: {},
        },
      );

      const result = await quicknodeService.estimateSmartFee(6);
      assertEquals(result, null);
    });

    it("should handle custom retry configuration", async () => {
      const customConfig = { ...config, maxRetries: 1, retryDelay: 50 };
      const customService = new QuicknodeServiceDI({
        ...dependencies,
        config: customConfig,
      });

      mockHttpClient.setShouldFail(true, 5); // More failures than max retries

      try {
        await customService.executeRPC("testmethod", [], 1);
        assertEquals(true, false, "Should have thrown an error");
      } catch (error) {
        assertEquals(
          (error as Error).message.includes("configured to fail"),
          true,
        );
      }
    });
  });
});

describe("MockQuicknodeProvider", () => {
  let mockProvider: MockQuicknodeProvider;

  beforeEach(() => {
    mockProvider = new MockQuicknodeProvider();
  });

  it("should return configured mock responses", async () => {
    const mockResponse = {
      id: 1,
      jsonrpc: "2.0",
      result: "custom_mock_response",
    };

    mockProvider.setMockResponse("testmethod", ["param1"], mockResponse);

    const result = await mockProvider.executeRPC("testmethod", ["param1"]);
    assertEquals(result.result, "custom_mock_response");
  });

  it("should return default mock responses", async () => {
    const result = await mockProvider.executeRPC("unknownmethod", []);
    assertEquals(result.jsonrpc, "2.0");
    assertEquals(result.id, 1);
    assertExists(result.result);
  });

  it("should fail when configured to fail", async () => {
    mockProvider.setShouldFail(true, 2);

    try {
      await mockProvider.executeRPC("testmethod", []);
      assertEquals(true, false, "Should have thrown an error");
    } catch (error) {
      assertEquals(
        (error as Error).message.includes("configured to fail"),
        true,
      );
    }
  });

  it("should provide fee estimation functionality", async () => {
    const estimate = await mockProvider.estimateSmartFee(6, "economical");
    assertExists(estimate);
    assertEquals(estimate!.source, "quicknode");
    assertEquals(estimate!.blocks, 6);
    assertEquals(estimate!.confidence, "medium");
    assertEquals(estimate!.feeRateSatsPerVB > 0, true);
  });

  it("should provide multiple fee estimates", async () => {
    const estimates = await mockProvider.getMultipleFeeEstimates();

    assertExists(estimates.fast);
    assertExists(estimates.normal);
    assertExists(estimates.economy);

    assertEquals(estimates.fast!.confidence, "high");
    assertEquals(estimates.normal!.confidence, "medium");
    assertEquals(estimates.economy!.confidence, "low");
  });

  it("should handle transaction operations", async () => {
    const address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
    const txHash = "mock_transaction_hash";
    const txHex = "mock_transaction_hex";

    const pubKey = await mockProvider.getPublicKeyFromAddress(address);
    assertEquals(pubKey, `mock_script_${address}`);

    const rawTx = await mockProvider.getRawTx(txHash);
    assertEquals(rawTx, `mock_raw_tx_${txHash}`);

    const decodedTx = await mockProvider.getDecodedTx(txHex);
    assertEquals(decodedTx.mock, true);
    assertEquals(decodedTx.txHex, txHex);

    const fullTx = await mockProvider.getTransaction(txHash);
    assertEquals(fullTx.hex, `mock_raw_tx_${txHash}`);
    assertExists(fullTx.mock);
  });
});
