/**
 * Web Vitals Monitoring Utilities
 * Handles storage, formatting, and reporting of Core Web Vitals metrics (LCP, FID/INP, CLS, FCP, TTFB)
 */

// Storage key for web vitals metrics
const WEB_VITALS_KEY = "btc_stamps_web_vitals";
const WEB_VITALS_VERSION = "1.0";
const MAX_METRICS_STORED = 50; // Keep last 50 metrics per page

/**
 * Core Web Vitals metric interface (aligned with web-vitals library)
 */
export interface WebVitalMetric {
  name: "CLS" | "FID" | "INP" | "LCP" | "FCP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
  navigationType?: string;
}

/**
 * Stored metrics with metadata
 */
interface StoredWebVitals {
  metrics: Array<WebVitalMetric & { timestamp: number; pathname: string }>;
  version: string;
  lastUpdated: number;
}

/**
 * Core Web Vitals thresholds (based on Google's recommended values)
 * https://web.dev/vitals/
 */
export const WEB_VITALS_THRESHOLDS = {
  // Largest Contentful Paint (LCP) - milliseconds
  LCP: {
    good: 2500,
    poor: 4000,
  },
  // First Input Delay (FID) - milliseconds
  FID: {
    good: 100,
    poor: 300,
  },
  // Interaction to Next Paint (INP) - milliseconds
  INP: {
    good: 200,
    poor: 500,
  },
  // Cumulative Layout Shift (CLS) - score
  CLS: {
    good: 0.1,
    poor: 0.25,
  },
  // First Contentful Paint (FCP) - milliseconds
  FCP: {
    good: 1800,
    poor: 3000,
  },
  // Time to First Byte (TTFB) - milliseconds
  TTFB: {
    good: 800,
    poor: 1800,
  },
} as const;

/**
 * Get rating for a metric value
 */
export function getMetricRating(
  name: WebVitalMetric["name"],
  value: number,
): "good" | "needs-improvement" | "poor" {
  const thresholds = WEB_VITALS_THRESHOLDS[name];
  if (value <= thresholds.good) return "good";
  if (value <= thresholds.poor) return "needs-improvement";
  return "poor";
}

/**
 * Format metric value with appropriate unit
 */
export function formatMetricValue(
  name: WebVitalMetric["name"],
  value: number,
): string {
  // CLS is unitless score, round to 3 decimals
  if (name === "CLS") {
    return value.toFixed(3);
  }
  // All other metrics are in milliseconds, round to nearest integer
  return Math.round(value).toString() + "ms";
}

/**
 * Get console color for metric rating (for dev mode logging)
 */
export function getMetricColor(
  rating: WebVitalMetric["rating"],
): string {
  switch (rating) {
    case "good":
      return "#0CCE6B"; // Green
    case "needs-improvement":
      return "#FFA400"; // Orange
    case "poor":
      return "#FF4E42"; // Red
  }
}

/**
 * Get rating emoji for console output
 */
export function getMetricEmoji(rating: WebVitalMetric["rating"]): string {
  switch (rating) {
    case "good":
      return "✅";
    case "needs-improvement":
      return "⚠️";
    case "poor":
      return "❌";
  }
}

/**
 * Save web vitals metric to localStorage
 */
export function saveWebVital(metric: WebVitalMetric): boolean {
  try {
    if (typeof globalThis.localStorage === "undefined") {
      console.warn("[WebVitals] localStorage not available");
      return false;
    }

    // Get current pathname for context
    const pathname = typeof globalThis.location !== "undefined"
      ? globalThis.location.pathname
      : "/";

    // Load existing data
    const stored = globalThis.localStorage.getItem(WEB_VITALS_KEY);
    let vitalsData: StoredWebVitals;

    if (stored) {
      try {
        vitalsData = JSON.parse(stored);
        // Version mismatch, reset
        if (vitalsData.version !== WEB_VITALS_VERSION) {
          vitalsData = {
            metrics: [],
            version: WEB_VITALS_VERSION,
            lastUpdated: Date.now(),
          };
        }
      } catch (_parseError) {
        // Invalid JSON, reset
        vitalsData = {
          metrics: [],
          version: WEB_VITALS_VERSION,
          lastUpdated: Date.now(),
        };
      }
    } else {
      vitalsData = {
        metrics: [],
        version: WEB_VITALS_VERSION,
        lastUpdated: Date.now(),
      };
    }

    // Add new metric with timestamp and pathname
    vitalsData.metrics.push({
      ...metric,
      timestamp: Date.now(),
      pathname,
    });

    // Keep only last N metrics to prevent storage bloat
    if (vitalsData.metrics.length > MAX_METRICS_STORED) {
      vitalsData.metrics = vitalsData.metrics.slice(-MAX_METRICS_STORED);
    }

    vitalsData.lastUpdated = Date.now();

    // Save back to localStorage
    globalThis.localStorage.setItem(
      WEB_VITALS_KEY,
      JSON.stringify(vitalsData),
    );

    return true;
  } catch (error) {
    console.error("[WebVitals] Failed to save metric:", error);
    return false;
  }
}

