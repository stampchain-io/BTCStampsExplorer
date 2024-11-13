import { useEffect, useState } from "preact/hooks";
import { useFeePolling } from "$client/hooks/useFeePolling.ts";
import { fetchBTCPriceInUSD } from "$lib/utils/btc.ts";
import {
  showConnectWalletModal,
  walletContext,
} from "$client/wallet/wallet.ts";

interface TransactionFormState {
  fee: number;
  feeError: string;
  BTCPrice: number;
  recipientAddress?: string;
  addressError?: string;
  amount?: string;
  amountError?: string;
}

interface UseTransactionFormProps {
  type: "send" | "transfer" | "buy";
  initialFee?: number;
}

export function useTransactionForm(
  { type, initialFee = 0 }: UseTransactionFormProps,
) {
  const { fees, loading: feeLoading, fetchFees } = useFeePolling(300000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formState, setFormState] = useState<TransactionFormState>({
    fee: initialFee,
    feeError: "",
    BTCPrice: 0,
    recipientAddress: "",
    addressError: "",
    amount: "",
    amountError: "",
  });

  // Initialize with recommended fee
  useEffect(() => {
    if (fees?.recommendedFee) {
      handleChangeFee(Math.round(fees.recommendedFee));
    }
  }, [fees?.recommendedFee]);

  // Fetch BTC price
  useEffect(() => {
    const fetchPrice = async () => {
      const price = await fetchBTCPriceInUSD();
      setFormState((prev) => ({ ...prev, BTCPrice: price }));
    };
    fetchPrice();
  }, []);

  const handleChangeFee = (newFee: number) => {
    setFormState((prev) => ({
      ...prev,
      fee: newFee,
      feeError: "",
    }));
  };

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

  const handleSubmit = async (submitCallback: () => Promise<void>) => {
    if (!walletContext.isConnected) {
      showConnectWalletModal.value = true;
      return;
    }

    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await submitCallback();
    } catch (err) {
      console.error("Transaction error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
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
    error,
    setError,
    successMessage,
    setSuccessMessage,
    fetchFees,
    isLoading: feeLoading,
  };
}
