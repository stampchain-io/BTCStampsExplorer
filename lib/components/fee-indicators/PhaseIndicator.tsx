/**
 * Phase Indicator Utility Components
 *
 * Reusable components for displaying progressive fee estimation phases
 * Based on the StampingTool reference implementation
 *
 * @module fee-indicators/PhaseIndicator
 */

import { useEffect, useMemo, useRef } from "preact/hooks";
import { animationUtils } from "./AnimationUtilities.ts";
import {
  FEE_INDICATOR_A11Y,
  FEE_INDICATOR_UTILITY_CLASSES,
} from "./StyleConstants.ts";
import type { PhaseIndicatorProps } from "./types.ts";
import type { ProgressiveFeeEstimationResult } from "$lib/types/fee-estimation.ts";

/**
 * Extended phase indicator props for complex components
 */
export interface ExtendedPhaseIndicatorProps {
  /** Current estimation phase */
  currentPhase?: "instant" | "cached" | "exact";
  /** Phase 1 result */
  phase1Result?: ProgressiveFeeEstimationResult | null;
  /** Phase 2 result */
  phase2Result?: ProgressiveFeeEstimationResult | null;
  /** Phase 3 result */
  phase3Result?: ProgressiveFeeEstimationResult | null;
  /** Whether pre-fetching is active */
  isPreFetching?: boolean;
  /** Whether exact estimation is active */
  isEstimating?: boolean;
  /** Custom class name */
  className?: string;
  /** Show text labels (default: true on desktop) */
  showLabels?: boolean;
  /** Compact mode for limited space */
  compact?: boolean;
}

/**
 * Individual phase dot indicator
 */
export function PhaseDot({
  active,
  animating = false,
  color,
  title,
}: {
  active: boolean;
  animating?: boolean;
  color: "green" | "blue" | "orange";
  title: string;
}) {
  const colorClasses = {
    green: "bg-green-400",
    blue: "bg-blue-400",
    orange: "bg-orange-400",
  };

  return (
    <div
      className={`w-1.5 h-1.5 rounded-full ${
        active ? colorClasses[color] : "bg-stamp-grey-light/30"
      } ${animating ? "animate-pulse" : ""}`}
      title={title}
    />
  );
}

/**
 * Phase status text indicator
 */
export function PhaseStatusText({
  currentPhase,
  className = "",
}: {
  currentPhase?: "instant" | "cached" | "exact";
  className?: string;
}) {
  const phaseText = useMemo(() => {
    switch (currentPhase) {
      case "instant":
        return { emoji: "⚡", text: "Instant" };
      case "cached":
        return { emoji: "💡", text: "Smart" };
      case "exact":
        return { emoji: "🎯", text: "Exact" };
      default:
        return null;
    }
  }, [currentPhase]);

  if (!phaseText || !currentPhase) return null;

  return (
    <span
      className={`text-xs text-stamp-grey-light font-normal opacity-80 ${className}`}
    >
      <span className="inline sm:hidden">{phaseText.emoji}</span>
      <span className="hidden sm:inline">
        {phaseText.emoji} {phaseText.text}
      </span>
    </span>
  );
}

/**
 * Active phase indicator with animation
 */
export function ActivePhaseIndicator({
  phase,
  label,
  compact = false,
}: {
  phase: "prefetch" | "exact";
  label: string;
  compact?: boolean;
}) {
  const config = {
    prefetch: {
      color: "bg-blue-400",
      emoji: "💡",
    },
    exact: {
      color: "bg-orange-400",
      emoji: "🎯",
    },
  };

  const { color, emoji } = config[phase];

  return (
    <div className="flex items-center gap-2 bg-stamp-grey-darker/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-stamp-grey-light/10 mb-2">
      <div className="relative">
        <div className={`w-1.5 h-1.5 ${color} rounded-full animate-pulse`} />
        <div
          className={`absolute inset-0 w-1.5 h-1.5 ${color} rounded-full animate-ping opacity-20`}
        />
      </div>
      {compact ? <span className="text-xs opacity-80">{emoji}</span> : (
        <>
          <span className="hidden sm:inline text-xs text-stamp-grey-light font-normal opacity-80">
            {label}
          </span>
          <span className="inline sm:hidden text-xs opacity-80">{emoji}</span>
        </>
      )}
    </div>
  );
}

/**
 * Complete phase indicator summary (3 dots + status)
 * Based on StampingTool reference implementation
 */
