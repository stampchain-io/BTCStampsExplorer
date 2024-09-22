import { useEffect, useState } from "preact/hooks";
import { showConnectWalletModal, walletContext } from "store/wallet/wallet.ts";
import axiod from "axiod";
import { useConfig } from "$/hooks/useConfig.ts";
import { useFeePolling } from "hooks/useFeePolling.tsx";
import { fetchBTCPrice } from "$lib/utils/btc.ts";
import { calculateJsonSize } from "$lib/utils/jsonUtils.ts";

export function useSRC20Form(
  operation: "mint" | "deploy" | "transfer",
  trxType: "olga" | "multisig",
) {
  console.log("useSRC20Form initialized with:", { operation, trxType });

  const { config, isLoading: configLoading } = useConfig();
  const { fees, loading: feeLoading, fetchFees } = useFeePolling(300000); // 5 minutes

  const [formState, setFormState] = useState({
    toAddress: "",
    token: "",
    amt: "",
    fee: 0,
    feeError: "",
    BTCPrice: 0,
    jsonSize: 0,
    apiError: "",
    toAddressError: "",
    tokenError: "",
    amtError: "",
    // Deploy-specific fields
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
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null,
  );
  const [walletError, setWalletError] = useState<string | null>(null);

  const { wallet, isConnected } = walletContext;
  const { address } = wallet.value;

  const isLoading = configLoading || feeLoading;

  useEffect(() => {
    if (fees && !feeLoading) {
      const recommendedFee = Math.round(fees.recommendedFee);
      setFormState((prev) => ({ ...prev, fee: recommendedFee }));
    }
  }, [fees, feeLoading]);

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await fetchBTCPrice();
      setFormState((prev) => ({ ...prev, BTCPrice: price }));
    };
    fetchPrice();
  }, []);

  useEffect(() => {
    const jsonData = {
      p: "SRC-20",
      op: operation,
      tick: formState.token,
      amt: formState.amt,
      ...(operation === "deploy" && {
        max: formState.max,
        lim: formState.lim,
        dec: formState.dec,
        x: formState.x,
        tg: formState.tg,
        web: formState.web,
        email: formState.email,
      }),
    };

    const size = calculateJsonSize(jsonData);
    setFormState((prev) => ({ ...prev, jsonSize: size }));
  }, [
    formState.token,
    formState.amt,
    operation,
    ...(operation === "deploy"
      ? [
        formState.max,
        formState.lim,
        formState.dec,
        formState.x,
        formState.tg,
        formState.web,
        formState.email,
      ]
      : []),
  ]);

  const handleChangeFee = (newFee: number) => {
    setFormState((prev) => ({ ...prev, fee: newFee }));
  };

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

    if (field === "token" && operation === "deploy") {
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

  const handleIntegerInput = (value: string, field: string): string => {
    const sanitizedValue = value.replace(/\D/g, "");
    if (sanitizedValue === "") return "";

    const bigIntValue = BigInt(sanitizedValue);
    const maxUint64 = BigInt("18446744073709551615"); // 2^64 - 1

    if (bigIntValue <= maxUint64) {
      if (field === "max") {
        const limitValue = BigInt(formState.lim || "0");
        if (bigIntValue < limitValue) {
          // If max is less than lim, update lim to match max
          setFormState((prev) => ({
            ...prev,
            lim: sanitizedValue,
            limError: "Limit Per Mint adjusted to match Max Circulation",
          }));
        } else {
          setFormState((prev) => ({ ...prev, maxError: "", limError: "" }));
        }
      } else if (field === "lim") {
        const maxValue = BigInt(formState.max || "0");
        if (maxValue !== BigInt(0) && bigIntValue > maxValue) {
          // If lim is greater than max, set lim to max
          setFormState((prev) => ({
            ...prev,
            limError:
              "Limit Per Mint cannot exceed Max Circulation. Adjusted to match Max Circulation.",
          }));
          return maxValue.toString();
        } else {
          setFormState((prev) => ({ ...prev, limError: "" }));
        }
      }
      return sanitizedValue;
    } else {
      setFormState((prev) => ({
        ...prev,
        [`${field}Error`]: "Value exceeds maximum allowed (2^64 - 1)",
      }));
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

    if (operation !== "deploy" && !formState.amt) {
      newState.amtError = "Amount is required";
      isValid = false;
    }

    if (operation === "transfer" && !formState.toAddress) {
      newState.toAddressError = "To Address is required";
      isValid = false;
    }

    if (formState.fee <= 0) {
      newState.feeError = "Fee must be set";
      isValid = false;
    }

    if (operation === "deploy") {
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
    console.log("handleSubmit called with trxType:", trxType);
    console.log("Entering handleSubmit in useSRC20Form");

    if (!isConnected.value) {
      console.log("Wallet not connected. Showing connect modal.");
      showConnectWalletModal.value = true;
      return;
    }

    setWalletError(null);
    setApiError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionMessage("Please wait...");

    try {
      if (!config) throw new Error("Configuration not loaded");

      let endpoint, requestData;

      console.log("Preparing request data for operation:", operation);

      if (trxType === "olga") {
        endpoint = "/api/v2/src20/v2create";
        requestData = {
          sourceWallet: address,
          toAddress: operation === "transfer" ? formState.toAddress : address,
          src20Action: {
            p: "SRC-20",
            op: operation,
            tick: formState.token,
            amt: formState.amt,
            ...(operation === "deploy" && {
              max: formState.max,
              lim: formState.lim,
              dec: formState.dec,
              x: formState.x,
              tg: formState.tg,
              web: formState.web,
              email: formState.email,
            }),
          },
          satsPerKB: formState.fee,
          service_fee: config?.MINTING_SERVICE_FEE,
          service_fee_address: config?.MINTING_SERVICE_FEE_ADDRESS,
        };
      } else {
        endpoint = "/api/v2/src20/create";
        requestData = {
          toAddress: operation === "transfer" ? formState.toAddress : address,
          fromAddress: operation === "transfer" ? address : undefined,
          changeAddress: address,
          op: operation,
          tick: formState.token,
          feeRate: formState.fee,
          amt: formState.amt,
          service_fee: config?.MINTING_SERVICE_FEE,
          service_fee_address: config?.MINTING_SERVICE_FEE_ADDRESS,
          ...(operation === "deploy" && {
            max: formState.max,
            lim: formState.lim,
            dec: formState.dec,
            x: formState.x,
            tg: formState.tg,
            web: formState.web,
            email: formState.email,
          }),
          ...additionalData,
        };
      }

      console.log("Sending request to:", endpoint);
      console.log("Request data:", JSON.stringify(requestData, null, 2));
      const response = await axiod.post(endpoint, requestData);
      console.log("Full API response:", JSON.stringify(response.data, null, 2));

      if (!response.data || !response.data.hex) {
        console.log("Invalid response from server: missing transaction data");
        throw new Error(
          "Invalid response from server: missing transaction data",
        );
      }

      console.log("Preparing to sign PSBT");
      console.log("PSBT hex length:", response.data.hex.length);
      console.log(
        "Number of inputs to sign:",
        response.data.inputsToSign?.length,
      );

      // Handle wallet interaction
      console.log("Calling walletContext.signPSBT");
      const walletResult = await walletContext.signPSBT(
        wallet.value,
        response.data.hex,
        response.data.inputsToSign || [],
        true, // Enable RBF
      );

      console.log("Wallet signing result:", walletResult);

      if (walletResult.signed) {
        console.log("Transaction signed successfully");
        setSubmissionMessage("Transaction signed successfully");
        if (walletResult.psbt) {
          console.log("Signed PSBT:", walletResult.psbt);
        }
      } else if (walletResult.cancelled) {
        console.log("Transaction signing cancelled by user");
        setSubmissionMessage("Transaction signing cancelled by user");
      } else {
        console.log("Transaction signing failed:", walletResult.error);
        setSubmissionMessage(
          `Transaction signing failed: ${walletResult.error}`,
        );
      }

      return response.data;
    } catch (error) {
      console.error(`${operation} error:`, error);
      if (error.response && error.response.data && error.response.data.error) {
        setApiError(error.response.data.error);
      } else if (error.message) {
        setApiError(error.message);
      } else {
        setApiError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const [apiError, setApiError] = useState<string>("");

  return {
    formState,
    setFormState,
    handleChangeFee,
    handleInputChange,
    handleSubmit,
    fetchFees,
    isLoading: configLoading || feeLoading,
    config,
    isSubmitting,
    submissionMessage,
    walletError,
    setApiError,
    apiError,
    showConnectModal: () => {
      showConnectWalletModal.value = true;
    },
  };
}
