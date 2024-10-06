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

        if (!response.data.hex) {
          throw new Error("Invalid response structure: missing hex field");
        }

        const { hex, base64, txDetails, cpid } = response.data;
        log("Extracted data from response", { hex, base64, txDetails, cpid });

        const walletProvider = getWalletProvider(
          walletContext.wallet.value.provider,
        );

        const inputsToSign = txDetails.map((
          input: { signingIndex: number },
        ) => ({
          address: walletContext.wallet.value.address,
          signingIndexes: [input.signingIndex],
        }));

        const result = await walletProvider.signPSBT(hex, inputsToSign);

        if (result === null) {
          setApiError("Transaction was cancelled by the user");
          return;
        }

        if (typeof result === "string") {
          if (result.startsWith("0x") || result.length === 64) {
            log("Transaction signed and broadcast successfully. TXID:", result);
            alert(
              `Transaction signed and broadcast successfully. TXID: ${result}`,
            );
          } else {
            log("Transaction signed successfully. Signed PSBT:", result);
            alert(`Transaction signed successfully. Signed PSBT: ${result}`);
          }
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

      if (error.response) {
        console.error("API Error Response:", error.response);
        if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error stack:", error.stack);
      }

      if (errorMessage.includes("insufficient funds")) {
        if (isPoshStamp) {
          errorMessage = "Insufficient BTC or XCP in User's Wallet";
        } else {
          errorMessage = "Insufficient BTC in User's Wallet";
        }
      }

      log("Final error message", errorMessage);
      setApiError(errorMessage);
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

      <div className="bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-6 w-full">
        <div className="flex gap-8">
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
                class="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-[48px] outline-none rounded-md focus:bg-[#CCCCCC] text-center"
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
