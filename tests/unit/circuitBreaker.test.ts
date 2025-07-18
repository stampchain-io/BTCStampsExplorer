import {
  CircuitBreaker,
  CircuitBreakerConfig,
  CircuitState,
} from "$/server/services/price/circuitBreaker.ts";
import {
  assertEquals,
  assertExists,
  assertRejects,
  assertStringIncludes,
  fail,
} from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";

describe("CircuitBreaker", () => {
  let circuitBreaker: CircuitBreaker;
  const config: CircuitBreakerConfig = {
    failureThreshold: 3,
    recoveryTimeout: 1000, // 1 second for faster testing
    successThreshold: 2,
    timeout: 500,
    monitoringPeriod: 5000,
  };

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker("TestService", config);
  });

  describe("Initial State", () => {
    it("should start in CLOSED state", () => {
      const metrics = circuitBreaker.getMetrics();
      assertEquals(metrics.state, CircuitState.CLOSED);
      assertEquals(metrics.failures, 0);
      assertEquals(metrics.successes, 0);
      assertEquals(circuitBreaker.isHealthy(), true);
    });
  });

  describe("Success Handling", () => {
    it("should handle successful operations", async () => {
      const result = await circuitBreaker.execute(async () => {
        return "success";
      });

      assertEquals(result, "success");
      const metrics = circuitBreaker.getMetrics();
      assertEquals(metrics.state, CircuitState.CLOSED);
      assertEquals(metrics.totalSuccesses, 1);
      assertEquals(metrics.totalRequests, 1);
    });

    it("should reset failure count after success", async () => {
      // Cause some failures
      try {
        await circuitBreaker.execute(async () => {
          throw new Error("test failure");
        });
      } catch {}

      try {
        await circuitBreaker.execute(async () => {
          throw new Error("test failure");
        });
      } catch {}

      let metrics = circuitBreaker.getMetrics();
      assertEquals(metrics.failures, 2);

      // Success should reset failure count
      await circuitBreaker.execute(async () => "success");

      metrics = circuitBreaker.getMetrics();
      assertEquals(metrics.failures, 0);
      assertEquals(metrics.successes, 1);
    });
  });

  describe("Failure Handling", () => {
    it("should track failures correctly", async () => {
      try {
        await circuitBreaker.execute(async () => {
          throw new Error("test failure");
        });
      } catch {}

      const metrics = circuitBreaker.getMetrics();
      assertEquals(metrics.totalFailures, 1);
      assertEquals(metrics.totalRequests, 1);
      assertEquals(metrics.state, CircuitState.CLOSED);
    });

    it("should open circuit after threshold failures", async () => {
      // Cause threshold number of failures
      for (let i = 0; i < config.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(async () => {
            throw new Error(`failure ${i + 1}`);
          });
        } catch {}
      }

      const metrics = circuitBreaker.getMetrics();
      assertEquals(metrics.state, CircuitState.OPEN);
      assertEquals(circuitBreaker.isHealthy(), false);
    });

    it("should reject requests when circuit is open", async () => {
      // Open the circuit
      for (let i = 0; i < config.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(async () => {
            throw new Error(`failure ${i + 1}`);
          });
        } catch {}
      }

      // Next request should be rejected
      await assertRejects(
        () => circuitBreaker.execute(async () => "should not execute"),
        Error,
        "Circuit breaker is OPEN",
      );
    });
  });

  describe("Timeout Handling", () => {
    it("should timeout long-running operations", async () => {
      await assertRejects(
        () =>
          circuitBreaker.execute(async () => {
            // Wait longer than timeout
            await new Promise((resolve) =>
              setTimeout(resolve, config.timeout + 100)
            );
            return "too slow";
          }),
        Error,
        "Operation timed out after",
      );
    });

    it("should count timeouts as failures", async () => {
      try {
        await circuitBreaker.execute(async () => {
          await new Promise((resolve) =>
            setTimeout(resolve, config.timeout + 100)
          );
          return "too slow";
        });
      } catch {}

      const metrics = circuitBreaker.getMetrics();
      assertEquals(metrics.totalFailures, 1);
    });
  });

  describe("Recovery (HALF_OPEN) State", () => {
    it("should transition to HALF_OPEN after recovery timeout", async () => {
      // Open the circuit
      for (let i = 0; i < config.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(async () => {
            throw new Error(`failure ${i + 1}`);
          });
        } catch {}
      }

      // Wait for recovery timeout
      await new Promise((resolve) =>
        setTimeout(resolve, config.recoveryTimeout + 50)
      );

      // Next request should transition to HALF_OPEN
      const result = await circuitBreaker.execute(async () => "recovery test");
      assertEquals(result, "recovery test");

      const metrics = circuitBreaker.getMetrics();
      assertEquals(metrics.state, CircuitState.HALF_OPEN);
    });

    it("should close circuit after successful recovery", async () => {
      // Open the circuit
      for (let i = 0; i < config.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(async () => {
            throw new Error(`failure ${i + 1}`);
          });
        } catch {}
      }

      // Wait for recovery timeout
      await new Promise((resolve) =>
        setTimeout(resolve, config.recoveryTimeout + 50)
      );

      // Perform successful recovery operations
      for (let i = 0; i < config.successThreshold; i++) {
        await circuitBreaker.execute(async () => `recovery ${i + 1}`);
      }

      const metrics = circuitBreaker.getMetrics();
      assertEquals(metrics.state, CircuitState.CLOSED);
      assertEquals(circuitBreaker.isHealthy(), true);
    });

    it("should reopen if recovery fails", async () => {
      // Open the circuit
      for (let i = 0; i < config.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(async () => {
            throw new Error(`failure ${i + 1}`);
          });
        } catch {}
      }

      // Wait for recovery timeout
      await new Promise((resolve) =>
        setTimeout(resolve, config.recoveryTimeout + 50)
      );

      // First recovery attempt succeeds
      await circuitBreaker.execute(async () => "recovery attempt 1");

      // Second recovery attempt fails
      try {
        await circuitBreaker.execute(async () => {
          throw new Error("recovery failed");
        });
      } catch {}

      const metrics = circuitBreaker.getMetrics();
      assertEquals(metrics.state, CircuitState.OPEN);
    });
  });

  describe("Metrics and Monitoring", () => {
    it("should provide accurate metrics", async () => {
      // Perform some operations
      await circuitBreaker.execute(async () => "success 1");

      try {
        await circuitBreaker.execute(async () => {
          throw new Error("failure 1");
        });
      } catch {}

      await circuitBreaker.execute(async () => "success 2");

      const metrics = circuitBreaker.getMetrics();
      assertEquals(metrics.totalRequests, 3);
      assertEquals(metrics.totalSuccesses, 2);
      assertEquals(metrics.totalFailures, 1);
      assertExists(metrics.lastSuccessTime);
      assertExists(metrics.lastFailureTime);
    });

    it("should provide exponential backoff delays", () => {
      const delay1 = circuitBreaker.getBackoffDelay(0);
      const delay2 = circuitBreaker.getBackoffDelay(1);
      const delay3 = circuitBreaker.getBackoffDelay(2);

      // Each delay should be roughly double the previous (with jitter)
      assertEquals(delay1 >= 1000, true); // Base delay + jitter
      assertEquals(delay2 >= 2000, true); // 2x base delay + jitter
      assertEquals(delay3 >= 4000, true); // 4x base delay + jitter

      // Should cap at max delay
      const delayMax = circuitBreaker.getBackoffDelay(10);
      assertEquals(delayMax <= 33000, true); // Max 30s + 10% jitter
    });
  });

  describe("Reset Functionality", () => {
    it("should reset circuit breaker state", async () => {
      // Open the circuit
      for (let i = 0; i < config.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(async () => {
            throw new Error(`failure ${i + 1}`);
          });
        } catch {}
      }

      let metrics = circuitBreaker.getMetrics();
      assertEquals(metrics.state, CircuitState.OPEN);

      // Reset the circuit breaker
      circuitBreaker.reset();

      metrics = circuitBreaker.getMetrics();
      assertEquals(metrics.state, CircuitState.CLOSED);
      assertEquals(metrics.failures, 0);
      assertEquals(metrics.successes, 0);
      assertEquals(circuitBreaker.isHealthy(), true);
    });
  });

  describe("Permanent Failure Handling", () => {
    it("should permanently disable circuit on 451 error", async () => {
      // Trigger a 451 error
      try {
        await circuitBreaker.execute(async () => {
          throw new Error("API unavailable for legal reasons (451)");
        });
      } catch (error) {
        assertStringIncludes(
          error.message,
          "unavailable for legal reasons (451)",
        );
      }

      // Check that circuit is permanently disabled
      const metrics = circuitBreaker.getMetrics();
      assertEquals(metrics.state, CircuitState.PERMANENTLY_OPEN);
      assertEquals(circuitBreaker.isPermanentlyDisabled(), true);
      assertEquals(circuitBreaker.isHealthy(), false);

      // Subsequent calls should fail immediately with permanent error
      try {
        await circuitBreaker.execute(async () => {
          return "should not execute";
        });
        fail("Should have thrown an error");
      } catch (error) {
        assertStringIncludes(error.message, "PERMANENTLY DISABLED");
        assertStringIncludes(
          error.message,
          "unavailable for legal reasons (451)",
        );
      }
    });

    it("should not retry after permanent failure", async () => {
      // Trigger a 451 error
      try {
        await circuitBreaker.execute(async () => {
          throw new Error("Binance API unavailable for legal reasons (451)");
        });
      } catch {}

      // Wait longer than recovery timeout
      await new Promise((resolve) =>
        setTimeout(resolve, config.recoveryTimeout + 100)
      );

      // Should still be permanently disabled (not moved to HALF_OPEN)
      try {
        await circuitBreaker.execute(async () => {
          return "should not execute";
        });
        fail("Should have thrown an error");
      } catch (error) {
        assertEquals(error.name, "CircuitBreakerPermanentlyOpenError");
      }

      const metrics = circuitBreaker.getMetrics();
      assertEquals(metrics.state, CircuitState.PERMANENTLY_OPEN);
    });
  });
});
