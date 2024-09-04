import { useCallback, useEffect, useState } from "preact/hooks";
import { getCurrentBlock, getRecommendedFees } from "utils/mempool.ts";

export const useFeePolling = (intervalDuration = 300000) => {
  const [fees, setFees] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFees = useCallback(async () => {
    try {
      const newFees = await getRecommendedFees();
      const block = await getCurrentBlock();

      const allFees = {
        ...newFees,
        _economyFee: newFees.economyFee,
        _fastestFee: newFees.fastestFee,
        _halfHourFee: newFees.halfHourFee,
        _hourFee: newFees.hourFee,
        economyFee: newFees.economyFee * 3,
        fastestFee: newFees.fastestFee * 2,
        recomendedFee: newFees.fastestFee * 3,
        block: block,
      };
      setFees(allFees);
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
