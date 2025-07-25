/**
 * Shared Fee Estimation Hooks Library
 *
 * Provides reusable hooks for progressive fee estimation
 * Based on StampingTool reference implementation
 */

// Main progressive fee estimation hook
export { useProgressiveFeeEstimation } from "$lib/hooks/fee-estimation/useProgressiveFeeEstimation.ts";
export { useTransactionConstructionService } from "../useTransactionConstructionService.ts";

// Supporting hooks
export { useBTCValue } from "../useBTCValue.ts";
export { useFees } from "../useFees.ts";

// Hook types - removed missing exports
// export type { UseTransactionConstructionServiceParams, UseTransactionConstructionServiceReturn } from "$lib/types/fee-estimation.ts";

// Removed deleted hooks:
// export { useFeeAnimations } from "./useFeeAnimations.ts";
// export { useFeeTheme } from "./useFeeTheme.ts";
// export { useFeeIndicatorState } from "./useFeeIndicatorState.ts";

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
    hooks: ["useTransactionConstructionService"],
    components: ["FeeCalculatorBase"],
  },
  // Pattern 2: Modal tools with custom UI
  component: {
    hooks: ["useTransactionConstructionService"],
    components: [],
  },
  // Pattern 3: Advanced tools with inline indicators
  inline: {
    hooks: ["useTransactionConstructionService"],
    components: [],
  },
} as const;
