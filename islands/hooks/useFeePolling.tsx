import { useCallback, useEffect, useState } from "preact/hooks";
import { getCurrentBlock, getRecommendedFees } from "utils/mempool.ts";

interface Fees {
  economyFee: number;
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  recommendedFee: number; // Keep this spelling to match previous usage
  block: number;
  _economyFee: number;
  _fastestFee: number;
  _halfHourFee: number;
  _hourFee: number;
}

export const useFeePolling = (intervalDuration = 300000) => {
  const [fees, setFees] = useState<Fees | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFees = useCallback(async () => {
    try {
      const newFees = await getRecommendedFees();
      const block = await getCurrentBlock();

      if (newFees && block) {
        const allFees: Fees = {
          ...newFees,
          _economyFee: newFees.economyFee,
          _fastestFee: newFees.fastestFee,
          _halfHourFee: newFees.halfHourFee,
          _hourFee: newFees.hourFee,
          economyFee: newFees.economyFee,
          fastestFee: newFees.fastestFee,
          recommendedFee: newFees.fastestFee,
          block: block,
        };
        setFees(allFees);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching fees:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFees();
    const intervalId = setInterval(fetchFees, intervalDuration);

    return () => clearInterval(intervalId);
  }, [fetchFees, intervalDuration]);

  return { fees, loading, fetchFees };
};
