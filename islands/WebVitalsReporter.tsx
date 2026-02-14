import { useEffect } from "preact/hooks";
import {
  getMetricRating,
  isDevelopmentMode,
  logMetricToConsole,
  reportMetricToAnalytics,
  saveWebVital,
  type WebVitalMetric,
} from "$lib/utils/performance/webVitals.ts";

/**
 * Web Vitals Reporter Island
 * Initializes Real User Monitoring (RUM) for Core Web Vitals metrics
 * Reports LCP, FID/INP, CLS, FCP, TTFB to console (dev) and analytics (prod)
 *
 * This component runs client-side only and has minimal performance impact (<10ms)
 */
export default function WebVitalsReporter() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") {
      return;
    }

    let cleanup: (() => void) | undefined;

    // Dynamically import web-vitals library (lazy load to avoid blocking initial render)
    const initWebVitals = async () => {
      try {
        // Import web-vitals functions
        const webVitalsModule = await import(
          "https://esm.sh/web-vitals@4.2.4"
        );

        const { onCLS, onFID, onLCP, onFCP, onTTFB, onINP } = webVitalsModule;

        const isDevMode = isDevelopmentMode();

        /**
         * Generic metric handler
         * Processes all web vitals metrics consistently
         */
        const handleMetric = (metric: {
          name: string;
          value: number;
          delta: number;
          id: string;
          navigationType?: string;
        }) => {
          // Ensure metric name is valid
          if (
            !["CLS", "FID", "INP", "LCP", "FCP", "TTFB"].includes(metric.name)
          ) {
            console.warn(
              `[WebVitals] Unknown metric name: ${metric.name}`,
            );
            return;
          }

          // Calculate rating
          const rating = getMetricRating(
            metric.name as WebVitalMetric["name"],
            metric.value,
          );

          // Construct typed metric object
          const typedMetric: WebVitalMetric = {
            name: metric.name as WebVitalMetric["name"],
            value: metric.value,
            rating,
            delta: metric.delta,
            id: metric.id,
            ...(metric.navigationType &&
              { navigationType: metric.navigationType }),
          };

          // Save to localStorage
          saveWebVital(typedMetric);

          // Report based on environment
          if (isDevMode) {
            // Dev mode: log to console with color-coded thresholds
            logMetricToConsole(typedMetric);
          } else {
            // Production mode: send to analytics endpoint
            reportMetricToAnalytics(typedMetric);
          }
        };

        // Register metric observers
        // Each observer will call handleMetric when the metric is captured
        onCLS(handleMetric, { reportAllChanges: false });
        onFID(handleMetric);
        onLCP(handleMetric, { reportAllChanges: false });
        onFCP(handleMetric);
        onTTFB(handleMetric);

        // INP is the successor to FID (Chrome 96+)
        // Only available in newer browsers
        if (onINP) {
          onINP(handleMetric, { reportAllChanges: false });
        }

        console.debug(
          `[WebVitals] Monitoring initialized (mode: ${
            isDevMode ? "development" : "production"
          })`,
        );

        // Note: web-vitals library doesn't provide explicit cleanup functions
        // Observers are tied to the page lifecycle and clean up automatically
        cleanup = () => {
          console.debug("[WebVitals] Monitoring cleanup (no-op)");
        };
      } catch (error) {
        console.error("[WebVitals] Failed to initialize:", error);
      }
    };

    // Initialize web vitals monitoring
    initWebVitals();

    // Return cleanup function
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
