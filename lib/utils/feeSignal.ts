import { signal } from "@preact/signals";
import axiod from "axiod";
import { loadFeeData, saveFeeData } from "$lib/utils/localStorage.ts";
import { recordFeeFailure, recordFeeSuccess } from "$lib/utils/monitoring.ts";
import { getCSRFToken } from "$lib/utils/clientSecurityUtils.ts";

// Fee data interface matching the API response with enhanced metadata
export interface FeeData {
  recommendedFee: number;
  btcPrice: number;
  // Source and confidence metadata
  source?: "mempool" | "quicknode" | "cached" | "default";
  confidence?: "high" | "medium" | "low";
  timestamp?: number;
  fallbackUsed?: boolean;
  // Full fee structure from mempool API
  fastestFee?: number;
  halfHourFee?: number;
  hourFee?: number;
  economyFee?: number;
  minimumFee?: number;
  debug_feesResponse?: any;
}

// Fee state interface
interface FeeState {
  data: FeeData | null;
  loading: boolean;
  lastUpdated: number | null;
  error: string | null;
  retryCount: number;
  lastKnownGoodData: FeeData | null; // Keep last successful data
}

// Initial state
const initialFeeState: FeeState = {
  data: null,
  loading: false,
  lastUpdated: null,
  error: null,
  retryCount: 0,
  lastKnownGoodData: null,
};

// Global fee signal
export const feeSignal = signal<FeeState>(initialFeeState);

// Configuration
// Note: Primary caching is now handled by Redis (60 seconds) on the server side
const POLLING_INTERVAL = 300000; // 5 minutes (reduced frequency since Redis handles caching)
const CACHE_DURATION = 240000; // 4 minutes (client-side cache for UI responsiveness)
const EXTENDED_CACHE_DURATION = 900000; // 15 minutes (emergency fallback duration)
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000; // 1 second

let pollingInterval: number | null = null;
let activeSubscribers = 0;

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  return RETRY_BASE_DELAY * Math.pow(2, attempt);
}

/**
 * Save fee data to localStorage for emergency fallback only
 * Note: Primary caching is now handled by Redis on the server side
 */
function saveFeeDataToStorage(data: FeeData): void {
  // Only save successful, non-fallback data to localStorage for emergency use
  if (
    data.source !== "default" && data.source !== "cached" && !data.fallbackUsed
  ) {
    saveFeeData(data);
    console.log(
      "[feeSignal] Saved fresh fee data to localStorage for emergency fallback",
    );
  }
}

/**
 * Load fee data from localStorage as emergency fallback only
 * This is only used when both Redis cache and API calls fail
 */
function loadFeeDataFromStorage(): FeeData | null {
  const data = loadFeeData();
  if (!data) return null;

  console.log("[feeSignal] Using localStorage emergency fallback");

  // Return data with updated metadata for emergency fallback usage
  return {
    ...data,
    source: "cached" as const,
    confidence: "low" as const,
    fallbackUsed: true,
    timestamp: Date.now(), // Update timestamp to current time
  };
}

