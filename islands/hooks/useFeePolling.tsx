import { useEffect, useState } from "preact/hooks";
import { getCurrentBlock, getRecommendedFees } from "utils/mempool.ts";

export const useFeePolling = (intervalDuration = 30000) => {
  const [fees, setFees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let intervalId;
    let progressInterval;

    const fetchFees = async () => {
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
        setProgress(0);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching fees:", error);
        setLoading(false);
      }
    };

    fetchFees();
    intervalId = setInterval(fetchFees, intervalDuration);

    progressInterval = setInterval(() => {
      setProgress((prevProgress) => {
        return prevProgress >= 100
          ? 100
          : prevProgress + (100 * 1000 / intervalDuration);
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
      clearInterval(progressInterval);
    };
  }, []);

  return { fees, loading, progress };
};
