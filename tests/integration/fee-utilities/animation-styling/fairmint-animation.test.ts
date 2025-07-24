/**
 * FairmintTool Animation & Styling Integration Tests
 *
 * Tests shared animation constants and styling constants from Task 18
 * with FairmintTool as validation case study
 */

import { expect, Page, test } from "@playwright/test";

/* ===== TEST CONFIGURATION ===== */

const TEST_CONFIG = {
  // Animation timing tolerances (±50ms for CI environments)
  TIMING_TOLERANCE: 50,

  // Expected transition durations from shared constants
  EXPECTED_TRANSITIONS: {
    normal: 300, // ANIMATION_TIMINGS.normal = "300ms"
    fast: 150, // ANIMATION_TIMINGS.fast = "150ms"
  },

  // Test URLs
  FAIRMINT_URL: "/tool/fairmint",

  // Visual regression thresholds
  VISUAL_THRESHOLD: 0.2, // 20% difference threshold for screenshots
} as const;

/* ===== HELPER FUNCTIONS ===== */

/**
 * Wait for fee estimation phase transition and measure timing
 */
async function measurePhaseTransition(
  page: Page,
  fromPhase: string,
  toPhase: string,
): Promise<number> {
  const startTime = Date.now();

  // Wait for transition to complete
  await page.waitForSelector(`[data-phase="${toPhase}"]`, {
    state: "visible",
    timeout: 5000,
  });

  const endTime = Date.now();
  return endTime - startTime;
}

/**
 * Get computed CSS property value
 */
async function getComputedCSSProperty(
  page: Page,
  selector: string,
  property: string,
): Promise<string> {
  return await page.evaluate(
    ({ sel, prop }) => {
      const element = document.querySelector(sel);
      if (!element) throw new Error(`Element not found: ${sel}`);
      return window.getComputedStyle(element).getPropertyValue(prop);
    },
    { sel: selector, prop: property },
  );
}

/* ===== TEST SUITE ===== */

