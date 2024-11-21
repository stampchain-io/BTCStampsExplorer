import { useEffect, useState } from "preact/hooks";
import { useConfig } from "$client/hooks/useConfig.ts";
import axiod from "axiod";
import { walletContext } from "$client/wallet/wallet.ts";
import { getWalletProvider } from "$client/wallet/walletHelper.ts";
import { fetchBTCPriceInUSD } from "$lib/utils/btc.ts";
import { useFeePolling } from "$client/hooks/useFeePolling.ts";
import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import { InputField } from "$islands/stamping/InputField.tsx";
import { validateWalletAddressForMinting } from "$lib/utils/scriptTypeUtils.ts";
import { Config } from "globals";
import { logger } from "$lib/utils/logger.ts";
import StampImageFullScreen from "$islands/stamp/details/StampImageFullScreen.tsx";

const log = (message: string, data?: any) => {
  console.log(`[OlgaContent] ${message}`, data ? data : "");
};

interface TxDetails {
  fee: number;
  dust: number;
  total: number;
  txDetails: {
    estimatedSize: number;
    totalInputValue: number;
    changeOutput: number;
  };
}

// Add this helper function near the top of the file
function isValidForMinting(params: {
  file: File | null;
  fileError: string;
  issuanceError: string;
  stampNameError: string;
  isPoshStamp: boolean;
  stampName: string;
  addressError?: string;
}) {
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
  hasExactFees: boolean;
  minerFee?: number;
  dustValue?: number;
  totalValue?: number;
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
      message?: string;
    };

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

