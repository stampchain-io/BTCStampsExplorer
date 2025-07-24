/**
 * Progressive Fee Status Indicator Component
 *
 * A reusable component that displays the three-phase fee estimation status
 * with visual indicators for each phase:
 * - Phase 1: Instant (⚡)
 * - Phase 2: Smart UTXO (💡)
 * - Phase 3: Exact (🎯)
 *
 * @author BTCStampsExplorer Team
 * @version 1.0.0
 */

import type { ProgressiveFeeEstimationResult } from "$lib/types/fee-estimation.ts";

interface ProgressiveFeeStatusIndicatorProps {
  isConnected: boolean;
  isSubmitting: boolean;
  currentPhase: "instant" | "smart" | "exact";
  phase1Result: ProgressiveFeeEstimationResult | null;
  phase2Result: ProgressiveFeeEstimationResult | null;
  phase3Result: ProgressiveFeeEstimationResult | null;
  isPreFetching: boolean;
  feeEstimationError: string | null;
  clearError?: () => void;
  className?: string;
}

export function ProgressiveFeeStatusIndicator({
  isConnected,
  isSubmitting,
  currentPhase,
  phase1Result,
  phase2Result,
  phase3Result,
  isPreFetching,
  feeEstimationError,
  clearError,
  className = "",
}: ProgressiveFeeStatusIndicatorProps) {
  return (
    <div className={`absolute top-3 right-3 z-10 ${className}`}>
      {/* Phase 2: Smart UTXO-based estimation (background pre-fetching) */}
      {isPreFetching && (
        <div className="flex items-center gap-2 bg-stamp-grey-darker/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-stamp-grey-light/10 mb-2">
          <div className="relative">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse">
            </div>
            <div className="absolute inset-0 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping opacity-20">
            </div>
          </div>
          <span className="hidden sm:inline text-xs text-blue-300 font-normal opacity-90">
            Smart UTXO analysis
          </span>
          <span className="inline sm:hidden text-blue-300 text-xs opacity-90">
            💡
          </span>
        </div>
      )}

      {/* Phase 3: Exact estimation (during minting) */}
      {isSubmitting && currentPhase === "exact" && (
        <div className="flex items-center gap-2 bg-green-900/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-green-500/20 mb-2">
          <div className="relative">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse">
            </div>
            <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping opacity-20">
            </div>
          </div>
          <span className="hidden sm:inline text-xs text-green-300 font-normal opacity-90">
            Exact fee calculation
          </span>
          <span className="inline sm:hidden text-green-300 text-xs opacity-90">
            🎯
          </span>
        </div>
      )}

      {/* Phase Status Summary - Always visible when connected */}
      {isConnected && !isSubmitting && (
        <div className="flex items-center gap-2 bg-stamp-grey-darker/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-stamp-grey-light/10">
          {/* Phase indicators */}
          <div className="flex items-center gap-1">
            {/* Phase 1: Instant */}
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                phase1Result ? "bg-green-400" : "bg-stamp-grey-light/30"
              }`}
              title="Phase 1: Instant estimate"
            >
            </div>

            {/* Phase 2: Smart UTXO */}
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                phase2Result
                  ? "bg-blue-400"
                  : currentPhase === "smart" || isPreFetching
                  ? "bg-blue-400 animate-pulse"
                  : "bg-stamp-grey-light/30"
              }`}
              title="Phase 2: Smart UTXO estimate"
            >
            </div>

            {/* Phase 3: Exact */}
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                phase3Result ? "bg-green-400" : "bg-stamp-grey-light/30"
              }`}
              title="Phase 3: Exact calculation"
            >
            </div>
          </div>

          {/* Current phase text */}
          <span className="hidden sm:inline text-xs text-stamp-grey-light font-normal opacity-80">
            {currentPhase === "instant" && "⚡ Instant"}
            {currentPhase === "smart" && "💡 Smart"}
            {currentPhase === "exact" && "🎯 Exact"}
          </span>

          {/* Mobile-only emoji */}
          <span className="inline sm:hidden text-stamp-grey-light text-xs opacity-80">
            {currentPhase === "instant" && "⚡"}
            {currentPhase === "smart" && "💡"}
            {currentPhase === "exact" && "🎯"}
          </span>
        </div>
      )}

      {/* Error indicator */}
      {feeEstimationError && (
        <div className="flex items-center gap-2 bg-red-900/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-red-500/20 mt-2">
          <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
          <span className="hidden sm:inline text-xs text-red-300 font-normal opacity-90">
            Estimation error
          </span>
          <span className="inline sm:hidden text-red-300 text-xs opacity-90">
            ❌
          </span>
          {clearError && (
            <button
              onClick={clearError}
              className="ml-1 text-red-300 hover:text-red-200 text-xs"
              aria-label="Clear error"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Simplified fee phase indicator for compact displays
 */
export function CompactFeePhaseIndicator({
  currentPhase,
  isEstimating,
  hasError,
}: {
  currentPhase: "instant" | "cached" | "exact";
  isEstimating: boolean;
  hasError: boolean;
}) {
  if (hasError) {
    return <span className="text-red-400 text-xs">❌ Error</span>;
  }

  if (isEstimating) {
    return (
      <span className="text-stamp-grey-light text-xs animate-pulse">
        Estimating...
      </span>
    );
  }

  const phaseEmoji = {
    instant: "⚡",
    cached: "💡",
    exact: "🎯",
  };

  const phaseText = {
    instant: "Instant",
    cached: "Smart",
    exact: "Exact",
  };

  return (
    <span className="text-stamp-grey-light text-xs">
      {phaseEmoji[currentPhase]} {phaseText[currentPhase]}
    </span>
  );
}
