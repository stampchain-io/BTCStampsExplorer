/* ===== STAMPING COMPONENT ===== */
import { useEffect, useRef, useState } from "preact/hooks";
import { useConfig } from "$client/hooks/useConfig.ts";
import axiod from "axiod";
import { walletContext } from "$client/wallet/wallet.ts";
import { getWalletProvider } from "$client/wallet/walletHelper.ts";
import { useFeePolling } from "$client/hooks/useFeePolling.ts";
import { FeeCalculatorAdvanced } from "$islands/section/FeeCalculatorAdvanced.tsx";
import { validateWalletAddressForMinting } from "$lib/utils/scriptTypeUtils.ts";
import { Config } from "$globals";
import { logger } from "$lib/utils/logger.ts";
import PreviewImageModal from "$islands/modal/PreviewImageModal.tsx";
import { NOT_AVAILABLE_IMAGE } from "$lib/utils/constants.ts";
import { handleImageError } from "$lib/utils/imageUtils.ts";
import { bodyTool, containerBackground, containerRowForm } from "$layout";
import { titlePurpleLD } from "$text";
import { ToggleSwitchButton } from "$button";
import { Icon } from "$icon";
import { InputField } from "$form";
import {
  StatusMessages,
  tooltipButton,
  tooltipButtonInCollapsible,
  tooltipImage,
} from "$notification";
import { openModal } from "$islands/modal/states.ts";

/* ===== LOGGING UTILITY ===== */
const log = (message: string, data?: unknown) => {
  logger.debug("stamps", {
    message: `[StampingTool] ${message}`,
    data,
  });
};

/* ===== TRANSACTION AND VALIDATION INTERFACES ===== */
interface TransactionInput {
  txid: string;
  vout: number;
  signingIndex: number;
}

interface MintResponse {
  hex: string;
  cpid: string;
  est_tx_size: number;
  input_value: number;
  total_dust_value: number;
  est_miner_fee: number;
  change_value: number;
  total_output_value: number;
  txDetails: TransactionInput[];
}

interface ValidationParams {
  file: File | null;
  fileError: string;
  issuanceError: string;
  stampNameError: string;
  isPoshStamp: boolean;
  stampName: string;
  addressError: string | undefined;
}

/* ===== FORM VALIDATION UTILITY ===== */
function isValidForMinting(params: ValidationParams) {
  const {
    file,
    fileError,
    issuanceError,
    stampNameError,
    isPoshStamp,
    stampName,
    addressError,
  } = params;

  // Create a validation results object for detailed logging
  const validationResults = {
    hasFile: !!file,
    fileError,
    issuanceError,
    stampNameError,
    isPoshStamp,
    hasStampName: !!stampName,
    addressError,
    fileType: file?.type,
    fileSize: file?.size,
  };

  logger.debug("stamps", {
    message: "Checking form validation state",
    validationResults,
  });

  if (!file) {
    logger.debug("stamps", {
      message: "Form invalid: No file",
      validationResults,
    });
    return false;
  }

  if (fileError) {
    logger.debug("stamps", {
      message: "Form invalid: File error",
      error: fileError,
      validationResults,
    });
    return false;
  }

  if (issuanceError) {
    logger.debug("stamps", {
      message: "Form invalid: Issuance error",
      error: issuanceError,
      validationResults,
    });
    return false;
  }

  if (addressError) {
    logger.debug("stamps", {
      message: "Form invalid: Address error",
      error: addressError,
      validationResults,
    });
    return false;
  }

  if (isPoshStamp && (!stampName || stampNameError)) {
    logger.debug("stamps", {
      message: "Form invalid: POSH requirements not met",
      stampName,
      stampNameError,
      validationResults,
    });
    return false;
  }

  logger.debug("stamps", {
    message: "Form validation passed",
    validationResults,
  });
  return true;
}

interface FeeDetails {
  minerFee: number;
  dustValue: number;
  totalValue: number;
  hasExactFees: boolean;
}

interface MintRequest {
  sourceWallet: string | undefined;
  qty: string;
  locked: boolean;
  filename: string;
  file: string;
  satsPerVB: number;
  service_fee: string | null;
  service_fee_address: string | null;
  assetName?: string;
  divisible: boolean;
  isPoshStamp: boolean;
  dryRun?: boolean;
}

/* ===== ERROR HANDLING UTILITY ===== */
function extractErrorMessage(error: unknown): string {
  logger.debug("stamps", {
    message: "Extracting error message from",
    error,
  });

  // Handle string errors first
  if (typeof error === "string") {
    return error;
  }

  // Handle Error instances
  if (error instanceof Error) {
    return error.message;
  }

  // Handle error objects
  if (error && typeof error === "object") {
    const err = error as {
      error?: {
        message?: string;
        code?: number;
      };
      details?: {
        error?: {
          message?: string;
        };
      };
      response?: {
        data?: {
          error?: string;
        };
      };
      message?: string;
    };

    // Check for direct error message
    if (err.response?.data?.error) {
      logger.debug("stamps", {
        message: "Found direct error message",
        path: "error.message",
        value: err.response?.data?.error,
      });
      if (err.response?.data?.error?.includes("Insufficient funds")) {
        return "Insufficient funds to cover outputs and fees";
      }
      return err.response?.data?.error;
    }

    // Check for direct error message
    if (err.error?.message) {
      logger.debug("stamps", {
        message: "Found direct error message",
        path: "error.message",
        value: err.error.message,
      });
      return err.error.message;
    }

    // Check for nested error message
    if (err.details?.error?.message) {
      logger.debug("stamps", {
        message: "Found nested error message",
        path: "details.error.message",
        value: err.details.error.message,
      });
      return err.details.error.message;
    }

    // Check for simple message
    if (err.message) {
      logger.debug("stamps", {
        message: "Found simple message",
        path: "message",
        value: err.message,
      });
      return err.message;
    }
  }

  // Default error message
  logger.debug("stamps", {
    message: "No valid error message found, using default",
  });
  return "An unexpected error occurred";
}

