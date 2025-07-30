import {
  assertEquals,
  assertExists,
  assertRejects,
  assertStringIncludes,
} from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { stub, spy } from "@std/testing/mock";
import { assertSpyCalls } from "@std/testing/mock";
import { MaraSlipstreamService } from "$/server/services/mara/maraSlipstreamService.ts";
import { 
  maraServiceFixtures,
  createMockMaraHttpClient,
  createMockCircuitBreaker 
} from "../fixtures/maraServiceFixtures.ts";
import type {
  MaraFeeRateResponse,
  MaraSubmissionResponse,
} from "$/server/services/mara/types.ts";

describe("MaraSlipstreamService", () => {
  let httpClientStub: ReturnType<typeof createMockMaraHttpClient>;
  let circuitBreakerStub: ReturnType<typeof createMockCircuitBreaker>;

  beforeEach(() => {
    // Reset static properties
    (MaraSlipstreamService as any)._config = null;
    (MaraSlipstreamService as any)._httpClient = null;

    // Mock config by setting the private _config directly
    const mockConfig = {
      enabled: true,
      apiBaseUrl: "https://api.mara.pool",
      apiTimeout: 5000,
    };
    (MaraSlipstreamService as any)._config = mockConfig;

    // Create HTTP client mock
    httpClientStub = createMockMaraHttpClient();
    (MaraSlipstreamService as any)._httpClient = httpClientStub;

    // Create circuit breaker mock
    circuitBreakerStub = createMockCircuitBreaker();
    (MaraSlipstreamService as any).circuitBreaker = circuitBreakerStub;
  });

  afterEach(() => {
    // Reset static properties
    (MaraSlipstreamService as any)._config = null;
    (MaraSlipstreamService as any)._httpClient = null;
    (MaraSlipstreamService as any).circuitBreaker = null;
  });

  describe("getFeeRate", () => {
    it("should fetch fee rate successfully", async () => {
      // Mock http client to return success response
      httpClientStub.get = spy(() => 
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: maraServiceFixtures.feeRateResponses.standard,
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
      httpClientStub.get = spy(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: maraServiceFixtures.feeRateResponses.belowMinimum,
        })
      );

      const result = await MaraSlipstreamService.getFeeRate();

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
          data: maraServiceFixtures.errorResponses.serverError,
        })
      );

      await assertRejects(
        () => MaraSlipstreamService.getFeeRate(),
        Error,
        "MARA API error: 500 - Server error"
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
        () => MaraSlipstreamService.getFeeRate(),
        Error,
        "Invalid response structure from MARA getinfo endpoint"
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
          await MaraSlipstreamService.getFeeRate();
        } catch {}
      }

      // Configure circuit breaker to be open
      circuitBreakerStub.isOpen = spy(() => true);
      circuitBreakerStub.execute = spy(async () => {
        throw new Error("Circuit breaker is OPEN");
      });

      // Next call should fail immediately
      await assertRejects(
        () => MaraSlipstreamService.getFeeRate(),
        Error,
        "Circuit breaker is OPEN"
      );
    });
  });

  describe("submitTransaction", () => {
    const validHex = maraServiceFixtures.validTransactionHex;

    it("should submit transaction successfully", async () => {
      httpClientStub.post = spy(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: maraServiceFixtures.submissionResponses.success,
        })
      );

      const result = await MaraSlipstreamService.submitTransaction(validHex);

      assertEquals(result.status, "accepted");
      assertEquals(result.txid, maraServiceFixtures.submissionResponses.success.message);
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
      httpClientStub.post = spy(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          data: maraServiceFixtures.errorResponses.invalidTransaction,
        })
      );

      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validHex),
        Error,
        "MARA submission error: 400 - Invalid transaction"
      );
    });

    it("should handle error response from API", async () => {
      httpClientStub.post = spy(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: maraServiceFixtures.submissionResponses.error,
        })
      );

      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validHex),
        Error,
        "MARA submission failed: Transaction rejected: insufficient fee"
      );
    });

    it("should validate txid format in response", async () => {
      httpClientStub.post = spy(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          data: maraServiceFixtures.submissionResponses.invalidTxid,
        })
      );

      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validHex),
        Error,
        "Invalid txid format from MARA"
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
        () => MaraSlipstreamService.submitTransaction(validHex),
        Error,
        "MARA service temporarily unavailable (502)"
      );
    });

    it("should handle HTML error responses", async () => {
      httpClientStub.post = spy(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          data: maraServiceFixtures.errorResponses.htmlError,
        })
      );

      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validHex),
        Error,
        "MARA submission error: 500"
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
      // Reset config to simulate missing configuration
      (MaraSlipstreamService as any)._config = null;
      
      const isConfigured = MaraSlipstreamService.isConfigured();
      assertEquals(isConfigured, false);
    });

    it("should handle disabled configuration", () => {
      // Set config to disabled
      (MaraSlipstreamService as any)._config = { enabled: false };
      
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
      // Set an invalid config to test error handling
      (MaraSlipstreamService as any)._config = "invalid";
      
      const config = MaraSlipstreamService.getConfiguration();
      // The service should handle this gracefully
      assertExists(config);
    });
  });
});