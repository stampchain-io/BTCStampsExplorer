import {
  assertEquals,
  assertExists,
  assertRejects,
  assertStringIncludes,
} from "@std/assert";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "jsr:@std/testing@1.0.14/bdd";
import { assertSpyCalls, spy } from "@std/testing@1.0.14/mock";
import { MaraSlipstreamService } from "$/server/services/mara/maraSlipstreamService.ts";
import type {
  MaraFeeRateResponse,
  MaraSubmissionResponse,
} from "$/server/services/mara/types.ts";

// Mock fixture for API responses
const createMockFeeRateResponse = (
  overrides?: Partial<MaraFeeRateResponse>,
): MaraFeeRateResponse => ({
  fee_rate: 3.0,
  block_height: 800000,
  network: "mainnet",
  min_fee_rate: 3.0,
  timestamp: Date.now(),
  ...overrides,
});

const createMockSubmissionResponse = (
  overrides?: Partial<MaraSubmissionResponse>,
): MaraSubmissionResponse => ({
  status: "accepted",
  txid: "a".repeat(64),
  submission_time: Date.now(),
  message: "Transaction accepted by MARA pool",
  ...overrides,
});

// Create a test wrapper class that extends MaraSlipstreamService
// This allows us to properly test without dealing with static method stubbing issues
class TestableMaraSlipstreamService extends MaraSlipstreamService {
  static _testConfig: any = undefined;
  static _testHttpClient: any = null;

  static get config() {
    // If _testConfig is explicitly set to null, return null
    if (this._testConfig === null) {
      return null;
    }
    // Otherwise return the test config or default
    return this._testConfig || {
      enabled: true,
      apiBaseUrl: "https://api.mara.pool",
      apiTimeout: 5000,
    };
  }

  static get httpClient() {
    return this._testHttpClient;
  }

  // Override isConfigured to use our test config
  static isConfigured(): boolean {
    const config = this.config;
    return config !== null && config.enabled;
  }
}