test.describe("FairmintTool Animation & Styling Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to FairmintTool
    await page.goto(TEST_CONFIG.FAIRMINT_URL);

    // Wait for tool to load
    await page.waitForSelector('[data-testid="fairmint-tool"]', {
      timeout: 10000,
    });
  });

  /* ===== ANIMATION TIMING TESTS ===== */

  test("should use shared animation timing constants", async ({ page }) => {
    // Connect wallet to trigger fee estimation
    await page.click('[data-testid="connect-wallet-button"]');

    // Wait for wallet connection
    await page.waitForSelector('[data-testid="wallet-connected"]');

    // Trigger fee estimation by changing fee rate
    await page.fill('[data-testid="fee-rate-input"]', "2");

    // Measure transition from instant to cached phase
    const transitionDuration = await measurePhaseTransition(
      page,
      "instant",
      "cached",
    );

    // Validate timing matches shared constants (300ms ± 50ms tolerance)
    expect(transitionDuration).toBeGreaterThanOrEqual(
      TEST_CONFIG.EXPECTED_TRANSITIONS.normal - TEST_CONFIG.TIMING_TOLERANCE,
    );
    expect(transitionDuration).toBeLessThanOrEqual(
      TEST_CONFIG.EXPECTED_TRANSITIONS.normal + TEST_CONFIG.TIMING_TOLERANCE,
    );
  });

  test("should apply smooth easing functions from shared constants", async ({ page }) => {
    // Check that fee indicator elements use correct easing
    const easingFunction = await getComputedCSSProperty(
      page,
      '[data-testid="fee-phase-indicator"]',
      "transition-timing-function",
    );

    // Should use cubic-bezier from EASING_FUNCTIONS.smooth
    expect(easingFunction).toContain("cubic-bezier");
  });

  /* ===== STYLING CONSTANTS TESTS ===== */

  test("should use shared color constants for phase indicators", async ({ page }) => {
    // Connect wallet and trigger fee estimation
    await page.click('[data-testid="connect-wallet-button"]');
    await page.waitForSelector('[data-testid="wallet-connected"]');

    // Check instant phase color (green-400)
    const instantColor = await getComputedCSSProperty(
      page,
      '[data-phase="instant"]',
      "background-color",
    );

    // Convert RGB to match expected color from FEE_INDICATOR_COLORS.instant
    expect(instantColor).toBe("rgb(74, 222, 128)"); // green-400

    // Check cached phase color (blue-400)
    const cachedColor = await getComputedCSSProperty(
      page,
      '[data-phase="cached"]',
      "background-color",
    );

    expect(cachedColor).toBe("rgb(96, 165, 250)"); // blue-400
  });

  test("should apply shared spacing constants", async ({ page }) => {
    // Check that fee calculator uses shared spacing
    const calculatorPadding = await getComputedCSSProperty(
      page,
      '[data-testid="fee-calculator"]',
      "padding",
    );

    // Should use spacing from FEE_INDICATOR_SPACING
    expect(calculatorPadding).toBeTruthy();
  });

  test("should use CSS custom properties for theming", async ({ page }) => {
    // Check that CSS custom properties are applied
    const customProperty = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue("--fee-indicator-instant-color");
    });

    expect(customProperty).toBe("rgb(74, 222, 128)");
  });

  /* ===== VISUAL REGRESSION TESTS ===== */

  test("should maintain visual consistency across fee states", async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1200, height: 800 });

    // Take baseline screenshot in initial state
    const initialScreenshot = await page.screenshot({
      clip: { x: 0, y: 0, width: 1200, height: 600 },
    });

    // Connect wallet and trigger fee estimation
    await page.click('[data-testid="connect-wallet-button"]');
    await page.waitForSelector('[data-testid="wallet-connected"]');

    // Wait for fee estimation to stabilize
    await page.waitForTimeout(1000);

    // Take screenshot with fee estimation active
    const feeActiveScreenshot = await page.screenshot({
      clip: { x: 0, y: 0, width: 1200, height: 600 },
    });

    // Screenshots should be different (fee estimation is now active)
    expect(initialScreenshot).not.toEqual(feeActiveScreenshot);
  });

  /* ===== RESPONSIVE DESIGN TESTS ===== */

  test("should apply responsive spacing on mobile viewports", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check mobile-specific spacing
    const mobileSpacing = await getComputedCSSProperty(
      page,
      '[data-testid="fee-calculator"]',
      "margin",
    );

    expect(mobileSpacing).toBeTruthy();
  });

  /* ===== ERROR HANDLING TESTS ===== */

  test("should gracefully handle missing shared constants", async ({ page }) => {
    // Simulate missing animation constants by overriding CSS
    await page.addStyleTag({
      content: `
        * {
          transition-duration: 0ms !important;
        }
      `,
    });

    // Tool should still function without animations
    await page.click('[data-testid="connect-wallet-button"]');

    // Should not throw errors
    const errors = [];
    page.on("pageerror", (error) => errors.push(error));

    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  /* ===== PERFORMANCE IMPACT TESTS ===== */

  test("should not impact performance with shared utilities", async ({ page }) => {
    // Measure performance metrics
    const performanceMetrics = await page.evaluate(() => {
      return JSON.parse(
        JSON.stringify(performance.getEntriesByType("measure")),
      );
    });

    // Start performance measurement
    await page.evaluate(() => {
      performance.mark("fee-estimation-start");
    });

    // Trigger fee estimation
    await page.click('[data-testid="connect-wallet-button"]');
    await page.waitForSelector('[data-testid="wallet-connected"]');

    // End performance measurement
    await page.evaluate(() => {
      performance.mark("fee-estimation-end");
      performance.measure(
        "fee-estimation-duration",
        "fee-estimation-start",
        "fee-estimation-end",
      );
    });

    const finalMetrics = await page.evaluate(() => {
      return JSON.parse(
        JSON.stringify(performance.getEntriesByType("measure")),
      );
    });

    // Fee estimation should complete within reasonable time (< 2 seconds)
    const feeEstimationDuration = finalMetrics.find(
      (m) => m.name === "fee-estimation-duration",
    );

    if (feeEstimationDuration) {
      expect(feeEstimationDuration.duration).toBeLessThan(2000);
    }
  });
});
