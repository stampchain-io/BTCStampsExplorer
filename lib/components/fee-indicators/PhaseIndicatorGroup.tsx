/* ===== PHASE INDICATOR GROUP UTILITY COMPONENT ===== */

import { PhaseIndicator } from "./PhaseIndicator.tsx";
import { FEE_INDICATOR_UTILITY_CLASSES } from "./StyleConstants.ts";
import type { PhaseIndicatorGroupProps } from "./types.ts";

/* ===== PHASE INDICATOR GROUP COMPONENT ===== */

export function PhaseIndicatorGroup({
  currentPhase,
  phase1Result,
  phase2Result,
  phase3Result,
  isPreFetching = false,
  size = "md",
  layout = "horizontal",
  showLabels = false,
  className = "",
  position = "inline",
}: PhaseIndicatorGroupProps) {
  /* ===== CONTAINER CLASSES ===== */

  const getContainerClasses = (): string => {
    const baseClasses = layout === "horizontal"
      ? "flex items-center gap-1"
      : "flex flex-col items-center gap-1";

    const positionClasses = {
      "top-right": FEE_INDICATOR_UTILITY_CLASSES.containerTopRight,
      "top-left": FEE_INDICATOR_UTILITY_CLASSES.containerTopLeft,
      "bottom-right": FEE_INDICATOR_UTILITY_CLASSES.containerBottomRight,
      "bottom-left": FEE_INDICATOR_UTILITY_CLASSES.containerBottomLeft,
      "inline": FEE_INDICATOR_UTILITY_CLASSES.containerInline,
    };

    return `${baseClasses} ${positionClasses[position]} ${className}`;
  };

  /* ===== PHASE STATUS HELPERS ===== */

  const isPhaseActive = (phase: "instant" | "cached" | "exact"): boolean => {
    if (phase === "instant") return currentPhase === "instant";
    if (phase === "cached") return currentPhase === "cached" || isPreFetching;
    if (phase === "exact") return currentPhase === "exact";
    return false;
  };

  const isPhaseComplete = (phase: "instant" | "cached" | "exact"): boolean => {
    if (phase === "instant") return !!phase1Result?.success;
    if (phase === "cached") return !!phase2Result?.success;
    if (phase === "exact") return !!phase3Result?.success;
    return false;
  };

  const hasPhaseError = (phase: "instant" | "cached" | "exact"): boolean => {
    if (phase === "instant") return !!phase1Result?.error;
    if (phase === "cached") return !!phase2Result?.error;
    if (phase === "exact") return !!phase3Result?.error;
    return false;
  };

  /* ===== RENDER ===== */

  return (
    <div className={getContainerClasses()}>
      {/* Phase 1: Instant */}
      <PhaseIndicator
        phase="instant"
        isActive={isPhaseActive("instant")}
        isComplete={isPhaseComplete("instant")}
        hasError={hasPhaseError("instant")}
        size={size}
        showLabel={showLabels}
      />

      {/* Phase 2: Cached */}
      <PhaseIndicator
        phase="cached"
        isActive={isPhaseActive("cached")}
        isComplete={isPhaseComplete("cached")}
        hasError={hasPhaseError("cached")}
        size={size}
        showLabel={showLabels}
      />

      {/* Phase 3: Exact */}
      <PhaseIndicator
        phase="exact"
        isActive={isPhaseActive("exact")}
        isComplete={isPhaseComplete("exact")}
        hasError={hasPhaseError("exact")}
        size={size}
        showLabel={showLabels}
      />
    </div>
  );
}
