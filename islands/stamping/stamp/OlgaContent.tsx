import { useEffect, useState } from "preact/hooks";
import axiod from "axiod";

import { walletContext } from "$lib/store/wallet/wallet.ts";
import { getWalletProvider } from "$lib/store/wallet/walletHelper.ts";
import { fetchBTCPrice } from "$lib/utils/btc.ts";

import { useConfig } from "$/hooks/useConfig.ts";
import { useFeePolling } from "hooks/useFeePolling.tsx";

import ImageFullScreen from "./ImageFullScreen.tsx";
import { FeeEstimation } from "../FeeEstimation.tsx";

const log = (message: string, data?: any) => {
  console.log(`[OlgaContent] ${message}`, data ? data : "");
};

export function OlgaContent() {
  const config = useConfig();

  if (!config) {
    return <div>Error...</div>;
  }

  const { wallet, isConnected } = walletContext;
  const { address } = wallet.value;

  type FileType = File | null;

  const [file, setFile] = useState<FileType>(null);
  const [fee, setFee] = useState<number>(0);
  const [issuance, setIssuance] = useState("1");

  const [BTCPrice, setBTCPrice] = useState<number>(60000);
  const [fileSize, setFileSize] = useState<number | null>(null);
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

  // Add the addressError state
  const [addressError, setAddressError] = useState<string>("");

  useEffect(() => {
    if (fees && !loading) {
      const recommendedFee = Math.round(fees.recommendedFee);
      setFee(recommendedFee);
    }
  }, [fees, loading]);

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await fetchBTCPrice();
      setBTCPrice(price);
    };
    fetchPrice();
  }, []);

  useEffect(() => {
    // Set the checkbox to checked by default
    setIsLocked(true);
  }, []);

  useEffect(() => {
    // Validate wallet address on component mount and when the wallet changes
    validateWalletAddress(wallet.value.address);
  }, [wallet.value.address]);

  const validateWalletAddress = (address: string) => {
    // Regular expressions for supported address types
    const p2pkhRegex = /^1[1-9A-HJ-NP-Za-km-z]{25,34}$/; // Starts with '1' (Legacy)
    const bech32Regex = /^bc1q[0-9a-z]{38,59}$/; // Starts with 'bc1q' (Bech32 P2WPKH)

    if (
      p2pkhRegex.test(address) ||
      bech32Regex.test(address)
    ) {
      // Supported address
      setAddressError("");
    } else {
      // Unsupported address
      setAddressError(
        "Connected wallet address type is unsupported for minting.",
      );
    }
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
          `<div class='w-5 h-5 rounded-full bg-[#440066]'></div>`;
      }, 150);
    } else {
      switchToggle.classList.remove("translate-x-full");
      setTimeout(() => {
        switchToggle.innerHTML =
          `<div class='w-5 h-5 rounded-full bg-[#440066]'></div>`;
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
          `<div class='w-5 h-5 rounded-full bg-[#440066]'></div>`;
      }, 150);
    } else {
      switchToggle.classList.remove("translate-x-full");
      setTimeout(() => {
        switchToggle.innerHTML =
          `<div class='w-5 h-5 rounded-full bg-[#440066]'></div>`;
      }, 150);
    }
    setIsPoshStamp(!isPoshStamp);
  };

  useEffect(() => {
    const advancedToggle = document.getElementById("switch-toggle-advanced");
    if (advancedToggle) {
      advancedToggle.innerHTML =
        `<div class='w-5 h-5 rounded-full bg-[#440066]'></div>`;
    }

    const lockedToggle = document.getElementById("switch-toggle-locked");
    if (lockedToggle) {
      lockedToggle.innerHTML =
        `<div class='w-5 h-5 rounded-full bg-[#440066]'></div>`;
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

  const handleImage = (e: any) => {
    const selectedFile = e.target.files[0];
    if (selectedFile.size > 64 * 1024) {
      setFileError("File size must be less than 64KB.");
      setFile(null);
      setFileSize(null);
    } else {
      setFileError("");
      setFile(selectedFile);
      setFileSize(selectedFile.size);
    }
    console.log(selectedFile);
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
    if (/^[B-Zb-z][A-Za-z]{0,12}$/.test(value)) {
      setStampName(value);
      setStampNameError("");
    } else {
      setStampNameError(
        "Invalid stamp name. Must start with B-Z and be 1-13 characters long.",
      );
    }
  };

  const handleMint = async () => {
    try {
      // Before proceeding, check if there's an address error
      if (addressError) {
        throw new Error(addressError);
      }

      log("Starting minting process");

      if (!isConnected.value) {
        throw new Error("Connect your wallet");
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
        const mintRequest: any = {
          sourceWallet: address,
          qty: issuance,
          locked: isLocked,
          filename: file.name,
          file: data,
          satsPerKB: fee,
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
          walletContext.wallet.value.provider,
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
        console.log("Result from walletProvider.signPSBT:", result);

        if (!result || !result.signed) {
          const errorMsg = result?.error || "Unknown error signing transaction";
          setApiError(`Transaction signing failed: ${errorMsg}`);
          console.error("Transaction signing failed:", errorMsg);
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
          throw new Error("Unexpected result from signing transaction");
        }
      } catch (error) {
        log("Error in minting process", error);
        throw error;
      }
    } catch (error) {
      console.error("Unexpected error in handleMint:", error);
      let errorMessage = "An unexpected error occurred during minting";

      if (error.response && error.response.data) {
        const responseData = error.response.data;
        if (responseData.error) {
          errorMessage = responseData.error;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.data && responseData.data.message) {
          errorMessage = responseData.data.message;
        } else if (
          responseData.data && responseData.data.args &&
          responseData.data.args[0]
        ) {
          errorMessage = responseData.data.args[0];
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error stack:", error.stack);
      }

      if (errorMessage.includes("insufficient funds")) {
        errorMessage = isPoshStamp
          ? "Insufficiently Sized UTXO, BTC or XCP in User's Wallet"
          : "Insufficiently Sized UTXO or BTC in User's Wallet";
      }

      console.error("Final error message:", errorMessage);
      setApiError(errorMessage);
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

  return (
    <div class="flex flex-col w-full items-center gap-8">
      <p class="text-[#5503A6] text-3xl md:text-6xl font-black mt-6 w-full text-center">
        STAMP
      </p>

      {/* Display address error if any */}
      {addressError && (
        <div class="w-full text-red-500 text-center font-bold">
          {addressError}
        </div>
      )}

      <div className="bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-6 w-full">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex gap-8">
            <div
              id="image-preview"
              class="relative rounded-md items-center mx-auto text-center cursor-pointer w-[120px] h-[120px] content-center bg-[#2B0E49]"
            >
              <input
                id="upload"
                type="file"
                class="hidden"
                accept="image/*"
                onChange={handleImage}
              />
              {file !== null && (
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
                />
              )}
              {file === null && (
                <label
                  for="upload"
                  class="cursor-pointer h-full flex flex-col items-center justify-center gap-3"
                >
                  <img
                    src="/img/mint/icon-image-upload.png"
                    class="w-10 h-10"
                    alt=""
                  />
                  <h5 class="text-[#F5F5F5] text-sm font-semibold">
                    Upload Image
                  </h5>
                </label>
              )}
            </div>

            <div class="p-6 rounded-md items-center mx-auto text-center cursor-pointer w-[120px] h-[120px] content-center bg-[#2B0E49]">
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
            </div>

            {fileError && <p class="text-red-500 mt-2">{fileError}</p>}
          </div>

          <div class="w-full flex flex-row-reverse md:flex-col justify-between items-center md:items-end">
            <button
              class="min-w-12 h-6 rounded-full bg-gray-700 flex items-center transition duration-300 focus:outline-none shadow"
              onClick={handleShowAdvancedOptions}
            >
              <div
                id="switch-toggle-advanced"
                class="w-6 h-6 relative rounded-full transition duration-500 transform text-white flex justify-center items-center"
              >
              </div>
            </button>
            <div className="flex gap-6 items-center">
              <p class="text-base md:text-2xl font-semibold text-[#999999] uppercase">
                Editions
              </p>
              <input
                type="text"
                value={issuance}
                onInput={handleIssuanceChange}
                class="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-[72px] outline-none rounded-md focus:bg-[#CCCCCC]"
              />
            </div>
            {issuanceError && <p class="text-red-500 mt-2">{issuanceError}</p>}
          </div>
        </div>

        <div
          className={`mt-6 transition-all duration-500 ${
            showAdvancedOptions ? "h-full opacity-100" : "h-0 opacity-0"
          }`}
        >
          <div className="flex gap-7 justify-between">
            {
              /* <div className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  id="lockEditions"
                  name="lockEditions"
                  checked={isLocked}
                  onChange={(e: Event) =>
                    setIsLocked((e.target as HTMLInputElement).checked)}
                  className="w-5 h-5 bg-[#262424] border border-[#7F7979]"
                />
                <label
                  htmlFor="lockEditions"
                  className="text-[#B9B9B9] text-[16px] font-semibold"
                >
                  Lock Editions
                </label>
              </div> */
            }
            <button
              class="min-w-12 h-6 rounded-full bg-gray-700 flex items-center transition duration-300 focus:outline-none shadow"
              onClick={handleIsPoshStamp}
            >
              <div
                id="switch-toggle-locked"
                class="w-6 h-6 relative rounded-full transition duration-500 transform text-white flex justify-center items-center"
              >
              </div>
            </button>
            {
              /* <div className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  id="poshStamp"
                  name="poshStamp"
                  checked={isPoshStamp}
                  onChange={(e: Event) =>
                    setIsPoshStamp((e.target as HTMLInputElement).checked)}
                  className="w-5 h-5 bg-[#262424] border border-[#7F7979]"
                />
                <label
                  htmlFor="poshStamp"
                  className="text-[#B9B9B9] text-[16px] font-semibold"
                >
                  Posh Stamp
                </label>
              </div> */
            }
            <img
              src={isLocked
                ? "/img/stamping/LockSimple.svg"
                : "/img/stamping/LockSimpleOpen.svg"}
              className="bg-[#999999] p-3 rounded-md cursor-pointer"
              onClick={() => setIsLocked(!isLocked)}
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="w-full">
              <p className="text-xs md:text-lg font-medium text-[#999999]">
                POSH
              </p>
              <input
                type="text"
                value={stampName}
                onInput={handleStampNameChange}
                placeholder="Stamp Name (max 13 chars, can't start with A)"
                className="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]"
                maxLength={13}
                disabled={!isPoshStamp}
              />
              {stampNameError && (
                <p class="text-red-500 mt-2">{stampNameError}</p>
              )}
            </div>
            <img
              src="/img/stamping/CornersOut.svg"
              className={`p-3 rounded-md cursor-pointer ${
                file ? "bg-[#999999]" : "bg-[#333333]"
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
        <div class="grid grid-cols-2 md:grid-cols-4 justify-between gap-4 py-6 px-6">
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

      <div className="bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-6 w-full">
        <FeeEstimation
          fee={fee}
          handleChangeFee={handleChangeFee}
          type="stamp"
          fileType={file?.type}
          fileSize={fileSize ?? undefined}
          issuance={parseInt(issuance, 10)}
          BTCPrice={BTCPrice}
          onRefresh={fetchFees}
          isSubmitting={false}
          onSubmit={handleMint}
          buttonName="Stamp"
        />

        {apiError && (
          <div class="w-full text-red-500 text-center">
            {apiError}
          </div>
        )}

        {submissionMessage && (
          <div class="w-full text-center font-bold text-white">
            {submissionMessage.message}
            {submissionMessage.txid && (
              <>
                &nbsp;TXID:&nbsp;
                <a
                  href={`https://mempool.space/tx/${submissionMessage.txid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-500 underline"
                >
                  {submissionMessage.txid}
                </a>
              </>
            )}
          </div>
        )}
      </div>

      {isFullScreenModalOpen && (
        <ImageFullScreen
          file={file}
          toggleModal={handleCloseFullScreenModal}
          handleCloseModal={handleCloseFullScreenModal}
        />
      )}
    </div>
  );
}
