/**
 * Comprehensive Unit Tests for MARA Slipstream Service
 *
 * Tests slipstream protocol integration, network communication, data streaming,
 * circuit breaker functionality, and error handling scenarios.
 */

import { logger } from "$lib/utils/logger.ts";
import * as configModule from "$server/config/config.ts";
import * as validatorModule from "$server/config/maraConfigValidator.ts";
import { FetchHttpClient } from "$server/interfaces/httpClient.ts";
import { MaraSlipstreamService } from "$server/services/mara/maraSlipstreamService.ts";
import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { FakeTime } from "@std/testing/time";
import { restore, stub } from "@std/testing@1.0.14/mock";

// Mock configuration for testing
const mockMaraConfig = {
  enabled: true,
  apiBaseUrl: "https://test-slipstream.mara.com/rest-api",
  apiTimeout: 30000,
  serviceFeeAddress: "bc1qtest",
  serviceFeeSats: 42000,
  clientCode: "test-client"
};

const validFeeRateResponse = {
  fee_rate: 3.0,
  block_height: 800000,
  network: "mainnet"
};

const validSubmissionResponse = {
  message: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  status: "success"
};

Deno.test("MaraSlipstreamService - Configuration", async (t) => {
  await t.step("should get configuration successfully", () => {
    const getMaraConfigStub = stub(configModule, "getMaraConfig", () => mockMaraConfig);
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);

    try {
      const config = MaraSlipstreamService.getConfiguration();
      assertEquals(config, mockMaraConfig);
    } finally {
      restore();
    }
  });

  await t.step("should return null when configuration fails", () => {
    const getMaraConfigStub = stub(configModule, "getMaraConfig", () => {
      throw new Error("Configuration error");
    });

    try {
      const config = MaraSlipstreamService.getConfiguration();
      assertEquals(config, null);
    } finally {
      restore();
    }
  });

  await t.step("should check if service is configured", () => {
    const getMaraConfigStub = stub(configModule, "getMaraConfig", () => mockMaraConfig);

    try {
      const isConfigured = MaraSlipstreamService.isConfigured();
      assertEquals(isConfigured, true);
    } finally {
      restore();
    }
  });

  await t.step("should return false when MARA is disabled", () => {
    const getMaraConfigStub = stub(configModule, "getMaraConfig", () => ({
      ...mockMaraConfig,
      enabled: false
    }));

    try {
      const isConfigured = MaraSlipstreamService.isConfigured();
      assertEquals(isConfigured, false);
    } finally {
      restore();
    }
  });

  await t.step("should return false when configuration throws", () => {
    const getMaraConfigStub = stub(configModule, "getMaraConfig", () => {
      throw new Error("Config error");
    });

    try {
      const isConfigured = MaraSlipstreamService.isConfigured();
      assertEquals(isConfigured, false);
    } finally {
      restore();
    }
  });
});

Deno.test("MaraSlipstreamService - Fee Rate Fetching", async (t) => {
  await t.step("should fetch fee rate successfully", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const mockHttpClient = {
      get: stub().resolves({
        ok: true,
        status: 200,
        statusText: "OK",
        data: validFeeRateResponse
      })
    };
    const httpClientStub = stub(FetchHttpClient.prototype, "constructor" as any, () => {});
    const getStub = stub(FetchHttpClient.prototype, "get", mockHttpClient.get);

    try {
      const response = await MaraSlipstreamService.getFeeRate();

      assertExists(response);
      assertEquals(response.fee_rate, 3.0);
      assertEquals(response.block_height, 800000);
      assertEquals(response.network, "mainnet");
      assertEquals(response.min_fee_rate, Math.max(3.0, 1.0));
      assertExists(response.timestamp);
    } finally {
      restore();
    }
  });

  await t.step("should handle API error responses", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const mockHttpClient = {
      get: stub().resolves({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        data: { error: "API temporarily unavailable" }
      })
    };
    const getStub = stub(FetchHttpClient.prototype, "get", mockHttpClient.get);

    try {
      await assertRejects(
        () => MaraSlipstreamService.getFeeRate(),
        Error,
        "MARA API error: 500 - API temporarily unavailable"
      );
    } finally {
      restore();
    }
  });

  await t.step("should handle invalid response structure", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const mockHttpClient = {
      get: stub().resolves({
        ok: true,
        status: 200,
        statusText: "OK",
        data: { invalid: "response" }
      })
    };
    const getStub = stub(FetchHttpClient.prototype, "get", mockHttpClient.get);

    try {
      await assertRejects(
        () => MaraSlipstreamService.getFeeRate(),
        Error,
        "Invalid response structure from MARA getinfo endpoint"
      );
    } finally {
      restore();
    }
  });

  await t.step("should handle network timeout", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const mockHttpClient = {
      get: stub().rejects(new Error("Network timeout"))
    };
    const getStub = stub(FetchHttpClient.prototype, "get", mockHttpClient.get);

    try {
      await assertRejects(
        () => MaraSlipstreamService.getFeeRate(),
        Error,
        "Network timeout"
      );
    } finally {
      restore();
    }
  });

  await t.step("should enforce minimum fee rate correctly", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const mockHttpClient = {
      get: stub().resolves({
        ok: true,
        status: 200,
        statusText: "OK",
        data: {
          fee_rate: 0.5,  // Below minimum
          block_height: 800000,
          network: "mainnet"
        }
      })
    };
    const getStub = stub(FetchHttpClient.prototype, "get", mockHttpClient.get);

    try {
      const response = await MaraSlipstreamService.getFeeRate();

      assertEquals(response.fee_rate, 0.5);
      assertEquals(response.min_fee_rate, 1.0); // Should be enforced minimum
    } finally {
      restore();
    }
  });
});

