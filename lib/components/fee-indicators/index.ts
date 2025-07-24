/* ===== SHARED FEE INDICATOR UTILITIES SYSTEM ===== */

// Core Phase Indicator Components
export {
  ActivePhaseIndicator,
  InlinePhaseIndicator,
  PhaseDot,
  PhaseIndicator,
  PhaseIndicatorSummary,
  PhaseStatusText,
  SimplePhaseIndicator,
} from "./PhaseIndicator.tsx";

export { PhaseIndicatorGroup } from "./PhaseIndicatorGroup.tsx";

// Animation Constants and Utilities
export {
  ANIMATION_TIMINGS,
  EASING_FUNCTIONS,
  PHASE_TRANSITIONS,
} from "./AnimationConstants.ts";

export { AnimationUtilities, animationUtils } from "./AnimationUtilities.ts";

// Styling Constants and Utilities
export {
  DEFAULT_FEE_INDICATOR_THEME,
  FEE_INDICATOR_A11Y,
  FEE_INDICATOR_COLORS,
  FEE_INDICATOR_SPACING,
  FEE_INDICATOR_TIMING,
  FEE_INDICATOR_UTILITY_CLASSES,
  FEE_INDICATOR_Z_INDEX,
  generateCSSCustomProperties,
  StyleConstants,
} from "./StyleConstants.ts";

export { FeeIndicatorTheme } from "./ThemeProvider.tsx";

// Fee Mapping Utilities
export { FeeDetailsMapper } from "./FeeDetailsMapper.ts";

// Re-export from other locations for convenience
export {
  CompactFeePhaseIndicator,
  ProgressiveFeeStatusIndicator,
} from "$components/fee/ProgressiveFeeStatusIndicator.tsx";

// TypeScript Interfaces and Types
export type {
  AnimationConfig,
  AnimationUtilityProps,
  FeeDetailsMapperConfig,
  PhaseIndicatorGroupProps,
  PhaseIndicatorProps,
  PhaseTransitionConfig,
  SharedFeeIndicatorTheme,
  StyleConstantsConfig,
} from "./types.ts";

// Extended Props for complex implementations
export type { ExtendedPhaseIndicatorProps } from "./PhaseIndicator.tsx";

// TypeScript Generics for tool contexts
export type {
  FairmintToolProps,
  GenericFeeIndicatorProps,
  SRC101ToolProps,
  SRC20ToolProps,
  StampToolProps,
  ToolConfig,
  ToolFeeEstimationHook,
  ToolSpecificParams,
  ToolSpecificProps,
  ToolType,
  TradeToolProps,
} from "./generics.ts";

export { createFeeIndicator, isToolProps } from "./generics.ts";
