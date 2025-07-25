import { useConfig } from "$client/hooks/useConfig.ts";
import { walletContext } from "$client/wallet/wallet.ts";
import { useFees } from "$fees";
import { Config } from "$globals";
import { debounce } from "$lib/utils/performance/debounce.ts";
import { logger } from "$lib/utils/logger.ts";
import axiod from "axiod";
import { useEffect, useState } from "preact/hooks";

interface PSBTFees {
  estMinerFee: number;
  totalDustValue: number;
  hasExactFees: boolean;
  totalValue: number;
  est_tx_size: number;
  hex?: string;
  inputsToSign?: Array<
    { index: number; address?: string; sighashTypes?: number[] }
  >;
}

interface SRC101FormState {
  toAddress: string;
  token: string;
  amt: string;
  fee: number;
  feeError: string;
  BTCPrice: number;
  jsonSize: number;
  apiError: string;
  toAddressError: string;
  tokenError: string;
  amtError: string;
  max: string;
  maxError: string;
  lim: string;
  limError: string;
  dec: string;
  x: string;
  tg: string;
  web: string;
  email: string;
  file: File | null;
  psbtFees?: PSBTFees;
  maxAmount?: string;
  root: string;
  utxoAncestors?: Array<any>; // Add missing utxoAncestors property
  isLoading?: boolean;
}

