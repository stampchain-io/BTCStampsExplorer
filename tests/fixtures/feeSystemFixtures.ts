/**
 * Fee System Fixtures for Testing
 * Provides mock data and utilities for fee system testing
 */

// Test scenarios for different fee conditions
export const testScenarios = {
  normal: {
    name: "Normal Fee Conditions",
    scenario: "normal",
    expectedFee: 15,
    expectedPrice: 45000,
    expectedFallback: false,
  },
  high: {
    name: "High Fee Conditions",
    scenario: "high",
    expectedFee: 85,
    expectedPrice: 65000,
    expectedFallback: false,
  },
  low: {
    name: "Low Fee Conditions",
    scenario: "low",
    expectedFee: 5,
    expectedPrice: 35000,
    expectedFallback: false,
  },
  failure: {
    name: "Network Failure",
    scenario: "failure",
    expectedFee: 20,
    expectedPrice: 50000,
    expectedFallback: true,
  },
};

// Mock API responses for different scenarios
export const mockApiResponses = {
  normal: {
    mempool: {
      fastestFee: 20,
      halfHourFee: 15,
      hourFee: 12,
      economyFee: 8,
      minimumFee: 1,
    },
    coingecko: {
      bitcoin: { usd: 45000 }
    },
    binance: {
      price: "45000.00"
    },
    quicknode: {
      result: {
        fastestFee: 20,
        halfHourFee: 15,
        hourFee: 12,
        economyFee: 8,
        minimumFee: 1,
      }
    }
  },
  high: {
    mempool: {
      fastestFee: 95,
      halfHourFee: 85,
      hourFee: 75,
      economyFee: 65,
      minimumFee: 1,
    },
    coingecko: {
      bitcoin: { usd: 65000 }
    },
    binance: {
      price: "65000.00"
    },
    quicknode: {
      result: {
        fastestFee: 95,
        halfHourFee: 85,
        hourFee: 75,
        economyFee: 65,
        minimumFee: 1,
      }
    }
  },
  low: {
    mempool: {
      fastestFee: 8,
      halfHourFee: 5,
      hourFee: 3,
      economyFee: 2,
      minimumFee: 1,
    },
    coingecko: {
      bitcoin: { usd: 35000 }
    },
    binance: {
      price: "35000.00"
    },
    quicknode: {
      result: {
        fastestFee: 8,
        halfHourFee: 5,
        hourFee: 3,
        economyFee: 2,
        minimumFee: 1,
      }
    }
  },
  failure: {
    mempool: null, // Will cause fetch to fail
    coingecko: null,
    binance: null,
    quicknode: null,
  }
};

// Create world-class fetch mock
export function createWorldClassFetchMock(scenario: string) {
  const responses = mockApiResponses[scenario as keyof typeof mockApiResponses];

  return async (url: string | URL | Request): Promise<Response> => {
    const urlString = typeof url === 'string' ? url : url.toString();

    // Handle failure scenario
    if (scenario === 'failure') {
      throw new Error(`Network error for ${urlString}`);
    }

    // Mempool.space API
    if (urlString.includes('mempool.space/api/v1/fees/recommended')) {
      return new Response(JSON.stringify(responses.mempool), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // CoinGecko API
    if (urlString.includes('api.coingecko.com')) {
      return new Response(JSON.stringify(responses.coingecko), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Binance API
    if (urlString.includes('api.binance.com')) {
      return new Response(JSON.stringify(responses.binance), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // QuickNode API
    if (urlString.includes('quicknode') || urlString.includes('rpc')) {
      return new Response(JSON.stringify(responses.quicknode), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Default fallback
    return new Response('Not Found', { status: 404 });
  };
}

// Expected fee data structure
export const expectedFeeDataStructure = {
  recommendedFee: 'number',
  btcPrice: 'number',
  source: 'string',
  confidence: 'string',
  timestamp: 'number',
  fastestFee: 'number',
  halfHourFee: 'number',
  hourFee: 'number',
  economyFee: 'number',
  minimumFee: 'number',
  fallbackUsed: 'boolean',
  debug_feesResponse: 'object',
};

// Validate fee data structure
export function validateFeeData(data: any): string[] {
  const errors: string[] = [];

  for (const [key, expectedType] of Object.entries(expectedFeeDataStructure)) {
    if (!(key in data)) {
      errors.push(`Missing field: ${key}`);
      continue;
    }

    const actualType = typeof data[key];
    if (actualType !== expectedType) {
      errors.push(`Field ${key}: expected ${expectedType}, got ${actualType}`);
    }
  }

  return errors;
}

// Performance test fixtures
export const performanceFixtures = {
  iterations: 10,
  warmupIterations: 3,
  maxAcceptableTime: 50, // ms
};

// Cache test fixtures
export const cacheTestFixtures = {
  testKey: "test_fee_data",
  testData: {
    recommendedFee: 15,
    btcPrice: 45000,
    source: "test",
    confidence: "high",
    timestamp: Date.now(),
    fastestFee: 20,
    halfHourFee: 15,
    hourFee: 12,
    economyFee: 8,
    minimumFee: 1,
    fallbackUsed: false,
    debug_feesResponse: {}
  },
  cacheDuration: 30000, // 30 seconds
};
