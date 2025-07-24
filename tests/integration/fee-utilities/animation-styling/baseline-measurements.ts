/**
 * Baseline Measurements for Fee Utilities Integration Testing
 *
 * Utilities for capturing and comparing performance baselines
 * before and after shared utility integration
 */

import { Page } from "@playwright/test";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

/* ===== TYPES ===== */

interface PerformanceBaseline {
  toolName: string;
  timestamp: string;
  metrics: {
    renderTime: number;
    memoryUsage: number;
    animationDuration: number;
    cssLoadTime: number;
    interactionDelay: number;
  };
  environment: {
    viewport: { width: number; height: number };
    userAgent: string;
    timestamp: number;
  };
}

interface ComparisonResult {
  toolName: string;
  baseline: PerformanceBaseline;
  current: PerformanceBaseline;
  differences: {
    renderTime: { value: number; percentage: number };
    memoryUsage: { value: number; percentage: number };
    animationDuration: { value: number; percentage: number };
    cssLoadTime: { value: number; percentage: number };
    interactionDelay: { value: number; percentage: number };
  };
  regressionDetected: boolean;
  summary: string;
}

/* ===== CONSTANTS ===== */

const BASELINE_DIR = join(process.cwd(), "tests", "baselines", "fee-utilities");
const REGRESSION_THRESHOLD = 0.05; // 5% performance degradation threshold

/* ===== BASELINE MEASUREMENT UTILITIES ===== */

export class BaselineMeasurements {
  /**
   * Capture comprehensive performance baseline for a tool
   */
  static async captureBaseline(
    page: Page,
    toolName: string,
    toolUrl: string,
  ): Promise<PerformanceBaseline> {
    // Navigate to tool and wait for load
    await page.goto(toolUrl);
    await page.waitForLoadState("networkidle");

    // Start performance measurements
    await page.evaluate(() => {
      performance.mark("baseline-start");
    });

    // Measure render time
    const renderTime = await this.measureRenderTime(page);

    // Measure memory usage
    const memoryUsage = await this.measureMemoryUsage(page);

    // Measure animation duration
    const animationDuration = await this.measureAnimationDuration(page);

    // Measure CSS load time
    const cssLoadTime = await this.measureCSSLoadTime(page);

    // Measure interaction delay
    const interactionDelay = await this.measureInteractionDelay(page);

    // Get environment info
    const viewport = page.viewportSize() || { width: 1200, height: 800 };
    const userAgent = await page.evaluate(() => navigator.userAgent);

    const baseline: PerformanceBaseline = {
      toolName,
      timestamp: new Date().toISOString(),
      metrics: {
        renderTime,
        memoryUsage,
        animationDuration,
        cssLoadTime,
        interactionDelay,
      },
      environment: {
        viewport,
        userAgent,
        timestamp: Date.now(),
      },
    };

    // Save baseline to file
    await this.saveBaseline(baseline);

    return baseline;
  }

  /**
   * Compare current performance against saved baseline
   */
  static async compareAgainstBaseline(
    page: Page,
    toolName: string,
    toolUrl: string,
  ): Promise<ComparisonResult> {
    // Load existing baseline
    const baseline = await this.loadBaseline(toolName);
    if (!baseline) {
      throw new Error(`No baseline found for tool: ${toolName}`);
    }

    // Capture current performance
    const current = await this.captureBaseline(page, toolName, toolUrl);

    // Calculate differences
    const differences = {
      renderTime: this.calculateDifference(
        baseline.metrics.renderTime,
        current.metrics.renderTime,
      ),
      memoryUsage: this.calculateDifference(
        baseline.metrics.memoryUsage,
        current.metrics.memoryUsage,
      ),
      animationDuration: this.calculateDifference(
        baseline.metrics.animationDuration,
        current.metrics.animationDuration,
      ),
      cssLoadTime: this.calculateDifference(
        baseline.metrics.cssLoadTime,
        current.metrics.cssLoadTime,
      ),
      interactionDelay: this.calculateDifference(
        baseline.metrics.interactionDelay,
        current.metrics.interactionDelay,
      ),
    };

    // Detect regression
    const regressionDetected = Object.values(differences).some(
      (diff) => diff.percentage > REGRESSION_THRESHOLD,
    );

    // Generate summary
    const summary = this.generateSummary(differences, regressionDetected);

    return {
      toolName,
      baseline,
      current,
      differences,
      regressionDetected,
      summary,
    };
  }