// Fetch fees from API with retry logic
const fetchFees = async (retryCount = 0): Promise<void> => {
  const startTime = Date.now();

  // Set loading state
  console.log("[feeSignal] Setting loading state", { retryCount });
  feeSignal.value = {
    ...feeSignal.value,
    loading: true,
    error: null,
    retryCount,
  };

  try {
    console.log(
      `[feeSignal] Fetching fees (attempt ${retryCount + 1}/${
        MAX_RETRIES + 1
      })`,
    );

    // Get CSRF token for the request
    const csrfToken = await getCSRFToken();

    const response = await axiod.get<FeeData>("/api/internal/fees", {
      headers: {
        "X-CSRF-Token": csrfToken,
      },
    });

    if (response.data && typeof response.data.recommendedFee === "number") {
      // Extract full fee data from response
      const fullFeeData: FeeData = {
        recommendedFee: response.data.recommendedFee,
        btcPrice: response.data.btcPrice,
        source: response.data.source || "mempool",
        confidence: response.data.confidence || "high",
        timestamp: response.data.timestamp || Date.now(),
        fallbackUsed: response.data.fallbackUsed || false,
        debug_feesResponse: response.data.debug_feesResponse,
      };

      // Add individual fee properties from debug response if available
      if (
        response.data.debug_feesResponse &&
        typeof response.data.debug_feesResponse === "object"
      ) {
        const debugFees = response.data.debug_feesResponse;
        fullFeeData.fastestFee = debugFees.fastestFee;
        fullFeeData.halfHourFee = debugFees.halfHourFee;
        fullFeeData.hourFee = debugFees.hourFee;
        fullFeeData.economyFee = debugFees.economyFee;
        fullFeeData.minimumFee = debugFees.minimumFee;
      }

      // Save successful data to localStorage for emergency fallback only
      // Primary caching is now handled by Redis on the server side
      saveFeeDataToStorage(fullFeeData);

      console.log("[feeSignal] Setting successful fee data", {
        recommendedFee: fullFeeData.recommendedFee,
        btcPrice: fullFeeData.btcPrice,
        source: fullFeeData.source,
      });
      feeSignal.value = {
        data: fullFeeData,
        loading: false,
        lastUpdated: Date.now(),
        error: null,
        retryCount: 0,
        lastKnownGoodData: fullFeeData, // Update last known good data
      };

      // Record successful fee fetch
      const responseTime = Date.now() - startTime;
      recordFeeSuccess("fee_signal", responseTime);

      console.log(
        `[feeSignal] Fee fetch successful from ${fullFeeData.source} source`,
      );
    } else {
      throw new Error("Invalid fee data structure received");
    }
  } catch (error) {
    console.error(
      `[feeSignal] Fee fetch attempt ${retryCount + 1} failed:`,
      error,
    );

    // Record failure
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    recordFeeFailure("fee_signal", errorMessage, responseTime);

    // Try retry with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const delay = getRetryDelay(retryCount);
      console.log(`[feeSignal] Retrying in ${delay}ms...`);

      setTimeout(() => {
        fetchFees(retryCount + 1);
      }, delay);
      return;
    }

    // All retries exhausted - try emergency fallback strategies
    // Note: Primary caching is now handled by Redis on the server side
    console.log(
      "[feeSignal] All API retries exhausted, trying emergency fallback strategies",
    );

    let fallbackData: FeeData | null = null;

    // 1. Try to use last known good data from this session (memory fallback)
    if (feeSignal.value.lastKnownGoodData) {
      const lastGoodAge = Date.now() - (feeSignal.value.lastUpdated || 0);
      if (lastGoodAge < EXTENDED_CACHE_DURATION) {
        fallbackData = {
          ...feeSignal.value.lastKnownGoodData,
          source: "cached",
          confidence: "low",
          fallbackUsed: true,
          timestamp: Date.now(),
        };
        console.log("[feeSignal] Using session memory data as fallback");
      }
    }

    // 2. Try localStorage emergency fallback (offline support)
    if (!fallbackData) {
      fallbackData = loadFeeDataFromStorage();
      if (fallbackData) {
        console.log("[feeSignal] Using localStorage emergency fallback");
      }
    }

    // 3. Use conservative static defaults (last resort)
    if (!fallbackData) {
      fallbackData = {
        recommendedFee: 10, // Conservative 10 sats/vB
        btcPrice: 0,
        source: "default",
        confidence: "low",
        fallbackUsed: true,
        timestamp: Date.now(),
        debug_feesResponse: {
          static_fallback: true,
          reason: "All API sources, Redis cache, and localStorage failed",
        },
      };
      console.log("[feeSignal] Using static emergency fallback data");
    }

    console.log("[feeSignal] Setting fallback data", {
      source: fallbackData.source,
      recommendedFee: fallbackData.recommendedFee,
      btcPrice: fallbackData.btcPrice,
    });
    feeSignal.value = {
      data: fallbackData,
      loading: false,
      lastUpdated: feeSignal.value.lastUpdated, // Keep original timestamp
      error: error instanceof Error ? error.message : "Failed to fetch fees",
      retryCount: 0, // Reset for next polling cycle
      lastKnownGoodData: feeSignal.value.lastKnownGoodData, // Preserve last known good
    };
  }
};

// Start polling
const startPolling = (): void => {
  if (pollingInterval) return; // Already polling

  // Initial fetch
  fetchFees();

  // Set up interval
  pollingInterval = setInterval(fetchFees, POLLING_INTERVAL);
};

// Stop polling
const stopPolling = (): void => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};

// Subscribe to fee updates (manages polling lifecycle)
export const subscribeFees = (): () => void => {
  activeSubscribers++;

  // Start polling if this is the first subscriber
  if (activeSubscribers === 1) {
    startPolling();
  }

  // Return unsubscribe function
  return () => {
    activeSubscribers--;

    // Stop polling if no more subscribers
    if (activeSubscribers === 0) {
      stopPolling();
    }
  };
};

// Manual refresh function
export const refreshFees = (): Promise<void> => {
  return fetchFees();
};

// Get current fee data (direct access)
export const getCurrentFees = (): FeeData | null => {
  return feeSignal.value.data;
};

// Check if data is stale (with extended cache for fallback data)
export const isDataStale = (): boolean => {
  const { lastUpdated, data } = feeSignal.value;
  if (!lastUpdated) return true;

  // Use extended cache duration for fallback data
  const cacheLimit = data?.fallbackUsed
    ? EXTENDED_CACHE_DURATION
    : CACHE_DURATION;
  return Date.now() - lastUpdated > cacheLimit;
};

// Get loading state
export const isLoading = (): boolean => {
  return feeSignal.value.loading;
};

// Get error state
export const getError = (): string | null => {
  return feeSignal.value.error;
};

// Get fee source information
export const getFeeSource = (): {
  source: string;
  confidence: string;
  fallbackUsed: boolean;
} => {
  const { data } = feeSignal.value;
  return {
    source: data?.source || "unknown",
    confidence: data?.confidence || "unknown",
    fallbackUsed: data?.fallbackUsed || false,
  };
};

// Check if we're using fallback data
export const isUsingFallback = (): boolean => {
  return feeSignal.value.data?.fallbackUsed || false;
};

// Get last known good data age in minutes
export const getLastGoodDataAge = (): number | null => {
  const { lastUpdated } = feeSignal.value;
  if (!lastUpdated) return null;
  return Math.round((Date.now() - lastUpdated) / (1000 * 60));
};

// Force refresh with fallback handling
export const forceRefreshFees = (): Promise<void> => {
  console.log("[feeSignal] Force refresh requested");
  // Reset retry count and try fresh fetch
  feeSignal.value = {
    ...feeSignal.value,
    retryCount: 0,
  };
  return fetchFees(0);
};
