import { useCallback, useEffect, useState } from "preact/hooks";
import axiod from "axiod"; // For making HTTP requests

// Simplified interface to match /api/internal/fees response
interface PolledFeeData {
  recommendedFee: number;
  btcPrice: number;
  // We can also include the debug_feesResponse if needed for deeper client-side debugging
  debug_feesResponse?: any;
}

export const useFeePolling = (intervalDuration = 300000) => {
  // State now holds PolledFeeData or null
  const [fees, setFees] = useState<PolledFeeData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFeesAndPrice = useCallback(async () => {
    setLoading(true); // Set loading true at the start of a fetch attempt
    try {
      const response = await axiod.get<PolledFeeData>("/api/internal/fees");
      if (response.data && typeof response.data.recommendedFee === "number") {
        setFees(response.data);
      } else {
        // Handle cases where data might be missing or not as expected
        console.error(
          "Error fetching or parsing fees: Invalid data structure received",
          response.data,
        );
        // Optionally set fees to a default error state or keep previous state
        // For now, we'll set to null to indicate an issue if data is invalid
        setFees(null);
      }
    } catch (error) {
      console.error("Error fetching fees from /api/internal/fees:", error);
      setFees(null); // Set to null or a default error state on fetch failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeesAndPrice(); // Initial fetch
    const intervalId = setInterval(fetchFeesAndPrice, intervalDuration);

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [fetchFeesAndPrice, intervalDuration]);

  // The returned object now directly provides recommendedFee and btcPrice from the API
  return {
    fees, // This object contains recommendedFee and btcPrice
    loading,
    fetchFees: fetchFeesAndPrice, // Expose the renamed fetch function
    // satsPerVB and satsPerKB can be derived directly from fees.recommendedFee if needed by consumers
    // For example, if a component needs satsPerVB:
    // const satsPerVB = fees?.recommendedFee;
  };
};
