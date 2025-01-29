import { useEffect, useRef, useState } from "preact/hooks";
import { useConfig } from "$client/hooks/useConfig.ts";
import axiod from "axiod";
import { walletContext } from "$client/wallet/wallet.ts";
import { getWalletProvider } from "$client/wallet/walletHelper.ts";
import { fetchBTCPriceInUSD } from "$lib/utils/balanceUtils.ts";
import { useFeePolling } from "$client/hooks/useFeePolling.ts";
import { ComplexFeeCalculator } from "$islands/fee/ComplexFeeCalculator.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import { InputField } from "$islands/stamping/InputField.tsx";
import { validateWalletAddressForMinting } from "$lib/utils/scriptTypeUtils.ts";
import { Config } from "$globals";
import { logger } from "$lib/utils/logger.ts";
import StampImageFullScreen from "$islands/stamp/details/StampImageFullScreen.tsx";
import { NOT_AVAILABLE_IMAGE } from "$lib/utils/constants.ts";
import { handleImageError } from "$lib/utils/imageUtils.ts";

const log = (message: string, data?: unknown) => {
  logger.debug("stamps", {
    message: `[OlgaContent] ${message}`,
    data,
  });
};

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
  satsPerKB: number;
  service_fee: string | null;
  service_fee_address: string | null;
  assetName?: string;
}

// Update the extractErrorMessage function
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
  txid?: string | undefined;
}

interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string | undefined;
}

// At the top of the file with other constants
const PREVIEW_SIZE_CLASSES =
  "w-[96px] h-[96px] mobileMd:w-[108px] mobileMd:h-[108px] mobileLg:w-[120px] mobileLg:h-[120px]" as const;

