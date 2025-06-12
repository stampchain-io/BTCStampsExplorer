import { useEffect, useState } from "preact/hooks";
import {
  type FeeData,
  feeSignal,
  forceRefreshFees,
  getCurrentFees,
  getError,
  getFeeSource,
  getLastGoodDataAge,
  isLoading,
  isUsingFallback,
  refreshFees,
  subscribeFees,
} from "$lib/utils/feeSignal.ts";

// Hook interface for fee data access with enhanced fallback capabilities
interface UseFeeResult {
  fees: FeeData | null;
  loading: boolean;
  error: string | null;
  fetchFees: () => Promise<void>;
  // Enhanced functionality
  feeSource: {
    source: string;
    confidence: string;
    fallbackUsed: boolean;
  };
  isUsingFallback: boolean;
  lastGoodDataAge: number | null;
  forceRefresh: () => Promise<void>;
}

/**
 * Hook for accessing global fee state
 * Uses a single shared polling service for optimal performance
 * Automatically manages subscription lifecycle
 */
export const useFees = (): UseFeeResult => {
  const [fees, setFees] = useState<FeeData | null>(getCurrentFees());
  const [loading, setLoading] = useState<boolean>(isLoading());
  const [error, setError] = useState<string | null>(getError());

  useEffect(() => {
    // Subscribe to fee updates
    const unsubscribe = subscribeFees();

    // Subscribe to signal changes
    const signalUnsubscribe = feeSignal.subscribe((feeState) => {
      setFees(feeState.data);
      setLoading(feeState.loading);
      setError(feeState.error);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribe();
      signalUnsubscribe();
    };
  }, []);

  return {
    fees,
    loading,
    error,
    fetchFees: refreshFees,
    feeSource: getFeeSource(),
    isUsingFallback: isUsingFallback(),
    lastGoodDataAge: getLastGoodDataAge(),
    forceRefresh: forceRefreshFees,
  };
};

/**
 * Direct signal access hook for components that need reactive updates
 * Most efficient approach - no local state needed
 */
export const useFeesSignal = () => {
  useEffect(() => {
    const unsubscribe = subscribeFees();
    return unsubscribe;
  }, []);

  return {
    feeState: feeSignal.value,
    fees: feeSignal.value.data,
    loading: feeSignal.value.loading,
    error: feeSignal.value.error,
    fetchFees: refreshFees,
    feeSource: getFeeSource(),
    isUsingFallback: isUsingFallback(),
    lastGoodDataAge: getLastGoodDataAge(),
    forceRefresh: forceRefreshFees,
  };
};

/**
 * Lightweight hook for components that only need current fee data
 * No polling subscription - uses cached data only
 */
export const useCurrentFees = (): FeeData | null => {
  return getCurrentFees();
};