describe("MaraSlipstreamService", () => {
  let httpClientStub: any;
  let service: typeof TestableMaraSlipstreamService;

  beforeEach(() => {
    // Use the testable service
    service = TestableMaraSlipstreamService;

    // Reset static properties
    (service as any)._config = null;
    (service as any)._httpClient = null;
    service._testConfig = {
      enabled: true,
      apiBaseUrl: "https://api.mara.pool",
      apiTimeout: 5000,
    };

    // Create HTTP client mock
    httpClientStub = {
      get: spy(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: createMockFeeRateResponse(),
        })
      ),
      post: spy(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: createMockSubmissionResponse(),
        })
      ),
    };

    // Set the test HTTP client
    service._testHttpClient = httpClientStub;
  });

  // Clean up after each test
  afterEach(() => {
    // Reset the circuit breaker between tests
    service.resetCircuitBreaker();

    // Reset static properties
    (service as any)._config = null;
    (service as any)._httpClient = null;
    service._testConfig = null;
    service._testHttpClient = null;
  });

  describe("getFeeRate", () => {
    it("should fetch fee rate successfully", async () => {
      const mockResponse = createMockFeeRateResponse();

      httpClientStub.get = spy(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
        })
      );

      const result = await service.getFeeRate();

      assertEquals(result.fee_rate, 3.0);
      assertEquals(result.block_height, 800000);
      assertEquals(result.network, "mainnet");
      assertExists(result.min_fee_rate);
      assertExists(result.timestamp);
      assertSpyCalls(httpClientStub.get, 1);
    });

    it("should enforce minimum fee rate", async () => {
      const mockResponse = createMockFeeRateResponse({
        fee_rate: 0.5, // Below minimum
      });

      httpClientStub.get = spy(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
        })
      );

      const result = await service.getFeeRate();

      // Should enforce minimum of 1.0
      assertEquals(result.min_fee_rate, 1.0);
      assertEquals(result.fee_rate, 0.5); // Original value preserved
    });

    it("should handle API errors", async () => {
      httpClientStub.get = spy(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          data: { error: "Server error" },
        })
      );

      await assertRejects(
        () => service.getFeeRate(),
        Error,
        "MARA API error: 500 - Server error",
      );
    });

    it("should handle invalid response structure", async () => {
      httpClientStub.get = spy(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: { invalid: "response" },
        })
      );

      await assertRejects(
        () => service.getFeeRate(),
        Error,
        "Invalid response structure from MARA getinfo endpoint",
      );
    });

    it("should handle circuit breaker open state", async () => {
      // Simulate multiple failures to open circuit breaker
      httpClientStub.get = spy(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Error",
          data: null,
        })
      );

      // Cause failures to open circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await service.getFeeRate();
        } catch {}
      }

      // Next call should fail immediately
      await assertRejects(
        () => service.getFeeRate(),
        Error,
        "Circuit breaker is OPEN",
      );
    });
  });

  describe("submitTransaction", () => {
    const validHex = "0200000001" + "a".repeat(100); // Mock transaction hex

    it("should submit transaction successfully", async () => {
      const mockResponse = {
        message: "a".repeat(64), // 64 char txid
        status: "success",
      };

      httpClientStub.post = spy(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
        })
      );

      const result = await service.submitTransaction(validHex);

      assertEquals(result.status, "accepted");
      assertEquals(result.txid, mockResponse.message);
      assertExists(result.submission_time);
      assertStringIncludes(result.message || "", "accepted by MARA pool");
      assertSpyCalls(httpClientStub.post, 1);
    });

    it("should validate hex input", async () => {
      await assertRejects(
        () => service.submitTransaction(""),
        Error,
        "Invalid transaction hex provided",
      );

      await assertRejects(
        () => service.submitTransaction(null as any),
        Error,
        "Invalid transaction hex provided",
      );
    });

    it("should handle submission errors", async () => {
      httpClientStub.post = spy(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          data: { error: "Invalid transaction" },
        })
      );

      await assertRejects(
        () => service.submitTransaction(validHex),
        Error,
        "MARA submission error: 400 - Invalid transaction",
      );
    });

    it("should handle error response from API", async () => {
      const mockResponse = {
        message: "Transaction rejected: insufficient fee",
        status: "error",
      };

      httpClientStub.post = spy(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
        })
      );

      await assertRejects(
        () => service.submitTransaction(validHex),
        Error,
        "MARA submission failed: Transaction rejected: insufficient fee",
      );
    });

    it("should validate txid format in response", async () => {
      const mockResponse = {
        message: "invalid-txid", // Not 64 hex chars
        status: "success",
      };

      httpClientStub.post = spy(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
        })
      );

      await assertRejects(
        () => service.submitTransaction(validHex),
        Error,
        "Invalid txid format from MARA",
      );
    });

    it("should handle gateway errors specially", async () => {
      httpClientStub.post = spy(() =>
        Promise.resolve({
          ok: false,
          status: 502,
          statusText: "Bad Gateway",
          data: null,
        })
      );

      await assertRejects(
        () => service.submitTransaction(validHex),
        Error,
        "MARA service temporarily unavailable (502)",
      );
    });

    it("should handle HTML error responses", async () => {
      httpClientStub.post = spy(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          data: "<!DOCTYPE html><html><body>Error</body></html>",
        })
      );

      await assertRejects(
        () => service.submitTransaction(validHex),
        Error,
        "MARA submission error: 500",
      );
    });

    it("should handle missing response fields", async () => {
      httpClientStub.post = spy(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: { someField: "value" }, // Missing required fields
        })
      );

      await assertRejects(
        () => service.submitTransaction(validHex),
        Error,
        "Invalid MARA response: missing required fields",
      );
    });
  });

  describe("Circuit Breaker Management", () => {
    it("should report circuit breaker metrics", () => {
      const metrics = service.getCircuitBreakerMetrics();

      assertExists(metrics);
      assertExists(metrics.state);
      assertExists(metrics.failureCount);
      assertExists(metrics.successCount);
      assertExists(metrics.requestCount);
    });

    it("should reset circuit breaker", () => {
      // No error should be thrown
      service.resetCircuitBreaker();

      const metrics = service.getCircuitBreakerMetrics();
      assertEquals(metrics.failureCount, 0);
    });

    it("should check availability", () => {
      const isAvailable = service.isAvailable();
      assertEquals(typeof isAvailable, "boolean");
    });
  });

  describe("Configuration", () => {
    it("should check if service is configured", () => {
      // Service should be configured with our mock config
      const isConfigured = service.isConfigured();
      assertEquals(isConfigured, true);
    });

    it("should handle missing configuration", () => {
      // Override config to return null
      service._testConfig = null;

      const isConfigured = service.isConfigured();
      assertEquals(isConfigured, false);
    });

    it("should handle disabled configuration", () => {
      // Override config to return disabled
      service._testConfig = { enabled: false };

      const isConfigured = service.isConfigured();
      assertEquals(isConfigured, false);
    });

    it("should get configuration", () => {
      const config = service.getConfiguration();
      assertExists(config);
      assertEquals(config.enabled, true);
      assertEquals(config.apiBaseUrl, "https://api.mara.pool");
    });

    it("should handle configuration errors gracefully", () => {
      // Create a getter that throws
      Object.defineProperty(service, "config", {
        get: () => {
          throw new Error("Invalid config");
        },
        configurable: true,
      });

      const config = service.getConfiguration();
      assertEquals(config, null);
    });
  });
});
