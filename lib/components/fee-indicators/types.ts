/* ===== SHARED FEE INDICATOR UTILITIES - TYPE DEFINITIONS ===== */

import type { ComponentChildren } from "preact";

/* ===== CORE PHASE TYPES ===== */

export type FeeEstimationPhase = "instant" | "cached" | "exact";

/* ===== PHASE INDICATOR COMPONENT TYPES ===== */

export interface PhaseIndicatorProps {
  phase: FeeEstimationPhase;
  isActive?: boolean;
  isComplete?: boolean;
  hasError?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  children?: ComponentChildren;
}

export interface PhaseIndicatorGroupProps {
  currentPhase: FeeEstimationPhase;
  phase1Result: PhaseResult | null;
  phase2Result: PhaseResult | null;
  phase3Result: PhaseResult | null;
  isPreFetching?: boolean;
  size?: "sm" | "md" | "lg";
  layout?: "horizontal" | "vertical";
  showLabels?: boolean;
  className?: string;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "inline";
}

/* ===== ANIMATION UTILITY TYPES ===== */

export interface AnimationUtilityProps {
  duration?: number;
  easing?: string;
  delay?: number;
  iterations?: number | string;
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
  fillMode?: "none" | "forwards" | "backwards" | "both";
}

export interface AnimationConfig {
  name: string;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

/* ===== STYLING TYPES ===== */

export interface StyleConstantsConfig {
  colors: {
    instant: string;
    cached: string;
    exact: string;
    success: string;
    error: string;
    loading: string;
  };
  spacing: {
    sm: string;
    md: string;
    lg: string;
  };
  timing: {
    fast: string;
    normal: string;
    slow: string;
  };
  zIndex: {
    indicator: number;
    modal: number;
    tooltip: number;
  };
}

export interface SharedFeeIndicatorTheme {
  colors: StyleConstantsConfig["colors"];
  spacing: StyleConstantsConfig["spacing"];
  timing: StyleConstantsConfig["timing"];
  borderRadius: string;
  backdropBlur: string;
  opacity: {
    active: number;
    inactive: number;
    disabled: number;
  };
}

/* ===== FEE DETAILS MAPPING TYPES ===== */

export interface FeeDetailsMapperConfig {
  preserveExisting?: boolean;
  includePhaseInfo?: boolean;
  normalizeUnits?: boolean;
  addTooltips?: boolean;
}

export interface MappedFeeDetails {
  minerFee: number;
  dustValue: number;
  totalValue: number;
  hasExactFees: boolean;
  estimatedSize: number;
  phase?: FeeEstimationPhase;
  phaseInfo?: PhaseResult;
  formattedMinerFee?: string;
  formattedTotalValue?: string;
}

/* ===== PHASE RESULT TYPE (for PhaseIndicatorGroup) ===== */

export interface PhaseResult {
  phase: FeeEstimationPhase;
  success: boolean;
  error?: string;
  timestamp?: number;
  duration?: number;
}

/* ===== UTILITY FUNCTION TYPES ===== */

export interface PhaseTransitionConfig {
  from: FeeEstimationPhase;
  to: FeeEstimationPhase;
  animation: AnimationConfig;
}

export interface UtilityFunctions {
  createPhaseIndicator: (props: PhaseIndicatorProps) => ComponentChildren;
  animatePhaseTransition: (config: PhaseTransitionConfig) => Promise<void>;
  mapFeeDetails: (
    details: any,
    config?: FeeDetailsMapperConfig,
  ) => MappedFeeDetails;
  getPhaseIcon: (phase: FeeEstimationPhase) => string;
  getPhaseColor: (
    phase: FeeEstimationPhase,
    theme: SharedFeeIndicatorTheme,
  ) => string;
}
