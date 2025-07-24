/**
 * Fee Pattern Mappers
 *
 * Pattern-specific mapping utilities for the three
 * progressive fee estimation architectural patterns
 *
 * @module utils/fee-pattern-mappers
 */

import type { ProgressiveFeeEstimationResult } from "$lib/types/fee-estimation.ts";
import { mapProgressiveFeeDetails } from "$lib/utils/fee-estimation-utils.ts";

/**
 * Inline Pattern Mapper
 * For complex tools like StampingTool with custom inline indicators
 */
export interface InlinePatternProps {
  feeDetails: ProgressiveFeeEstimationResult | null;
  isEstimating: boolean;
  feeDetailsVersion: number;
  isPreFetching: boolean;
  phase1Result: ProgressiveFeeEstimationResult | null;
  phase2Result: ProgressiveFeeEstimationResult | null;
  phase3Result: ProgressiveFeeEstimationResult | null;
  currentPhase: "instant" | "cached" | "exact";
  error: Error | null;
  clearError: () => void;
}

export function mapForInlinePattern(hookResults: any): InlinePatternProps {
  return {
    feeDetails: hookResults.feeDetails,
    isEstimating: hookResults.isEstimating,
    feeDetailsVersion: hookResults.feeDetailsVersion,
    isPreFetching: hookResults.isPreFetching,
    phase1Result: hookResults.phase1Result,
    phase2Result: hookResults.phase2Result,
    phase3Result: hookResults.phase3Result,
    currentPhase: hookResults.currentPhase,
    error: hookResults.error,
    clearError: hookResults.clearError,
  };
}

/**
 * Component Pattern Mapper
 * For modals using ProgressiveFeeStatusIndicator component
 */
export interface ComponentPatternProps {
  // For ProgressiveFeeStatusIndicator
  statusIndicatorProps: {
    isConnected: boolean;
    isSubmitting: boolean;
    currentPhase: "instant" | "cached" | "exact";
    phase1Result: ProgressiveFeeEstimationResult | null;
    phase2Result: ProgressiveFeeEstimationResult | null;
    phase3Result: ProgressiveFeeEstimationResult | null;
    isPreFetching: boolean;
    feeEstimationError: string | null;
    clearError?: () => void;
  };
  // For FeeCalculatorBase
  feeCalculatorProps: {
    feeDetails: any;
    // Other props handled by the component
  };
}

export function mapForComponentPattern(
  hookResults: any,
  isConnected: boolean,
  isSubmitting: boolean,
): ComponentPatternProps {
  return {
    statusIndicatorProps: {
      isConnected,
      isSubmitting,
      currentPhase: hookResults.currentPhase,
      phase1Result: hookResults.phase1Result,
      phase2Result: hookResults.phase2Result,
      phase3Result: hookResults.phase3Result,
      isPreFetching: hookResults.isPreFetching,
      feeEstimationError: hookResults.error?.message || null,
      clearError: hookResults.clearError,
    },
    feeCalculatorProps: {
      feeDetails: mapProgressiveFeeDetails(hookResults.feeDetails) || {
        minerFee: 0,
        dustValue: 0,
        totalValue: 0,
        hasExactFees: false,
        estimatedSize: 300,
      },
    },
  };
}

/**
 * Props Pattern Mapper
 * For simple tools passing phase props to FeeCalculatorBase
 */
export interface PropsPatternProps {
  // All props passed directly to FeeCalculatorBase
  feeDetails: any;
  phase1Result?: ProgressiveFeeEstimationResult | null;
  phase2Result?: ProgressiveFeeEstimationResult | null;
  phase3Result?: ProgressiveFeeEstimationResult | null;
  currentPhase?: "instant" | "cached" | "exact";
  isPreFetching?: boolean;
  isEstimating?: boolean;
  feeEstimationError?: Error | null;
  clearError?: () => void;
}

export function mapForPropsPattern(
  hookResults: any,
  includePhaseProps: boolean = true,
): PropsPatternProps {
  const baseProps: PropsPatternProps = {
    feeDetails: mapProgressiveFeeDetails(hookResults.feeDetails) || {
      minerFee: 0,
      dustValue: 0,
      totalValue: 0,
      hasExactFees: false,
      estimatedSize: 300,
    },
  };

  if (includePhaseProps) {
    return {
      ...baseProps,
      phase1Result: hookResults.phase1Result,
      phase2Result: hookResults.phase2Result,
      phase3Result: hookResults.phase3Result,
      currentPhase: hookResults.currentPhase,
      isPreFetching: hookResults.isPreFetching,
      isEstimating: hookResults.isEstimating,
      feeEstimationError: hookResults.error,
      clearError: hookResults.clearError,
    };
  }

  return baseProps;
}

/**
 * Pattern Detection Helper
 * Helps determine which pattern a tool should use
 */
export type FeeEstimationPattern = "inline" | "component" | "props";

