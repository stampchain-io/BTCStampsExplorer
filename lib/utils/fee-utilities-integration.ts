/**
 * Fee Utilities Integration Helper
 *
 * One-stop integration point for all fee estimation utilities
 * Simplifies adoption of progressive fee estimation system
 *
 * @module utils/fee-utilities-integration
 */

// Re-export all fee mapping utilities
export * from "./fee-mapping-helpers.ts";
export * from "./fee-pattern-mappers.ts";

// Re-export phase indicator components
export {
  ActivePhaseIndicator,
  InlinePhaseIndicator,
  PhaseDot,
  PhaseIndicator,
  PhaseIndicatorSummary,
  PhaseStatusText,
  SimplePhaseIndicator,
} from "$lib/components/fee-indicators/PhaseIndicator.tsx";

// Re-export animation utilities
export { animationUtils } from "$lib/components/fee-indicators/AnimationUtilities.ts";

// Re-export style constants
export {
  buildContainerClasses,
  buildPhaseIndicatorClasses,
  FEE_INDICATOR_UTILITY_CLASSES,
  PHASE_CONFIGURATIONS,
} from "$lib/components/fee-indicators/StyleConstants.ts";

// Import types
import type { ProgressiveFeeEstimationResult } from "$lib/types/fee-estimation.ts";
import type { FeeEstimationPattern } from "./fee-pattern-mappers.ts";
import {
  detectRecommendedPattern,
  mapForComponentPattern,
  mapForInlinePattern,
  mapForPropsPattern,
} from "./fee-pattern-mappers.ts";

/**
 * Quick Integration Helper
 * Provides the minimal code needed to integrate progressive fee estimation
 */
export const QuickIntegration = {
  /**
   * For Inline Pattern (StampingTool-style)
   */
  forInlinePattern(hookResults: any) {
    return {
      // All hook results needed for custom implementation
      ...mapForInlinePattern(hookResults),

      // Helper to render inline indicators
      renderIndicators: () => {
        const {
          isPreFetching,
          isEstimating,
          phase1Result,
          phase2Result,
          phase3Result,
          currentPhase,
        } = hookResults;

        return {
          showPreFetching: isPreFetching,
          showExact: isEstimating,
          phase1Active: !!phase1Result,
          phase2Active: !!phase2Result,
          phase3Active: !!phase3Result,
          phaseText: getPhaseDisplayText(currentPhase),
        };
      },
    };
  },

  /**
   * For Component Pattern (Modal-style)
   */
  forComponentPattern(hookResults: any, wallet: any, isSubmitting: boolean) {
    const mapped = mapForComponentPattern(hookResults, !!wallet, isSubmitting);

    return {
      // Props for ProgressiveFeeStatusIndicator
      statusIndicatorProps: mapped.statusIndicatorProps,

      // Props for FeeCalculatorBase
      feeCalculatorProps: mapped.feeCalculatorProps,

      // Import statement to add
      importStatement:
        `import { ProgressiveFeeStatusIndicator } from "$components/fee/index.ts";`,

      // JSX to add
      jsxExample: `<ProgressiveFeeStatusIndicator {...statusIndicatorProps} />`,
    };
  },

  /**
   * For Props Pattern (Simple tools)
   */
  forPropsPattern(hookResults: any, includePhaseProps: boolean = true) {
    const mapped = mapForPropsPattern(hookResults, includePhaseProps);

    return {
      // All props to spread into FeeCalculatorBase
      feeCalculatorProps: mapped,

      // Minimal integration example
      integrationExample: includePhaseProps
        ? "Pass all phase props to FeeCalculatorBase"
        : "Just pass feeDetails to FeeCalculatorBase",
    };
  },
};

/**
 * Pattern Auto-Detector
 * Analyzes tool and recommends best pattern
 */
export function analyzeToolAndRecommendPattern(toolInfo: {
  componentName: string;
  hasFileUpload?: boolean;
  hasMultipleSteps?: boolean;
  isInModal?: boolean;
  hasCustomFeeUI?: boolean;
}): {
  recommendedPattern: FeeEstimationPattern;
  reason: string;
  integrationSteps: string[];
} {
  const pattern = detectRecommendedPattern({
    complexity: toolInfo.hasMultipleSteps ? "complex" : "simple",
    hasCustomUI: toolInfo.hasCustomFeeUI || false,
    isModal: toolInfo.isInModal || false,
    multipleOperations: toolInfo.hasMultipleSteps || false,
  });

  let reason = "";
  const integrationSteps: string[] = [];

  switch (pattern) {
    case "inline":
      reason = "Complex tool with custom UI needs full control over indicators";
      integrationSteps.push(
        "1. Add useTransactionFeeEstimator hook",
        "2. Use QuickIntegration.forInlinePattern()",
        "3. Create custom indicator JSX following StampingTool",
        "4. Add estimateExact() call before submission",
      );
      break;

    case "component":
      reason = "Modal interface benefits from standardized component";
      integrationSteps.push(
        "1. Add useTransactionFeeEstimator hook",
        "2. Use QuickIntegration.forComponentPattern()",
        "3. Add ProgressiveFeeStatusIndicator to modal",
        "4. Pass mapped props to FeeCalculatorBase",
      );
      break;

    case "props":
      reason = "Simple tool can leverage FeeCalculatorBase built-in display";
      integrationSteps.push(
        "1. Add useTransactionFeeEstimator hook",
        "2. Use QuickIntegration.forPropsPattern()",
        "3. Spread props into FeeCalculatorBase",
      );
      break;
  }

  return {
    recommendedPattern: pattern,
    reason,
    integrationSteps,
  };
}

