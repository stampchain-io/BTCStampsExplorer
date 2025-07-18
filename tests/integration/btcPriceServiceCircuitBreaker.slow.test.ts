import { BTCPriceService } from "$/server/services/price/btcPriceService.ts";
import { CircuitState } from "$/server/services/price/circuitBreaker.ts";
import { assertEquals, assertExists } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { MockDatabaseManager } from "../mocks/mockDatabaseManager.ts";

// Mock HttpClient for testing circuit breaker behavior
class MockHttpClient {
  private static responses: Map<string, any> = new Map();
  private static shouldFail: Set<string> = new Set();
  private static shouldTimeout: Set<string> = new Set();

  static setMockResponse(url: string, response: any) {
    this.responses.set(url, response);
    this.shouldFail.delete(url);
    this.shouldTimeout.delete(url);
  }

  static setMockFailure(url: string, status: number = 500) {
    this.shouldFail.add(url);
    this.responses.set(url, { status, data: { error: "Mock error" } });
    this.shouldTimeout.delete(url);
  }

  static setMockTimeout(url: string) {
    this.shouldTimeout.add(url);
    this.shouldFail.delete(url);
  }

  static reset() {
    this.responses.clear();
    this.shouldFail.clear();
    this.shouldTimeout.clear();
  }

  async get(url: string) {
    // Simulate timeout
    if (MockHttpClient.shouldTimeout.has(url)) {
      await new Promise((resolve) => setTimeout(resolve, 6000)); // Longer than circuit breaker timeout
      throw new Error("Request timeout");
    }

    // Simulate failure
    if (MockHttpClient.shouldFail.has(url)) {
      const response = MockHttpClient.responses.get(url) ||
        { status: 500, data: { error: "Mock error" } };
      return response;
    }

    // Return success response
    const response = MockHttpClient.responses.get(url);
    if (response) {
      return { status: 200, data: response };
    }

    throw new Error(`No mock response set for ${url}`);
  }
}

// Mock the HTTP client globally
const originalFetch = globalThis.fetch;

