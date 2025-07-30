import {
  assertEquals,
  assertExists,
  assertRejects,
  assertSpyCalls,
  assertStringIncludes,
} from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { returnsNext, stub } from "@std/testing/mock";
import { MaraSlipstreamService } from "$/server/services/mara/maraSlipstreamService.ts";
import { FetchHttpClient } from "$/server/interfaces/httpClient.ts";
import * as config from "$/server/config/config.ts";
import * as maraConfigValidator from "$/server/config/maraConfigValidator.ts";
import type {
  MaraFeeRateResponse,
  MaraSubmissionResponse,
} from "$/server/services/mara/types.ts";

describe("MaraSlipstreamService", () => {
  let httpClientStub: any;
  let getMaraConfigStub: any;
  let assertValidMaraConfigStub: any;
  let originalTimeout: number;

  beforeEach(() => {
    // Reset static properties
    (MaraSlipstreamService as any)._config = null;
    (MaraSlipstreamService as any)._httpClient = null;

    // Set a shorter timeout for tests
    originalTimeout = (globalThis as any).setTimeout;

    // Mock config
    const mockConfig = {
      enabled: true,
      apiBaseUrl: "https://api.mara.pool",
      apiTimeout: 5000,
    };

    getMaraConfigStub = stub(config, "getMaraConfig", returnsNext([mockConfig]));
    assertValidMaraConfigStub = stub(
      maraConfigValidator,
      "assertValidMaraConfig",
      returnsNext([mockConfig])
    );

    // Create HTTP client mock
    httpClientStub = {
      get: stub(),
      post: stub(),
    };

    // Override the httpClient getter
    Object.defineProperty(MaraSlipstreamService, "httpClient", {
      get: () => httpClientStub,
      configurable: true,
    });
  });

  describe("getFeeRate", () => {
    it("should fetch fee rate successfully", async () => {
      const mockResponse: MaraFeeRateResponse = {
        fee_rate: 3.0,
        block_height: 800000,
        network: "mainnet",
        min_fee_rate: 3.0,
        timestamp: Date.now(),
      };

      httpClientStub.get.returns(
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
        })
      );

      const result = await MaraSlipstreamService.getFeeRate();

      assertEquals(result.fee_rate, 3.0);
      assertEquals(result.block_height, 800000);
      assertEquals(result.network, "mainnet");
      assertExists(result.min_fee_rate);
      assertExists(result.timestamp);
      assertSpyCalls(httpClientStub.get, 1);
    });

    it("should enforce minimum fee rate", async () => {
      const mockResponse = {
        fee_rate: 0.5, // Below minimum
        block_height: 800000,
        network: "mainnet",
      };

      httpClientStub.get.returns(
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
        })
      );

      const result = await MaraSlipstreamService.getFeeRate();

      // Should enforce minimum of 1.0
      assertEquals(result.min_fee_rate, 1.0);
      assertEquals(result.fee_rate, 0.5); // Original value preserved
    });

    it("should handle API errors", async () => {
      httpClientStub.get.returns(
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          data: { error: "Server error" },
        })
      );

      await assertRejects(
        () => MaraSlipstreamService.getFeeRate(),
        Error,
        "MARA API error: 500 - Server error"
      );
    });

    it("should handle invalid response structure", async () => {
      httpClientStub.get.returns(
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: { invalid: "response" },
        })
      );

      await assertRejects(
        () => MaraSlipstreamService.getFeeRate(),
        Error,
        "Invalid response structure from MARA getinfo endpoint"
      );
    });

    it("should handle circuit breaker open state", async () => {
      // Simulate multiple failures to open circuit breaker
      httpClientStub.get.returns(
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
          await MaraSlipstreamService.getFeeRate();
        } catch {}
      }

      // Next call should fail immediately
      await assertRejects(
        () => MaraSlipstreamService.getFeeRate(),
        Error,
        "Circuit breaker is OPEN"
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

      httpClientStub.post.returns(
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
        })
      );

      const result = await MaraSlipstreamService.submitTransaction(validHex);

      assertEquals(result.status, "accepted");
      assertEquals(result.txid, mockResponse.message);
      assertExists(result.submission_time);
      assertStringIncludes(result.message || "", "accepted by MARA pool");
      assertSpyCalls(httpClientStub.post, 1);
    });

    it("should validate hex input", async () => {
      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(""),
        Error,
        "Invalid transaction hex provided"
      );

      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(null as any),
        Error,
        "Invalid transaction hex provided"
      );
    });

    it("should handle submission errors", async () => {
      httpClientStub.post.returns(
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          data: { error: "Invalid transaction" },
        })
      );

      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validHex),
        Error,
        "MARA submission error: 400 - Invalid transaction"
      );
    });

    it("should handle error response from API", async () => {
      const mockResponse = {
        message: "Transaction rejected: insufficient fee",
        status: "error",
      };

      httpClientStub.post.returns(
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
        })
      );

      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validHex),
        Error,
        "MARA submission failed: Transaction rejected: insufficient fee"
      );
    });

    it("should validate txid format in response", async () => {
      const mockResponse = {
        message: "invalid-txid", // Not 64 hex chars
        status: "success",
      };

      httpClientStub.post.returns(
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: mockResponse,
        })
      );

      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validHex),
        Error,
        "Invalid txid format from MARA"
      );
    });

    it("should handle gateway errors specially", async () => {
      httpClientStub.post.returns(
        Promise.resolve({
          ok: false,
          status: 502,
          statusText: "Bad Gateway",
          data: null,
        })
      );

      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validHex),
        Error,
        "MARA service temporarily unavailable (502)"
      );
    });

    it("should handle HTML error responses", async () => {
      httpClientStub.post.returns(
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          data: "<!DOCTYPE html><html><body>Error</body></html>",
        })
      );

      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validHex),
        Error,
        "MARA submission error: 500"
      );
    });

    it("should handle missing response fields", async () => {
      httpClientStub.post.returns(
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: { someField: "value" }, // Missing required fields
        })
      );

      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validHex),
        Error,
        "Invalid MARA response: missing required fields"
      );
    });
  });

  describe("Circuit Breaker Management", () => {
    it("should report circuit breaker metrics", () => {
      const metrics = MaraSlipstreamService.getCircuitBreakerMetrics();
      
      assertExists(metrics);
      assertExists(metrics.state);
      assertExists(metrics.failureCount);
      assertExists(metrics.successCount);
      assertExists(metrics.requestCount);
    });

    it("should reset circuit breaker", () => {
      // No error should be thrown
      MaraSlipstreamService.resetCircuitBreaker();
      
      const metrics = MaraSlipstreamService.getCircuitBreakerMetrics();
      assertEquals(metrics.failureCount, 0);
    });

    it("should check availability", () => {
      const isAvailable = MaraSlipstreamService.isAvailable();
      assertEquals(typeof isAvailable, "boolean");
    });
  });

  describe("Configuration", () => {
    it("should check if service is configured", () => {
      const isConfigured = MaraSlipstreamService.isConfigured();
      assertEquals(isConfigured, true);
    });

    it("should handle missing configuration", () => {
      getMaraConfigStub = stub(config, "getMaraConfig", returnsNext([null]));
      
      const isConfigured = MaraSlipstreamService.isConfigured();
      assertEquals(isConfigured, false);
    });

    it("should handle disabled configuration", () => {
      getMaraConfigStub = stub(
        config,
        "getMaraConfig",
        returnsNext([{ enabled: false }])
      );
      
      const isConfigured = MaraSlipstreamService.isConfigured();
      assertEquals(isConfigured, false);
    });

    it("should get configuration", () => {
      const config = MaraSlipstreamService.getConfiguration();
      assertExists(config);
      assertEquals(config.enabled, true);
      assertEquals(config.apiBaseUrl, "https://api.mara.pool");
    });

    it("should handle configuration errors gracefully", () => {
      assertValidMaraConfigStub = stub(
        maraConfigValidator,
        "assertValidMaraConfig",
        () => {
          throw new Error("Invalid config");
        }
      );
      
      const config = MaraSlipstreamService.getConfiguration();
      assertEquals(config, null);
    });
  });
});