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

// Add a new interface for cache keys
interface SizeEstimateCacheKey {
  action: string;
  token: string;
  trxType: string;
  dec?: string;
  amt?: string;
  max?: string;
  lim?: string;
  x?: string;
  tg?: string;
  web?: string;
  email?: string;
  toAddress?: string;
}

export class SRC20FormController {
  private static prepareTxDebounced = debounce(async (
    params: {
      wallet: { address?: string };
      formState: SRC20FormState;
      action: string;
      trxType: string;
      canEstimateFees: (partial: boolean) => boolean;
    },
    callbacks: {
      setTxDetails: (details: any) => void;
      setFormState: (fn: (prev: SRC20FormState) => SRC20FormState) => void;
      logger: typeof logger;
    },
  ) => {
    const { wallet, formState, action, trxType, canEstimateFees } = params;
    const { setTxDetails, setFormState, logger } = callbacks;

    if (!wallet.address) return;

    // Generate cache key for this request
    const cacheKey = JSON.stringify(
      {
        action,
        token: formState.token,
        trxType,
        dec: formState.dec,
        ...(action !== "deploy" && { amt: formState.amt }),
        ...(action === "deploy" && {
          max: formState.max,
          lim: formState.lim,
        }),
      } satisfies SizeEstimateCacheKey,
    );

    // Check size estimate cache first
    const cached = sizeEstimateCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      const newFee = Math.ceil(cached.size * formState.fee);
      setFormState((prev) => ({
        ...prev,
        psbtFees: {
          estMinerFee: newFee,
          totalDustValue: prev.psbtFees?.totalDustValue || 546,
          hasExactFees: true,
        } satisfies PSBTFees,
      }));
      return;
    }

    try {
      // Skip API call if we don't have minimum required fields
      if (!canEstimateFees(true)) return;

      const response = await axiod.post("/api/v2/src20/create", {
        sourceAddress: wallet.address,
        toAddress: wallet.address,
        satsPerVB: formState.fee,
        trxType,
        op: action,
        tick: formState.token || "TEST",
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
          toAddress: formState.toAddress,
        }),
        dryRun: true,
      });

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
    } catch (error) {
      logger.error("stamps", {
        message: "Transaction preparation error",
        error,
      });
    }
  }, 1000); // Increase debounce time for fee calculations

  private static checkTokenExistenceDebounced = debounce(async (
    token: string,
    setFormState: (fn: (prev: SRC20FormState) => SRC20FormState) => void,
  ) => {
    try {
      const response = await axiod.get(`/api/v2/src20/tick/${token}/deploy`);
      if (response.data && response.data.data) {
        setFormState((prev) => ({
          ...prev,
          tokenError: "This tick already exists.",
        }));
      } else {
        setFormState((prev) => ({ ...prev, tokenError: "" }));
      }
    } catch (error) {
      console.error("Error checking tick existence:", error);
      setFormState((prev) => ({ ...prev, tokenError: "" }));
    }
  }, 800);

  static prepareTx(
    ...args: Parameters<typeof SRC20FormController.prepareTxDebounced>
  ) {
    return this.prepareTxDebounced(...args);
  }

  static checkTokenExistence(
    ...args: Parameters<typeof SRC20FormController.checkTokenExistenceDebounced>
  ) {
    return this.checkTokenExistenceDebounced(...args);
  }

  static cancelPrepareTx() {
    this.prepareTxDebounced.cancel();
  }

  static cancelTokenCheck() {
    this.checkTokenExistenceDebounced.cancel();
  }
}

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

  // Separate fee estimation logic
  const estimateFees = async (partialEstimate = false): Promise<void> => {
    if (!canEstimateFees(partialEstimate)) return;

    // Generate consistent cache key with all relevant fields
    const cacheKey = JSON.stringify(
      {
        action,
        token: formState.token,
        trxType,
        ...(action === "deploy" && {
          dec: formState.dec,
          max: formState.max,
          lim: formState.lim,
          ...(formState.x && { x: formState.x }),
          ...(formState.tg && { tg: formState.tg }),
          ...(formState.web && { web: formState.web }),
          ...(formState.email && { email: formState.email }),
        }),
        ...(action !== "deploy" && {
          amt: formState.amt,
          ...(action === "transfer" && { toAddress: formState.toAddress }),
        }),
      } satisfies SizeEstimateCacheKey,
    );

    // Check cache first
    const cached = sizeEstimateCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
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
      // Always include essential fields for accurate estimation
      const requestData = {
        sourceAddress: wallet.address,
        toAddress: action === "transfer" ? formState.toAddress : wallet.address,
        satsPerVB: formState.fee,
        trxType,
        op: action,
        tick: formState.token,

        // Include operation-specific fields with all optional fields
        ...(action === "deploy" && {
          max: formState.max || "1000",
          lim: formState.lim || "1000",
          dec: formState.dec || "18",
          ...(formState.x && { x: formState.x }),
          ...(formState.tg && { tg: formState.tg }),
          ...(formState.web && { web: formState.web }),
          ...(formState.email && { email: formState.email }),
        }),
        ...(["mint", "transfer"].includes(action) && {
          amt: formState.amt || "1",
        }),
        dryRun: true,
        isEstimate: true,
      };

      const response = await axiod.post("/api/v2/src20/create", requestData);

      if (response.data) {
        // Cache the size estimate with the consistent key
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
        ...(action === "deploy" && {
          max: formState.max,
          lim: formState.lim,
          dec: formState.dec,
        }),
      },
    });

    if (wallet?.address && formState.fee > 0 && !isSubmitting) {
      setHasValidTransaction(true);

      SRC20FormController.prepareTx(
        {
          wallet,
          formState,
          action,
          trxType,
          canEstimateFees,
        },
        {
          setTxDetails,
          setFormState,
          logger,
        },
      );
    } else {
      setHasValidTransaction(false);
      setTxDetails(null);
    }

    return () => {
      // Now we can properly cancel the debounced function
      SRC20FormController.cancelPrepareTx();
    };
  }, [
    wallet?.address,
    formState.fee,
    action,
    formState.token,
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
      : [formState.amt]),
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
      setFormState((prev) => ({
        ...prev,
        [field]: newValue,
        [`${field}Error`]: "",
      }));

      // Only check token existence if we're deploying and have a value
      if (action === "deploy" && newValue) {
        SRC20FormController.checkTokenExistence(newValue, setFormState);
      }
      return () => {
        SRC20FormController.cancelTokenCheck();
      };
    }

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
      const requestData = {
        sourceAddress: wallet.address,
        toAddress: action === "transfer" ? formState.toAddress : wallet.address,
        changeAddress: wallet.address,
        trxType,
        op: action,
        tick: formState.token,
        satsPerVB: Number(formState.fee),
        ...(action === "deploy" && {
          max: formState.max,
          lim: formState.lim,
          dec: formState.dec,
          x: formState.x,
          tg: formState.tg,
          web: formState.web,
          email: formState.email,
        }),
        ...(["mint", "transfer"].includes(action) && {
          amt: formState.amt,
        }),
        service_fee: config.MINTING_SERVICE_FEE,
        service_fee_address: config.MINTING_SERVICE_FEE_ADDRESS,
        ...(formState.utxoAncestors?.length && {
          utxoAncestors: formState.utxoAncestors.map((ancestor) => ({
            txid: ancestor.txid,
            vout: ancestor.vout,
            weight: ancestor.weight,
          })),
        }),
        ...additionalData,
      };

      logger.debug("stamps", {
        message: "Sending request to create endpoint",
        requestData,
      });

      const response = await axiod.post(endpoint, requestData);

      logger.debug("stamps", {
        message: "Received response from create endpoint",
        responseData: response.data,
      });

      if (!response.data?.hex) {
        throw new Error("No transaction hex received from server");
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
  };
}