describe("BTCPriceService Circuit Breaker Integration", () => {
  let mockDb: MockDatabaseManager;

  beforeEach(() => {
    mockDb = new MockDatabaseManager();
    BTCPriceService.setDatabase(mockDb as any);
    MockHttpClient.reset();
    BTCPriceService.resetCircuitBreakers();

    // Mock successful responses by default
    MockHttpClient.setMockResponse(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
      { bitcoin: { usd: 50000 } },
    );
    MockHttpClient.setMockResponse(
      "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
      { price: "50000.00" },
    );

    // Mock fetch to use our mock HTTP client
    globalThis.fetch = async (url: string | URL) => {
      const mockClient = new MockHttpClient();
      const response = await mockClient.get(url.toString());

      return new Response(JSON.stringify(response.data), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("Normal Operation", () => {
    it("should return price with circuit breaker metrics", async () => {
      const result = await BTCPriceService.getPrice();

      assertEquals(result.price, 50000);
      assertEquals(result.source, "coingecko");
      assertEquals(result.confidence, "high");
      assertExists(result.circuitBreakerMetrics);
      assertExists(result.circuitBreakerMetrics.coingecko);
      assertExists(result.circuitBreakerMetrics.binance);

      const coinGeckoMetrics = result.circuitBreakerMetrics.coingecko;
      assertEquals(coinGeckoMetrics.state, CircuitState.CLOSED);
      assertEquals(coinGeckoMetrics.totalSuccesses, 1);
      assertEquals(coinGeckoMetrics.totalFailures, 0);
    });

    it("should provide service health status", () => {
      const health = BTCPriceService.getHealthStatus();
      assertEquals(health.coingecko, true);
      assertEquals(health.binance, true);
    });

    it("should provide comprehensive service metrics", () => {
      const metrics = BTCPriceService.getServiceMetrics();
      assertExists(metrics.circuitBreakers);
      assertExists(metrics.healthStatus);
      assertExists(metrics.configuration);
      assertExists(metrics.sources);

      assertEquals(metrics.sources.length, 2);
      assertEquals(metrics.sources.includes("coingecko"), true);
      assertEquals(metrics.sources.includes("binance"), true);
    });
  });

  describe("Circuit Breaker Failure Handling", () => {
    it("should open circuit after repeated CoinGecko failures", async () => {
      // Set CoinGecko to fail
      MockHttpClient.setMockFailure(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        429,
      );

      // Make 3 requests to trigger circuit breaker (threshold = 3)
      for (let i = 0; i < 3; i++) {
        await BTCPriceService.getPrice();
      }

      const health = BTCPriceService.getHealthStatus();
      assertEquals(health.coingecko, false); // Circuit should be open

      const metrics = BTCPriceService.getServiceMetrics();
      assertEquals(metrics.circuitBreakers.coingecko.state, CircuitState.OPEN);
      assertEquals(metrics.circuitBreakers.coingecko.totalFailures, 3);
    });

    it("should fallback to Binance when CoinGecko circuit is open", async () => {
      // Open CoinGecko circuit
      MockHttpClient.setMockFailure(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        429,
      );

      for (let i = 0; i < 3; i++) {
        await BTCPriceService.getPrice();
      }

      // Reset CoinGecko to success but keep circuit open for 30s
      MockHttpClient.setMockResponse(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        { bitcoin: { usd: 50000 } },
      );

      // Next request should use Binance
      const result = await BTCPriceService.getPrice();
      assertEquals(result.source, "binance");
      assertEquals(result.price, 50000);
      assertEquals(result.fallbackUsed, true);
    });

    it("should handle HTTP 451 errors appropriately", async () => {
      // Set both APIs to return 451 (Legal restriction)
      MockHttpClient.setMockFailure(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        451,
      );
      MockHttpClient.setMockFailure(
        "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
        451,
      );

      const result = await BTCPriceService.getPrice();

      // Should fallback to static price
      assertEquals(result.source, "default");
      assertEquals(result.confidence, "low");
      assertEquals(result.fallbackUsed, true);
      assertExists(result.errors);
      assertEquals(result.errors.length > 0, true);
    });

    it("should handle timeout errors", async () => {
      // Set CoinGecko to timeout
      MockHttpClient.setMockTimeout(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
      );

      const result = await BTCPriceService.getPrice();

      // Should fallback to Binance
      assertEquals(result.source, "binance");
      assertEquals(result.price, 50000);
      assertEquals(result.fallbackUsed, true);
    });
  });

  describe("Circuit Recovery", () => {
    it("should reset circuit breakers", () => {
      // Get initial metrics
      const initialMetrics = BTCPriceService.getServiceMetrics();

      // Reset circuit breakers
      BTCPriceService.resetCircuitBreakers();

      // Verify all circuits are closed
      const health = BTCPriceService.getHealthStatus();
      assertEquals(health.coingecko, true);
      assertEquals(health.binance, true);

      const metrics = BTCPriceService.getServiceMetrics();
      assertEquals(
        metrics.circuitBreakers.coingecko.state,
        CircuitState.CLOSED,
      );
      assertEquals(metrics.circuitBreakers.binance.state, CircuitState.CLOSED);
    });
  });

  describe("Error Classification", () => {
    it("should properly classify rate limit errors", async () => {
      MockHttpClient.setMockFailure(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        429,
      );

      const result = await BTCPriceService.getPrice();

      // Should fallback to Binance
      assertEquals(result.source, "binance");
      assertExists(result.errors);

      const errorFound = result.errors.some((error) =>
        error.includes("rate limit") || error.includes("429")
      );
      assertEquals(errorFound, true);
    });

    it("should properly classify server errors", async () => {
      MockHttpClient.setMockFailure(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        503,
      );

      const result = await BTCPriceService.getPrice();

      // Should fallback to Binance
      assertEquals(result.source, "binance");
      assertExists(result.errors);

      const errorFound = result.errors.some((error) =>
        error.includes("server error") || error.includes("503")
      );
      assertEquals(errorFound, true);
    });
  });

  describe("Data Validation", () => {
    it("should reject invalid price data", async () => {
      // Set invalid price data
      MockHttpClient.setMockResponse(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        { bitcoin: { usd: null } },
      );

      const result = await BTCPriceService.getPrice();

      // Should fallback to Binance
      assertEquals(result.source, "binance");
      assertEquals(result.fallbackUsed, true);
    });

    it("should reject negative price data", async () => {
      // Set negative price
      MockHttpClient.setMockResponse(
        "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
        { price: "-1000.00" },
      );

      const result = await BTCPriceService.getPrice("binance");

      // Should fallback to CoinGecko or static
      assertEquals(result.source !== "binance", true);
    });
  });
});