/**
 * Migration Code Generator
 * Generates actual code snippets for migration
 */
export function generateMigrationCode(
  toolType: string,
  pattern: FeeEstimationPattern,
  existingProps?: {
    hasWallet?: boolean;
    hasSubmitState?: boolean;
    feeVariableName?: string;
  },
): {
  imports: string[];
  hookCode: string;
  componentCode: string;
  actionHandlerCode?: string;
} {
  const imports: string[] = [
    `import { useTransactionFeeEstimator } from "$lib/hooks/useTransactionFeeEstimator.ts";`,
  ];

  let hookCode = "";
  let componentCode = "";
  let actionHandlerCode = "";

  // Generate hook integration
  hookCode = `
const {
  feeDetails: progressiveFeeDetails,
  isEstimating,
  feeDetailsVersion,
  isPreFetching,
  estimateExact,
  phase1Result,
  phase2Result,
  phase3Result,
  currentPhase,
  error: feeEstimationError,
  clearError,
} = useTransactionFeeEstimator({
  toolType: "${toolType}",
  feeRate: isSubmitting ? 0 : ${existingProps?.feeVariableName || "fee"},
  ${existingProps?.hasWallet ? "walletAddress: wallet?.address," : ""}
  isConnected: ${
    existingProps?.hasWallet ? "!!wallet && !isSubmitting" : "true"
  },
  isSubmitting${existingProps?.hasSubmitState ? "" : ": false"},
});`;

  // Generate pattern-specific code
  switch (pattern) {
    case "inline":
      imports.push(
        `import { InlinePhaseIndicator } from "$lib/utils/fee-utilities-integration.ts";`,
      );
      componentCode = `
{/* Progressive Fee Estimation Status */}
<InlinePhaseIndicator
  currentPhase={currentPhase}
  phase1Result={phase1Result}
  phase2Result={phase2Result}
  phase3Result={phase3Result}
  isPreFetching={isPreFetching}
  isEstimating={isEstimating}
  isConnected={!!wallet}
  isSubmitting={isSubmitting}
  feeEstimationError={feeEstimationError}
  clearError={clearError}
/>`;
      actionHandlerCode = `
// Get exact fees before transaction
const exactFees = await estimateExact();`;
      break;

    case "component":
      imports.push(
        `import { ProgressiveFeeStatusIndicator } from "$components/fee/index.ts";`,
        `import { mapProgressiveFeeDetails } from "$lib/utils/fee-estimation-utils.ts";`,
      );
      componentCode = `
{/* Progressive Fee Status Indicator */}
<ProgressiveFeeStatusIndicator
  isConnected={!!wallet}
  isSubmitting={isSubmitting}
  currentPhase={currentPhase}
  phase1Result={phase1Result}
  phase2Result={phase2Result}
  phase3Result={phase3Result}
  isPreFetching={isPreFetching}
  feeEstimationError={feeEstimationError?.message || null}
  clearError={clearError}
/>

{/* Update FeeCalculatorBase props */}
<FeeCalculatorBase
  // ... existing props
  feeDetails={mapProgressiveFeeDetails(progressiveFeeDetails) || {
    minerFee: 0,
    dustValue: 0,
    totalValue: 0,
    hasExactFees: false,
    estimatedSize: 300,
  }}
/>`;
      break;

    case "props":
      imports.push(
        `import { mapProgressiveFeeDetails } from "$lib/utils/fee-estimation-utils.ts";`,
      );
      componentCode = `
{/* Update FeeCalculatorBase with progressive props */}
<FeeCalculatorBase
  // ... existing props
  feeDetails={mapProgressiveFeeDetails(progressiveFeeDetails) || {
    minerFee: 0,
    dustValue: 0,
    totalValue: 0,
    hasExactFees: false,
    estimatedSize: 300,
  }}
  // Optional: Include phase props for enhanced display
  phase1Result={phase1Result}
  phase2Result={phase2Result}
  phase3Result={phase3Result}
  currentPhase={currentPhase}
  isPreFetching={isPreFetching}
  isEstimating={isEstimating}
/>`;
      break;
  }

  return {
    imports,
    hookCode,
    componentCode,
    actionHandlerCode,
  };
}

/**
 * Helper function to get phase display text
 */
function getPhaseDisplayText(phase: "instant" | "cached" | "exact"): string {
  const displays = {
    instant: "⚡ Instant",
    cached: "💡 Smart",
    exact: "🎯 Exact",
  };
  return displays[phase];
}

/**
 * Validation helper to ensure proper integration
 */
export function validateIntegration(
  hookResults: any,
  pattern: FeeEstimationPattern,
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required hook results
  if (!hookResults.feeDetails) {
    warnings.push("No fee details available yet");
  }

  if (typeof hookResults.currentPhase !== "string") {
    errors.push("currentPhase is missing or invalid");
  }

  // Pattern-specific validation
  switch (pattern) {
    case "inline":
      if (typeof hookResults.estimateExact !== "function") {
        errors.push("estimateExact function not available");
      }
      break;

    case "component":
      if (
        !hookResults.phase1Result && !hookResults.phase2Result &&
        !hookResults.phase3Result
      ) {
        warnings.push("No phase results available yet");
      }
      break;

    case "props":
      // Props pattern has minimal requirements
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
