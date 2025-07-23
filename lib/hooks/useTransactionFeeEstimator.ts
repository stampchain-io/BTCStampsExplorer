import { useEffect, useState } from "preact/hooks";
import {
  type FeeEstimate,
  type FeeEstimationError,
  type FeePriority,
  TransactionFeeEstimator,
  type TransactionOutput,
} from "../utils/minting/TransactionFeeEstimator.ts";

export interface UseTransactionFeeEstimatorOptions {
  transactionType:
    | "stamp"
    | "src20"
    | "fairmint"
    | "src101"
    | "transfer"
    | "custom";
  priority?: FeePriority;
  autoRefresh?: boolean;
  refreshInterval?: number;
  // For stamp transactions
  editions?: number;
  // For custom transactions
  outputs?: TransactionOutput[];
  inputCount?: number;
}

export interface UseTransactionFeeEstimatorResult {
  estimate: FeeEstimate | null;
  isLoading: boolean;
  error: FeeEstimationError | null;
  refresh: () => Promise<void>;
  cacheStatus: {
    isValid: boolean;
    age?: number;
    source?: string;
  };
}

/**
 * React hook for transaction fee estimation
 *
 * @example
 * ```tsx
 * const { estimate, isLoading, error } = useTransactionFeeEstimator({
 *   transactionType: "src20",
 *   priority: "standard",
 *   autoRefresh: true,
 * });
 *
 * if (isLoading) return <div>Loading fees...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (estimate) return <div>Fee: {estimate.estMinerFee} sats</div>;
 * ```
 */
export function useTransactionFeeEstimator(
  options: UseTransactionFeeEstimatorOptions,
): UseTransactionFeeEstimatorResult {
  const [estimate, setEstimate] = useState<FeeEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FeeEstimationError | null>(null);

  const {
    transactionType,
    priority = "standard",
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    editions,
    outputs,
    inputCount,
  } = options;

  const estimateFees = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      let result: FeeEstimate;

      switch (transactionType) {
        case "stamp":
          result = await TransactionFeeEstimator.estimateStampFees(
            priority,
            editions,
          );
          break;
        case "src20":
          result = await TransactionFeeEstimator.estimateSRC20Fees(priority);
          break;
        case "fairmint":
          result = await TransactionFeeEstimator.estimateFairmintFees(priority);
          break;
        case "src101":
          result = await TransactionFeeEstimator.estimateSRC101Fees(priority);
          break;
        case "transfer":
          result = await TransactionFeeEstimator.estimateTransferFees(priority);
          break;
        case "custom":
          if (!outputs) {
            throw new Error(
              "Custom transaction type requires outputs parameter",
            );
          }
          result = await TransactionFeeEstimator.estimateCustomTransactionFees(
            outputs,
            priority,
            inputCount,
          );
          break;
        default:
          throw new Error(`Unsupported transaction type: ${transactionType}`);
      }

      if (!TransactionFeeEstimator.validateEstimate(result)) {
        throw new Error("Invalid fee estimate received");
      }

      setEstimate(result);
    } catch (err) {
      const feeError: FeeEstimationError = {
        type: err instanceof TypeError ? "ValidationError" : "APIError",
        message: err instanceof Error ? err.message : "Unknown error occurred",
        details: err,
      };
      setError(feeError);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async (): Promise<void> => {
    await estimateFees();
  };

  const getCacheStatus = () => {
    return TransactionFeeEstimator.getCacheStatus();
  };

  // Initial load
  useEffect(() => {
    estimateFees();
  }, [
    transactionType,
    priority,
    editions,
    JSON.stringify(outputs),
    inputCount,
  ]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      estimateFees();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, transactionType, priority]);

  return {
    estimate,
    isLoading,
    error,
    refresh,
    cacheStatus: getCacheStatus(),
  };
}

/**
 * Hook for getting fee rates for different priorities
 */
export function useFeeRates() {
  const [rates, setRates] = useState<Record<FeePriority, number> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const feeRates = await TransactionFeeEstimator.getFeeRates();
      setRates({
        economy: feeRates.economy,
        standard: feeRates.standard,
        priority: feeRates.priority,
        urgent: feeRates.urgent,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch fee rates",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  return {
    rates,
    isLoading,
    error,
    refresh: fetchRates,
  };
}

/**
 * Hook for comparing fees across different priorities
 */
export function useFeePriorityComparison(
  transactionType: UseTransactionFeeEstimatorOptions["transactionType"],
  options?: Omit<
    UseTransactionFeeEstimatorOptions,
    "transactionType" | "priority"
  >,
) {
  const economyEstimate = useTransactionFeeEstimator({
    ...options,
    transactionType,
    priority: "economy",
  });

  const standardEstimate = useTransactionFeeEstimator({
    ...options,
    transactionType,
    priority: "standard",
  });

  const priorityEstimate = useTransactionFeeEstimator({
    ...options,
    transactionType,
    priority: "priority",
  });

  const urgentEstimate = useTransactionFeeEstimator({
    ...options,
    transactionType,
    priority: "urgent",
  });

  const isLoading = economyEstimate.isLoading ||
    standardEstimate.isLoading ||
    priorityEstimate.isLoading ||
    urgentEstimate.isLoading;

  const hasError = economyEstimate.error ||
    standardEstimate.error ||
    priorityEstimate.error ||
    urgentEstimate.error;

  return {
    estimates: {
      economy: economyEstimate.estimate,
      standard: standardEstimate.estimate,
      priority: priorityEstimate.estimate,
      urgent: urgentEstimate.estimate,
    },
    isLoading,
    error: hasError,
    refresh: async () => {
      await Promise.all([
        economyEstimate.refresh(),
        standardEstimate.refresh(),
        priorityEstimate.refresh(),
        urgentEstimate.refresh(),
      ]);
    },
  };
}