Deno.test("MaraSlipstreamService - Transaction Submission", async (t) => {
  const validTxHex = "0200000001abc123def456789012345678901234567890123456789012345678901234567890000000006b483045022100abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789001234567890abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ffffffff0280969800000000001976a914abcdef0123456789abcdef0123456789abcdef012388ac80969800000000001976a914fedcba9876543210fedcba9876543210fedcba9888ac00000000";

  await t.step("should submit transaction successfully", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const mockHttpClient = {
      post: stub().resolves({
        ok: true,
        status: 200,
        statusText: "OK",
        data: validSubmissionResponse
      })
    };
    const postStub = stub(FetchHttpClient.prototype, "post", mockHttpClient.post);

    try {
      const response = await MaraSlipstreamService.submitTransaction(validTxHex);

      assertExists(response);
      assertEquals(response.txid, validSubmissionResponse.message);
      assertEquals(response.status, "accepted");
      assertEquals(response.message, "Transaction accepted by MARA pool");
      assertExists(response.submission_time);
    } finally {
      restore();
    }
  });

  await t.step("should validate transaction hex input", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);

    try {
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
    } finally {
      restore();
    }
  });

  await t.step("should handle API submission errors", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const mockHttpClient = {
      post: stub().resolves({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        data: { error: "Invalid transaction format" }
      })
    };
    const postStub = stub(FetchHttpClient.prototype, "post", mockHttpClient.post);

    try {
      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validTxHex),
        Error,
        "MARA submission error: 400 - Invalid transaction format"
      );
    } finally {
      restore();
    }
  });

  await t.step("should handle MARA error responses", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const mockHttpClient = {
      post: stub().resolves({
        ok: true,
        status: 200,
        statusText: "OK",
        data: {
          message: "Fee rate too low",
          status: "error"
        }
      })
    };
    const postStub = stub(FetchHttpClient.prototype, "post", mockHttpClient.post);

    try {
      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validTxHex),
        Error,
        "MARA submission failed: Fee rate too low"
      );
    } finally {
      restore();
    }
  });

  await t.step("should handle invalid response structure", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const mockHttpClient = {
      post: stub().resolves({
        ok: true,
        status: 200,
        statusText: "OK",
        data: { invalid: "response" }
      })
    };
    const postStub = stub(FetchHttpClient.prototype, "post", mockHttpClient.post);

    try {
      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validTxHex),
        Error,
        "Invalid MARA response: missing required fields"
      );
    } finally {
      restore();
    }
  });

  await t.step("should validate txid format", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const mockHttpClient = {
      post: stub().resolves({
        ok: true,
        status: 200,
        statusText: "OK",
        data: {
          message: "invalid-txid",
          status: "success"
        }
      })
    };
    const postStub = stub(FetchHttpClient.prototype, "post", mockHttpClient.post);

    try {
      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validTxHex),
        Error,
        "Invalid txid format from MARA: invalid-txid"
      );
    } finally {
      restore();
    }
  });

  await t.step("should handle gateway errors specially", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const mockHttpClient = {
      post: stub().resolves({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
        data: "Service Temporarily Unavailable"
      })
    };
    const postStub = stub(FetchHttpClient.prototype, "post", mockHttpClient.post);

    try {
      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validTxHex),
        Error,
        "MARA service temporarily unavailable (502)"
      );
    } finally {
      restore();
    }
  });

  await t.step("should handle different priority levels", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const mockHttpClient = {
      post: stub().resolves({
        ok: true,
        status: 200,
        statusText: "OK",
        data: validSubmissionResponse
      })
    };
    const postStub = stub(FetchHttpClient.prototype, "post", mockHttpClient.post);

    try {
      // Test different priority levels
      await MaraSlipstreamService.submitTransaction(validTxHex, "high");
      await MaraSlipstreamService.submitTransaction(validTxHex, "medium");
      await MaraSlipstreamService.submitTransaction(validTxHex, "low");

      // Verify all calls were made
      assertEquals(mockHttpClient.post.calls.length, 3);
    } finally {
      restore();
    }
  });
});

