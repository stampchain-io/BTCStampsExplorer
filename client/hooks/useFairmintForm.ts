import { useEffect, useState } from "preact/hooks";
import { useConfig } from "$client/hooks/useConfig.ts";
import { useFees } from "$fees";
import {
  showConnectWalletModal,
  walletContext,
} from "$client/wallet/wallet.ts";
import axiod from "axiod";
import { decodeBase64 } from "@std/encoding/base64";
import { encodeHex } from "@std/encoding/hex";
import { Config } from "$globals";
import { logger } from "$lib/utils/logger.ts";
import type { AncestorInfo } from "$types/index.d.ts";

interface FairmintFormState {
  asset: string;
  quantity: string;
  fee: number;
  BTCPrice: number;
  jsonSize: number;
  utxoAncestors?: AncestorInfo[];
  psbtFeeDetails?: {
    estMinerFee: number;
    totalDustValue: number;
    hasExactFees: boolean;
  };
}

export function useFairmintForm(fairminters: any[]) {
  const { config, isLoading: configLoading } = useConfig<Config>();
  const {
    fees,
    loading: feeLoading,
    fetchFees,
    feeSource,
    isUsingFallback,
    lastGoodDataAge,
    forceRefresh,
  } = useFees();
  const [isLoading, setIsLoading] = useState(configLoading || feeLoading);

  const [formState, setFormState] = useState<FairmintFormState>({
    asset: "",
    quantity: "",
    fee: 0,
    BTCPrice: 0,
    jsonSize: 0,
    utxoAncestors: [],
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
  const address = wallet.address;

  useEffect(() => {
    setIsLoading(configLoading || feeLoading);
  }, [configLoading, feeLoading]);

  useEffect(() => {
    if (fees && !feeLoading) {
      logger.debug("ui", {
        message: "useFairmintForm: Updating fee from fee signal",
        data: fees,
        feeSource,
        isUsingFallback,
        lastGoodDataAge,
      });

      const recommendedFee = Math.round(fees.recommendedFee);

      // Apply component-level fallbacks if needed
      let finalFee = recommendedFee;

      // If fee is invalid or too low, use conservative fallback
      if (recommendedFee <= 0) {
        finalFee = 10; // Conservative 10 sats/vB fallback
        logger.warn("ui", {
          message: "useFairmintForm: Using conservative fee fallback",
          originalFee: recommendedFee,
          fallbackFee: finalFee,
          feeSource: feeSource.source,
        });
      }

      setFormState((prev) => ({ ...prev, fee: finalFee }));

      // Log fallback usage for monitoring
      if (isUsingFallback) {
        logger.info("ui", {
          message: "useFairmintForm: Using fallback fee data",
          source: feeSource.source,
          confidence: feeSource.confidence,
          dataAge: lastGoodDataAge,
          fee: finalFee,
        });
      }
    } else if (!feeLoading && !fees) {
      // Complete fallback when no fee data is available
      logger.warn("ui", {
        message:
          "useFairmintForm: No fee data available, using conservative fallback",
      });

      setFormState((prev) => ({
        ...prev,
        fee: prev.fee > 0 ? prev.fee : 10, // Keep existing or use 10 sats/vB
      }));
    }
  }, [fees, feeLoading, feeSource, isUsingFallback, lastGoodDataAge]);

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
    if (!walletContext.isConnected) {
      showConnectWalletModal.value = true;
      return;
    }

    if (!config) {
      logger.error("ui", {
        message: "Configuration not loaded",
        context: "useFairmintForm",
      });
      setApiError("Configuration not loaded");
      return;
    }

    if (!formState.asset || !formState.quantity || formState.fee <= 0) {
      logger.warn("ui", {
        message: "Invalid form state",
        context: "useFairmintForm",
        formState,
      });
      setApiError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmissionMessage(null);
    setApiError("");

    try {
      logger.debug("ui", {
        message: "Submitting fairmint request",
        context: "useFairmintForm",
        payload: {
          address,
          asset: formState.asset,
          quantity: formState.quantity,
          fee_per_kb: formState.fee * 1000,
        },
      });

      const response = await axiod.post("/api/v2/fairmint/compose", {
        address,
        asset: formState.asset,
        quantity: formState.quantity,
        options: {
          fee_per_kb: formState.fee * 1000,
        },
        service_fee: config?.MINTING_SERVICE_FEE,
        service_fee_address: config?.MINTING_SERVICE_FEE_ADDRESS,
      });

      logger.debug("ui", {
        message: "Received API response from /api/v2/fairmint/compose",
        context: "useFairmintForm",
        response: response.data,
      });

      // Populate psbtFeeDetails from the response
      if (response.data?.result) {
        setFormState((prev) => ({
          ...prev,
          psbtFeeDetails: {
            estMinerFee: response.data.result.estimatedFee || 0,
            totalDustValue: response.data.result.totalOutputValue &&
                response.data.result.totalInputValue
              ? Number(
                BigInt(response.data.result.totalInputValue) -
                  BigInt(response.data.result.totalOutputValue) -
                  BigInt(response.data.result.estimatedFee || 0),
              )
              : 0,
            hasExactFees: response.data.result.estimatedFee !== undefined,
          },
        }));
      }

      const psbtBase64 = response.data?.result?.psbtHex ||
        response.data?.result?.psbt;

      if (!psbtBase64 || typeof psbtBase64 !== "string") {
        throw new Error("Invalid response from server: PSBT not found.");
      }

      // Convert the PSBT from Base64 to Uint8Array
      const psbtUint8Array = decodeBase64(psbtBase64);
      // Convert Uint8Array to Hex String
      const psbtHex = encodeHex(psbtUint8Array);

      logger.debug("ui", {
        message: "Processing PSBT",
        context: "useFairmintForm",
        psbtHex,
      });

      const { signed, txid, error } = await walletContext.signPSBT(
        wallet,
        psbtHex,
        [],
        true,
      );

      if (signed) {
        logger.info("ui", {
          message: "Transaction successfully broadcasted",
          context: "useFairmintForm",
          txid,
        });
        setSubmissionMessage({ message: " Broadcasted.", txid });
      } else {
        logger.error("ui", {
          message: "Transaction signing failed",
          context: "useFairmintForm",
          error,
        });
        setSubmissionMessage({ message: `Failed: ${error}` });
      }
    } catch (error: unknown) {
      logger.error("ui", {
        message: "Error during submission",
        context: "useFairmintForm",
        error: error instanceof Error ? error.message : String(error),
      });
      setApiError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const feeEstimationParams = {
    type: "fairmint",
    inputType: "P2WPKH",
    outputTypes: ["P2WPKH"],
    feeRate: formState.fee,
  };

  return {
    formState,
    handleAssetChange,
    handleInputChange,
    handleSubmit,
    handleChangeFee,
    fetchFees,
    forceRefresh,
    isLoading,
    isSubmitting,
    submissionMessage,
    apiError,
    feeEstimationParams,
    // Fee source information for UI feedback
    feeSource,
    isUsingFallback,
    lastGoodDataAge,
  };
}
