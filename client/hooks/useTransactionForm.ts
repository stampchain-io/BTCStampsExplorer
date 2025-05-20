import { useCallback, useEffect, useState } from "preact/hooks";
import { useFeePolling } from "$client/hooks/useFeePolling.ts";
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
  const { fees, loading: feeLoading, fetchFees } = useFeePolling(300000);
  const { wallet, isConnected } = walletContext;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (fees && !feeLoading) {
      logger.debug("ui", {
        message:
          "useTransactionForm: Updating fee and BTCPrice from useFeePolling",
        data: fees,
      });
      const recommendedFee = Math.round(fees.recommendedFee);
      const currentBtcPrice = fees.btcPrice;
      setFormState((prev) => ({
        ...prev,
        fee: recommendedFee > 0 ? recommendedFee : prev.fee,
        BTCPrice: currentBtcPrice > 0 ? currentBtcPrice : prev.BTCPrice,
      }));
    } else if (!feeLoading && !fees) {
      logger.warn("ui", {
        message:
          "useTransactionForm: Fee polling from useFeePolling returned no fees object (null).",
      });
    }
  }, [fees, feeLoading]);

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
    formState.fee,
  ]);

  const handleChangeFee = useCallback((newFee: number) => {
    setFormState((prev) => ({
      ...prev,
      fee: newFee,
      feeError: "",
    }));
  }, [setFormState]);

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
    isLoading: feeLoading,
  };
}
