import { useEffect, useState } from "preact/hooks";
import { useConfig } from "$/hooks/useConfig.ts";
import { useFeePolling } from "hooks/useFeePolling.tsx";
import { showConnectWalletModal, walletContext } from "store/wallet/wallet.ts";
import axiod from "axiod";

// Add these two import statements
import { decode as atob } from "https://deno.land/std@0.95.0/encoding/base64.ts";
import { encode as hexEncode } from "https://deno.land/std@0.95.0/encoding/hex.ts";

export function useFairmintForm(fairminters: any[]) {
  const { config, isLoading: configLoading } = useConfig();
  const { fees, loading: feeLoading, fetchFees } = useFeePolling(300000);
  const [isLoading, setIsLoading] = useState(configLoading || feeLoading);

  const [formState, setFormState] = useState({
    asset: "",
    quantity: "",
    fee: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<
    {
      message: string;
      txid?: string;
    } | null
  >(null);
  const [apiError, setApiError] = useState("");

  const { wallet } = walletContext;
  const address = wallet.value.address;

  useEffect(() => {
    setIsLoading(configLoading || feeLoading);
  }, [configLoading, feeLoading]);

  useEffect(() => {
    if (fees && !feeLoading) {
      const recommendedFee = Math.round(fees.recommendedFee);
      setFormState((prev) => ({ ...prev, fee: recommendedFee }));
    }
  }, [fees, feeLoading]);

  const handleAssetChange = (e: Event) => {
    const selectedAsset = (e.target as HTMLSelectElement).value;
    const selectedFairminter = fairminters.find(
      (fm) => fm.asset === selectedAsset,
    );
    setFormState((prev) => ({
      ...prev,
      asset: selectedAsset,
      quantity: selectedFairminter
        ? selectedFairminter.max_mint_per_tx
        : prev.quantity,
    }));
  };

  const handleInputChange = (e: Event, field: string) => {
    const value = (e.target as HTMLInputElement).value;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangeFee = (newFee: number) => {
    setFormState((prev) => ({ ...prev, fee: newFee }));
  };

  const handleSubmit = async () => {
    if (!walletContext.isConnected.value) {
      showConnectWalletModal.value = true;
      return;
    }

    if (!formState.asset || !formState.quantity || formState.fee <= 0) {
      setApiError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmissionMessage(null);
    setApiError("");

    try {
      const response = await axiod.post("/api/v2/fairmint/compose", {
        address,
        asset: formState.asset,
        quantity: formState.quantity,
        options: {
          fee_per_kb: formState.fee * 1000, // sat/byte to sat/kB
        },
      });

      console.log("API response:", response.data);

      // Extract psbt from the response
      const psbtBase64 = response.data?.result?.psbt;

      if (!psbtBase64 || typeof psbtBase64 !== "string") {
        throw new Error("Invalid response from server: PSBT not found.");
      }

      console.log("psbtBase64:", psbtBase64);

      // Convert the PSBT from Base64 to Hex
      const psbtUint8Array = atob(psbtBase64);
      const psbtHexArray = hexEncode(new Uint8Array(psbtUint8Array));
      const psbtHex = new TextDecoder().decode(psbtHexArray);

      console.log("psbtHex:", psbtHex);

      const { signed, txid, error } = await walletContext.signPSBT(
        wallet.value,
        psbtHex,
        [],
        true,
      );

      if (signed) {
        setSubmissionMessage({ message: "Transaction broadcasted.", txid });
      } else {
        setSubmissionMessage({ message: `Transaction failed: ${error}` });
      }
    } catch (error) {
      console.error("Error during submission:", error);
      setApiError(error.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const feeEstimationParams = {
    type: "fairmint",
    fileSize: 0,
    issuance: 1,
    BTCPrice: 0, // Replace with actual BTC price if needed
  };

  return {
    formState,
    handleAssetChange,
    handleInputChange,
    handleSubmit,
    handleChangeFee,
    fetchFees,
    isLoading,
    isSubmitting,
    submissionMessage,
    apiError,
    feeEstimationParams,
  };
}
