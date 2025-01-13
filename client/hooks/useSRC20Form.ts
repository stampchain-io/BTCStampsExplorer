import { useEffect, useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import axiod from "axiod";
import { useConfig } from "$client/hooks/useConfig.ts";
import { useFeePolling } from "$client/hooks/useFeePolling.ts";
import { fetchBTCPriceInUSD } from "$lib/utils/balanceUtils.ts";
import { Config } from "$globals";
import { logger } from "$lib/utils/logger.ts";
import { debounce } from "$lib/utils/debounce.ts";
interface PSBTFees {
  estMinerFee: number;
  totalDustValue: number;
  hasExactFees: boolean;
  totalValue: number;
  effectiveFeeRate: number;
  estimatedSize?: number;
  totalVsize?: number;
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
  psbtFees?: PSBTFees;
  maxAmount?: string;
}

interface TxDetails {
  hex: string;
  est_tx_size: number;
  input_value: number;
  total_dust_value: number;
  est_miner_fee: number;
  fee: number;
  change_value: number;
  inputsToSign: number[];
  sourceAddress: string;
  changeAddress: string;
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
      setFormState: (fn: (prev: SRC20FormState) => SRC20FormState) => void;
      logger: typeof logger;
    },
  ) => {
    const { wallet, formState, action, trxType } = params;
    const { setFormState, logger } = callbacks;

    if (!wallet.address) return;

    try {
      const response = await axiod.post("/api/v2/src20/create", {
        sourceAddress: wallet.address,
        toAddress: action === "transfer" ? formState.toAddress : wallet.address,
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
        ...(["mint", "transfer"].includes(action) && {
          amt: formState.amt || "1",
        }),
      });

      if (response.data) {
        // Log raw response for debugging
        logger.debug("stamps", {
          message: "Raw PSBT response",
          data: {
            feeDetails: response.data.feeDetails,
            totalOutputValue: response.data.totalOutputValue,
            estMinerFee: response.data.estMinerFee,
            fullResponse: response.data,
          },
        });

        // Extract fee values from response
        const minerFee = Number(response.data.feeDetails?.total) || 0;
        const dustValue = Number(response.data.totalOutputValue) || 1683; // Default to standard SRC20 dust
        const totalValue = minerFee + dustValue;

        logger.debug("stamps", {
          message: "Extracted fee values",
          data: {
            minerFee,
            dustValue,
            totalValue,
            feeDetails: response.data.feeDetails,
            rawResponse: {
              totalOutputValue: response.data.totalOutputValue,
              feeDetails: response.data.feeDetails,
            },
          },
        });

        setFormState((prev) => {
          const newState = {
            ...prev,
            psbtFees: {
              estMinerFee: Number(response.data.est_miner_fee),
              totalDustValue: Number(response.data.total_dust_value),
              hasExactFees: true,
              totalValue: Number(response.data.est_miner_fee) +
                Number(response.data.total_dust_value),
              effectiveFeeRate:
                Number(response.data.feeDetails?.effectiveFeeRate) || 0,
              estimatedSize: Number(response.data.est_tx_size),
              totalVsize: Number(response.data.feeDetails?.totalVsize),
              hex: response.data.hex,
              inputsToSign: response.data.inputsToSign,
            },
          };

          logger.debug("stamps", {
            message: "Updated form state with fees",
            data: {
              oldPsbtFees: prev.psbtFees,
              newPsbtFees: newState.psbtFees,
              rawResponse: response.data,
              calculatedTotal: totalValue,
              responseTotal: response.data.fee,
            },
          });

          return newState;
        });
      }
    } catch (error) {
      logger.error("stamps", {
        message: "Fee calculation failed",
        error,
        data: {
          action,
          token: formState.token,
          fee: formState.fee,
        },
      });
    }
  }, 500);

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
      const price = await fetchBTCPriceInUSD();
      setFormState((prev) => ({ ...prev, BTCPrice: price }));
    };
    fetchPrice();
  }, []);

  function validateFormState(
    formState: SRC20FormState,
    action: string,
  ): { isValid: boolean; error?: string } {
    // Basic validations
    if (!formState.token) {
      return { isValid: false, error: "Token is required" };
    }
    if (formState.fee <= 0) {
      return { isValid: false, error: "Fee must be greater than 0" };
    }

    // Action-specific validations
    switch (action) {
      case "deploy":
        if (!formState.max || !formState.lim || !formState.dec) {
          return {
            isValid: false,
            error: "Max, limit and decimals are required for deploy",
          };
        }
        try {
          const maxValue = BigInt(formState.max);
          const limValue = BigInt(formState.lim);
          if (limValue > maxValue) {
            return { isValid: false, error: "Limit cannot exceed max supply" };
          }
        } catch {
          return { isValid: false, error: "Invalid max or limit value" };
        }
        break;

      case "transfer":
        if (!formState.toAddress) {
          return { isValid: false, error: "Recipient address is required" };
        }
        if (!formState.amt) {
          return { isValid: false, error: "Amount is required" };
        }
        break;

      case "mint":
        if (!formState.amt) {
          return { isValid: false, error: "Amount is required" };
        }
        break;
    }

    return { isValid: true };
  }

  // Update the effect to use validation
  useEffect(() => {
    const { isValid, error } = validateFormState(formState, action);

    if (!wallet?.address || isSubmitting) return;

    if (!isValid) {
      setFormState((prev) => ({ ...prev, apiError: error || "" }));
      return;
    }

    // Clear any previous errors
    setFormState((prev) => ({ ...prev, apiError: "" }));

    // Prepare transaction only if all validations pass
    SRC20FormController.prepareTx(
      {
        wallet,
        formState,
        action,
        trxType,
        canEstimateFees: () => isValid,
      },
      {
        setFormState,
        logger,
      },
    );

    return () => {
      SRC20FormController.cancelPrepareTx();
    };
  }, [
    wallet?.address,
    formState.fee,
    formState.token,
    formState.amt,
    formState.toAddress,
    action,
    trxType,
    isSubmitting,
  ]);

  const handleInputChange = (e: Event, field: string) => {
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
        return SRC20FormController.checkTokenExistence(newValue, setFormState);
      }
      return; // Add explicit return for token field
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
        const response = await axiod.post("/api/v2/src20/create", {
          sourceAddress: wallet?.address,
          toAddress: action === "transfer"
            ? formState.toAddress
            : wallet?.address,
          satsPerVB: formState.fee,
          trxType,
          op: action,
          tick: formState.token,
          ...(action === "deploy" && {
            max: formState.max,
            lim: formState.lim,
            dec: formState.dec,
            ...(formState.x && { x: formState.x }),
            ...(formState.tg && { tg: formState.tg }),
            ...(formState.web && { web: formState.web }),
            ...(formState.email && { email: formState.email }),
          }),
          ...(["mint", "transfer"].includes(action) && {
            amt: formState.amt,
          }),
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
