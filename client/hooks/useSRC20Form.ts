import { useEffect, useState } from "preact/hooks";
import {
  showConnectWalletModal,
  walletContext,
} from "$client/wallet/wallet.ts";
import axiod from "axiod";
import { useConfig } from "$client/hooks/useConfig.ts";
import { useFeePolling } from "$client/hooks/useFeePolling.ts";
import { fetchBTCPriceInUSD } from "$lib/utils/balanceUtils.ts";
import { Config } from "$globals";
import { logger } from "$lib/utils/logger.ts";
import type { AncestorInfo } from "$types/index.d.ts";
import { debounce } from "$lib/utils/debounce.ts";

interface PSBTFees {
  estMinerFee: number;
  totalDustValue: number;
  hasExactFees: boolean;
  totalValue?: number;
}

interface SRC20FormState {
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
  utxoAncestors?: AncestorInfo[];
  psbtFees?: PSBTFees;
}

interface UTXOAncestorResponse {
  ancestors: AncestorInfo[];
  error?: string;
}

interface TxDetails {
  estimatedSize: number;
  minerFee: number;
  dustValue: number;
  totalValue?: number;
}

const feeCache = new Map<string, { fee: number; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache

// Add cache for size estimates
const sizeEstimateCache = new Map<string, {
  size: number;
  timestamp: number;
}>();

export function useSRC20Form(
  action: string,
  trxType: "olga" | "multisig" = "multisig",
  initialToken?: string,
) {
  logger.debug("ui", {
    message: "useSRC20Form initialized",
    action,
    trxType,
    initialToken,
  });

  const { config } = useConfig<Config>();
  const { fees, fetchFees } = useFeePolling(300000); // 5 minutes
  const [apiError, setApiError] = useState<string>("");

  const [formState, setFormState] = useState<SRC20FormState>({
    toAddress: "",
    token: initialToken || "",
    amt: "",
    fee: 0,
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
    utxoAncestors: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<
    {
      message: string;
      txid?: string;
    } | null
  >(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  const { wallet } = walletContext;
  const address = wallet.address;

  useEffect(() => {
    if (fees) {
      const recommendedFee = Math.round(fees.recommendedFee);
      setFormState((prev) => ({ ...prev, fee: recommendedFee }));
    }
  }, [fees]);

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await fetchBTCPriceInUSD();
      setFormState((prev) => ({ ...prev, BTCPrice: price }));
    };
    fetchPrice();
  }, []);

  // Add state to track if we have a valid transaction to estimate
  const [hasValidTransaction, setHasValidTransaction] = useState(false);
  const [txDetails, setTxDetails] = useState<TxDetails | null>(null);

  // Add state to track if we have a valid estimate
  const [hasValidEstimate, setHasValidEstimate] = useState(false);

  // Separate fee estimation logic
  const estimateFees = async (partialEstimate = false) => {
    if (!canEstimateFees(partialEstimate)) return;

    // Generate cache key based on relevant fields
    const cacheKey = JSON.stringify({
      action,
      token: formState.token,
      amt: formState.amt,
      max: formState.max,
      lim: formState.lim,
    });

    // Check cache first
    const cached = sizeEstimateCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // Just update fee based on cached size
      const newFee = Math.ceil(cached.size * formState.fee);
      setFormState((prev) => ({
        ...prev,
        psbtFees: {
          estMinerFee: newFee,
          totalDustValue: prev.psbtFees?.totalDustValue || 546,
          hasExactFees: true,
        },
      }));
      return;
    }

    try {
      const response = await axiod.post("/api/v2/src20/create", {
        sourceAddress: wallet.address,
        toAddress: action === "transfer" ? formState.toAddress : wallet.address,
        satsPerVB: formState.fee,
        trxType,
        op: action,
        tick: formState.token,
        inputType: trxType === "olga" ? "P2WSH" : "P2SH",
        outputTypes: trxType === "olga" ? ["P2WSH"] : ["P2SH", "P2WSH"],
        utxoAncestors: formState.utxoAncestors,
        // Only include optional fields if not a partial estimate
        ...(!partialEstimate && {
          ...(formState.max && { max: formState.max }),
          ...(formState.lim && { lim: formState.lim }),
          ...(formState.dec && { dec: formState.dec }),
          ...(formState.amt && { amt: formState.amt }),
        }),
        dryRun: true,
        isEstimate: true,
      });

      if (response.data) {
        // Cache the size estimate
        sizeEstimateCache.set(cacheKey, {
          size: response.data.estimatedSize,
          timestamp: Date.now(),
        });

        setTxDetails(response.data);
        setFormState((prev) => ({
          ...prev,
          psbtFees: {
            estMinerFee: response.data.minerFee,
            totalDustValue: response.data.dustValue,
            hasExactFees: true,
          } satisfies PSBTFees,
        }));
      }
    } catch (error) {
      logger.error("stamps", {
        message: "Fee estimation failed",
        error,
        requestData: {
          partialEstimate,
          action,
          token: formState.token,
          fee: formState.fee,
        },
      });
    }
  };

  // Add a longer debounce for fee estimation
  const FEE_ESTIMATION_DEBOUNCE = 1000; // 1 second

  // Separate the fee estimation trigger conditions
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!wallet?.address || formState.fee <= 0 || isSearching) return;

    // Skip estimation if we already have a valid estimate and only the tick changed
    if (hasValidEstimate && action !== "deploy" && !formState.amt) {
      return;
    }

    const debouncedEstimate = debounce(() => {
      const shouldEstimate = action === "deploy"
        ? !!(formState.max && formState.lim && formState.dec)
        : !!formState.amt;

      if (shouldEstimate) {
        estimateFees(true);
        setHasValidEstimate(true);
      }
    }, FEE_ESTIMATION_DEBOUNCE);

    debouncedEstimate();

    return () => {
      debouncedEstimate.cancel();
    };
  }, [
    wallet?.address,
    formState.fee,
    isSearching,
    // Only include fields that affect transaction size
    action === "deploy" ? formState.max + formState.lim : formState.amt,
  ]);

  // Reset valid estimate when amount changes
  useEffect(() => {
    if (formState.amt) {
      setHasValidEstimate(false);
    }
  }, [formState.amt]);

  // Keep only the fee rate change handler
  useEffect(() => {
    if (txDetails && formState.fee > 0) {
      const newFee = Math.ceil(txDetails.estimatedSize * formState.fee);
      setFormState((prev) => ({
        ...prev,
        psbtFees: {
          estMinerFee: newFee,
          totalDustValue: prev.psbtFees?.totalDustValue || 0,
          hasExactFees: true,
        } satisfies PSBTFees,
      }));
    }
  }, [formState.fee, txDetails?.estimatedSize]); // Only depend on fee rate and size

  // When essential data changes
  useEffect(() => {
    logger.debug("stamps", {
      message: "Checking transaction requirements",
      data: {
        isConnected: !!wallet?.address,
        hasWalletAddress: !!wallet?.address,
        fee: formState.fee,
        token: formState.token,
        action,
        // Log relevant fields based on action
        ...(action === "deploy" && {
          max: formState.max,
          lim: formState.lim,
          dec: formState.dec,
        }),
      },
    });

    if (wallet?.address && formState.fee > 0 && !isSubmitting) {
      setHasValidTransaction(true);
      const prepareTx = async () => {
        try {
          const response = await axiod.post("/api/v2/src20/create", {
            sourceAddress: wallet.address,
            toAddress: wallet.address,
            satsPerVB: formState.fee,
            trxType,
            op: action,
            tick: formState.token || "TEST",
            // Include action-specific fields
            ...(action === "deploy" && {
              max: formState.max || "1000",
              lim: formState.lim || "1000",
              dec: formState.dec || "18",
              ...(formState.x && { x: formState.x }),
              ...(formState.tg && { tg: formState.tg }),
              ...(formState.web && { web: formState.web }),
              ...(formState.email && { email: formState.email }),
            }),
            ...(action === "mint" && {
              amt: formState.amt || "1",
            }),
            ...(action === "transfer" && {
              amt: formState.amt || "1",
              toAddress: formState.toAddress, // Include recipient address for transfers
            }),
            dryRun: true, // Add this for fee estimation
          });

          setTxDetails(response.data);
          setFormState((prev) => ({
            ...prev,
            psbtFees: {
              estMinerFee: response.data.minerFee,
              totalDustValue: response.data.dustValue,
              hasExactFees: true,
            } satisfies PSBTFees,
          }));
        } catch (error) {
          logger.error("stamps", {
            message: "Transaction preparation error",
            error,
          });
        }
      };

      // Debounce the fee estimation to prevent too many requests
      const debouncedPrepareTx = debounce(prepareTx, 500);
      debouncedPrepareTx();
    } else {
      setHasValidTransaction(false);
      setTxDetails(null);
    }
  }, [
    wallet?.address,
    formState.fee,
    action,
    formState.token,
    // Include deploy-specific fields
    ...(action === "deploy"
      ? [
        formState.max,
        formState.lim,
        formState.dec,
        formState.x,
        formState.tg,
        formState.web,
        formState.email,
      ]
      : [
        // Include action-specific fields for other types
        formState.amt,
      ]),
    trxType,
    isSubmitting,
  ]);

  // Handle fee rate changes without rebuilding transaction
  useEffect(() => {
    if (hasValidTransaction && txDetails && formState.fee) {
      // Only recalculate fees if we have a valid transaction
      const newFee = Math.ceil((txDetails.estimatedSize || 0) * formState.fee);
      setFormState((prev) => ({
        ...prev,
        psbtFees: {
          estMinerFee: newFee,
          totalDustValue: txDetails.dustValue || 0,
          hasExactFees: true,
        } as PSBTFees,
      }));
    }
  }, [formState.fee, hasValidTransaction, txDetails]);

  const handleInputChange = async (e: Event, field: string) => {
    const value = (e.target as HTMLInputElement).value;
    let newValue = value;

    if (field === "token") {
      newValue = value.toUpperCase().slice(0, 5);
    } else if (["lim", "max"].includes(field)) {
      newValue = handleIntegerInput(value, field);
    } else if (field === "dec") {
      newValue = handleDecimalInput(value);
    }

    setFormState((prev) => ({
      ...prev,
      [field]: newValue,
      [`${field}Error`]: "",
    }));

    if (field === "token" && action === "deploy") {
      try {
        const response = await axiod.get(
          `/api/v2/src20/tick/${newValue}/deploy`,
        );
        if (response.data && response.data.data) {
          setFormState((prev) => ({
            ...prev,
            tokenError: "This tick already exists.",
          }));
        } else {
          // The tick doesn't exist, which is what we want for deployment
          setFormState((prev) => ({ ...prev, tokenError: "" }));
        }
      } catch (error) {
        console.error("Error checking tick existence:", error);
        // Don't set an error message here, as a failure to check doesn't necessarily mean the tick is invalid
        setFormState((prev) => ({ ...prev, tokenError: "" }));
      }
    }
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

  const validateForm = () => {
    let isValid = true;
    const newState = { ...formState };

    if (!formState.token) {
      newState.tokenError = "Token is required";
      isValid = false;
    }

    if (action !== "deploy" && !formState.amt) {
      newState.amtError = "Amount is required";
      isValid = false;
    }

    if (action === "transfer" && !formState.toAddress) {
      newState.toAddressError = "To Address is required";
      isValid = false;
    }

    if (formState.fee <= 0) {
      newState.feeError = "Fee must be set";
      isValid = false;
    }

    if (action === "deploy") {
      if (!formState.max) {
        newState.maxError = "Max circulation is required";
        isValid = false;
      }
      if (!formState.lim) {
        newState.limError = "Limit per mint is required";
        isValid = false;
      }
    }

    setFormState(newState);
    return isValid;
  };

  const handleSubmit = async (additionalData = {}) => {
    logger.debug("ui", {
      message: "handleSubmit called",
      trxType,
      action,
      additionalData,
    });

    if (!walletContext.isConnected) {
      logger.info("ui", {
        message: "Wallet not connected, showing connect modal",
      });
      showConnectWalletModal.value = true;
      return;
    }

    setWalletError(null);
    setApiError("");

    if (!validateForm()) {
      logger.warn("ui", {
        message: "Form validation failed",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionMessage({ message: "Please wait..." });

    try {
      if (!config) {
        throw new Error("Configuration not loaded");
      }

      const endpoint = "/api/v2/src20/create";
      let requestData;

      logger.debug("ui", {
        message: "Preparing request data",
        action,
        trxType,
        endpoint,
      });

      requestData = {
        trxType,
        toAddress: action === "transfer" ? formState.toAddress : address,
        fromAddress: action === "transfer" ? address : undefined,
        changeAddress: address,
        op: action,
        tick: formState.token,
        feeRate: formState.fee,
        amt: formState.amt,
        service_fee: config?.MINTING_SERVICE_FEE,
        service_fee_address: config?.MINTING_SERVICE_FEE_ADDRESS,
        ...(action === "deploy" && {
          max: formState.max,
          lim: formState.lim,
          dec: formState.dec,
          x: formState.x,
          tg: formState.tg,
          web: formState.web,
          email: formState.email,
        }),
        ...additionalData,
        utxoAncestors: formState.utxoAncestors?.map((ancestor) => ({
          txid: ancestor.txid,
          vout: ancestor.vout,
          weight: ancestor.weight,
        })),
      };

      // Cache key based on relevant data
      const cacheKey = JSON.stringify({
        address,
        action,
        fileSize: formState.jsonSize,
        utxoCount: formState.utxoAncestors?.length,
      });

      // Check cache first
      const cachedFee = feeCache.get(cacheKey);
      if (cachedFee && Date.now() - cachedFee.timestamp < CACHE_DURATION) {
        setFormState((prev) => ({
          ...prev,
          psbtFees: {
            estMinerFee: cachedFee.fee,
            totalDustValue: formState.psbtFees?.totalDustValue || 0,
            hasExactFees: true,
          } as PSBTFees,
        }));
      }

      const response = await axiod.post(endpoint, requestData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      logger.debug("ui", {
        message: "API response received",
        responseData: JSON.stringify(response.data, null, 2),
      });

      if (!response.data || !response.data.hex) {
        throw new Error(
          "Invalid response from server: missing transaction data",
        );
      }

      logger.debug("ui", {
        message: "Preparing to sign PSBT",
        hexLength: response.data.hex.length,
        inputsToSignCount: response.data.inputsToSign?.length,
      });

      const walletResult = await walletContext.signPSBT(
        wallet,
        response.data.hex,
        response.data.inputsToSign || [],
        true,
      );

      logger.debug("ui", {
        message: "Wallet signing completed",
        result: walletResult,
      });

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

      if (response.data?.estMinerFee && response.data?.totalDustValue) {
        // Update cache
        feeCache.set(cacheKey, {
          fee: response.data.estMinerFee,
          timestamp: Date.now(),
        });

        setFormState((prev) => ({
          ...prev,
          psbtFees: {
            estMinerFee: response.data.estMinerFee,
            totalDustValue: response.data.totalDustValue,
            hasExactFees: true,
          } as PSBTFees,
        }));
      }

      return response.data;
    } catch (error) {
      logger.error("ui", {
        message: `${action} error occurred`,
        error: error instanceof Error ? error.message : String(error),
        details: error,
      });

      if (error instanceof Error) {
        const apiError = (error as any).response?.data?.error;
        setApiError(
          apiError || error.message || "An unexpected error occurred",
        );
      } else {
        setApiError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeFee = (newFee: number) => {
    setFormState((prev) => ({ ...prev, fee: newFee }));
  };

  // Add a function to check if we have enough data for estimation
  const canEstimateFees = (partialEstimate = false) => {
    // Basic requirements
    if (!wallet?.address || formState.fee <= 0) return false;
    if (!formState.token) return false;

    // For partial estimates, only require the basic fields
    if (partialEstimate) return true;

    // Full validation for final estimates
    switch (action) {
      case "deploy":
        return !!(formState.max && formState.lim && formState.dec);
      case "mint":
        return !!formState.amt;
      case "transfer":
        return !!formState.amt;
      default:
        return false;
    }
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
    walletError,
    setApiError,
    apiError,
    handleInputBlur,
    setIsSearching,
  };
}
