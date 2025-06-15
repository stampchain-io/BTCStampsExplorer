import { useEffect, useRef, useState } from "preact/hooks";
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
 * Optimized to reduce unnecessary re-renders
 */
export const useFees = (): UseFeeResult => {
  const [fees, setFees] = useState<FeeData | null>(getCurrentFees());
  const [loading, setLoading] = useState<boolean>(isLoading());
  const [error, setError] = useState<string | null>(getError());

  // Use refs to track previous values and avoid unnecessary updates
  const prevDataRef = useRef<FeeData | null>(fees);
  const prevLoadingRef = useRef<boolean>(loading);
  const prevErrorRef = useRef<string | null>(error);

  useEffect(() => {
    // Subscribe to fee updates
    const unsubscribe = subscribeFees();

    // Subscribe to signal changes with optimized updates
    const signalUnsubscribe = feeSignal.subscribe((feeState) => {
      // Only update fees if the data has actually changed
      const dataChanged =
        JSON.stringify(feeState.data) !== JSON.stringify(prevDataRef.current);
      if (dataChanged) {
        console.log("[useFees] Fee data changed, updating state");
        prevDataRef.current = feeState.data;
        setFees(feeState.data);
      }

      // Only update loading if it actually changed
      if (feeState.loading !== prevLoadingRef.current) {
        prevLoadingRef.current = feeState.loading;
        setLoading(feeState.loading);
      }

      // Only update error if it actually changed
      if (feeState.error !== prevErrorRef.current) {
        prevErrorRef.current = feeState.error;
        setError(feeState.error);
      }
    });

    // Cleanup subscriptions
    return () => {
      unsubscribe();
      signalUnsubscribe();
    };
  }, []); // Empty dependency array - only subscribe once

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
