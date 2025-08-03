// World-Class Fee System Test Fixtures
// Comprehensive mock data for all external APIs and services

export const mempoolFeeFixture = {
  success: {
    fastestFee: 20,
    halfHourFee: 15,
    hourFee: 10,
    economyFee: 5,
    minimumFee: 1,
  },
  highFees: {
    fastestFee: 150,
    halfHourFee: 120,
    hourFee: 100,
    economyFee: 80,
    minimumFee: 50,
  },
  lowFees: {
    fastestFee: 2,
    halfHourFee: 2,
    hourFee: 1,
    economyFee: 1,
    minimumFee: 1,
  },
};

export const coinGeckoFixture = {
  success: {
    bitcoin: {
      usd: 45000,
      last_updated_at: 1704067200, // 2024-01-01T00:00:00Z
    },
  },
  highPrice: {
    bitcoin: {
      usd: 100000,
      last_updated_at: 1704067200,
    },
  },
  lowPrice: {
    bitcoin: {
      usd: 20000,
      last_updated_at: 1704067200,
    },
  },
};

export const binanceFixture = {
  success: {
    symbol: "BTCUSDT",
    price: "45000.00",
  },
  highPrice: {
    symbol: "BTCUSDT",
    price: "100000.00",
  },
  lowPrice: {
    symbol: "BTCUSDT",
    price: "20000.00",
  },
};

export const quickNodeFeeFixture = {
  success: {
    id: 1,
    jsonrpc: "2.0",
    result: {
      feerate: 0.00015, // BTC/kB (converts to 15 sats/vB)
      blocks: 6,
    },
  },
  highFee: {
    id: 1,
    jsonrpc: "2.0",
    result: {
      feerate: 0.0015, // 150 sats/vB
      blocks: 6,
    },
  },
  lowFee: {
    id: 1,
    jsonrpc: "2.0",
    result: {
      feerate: 0.00001, // 1 sats/vB
      blocks: 6,
    },
  },
  error: {
    id: 1,
    jsonrpc: "2.0",
    error: {
      code: -32603,
      message: "Internal error",
    },
  },
};

// Comprehensive mock responses factory
export const createMockResponse = <T = unknown>(
  data: T,
  status = 200,
  ok = true,
) => {
  return Promise.resolve({
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({ "content-type": "application/json" }),
  } as Response);
};

// World-class URL-based mock router
export const createWorldClassFetchMock = (
  scenario: "success" | "failure" | "mixed" | "highFees" | "lowFees" =
    "success",
) => {
  return (url: string | URL | Request, options?: RequestInit) => {
    const urlString = typeof url === "string" ? url : url.toString();

    console.log(`🎯 Mock intercepted: ${urlString}`);

    // Mempool.space API
    if (
      urlString.includes("mempool.space") ||
      urlString.includes("/v1/fees/recommended")
    ) {
      switch (scenario) {
        case "failure":
          return createMockResponse(
            { error: "Service unavailable" },
            503,
            false,
          );
        case "highFees":
          return createMockResponse(mempoolFeeFixture.highFees);
        case "lowFees":
          return createMockResponse(mempoolFeeFixture.lowFees);
        default:
          return createMockResponse(mempoolFeeFixture.success);
      }
    }

    // CoinGecko API
    if (urlString.includes("coingecko") || urlString.includes("simple/price")) {
      switch (scenario) {
        case "failure":
          return createMockResponse(
            { error: "Rate limit exceeded" },
            429,
            false,
          );
        case "highFees":
          return createMockResponse(coinGeckoFixture.highPrice);
        case "lowFees":
          return createMockResponse(coinGeckoFixture.lowPrice);
        default:
          return createMockResponse(coinGeckoFixture.success);
      }
    }

    // Binance API
    if (urlString.includes("binance") || urlString.includes("ticker/price")) {
      switch (scenario) {
        case "failure":
          return createMockResponse({ msg: "Service unavailable" }, 503, false);
        case "highFees":
          return createMockResponse(binanceFixture.highPrice);
        case "lowFees":
          return createMockResponse(binanceFixture.lowPrice);
        default:
          return createMockResponse(binanceFixture.success);
      }
    }

    // QuickNode API (JSON-RPC)
    if (urlString.includes("quicknode") || options?.method === "POST") {
      const body = options?.body ? JSON.parse(options.body as string) : {};
      if (body.method === "estimatesmartfee") {
        switch (scenario) {
          case "failure":
            return createMockResponse(quickNodeFeeFixture.error);
          case "highFees":
            return createMockResponse(quickNodeFeeFixture.highFee);
          case "lowFees":
            return createMockResponse(quickNodeFeeFixture.lowFee);
          default:
            return createMockResponse(quickNodeFeeFixture.success);
        }
      }
    }

    // Default fallback for any other URL
    console.log(`⚠️  Unhandled URL in mock: ${urlString}`);
    return createMockResponse({ error: "Not mocked" }, 404, false);
  };
};

