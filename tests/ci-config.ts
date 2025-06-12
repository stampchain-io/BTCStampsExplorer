/**
 * CI Configuration for Fee System Tests
 *
 * This file provides configuration and utilities for running fee system tests
 * in CI environments like GitHub Actions.
 */

export const CI_CONFIG = {
  // Detect if running in CI
  isCI: Deno.env.get("CI") === "true" ||
    Deno.env.get("GITHUB_ACTIONS") === "true",

  // Test timeouts (longer for CI due to slower environments)
  timeouts: {
    standard: Deno.env.get("CI") ? 10000 : 5000, // 10s CI, 5s local
    concurrent: Deno.env.get("CI") ? 2000 : 1000, // 2s CI, 1s local
    network: Deno.env.get("CI") ? 15000 : 8000, // 15s CI, 8s local
  },

  // Test delays (shorter for CI to avoid timeouts)
  delays: {
    mock: Deno.env.get("CI") ? 50 : 100, // 50ms CI, 100ms local
    cache: Deno.env.get("CI") ? 25 : 50, // 25ms CI, 50ms local
  },

  // Environment checks
  hasRedis: Deno.env.get("SKIP_REDIS_CONNECTION") !== "true",
  hasNetworkAccess: true, // Assume network access in CI

  // Mock API endpoints for CI
  mockEndpoints: {
    quicknode: "test-endpoint.quiknode.pro",
    mempool: "mempool.space",
  },

  // Test data
  validFeeData: {
    recommendedFee: 15,
    btcPrice: 45000,
    source: "mempool" as const,
    confidence: "high" as const,
    timestamp: Date.now(),
    fastestFee: 20,
    halfHourFee: 15,
    hourFee: 10,
    economyFee: 5,
    minimumFee: 1,
  },
};

/**
 * Mock localStorage for testing environments
 */
export function setupMockLocalStorage(): Map<string, string> {
  const mockStorage = new Map<string, string>();

  // Override localStorage methods for testing
  globalThis.localStorage = {
    getItem: (key: string) => mockStorage.get(key) || null,
    setItem: (key: string, value: string) => {
      mockStorage.set(key, value);
    },
    removeItem: (key: string) => {
      mockStorage.delete(key);
    },
    clear: () => {
      mockStorage.clear();
    },
    length: mockStorage.size,
    key: (index: number) => Array.from(mockStorage.keys())[index] || null,
  };

  return mockStorage;
}

/**
 * Restore original localStorage after testing
 */
export function restoreLocalStorage(original: Storage): void {
  globalThis.localStorage = original;
}

/**
 * Create a mock fetch function for testing
 */
export function createMockFetch(
  responses: Record<string, unknown>,
): typeof fetch {
  return async (input: string | Request | URL): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();

    // Check if we have a mock response for this URL
    for (const [pattern, response] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        const responseText = JSON.stringify(response);
        return {
          ok: true,
          json: async () => response,
          text: async () => responseText,
          status: 200,
          statusText: "OK",
          headers: new Headers({ "content-type": "application/json" }),
          url: url,
          redirected: false,
          type: "basic",
          bodyUsed: false,
          clone: () => {
            throw new Error("Mock response clone not implemented");
          },
          arrayBuffer: async () => {
            throw new Error("Mock response arrayBuffer not implemented");
          },
          blob: async () => {
            throw new Error("Mock response blob not implemented");
          },
          formData: async () => {
            throw new Error("Mock response formData not implemented");
          },
          bytes: async () => {
            throw new Error("Mock response bytes not implemented");
          },
          body: null,
        } as unknown as Response;
      }
    }

    // Default to network error for unmocked URLs
    throw new Error(`Network error: No mock response for ${url}`);
  };
}

/**
 * Log test information for CI debugging
 */
export function logTestInfo(
  testName: string,
  info: Record<string, unknown>,
): void {
  if (CI_CONFIG.isCI) {
    console.log(`[CI-TEST] ${testName}:`, JSON.stringify(info, null, 2));
  }
}
