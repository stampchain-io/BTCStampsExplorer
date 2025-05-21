import { useEffect, useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import axiod from "axiod";
import { useConfig } from "$client/hooks/useConfig.ts";
import { useFeePolling } from "$client/hooks/useFeePolling.ts";
import { Config } from "$globals";
import { logger } from "$lib/utils/logger.ts";

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
  const { fees, fetchFees } = useFeePolling(300000); // 5 minutes
  const [apiError, setApiError] = useState<string>("");

  const [formState, setFormState] = useState<SRC101FormState>({
    root: ".btc",
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
    psbtFees: {
      estMinerFee: 0,
      totalDustValue: 0,
      hasExactFees: false,
      totalValue: 0,
      est_tx_size: 0,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<
    {
      message: string;
      txid?: string;
    } | null
  >(null);

  const { wallet } = walletContext;

  useEffect(() => {
    if (fees) {
      const recommendedFee = Math.round(fees.recommendedFee);
      setFormState((prev) => ({ ...prev, fee: recommendedFee }));
    }
  }, [fees]);

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

      // Use the stored PSBT if available
      if (formState.psbtFees?.hex && formState.psbtFees?.inputsToSign) {
        const walletResult = await walletContext.signPSBT(
          wallet,
          formState.psbtFees.hex,
          formState.psbtFees.inputsToSign,
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

        return walletResult;
      } else {
        // Create new PSBT only if we don't have one
        const response = await axiod.post("/api/v2/src101/create", {
          sourceAddress: wallet?.address,
          changeAddress: wallet?.address,
          recAddress: wallet?.address,
          op: action,
          hash:
            "77fb147b72a551cf1e2f0b37dccf9982a1c25623a7fe8b4d5efaac566cf63fed",
          toaddress: action === "transfer"
            ? formState.toAddress
            : wallet?.address,
          tokenid: [btoa(formState.toAddress)],
          dua: "999",
          prim: "true",
          coef: "1000",
          sig: "",
          img: [`https://img.bitname.pro/img/${formState.toAddress}.png`],
          feeRate: formState.fee,
        });

        // Log the PSBT response
        logger.debug("stamps", {
          message: "Transaction PSBT created",
          data: {
            estimatedSize: response.data.est_tx_size,
            minerFee: response.data.est_miner_fee,
            totalValue: response.data.input_value,
            changeValue: response.data.change_value,
          },
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

        return response.data;
      }
    } catch (error) {
      logger.error("ui", {
        message: `${action} error occurred`,
        error: error instanceof Error ? error.message : String(error),
        details: error,
      });

      const apiError = (error as any).response?.data?.error;
      setApiError(
        apiError || error.message || "An unexpected error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeFee = (newFee: number) => {
    setFormState((prev) => ({ ...prev, fee: newFee }));
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
