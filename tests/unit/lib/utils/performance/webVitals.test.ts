import { assertEquals, assertExists } from "@std/assert";
import {
  clearWebVitals,
  formatMetricValue,
  getAverageMetric,
  getMetricColor,
  getMetricEmoji,
  getMetricRating,
  getMetricsForPage,
  isDevelopmentMode,
  loadWebVitals,
  saveWebVital,
  WEB_VITALS_THRESHOLDS,
  type WebVitalMetric,
} from "$lib/utils/performance/webVitals.ts";

// Mock localStorage for testing
class LocalStorageMock {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Mock location for testing
const mockLocation = {
  hostname: "localhost",
  pathname: "/test-page",
};

/**
 * Setup test environment with mocked globals
 */
function setupTestEnvironment() {
  const localStorageMock = new LocalStorageMock();
  globalThis.localStorage = localStorageMock as unknown as Storage;
  globalThis.location = mockLocation as unknown as Location;

  // Clear any existing data
  localStorageMock.clear();

  return () => {
    localStorageMock.clear();
  };
}

/**
 * Create a test metric
 */
function createTestMetric(
  name: WebVitalMetric["name"],
  value: number,
): WebVitalMetric {
  return {
    name,
    value,
    rating: getMetricRating(name, value),
    delta: value,
    id: `test-${name}-${Date.now()}`,
    navigationType: "navigate",
  };
}

Deno.test("WebVitals - getMetricRating - LCP ratings", () => {
  // Good LCP (≤2500ms)
  assertEquals(getMetricRating("LCP", 2000), "good");
  assertEquals(getMetricRating("LCP", 2500), "good");

  // Needs improvement LCP (2500ms < x ≤ 4000ms)
  assertEquals(getMetricRating("LCP", 2501), "needs-improvement");
  assertEquals(getMetricRating("LCP", 3500), "needs-improvement");
  assertEquals(getMetricRating("LCP", 4000), "needs-improvement");

  // Poor LCP (>4000ms)
  assertEquals(getMetricRating("LCP", 4001), "poor");
  assertEquals(getMetricRating("LCP", 5000), "poor");
});

Deno.test("WebVitals - getMetricRating - FID ratings", () => {
  // Good FID (≤100ms)
  assertEquals(getMetricRating("FID", 50), "good");
  assertEquals(getMetricRating("FID", 100), "good");

  // Needs improvement FID (100ms < x ≤ 300ms)
  assertEquals(getMetricRating("FID", 101), "needs-improvement");
  assertEquals(getMetricRating("FID", 200), "needs-improvement");
  assertEquals(getMetricRating("FID", 300), "needs-improvement");

  // Poor FID (>300ms)
  assertEquals(getMetricRating("FID", 301), "poor");
  assertEquals(getMetricRating("FID", 500), "poor");
});

Deno.test("WebVitals - getMetricRating - INP ratings", () => {
  // Good INP (≤200ms)
  assertEquals(getMetricRating("INP", 100), "good");
  assertEquals(getMetricRating("INP", 200), "good");

  // Needs improvement INP (200ms < x ≤ 500ms)
  assertEquals(getMetricRating("INP", 201), "needs-improvement");
  assertEquals(getMetricRating("INP", 350), "needs-improvement");
  assertEquals(getMetricRating("INP", 500), "needs-improvement");

  // Poor INP (>500ms)
  assertEquals(getMetricRating("INP", 501), "poor");
  assertEquals(getMetricRating("INP", 700), "poor");
});

Deno.test("WebVitals - getMetricRating - CLS ratings", () => {
  // Good CLS (≤0.1)
  assertEquals(getMetricRating("CLS", 0.05), "good");
  assertEquals(getMetricRating("CLS", 0.1), "good");

  // Needs improvement CLS (0.1 < x ≤ 0.25)
  assertEquals(getMetricRating("CLS", 0.11), "needs-improvement");
  assertEquals(getMetricRating("CLS", 0.2), "needs-improvement");
  assertEquals(getMetricRating("CLS", 0.25), "needs-improvement");

  // Poor CLS (>0.25)
  assertEquals(getMetricRating("CLS", 0.26), "poor");
  assertEquals(getMetricRating("CLS", 0.5), "poor");
});

Deno.test("WebVitals - getMetricRating - FCP ratings", () => {
  // Good FCP (≤1800ms)
  assertEquals(getMetricRating("FCP", 1500), "good");
  assertEquals(getMetricRating("FCP", 1800), "good");

  // Needs improvement FCP (1800ms < x ≤ 3000ms)
  assertEquals(getMetricRating("FCP", 1801), "needs-improvement");
  assertEquals(getMetricRating("FCP", 2500), "needs-improvement");
  assertEquals(getMetricRating("FCP", 3000), "needs-improvement");

  // Poor FCP (>3000ms)
  assertEquals(getMetricRating("FCP", 3001), "poor");
  assertEquals(getMetricRating("FCP", 4000), "poor");
});

Deno.test("WebVitals - getMetricRating - TTFB ratings", () => {
  // Good TTFB (≤800ms)
  assertEquals(getMetricRating("TTFB", 500), "good");
  assertEquals(getMetricRating("TTFB", 800), "good");

  // Needs improvement TTFB (800ms < x ≤ 1800ms)
  assertEquals(getMetricRating("TTFB", 801), "needs-improvement");
  assertEquals(getMetricRating("TTFB", 1200), "needs-improvement");
  assertEquals(getMetricRating("TTFB", 1800), "needs-improvement");

  // Poor TTFB (>1800ms)
  assertEquals(getMetricRating("TTFB", 1801), "poor");
  assertEquals(getMetricRating("TTFB", 2500), "poor");
});

Deno.test("WebVitals - formatMetricValue - CLS formatting", () => {
  // CLS should be formatted as unitless score with 3 decimals
  assertEquals(formatMetricValue("CLS", 0.123456), "0.123");
  assertEquals(formatMetricValue("CLS", 0.1), "0.100");
  assertEquals(formatMetricValue("CLS", 0.05), "0.050");
});

Deno.test("WebVitals - formatMetricValue - time-based metrics formatting", () => {
  // All other metrics should be formatted as milliseconds (rounded)
  assertEquals(formatMetricValue("LCP", 2345.67), "2346ms");
  assertEquals(formatMetricValue("FID", 123.45), "123ms");
  assertEquals(formatMetricValue("INP", 234.56), "235ms");
  assertEquals(formatMetricValue("FCP", 1234.89), "1235ms");
  assertEquals(formatMetricValue("TTFB", 567.12), "567ms");
});

Deno.test("WebVitals - getMetricColor - color mapping", () => {
  assertEquals(getMetricColor("good"), "#0CCE6B");
  assertEquals(getMetricColor("needs-improvement"), "#FFA400");
  assertEquals(getMetricColor("poor"), "#FF4E42");
});

Deno.test("WebVitals - getMetricEmoji - emoji mapping", () => {
  assertEquals(getMetricEmoji("good"), "✅");
  assertEquals(getMetricEmoji("needs-improvement"), "⚠️");
  assertEquals(getMetricEmoji("poor"), "❌");
});

Deno.test("WebVitals - saveWebVital - saves metric to localStorage", () => {
  const cleanup = setupTestEnvironment();

  try {
    // Clear any existing data
    clearWebVitals();

    const metric = createTestMetric("LCP", 2000);
    const result = saveWebVital(metric);

    assertEquals(result, true);

    // Verify stored data
    const stored = loadWebVitals();
    assertExists(stored);
    assertEquals(stored.metrics.length, 1);
    assertEquals(stored.metrics[0].name, "LCP");
    assertEquals(stored.metrics[0].value, 2000);
    assertEquals(stored.metrics[0].pathname, "/test-page");
  } finally {
    cleanup();
  }
});

Deno.test("WebVitals - saveWebVital - enforces max metrics limit", () => {
  const cleanup = setupTestEnvironment();

  try {
    // Save 55 metrics (limit is 50)
    for (let i = 0; i < 55; i++) {
      const metric = createTestMetric("LCP", 2000 + i);
      saveWebVital(metric);
    }

    // Verify only last 50 are kept
    const stored = loadWebVitals();
    assertExists(stored);
    assertEquals(stored.metrics.length, 50);

    // Verify oldest metrics were removed (first 5)
    // Last metric should have value 2054 (2000 + 54)
    assertEquals(stored.metrics[stored.metrics.length - 1].value, 2054);
  } finally {
    cleanup();
  }
});

Deno.test("WebVitals - loadWebVitals - handles missing data", () => {
  const cleanup = setupTestEnvironment();

  try {
    // Ensure storage is empty
    clearWebVitals();
    const result = loadWebVitals();
    assertEquals(result, null);
  } finally {
    cleanup();
  }
});

Deno.test("WebVitals - loadWebVitals - handles invalid JSON", () => {
  const cleanup = setupTestEnvironment();

  try {
    // Manually set invalid JSON
    globalThis.localStorage.setItem(
      "btc_stamps_web_vitals",
      "invalid json {",
    );

    const result = loadWebVitals();
    assertEquals(result, null);

    // Verify storage was cleared
    const item = globalThis.localStorage.getItem("btc_stamps_web_vitals");
    assertEquals(item, null);
  } finally {
    cleanup();
  }
});

Deno.test("WebVitals - loadWebVitals - handles version mismatch", () => {
  const cleanup = setupTestEnvironment();

  try {
    // Save data with old version
    globalThis.localStorage.setItem(
      "btc_stamps_web_vitals",
      JSON.stringify({
        metrics: [],
        version: "0.9",
        lastUpdated: Date.now(),
      }),
    );

    const result = loadWebVitals();
    assertEquals(result, null);

    // Verify storage was cleared
    const item = globalThis.localStorage.getItem("btc_stamps_web_vitals");
    assertEquals(item, null);
  } finally {
    cleanup();
  }
});

Deno.test("WebVitals - clearWebVitals - removes all stored metrics", () => {
  const cleanup = setupTestEnvironment();

  try {
    // Save a metric
    const metric = createTestMetric("LCP", 2000);
    saveWebVital(metric);

    // Verify it was saved
    let stored = loadWebVitals();
    assertExists(stored);

    // Clear
    clearWebVitals();

    // Verify cleared
    stored = loadWebVitals();
    assertEquals(stored, null);
  } finally {
    cleanup();
  }
});

Deno.test("WebVitals - getMetricsForPage - filters by pathname", () => {
  const cleanup = setupTestEnvironment();

  try {
    // Save metrics for different pages
    globalThis.location.pathname = "/page1";
    saveWebVital(createTestMetric("LCP", 2000));
    saveWebVital(createTestMetric("FID", 100));

    globalThis.location.pathname = "/page2";
    saveWebVital(createTestMetric("LCP", 3000));

    globalThis.location.pathname = "/page1";
    saveWebVital(createTestMetric("CLS", 0.1));

    // Get metrics for page1
    const page1Metrics = getMetricsForPage("/page1");
    assertEquals(page1Metrics.length, 3);

    // Get metrics for page2
    const page2Metrics = getMetricsForPage("/page2");
    assertEquals(page2Metrics.length, 1);
    assertEquals(page2Metrics[0].name, "LCP");
    assertEquals(page2Metrics[0].value, 3000);
  } finally {
    cleanup();
  }
});

Deno.test("WebVitals - getAverageMetric - calculates average for metric type", () => {
  const cleanup = setupTestEnvironment();

  try {
    // Clear any existing data
    clearWebVitals();

    // Save multiple LCP metrics
    saveWebVital(createTestMetric("LCP", 2000));
    saveWebVital(createTestMetric("LCP", 3000));
    saveWebVital(createTestMetric("LCP", 4000));

    // Save other metrics (should be ignored)
    saveWebVital(createTestMetric("FID", 100));

    const average = getAverageMetric("LCP");
    assertEquals(average, 3000); // (2000 + 3000 + 4000) / 3
  } finally {
    cleanup();
  }
});

Deno.test("WebVitals - getAverageMetric - filters by pathname", () => {
  const cleanup = setupTestEnvironment();

  try {
    // Clear any existing data
    clearWebVitals();

    // Save LCP metrics for different pages
    globalThis.location.pathname = "/page1";
    saveWebVital(createTestMetric("LCP", 2000));
    saveWebVital(createTestMetric("LCP", 4000));

    globalThis.location.pathname = "/page2";
    saveWebVital(createTestMetric("LCP", 6000));

    // Average for page1 only
    const averagePage1 = getAverageMetric("LCP", "/page1");
    assertEquals(averagePage1, 3000); // (2000 + 4000) / 2

    // Average for page2 only
    const averagePage2 = getAverageMetric("LCP", "/page2");
    assertEquals(averagePage2, 6000);

    // Average across all pages (no pathname filter)
    const averageAll = getAverageMetric("LCP");
    assertEquals(averageAll, 4000); // (2000 + 4000 + 6000) / 3
  } finally {
    cleanup();
  }
});

Deno.test("WebVitals - getAverageMetric - returns null for missing metrics", () => {
  const cleanup = setupTestEnvironment();

  try {
    // Clear any existing data
    clearWebVitals();

    const average = getAverageMetric("LCP");
    assertEquals(average, null);
  } finally {
    cleanup();
  }
});

Deno.test("WebVitals - isDevelopmentMode - detects localhost", () => {
  const cleanup = setupTestEnvironment();

  try {
    globalThis.location.hostname = "localhost";
    assertEquals(isDevelopmentMode(), true);

    globalThis.location.hostname = "127.0.0.1";
    assertEquals(isDevelopmentMode(), true);

    globalThis.location.hostname = "stampchain.io";
    assertEquals(isDevelopmentMode(), false);

    globalThis.location.hostname = "example.com";
    assertEquals(isDevelopmentMode(), false);
  } finally {
    cleanup();
  }
});

Deno.test("WebVitals - isDevelopmentMode - detects local network", () => {
  const cleanup = setupTestEnvironment();

  try {
    globalThis.location.hostname = "192.168.1.100";
    assertEquals(isDevelopmentMode(), true);

    globalThis.location.hostname = "10.0.0.50";
    assertEquals(isDevelopmentMode(), true);

    globalThis.location.hostname = "test.local";
    assertEquals(isDevelopmentMode(), true);
  } finally {
    cleanup();
  }
});

Deno.test("WebVitals - thresholds constants - verify values match Google's recommendations", () => {
  // LCP thresholds
  assertEquals(WEB_VITALS_THRESHOLDS.LCP.good, 2500);
  assertEquals(WEB_VITALS_THRESHOLDS.LCP.poor, 4000);

  // FID thresholds
  assertEquals(WEB_VITALS_THRESHOLDS.FID.good, 100);
  assertEquals(WEB_VITALS_THRESHOLDS.FID.poor, 300);

  // INP thresholds
  assertEquals(WEB_VITALS_THRESHOLDS.INP.good, 200);
  assertEquals(WEB_VITALS_THRESHOLDS.INP.poor, 500);

  // CLS thresholds
  assertEquals(WEB_VITALS_THRESHOLDS.CLS.good, 0.1);
  assertEquals(WEB_VITALS_THRESHOLDS.CLS.poor, 0.25);

  // FCP thresholds
  assertEquals(WEB_VITALS_THRESHOLDS.FCP.good, 1800);
  assertEquals(WEB_VITALS_THRESHOLDS.FCP.poor, 3000);

  // TTFB thresholds
  assertEquals(WEB_VITALS_THRESHOLDS.TTFB.good, 800);
  assertEquals(WEB_VITALS_THRESHOLDS.TTFB.poor, 1800);
});

Deno.test("WebVitals - saveWebVital - handles multiple metric types", () => {
  const cleanup = setupTestEnvironment();

  try {
    // Clear any existing data
    clearWebVitals();

    // Save all metric types
    saveWebVital(createTestMetric("LCP", 2000));
    saveWebVital(createTestMetric("FID", 50));
    saveWebVital(createTestMetric("INP", 150));
    saveWebVital(createTestMetric("CLS", 0.05));
    saveWebVital(createTestMetric("FCP", 1500));
    saveWebVital(createTestMetric("TTFB", 500));

    const stored = loadWebVitals();
    assertExists(stored);
    assertEquals(stored.metrics.length, 6);

    // Verify all metric types are present
    const metricNames = stored.metrics.map((m) => m.name);
    assertEquals(metricNames.includes("LCP"), true);
    assertEquals(metricNames.includes("FID"), true);
    assertEquals(metricNames.includes("INP"), true);
    assertEquals(metricNames.includes("CLS"), true);
    assertEquals(metricNames.includes("FCP"), true);
    assertEquals(metricNames.includes("TTFB"), true);
  } finally {
    cleanup();
  }
});