// Add interface for the wallet error structure
interface WalletError {
  details?: {
    jsonrpc?: string;
    id?: string;
    error?: {
      code?: number;
      message?: string;
    };
  };
  message?: string;
}

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
    {
      message: string;
      txid?: string;
    } | null
  >(null);

  // Initialize addressError as undefined
  const [addressError, setAddressError] = useState<string | undefined>(
    undefined,
  );

  const [txDetails, setTxDetails] = useState<TxDetails | null>(null);

  useEffect(() => {
    if (fees && !loading) {
      const recommendedFee = Math.round(fees.recommendedFee);
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

  // Add state to track if we have a valid transaction to estimate
  const [hasValidTransaction, setHasValidTransaction] = useState(false);

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
      setHasValidTransaction(true);
      const prepareTx = async () => {
        try {
          const data = await toBase64(file);
          const response = await axiod.post("/api/v2/olga/mint", {
            sourceWallet: address,
            file: data,
            satsPerKB: fee * 1000,
            locked: isLocked,
            qty: issuance,
            filename: file.name,
            ...(isPoshStamp && stampName ? { assetName: stampName } : {}),
            dryRun: true, // Flag for fee estimation
          });

          setTxDetails(response.data);
          setFeeDetails({
            minerFee: response.data.fee,
            dustValue: response.data.dust,
            totalValue: response.data.total,
            hasExactFees: true,
          });
        } catch (error) {
          console.error("Transaction preparation error:", error);
          setFeeDetails({ hasExactFees: false });
        }
      };
      prepareTx();
    } else {
      // Reset transaction state when requirements aren't met
      setHasValidTransaction(false);
      setTxDetails(null);
      setFeeDetails({ hasExactFees: false });
    }
  }, [isConnected, wallet.address, file]); // Only recalculate when these essential components change

  // Handle fee rate changes without rebuilding transaction
  useEffect(() => {
    if (hasValidTransaction && txDetails && fee) {
      // Only recalculate fees if we have a valid transaction
      const newFee = Math.ceil(txDetails.txDetails.estimatedSize * fee);
      setFeeDetails({
        minerFee: newFee,
        dustValue: txDetails.dust,
        totalValue: txDetails.total - txDetails.fee + newFee,
        hasExactFees: true,
      });
    }
  }, [fee, txDetails, hasValidTransaction]);

  const validateWalletAddress = (address: string) => {
    const { isValid, error } = validateWalletAddressForMinting(address);
    console.log("Validating wallet address:", { address, isValid, error });
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
    if (showAdvancedOptions !== true) {
      switchToggle.classList.add("translate-x-full");
      setTimeout(() => {
        switchToggle.innerHTML =
          `<div class='w-5 h-5 rounded-full bg-stamp-purple-dark'></div>`;
      }, 150);
    } else {
      switchToggle.classList.remove("translate-x-full");
      setTimeout(() => {
        switchToggle.innerHTML =
          `<div class='w-5 h-5 rounded-full bg-stamp-purple-darker'></div>`;
      }, 150);
    }
    setShowAdvancedOptions(!showAdvancedOptions);
  };

  const handleIsPoshStamp = () => {
    const switchToggle = document.querySelector("#switch-toggle-locked");
    if (!switchToggle) return;

    if (!isPoshStamp) {
      switchToggle.classList.add("translate-x-full");
      setTimeout(() => {
        switchToggle.innerHTML =
          `<div class='w-5 h-5 rounded-full bg-stamp-purple-dark'></div>`;
      }, 150);
      setStampName(""); // Clear the input when switching to POSH
    } else {
      switchToggle.classList.remove("translate-x-full");
      setTimeout(() => {
        switchToggle.innerHTML =
          `<div class='w-5 h-5 rounded-full bg-stamp-purple-darker'></div>`;
      }, 150);
      setStampName(""); // Clear the input when switching to CUSTOM CPID
    }
    setIsPoshStamp(!isPoshStamp);
  };

  useEffect(() => {
    const advancedToggle = document.getElementById("switch-toggle-advanced");
    if (advancedToggle) {
      advancedToggle.innerHTML =
        `<div class='w-5 h-5 rounded-full bg-stamp-purple-darker'></div>`;
    }

    const lockedToggle = document.getElementById("switch-toggle-locked");
    if (lockedToggle) {
      lockedToggle.innerHTML =
        `<div class='w-5 h-5 rounded-full bg-stamp-purple-darker'></div>`;
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
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
    });
  };

  const handleImage = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const selectedFile = input.files?.[0];

    console.log("Handle image called:", {
      hasFile: !!selectedFile,
      fileSize: selectedFile?.size,
      fileType: selectedFile?.type,
    });

    if (!selectedFile) {
      console.log("No file selected");
      setFileError("No file selected");
      setFile(null);
      setFileSize(undefined);
      return;
    }

    if (selectedFile.size > 64 * 1024) {
      console.log("File too large:", selectedFile.size);
      setFileError("File size must be less than 64KB.");
      setFile(null);
      setFileSize(undefined);
      return;
    }

    // Clear any previous errors and set the file
    console.log("Setting valid file:", {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
    });

    setFileError("");
    setFile(selectedFile);
    setFileSize(selectedFile.size);
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
        setStampNameError("Invalid number format after 'A'");
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
        const data = await toBase64(file);
        log("File converted to base64", { fileSize: data.length });

        // Do not convert fee rate; use it directly
        console.log(`User-selected fee rate: ${fee} sat/vB`);

        log("Preparing mint request");
        const mintRequest: MintRequest = {
          sourceWallet: address,
          qty: issuance,
          locked: isLocked,
          filename: file.name,
          file: data,
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

        log("Response data", response.data);
        console.log("txDetails:", response.data.txDetails);

        if (!response.data.hex) {
          throw new Error("Invalid response structure: missing hex field");
        }

        const { hex, base64, txDetails, cpid } = response.data;
        log("Extracted data from response", { hex, base64, txDetails, cpid });

        const walletProvider = getWalletProvider(
          wallet.provider,
        );

        // Correctly construct inputsToSign with index
        const inputsToSign = txDetails.map(
          (input: { signingIndex: number }) => {
            if (typeof input.signingIndex !== "number") {
              throw new Error(
                "signingIndex is missing or invalid in txDetails",
              );
            }
            return {
              index: input.signingIndex,
            };
          },
        );
        console.log("Constructed inputsToSign:", inputsToSign);

        const result = await walletProvider.signPSBT(hex, inputsToSign);

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
          log(
            "Transaction signed and broadcast successfully. TXID:",
            result.txid,
          );
          setSubmissionMessage({
            message: "Transaction broadcasted successfully.",
            txid: result.txid,
          });
          setApiError(""); // Clear any previous errors
        } else {
          console.log(
            "Transaction signed successfully, but txid not returned.",
          );
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
      }
    } catch (error) {
      // This catch block should only handle unexpected errors
      logger.error("stamps", {
        message: "Unexpected minting error",
        error,
      });
      setApiError("An unexpected error occurred");
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

    console.log("Validation state updated:", validationState);
  }, [
    file,
    fileError,
    issuanceError,
    stampNameError,
    isPoshStamp,
    stampName,
    addressError,
  ]);

  const bodyToolsClassName =
    "flex flex-col w-full items-center gap-3 mobileMd:gap-6";
  const titlePurpleLDCenterClassName =
    "text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient3 w-full text-center";

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

  return (
    <div class={bodyToolsClassName}>
      <h1 class={titlePurpleLDCenterClassName}>STAMP</h1>

      {isConnected && addressError && (
        <div class="w-full text-red-500 text-center font-bold">
          {addressError}
        </div>
      )}

      <div className="dark-gradient p-3 mobileMd:p-6 w-full">
        <div className="flex gap-3 mobileMd:gap-6">
          <div className="flex gap-3 mobileMd:gap-6">
            <div
              id="image-preview"
              class="relative rounded-md items-center mx-auto text-center cursor-pointer w-[120px] h-[120px] content-center bg-stamp-purple-dark"
            >
              <input
                id="upload"
                type="file"
                class="hidden"
                accept="image/*"
                onChange={handleImage}
              />
              {file !== null
                ? (
                  <label
                    for="upload"
                    class="cursor-pointer h-full w-full flex flex-col items-center justify-center"
                  >
                    <img
                      width={120}
                      style={{
                        height: "100%",
                        objectFit: "contain",
                        imageRendering: "pixelated",
                        backgroundColor: "rgb(0,0,0)",
                        borderRadius: "6px",
                      }}
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      onError={(e) => {
                        logger.error("stamps", {
                          message: "Image preview failed to load",
                          error: e,
                        });
                      }}
                    />
                    <div class="absolute inset-0 hover:bg-black hover:bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <img
                        src="/img/stamping/image-upload.svg"
                        class="w-12 h-12"
                        alt="Change image"
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
                      class="w-12 h-12"
                      alt="Upload image"
                    />
                  </label>
                )}
            </div>

            {
              /* <div class="p-6 rounded-md items-center mx-auto text-center cursor-pointer w-[120px] h-[120px] content-center bg-[#2B0E49]">
              {file !== null && (
                <img
                  width={120}
                  style={{
                    height: "100%",
                    objectFit: "contain",
                    imageRendering: "pixelated",
                    backgroundColor: "rgb(0,0,0)",
                  }}
                  src={URL.createObjectURL(file)}
                />
              )}
              {file === null && (
                <h5 class="cursor-pointer text-sm font-semibold text-[#F5F5F5]">
                  Preview
                </h5>
              )}
            </div> */
            }

            {fileError && <p class="text-red-500 mt-2">{fileError}</p>}
          </div>

          <div class="w-full flex flex-col justify-between items-end">
            <button
              class="min-w-12 h-6 rounded-full bg-stamp-grey flex items-center transition duration-300 focus:outline-none shadow"
              onClick={handleShowAdvancedOptions}
            >
              <div
                id="switch-toggle-advanced"
                class="w-6 h-6 relative rounded-full transition duration-500 transform flex justify-center items-center bg-stamp-grey"
              >
              </div>
            </button>
            <div className="flex gap-3 mobileMd:gap-6 items-center">
              <p className="text-xl mobileMd:text-2xl desktop:text-3xl font-semibold text-stamp-grey uppercase">
                Editions
              </p>
              <div className="w-12">
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
              ? "max-h-[200px] opacity-100 mt-3 mobileMd:mt-6" // Adjust max-h value based on your content
              : "max-h-0 opacity-0 mt-0"
          }`}
        >
          <div className="flex gap-3 mobileMd:gap-6 justify-between">
            <button
              class="min-w-12 h-6 rounded-full bg-stamp-grey flex items-center transition duration-300 focus:outline-none shadow"
              onClick={handleIsPoshStamp}
            >
              <div
                id="switch-toggle-locked"
                class="w-6 h-6 relative rounded-full transition duration-500 transform flex justify-center items-center bg-stamp-grey"
              >
              </div>
            </button>
            <img
              src={isLocked
                ? "/img/stamping/LockSimple.svg"
                : "/img/stamping/LockSimpleOpen.svg"}
              className="bg-stamp-grey p-3 rounded-md cursor-pointer"
              onClick={() => setIsLocked(!isLocked)}
            />
          </div>
          <div className="flex items-end gap-3 mobileMd:gap-6">
            <div className="w-full">
              <p className="text-base mobileLg:text-lg font-medium text-stamp-grey leading-[2px] mobileMd:leading-[8px] mobileLg:leading-[12px] pb-2 mobileMd:pb-3">
                {isPoshStamp ? "POSH" : "CUSTOM CPID"}
              </p>
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
            <img
              src="/img/stamping/CornersOut.svg"
              className={`p-3 rounded-md cursor-pointer ${
                file ? "bg-[#999999]" : "bg-[#999999]"
              }`}
              onClick={toggleFullScreenModal}
            />
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
        </div>
      </div> */
      }

      <div className="p-3 mobileMd:p-6 dark-gradient z-[10] w-full">
        <FeeEstimation
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
    </div>
  );
}