// Test scenario configurations
export const testScenarios = {
  normal: {
    name: "Normal Market Conditions",
    scenario: "success" as const,
    expectedFee: 15,
    expectedPrice: 45000,
  },
  highFees: {
    name: "High Fee Environment",
    scenario: "highFees" as const,
    expectedFee: 150,
    expectedPrice: 100000,
  },
  lowFees: {
    name: "Low Fee Environment",
    scenario: "lowFees" as const,
    expectedFee: 2,
    expectedPrice: 20000,
  },
  networkFailure: {
    name: "Network Failure Recovery",
    scenario: "failure" as const,
    expectedFallback: true,
  },
};

// Performance test fixtures
export const performanceFixtures = {
  iterations: 10,
  maxAcceptableTime: 50, // ms for mocked responses
  maxCacheTime: 10, // ms for cached responses
  warmupIterations: 2,
};

// Cache test fixtures
export const cacheTestFixtures = {
  testKey: "fee_system_test_cache",
  testData: {
    recommendedFee: 15,
    btcPrice: 45000,
    timestamp: Date.now(),
    source: "test",
  },
  cacheDuration: 60, // seconds
};

// Background service test fixtures
export const backgroundServiceFixtures = {
  testBaseUrl: "https://test-fee-service.example.com",
  serviceInterval: 100, // ms for testing (much faster than production)
  warmupDelay: 50, // ms
  shutdownDelay: 100, // ms
};

// Expected fee data structure
export const expectedFeeDataStructure = {
  recommendedFee: "number",
  btcPrice: "number",
  source: "string",
  confidence: "string",
  timestamp: "number",
  fastestFee: "number",
  halfHourFee: "number",
  hourFee: "number",
  economyFee: "number",
  minimumFee: "number",
  fallbackUsed: "boolean",
  debug_feesResponse: "object",
};

// Validation helpers
export const validateFeeData = (data: unknown) => {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: ["Invalid data: not an object"] };
  }

  const dataObj = data as Record<string, unknown>;
  Object.entries(expectedFeeDataStructure).forEach(([key, expectedType]) => {
    if (!(key in dataObj)) {
      errors.push(`Missing required field: ${key}`);
    } else if (typeof dataObj[key] !== expectedType) {
      errors.push(
        `Field ${key} should be ${expectedType}, got ${typeof dataObj[key]}`,
      );
    }
  });

  // Additional validations
  if (
    data.recommendedFee &&
    (data.recommendedFee < 1 || data.recommendedFee > 1000)
  ) {
    errors.push(
      `Recommended fee ${data.recommendedFee} is outside reasonable range (1-1000 sats/vB)`,
    );
  }

  if (data.btcPrice && (data.btcPrice < 1000 || data.btcPrice > 1000000)) {
    errors.push(
      `BTC price ${data.btcPrice} is outside reasonable range ($1,000-$1,000,000)`,
    );
  }

  return errors;
};