  /* ===== MEASUREMENT METHODS ===== */

  private static async measureRenderTime(page: Page): Promise<number> {
    return await page.evaluate(() => {
      performance.mark("render-start");

      // Force reflow to measure actual render time
      document.body.offsetHeight;

      performance.mark("render-end");
      performance.measure("render-duration", "render-start", "render-end");

      const measure = performance.getEntriesByName("render-duration")[0];
      return measure ? measure.duration : 0;
    });
  }

  private static async measureMemoryUsage(page: Page): Promise<number> {
    return await page.evaluate(() => {
      // @ts-ignore - performance.memory is Chrome-specific
      if (performance.memory) {
        // @ts-ignore
        return performance.memory.usedJSHeapSize;
      }
      return 0;
    });
  }

  private static async measureAnimationDuration(page: Page): Promise<number> {
    return await page.evaluate(() => {
      // Look for CSS transitions and animations
      const elements = document.querySelectorAll("*");
      let maxDuration = 0;

      elements.forEach((el) => {
        const computed = window.getComputedStyle(el);
        const transitionDuration = parseFloat(computed.transitionDuration) *
          1000;
        const animationDuration = parseFloat(computed.animationDuration) * 1000;

        maxDuration = Math.max(
          maxDuration,
          transitionDuration,
          animationDuration,
        );
      });

      return maxDuration;
    });
  }

  private static async measureCSSLoadTime(page: Page): Promise<number> {
    return await page.evaluate(() => {
      const cssResources = performance.getEntriesByType("resource")
        .filter((entry) => entry.name.includes(".css"));

      if (cssResources.length === 0) return 0;

      return cssResources.reduce((total, resource) => {
        return total + (resource.responseEnd - resource.requestStart);
      }, 0) / cssResources.length;
    });
  }

  private static async measureInteractionDelay(page: Page): Promise<number> {
    const startTime = Date.now();

    // Simulate user interaction
    try {
      await page.click("button", { timeout: 1000 });
    } catch {
      // Button might not exist, that's okay
    }

    const endTime = Date.now();
    return endTime - startTime;
  }

  /* ===== UTILITY METHODS ===== */

  private static calculateDifference(
    baseline: number,
    current: number,
  ): { value: number; percentage: number } {
    const value = current - baseline;
    const percentage = baseline > 0 ? Math.abs(value) / baseline : 0;

    return { value, percentage };
  }

  private static generateSummary(
    differences: ComparisonResult["differences"],
    regressionDetected: boolean,
  ): string {
    if (!regressionDetected) {
      return "✅ No performance regression detected. All metrics within acceptable thresholds.";
    }

    const regressions = Object.entries(differences)
      .filter(([_, diff]) => diff.percentage > REGRESSION_THRESHOLD)
      .map(([metric, diff]) =>
        `${metric}: +${(diff.percentage * 100).toFixed(1)}% (${
          diff.value.toFixed(2)
        }ms)`
      );

    return `⚠️ Performance regression detected:\n${regressions.join("\n")}`;
  }

  private static async saveBaseline(
    baseline: PerformanceBaseline,
  ): Promise<void> {
    const filename = `${baseline.toolName}-baseline.json`;
    const filepath = join(BASELINE_DIR, filename);

    // Ensure directory exists
    const fs = await import("fs");
    if (!fs.existsSync(BASELINE_DIR)) {
      fs.mkdirSync(BASELINE_DIR, { recursive: true });
    }

    writeFileSync(filepath, JSON.stringify(baseline, null, 2));
  }

  private static async loadBaseline(
    toolName: string,
  ): Promise<PerformanceBaseline | null> {
    const filename = `${toolName}-baseline.json`;
    const filepath = join(BASELINE_DIR, filename);

    if (!existsSync(filepath)) {
      return null;
    }

    const content = readFileSync(filepath, "utf-8");
    return JSON.parse(content);
  }
}

/* ===== EXPORT UTILITIES ===== */

export const baselineUtils = {
  capture: BaselineMeasurements.captureBaseline,
  compare: BaselineMeasurements.compareAgainstBaseline,
  REGRESSION_THRESHOLD,
  BASELINE_DIR,
};
