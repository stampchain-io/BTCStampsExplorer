import { signal } from "@preact/signals";
import axiod from "axiod";

// Fee data interface matching the API response
export interface FeeData {
  recommendedFee: number;
  btcPrice: number;
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
}

// Initial state
const initialFeeState: FeeState = {
  data: null,
  loading: false,
  lastUpdated: null,
  error: null,
};

// Global fee signal
export const feeSignal = signal<FeeState>(initialFeeState);

// Configuration
const POLLING_INTERVAL = 300000; // 5 minutes
const CACHE_DURATION = 240000; // 4 minutes (refresh before next poll)

let pollingInterval: number | null = null;
let activeSubscribers = 0;

// Fetch fees from API
const fetchFees = async (): Promise<void> => {
  // Set loading state
  feeSignal.value = {
    ...feeSignal.value,
    loading: true,
    error: null,
  };

  try {
    const response = await axiod.get<FeeData>("/api/internal/fees");

    if (response.data && typeof response.data.recommendedFee === "number") {
      // Extract full fee data from debug response if available
      const fullFeeData: FeeData = {
        recommendedFee: response.data.recommendedFee,
        btcPrice: response.data.btcPrice,
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

      feeSignal.value = {
        data: fullFeeData,
        loading: false,
        lastUpdated: Date.now(),
        error: null,
      };
    } else {
      throw new Error("Invalid fee data structure received");
    }
  } catch (error) {
    console.error("Error fetching fees from /api/internal/fees:", error);
    feeSignal.value = {
      ...feeSignal.value,
      loading: false,
      error: error instanceof Error ? error.message : "Failed to fetch fees",
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

// Check if data is stale
export const isDataStale = (): boolean => {
  const { lastUpdated } = feeSignal.value;
  if (!lastUpdated) return true;
  return Date.now() - lastUpdated > CACHE_DURATION;
};

// Get loading state
export const isLoading = (): boolean => {
  return feeSignal.value.loading;
};

// Get error state
export const getError = (): string | null => {
  return feeSignal.value.error;
};