export function PhaseIndicatorSummary({
  phase1Result,
  phase2Result,
  phase3Result,
  currentPhase,
  isPreFetching,
  isEstimating,
  className = "",
  showError = false,
  onClearError,
}: ExtendedPhaseIndicatorProps & {
  showError?: boolean;
  onClearError?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 bg-stamp-grey-darker/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-stamp-grey-light/10 ${className}`}
    >
      {/* Phase indicators */}
      <div className="flex items-center gap-1">
        <PhaseDot
          active={!!phase1Result}
          color="green"
          title="Phase 1: Instant estimate"
        />
        <PhaseDot
          active={!!phase2Result}
          animating={isPreFetching || false}
          color="blue"
          title="Phase 2: Smart UTXO estimate"
        />
        <PhaseDot
          active={!!phase3Result}
          animating={isEstimating || false}
          color="orange"
          title="Phase 3: Exact calculation"
        />
      </div>

      {currentPhase && (
        <PhaseStatusText currentPhase={currentPhase} className="ml-2" />
      )}

      {showError && onClearError && (
        <button
          onClick={onClearError}
          className="ml-2 text-xs text-red-400 hover:text-red-300"
          title="Clear error"
        >
          ✕
        </button>
      )}
    </div>
  );
}

/**
 * Complete inline phase indicator system
 * Matches StampingTool reference implementation
 */
export function InlinePhaseIndicator({
  currentPhase,
  phase1Result,
  phase2Result,
  phase3Result,
  isPreFetching,
  isEstimating,
  isConnected,
  isSubmitting,
  feeEstimationError,
  clearError,
  className = "",
}: ExtendedPhaseIndicatorProps & {
  isConnected?: boolean;
  isSubmitting?: boolean;
  feeEstimationError?: Error | null;
  clearError?: () => void;
}) {
  // Don't show if not connected or submitting
  if (!isConnected || isSubmitting) {
    return null;
  }

  return (
    <div className={`${className}`}>
      {/* Phase 2: Smart UTXO-based estimation (background pre-fetching) */}
      {isPreFetching && (
        <ActivePhaseIndicator
          phase="prefetch"
          label="Smart UTXO analysis"
        />
      )}

      {/* Phase 3: Exact fee calculation */}
      {isEstimating && (
        <ActivePhaseIndicator
          phase="exact"
          label="Exact fee calculation"
        />
      )}

      {/* Phase Status Summary - Always visible when connected */}
      {currentPhase && (
        <PhaseIndicatorSummary
          phase1Result={phase1Result || null}
          phase2Result={phase2Result || null}
          phase3Result={phase3Result || null}
          currentPhase={currentPhase}
          isPreFetching={isPreFetching || false}
          isEstimating={isEstimating || false}
          showError={!!feeEstimationError}
          {...(clearError && { onClearError: clearError })}
        />
      )}
    </div>
  );
}

/**
 * Simplified phase indicator for Props Pattern tools
 * Shows only the summary without active phase animations
 */
export function SimplePhaseIndicator({
  phase1Result,
  phase2Result,
  phase3Result,
  className = "",
}: {
  phase1Result?: ProgressiveFeeEstimationResult | null;
  phase2Result?: ProgressiveFeeEstimationResult | null;
  phase3Result?: ProgressiveFeeEstimationResult | null;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <PhaseDot
        active={!!phase1Result}
        color="green"
        title="Instant"
      />
      <PhaseDot
        active={!!phase2Result}
        color="blue"
        title="Smart"
      />
      <PhaseDot
        active={!!phase3Result}
        color="orange"
        title="Exact"
      />
    </div>
  );
}

/* ===== PHASE INDICATOR UTILITY COMPONENT ===== */

/* ===== PHASE INDICATOR COMPONENT ===== */

export function PhaseIndicator({
  phase,
  isActive = false,
  isComplete = false,
  hasError = false,
  size = "md",
  showLabel = false,
  className = "",
  children,
}: PhaseIndicatorProps) {
  const indicatorRef = useRef<HTMLDivElement>(null);

  /* ===== ANIMATION EFFECTS ===== */

  useEffect(() => {
    if (!indicatorRef.current) return;

    const element = indicatorRef.current;

    // Animate state changes
    if (hasError) {
      animationUtils.animateError(element);
    } else if (isComplete) {
      animationUtils.animateSuccess(element);
    } else if (isActive) {
      // Apply pulse animation for active phases
      const animation = animationUtils.applyPulseAnimation(element);
      return () => animation.cancel();
    }

    // Return undefined for cases where no cleanup is needed
    return undefined;
  }, [isActive, isComplete, hasError]);

  /* ===== CLASS GENERATION ===== */

  const getIndicatorClasses = (): string => {
    const baseClasses = animationUtils.getPhaseIndicatorClasses(
      phase,
      isActive,
      isComplete,
      hasError,
    );

    // Size adjustments
    const sizeClasses = {
      sm: baseClasses.replace("w-1.5 h-1.5", "w-1 h-1"),
      md: baseClasses, // default
      lg: baseClasses.replace("w-1.5 h-1.5", "w-2 h-2"),
    };

    return `${sizeClasses[size]} ${className}`;
  };

  /* ===== ACCESSIBILITY ATTRIBUTES ===== */

  const getAriaLabel = (): string => {
    if (hasError) return FEE_INDICATOR_A11Y.ariaLabels.error;
    if (isComplete) return FEE_INDICATOR_A11Y.ariaLabels.success;
    if (isActive) return FEE_INDICATOR_A11Y.ariaLabels.loading;
    return FEE_INDICATOR_A11Y.ariaLabels[phase];
  };

  const getPhaseIcon = (): string => {
    return animationUtils.getPhaseIcon(phase);
  };

  const getPhaseLabel = (): string => {
    return animationUtils.getPhaseLabel(phase);
  };

  /* ===== RENDER ===== */

  return (
    <div className="flex items-center gap-1">
      {/* Phase Indicator Dot */}
      <div
        ref={indicatorRef}
        className={getIndicatorClasses()}
        aria-label={getAriaLabel()}
        role="status"
        aria-live="polite"
        title={getPhaseLabel()}
      />

      {/* Optional Label */}
      {showLabel && (
        <span className={FEE_INDICATOR_UTILITY_CLASSES.labelText}>
          <span className={FEE_INDICATOR_UTILITY_CLASSES.labelTextHidden}>
            {getPhaseLabel()}
          </span>
          <span className={FEE_INDICATOR_UTILITY_CLASSES.labelTextMobile}>
            {getPhaseIcon()}
          </span>
        </span>
      )}

      {/* Custom Children */}
      {children}
    </div>
  );
}
