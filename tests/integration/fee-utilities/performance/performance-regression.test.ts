/**
 * Performance Regression Tests for Shared Fee Utilities
 *
 * Validates that shared utilities don't introduce performance degradation >5%
 * Tests memory usage, rendering times, and overall system performance
 */

import { expect, test } from "@playwright/test";
import {
  capturePerformanceBaseline,
  PerformanceBaseline,
} from "../animation-styling/baseline-measurements.ts";

/* ===== TEST CONFIGURATION ===== */

const PERFORMANCE_CONFIG = {
  // Maximum acceptable performance degradation
  MAX_DEGRADATION_PERCENT: 5,

  // Tools to test for performance impact
  TEST_TOOLS: [
    {
      name: "FairmintTool",
      url: "/tool/fairmint",
      selector: "[data-testid='fairmint-tool']",
      hasSharedUtilities: true, // After integration
    },
    {
      name: "SRC101RegisterTool",
      url: "/tool/src101",
      selector: "[data-testid='register-tool']",
      hasSharedUtilities: true, // After integration
    },
    {
      name: "StampingTool",
      url: "/tool/stamp/create",
      selector: "[data-testid='stamping-tool']",
      hasSharedUtilities: false, // Control group
    },
  ],

  // Performance metrics to track
  METRICS: [
    "renderTime",
    "memoryUsage",
    "animationDuration",
    "cssLoadTime",
    "interactionDelay",
  ],

  // Test scenarios
  SCENARIOS: [
    "initial_load",
    "fee_estimation_trigger",
    "animation_transitions",
    "memory_stress_test",
  ],
};

/* ===== PERFORMANCE REGRESSION TESTS ===== */