export function detectRecommendedPattern(toolConfig: {
  complexity: "simple" | "medium" | "complex";
  hasCustomUI: boolean;
  isModal: boolean;
  multipleOperations: boolean;
}): FeeEstimationPattern {
  const { complexity, hasCustomUI, isModal, multipleOperations } = toolConfig;

  // Complex tools with custom UI → Inline Pattern
  if (complexity === "complex" && hasCustomUI) {
    return "inline";
  }

  // Modal interfaces → Component Pattern
  if (isModal) {
    return "component";
  }

  // Multiple operations in one tool → Inline Pattern
  if (multipleOperations) {
    return "inline";
  }

  // Simple tools → Props Pattern
  return "props";
}

/**
 * Migration Helper
 * Helps migrate existing tools to use progressive fee estimation
 */
export interface MigrationGuide {
  pattern: FeeEstimationPattern;
  hookConfig: any;
  componentChanges: string[];
  estimatedEffort: "low" | "medium" | "high";
}

export function generateMigrationGuide(toolAnalysis: {
  toolType: string;
  hasCustomFeeUI: boolean;
  isModal: boolean;
  currentFeeHandling: "none" | "basic" | "custom";
}): MigrationGuide {
  const pattern = detectRecommendedPattern({
    complexity: toolAnalysis.currentFeeHandling === "custom"
      ? "complex"
      : "simple",
    hasCustomUI: toolAnalysis.hasCustomFeeUI,
    isModal: toolAnalysis.isModal,
    multipleOperations: false,
  });

  const hookConfig = {
    toolType: toolAnalysis.toolType,
    // Add standard hook configuration
  };

  const componentChanges: string[] = [];
  let estimatedEffort: "low" | "medium" | "high" = "low";

  switch (pattern) {
    case "inline":
      componentChanges.push(
        "Add useTransactionFeeEstimator hook",
        "Create custom inline status indicators",
        "Integrate phase indicators following StampingTool pattern",
        "Add estimateExact() call in action handler",
      );
      estimatedEffort = "high";
      break;

    case "component":
      componentChanges.push(
        "Add useTransactionFeeEstimator hook",
        "Import and add ProgressiveFeeStatusIndicator component",
        "Map fee details using mapProgressiveFeeDetails",
        "Pass mapped details to FeeCalculatorBase",
      );
      estimatedEffort = "medium";
      break;

    case "props":
      componentChanges.push(
        "Add useTransactionFeeEstimator hook",
        "Pass phase props to FeeCalculatorBase",
        "Use mapProgressiveFeeDetails for fee details",
      );
      estimatedEffort = "low";
      break;
  }

  return {
    pattern,
    hookConfig,
    componentChanges,
    estimatedEffort,
  };
}

/**
 * Pattern-specific prop generators
 * Generate the exact props needed for each pattern
 */
export const PatternPropGenerators = {
  /**
   * Generate props for Inline Pattern custom indicators
   */
  generateInlineIndicatorProps(
    hookResults: any,
    position: "top-right" | "top-left" | "bottom-right" | "bottom-left" =
      "top-right",
  ) {
    return {
      className: `absolute ${position.replace("-", "-")} z-10`,
      indicators: {
        showPreFetching: hookResults.isPreFetching,
        showExact: hookResults.isEstimating,
        phase1Active: !!hookResults.phase1Result,
        phase2Active: !!hookResults.phase2Result || hookResults.isPreFetching,
        phase3Active: !!hookResults.phase3Result || hookResults.isEstimating,
        currentPhaseText: getPhaseText(hookResults.currentPhase),
      },
    };
  },

  /**
   * Generate props for Component Pattern (ProgressiveFeeStatusIndicator)
   */
  generateComponentIndicatorProps(
    hookResults: any,
    wallet: any,
    isSubmitting: boolean,
    className?: string,
  ) {
    return {
      isConnected: !!wallet,
      isSubmitting,
      currentPhase: hookResults.currentPhase,
      phase1Result: hookResults.phase1Result,
      phase2Result: hookResults.phase2Result,
      phase3Result: hookResults.phase3Result,
      isPreFetching: hookResults.isPreFetching,
      feeEstimationError: hookResults.error?.message || null,
      clearError: hookResults.clearError,
      className,
    };
  },

  /**
   * Generate props for Props Pattern (FeeCalculatorBase)
   */
  generatePropsPatternProps(
    hookResults: any,
    includeAllPhaseData: boolean = false,
  ) {
    const baseProps = {
      feeDetails: mapProgressiveFeeDetails(hookResults.feeDetails) || {
        minerFee: 0,
        dustValue: 0,
        totalValue: 0,
        hasExactFees: false,
        estimatedSize: 300,
      },
    };

    if (!includeAllPhaseData) {
      return baseProps;
    }

    return {
      ...baseProps,
      progressiveProps: {
        phase1Result: hookResults.phase1Result,
        phase2Result: hookResults.phase2Result,
        phase3Result: hookResults.phase3Result,
        currentPhase: hookResults.currentPhase,
        isPreFetching: hookResults.isPreFetching,
        isEstimating: hookResults.isEstimating,
      },
    };
  },
};

/**
 * Helper function to get phase text
 */
function getPhaseText(phase: "instant" | "cached" | "exact"): string {
  const phaseEmojis = {
    instant: "⚡",
    cached: "💡",
    exact: "🎯",
  };

  const phaseLabels = {
    instant: "Instant",
    cached: "Smart",
    exact: "Exact",
  };

  return `${phaseEmojis[phase]} ${phaseLabels[phase]}`;
}