/**
 * Load all stored web vitals metrics
 */
export function loadWebVitals(): StoredWebVitals | null {
  try {
    if (typeof globalThis.localStorage === "undefined") {
      return null;
    }

    const stored = globalThis.localStorage.getItem(WEB_VITALS_KEY);
    if (!stored) {
      return null;
    }

    const vitalsData: StoredWebVitals = JSON.parse(stored);

    // Validate version
    if (vitalsData.version !== WEB_VITALS_VERSION) {
      clearWebVitals();
      return null;
    }

    return vitalsData;
  } catch (error) {
    console.error("[WebVitals] Failed to load metrics:", error);
    clearWebVitals();
    return null;
  }
}

/**
 * Clear all stored web vitals metrics
 */
export function clearWebVitals(): void {
  try {
    if (typeof globalThis.localStorage === "undefined") {
      return;
    }

    globalThis.localStorage.removeItem(WEB_VITALS_KEY);
  } catch (error) {
    console.error("[WebVitals] Failed to clear metrics:", error);
  }
}

/**
 * Get metrics for a specific page
 */
export function getMetricsForPage(pathname: string): WebVitalMetric[] {
  const vitalsData = loadWebVitals();
  if (!vitalsData) {
    return [];
  }

  return vitalsData.metrics
    .filter((m) => m.pathname === pathname)
    .map(({ timestamp: _timestamp, pathname: _pathname, ...metric }) => metric);
}

/**
 * Get average metric value for a specific metric type and page
 */
export function getAverageMetric(
  name: WebVitalMetric["name"],
  pathname?: string,
): number | null {
  const vitalsData = loadWebVitals();
  if (!vitalsData) {
    return null;
  }

  const filteredMetrics = pathname
    ? vitalsData.metrics.filter((m) =>
      m.name === name && m.pathname === pathname
    )
    : vitalsData.metrics.filter((m) => m.name === name);

  if (filteredMetrics.length === 0) {
    return null;
  }

  const sum = filteredMetrics.reduce((acc, m) => acc + m.value, 0);
  return sum / filteredMetrics.length;
}

/**
 * Log metric to console (dev mode)
 */
export function logMetricToConsole(metric: WebVitalMetric): void {
  const color = getMetricColor(metric.rating);
  const emoji = getMetricEmoji(metric.rating);
  const formattedValue = formatMetricValue(metric.name, metric.value);
  const pathname = typeof globalThis.location !== "undefined"
    ? globalThis.location.pathname
    : "/";

  console.log(
    `%c${emoji} ${metric.name}: ${formattedValue} (${metric.rating})%c on ${pathname}`,
    `color: ${color}; font-weight: bold; font-size: 12px;`,
    "color: inherit; font-weight: normal;",
  );

  // Log additional details in collapsed group
  console.groupCollapsed(`${metric.name} details`);
  console.log("Value:", metric.value);
  console.log("Rating:", metric.rating);
  console.log("Delta:", metric.delta);
  console.log("ID:", metric.id);
  if (metric.navigationType) {
    console.log("Navigation Type:", metric.navigationType);
  }
  console.log("Pathname:", pathname);
  console.log("Timestamp:", new Date().toISOString());
  console.groupEnd();
}

/**
 * Report metric to analytics endpoint (production mode)
 * TODO: Implement actual analytics integration (e.g., Google Analytics 4, custom endpoint)
 */
export function reportMetricToAnalytics(metric: WebVitalMetric): void {
  // Placeholder for analytics integration
  // Example: Send to Google Analytics 4
  // gtag('event', metric.name, {
  //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
  //   event_category: 'Web Vitals',
  //   event_label: metric.id,
  //   non_interaction: true,
  // });

  console.debug("[WebVitals] Analytics reporting placeholder:", {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
  });
}

/**
 * Check if running in development mode
 */
export function isDevelopmentMode(): boolean {
  // Check common development indicators
  if (typeof globalThis.location === "undefined") {
    return false;
  }

  const hostname = globalThis.location.hostname;
  return hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.endsWith(".local");
}
