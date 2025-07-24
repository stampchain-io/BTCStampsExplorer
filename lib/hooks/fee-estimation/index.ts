/**
 * Shared Fee Estimation Hooks Library
 *
 * Provides reusable hooks for progressive fee estimation
 * Based on StampingTool reference implementation
 */

// Main progressive fee estimation hook
export { useTransactionFeeEstimator } from "../useTransactionFeeEstimator.ts";
export { useProgressiveFeeEstimation } from "../useProgressiveFeeEstimation.ts";

// Supporting hooks
export { useFees } from "../useFees.ts";
export { useBTCValue } from "../useBTCValue.ts";

// Hook types
export type {
  UseTransactionFeeEstimatorParams,
  UseTransactionFeeEstimatorReturn,
} from "$lib/types/fee-estimation.ts";

// Utility hooks for fee-related UI
export { useFeeAnimations } from "./useFeeAnimations.ts";
export { useFeeIndicatorState } from "./useFeeIndicatorState.ts";
export { useFeeTheme } from "./useFeeTheme.ts";

// Constants for hook configuration
export const FEE_ESTIMATION_DEFAULTS = {
  debounceDelay: 500,
  cacheExpiry: 60000, // 1 minute
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

// Hook patterns for different tool types
export const TOOL_HOOK_PATTERNS = {
  // Pattern 1: Simple tools using FeeCalculatorBase
  props: {
    hooks: ["useTransactionFeeEstimator"],
    components: ["FeeCalculatorBase", "SimplePhaseIndicator"],
  },
  // Pattern 2: Modal tools with custom UI
  component: {
    hooks: ["useTransactionFeeEstimator"],
    components: ["ProgressiveFeeStatusIndicator"],
  },
  // Pattern 3: Advanced tools with inline indicators
  inline: {
    hooks: ["useTransactionFeeEstimator", "useFeeAnimations"],
    components: ["InlinePhaseIndicator"],
  },
} as const;