Deno.test("MaraSlipstreamService - Circuit Breaker", async (t) => {
  await t.step("should check service availability", () => {
    const isAvailable = MaraSlipstreamService.isAvailable();
    assertEquals(typeof isAvailable, "boolean");
  });

  await t.step("should get circuit breaker metrics", () => {
    const metrics = MaraSlipstreamService.getCircuitBreakerMetrics();
    assertExists(metrics);
    assertEquals(typeof metrics, "object");
  });

  await t.step("should reset circuit breaker", () => {
    // Should not throw
    MaraSlipstreamService.resetCircuitBreaker();
  });

  await t.step("should handle circuit breaker failures during fee rate fetch", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);

    // Mock circuit breaker to throw
    const circuitBreakerStub = stub(MaraSlipstreamService as any, "circuitBreaker", {
      execute: stub().rejects(new Error("Circuit breaker is open"))
    });

    try {
      await assertRejects(
        () => MaraSlipstreamService.getFeeRate(),
        Error,
        "Circuit breaker is open"
      );
    } finally {
      restore();
    }
  });

  await t.step("should handle circuit breaker failures during transaction submission", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const validTxHex = "0200000001abc123def456789012345678901234567890123456789012345678901234567890000000006b48304502210088888888888888888888888888888888888888888888888888888888888888880123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ffffffff0280969800000000001976a914abcdef0123456789abcdef0123456789abcdef012388ac80969800000000001976a914fedcba9876543210fedcba9876543210fedcba9888ac00000000";

    // Mock circuit breaker to throw
    const circuitBreakerStub = stub(MaraSlipstreamService as any, "circuitBreaker", {
      execute: stub().rejects(new Error("Circuit breaker is open"))
    });

    try {
      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validTxHex),
        Error,
        "Circuit breaker is open"
      );
    } finally {
      restore();
    }
  });
});

Deno.test("MaraSlipstreamService - Error Handling and Edge Cases", async (t) => {
  await t.step("should handle HTML error responses", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const mockHttpClient = {
      post: stub().resolves({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        data: "<!DOCTYPE html><html><body>Server Error</body></html>"
      })
    };
    const postStub = stub(FetchHttpClient.prototype, "post", mockHttpClient.post);

    try {
      const validTxHex = "0200000001abc123def456789012345678901234567890123456789012345678901234567890000000006b48304502210099999999999999999999999999999999999999999999999999999999999999990123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ffffffff0280969800000000001976a914abcdef0123456789abcdef0123456789abcdef012388ac80969800000000001976a914fedcba9876543210fedcba9876543210fedcba9888ac00000000";

      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validTxHex),
        Error
      );
    } finally {
      restore();
    }
  });

  await t.step("should handle different error response formats", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const testCases = [
      { data: "String error message", expected: "String error message" },
      { data: { message: "Object with message" }, expected: "Object with message" },
      { data: { detail: "Object with detail" }, expected: "Object with detail" },
      { data: { error: "Object with error" }, expected: "Object with error" }
    ];

    for (const testCase of testCases) {
      const mockHttpClient = {
        post: stub().resolves({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          data: testCase.data
        })
      };
      const postStub = stub(FetchHttpClient.prototype, "post", mockHttpClient.post);

      try {
        const validTxHex = "0200000001abc123def456789012345678901234567890123456789012345678901234567890000000006b483045022100aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ffffffff0280969800000000001976a914abcdef0123456789abcdef0123456789abcdef012388ac80969800000000001976a914fedcba9876543210fedcba9876543210fedcba9888ac00000000";

        await assertRejects(
          () => MaraSlipstreamService.submitTransaction(validTxHex),
          Error
        );
      } finally {
        restore();
      }
    }
  });

  await t.step("should handle non-object response data", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const mockHttpClient = {
      post: stub().resolves({
        ok: true,
        status: 200,
        statusText: "OK",
        data: "not an object"
      })
    };
    const postStub = stub(FetchHttpClient.prototype, "post", mockHttpClient.post);

    try {
      const validTxHex = "0200000001abc123def456789012345678901234567890123456789012345678901234567890000000006b483045022100bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ffffffff0280969800000000001976a914abcdef0123456789abcdef0123456789abcdef012388ac80969800000000001976a914fedcba9876543210fedcba9876543210fedcba9888ac00000000";

      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validTxHex),
        Error,
        "Invalid submission response format from MARA API: expected object, got string"
      );
    } finally {
      restore();
    }
  });

  await t.step("should handle null/undefined data responses", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const mockHttpClient = {
      post: stub().resolves({
        ok: true,
        status: 200,
        statusText: "OK",
        data: null
      })
    };
    const postStub = stub(FetchHttpClient.prototype, "post", mockHttpClient.post);

    try {
      const validTxHex = "0200000001abc123def456789012345678901234567890123456789012345678901234567890000000006b483045022100cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ffffffff0280969800000000001976a914abcdef0123456789abcdef0123456789abcdef012388ac80969800000000001976a914fedcba9876543210fedcba9876543210fedcba9888ac00000000";

      await assertRejects(
        () => MaraSlipstreamService.submitTransaction(validTxHex),
        Error,
        "Invalid submission response format from MARA API: expected object, got object"
      );
    } finally {
      restore();
    }
  });
});

