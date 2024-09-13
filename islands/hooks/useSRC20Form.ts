import { useEffect, useState } from "preact/hooks";
import { walletContext } from "store/wallet/wallet.ts";
import axiod from "axiod";
import { useConfig } from "$/hooks/useConfig.ts";
import { useFeePolling } from "hooks/useFeePolling.tsx";
import { fetchBTCPrice } from "$lib/utils/btc.ts";
import { calculateJsonSize } from "$lib/utils/jsonUtils.ts";
// import { Src20Controller } from "$lib/controller/src20Controller.ts";  // NEED TO CALL FROM THE API

export function useSRC20Form(operation: "mint" | "deploy" | "transfer") {
  const { config, isLoading: configLoading } = useConfig();
  const { fees, loading: feeLoading, fetchFees } = useFeePolling(300000); // 5 minutes

  const [formState, setFormState] = useState({
    toAddress: "",
    token: "",
    amt: "",
    fee: 0,
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
      p: "src-20",
      op: operation,
      tick: formState.token,
      amt: formState.amt,
      ...(operation === "deploy" && {
        max: formState.max,
        lim: formState.lim,
        dec: formState.dec,
        x: formState.x,
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
        // const tickExists = await Src20Controller.checkTickExists(newValue);
        const tickExists = false;
        if (tickExists) {
          setFormState((prev) => ({
            ...prev,
            tokenError: "This tick already exists.",
          }));
        }
      } catch (error) {
        console.error("Error checking tick existence:", error);
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
        if (bigIntValue <= limitValue) {
          setFormState((prev) => ({
            ...prev,
            maxError: "Max Circulation must be greater than Limit Per Mint",
          }));
        } else {
          setFormState((prev) => ({ ...prev, maxError: "" }));
        }
      } else if (field === "lim") {
        const maxValue = BigInt(formState.max || "0");
        if (bigIntValue > maxValue && maxValue !== BigInt(0)) {
          setFormState((prev) => ({
            ...prev,
            limError: "Limit Per Mint cannot be greater than Max Circulation",
          }));
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
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 18) {
      return sanitizedValue;
    } else if (sanitizedValue === "") {
      return "";
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
    if (!isConnected.value) {
      setWalletError("Please connect your wallet");
      return;
    }

    setWalletError(null);
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionMessage("Please wait...");
    setFormState((prev) => ({ ...prev, apiError: "" }));

    try {
      if (!config) throw new Error("Configuration not loaded");

      const response = await axiod.post(`${config.API_BASE_URL}/src20/create`, {
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
          web: formState.web,
          email: formState.email,
        }),
        ...additionalData,
      });

      console.log(response);

      // Handle wallet interaction
      const walletResult = await walletContext.signPSBT(response.data.psbt);

      if (walletResult === null) {
        setSubmissionMessage("Transaction cancelled by user");
      } else {
        setSubmissionMessage("Transaction signed successfully");
      }

      return response.data;
    } catch (error) {
      if (error.message === "Transaction cancelled by user") {
        setSubmissionMessage("Transaction cancelled by user");
      } else if (
        error.response && error.response.data && error.response.data.error
      ) {
        setFormState((prev) => ({
          ...prev,
          apiError: error.response.data.error,
        }));
      } else {
        setFormState((prev) => ({
          ...prev,
          apiError: "An unexpected error occurred",
        }));
      }
      console.error(`${operation} error:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
  };
}
