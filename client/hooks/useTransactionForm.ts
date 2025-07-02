import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { useFees } from "$fees";
import {
  showConnectWalletModal,
  walletContext,
} from "$client/wallet/wallet.ts";
import { logger } from "$lib/utils/logger.ts";
import { FeeDetails } from "$lib/types/base.d.ts";
import axiod from "axiod";
import { debounce } from "$lib/utils/debounce.ts";

interface TransactionFormState {
  fee: number;
  feeError: string;
  BTCPrice: number;
  recipientAddress?: string;
  addressError?: string;
  amount?: string;
  amountError?: string;
  assetId?: string;
  estimatedTxFees: FeeDetails | null;
  apiError: string | null;
}

interface UseTransactionFormProps {
  type: "send" | "transfer" | "buy";
  initialFee?: number;
  initialAssetId?: string;
  initialAmount?: string;
}

interface DebouncedCallParams {
  sourceAddress: string;
  feeRate: number;
  recipientAddress?: string;
  assetId?: string;
  amount?: string;
}

const calculateEstimatedFeesDebounced = debounce(
  async (
    params: DebouncedCallParams,
    setFormState: (
      fn: (prev: TransactionFormState) => TransactionFormState,
    ) => void,
  ) => {
    if (
      !params.sourceAddress || !params.recipientAddress || !params.assetId ||
      !params.amount || params.feeRate <= 0
    ) {
      setFormState((prev) => ({
        ...prev,
        estimatedTxFees: prev.estimatedTxFees
          ? {
            ...prev.estimatedTxFees,
            hasExactFees: false,
            minerFee: 0,
            dustValue: 0,
            totalValue: 0,
          }
          : null,
      }));
      return;
    }
    try {
      logger.debug("ui", {
        message: "Requesting transfer fee estimate (dry run)",
        params,
      });
      const response = await axiod.post("/api/v2/create/send", {
        address: params.sourceAddress,
        destination: params.recipientAddress,
        asset: params.assetId,
        quantity: Number(params.amount),
        options: { fee_per_kb: params.feeRate * 1000 },
        dryRun: true,
      });

      if (response.data && typeof response.data.estimatedFee === "number") {
        setFormState((prev) => ({
          ...prev,
          estimatedTxFees: {
            minerFee: response.data.estimatedFee || 0,
            dustValue: 0,
            totalValue: response.data.estimatedFee || 0,
            hasExactFees: true,
            estimatedSize: response.data.estimatedVsize || 0,
            effectiveFeeRate: params.feeRate,
            totalVsize: response.data.estimatedVsize || 0,
          },
          apiError: null,
        }));
      } else {
        throw new Error(
          "Invalid fee estimation response from /api/v2/create/send",
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error
        ? error.message
        : "Fee estimation failed for transfer";
      logger.error("ui", {
        message: "Transfer fee estimation error",
        error: errorMsg,
        paramsSent: params,
      });
      setFormState((prev) => ({
        ...prev,
        estimatedTxFees: {
          minerFee: 0,
          dustValue: 0,
          totalValue: 0,
          hasExactFees: false,
          effectiveFeeRate: 0,
          estimatedSize: 0,
          totalVsize: 0,
        },
        apiError: errorMsg,
      }));
    }
  },
  750,
);

export function useTransactionForm(
  { type, initialFee = 1, initialAssetId = "", initialAmount = "1" }:
    UseTransactionFormProps,
) {
  const {
    fees,
    loading: feeLoading,
    fetchFees,
    feeSource,
    isUsingFallback,
    lastGoodDataAge,
    forceRefresh,
  } = useFees();
  const { wallet, isConnected } = walletContext;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Separate state to track user vs automatic fee changes
  const [userFee, setUserFee] = useState<number | null>(null);
  // Separate state to track BTC price to avoid circular dependency
  const [lastValidBTCPrice, setLastValidBTCPrice] = useState<number>(0);

  const [formState, setFormState] = useState<TransactionFormState>({
    fee: initialFee,
    feeError: "",
    BTCPrice: 0,
    recipientAddress: "",
    addressError: "",
    amount: initialAmount,
    amountError: "",
    assetId: initialAssetId,
    estimatedTxFees: null,
    apiError: null,
  });

  // Memoize the fee data to prevent object reference changes
  const memoizedFeeData = useMemo(() => {
    if (!fees) return null;
    return {
      recommendedFee: fees.recommendedFee,
      btcPrice: fees.btcPrice,
    };
  }, [fees?.recommendedFee, fees?.btcPrice]);

  useEffect(() => {
    if (memoizedFeeData && !feeLoading) {
      logger.debug("ui", {
        message:
          "useTransactionForm: Updating fee and BTCPrice from fee signal",
        data: memoizedFeeData,
        feeSource: feeSource.source,
        isUsingFallback: isUsingFallback,
        lastGoodDataAge: lastGoodDataAge,
      });

      const recommendedFee = Math.round(memoizedFeeData.recommendedFee);
      const currentBtcPrice = memoizedFeeData.btcPrice;

      // Apply component-level fallbacks if needed
      let finalFee = recommendedFee;
      let finalBtcPrice = currentBtcPrice;

      // If fee is invalid or too low, use conservative fallback
      if (recommendedFee <= 0) {
        finalFee = 10; // Conservative 10 sats/vB fallback
        logger.warn("ui", {
          message: "useTransactionForm: Using conservative fee fallback",
          originalFee: recommendedFee,
          fallbackFee: finalFee,
          feeSource: feeSource.source,
        });
      }

      // If BTC price is invalid, keep previous value or use 0
      if (currentBtcPrice <= 0) {
        finalBtcPrice = lastValidBTCPrice > 0 ? lastValidBTCPrice : 0;
        logger.warn("ui", {
          message:
            "useTransactionForm: BTC price unavailable, keeping previous value",
          currentPrice: currentBtcPrice,
          fallbackPrice: finalBtcPrice,
        });
      } else {
        // Update last valid BTC price when we have a valid one
        setLastValidBTCPrice(currentBtcPrice);
      }

      // Only update fee automatically if user hasn't manually set one
      setFormState((prev) => ({
        ...prev,
        fee: userFee !== null ? userFee : finalFee, // Use userFee if set, otherwise use signal fee
        BTCPrice: finalBtcPrice,
        feeError: isUsingFallback && feeSource.confidence === "low"
          ? "Using estimated fees (network data unavailable)"
          : "",
      }));

      // Log fallback usage for monitoring
      if (isUsingFallback) {
        logger.info("ui", {
          message: "useTransactionForm: Using fallback fee data",
          source: feeSource.source,
          confidence: feeSource.confidence,
          dataAge: lastGoodDataAge,
          fee: finalFee,
        });
      }
    } else if (!feeLoading && !memoizedFeeData) {
      // Complete fallback when no fee data is available
      logger.warn("ui", {
        message:
          "useTransactionForm: No fee data available, using conservative fallback",
      });

      setFormState((prev) => ({
        ...prev,
        fee: userFee !== null ? userFee : (prev.fee > 0 ? prev.fee : 10), // Keep user fee or existing/fallback
        feeError: "Fee estimation unavailable - using conservative rate",
      }));
    }
  }, [
    memoizedFeeData,
    feeLoading,
    userFee,
  ]);

  useEffect(() => {
    if (isConnected && wallet.address) {
      const paramsForDebounce: DebouncedCallParams = {
        sourceAddress: wallet.address,
        feeRate: formState.fee,
      };
      if (formState.recipientAddress) {
        paramsForDebounce.recipientAddress = formState.recipientAddress;
      }
      if (formState.assetId) paramsForDebounce.assetId = formState.assetId;
      if (formState.amount) paramsForDebounce.amount = formState.amount;

      if (
        paramsForDebounce.recipientAddress && paramsForDebounce.assetId &&
        paramsForDebounce.amount && paramsForDebounce.feeRate > 0
      ) {
        calculateEstimatedFeesDebounced(paramsForDebounce, setFormState);
      } else {
        setFormState((prev) => ({
          ...prev,
          estimatedTxFees: prev.estimatedTxFees
            ? { ...prev.estimatedTxFees, hasExactFees: false }
            : null,
        }));
      }
    }
    return () => calculateEstimatedFeesDebounced.cancel();
  }, [
    isConnected,
    wallet.address,
    formState.recipientAddress,
    formState.assetId,
    formState.amount,
    userFee, // Use userFee instead of formState.fee to avoid circular dependency
  ]);

  const handleChangeFee = useCallback((newFee: number) => {
    setUserFee(newFee); // Track that user manually set the fee
    setFormState((prev) => ({
      ...prev,
      fee: newFee,
      feeError: "",
    }));
  }, []);

  const validateForm = () => {
    let isValid = true;
    const newState = { ...formState };

    if (formState.fee <= 0) {
      newState.feeError = "Fee must be set";
      isValid = false;
    }

    if (type !== "buy" && !formState.recipientAddress) {
      newState.addressError = "Recipient address is required";
      isValid = false;
    }

    if ((type === "send" || type === "transfer") && !formState.amount) {
      newState.amountError = "Amount is required";
      isValid = false;
    }

    setFormState(newState);
    return isValid;
  };

  const handleSubmit = async (
    actualSubmitCallback: () => Promise<void>,
  ) => {
    if (!isConnected) {
      showConnectWalletModal.value = true;
      return;
    }
    setSubmissionError(null);
    setSuccessMessage(null);
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await actualSubmitCallback();
    } catch (err) {
      const errorMsg = err instanceof Error
        ? err.message
        : "An error occurred during submission";
      logger.error("ui", {
        message: `Error in handleSubmit for ${type}`,
        error: errorMsg,
      });
      setSubmissionError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formState,
    setFormState,
    handleChangeFee,
    handleSubmit,
    isSubmitting,
    error: submissionError,
    setError: setSubmissionError,
    apiError: formState.apiError,
    setApiError: (msg: string | null) =>
      setFormState((prev) => ({ ...prev, apiError: msg })),
    successMessage,
    setSuccessMessage,
    fetchFees,
    forceRefresh,
    isLoading: feeLoading,
    // Fee source information for UI feedback
    feeSource,
    isUsingFallback,
    lastGoodDataAge,
  };
}