export function OlgaContent() {
  const { config, isLoading } = useConfig<Config>();

  if (isLoading) {
    return <div>Loading configuration...</div>;
  }

  if (!config) {
    return <div>Error: Configuration not loaded</div>;
  }

  const { wallet, isConnected } = walletContext;
  const address = isConnected ? wallet.address : undefined;

  type FileType = File | null;

  const [file, setFile] = useState<FileType>(null);
  const [fee, setFee] = useState<number>(0);
  const [issuance, setIssuance] = useState("1");

  const [BTCPrice, setBTCPrice] = useState<number>(60000);
  const [fileSize, setFileSize] = useState<number | undefined>(undefined);
  const [isLocked, setIsLocked] = useState(true);
  const [isPoshStamp, setIsPoshStamp] = useState(false);
  const [stampName, setStampName] = useState("");
  const { fees, loading, fetchFees } = useFeePolling(300000); // 5 minutes

  const [fileError, setFileError] = useState<string>("");
  const [issuanceError, setIssuanceError] = useState<string>("");
  const [stampNameError, setStampNameError] = useState<string>("");
  const [apiError, setApiError] = useState<string>("");

  // Add the submissionMessage state
  const [submissionMessage, setSubmissionMessage] = useState<
    SubmissionMessage | null
  >(null);

  // Add isSearching state
  const [isSearching, setIsSearching] = useState(false);

  // Initialize addressError as undefined
  const [addressError, setAddressError] = useState<string | undefined>(
    undefined,
  );

  const [txDetails, setTxDetails] = useState<MintResponse | null>(null);

  // Add new state and refs for tooltips
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isUploadTooltipVisible, setIsUploadTooltipVisible] = useState(false);

  const uploadTooltipTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (fees && !loading) {
      const recommendedFee = Math.round(fees.recommendedFee);
      logger.debug("stamps", {
        message: "Setting initial fee",
        data: {
          recommendedFee,
          currentFee: fee,
          hasFile: !!file,
        },
      });
      setFee(recommendedFee);
    }
  }, [fees, loading]);

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await fetchBTCPriceInUSD();
      setBTCPrice(price);
    };
    fetchPrice();
  }, []);

  useEffect(() => {
    // Set the checkbox to checked by default
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

          const mintRequest = {
            sourceWallet: address,
            file: fileData,
            satsPerKB: fee * 1000,
            locked: isLocked,
            qty: issuance,
            filename: file.name,
            ...(isPoshStamp && stampName ? { assetName: stampName } : {}),
            dryRun: true,
          };

          log("Sending mint request", {
            request: { ...mintRequest, file: "[REDACTED]" },
          });

          const response = await axiod.post("/api/v2/olga/mint", mintRequest);
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

          setTxDetails(data);
          setFeeDetails({
            minerFee: Number(data.est_miner_fee) || 0,
            dustValue: Number(data.total_dust_value) || 0,
            totalValue: Number(data.total_output_value) || 0,
            hasExactFees: true,
          });
        } catch (error) {
          logger.error("stamps", {
            message: "Transaction preparation failed",
            error: error instanceof Error ? error.message : String(error),
          });

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
    if (txDetails && fee) {
      try {
        // Use the API-provided miner fee instead of calculating it
        const minerFee = txDetails.est_miner_fee;

        setFeeDetails({
          minerFee,
          dustValue: txDetails.total_dust_value || 0,
          // Add API-provided miner fee to total output value
          totalValue: (txDetails.total_output_value || 0) + minerFee,
          hasExactFees: true,
        });

        logger.debug("stamps", {
          message: "Fee calculation updated",
          data: {
            estimatedSize: txDetails.est_tx_size,
            feeRate: fee,
            minerFee,
            outputValue: txDetails.total_output_value,
            totalWithFee: txDetails.total_output_value + minerFee,
          },
        });
      } catch (error) {
        logger.error("stamps", {
          message: "Fee calculation failed",
          error,
        });
        setFeeDetails({
          minerFee: 0,
          dustValue: 0,
          totalValue: 0,
          hasExactFees: false,
        });
      }
    }
  }, [fee, txDetails]);

  const validateWalletAddress = (address: string) => {
    const { isValid, error } = validateWalletAddressForMinting(address);
    logger.debug("stamps", {
      message: "Validating wallet address",
      data: { address, isValid, error },
    });
    setAddressError(error);
    return isValid;
  };

  const handleChangeFee = (newFee: number) => {
    setFee(newFee);
  };

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const handleShowAdvancedOptions = () => {
    const switchToggle = document.querySelector("#switch-toggle-advanced");
    if (!switchToggle) return;

    setAllowAdvancedTooltip(false);
    setIsAdvancedTooltipVisible(false);

    if (showAdvancedOptions !== true) {
      switchToggle.classList.add("translate-x-full");
      setTimeout(() => {
        switchToggle.innerHTML =
          `<div class='w-[17px] h-[17px] mobileLg:w-5 mobileLg:h-5 rounded-full bg-stamp-purple-dark'></div>`;
      }, 150);
    } else {
      switchToggle.classList.remove("translate-x-full");
      setTimeout(() => {
        switchToggle.innerHTML =
          `<div class='w-[17px] h-[17px] mobileLg:w-5 mobileLg:h-5 rounded-full bg-stamp-purple-darker'></div>`;
      }, 150);
    }
    setShowAdvancedOptions(!showAdvancedOptions);
  };

  const handleIsPoshStamp = () => {
    const switchToggle = document.querySelector("#switch-toggle-locked");
    if (!switchToggle) return;

    setAllowPoshTooltip(false);
    setIsPoshTooltipVisible(false);

    if (!isPoshStamp) {
      switchToggle.classList.add("translate-x-full");
      setTimeout(() => {
        switchToggle.innerHTML =
          `<div class='w-[17px] h-[17px] mobileLg:w-5 mobileLg:h-5 rounded-full bg-stamp-purple-dark'></div>`;
      }, 150);
      setStampName(""); // Clear the input when switching to POSH
    } else {
      switchToggle.classList.remove("translate-x-full");
      setTimeout(() => {
        switchToggle.innerHTML =
          `<div class='w-[17px] h-[17px] mobileLg:w-5 mobileLg:h-5 rounded-full bg-stamp-purple-darker'></div>`;
      }, 150);
      setStampName(""); // Clear the input when switching to CUSTOM CPID
    }
    setIsPoshStamp(!isPoshStamp);
  };

  useEffect(() => {
    const advancedToggle = document.getElementById("switch-toggle-advanced");
    if (advancedToggle) {
      advancedToggle.innerHTML =
        `<div class='w-[17px] h-[17px] mobileLg:w-5 mobileLg:h-5 rounded-full bg-stamp-purple-darker'></div>`;
    }

    const lockedToggle = document.getElementById("switch-toggle-locked");
    if (lockedToggle) {
      lockedToggle.innerHTML =
        `<div class='w-[17px] h-[17px] mobileLg:w-5 mobileLg:h-5 rounded-full bg-stamp-purple-darker'></div>`;
    }
  }, []);

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
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(file.name);

    return {
      isValid: true,
      warning: isImage
        ? undefined
        : "Note: Non-image files may not become numbered stamps.",
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
        const mintRequest: MintRequest = {
          sourceWallet: address,
          qty: issuance,
          locked: isLocked,
          filename: file.name,
          file: fileData,
          satsPerKB: fee * 1000, // Convert sat/vB to satsPerKB
          service_fee: config?.MINTING_SERVICE_FEE,
          service_fee_address: config?.MINTING_SERVICE_FEE_ADDRESS,
        };

        if (isPoshStamp && stampName) {
          mintRequest.assetName = stampName;
        }

        log("Mint request prepared", mintRequest);

        log("Sending mint request to API");
        const response = await axiod.post("/api/v2/olga/mint", mintRequest);

        log("Received response from API", response);

        if (!response.data) {
          throw new Error("No data received from API");
        }

        const mintResponse = response.data as MintResponse;

        if (!mintResponse.hex) {
          throw new Error("Invalid response structure: missing hex field");
        }

        setTxDetails(mintResponse);

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
          },
        });

        if (!result || !result.signed) {
          // If result contains an error message, use it directly
          if (result?.error) {
            logger.debug("stamps", {
              message: "Using error from result",
              error: result.error,
            });
            setApiError(result.error);
            setSubmissionMessage(null);
            return;
          }

          if (result?.cancelled) {
            logger.debug("stamps", {
              message: "Transaction was cancelled",
            });
            setApiError("Transaction was cancelled");
            setSubmissionMessage(null);
            return;
          }

          setApiError("Failed to sign PSBT");
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
            txid: undefined,
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
        setTxDetails(null); // Reset transaction details on error
      }
    } catch (error) {
      logger.error("stamps", {
        message: "Unexpected minting error",
        error,
      });
      setApiError(
        error.message || error.response.data.error ||
          "An unexpected error occurred",
      );
      setSubmissionMessage(null);
    }
  };

  const [isFullScreenModalOpen, setIsFullScreenModalOpen] = useState(false);
  const handleCloseFullScreenModal = () => {
    setIsFullScreenModalOpen(false);
  };
  const toggleFullScreenModal = () => {
    if (!file) return;
    setIsFullScreenModalOpen(!isFullScreenModalOpen);
  };

  const [feeDetails, setFeeDetails] = useState<FeeDetails>({
    minerFee: 0,
    dustValue: 0,
    totalValue: 0,
    hasExactFees: false,
  });

  const [tosAgreed, setTosAgreed] = useState(false);

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

  const bodyTools = "flex flex-col w-full items-center gap-3 mobileMd:gap-6";
  const backgroundContainer =
    "flex flex-col dark-gradient rounded-lg p-3 mobileMd:p-6";
  const titlePurpleLDCenter =
    "inline-block w-full mobileMd:-mb-3 mobileLg:mb-0 text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black purple-gradient3 text-center";
  const tooltipButton =
    "absolute left-1/2 -translate-x-1/2 bg-[#000000BF] px-2 py-1 rounded-sm mb-1 bottom-full text-[10px] mobileLg:text-xs text-stamp-grey-light font-normal whitespace-nowrap transition-opacity duration-300";
  const tooltipImage =
    "fixed bg-[#000000BF] px-2 py-1 mb-1.5 rounded-sm text-[10px] mobileLg:text-xs text-stamp-grey-light font-normal whitespace-nowrap pointer-events-none z-50 transition-opacity duration-300";
  const tooltipButtonOverflow =
    "fixed bg-[#000000BF] px-2 py-1 rounded-sm text-[10px] mobileLg:text-xs text-stamp-grey-light font-normal whitespace-nowrap pointer-events-none z-50 transition-opacity duration-300";

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
      message: "OlgaContent mounted",
      data: {
        isConnected,
        hasWallet: !!wallet,
        provider: wallet?.provider,
      },
    });

    return () => {
      logger.debug("stamps", {
        message: "OlgaContent unmounted",
      });
    };
  }, []);

  // Add cleanup for blob URLs
  useEffect(() => {
    return () => {
      // Cleanup any existing blob URLs when component unmounts
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
      class={`relative rounded items-center mx-auto text-center cursor-pointer ${PREVIEW_SIZE_CLASSES} content-center bg-stamp-purple-dark group hover:bg-[#8800CC] transition duration-300`}
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
            class="cursor-pointer h-full w-full flex flex-col items-center justify-center"
          >
            {file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i)
              ? (
                <img
                  class={`${PREVIEW_SIZE_CLASSES} object-contain rounded bg-black [image-rendering:pixelated]`}
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
                  class={`${PREVIEW_SIZE_CLASSES} object-contain rounded bg-black [image-rendering:pixelated]`}
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
                  class={`${PREVIEW_SIZE_CLASSES} object-contain rounded bg-black [image-rendering:pixelated]`}
                  src={NOT_AVAILABLE_IMAGE}
                  alt={`File: ${file.name}`}
                />
              )}
            <div class="absolute inset-0 hover:bg-black hover:bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <img
                src="/img/stamping/image-upload.svg"
                class="w-7 h-7 mobileMd:min-w-8 mobileMd:min-h-8 mobileLg:min-w-9 mobileLg:min-h-9"
                alt="Change file"
              />
            </div>
          </label>
        )
        : (
          <label
            for="upload"
            class="cursor-pointer h-full flex flex-col items-center justify-center gap-3"
          >
            <img
              src="/img/stamping/image-upload.svg"
              class="w-7 h-7 mobileMd:min-w-8 mobileMd:min-h-8 mobileLg:min-w-9 mobileLg:min-h-9"
              alt="Upload image"
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

  const [tooltipText, setTooltipText] = useState("SIMPLE");
  const [isAdvancedTooltipVisible, setIsAdvancedTooltipVisible] = useState(
    false,
  );
  const [allowAdvancedTooltip, setAllowAdvancedTooltip] = useState(true);
  const advancedTooltipTimeoutRef = useRef<number | null>(null);

  const handleAdvancedMouseEnter = () => {
    if (allowAdvancedTooltip) {
      setTooltipText(
        showAdvancedOptions ? "SIMPLE" : "ADVANCED",
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (advancedTooltipTimeoutRef.current) {
        globalThis.clearTimeout(advancedTooltipTimeoutRef.current);
      }
    };
  }, []);

  // Add new state variable for POSH tooltip
  const [poshTooltipText, setPoshTooltipText] = useState("POSH");
  const [isPoshTooltipVisible, setIsPoshTooltipVisible] = useState(false);
  const [allowPoshTooltip, setAllowPoshTooltip] = useState(true);
  const poshTooltipTimeoutRef = useRef<number | null>(null);

  // Add a ref to get the button's position
  const poshButtonRef = useRef<HTMLButtonElement>(null);

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
    <button
      ref={poshButtonRef}
      class="min-w-[42px] h-[21px] mobileLg:min-w-12 mobileLg:h-6 rounded-full bg-stamp-grey flex items-center transition duration-300 focus:outline-none shadow relative"
      onClick={() => {
        handleIsPoshStamp();
        setIsPoshTooltipVisible(false);
        setAllowPoshTooltip(false);
      }}
      onMouseEnter={handlePoshMouseEnter}
      onMouseLeave={handlePoshMouseLeave}
    >
      <div
        id="switch-toggle-locked"
        class="w-[21px] h-[21px] mobileLg:w-6 mobileLg:h-6 relative rounded-full transition duration-500 transform flex justify-center items-center bg-stamp-grey"
      >
      </div>
    </button>
  );

  // Add state for lock tooltip text (near other tooltip states)
  const [lockTooltipText, setLockTooltipText] = useState("LOCK");
  const [isLockTooltipVisible, setIsLockTooltipVisible] = useState(false);
  const [allowLockTooltip, setAllowLockTooltip] = useState(true);
  const lockButtonRef = useRef<HTMLDivElement>(null);
  const lockTooltipTimeoutRef = useRef<number | null>(null);

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

  // Add state for preview tooltip text (with other tooltip states)
  const [previewTooltipText, setPreviewTooltipText] = useState("FULLSCREEN");
  const [isPreviewTooltipVisible, setIsPreviewTooltipVisible] = useState(false);
  const [allowPreviewTooltip, setAllowPreviewTooltip] = useState(true);
  const previewButtonRef = useRef<HTMLDivElement>(null);

  // Add ref for timeout
  const previewTooltipTimeoutRef = useRef<number | null>(null);

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

  return (
    <div class={bodyTools}>
      <h1 class={titlePurpleLDCenter}>STAMP</h1>

      {isConnected && addressError && (
        <div class="w-full text-red-500 text-center font-bold">
          {addressError}
        </div>
      )}

      <div className="dark-gradient rounded-lg p-3 mobileMd:p-6 w-full">
        <div className="flex gap-3 mobileMd:gap-6">
          <div className="flex gap-3 mobileMd:gap-6">
            {imagePreviewDiv}
            {fileError && <p class="text-red-500 mt-2">{fileError}</p>}
          </div>

          <div class="w-full flex flex-col justify-between items-end">
            <button
              class="min-w-[42px] h-[21px] mobileLg:min-w-12 mobileLg:h-6 rounded-full bg-stamp-grey flex items-center transition duration-300 focus:outline-none shadow relative"
              onClick={handleShowAdvancedOptions}
              onMouseEnter={handleAdvancedMouseEnter}
              onMouseLeave={handleAdvancedMouseLeave}
            >
              <div
                id="switch-toggle-advanced"
                class="w-[21px] h-[21px] mobileLg:w-6 mobileLg:h-6 relative rounded-full transition duration-500 transform flex justify-center items-center bg-stamp-grey"
              >
              </div>
              <div
                class={`${tooltipButton} ${
                  isAdvancedTooltipVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                {tooltipText}
              </div>
            </button>
            <div className="flex gap-3 mobileMd:gap-6 items-center">
              <p className="text-xl mobileLg:text-2xl font-semibold text-stamp-grey">
                EDITIONS
              </p>
              <div className="w-[42px] mobileLg:w-12">
                <InputField
                  type="text"
                  value={issuance}
                  onChange={(e) => handleIssuanceChange(e)}
                  error={issuanceError}
                  textAlign="center"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-500 ${
            showAdvancedOptions
              ? "max-h-[200px] opacity-100 mt-3 mobileMd:mt-6"
              : "max-h-0 opacity-0 mt-0"
          }`}
        >
          <div className="flex gap-3 mobileMd:gap-6 justify-between mb-3 mobileMd:mb-6">
            {poshToggleButton}
            <div
              ref={lockButtonRef}
              className="w-[42px] h-[42px] mobileLg:w-12 mobileLg:h-12 bg-stamp-grey rounded-md cursor-pointer flex items-center justify-center group"
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    class="w-[21px] h-[21px] mobileLg:w-6 mobileLg:h-6 fill-stamp-purple-darker group-hover:fill-stamp-purple cursor-pointer"
                    role="button"
                    aria-label="Locked"
                  >
                    <path d="M26 9.5H22.5V7C22.5 5.27609 21.8152 3.62279 20.5962 2.40381C19.3772 1.18482 17.7239 0.5 16 0.5C14.2761 0.5 12.6228 1.18482 11.4038 2.40381C10.1848 3.62279 9.5 5.27609 9.5 7V9.5H6C5.33696 9.5 4.70107 9.76339 4.23223 10.2322C3.76339 10.7011 3.5 11.337 3.5 12V26C3.5 26.663 3.76339 27.2989 4.23223 27.7678C4.70107 28.2366 5.33696 28.5 6 28.5H26C26.663 28.5 27.2989 28.2366 27.7678 27.7678C28.2366 27.2989 28.5 26.663 28.5 26V12C28.5 11.337 28.2366 10.7011 27.7678 10.2322C27.2989 9.76339 26.663 9.5 26 9.5ZM12.5 7C12.5 6.07174 12.8687 5.1815 13.5251 4.52513C14.1815 3.86875 15.0717 3.5 16 3.5C16.9283 3.5 17.8185 3.86875 18.4749 4.52513C19.1313 5.1815 19.5 6.07174 19.5 7V9.5H12.5V7ZM25.5 25.5H6.5V12.5H25.5V25.5Z" />
                  </svg>
                )
                : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    class="w-[21px] h-[21px] mobileLg:w-6 mobileLg:h-6 fill-stamp-purple-dark group-hover:fill-stamp-purple cursor-pointer"
                    role="button"
                    aria-label="Unlocked"
                  >
                    <path d="M26 9.5H12.5V7C12.5 6.07174 12.8687 5.1815 13.5251 4.52513C14.1815 3.86875 15.0717 3.5 16 3.5C17.6888 3.5 19.2063 4.7025 19.53 6.29875C19.5692 6.49179 19.6461 6.67522 19.7562 6.83855C19.8663 7.00189 20.0076 7.14193 20.1718 7.2507C20.336 7.35946 20.5201 7.4348 20.7135 7.47243C20.9068 7.51006 21.1057 7.50923 21.2987 7.47C21.4918 7.43077 21.6752 7.3539 21.8386 7.24378C22.0019 7.13366 22.1419 6.99244 22.2507 6.8282C22.3595 6.66396 22.4348 6.4799 22.4724 6.28654C22.5101 6.09317 22.5092 5.89429 22.47 5.70125C21.8587 2.6875 19.1375 0.5 16 0.5C14.2767 0.501985 12.6246 1.18744 11.406 2.406C10.1874 3.62455 9.50198 5.2767 9.5 7V9.5H6C5.33696 9.5 4.70107 9.76339 4.23223 10.2322C3.76339 10.7011 3.5 11.337 3.5 12V26C3.5 26.663 3.76339 27.2989 4.23223 27.7678C4.70107 28.2366 5.33696 28.5 6 28.5H26C26.663 28.5 27.2989 28.2366 27.7678 27.7678C28.2366 27.2989 28.5 26.663 28.5 26V12C28.5 11.337 28.2366 10.7011 27.7678 10.2322C27.2989 9.76339 26.663 9.5 26 9.5ZM25.5 25.5H6.5V12.5H25.5V25.5Z" />
                  </svg>
                )}
            </div>
          </div>
          <div className="flex items-end gap-3 mobileMd:gap-6">
            <div className="w-full">
              <InputField
                type="text"
                value={stampName}
                onChange={(e) => handleStampNameChange(e)}
                placeholder={isPoshStamp
                  ? "Named Stamp (Requires XCP)"
                  : "Custom CPID"}
                maxLength={13}
                error={stampNameError}
              />
            </div>
            <div
              ref={previewButtonRef}
              className="min-w-[42px] h-[42px] mobileLg:min-w-12 mobileLg:h-12 bg-stamp-grey rounded-md cursor-pointer flex items-center justify-center group"
              onClick={() => {
                toggleFullScreenModal();
                setIsPreviewTooltipVisible(false);
                setAllowPreviewTooltip(false);
              }}
              onMouseEnter={handlePreviewMouseEnter}
              onMouseLeave={handlePreviewMouseLeave}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                class="w-[21px] h-[21px] mobileLg:w-6 mobileLg:h-6 fill-stamp-purple-darker group-hover:fill-stamp-purple cursor-pointer"
                role="button"
                aria-label="View Fullscreen"
              >
                <path d="M27.5 6V11C27.5 11.3978 27.342 11.7794 27.0607 12.0607C26.7794 12.342 26.3978 12.5 26 12.5C25.6022 12.5 25.2206 12.342 24.9393 12.0607C24.658 11.7794 24.5 11.3978 24.5 11V7.5H21C20.6022 7.5 20.2206 7.34196 19.9393 7.06066C19.658 6.77936 19.5 6.39782 19.5 6C19.5 5.60218 19.658 5.22064 19.9393 4.93934C20.2206 4.65804 20.6022 4.5 21 4.5H26C26.3978 4.5 26.7794 4.65804 27.0607 4.93934C27.342 5.22064 27.5 5.60218 27.5 6ZM11 24.5H7.5V21C7.5 20.6022 7.34196 20.2206 7.06066 19.9393C6.77936 19.658 6.39782 19.5 6 19.5C5.60218 19.5 5.22064 19.658 4.93934 19.9393C4.65804 20.2206 4.5 20.6022 4.5 21V26C4.5 26.3978 4.65804 26.7794 4.93934 27.0607C5.22064 27.342 5.60218 27.5 6 27.5H11C11.3978 27.5 11.7794 27.342 12.0607 27.0607C12.342 26.7794 12.5 26.3978 12.5 26C12.5 25.6022 12.342 25.2206 12.0607 24.9393C11.7794 24.658 11.3978 24.5 11 24.5ZM26 19.5C25.6022 19.5 25.2206 19.658 24.9393 19.9393C24.658 20.2206 24.5 20.6022 24.5 21V24.5H21C20.6022 24.5 20.2206 24.658 19.9393 24.9393C19.658 25.2206 19.5 25.6022 19.5 26C19.5 26.3978 19.658 26.7794 19.9393 27.0607C20.2206 27.342 20.6022 27.5 21 27.5H26C26.3978 27.5 26.7794 27.342 27.0607 27.0607C27.342 26.7794 27.5 26.3978 27.5 26V21C27.5 20.6022 27.342 20.2206 27.0607 19.9393C26.7794 19.658 26.3978 19.5 26 19.5ZM11 4.5H6C5.60218 4.5 5.22064 4.65804 4.93934 4.93934C4.65804 5.22064 4.5 5.60218 4.5 6V11C4.5 11.3978 4.65804 11.7794 4.93934 12.0607C5.22064 12.342 5.60218 12.5 6 12.5C6.39782 12.5 6.77936 12.342 7.06066 12.0607C7.34196 11.7794 7.5 11.3978 7.5 11V7.5H11C11.3978 7.5 11.7794 7.34196 12.0607 7.06066C12.342 6.77936 12.5 6.39782 12.5 6C12.5 5.60218 12.342 5.22064 12.0607 4.93934C11.7794 4.65804 11.3978 4.5 11 4.5Z" />
              </svg>
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
      </div>

      {/* FIXME: FINALIZE OPTIMIZATION ROUTINE */}
      {
        /* <div
        class="bg-[#6E6E6E] w-full"
      >
        <p class="text-[#F5F5F5] text-[22px] font-semibold px-6 py-[15px]">
          Optimization
        </p>
        <hr />
        <div class="grid grid-cols-2 tablet:grid-cols-4 justify-between gap-4 py-6 px-6">
          <div class="flex items-center">
            <input
              id="default-radio-1"
              type="radio"
              name="radio"
              class="w-5 h-5 focus:ring-blue-500 focus:ring-2"
            />
            <label
              for="default-radio-1"
              class="ms-2 text-[18px] font-semibold text-[#F5F5F5]"
            >
              None
            </label>
          </div>
          <div class="flex items-center">
            <input
              id="default-radio-2"
              type="radio"
              name="radio"
              class="w-5 h-5 focus:ring-blue-500 focus:ring-2"
            />
            <label
              for="default-radio-2"
              class="ms-2 text-[18px] font-semibold text-[#F5F5F5]"
            >
              Max compression
            </label>
          </div>
          <div class="flex items-center">
            <input
              id="default-radio-2"
              type="radio"
              name="radio"
              class="w-5 h-5 focus:ring-blue-500 focus:ring-2"
            />
            <label
              for="default-radio-2"
              class="ms-2 text-[18px] font-semibold text-[#F5F5F5]"
            >
              Balanced
            </label>
          </div>
          <div class="flex items-center">
            <input
              id="default-radio-2"
              type="radio"
              name="radio"
              class="w-5 h-5 focus:ring-blue-500 focus:ring-2"
            />
            <label
              for="default-radio-2"
              class="ms-2 text-[18px] font-semibold text-[#F5F5F5]"
            >
              Max quality
            </label>
          </div>
        </div> */
      }

      <div className={`${backgroundContainer} w-full`}>
        <ComplexFeeCalculator
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

      {isFullScreenModalOpen && (
        <StampImageFullScreen
          src={file}
          handleCloseModal={handleCloseFullScreenModal}
          contentType={file?.type?.startsWith("text/html") ? "html" : "image"}
        />
      )}

      <div
        className={`${tooltipButtonOverflow} ${
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
        className={`${tooltipButtonOverflow} ${
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
        className={`${tooltipButtonOverflow} ${
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