interface SubmissionMessage {
  message: string;
  txid?: string;
}

interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string | undefined;
}

/* ===== STYLE CONSTANTS ===== */
const PREVIEW_SIZE_CLASSES =
  "w-[100px] h-[100px] mobileMd:w-[100px] mobileMd:h-[100px]" as const;

/* ===== WRAPPER COMPONENT - HANDLES CONFIG LOADING ===== */
export function StampingTool() {
  const { config, isLoading } = useConfig<Config>();

  /* ===== EARLY RETURN CONDITIONS ===== */
  if (isLoading) {
    return <div>Loading configuration...</div>;
  }

  if (!config) {
    return <div>Error: Configuration not loaded</div>;
  }

  // Once we have the config, render the main component
  return <StampingToolMain config={config} />;
}

/* ===== MAIN COMPONENT IMPLEMENTATION ===== */
// This component contains all hooks and is only rendered when config is available
function StampingToolMain({ config }: { config: Config }) {
  const { wallet, isConnected } = walletContext;
  const address = isConnected ? wallet.address : undefined;
  const { fees, loading, fetchFees } = useFeePolling(300000);

  const [file, setFile] = useState<File | null>(null);
  const [fee, setFee] = useState<number>(0);
  const [issuance, setIssuance] = useState("1");
  const [BTCPrice, setBTCPrice] = useState<number>(60000);
  const [fileSize, setFileSize] = useState<number | undefined>(undefined);
  const [isLocked, setIsLocked] = useState(true);
  const [isPoshStamp, setIsPoshStamp] = useState(false);
  const [stampName, setStampName] = useState("");
  const [isDivisible, _setIsDivisible] = useState(false);

  // Validation state
  const [fileError, setFileError] = useState<string>("");
  const [issuanceError, setIssuanceError] = useState<string>("");
  const [stampNameError, setStampNameError] = useState<string>("");
  const [apiError, setApiError] = useState<string>("");
  const [submissionMessage, setSubmissionMessage] = useState<
    SubmissionMessage | null
  >(null);
  const [isSearching, setIsSearching] = useState(false);
  const [addressError, setAddressError] = useState<string | undefined>(
    undefined,
  );

  // Fee details state
  const [feeDetails, setFeeDetails] = useState<FeeDetails>({
    minerFee: 0,
    dustValue: 0,
    totalValue: 0,
    hasExactFees: false,
  });

  // Tooltip state and refs
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isUploadTooltipVisible, setIsUploadTooltipVisible] = useState(false);
  const uploadTooltipTimeoutRef = useRef<number | null>(null);

  // Modal state
  const [isFullScreenModalOpen, setIsFullScreenModalOpen] = useState(false);
  const [tosAgreed, setTosAgreed] = useState(false);

  // Advanced options state
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Tooltips state
  const [tooltipText, setTooltipText] = useState("SIMPLE SETTINGS");
  const [isAdvancedTooltipVisible, setIsAdvancedTooltipVisible] = useState(
    false,
  );
  const [allowAdvancedTooltip, setAllowAdvancedTooltip] = useState(true);
  const advancedTooltipTimeoutRef = useRef<number | null>(null);

  // POSH tooltip state
  const [poshTooltipText, setPoshTooltipText] = useState("POSH");
  const [isPoshTooltipVisible, setIsPoshTooltipVisible] = useState(false);
  const [allowPoshTooltip, setAllowPoshTooltip] = useState(true);
  const poshButtonRef = useRef<HTMLButtonElement>(null);
  const poshTooltipTimeoutRef = useRef<number | null>(null);

  // Lock tooltip state
  const [lockTooltipText, setLockTooltipText] = useState("LOCK");
  const [isLockTooltipVisible, setIsLockTooltipVisible] = useState(false);
  const [allowLockTooltip, setAllowLockTooltip] = useState(true);
  const lockButtonRef = useRef<HTMLDivElement>(null);
  const lockTooltipTimeoutRef = useRef<number | null>(null);

  // Preview tooltip state
  const [previewTooltipText, setPreviewTooltipText] = useState("FULLSCREEN");
  const [isPreviewTooltipVisible, setIsPreviewTooltipVisible] = useState(false);
  const [allowPreviewTooltip, setAllowPreviewTooltip] = useState(true);
  const previewButtonRef = useRef<HTMLDivElement>(null);
  const previewTooltipTimeoutRef = useRef<number | null>(null);

  /* ===== EFFECT HOOKS ===== */
  useEffect(() => {
    if (fees && !loading) {
      const recommendedFee = Math.round(fees.recommendedFee);
      logger.debug("stamps", {
        message: "Setting initial fee and BTC price from polled data",
        data: {
          recommendedFee,
          currentFee: fee,
          polledBtcPrice: (fees as any).btcPrice,
          hasFile: !!file,
        },
      });
      setFee(recommendedFee);
      if (typeof (fees as any).btcPrice === "number") {
        setBTCPrice((fees as any).btcPrice);
      }
    }
  }, [fees, loading]);

  useEffect(() => {
    setIsLocked(true);
  }, []);

  // Update useEffect to handle changes in isConnected and address
  useEffect(() => {
    if (isConnected && address) {
      const isValid = validateWalletAddress(address);
      if (!isValid) {
        // Optionally disable minting or show additional UI feedback
        setSubmissionMessage(null);
      }
    } else {
      setAddressError(undefined);
    }
  }, [address, isConnected]);

  // When file is uploaded
  useEffect(() => {
    logger.debug("stamps", {
      message: "Checking transaction requirements",
      data: {
        isConnected,
        hasWalletAddress: !!wallet.address,
        hasFile: !!file,
        fileType: file?.type,
        fileSize: file?.size,
      },
    });

    if (isConnected && wallet.address && file) {
      log("Starting transaction preparation", {
        address: wallet.address,
        fileSize: file.size,
        fileType: file.type,
      });

      const prepareTx = async () => {
        try {
          const fileData = await toBase64(file);
          log("File converted to base64", {
            dataLength: fileData.length,
          });

          const dryRunPayload:
            & Omit<MintRequest, "service_fee" | "service_fee_address">
            & { dryRun: true } = {
              sourceWallet: address,
              file: fileData,
              satsPerVB: fee,
              locked: isLocked,
              qty: issuance,
              filename: file.name,
              divisible: isDivisible,
              isPoshStamp: isPoshStamp,
              dryRun: true,
            };
          if (stampName) {
            (dryRunPayload as MintRequest).assetName = stampName;
          }

          log("Sending mint request (dry run)", {
            request: { ...dryRunPayload, file: "[REDACTED]" },
          });
          const response = await axiod.post("/api/v2/olga/mint", dryRunPayload);
          const data = response.data as MintResponse;

          // Add debug logging here
          logger.debug("stamps", {
            message: "Mint API response",
            data: {
              raw: response.data,
              est_miner_fee: data.est_miner_fee,
              total_dust_value: data.total_dust_value,
              input_value: data.input_value,
              total_output_value: data.total_output_value,
            },
          });

          setFeeDetails({
            minerFee: Number(data.est_miner_fee) || 0,
            dustValue: Number(data.total_dust_value) || 0,
            totalValue: Number(data.total_output_value) || 0,
            hasExactFees: true,
          });
        } catch (error) {
          logger.error("stamps", {
            message: "Transaction preparation failed (initial dry run)",
            error: error instanceof Error ? error.message : String(error),
          });
          const extractedMessage = extractErrorMessage(error);
          setApiError(extractedMessage);
          setFeeDetails({
            hasExactFees: false,
            minerFee: 0,
            dustValue: 0,
            totalValue: 0,
          });
        }
      };
      prepareTx();
    } else {
      log("Missing requirements for tx preparation", {
        isConnected,
        hasAddress: !!wallet.address,
        hasFile: !!file,
      });
    }
  }, [isConnected, wallet.address, file, fee]);

  // Update the fee recalculation effect
  useEffect(() => {
    // This effect should run when any of the fee-related parameters change
    const prepareTxWithNewFee = async () => {
      if (!isConnected || !wallet.address || !file) {
        return;
      }

      try {
        const fileData = await toBase64(file);

        const mintRequest = {
          sourceWallet: address,
          file: fileData,
          satsPerVB: fee, // Use the current fee setting
          locked: isLocked,
          qty: issuance,
          filename: file.name,
          divisible: isDivisible,
          assetName: stampName || undefined,
          isPoshStamp: isPoshStamp,
          dryRun: true,
        };

        logger.debug("stamps", {
          message: "Recalculating fees with new fee rate",
          data: {
            feeRate: fee,
            previousMinerFee: feeDetails.minerFee,
            previousDustValue: feeDetails.dustValue,
            previousTotalValue: feeDetails.totalValue,
          },
        });

        const response = await axiod.post("/api/v2/olga/mint", mintRequest);
        const data = response.data as MintResponse;

        setFeeDetails({
          minerFee: Number(data.est_miner_fee) || 0,
          dustValue: Number(data.total_dust_value) || 0,
          totalValue: Number(data.total_output_value) || 0,
          hasExactFees: true,
        });

        logger.debug("stamps", {
          message: "Fee calculation updated with new fee rate",
          data: {
            estimatedSize: data.est_tx_size,
            feeRate: fee,
            minerFee: data.est_miner_fee,
            outputValue: data.total_output_value,
            totalWithFee: data.total_output_value + data.est_miner_fee,
          },
        });
      } catch (error) {
        logger.error("stamps", {
          message: "Fee recalculation failed (dry run)",
          error,
        });
        const extractedMessage = extractErrorMessage(error);
        setApiError(extractedMessage);
        setFeeDetails({
          hasExactFees: false,
          minerFee: 0,
          dustValue: 0,
          totalValue: 0,
        });
      }
    };

    // Call the function when fee changes
    prepareTxWithNewFee();
  }, [
    fee,

    isConnected,

    wallet.address,

    file,

    isLocked,

    issuance,

    isPoshStamp,

    stampName,
  ]);

  /* ===== WALLET ADDRESS VALIDATION ===== */
  const validateWalletAddress = (address: string) => {
    const { isValid, error } = validateWalletAddressForMinting(address);
    logger.debug("stamps", {
      message: "Validating wallet address",
      data: { address, isValid, error },
    });
    setAddressError(error);
    return isValid;
  };

  /* ===== EVENT HANDLERS ===== */
  const handleChangeFee = (newFee: number) => {
    setFee(newFee);
  };

  /* ===== ADVANCED OPTIONS HANDLERS ===== */
  const handleShowAdvancedOptions = () => {
    setAllowAdvancedTooltip(false);
    setIsAdvancedTooltipVisible(false);
    setShowAdvancedOptions(!showAdvancedOptions);
  };

  const handleIsPoshStamp = () => {
    setAllowPoshTooltip(false);
    setIsPoshTooltipVisible(false);

    if (!isPoshStamp) {
      setStampName(""); // Clear the input when switching to POSH
    } else {
      setStampName(""); // Clear the input when switching to CUSTOM CPID
    }
    setIsPoshStamp(!isPoshStamp);
  };

  /* ===== FILE HANDLING UTILITIES ===== */
  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const base64 = btoa(
            new Uint8Array(arrayBuffer)
              .reduce((data, byte) => data + String.fromCharCode(byte), ""),
          );
          resolve(base64);
        } catch (error) {
          reject(
            new Error("Failed to convert file to base64", { cause: error }),
          );
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
    });
  };

  const handleImage = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const selectedFile = input.files?.[0];

    if (!selectedFile) {
      logger.debug("stamps", {
        message: "No file selected",
      });
      setFileError("No file selected");
      setFile(null);
      setFileSize(undefined);
      return;
    }

    const validation = validateFile(selectedFile);

    if (!validation.isValid) {
      logger.debug("stamps", {
        message: "File validation failed",
        error: validation.error,
      });
      setFileError(validation.error || "Invalid file");
      setFile(null);
      setFileSize(undefined);
      return;
    }

    logger.debug("stamps", {
      message: "Setting valid file",
      data: {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
      },
    });

    setFileError("");
    setFile(selectedFile);
    setFileSize(selectedFile.size);

    // Set warning message if file is not an image
    if (validation.warning) {
      setSubmissionMessage({
        message: validation.warning,
      });
    } else {
      setSubmissionMessage(null);
    }
  };

  const validateFile = (file: File): FileValidationResult => {
    if (file.size > 64 * 1024) {
      return {
        isValid: false,
        error: "File size must be less than 64KB.",
      };
    }

    // Check if file is an image by extension
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|avif|html)$/i.test(file.name);

    return {
      isValid: true,
      warning: isImage
        ? undefined
        : "Note: Non-image-html files may not become numbered stamps.",
    };
  };

  const handleIssuanceChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    if (/^\d*$/.test(value)) {
      setIssuance(value === "" ? "1" : value);
      setIssuanceError("");
    } else {
      setIssuanceError("Please enter a valid number.");
    }
  };

  const handleStampNameChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;

    if (isPoshStamp) {
      // POSH validation: Must start with B-Z and be 1-13 characters long
      if (/^[B-Zb-z][A-Za-z]{0,12}$/.test(value)) {
        setStampName(value);
        setStampNameError("");
      } else {
        setStampNameError(
          "Invalid POSH name. Must start with B-Z and be 1-13 characters long.",
        );
      }
    } else {
      // CUSTOM CPID validation: Must start with 'A' followed by a number between 26^12 + 1 and 2^64 - 1
      if (value === "" || value === "A") {
        setStampName(value);
        setStampNameError("");
        return;
      }

      if (!value.startsWith("A")) {
        setStampNameError("Custom CPID must start with 'A'");
        return;
      }

      const numStr = value.slice(1); // Remove the 'A' prefix

      try {
        // Parse the number after 'A'
        const num = BigInt(numStr);
        const min = BigInt(Math.pow(26, 12)) + BigInt(1); // 26^12 + 1
        const max = BigInt("18446744073709551615"); // 2^64 - 1

        if (num >= min && num <= max) {
          setStampName(value);
          setStampNameError("");
        } else {
          setStampNameError(
            `Number must be between ${min.toString()} and ${max.toString()}`,
          );
        }
      } catch (error) {
        setStampNameError("Invalid number format after 'A', error: " + error);
      }
    }
  };

  /* ===== MINTING HANDLER ===== */
  const handleMint = async () => {
    if (!isConnected) {
      logger.debug("stamps", {
        message: "Showing wallet connect modal - user not connected",
      });
      walletContext.showConnectModal();
      return;
    }

    try {
      log("Starting minting process");

      if (address && !validateWalletAddress(address)) {
        throw new Error(addressError || "Invalid wallet address type");
      }

      if (file === null) {
        throw new Error("Upload your file");
      }

      try {
        log("Converting file to base64");
        const fileData = await toBase64(file);
        log("File converted to base64", { fileSize: fileData.length });

        // Do not convert fee rate; use it directly
        logger.debug("stamps", {
          message: "User-selected fee rate",
          data: { fee: `${fee} sat/vB` },
        });

        log("Preparing mint request");
        const finalMintPayload: MintRequest = {
          sourceWallet: address,
          qty: issuance,
          locked: isLocked,
          filename: file.name,
          file: fileData,
          satsPerVB: fee,
          divisible: isDivisible,
          isPoshStamp: isPoshStamp,
          service_fee: config?.MINTING_SERVICE_FEE,
          service_fee_address: config?.MINTING_SERVICE_FEE_ADDRESS,
        };
        if (stampName) {
          finalMintPayload.assetName = stampName;
        }

        log("Mint request prepared (final)", {
          payload: finalMintPayload,
          file: "[REDACTED]",
        });
        const response = await axiod.post(
          "/api/v2/olga/mint",
          finalMintPayload,
        );

        log("Received response from API", response);

        if (!response.data) {
          throw new Error("No data received from API");
        }

        const mintResponse = response.data as MintResponse;

        if (!mintResponse.hex) {
          throw new Error("Invalid response structure: missing hex field");
        }

        const walletProvider = getWalletProvider(
          wallet.provider,
        );

        // Update the inputsToSign construction to use the new format
        const inputsToSign = mintResponse.txDetails.map((
          input: TransactionInput,
        ) => ({
          index: input.signingIndex,
        }));
        logger.debug("stamps", {
          message: "Constructed inputsToSign",
          data: { inputsToSign },
        });

        const result = await walletProvider.signPSBT(
          mintResponse.hex,
          inputsToSign,
        );

        logger.debug("stamps", {
          message: "Raw wallet provider response",
          data: {
            result,
            resultType: typeof result,
            error: result?.error,
            hasSignatures: result?.signed === true,
            cancelled: result?.cancelled === true,
            txid: result?.txid,
          },
        });

        if (!result) {
          logger.error("stamps", {
            message: "Wallet provider returned null or undefined response",
          });
          setApiError("Wallet provider error: No response received");
          setSubmissionMessage(null);
          return;
        }

        if (!result.signed) {
          // If result contains an error message, use it directly
          if (result.error) {
            logger.debug("stamps", {
              message: "Using error from result",
              error: result.error,
            });

            // Improved error messages for common wallet errors
            if (result.error.includes("insufficient funds")) {
              setApiError(
                "Insufficient funds in wallet to cover transaction fees",
              );
            } else if (
              result.error.includes("timeout") ||
              result.error.includes("timed out")
            ) {
              setApiError("Wallet connection timed out. Please try again");
            } else {
              setApiError(result.error);
            }
            setSubmissionMessage(null);
            return;
          }

          if (result.cancelled) {
            logger.debug("stamps", {
              message: "Transaction was cancelled by user",
            });
            setApiError("Transaction was cancelled");
            setSubmissionMessage(null);
            return;
          }

          // Generic error fallback with helpful suggestion
          logger.error("stamps", {
            message: "Unknown PSBT signing failure",
            data: { result },
          });
          setApiError(
            "Failed to sign transaction. Please check wallet connection and try again",
          );
          setSubmissionMessage(null);
          return;
        }

        // Inside the try block after successful operations
        if (result.txid) {
          logger.debug("stamps", {
            message: "Transaction signed and broadcast successfully",
            data: { txid: result.txid },
          });
          setSubmissionMessage({
            message: "Transaction broadcasted successfully.",
            txid: result.txid,
          });
          setApiError(""); // Clear any previous errors
        } else {
          logger.debug("stamps", {
            message: "Transaction signed successfully, but txid not returned",
          });
          setSubmissionMessage({
            message:
              "Transaction signed and broadcasted successfully. Please check your wallet or a block explorer for confirmation.",
          });
          setApiError("");
        }
      } catch (error) {
        const errorMsg = extractErrorMessage(error);
        logger.error("stamps", {
          message: "Minting error",
          error,
          extractedMessage: errorMsg,
        });
        setApiError(errorMsg);
        setSubmissionMessage(null);
      }
    } catch (error: any) {
      logger.error("stamps", {
        message: "Unexpected minting error",
        error,
      });
      setApiError(
        error?.message || error?.response.data.error ||
          "An unexpected error occurred",
      );
      setSubmissionMessage(null);
    }
  };

  const handleCloseFullScreenModal = () => {
    setIsFullScreenModalOpen(false);
  };
  const toggleFullScreenModal = () => {
    if (!file) return;
    setIsFullScreenModalOpen(!isFullScreenModalOpen);
  };

  // Update the useEffect to monitor validation state
  useEffect(() => {
    const validationState = isValidForMinting({
      file,
      fileError,
      issuanceError,
      stampNameError,
      isPoshStamp,
      stampName,
      addressError,
    });

    logger.debug("stamps", {
      message: "Form validation state updated",
      data: {
        isValid: validationState,
        file: !!file,
        fileError,
        issuanceError,
        stampNameError,
        isPoshStamp,
        stampName,
        addressError,
      },
    });
  }, [
    file,
    fileError,
    issuanceError,
    stampNameError,
    isPoshStamp,
    stampName,
    addressError,
  ]);

  const isFormValid = isValidForMinting({
    file,
    fileError,
    issuanceError,
    stampNameError,
    isPoshStamp,
    stampName,
    addressError,
  });

  // Add initialization tracking
  useEffect(() => {
    logger.debug("stamps", {
      message: "StampingTool mounted",
      data: {
        isConnected,
        hasWallet: !!wallet,
        provider: wallet?.provider,
      },
    });

    return () => {
      logger.debug("stamps", {
        message: "StampingTool unmounted",
      });
    };
  }, []);

  // Add cleanup for blob URLs
  useEffect(() => {
    return () => {
      if (file) {
        URL.revokeObjectURL(URL.createObjectURL(file));
      }
    };
  }, [file]);

  useEffect(() => {
    logger.debug("stamps", {
      message: "Fee calculation effect triggered",
      data: {
        isConnected,
        hasWalletAddress: !!wallet.address,
        hasFile: !!file,
        currentFee: fee,
        fileDetails: file
          ? {
            type: file.type,
            size: file.size,
          }
          : null,
      },
    });

    // ... rest of the effect
  }, [isConnected, wallet.address, file, fee]);

  /* ===== TOOLTIP HANDLERS ===== */
  const handleMouseMove = (e: MouseEvent) => {
    setTooltipPosition({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleUploadMouseEnter = () => {
    if (uploadTooltipTimeoutRef.current) {
      globalThis.clearTimeout(uploadTooltipTimeoutRef.current);
    }

    uploadTooltipTimeoutRef.current = globalThis.setTimeout(() => {
      setIsUploadTooltipVisible(true);
    }, 1500);
  };

  const handleUploadMouseLeave = () => {
    if (uploadTooltipTimeoutRef.current) {
      globalThis.clearTimeout(uploadTooltipTimeoutRef.current);
    }
    setIsUploadTooltipVisible(false);
  };

  useEffect(() => {
    return () => {
      if (uploadTooltipTimeoutRef.current) {
        globalThis.clearTimeout(uploadTooltipTimeoutRef.current);
      }
    };
  }, []);

  // Update the image preview div
  const imagePreviewDiv = (
    <div
      id="image-preview"
      class={`relative items-center content-center mx-auto rounded ${PREVIEW_SIZE_CLASSES} text-center group transition duration-300 cursor-pointer `}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleUploadMouseEnter}
      onMouseLeave={handleUploadMouseLeave}
      onMouseDown={() => setIsUploadTooltipVisible(false)}
      onClick={() => setIsUploadTooltipVisible(false)}
    >
      <input
        id="upload"
        type="file"
        class="hidden"
        onChange={handleImage}
      />
      {file !== null
        ? (
          <label
            for="upload"
            class="flex flex-col items-center justify-center h-full w-full cursor-pointer"
          >
            {file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i)
              ? (
                <img
                  class={`${PREVIEW_SIZE_CLASSES} object-contain rounded bg-conic-pattern bg-[length:4px_4px] bg-stamp-grey [image-rendering:pixelated]`}
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  onError={(e) => {
                    logger.error("stamps", {
                      message: "Image preview failed to load",
                      error: e,
                    });
                    handleImageError(e);
                  }}
                />
              )
              : file.name.match(/\.(html)$/i)
              ? (
                <iframe
                  width="100%"
                  height="100%"
                  scrolling="no"
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin"
                  src={URL.createObjectURL(file)}
                  class={`${PREVIEW_SIZE_CLASSES} object-contain rounded bg-stamp-grey [image-rendering:pixelated]`}
                  onError={(e) => {
                    console.error("iframe error (detailed):", {
                      error: e,
                      target: e.target,
                      src: (e.target as HTMLIFrameElement).src,
                      contentWindow:
                        (e.target as HTMLIFrameElement).contentWindow
                          ? "present"
                          : "missing",
                    });
                    handleImageError(e);
                  }}
                />
              )
              : (
                <img
                  class={`${PREVIEW_SIZE_CLASSES} object-contain rounded bg-conic-pattern bg-[length:4px_4px] [image-rendering:pixelated]`}
                  src={NOT_AVAILABLE_IMAGE}
                  alt={`File: ${file.name}`}
                />
              )}
            <div class="flex items-center justify-center absolute inset-0 rounded hover:bg-stamp-grey-darkest/80 opacity-0 hover:opacity-100 transition-opacity">
              <Icon
                type="icon"
                name="upload"
                weight="normal"
                size="xxl"
                color="grey"
              />
            </div>
          </label>
        )
        : (
          <label
            for="upload"
            class="flex flex-col items-center justify-center h-full rounded bg-stamp-purple-dark hover:bg-stamp-purple cursor-pointer"
          >
            <Icon
              type="icon"
              name="upload"
              weight="normal"
              size="xxl"
              color="grey"
            />
          </label>
        )}
      <div
        class={`${tooltipImage} ${
          isUploadTooltipVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y - 6}px`,
          transform: "translate(-50%, -100%)",
        }}
      >
        UPLOAD FILE
      </div>
    </div>
  );

  const handleAdvancedMouseEnter = () => {
    if (allowAdvancedTooltip) {
      setTooltipText(
        showAdvancedOptions ? "SIMPLE SETTINGS" : "ADVANCED SETTINGS",
      );

      if (advancedTooltipTimeoutRef.current) {
        globalThis.clearTimeout(advancedTooltipTimeoutRef.current);
      }

      advancedTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsAdvancedTooltipVisible(true);
      }, 1500);
    }
  };

  const handleAdvancedMouseLeave = () => {
    if (advancedTooltipTimeoutRef.current) {
      globalThis.clearTimeout(advancedTooltipTimeoutRef.current);
    }
    setIsAdvancedTooltipVisible(false);
    setAllowAdvancedTooltip(true);
  };

  /* ===== CLEANUP EFFECT ===== */
  useEffect(() => {
    return () => {
      if (advancedTooltipTimeoutRef.current) {
        globalThis.clearTimeout(advancedTooltipTimeoutRef.current);
      }
    };
  }, []);

  // Add a ref to get the button's position

  // Update the mouse enter handler to position the tooltip
  const handlePoshMouseEnter = () => {
    if (allowPoshTooltip && showAdvancedOptions) {
      // Set tooltip text based on current state when mouse enters
      setPoshTooltipText(isPoshStamp ? "CPID" : "POSH");

      const buttonRect = poshButtonRef.current?.getBoundingClientRect();
      if (buttonRect) {
        setTooltipPosition({
          x: buttonRect.left + buttonRect.width / 2,
          y: buttonRect.top,
        });
      }

      if (poshTooltipTimeoutRef.current) {
        globalThis.clearTimeout(poshTooltipTimeoutRef.current);
      }

      poshTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsPoshTooltipVisible(true);
      }, 1500);
    }
  };

  const handlePoshMouseLeave = () => {
    if (poshTooltipTimeoutRef.current) {
      globalThis.clearTimeout(poshTooltipTimeoutRef.current);
    }
    setIsPoshTooltipVisible(false);
    setAllowPoshTooltip(true);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (poshTooltipTimeoutRef.current) {
        globalThis.clearTimeout(poshTooltipTimeoutRef.current);
      }
    };
  }, []);

  // Update the POSH toggle button JSX
  const poshToggleButton = (
    <ToggleSwitchButton
      isActive={isPoshStamp}
      onToggle={() => {
        handleIsPoshStamp();
        setIsPoshTooltipVisible(false);
        setAllowPoshTooltip(false);
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      toggleButtonId="switch-toggle-locked"
      buttonRef={poshButtonRef}
      onMouseEnter={handlePoshMouseEnter}
      onMouseLeave={handlePoshMouseLeave}
    />
  );

  // Update handlers
  const handleLockMouseEnter = () => {
    if (allowLockTooltip && showAdvancedOptions) {
      // Set tooltip text based on current state
      setLockTooltipText(isLocked ? "UNLOCK" : "LOCK");

      const buttonRect = lockButtonRef.current?.getBoundingClientRect();
      if (buttonRect) {
        setTooltipPosition({
          x: buttonRect.left + buttonRect.width / 2,
          y: buttonRect.top,
        });
      }

      // Clear any existing timeout
      if (lockTooltipTimeoutRef.current) {
        globalThis.clearTimeout(lockTooltipTimeoutRef.current);
      }

      // Set new timeout for 1500ms delay
      lockTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsLockTooltipVisible(true);
      }, 1500);
    }
  };

  const handleLockMouseLeave = () => {
    if (lockTooltipTimeoutRef.current) {
      globalThis.clearTimeout(lockTooltipTimeoutRef.current);
    }
    setIsLockTooltipVisible(false);
    setAllowLockTooltip(true);
  };

  // Add cleanup in useEffect
  useEffect(() => {
    return () => {
      if (lockTooltipTimeoutRef.current) {
        globalThis.clearTimeout(lockTooltipTimeoutRef.current);
      }
    };
  }, []);

  // Update the handlePreviewMouseEnter to include timeout
  const handlePreviewMouseEnter = () => {
    if (allowPreviewTooltip && showAdvancedOptions) {
      // Set tooltip text when mouse enters
      setPreviewTooltipText("FULLSCREEN");

      const buttonRect = previewButtonRef.current?.getBoundingClientRect();
      if (buttonRect) {
        setTooltipPosition({
          x: buttonRect.left + buttonRect.width / 2,
          y: buttonRect.top,
        });
      }

      if (previewTooltipTimeoutRef.current) {
        globalThis.clearTimeout(previewTooltipTimeoutRef.current);
      }

      previewTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsPreviewTooltipVisible(true);
      }, 1500);
    }
  };

  // Update handlePreviewMouseLeave to clear timeout
  const handlePreviewMouseLeave = () => {
    if (previewTooltipTimeoutRef.current) {
      globalThis.clearTimeout(previewTooltipTimeoutRef.current);
    }
    setIsPreviewTooltipVisible(false);
    setAllowPreviewTooltip(true);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (previewTooltipTimeoutRef.current) {
        globalThis.clearTimeout(previewTooltipTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isSearching) {
      setIsSearching(false);
    }
  }, [isSearching]);

  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullScreenModalOpen) {
        handleCloseFullScreenModal();
      }
    };

    document.addEventListener("keydown", handleKeyboardShortcut);
    return () =>
      document.removeEventListener("keydown", handleKeyboardShortcut);
  }, [isFullScreenModalOpen]);

  /* ===== COMPONENT RENDER ===== */
  return (
    <div class={bodyTool}>
      <h1 class={`${titlePurpleLD} mobileMd:mx-auto mb-1`}>STAMP</h1>

      {isConnected && addressError && (
        <div class="w-full text-red-500 text-center font-bold">
          {addressError}
        </div>
      )}

      <form
        class={`${containerBackground} mb-6`}
        onSubmit={(e) => {
          e.preventDefault();
          handleMint();
        }}
        aria-label="Stamp art stamps"
        novalidate
      >
        <div className="flex gap-5">
          <div className="flex gap-5">
            {imagePreviewDiv}
            {fileError && <p class="text-red-500 mt-2">{fileError}</p>}
          </div>

          <div class="flex flex-col justify-between items-end w-full">
            <div className="relative">
              <ToggleSwitchButton
                isActive={showAdvancedOptions}
                onToggle={() => {
                  handleShowAdvancedOptions();
                  setIsAdvancedTooltipVisible(false);
                  setAllowAdvancedTooltip(false);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                toggleButtonId="switch-toggle-advanced"
                onMouseEnter={handleAdvancedMouseEnter}
                onMouseLeave={handleAdvancedMouseLeave}
              />
              <div
                class={`${tooltipButton} ${
                  isAdvancedTooltipVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                {tooltipText}
              </div>
            </div>
            <div className="flex items-center gap-3 min-[420px]:gap-5">
              <h5 className="font-semibold text-lg min-[420px]:text-xl text-stamp-grey">
                EDITIONS
              </h5>

              <InputField
                type="text"
                value={issuance}
                onChange={(e) => handleIssuanceChange(e)}
                error={issuanceError}
                textAlign="center"
                class="!w-10"
              />
            </div>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-500 ${
            showAdvancedOptions
              ? "max-h-[150px] opacity-100 mt-5"
              : "max-h-0 opacity-0 mt-0"
          }`}
        >
          <div className="flex justify-between gap-5 mb-5">
            {poshToggleButton}
            <div
              ref={lockButtonRef}
              className="flex items-center justify-center !w-10 !h-10 rounded-md bg-stamp-grey cursor-pointer group"
              onClick={() => {
                setIsLocked(!isLocked);
                setIsLockTooltipVisible(false);
                setAllowLockTooltip(false);
              }}
              onMouseEnter={handleLockMouseEnter}
              onMouseLeave={handleLockMouseLeave}
            >
              {isLocked
                ? (
                  <Icon
                    type="iconLink"
                    name="locked"
                    weight="bold"
                    size="xs"
                    color="custom"
                    className="fill-stamp-purple-dark group-hover:fill-stamp-purple cursor-pointer"
                  />
                )
                : (
                  <Icon
                    type="iconLink"
                    name="unlocked"
                    weight="bold"
                    size="xs"
                    color="custom"
                    className="fill-stamp-purple-bright group-hover:fill-stamp-purple-dark cursor-pointer"
                  />
                )}
            </div>
          </div>
          <div className={containerRowForm}>
            <InputField
              type="text"
              value={stampName}
              onChange={(e) => handleStampNameChange(e)}
              placeholder={isPoshStamp
                ? "Named Stamp (Requires XCP)"
                : "Custom CPID"}
              maxLength={isPoshStamp ? 13 : 21}
              minLength={isPoshStamp ? 1 : 15}
              error={stampNameError}
            />

            <div
              ref={previewButtonRef}
              className="flex items-center justify-center !w-[46px] !h-10 rounded-md bg-stamp-grey cursor-pointer group" // dunno why but the width has to be +6px ?!?!
              onClick={() => {
                toggleFullScreenModal();
                setIsPreviewTooltipVisible(false);
                setAllowPreviewTooltip(false);
              }}
              onMouseEnter={handlePreviewMouseEnter}
              onMouseLeave={handlePreviewMouseLeave}
            >
              <Icon
                type="iconLink"
                name="fullscreen"
                weight="bold"
                size="xs"
                color="custom"
                className="fill-stamp-purple-dark group-hover:fill-stamp-purple cursor-pointer"
              />
              <div
                class={`${tooltipButton} ${
                  isPreviewTooltipVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                {previewTooltipText}
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className={containerBackground}>
        <FeeCalculatorAdvanced
          fee={fee}
          handleChangeFee={handleChangeFee}
          type="stamp"
          fileType={file?.type}
          fileSize={fileSize}
          issuance={parseInt(issuance, 10)}
          BTCPrice={BTCPrice}
          onRefresh={fetchFees}
          isSubmitting={false}
          onSubmit={handleMint}
          buttonName={isConnected ? "STAMP" : "CONNECT WALLET"}
          userAddress={address}
          feeDetails={feeDetails}
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
          disabled={!isFormValid}
          utxoAncestors={[]}
        />

        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
        />
      </div>

      {isFullScreenModalOpen && openModal(
        <PreviewImageModal
          src={file!}
          contentType={file?.type?.startsWith("text/html") ? "html" : "image"}
        />,
        "zoomInOut",
      )}

      <div
        className={`${tooltipButtonInCollapsible} ${
          isPoshTooltipVisible && showAdvancedOptions
            ? "opacity-100"
            : "opacity-0"
        }`}
        style={{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y - 28}px`,
          transform: "translate(-50%, 0)",
        }}
      >
        {poshTooltipText}
      </div>

      <div
        className={`${tooltipButtonInCollapsible} ${
          isLockTooltipVisible && showAdvancedOptions
            ? "opacity-100"
            : "opacity-0"
        }`}
        style={{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y - 28}px`,
          transform: "translate(-50%, 0)",
        }}
      >
        {lockTooltipText}
      </div>

      <div
        className={`${tooltipButtonInCollapsible} ${
          isPreviewTooltipVisible && showAdvancedOptions
            ? "opacity-100"
            : "opacity-0"
        }`}
        style={{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y - 28}px`,
          transform: "translate(-50%, 0)",
        }}
      >
        FULLSCREEN
      </div>
    </div>
  );
}
