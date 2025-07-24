/**
 * FairmintTool Shared Constants Validation Tests
 *
 * Tests that FairmintTool correctly imports and uses shared animation/styling constants
 * Part of Task 22.1 validation
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

// Import shared constants that FairmintTool should be using
import {
  ANIMATION_TIMINGS,
  EASING_FUNCTIONS,
} from "$lib/components/fee-indicators/AnimationConstants.ts";
import {
  FEE_INDICATOR_COLORS,
  FEE_INDICATOR_SPACING,
} from "$lib/components/fee-indicators/StyleConstants.ts";

/* ===== SHARED CONSTANTS VALIDATION ===== */

describe("FairmintTool Shared Constants Integration", () => {
  it("should have access to animation timing constants", () => {
    // Verify animation constants are properly exported and accessible
    assertExists(ANIMATION_TIMINGS);
    assertEquals(ANIMATION_TIMINGS.normal, "300ms");
    assertEquals(ANIMATION_TIMINGS.fast, "150ms");
    assertEquals(ANIMATION_TIMINGS.slow, "600ms");
    assertEquals(ANIMATION_TIMINGS.pulse, "2s");
    assertEquals(ANIMATION_TIMINGS.ping, "1s");
  });

  it("should have access to easing function constants", () => {
    // Verify easing functions are properly exported
    assertExists(EASING_FUNCTIONS);
    assertEquals(EASING_FUNCTIONS.ease, "ease");
    assertEquals(EASING_FUNCTIONS.easeInOut, "cubic-bezier(0.4, 0, 0.2, 1)");
    assertEquals(
      EASING_FUNCTIONS.spring,
      "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    );
    assertEquals(EASING_FUNCTIONS.linear, "linear");
  });

  it("should have access to fee indicator color constants", () => {
    // Verify color constants match StampingTool implementation
    assertExists(FEE_INDICATOR_COLORS);
    assertEquals(FEE_INDICATOR_COLORS.instant, "rgb(74, 222, 128)"); // green-400
    assertEquals(FEE_INDICATOR_COLORS.cached, "rgb(96, 165, 250)"); // blue-400
    assertEquals(FEE_INDICATOR_COLORS.exact, "rgb(251, 146, 60)"); // orange-400
    assertEquals(FEE_INDICATOR_COLORS.success, "rgb(34, 197, 94)"); // green-500
    assertEquals(FEE_INDICATOR_COLORS.error, "rgb(239, 68, 68)"); // red-500
    assertEquals(FEE_INDICATOR_COLORS.loading, "rgb(156, 163, 175)"); // gray-400
  });

  it("should have access to spacing constants", () => {
    // Verify spacing constants are available
    assertExists(FEE_INDICATOR_SPACING);
    // Spacing is now an object with indicator, gap, padding, fontSize
    assertEquals(FEE_INDICATOR_SPACING.sm.indicator, "0.25rem"); // w-1 h-1
    assertEquals(FEE_INDICATOR_SPACING.sm.gap, "0.25rem"); // gap-1
    assertEquals(FEE_INDICATOR_SPACING.sm.padding, "0.5rem"); // p-2

    assertEquals(FEE_INDICATOR_SPACING.md.indicator, "0.375rem"); // w-1.5 h-1.5
    assertEquals(FEE_INDICATOR_SPACING.md.gap, "0.5rem"); // gap-2
    assertEquals(FEE_INDICATOR_SPACING.md.padding, "0.75rem"); // p-3

    assertEquals(FEE_INDICATOR_SPACING.lg.indicator, "0.5rem"); // w-2 h-2
    assertEquals(FEE_INDICATOR_SPACING.lg.gap, "0.75rem"); // gap-3
    assertEquals(FEE_INDICATOR_SPACING.lg.padding, "1rem"); // p-4
  });
});

/* ===== FAIRMINT TOOL IMPLEMENTATION VALIDATION ===== */

describe("FairmintTool Implementation Validation", () => {
  it("should validate FairmintTool uses shared constants correctly", async () => {
    // Read the FairmintTool source to verify it imports shared constants
    const fairmintToolPath =
      "../../../../islands/tool/fairmint/FairmintTool.tsx";

    try {
      const fairmintContent = await Deno.readTextFile(fairmintToolPath);

      // Verify imports of shared constants
      const hasAnimationImport = fairmintContent.includes(
        'from "$lib/components/fee-indicators/AnimationConstants.ts"',
      );
      const hasStyleImport = fairmintContent.includes(
        'from "$lib/components/fee-indicators/StyleConstants.ts"',
      );

      assertEquals(
        hasAnimationImport,
        true,
        "FairmintTool should import animation constants",
      );
      assertEquals(
        hasStyleImport,
        true,
        "FairmintTool should import style constants",
      );

      // Verify usage of constants in the component
      const usesAnimationTiming = fairmintContent.includes(
        "ANIMATION_TIMINGS.normal",
      );
      const usesEasingFunction = fairmintContent.includes(
        "EASING_FUNCTIONS.easeInOut",
      );
      const usesColorConstants = fairmintContent.includes(
        "FEE_INDICATOR_COLORS.instant",
      );

      assertEquals(
        usesAnimationTiming,
        true,
        "FairmintTool should use animation timing constants",
      );
      assertEquals(
        usesEasingFunction,
        true,
        "FairmintTool should use easing function constants",
      );
      assertEquals(
        usesColorConstants,
        true,
        "FairmintTool should use color constants",
      );
    } catch (error) {
      throw new Error(`Failed to read FairmintTool source: ${error.message}`);
    }
  });

  it("should validate FairmintToolStyles component exists and uses shared utilities", async () => {
    // Verify the FairmintToolStyles component exists and uses shared utilities
    const stylesPath =
      "../../../../islands/tool/fairmint/FairmintToolStyles.tsx";

    try {
      const stylesContent = await Deno.readTextFile(stylesPath);

      // Verify it imports shared style utilities
      const hasStyleConstantsImport = stylesContent.includes(
        'from "$lib/components/fee-indicators/StyleConstants.ts"',
      );

      assertEquals(
        hasStyleConstantsImport,
        true,
        "FairmintToolStyles should import style constants",
      );

      // Verify it uses CSS custom properties generation
      const usesCSSGeneration = stylesContent.includes(
        "generateCSSCustomProperties",
      );
      const usesDefaultTheme = stylesContent.includes(
        "DEFAULT_FEE_INDICATOR_THEME",
      );

      assertEquals(
        usesCSSGeneration,
        true,
        "FairmintToolStyles should use CSS generation utilities",
      );
      assertEquals(
        usesDefaultTheme,
        true,
        "FairmintToolStyles should use default theme",
      );
    } catch (error) {
      throw new Error(
        `Failed to read FairmintToolStyles source: ${error.message}`,
      );
    }
  });

  it("should verify progressive fee estimation integration", async () => {
    // Verify FairmintTool integrates with progressive fee estimation
    const fairmintToolPath =
      "../../../../islands/tool/fairmint/FairmintTool.tsx";

    try {
      const fairmintContent = await Deno.readTextFile(fairmintToolPath);

      // Verify progressive fee estimation hook usage
      const usesProgressiveFeeHook = fairmintContent.includes(
        "useTransactionFeeEstimator",
      );
      const hasPhaseIndicators = fairmintContent.includes(
        'data-testid="fee-phase-indicator"',
      );
      const hasPhaseResults = fairmintContent.includes("phase1Result") &&
        fairmintContent.includes("phase2Result") &&
        fairmintContent.includes("phase3Result");

      assertEquals(
        usesProgressiveFeeHook,
        true,
        "FairmintTool should use progressive fee estimation hook",
      );
      assertEquals(
        hasPhaseIndicators,
        true,
        "FairmintTool should have phase indicators",
      );
      assertEquals(
        hasPhaseResults,
        true,
        "FairmintTool should use phase results",
      );
    } catch (error) {
      throw new Error(
        `Failed to validate progressive fee estimation integration: ${error.message}`,
      );
    }
  });
});

/* ===== INTEGRATION SUCCESS VALIDATION ===== */

describe("Task 22.1 Integration Success Criteria", () => {
  it("should meet all integration requirements", async () => {
    // This test validates that all Task 22.1 requirements are met

    // 1. Shared constants are accessible
    assertExists(ANIMATION_TIMINGS);
    assertExists(FEE_INDICATOR_COLORS);
    assertExists(FEE_INDICATOR_SPACING);
    assertExists(EASING_FUNCTIONS);

    // 2. Constants have expected values (matching StampingTool)
    assertEquals(ANIMATION_TIMINGS.normal, "300ms");
    assertEquals(FEE_INDICATOR_COLORS.instant, "rgb(74, 222, 128)");

    // 3. FairmintTool implementation uses shared utilities
    const fairmintContent = await Deno.readTextFile(
      "../../../../islands/tool/fairmint/FairmintTool.tsx",
    );
    const stylesContent = await Deno.readTextFile(
      "../../../../islands/tool/fairmint/FairmintToolStyles.tsx",
    );

    const hasRequiredImports = fairmintContent.includes("AnimationConstants") &&
      fairmintContent.includes("StyleConstants");
    const hasRequiredUsage = fairmintContent.includes("ANIMATION_TIMINGS") &&
      fairmintContent.includes("FEE_INDICATOR_COLORS");
    const hasStylesIntegration = stylesContent.includes(
      "generateCSSCustomProperties",
    );

    assertEquals(
      hasRequiredImports,
      true,
      "FairmintTool should import shared constants",
    );
    assertEquals(
      hasRequiredUsage,
      true,
      "FairmintTool should use shared constants",
    );
    assertEquals(
      hasStylesIntegration,
      true,
      "FairmintToolStyles should integrate with shared utilities",
    );

    console.log("✅ Task 22.1 Integration Success: All requirements met!");
  });
});
