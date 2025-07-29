/**
 * Progressive Fee Estimation Indicator Component
 *
 * Displays the three-phase fee estimation status:
 * - Phase 1: Instant estimate
 * - Phase 2: Smart UTXO analysis
 * - Phase 3: Exact calculation
 *
 * Also includes error state display with clear functionality
 */

import { VNode } from "preact";

interface ProgressiveEstimationIndicatorProps {
  /** Whether the component is currently connected to a wallet */
  isConnected: boolean;
  /** Whether a transaction is being submitted */
  isSubmitting: boolean;
  /** Whether pre-fetching UTXO data is in progress */
  isPreFetching: boolean;
  /** Current estimation phase: "instant" | "smart" | "exact" */
  currentPhase: "instant" | "smart" | "exact";
  /** Phase completion flags */
  phase1: boolean;
  phase2: boolean;
  phase3: boolean;
  /** Error message if estimation failed */
  feeEstimationError: string | null;
  /** Function to clear the error */
  clearError: () => void;
}

export function ProgressiveEstimationIndicator({
  isConnected,
  isSubmitting,
  isPreFetching,
  currentPhase,
  phase1,
  phase2,
  phase3,
  feeEstimationError,
  clearError,
}: ProgressiveEstimationIndicatorProps): VNode<any> | null {
  // Only show when connected
  if (!isConnected) {
    return null;
  }

  return (
    <div class="flex items-center gap-2">
      {/* Phase Status Summary */}
      {!isSubmitting && !feeEstimationError && (
        <div className="flex items-center gap-2 bg-stamp-grey-darker/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-stamp-grey-light/10">
          {/* Phase indicators */}
          <div className="flex items-center gap-1">
            {/* Phase 1: Instant */}
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                phase1 ? "bg-green-400" : "bg-stamp-grey-light/30"
              }`}
              title="Phase 1: Instant estimate"
            />
            {/* Phase 2: Smart */}
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                phase2
                  ? "bg-blue-400"
                  : currentPhase === "smart" || isPreFetching
                  ? "bg-blue-400 animate-pulse"
                  : "bg-stamp-grey-light/30"
              }`}
              title="Phase 2: Smart UTXO estimate"
            />
            {/* Phase 3: Exact */}
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                phase3 ? "bg-green-500" : "bg-stamp-grey-light/30"
              }`}
              title="Phase 3: Exact calculation"
            />
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

      {/* Phase 2: Smart UTXO-based estimation (background pre-fetching) */}
      {isPreFetching && !isSubmitting && (
        <div className="flex items-center gap-2 bg-stamp-grey-darker/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-stamp-grey-light/10">
          <div className="relative">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping opacity-20" />
          </div>
          <span className="hidden sm:inline text-xs text-stamp-grey-light font-normal opacity-80">
            Smart UTXO analysis
          </span>
          <span className="inline sm:hidden text-blue-400 text-xs opacity-80">
            💡
          </span>
        </div>
      )}

      {/* Phase 3: Exact estimation (during minting) */}
      {isSubmitting && currentPhase === "exact" && (
        <div className="flex items-center gap-2 bg-green-900/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-green-500/20">
          <div className="relative">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping opacity-20" />
          </div>
          <span className="hidden sm:inline text-xs text-green-300 font-normal opacity-90">
            Exact fee calculation
          </span>
          <span className="inline sm:hidden text-green-400 text-xs opacity-80">
            🎯
          </span>
        </div>
      )}

      {/* Error indicator */}
      {feeEstimationError && (
        <div className="flex items-center gap-2 bg-red-900/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-red-500/20">
          <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
          <span className="hidden sm:inline text-xs text-red-300 font-normal opacity-90">
            Estimation error
          </span>
          <span className="inline sm:hidden text-red-400 text-xs opacity-80">
            ⚠️
          </span>
          <button
            type="button"
            onClick={clearError}
            className="text-red-300 hover:text-red-200 text-xs ml-1"
            title="Clear error"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
