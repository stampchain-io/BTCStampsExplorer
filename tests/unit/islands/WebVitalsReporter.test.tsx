import { assertExists } from "@std/assert";

/**
 * Integration tests for WebVitalsReporter island
 * Note: These tests verify component module structure
 * Actual web-vitals metric collection requires real browser environment with PerformanceObserver API
 *
 * The component is designed to:
 * 1. Load web-vitals library dynamically (lazy load)
 * 2. Register metric observers (onCLS, onFID, onLCP, onFCP, onTTFB, onINP)
 * 3. Report metrics to console (dev mode) or analytics (production)
 * 4. Store metrics in localStorage for debugging
 * 5. Return null (invisible component)
 *
 * Testing actual metric collection would require:
 * - Real browser environment with DOM and PerformanceObserver
 * - User interactions for FID/INP
 * - Actual page rendering for LCP/CLS
 * - Network requests for TTFB
 *
 * These tests verify the module structure is valid.
 */

Deno.test("WebVitalsReporter - module imports successfully", async () => {
  // Verify the module can be imported without syntax errors
  const module = await import("$islands/WebVitalsReporter.tsx");
  assertExists(module.default);
});

Deno.test("WebVitalsReporter - utility module imports successfully", async () => {
  // Verify the utility module can be imported
  const module = await import("$lib/utils/performance/webVitals.ts");
  assertExists(module.getMetricRating);
  assertExists(module.isDevelopmentMode);
  assertExists(module.logMetricToConsole);
  assertExists(module.reportMetricToAnalytics);
  assertExists(module.saveWebVital);
});