export function useSRC101Form(
  action: string,
  trxType: "olga" | "multisig" = "multisig",
  initialToken?: string,
) {
  logger.debug("ui", {
    message: "useSRC101Form initialized",
    action,
    trxType,
    initialToken,
  });

  const { config } = useConfig<Config>();
  const { fees, fetchFees } = useFees();
  const [apiError, setApiError] = useState<string>("");

  const [formState, setFormState] = useState<SRC101FormState>({
    root: ".btc",
    toAddress: "",
    token: initialToken || "",
    amt: "",
    fee: 10, // Initialize with a safe default fee (10 sat/vB)
    feeError: "",
    BTCPrice: 0,
    jsonSize: 0,
    apiError: "",
    toAddressError: "",
    tokenError: "",
    amtError: "",
    max: "",
    maxError: "",
    lim: "",
    limError: "",
    dec: "18",
    x: "",
    tg: "",
    web: "",
    email: "",
    file: null as File | null,
    psbtFees: {
      estMinerFee: 0,
      totalDustValue: 0,
      hasExactFees: false,
      totalValue: 0,
      est_tx_size: 0,
    },
    isLoading: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<
    {
      message: string;
      txid?: string;
    } | null
  >(null);

  const { wallet } = walletContext;

  // Progressive fee estimation for SRC101
  const estimateSRC101FeesDebounced = debounce(async (
    formData: Partial<SRC101FormState>,
    walletAddress?: string,
  ) => {
    if (!formData.token || !formData.fee || formData.fee <= 0) return;

    try {
      // Phase 1: Immediate client-side fee estimation
      // SRC101 transactions typically have ~300 bytes
      // 1. Main output (dust to recipient ~546 sats)
      // 2. OP_RETURN output (0 sats for data)
      // 3. Change output (variable, back to sender)

      // Simple fee estimation: ~300 bytes for SRC101 transaction
      const estimatedTxSize = 300;
      const immediateEstimate = Math.ceil(estimatedTxSize * formData.fee);
      const dustValue = 546; // Standard SRC101 dust amount
      const totalEstimate = immediateEstimate + dustValue;

      // Set immediate estimates with hasExactFees: false
      setFormState((prev) => ({
        ...prev,
        psbtFees: {
          estMinerFee: immediateEstimate,
          totalDustValue: dustValue,
          totalValue: totalEstimate,
          hasExactFees: false, // Mark as estimate
          est_tx_size: estimatedTxSize,
        },
        isLoading: true, // Show that we're upgrading to exact fees
      }));

      logger.debug("ui", {
        message: "SRC101 immediate fee estimate",
        data: {
          action,
          fee: formData.fee,
          immediateEstimate,
          dustValue,
          totalEstimate,
          isEstimate: true,
        },
      });

      // Phase 2: Upgrade to exact fees via API with dryRun
      if (!config) return; // Need config for API call

      const shouldUseDryRun = !walletAddress; // Use dryRun if no wallet connected

      const response = await axiod.post("/api/v2/src101/create", {
        sourceAddress: walletAddress || "bc1qtest", // Dummy address for dryRun
        toAddress: formData.toAddress || walletAddress || "bc1qtest",
        op: action,
        root: formData.root || ".btc",
        feeRate: formData.fee,
        trxType,
        dryRun: shouldUseDryRun, // Dynamic based on wallet state
        ...(action === "deploy" && {
          max: formData.max || "1000",
          lim: formData.lim || "100",
          dec: formData.dec || "18",
        }),
        ...(["mint", "transfer"].includes(action) && {
          amt: formData.amt || "1",
        }),
      });

      if (response.data) {
        logger.debug("ui", {
          message: "SRC101 API fee response",
          data: {
            action,
            shouldUseDryRun,
            hasExactFees: !shouldUseDryRun,
            response: response.data,
          },
        });

        setFormState((prev) => ({
          ...prev,
          psbtFees: {
            estMinerFee: Number(response.data.est_miner_fee) ||
              Number(response.data.estimatedFee) || 0,
            totalDustValue: Number(response.data.total_dust_value) || 546,
            hasExactFees: !shouldUseDryRun, // Exact fees when dryRun=false, estimates when dryRun=true
            totalValue: (Number(response.data.est_miner_fee) || 0) +
              (Number(response.data.total_dust_value) || 546),
            est_tx_size: Number(response.data.est_tx_size) || 0,
            hex: response.data.hex,
            inputsToSign: response.data.inputsToSign,
          },
          isLoading: false, // Clear loading state after exact fees are loaded
        }));
      }
    } catch (error) {
      logger.error("ui", {
        message: "Failed to estimate SRC101 fees",
        error: error instanceof Error ? error.message : String(error),
      });

      // On error, preserve estimates and clear loading state
      setFormState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, 750);

  useEffect(() => {
    if (fees) {
      const recommendedFee = Math.round(fees.recommendedFee);
      // Only update fee if the recommended fee is valid (>= 1 sat/vB)
      if (recommendedFee >= 1) {
        setFormState((prev) => ({ ...prev, fee: recommendedFee }));
      }
    }
  }, [fees]);

  // Trigger progressive fee estimation when form values change
  useEffect(() => {
    if (formState.token && formState.fee > 0) {
      estimateSRC101FeesDebounced(formState, wallet?.address);
    }

    return () => {
      estimateSRC101FeesDebounced.cancel();
    };
  }, [
    formState.token,
    formState.amt,
    formState.toAddress,
    formState.fee,
    formState.max,
    formState.lim,
    formState.dec,
    wallet?.address,
    config,
    estimateSRC101FeesDebounced,
  ]);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        // Fetch from the dedicated BTC price endpoint
        const response = await fetch("/api/internal/btcPrice");
        if (!response.ok) {
          console.error(
            `Error fetching BTC price: ${response.status} ${response.statusText}`,
          );
          throw new Error("Failed to fetch BTC price");
        }
        const data = await response.json();
        // Adjust parsing for the structure of /api/internal/btcPrice response
        const price = (data.data && data.data.price) || 0;
        setFormState((prev) => ({ ...prev, BTCPrice: price }));
      } catch (error) {
        console.error("Error fetching BTC price from client-side hook:", error);
        setFormState((prev) => ({ ...prev, BTCPrice: 0 }));
      }
    };
    fetchPrice();
  }, []);

  const handleInputChange = (e: Event, field: string) => {
    const value = (e.target as HTMLInputElement).value;
    let newValue = value;

    if (["lim", "max"].includes(field)) {
      newValue = handleIntegerInput(value, field);
    } else if (field === "dec") {
      newValue = handleDecimalInput(value);
    }

    setFormState((prev) => ({
      ...prev,
      [field]: newValue,
      [`${field}Error`]: "",
    }));

    return; // Add explicit return for all other cases
  };

  // Add blur handler
  const handleInputBlur = (field: string) => {
    if (["max", "lim"].includes(field)) {
      try {
        const maxValue = BigInt(formState.max || "0");
        const limValue = BigInt(formState.lim || "0");

        if (maxValue > 0n && limValue > maxValue) {
          // Only adjust lim if max is set and lim exceeds it
          setFormState((prev) => ({
            ...prev,
            lim: maxValue.toString(),
            limError:
              "Limit Per Mint cannot exceed Max Circulation. Adjusted to match Max Circulation.",
          }));
        } else if (maxValue > 0n && limValue > 0n) {
          // Clear any errors if values are valid
          setFormState((prev) => ({
            ...prev,
            maxError: "",
            limError: "",
          }));
        }
      } catch {
        // Invalid numbers, handled by handleIntegerInput
      }
    }
  };

  const handleIntegerInput = (value: string, field: string): string => {
    const sanitizedValue = value.replace(/\D/g, "");
    if (sanitizedValue === "") return "";

    try {
      const bigIntValue = BigInt(sanitizedValue);
      const maxUint64 = BigInt("18446744073709551615"); // 2^64 - 1

      if (bigIntValue <= maxUint64) {
        return sanitizedValue;
      } else {
        setFormState((prev) => ({
          ...prev,
          [`${field}Error`]: "Value exceeds maximum allowed (2^64 - 1)",
        }));
        return value;
      }
    } catch {
      return value;
    }
  };

  const handleDecimalInput = (value: string): string => {
    const sanitizedValue = value.replace(/\D/g, "");
    const numValue = parseInt(sanitizedValue, 10);
    if (
      sanitizedValue === "" ||
      (!isNaN(numValue) && numValue >= 0 && numValue <= 18)
    ) {
      return sanitizedValue;
    }
    return formState.dec;
  };

  const handleSubmit = async () => {
    try {
      if (!wallet?.address) {
        return setSubmissionMessage({ message: "Please connect your wallet" });
      }

      setIsSubmitting(true);
      setApiError("");

      // Log submission attempt
      logger.debug("stamps", {
        message: "Transaction submission started",
        data: {
          action,
          trxType,
          satsPerVB: formState.fee,
          currentEstimate: formState.psbtFees,
        },
      });

      // For submission, we always need the actual PSBT (dryRun: false)
      const response = await axiod.post("/api/v2/src101/create", {
        sourceAddress: wallet?.address,
        changeAddress: wallet?.address,
        recAddress: wallet?.address,
        toAddress: formState.toAddress || wallet?.address,
        op: action,
        root: formState.root || ".btc",
        feeRate: formState.fee,
        trxType,
        dryRun: false, // Always false for actual submission
        ...(action === "deploy" && {
          max: formState.max || "1000",
          lim: formState.lim || "100",
          dec: formState.dec || "18",
          ...(formState.x && { x: formState.x }),
          ...(formState.tg && { tg: formState.tg }),
          ...(formState.web && { web: formState.web }),
          ...(formState.email && { email: formState.email }),
        }),
        ...(["mint", "transfer"].includes(action) && {
          amt: formState.amt || "1",
        }),
        // Legacy fields for compatibility
        hash:
          "77fb147b72a551cf1e2f0b37dccf9982a1c25623a7fe8b4d5efaac566cf63fed",
        tokenid: [btoa(formState.toAddress || "test")],
        dua: "999",
        prim: "true",
        coef: "1000",
        sig: "",
        img: [
          `https://img.bitname.pro/img/${formState.toAddress || "test"}.png`,
        ],
      });

      logger.debug("stamps", {
        message: `${action} response received`,
        data: response.data,
      });

      // Update psbtFees with exact values from submission
      if (response.data) {
        setFormState((prev) => ({
          ...prev,
          psbtFees: {
            estMinerFee: Number(response.data.est_miner_fee) ||
              Number(response.data.estimatedFee) || 0,
            totalDustValue: Number(response.data.total_dust_value) || 546,
            hasExactFees: true, // Always exact for submission
            totalValue: (Number(response.data.est_miner_fee) || 0) +
              (Number(response.data.total_dust_value) || 546),
            est_tx_size: Number(response.data.est_tx_size) || 0,
            hex: response.data.hex,
            inputsToSign: response.data.inputsToSign,
          },
        }));
      }

      if (response.data?.hex && response.data?.inputsToSign) {
        const walletResult = await walletContext.signPSBT(
          wallet,
          response.data.hex,
          response.data.inputsToSign,
          true,
        );

        if (walletResult.signed) {
          setSubmissionMessage({
            message: "Transaction broadcasted successfully.",
            txid: walletResult.txid,
          });
        } else if (walletResult.cancelled) {
          setSubmissionMessage({
            message: "Transaction signing cancelled by user.",
          });
        } else {
          setSubmissionMessage({
            message: `Transaction signing failed: ${walletResult.error}`,
          });
        }

        return response.data;
      }
    } catch (error) {
      logger.error("ui", {
        message: `${action} error occurred`,
        error: error instanceof Error ? error.message : String(error),
        details: error,
      });

      const apiError = (error as any).response?.data?.error;
      const errorMessage = error instanceof Error
        ? error.message
        : "An unexpected error occurred";
      setApiError(apiError || errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeFee = (newFee: number) => {
    // Ensure fee is never below the minimum required (1 sat/vB)
    const validatedFee = Math.max(newFee, 1);
    setFormState((prev) => ({ ...prev, fee: validatedFee }));
  };

  return {
    formState,
    setFormState,
    handleChangeFee,
    handleInputChange,
    handleSubmit,
    fetchFees,
    config,
    isSubmitting,
    submissionMessage,
    setApiError,
    apiError,
    handleInputBlur,
  };
}
