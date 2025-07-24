/**
 * Fee Indicator State Hook
 *
 * Manages the state of fee indicators across different phases
 * Based on StampingTool patterns
 */

import { useEffect, useMemo, useState } from "preact/hooks";
import type { ProgressiveFeeEstimationResult } from "$lib/types/fee-estimation.ts";

interface UseFeeIndicatorStateOptions {
  /** Initial phase */
  initialPhase?: "instant" | "cached" | "exact";
  /** Auto-clear error after milliseconds */
  errorClearDelay?: number;
  /** Track phase transitions */
  trackTransitions?: boolean;
}

interface PhaseState {
  /** Current active phase */
  current: "instant" | "cached" | "exact" | null;
  /** Previous phase */
  previous: "instant" | "cached" | "exact" | null;
  /** Phase transition history */
  history: Array<{
    from: string | null;
    to: string;
    timestamp: number;
  }>;
}

interface UseFeeIndicatorStateReturn {
  /** Phase state tracking */
  phaseState: PhaseState;
  /** Update current phase */
  setPhase: (phase: "instant" | "cached" | "exact" | null) => void;
  /** Get phase status */
  getPhaseStatus: (phase: "instant" | "cached" | "exact") => {
    isActive: boolean;
    isComplete: boolean;
    hasError: boolean;
  };
  /** Error state */
  error: Error | null;
  /** Set error */
  setError: (error: Error | null) => void;
  /** Clear error */
  clearError: () => void;
  /** Check if any phase is active */
  isAnyPhaseActive: boolean;
  /** Get phase completion percentage */
  completionPercentage: number;
}

/**
 * Hook for managing fee indicator state
 */
export function useFeeIndicatorState(
  options: UseFeeIndicatorStateOptions = {},
): UseFeeIndicatorStateReturn {
  const {
    initialPhase = null,
    errorClearDelay = 5000,
    trackTransitions = true,
  } = options;

  // Phase state
  const [phaseState, setPhaseState] = useState<PhaseState>({
    current: initialPhase,
    previous: null,
    history: [],
  });

  // Error state
  const [error, setError] = useState<Error | null>(null);

  // Phase results tracking (would be passed in from parent in real usage)
  const [phaseResults, setPhaseResults] = useState<{
    instant: boolean;
    cached: boolean;
    exact: boolean;
  }>({
    instant: false,
    cached: false,
    exact: false,
  });

  // Auto-clear error
  useEffect(() => {
    if (error && errorClearDelay > 0) {
      const timer = setTimeout(() => {
        setError(null);
      }, errorClearDelay);
      return () => clearTimeout(timer);
    }
  }, [error, errorClearDelay]);

  /**
   * Update current phase
   */
  const setPhase = (phase: "instant" | "cached" | "exact" | null) => {
    setPhaseState((prev) => {
      const newState = {
        current: phase,
        previous: prev.current,
        history: prev.history,
      };

      if (trackTransitions && phase !== prev.current) {
        newState.history = [
          ...prev.history,
          {
            from: prev.current,
            to: phase || "none",
            timestamp: Date.now(),
          },
        ];
      }

      // Mark phase as complete when moving to next phase
      if (prev.current && phase && prev.current !== phase) {
        setPhaseResults((results) => ({
          ...results,
          [prev.current]: true,
        }));
      }

      return newState;
    });
  };

  /**
   * Get phase status
   */
  const getPhaseStatus = (phase: "instant" | "cached" | "exact") => {
    return {
      isActive: phaseState.current === phase,
      isComplete: phaseResults[phase],
      hasError: phaseState.current === phase && !!error,
    };
  };

  /**
   * Clear error
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Check if any phase is active
   */
  const isAnyPhaseActive = useMemo(() => {
    return phaseState.current !== null;
  }, [phaseState.current]);

  /**
   * Calculate completion percentage
   */
  const completionPercentage = useMemo(() => {
    const completed = Object.values(phaseResults).filter(Boolean).length;
    return Math.round((completed / 3) * 100);
  }, [phaseResults]);

  return {
    phaseState,
    setPhase,
    getPhaseStatus,
    error,
    setError,
    clearError,
    isAnyPhaseActive,
    completionPercentage,
  };
}