test.describe("Performance Regression Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cache and reset performance state
    await page.evaluate(() => {
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }

      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();

      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }
    });
  });

  /* ===== BASELINE PERFORMANCE CAPTURE ===== */

  test("Capture performance baselines for all tools", async ({ page }) => {
    const baselines = new Map<string, PerformanceBaseline>();

    for (const tool of PERFORMANCE_CONFIG.TEST_TOOLS) {
      await page.goto(tool.url);
      await page.waitForSelector(tool.selector, { timeout: 10000 });

      // Capture baseline metrics
      const baseline = await capturePerformanceBaseline(page, tool.name);
      baselines.set(tool.name, baseline);

      // Validate baseline is reasonable
      expect(baseline.metrics.renderTime).toBeLessThan(2000); // 2s max
      expect(baseline.metrics.memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB max
      expect(baseline.metrics.animationDuration).toBeLessThan(1000); // 1s max
    }

    // Store baselines for comparison tests
    await page.evaluate((baselines) => {
      window.performanceBaselines = baselines;
    }, Object.fromEntries(baselines));
  });

  /* ===== RENDERING PERFORMANCE TESTS ===== */

  test("Validate rendering time performance", async ({ page }) => {
    for (const tool of PERFORMANCE_CONFIG.TEST_TOOLS) {
      await test.step(`Test ${tool.name} rendering performance`, async () => {
        // Measure rendering time
        const startTime = Date.now();
        await page.goto(tool.url);
        await page.waitForSelector(tool.selector);
        const renderTime = Date.now() - startTime;

        // Get baseline for comparison
        const baseline = await page.evaluate((toolName) => {
          return window.performanceBaselines?.[toolName];
        }, tool.name) as PerformanceBaseline;

        if (baseline) {
          const degradation =
            ((renderTime - baseline.metrics.renderTime) /
              baseline.metrics.renderTime) * 100;

          expect(degradation).toBeLessThan(
            PERFORMANCE_CONFIG.MAX_DEGRADATION_PERCENT,
          );

          console.log(
            `${tool.name} rendering: ${renderTime}ms (baseline: ${baseline.metrics.renderTime}ms, degradation: ${
              degradation.toFixed(2)
            }%)`,
          );
        }
      });
    }
  });

  /* ===== MEMORY USAGE TESTS ===== */

  test("Validate memory usage performance", async ({ page }) => {
    for (const tool of PERFORMANCE_CONFIG.TEST_TOOLS) {
      await test.step(`Test ${tool.name} memory usage`, async () => {
        await page.goto(tool.url);
        await page.waitForSelector(tool.selector);

        // Measure memory usage
        const memoryUsage = await page.evaluate(() => {
          if (performance.memory) {
            return {
              used: performance.memory.usedJSHeapSize,
              total: performance.memory.totalJSHeapSize,
              limit: performance.memory.jsHeapSizeLimit,
            };
          }
          return { used: 0, total: 0, limit: 0 };
        });

        // Get baseline for comparison
        const baseline = await page.evaluate((toolName) => {
          return window.performanceBaselines?.[toolName];
        }, tool.name) as PerformanceBaseline;

        if (baseline && memoryUsage.used > 0) {
          const degradation =
            ((memoryUsage.used - baseline.metrics.memoryUsage) /
              baseline.metrics.memoryUsage) * 100;

          expect(degradation).toBeLessThan(
            PERFORMANCE_CONFIG.MAX_DEGRADATION_PERCENT,
          );

          console.log(
            `${tool.name} memory: ${
              (memoryUsage.used / 1024 / 1024).toFixed(2)
            }MB (baseline: ${
              (baseline.metrics.memoryUsage / 1024 / 1024).toFixed(2)
            }MB, degradation: ${degradation.toFixed(2)}%)`,
          );
        }
      });
    }
  });

  /* ===== ANIMATION PERFORMANCE TESTS ===== */

  test("Validate animation performance", async ({ page }) => {
    for (const tool of PERFORMANCE_CONFIG.TEST_TOOLS) {
      if (!tool.hasSharedUtilities) continue; // Skip control group

      await test.step(`Test ${tool.name} animation performance`, async () => {
        await page.goto(tool.url);
        await page.waitForSelector(tool.selector);

        // Trigger fee estimation to start animations
        await page.fill('input[name="fee"]', "10");

        // Measure animation performance
        const animationMetrics = await page.evaluate(() => {
          return new Promise((resolve) => {
            const startTime = performance.now();
            let animationCount = 0;

            // Monitor for animation events
            const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                if (
                  mutation.type === "attributes" &&
                  (mutation.attributeName === "class" ||
                    mutation.attributeName === "style")
                ) {
                  animationCount++;
                }
              });
            });

            observer.observe(document.body, {
              attributes: true,
              subtree: true,
              attributeFilter: ["class", "style"],
            });

            // Stop monitoring after 2 seconds
            setTimeout(() => {
              observer.disconnect();
              resolve({
                duration: performance.now() - startTime,
                animationCount,
              });
            }, 2000);
          });
        });

        const metrics = animationMetrics as {
          duration: number;
          animationCount: number;
        };

        // Validate animation performance
        expect(metrics.duration).toBeLessThan(2000); // Should complete within 2s
        expect(metrics.animationCount).toBeGreaterThan(0); // Should have animations

        console.log(
          `${tool.name} animations: ${metrics.animationCount} changes in ${
            metrics.duration.toFixed(2)
          }ms`,
        );
      });
    }
  });

  /* ===== MEMORY LEAK DETECTION ===== */

  test("Detect memory leaks in long-running sessions", async ({ page }) => {
    for (const tool of PERFORMANCE_CONFIG.TEST_TOOLS) {
      if (!tool.hasSharedUtilities) continue; // Skip control group

      await test.step(`Test ${tool.name} for memory leaks`, async () => {
        await page.goto(tool.url);
        await page.waitForSelector(tool.selector);

        // Capture initial memory
        const initialMemory = await page.evaluate(() => {
          return performance.memory ? performance.memory.usedJSHeapSize : 0;
        });

        // Simulate long-running session with repeated fee estimations
        for (let i = 0; i < 20; i++) {
          await page.fill('input[name="fee"]', String(5 + i));
          await page.waitForTimeout(100); // Brief pause between estimations
        }

        // Force garbage collection
        await page.evaluate(() => {
          if (window.gc) {
            window.gc();
          }
        });

        await page.waitForTimeout(1000); // Wait for GC

        // Capture final memory
        const finalMemory = await page.evaluate(() => {
          return performance.memory ? performance.memory.usedJSHeapSize : 0;
        });

        if (initialMemory > 0 && finalMemory > 0) {
          const memoryGrowth = finalMemory - initialMemory;
          const memoryGrowthMB = memoryGrowth / 1024 / 1024;

          // Should not grow more than 10MB in a session
          expect(memoryGrowthMB).toBeLessThan(10);

          console.log(
            `${tool.name} memory growth: ${memoryGrowthMB.toFixed(2)}MB`,
          );
        }
      });
    }
  });

  /* ===== CONCURRENT ESTIMATION PERFORMANCE ===== */

  test("Validate concurrent fee estimation performance", async ({ page }) => {
    await page.goto("/tool/stamp/create");
    await page.waitForSelector("[data-testid='stamping-tool']");

    // Test concurrent fee estimations
    const startTime = Date.now();

    // Simulate rapid fee rate changes (concurrent estimations)
    const promises = [];
    for (let i = 1; i <= 10; i++) {
      promises.push(
        page.fill('input[name="fee"]', String(i * 5)).then(() =>
          page.waitForTimeout(50) // Small delay between changes
        ),
      );
    }

    await Promise.all(promises);

    // Wait for all estimations to complete
    await page.waitForTimeout(2000);

    const totalTime = Date.now() - startTime;

    // Should handle 10 concurrent estimations within 5 seconds
    expect(totalTime).toBeLessThan(5000);

    console.log(`Concurrent estimations completed in ${totalTime}ms`);
  });

  /* ===== CSS PERFORMANCE TESTS ===== */

  test("Validate CSS custom properties performance", async ({ page }) => {
    for (const tool of PERFORMANCE_CONFIG.TEST_TOOLS) {
      if (!tool.hasSharedUtilities) continue;

      await test.step(`Test ${tool.name} CSS performance`, async () => {
        await page.goto(tool.url);
        await page.waitForSelector(tool.selector);

        // Measure CSS custom properties application time
        const cssMetrics = await page.evaluate(() => {
          const startTime = performance.now();

          // Count CSS custom properties
          const computedStyle = getComputedStyle(document.documentElement);
          let customPropsCount = 0;

          for (let i = 0; i < computedStyle.length; i++) {
            const prop = computedStyle[i];
            if (prop.startsWith("--fee-indicator")) {
              customPropsCount++;
            }
          }

          const endTime = performance.now();

          return {
            duration: endTime - startTime,
            customPropsCount,
          };
        });

        // Should have custom properties and apply quickly
        expect(cssMetrics.customPropsCount).toBeGreaterThan(0);
        expect(cssMetrics.duration).toBeLessThan(100); // Should apply within 100ms

        console.log(
          `${tool.name} CSS: ${cssMetrics.customPropsCount} custom properties applied in ${
            cssMetrics.duration.toFixed(2)
          }ms`,
        );
      });
    }
  });
});