Deno.test("MaraSlipstreamService - Logging and Monitoring", async (t) => {
  await t.step("should log fee rate requests", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const loggerStub = stub(logger, "info");
    const mockHttpClient = {
      get: stub().resolves({
        ok: true,
        status: 200,
        statusText: "OK",
        data: validFeeRateResponse
      })
    };
    const getStub = stub(FetchHttpClient.prototype, "get", mockHttpClient.get);

    try {
      await MaraSlipstreamService.getFeeRate();

      // Verify logging calls were made
      assertEquals(loggerStub.calls.length >= 2, true);
    } finally {
      restore();
    }
  });

  await t.step("should log transaction submission requests", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const loggerStub = stub(logger, "info");
    const mockHttpClient = {
      post: stub().resolves({
        ok: true,
        status: 200,
        statusText: "OK",
        data: validSubmissionResponse
      })
    };
    const postStub = stub(FetchHttpClient.prototype, "post", mockHttpClient.post);

    try {
      const validTxHex = "0200000001abc123def456789012345678901234567890123456789012345678901234567890000000006b483045022100dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ffffffff0280969800000000001976a914abcdef0123456789abcdef0123456789abcdef012388ac80969800000000001976a914fedcba9876543210fedcba9876543210fedcba9888ac00000000";

      await MaraSlipstreamService.submitTransaction(validTxHex);

      // Verify logging calls were made
      assertEquals(loggerStub.calls.length >= 2, true);
    } finally {
      restore();
    }
  });

  await t.step("should log errors appropriately", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const loggerErrorStub = stub(logger, "error");
    const mockHttpClient = {
      get: stub().rejects(new Error("Network error"))
    };
    const getStub = stub(FetchHttpClient.prototype, "get", mockHttpClient.get);

    try {
      await assertRejects(() => MaraSlipstreamService.getFeeRate());

      // Verify error logging was called
      assertEquals(loggerErrorStub.calls.length >= 1, true);
    } finally {
      restore();
    }
  });
});

Deno.test("MaraSlipstreamService - Integration Edge Cases", async (t) => {
  await t.step("should handle timing and performance monitoring", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const fakeTime = new FakeTime();

    const mockHttpClient = {
      get: stub().callsFake(async () => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          data: validFeeRateResponse
        };
      })
    };
    const getStub = stub(FetchHttpClient.prototype, "get", mockHttpClient.get);

    try {
      const response = await MaraSlipstreamService.getFeeRate();
      assertExists(response);
    } finally {
      fakeTime.restore();
      restore();
    }
  });

  await t.step("should handle concurrent requests", async () => {
    const assertValidMaraConfigStub = stub(validatorModule, "assertValidMaraConfig", () => mockMaraConfig);
    const mockHttpClient = {
      get: stub().resolves({
        ok: true,
        status: 200,
        statusText: "OK",
        data: validFeeRateResponse
      })
    };
    const getStub = stub(FetchHttpClient.prototype, "get", mockHttpClient.get);

    try {
      // Make multiple concurrent requests
      const promises = Array(5).fill(null).map(() => MaraSlipstreamService.getFeeRate());
      const responses = await Promise.all(promises);

      assertEquals(responses.length, 5);
      responses.forEach(response => {
        assertExists(response);
        assertEquals(response.fee_rate, 3.0);
      });
    } finally {
      restore();
    }
  });
});
