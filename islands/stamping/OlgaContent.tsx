import { useEffect, useState } from "preact/hooks";
import { walletContext } from "$lib/store/wallet/wallet.ts";
import { getWalletProvider } from "$lib/store/wallet/walletHelper.ts";
import axiod from "https://deno.land/x/axiod/mod.ts";
import { useConfig } from "$/hooks/useConfig.ts";
import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";
import { useFeePolling } from "hooks/useFeePolling.tsx";

const log = (message: string, data?: any) => {
  console.log(`[OlgaContent] ${message}`, data ? data : "");
};

export function OlgaContent() {
  console.log("OlgaContent component rendered");
  const config = useConfig();

  if (!config) {
    return <div>Error...</div>;
  }

  const { wallet, isConnected } = walletContext;
  const { address } = wallet.value;
  const btcIcon = `<svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
  >
    <path
      fill="#ffa000"
      d="M14.24 10.56c-.31 1.24-2.24.61-2.84.44l.55-2.18c.62.18 2.61.44 2.29 1.74m-3.11 1.56l-.6 2.41c.74.19 3.03.92 3.37-.44c.36-1.42-2.03-1.79-2.77-1.97m10.57 2.3c-1.34 5.36-6.76 8.62-12.12 7.28S.963 14.94 2.3 9.58A9.996 9.996 0 0 1 14.42 2.3c5.35 1.34 8.61 6.76 7.28 12.12m-7.49-6.37l.45-1.8l-1.1-.25l-.44 1.73c-.29-.07-.58-.14-.88-.2l.44-1.77l-1.09-.26l-.45 1.79c-.24-.06-.48-.11-.7-.17l-1.51-.38l-.3 1.17s.82.19.8.2c.45.11.53.39.51.64l-1.23 4.93c-.05.14-.21.32-.5.27c.01.01-.8-.2-.8-.2L6.87 15l1.42.36c.27.07.53.14.79.2l-.46 1.82l1.1.28l.45-1.81c.3.08.59.15.87.23l-.45 1.79l1.1.28l.46-1.82c1.85.35 3.27.21 3.85-1.48c.5-1.35 0-2.15-1-2.66c.72-.19 1.26-.64 1.41-1.62c.2-1.33-.82-2.04-2.2-2.52"
    />
  </svg>`;

  const usdIcon =
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
    style="padding: 1px;" viewBox="0 0 32 32"><path fill="#0E9F6E" fill-rule="evenodd" d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16s-7.163 16-16 16m6.5-12.846c0-2.523-1.576-3.948-5.263-4.836v-4.44c1.14.234 2.231.725 3.298 1.496l1.359-2.196a9.49 9.49 0 0 0-4.56-1.776V6h-2.11v1.355c-3.032.234-5.093 1.963-5.093 4.486c0 2.64 1.649 3.925 5.19 4.813v4.58c-1.577-.234-2.886-.935-4.269-2.01L9.5 21.35a11.495 11.495 0 0 0 5.724 2.314V26h2.11v-2.313c3.08-.257 5.166-1.963 5.166-4.533m-7.18-5.327c-1.867-.537-2.327-1.168-2.327-2.15c0-1.027.8-1.845 2.328-1.962zm4.318 5.49c0 1.122-.873 1.893-2.401 2.01v-4.229c1.892.538 2.401 1.168 2.401 2.22z"/></svg>`;

  type FileType = File | null;

  const [file, setFile] = useState<FileType>(null);
  const [fee, setFee] = useState<number>(0);
  const [issuance, setIssuance] = useState("1");
  const [coinType, setCoinType] = useState<"BTC" | "USDT">("BTC");
  const [visible, setVisible] = useState<boolean>(false);
  const [txfee, setTxfee] = useState<number>(0.001285);
  const [mintfee, setMintfee] = useState<number>(0.00000);
  const [dust, setDust] = useState<number>(0.000113);
  const [total, setTotal] = useState<number>(0.001547);
  const [BTCPrice, setBTCPrice] = useState<number>(60000);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [isPoshStamp, setIsPoshStamp] = useState(false);
  const [stampName, setStampName] = useState("");
  const { fees, loading, fetchFees } = useFeePolling(300000); // 5 minutes

  useEffect(() => {
    if (fees && !loading) {
      const recommendedFee = Math.round(fees.recomendedFee);
      setFee(recommendedFee);
    }
  }, [fees, loading]);

  useEffect(() => {
    const coins = document.getElementsByClassName("coin");
    for (var i = 0; i < coins.length; i++) coins[i].innerHTML = btcIcon;
  }, []);

  useEffect(() => {
    fetchBTCPrice();
  }, []);

  useEffect(() => {
    // Set the checkbox to checked by default
    setIsLocked(true);
  }, []);

  const fetchBTCPrice = async () => {
    try {
      const response = await fetch(
        "/quicknode/getPrice",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "cg_simplePrice",
            params: ["bitcoin", "usd", true, true, true],
          }),
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { price } = await response.json();
      setBTCPrice(price);
    } catch (error) {
      console.error("Error fetching BTC price:", error);
      // You might want to set a default price or show an error message to the user
    }
  };

  const handleChangeFee = (newFee: number) => {
    setFee(newFee);
  };

  const handleChangeCoin = () => {
    const switchToggle = document.querySelector("#switch-toggle");
    const coins = document.getElementsByClassName("coin");
    if (!switchToggle) return;
    if (coinType === "USDT") {
      switchToggle.classList.add("translate-x-full");
      for (var i = 0; i < coins.length; i++) coins[i].innerHTML = btcIcon;
      setTimeout(() => {
        switchToggle.innerHTML = btcIcon;
      }, 150);
    } else {
      switchToggle.classList.remove("translate-x-full");
      for (var i = 0; i < coins.length; i++) coins[i].innerHTML = usdIcon;
      setTimeout(() => {
        switchToggle.innerHTML = usdIcon;
      }, 150);
    }
    if (coinType === "BTC") setCoinType("USDT");
    else setCoinType("BTC");
  };

  const toBase64 = (file: any) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(",")[1]; // Extract only the base64 part
        resolve(base64Data);
      };
      reader.onerror = reject;
    });

  const handleImage = (e: any) => {
    const selectedFile = e.target.files[0];
    if (selectedFile.size > 64 * 1024) { // Check if file size is greater than 64KB
      alert("File size must be less than 64KB.");
      return;
    }
    setFile(selectedFile);
    setFileSize(selectedFile.size);
    console.log(selectedFile);
  };

  const handleIssuanceChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    // Only allow positive integers
    if (/^\d*$/.test(value)) {
      setIssuance(value === "" ? "1" : value);
    }
  };

  const handleStampNameChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    if (/^[B-Zb-z][A-Za-z]{0,12}$/.test(value)) {
      setStampName(value);
    }
  };

  const handleMint = async () => {
    try {
      log("Starting minting process");

      if (!isConnected.value) {
        log("Wallet not connected");
        alert("Connect your wallet");
        return;
      }

      if (file === null) {
        log("No file selected");
        alert("Upload your file");
        return;
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
          service_fee: config.MINTING_SERVICE_FEE,
          service_fee_address: config.MINTING_SERVICE_FEE_ADDRESS,
        };

        // Add assetName to mintRequest if Posh Stamp is selected and a name is entered
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

        // Use txDetails to determine which inputs to sign
        const inputsToSign = txDetails.map((input) => ({
          address: walletContext.wallet.value.address,
          signingIndexes: [input.signingIndex],
        }));

        const result = await walletProvider.signPSBT(hex, inputsToSign);

        if (result === null) {
          log("User cancelled the transaction");
          alert("Transaction was cancelled by the user");
          return;
        }

        if (typeof result === "string") {
          if (result.startsWith("0x") || result.length === 64) {
            // This is likely a transaction ID, meaning the transaction was broadcast
            log("Transaction signed and broadcast successfully. TXID:", result);
            alert(
              `Transaction signed and broadcast successfully. TXID: ${result}`,
            );
          } else {
            // This is likely a signed PSBT
            log("Transaction signed successfully. Signed PSBT:", result);
            // Here you would add code to broadcast the signed PSBT
            alert(`Transaction signed successfully. Signed PSBT: ${result}`);
          }
        } else {
          log("Unexpected result from signPSBT:", result);
          alert(
            "Unexpected result from signing transaction. Please try again and check the console for more details.",
          );
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
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error stack:", error.stack);
      }

      log("Final error message", errorMessage);
      alert(`Minting failed: ${errorMessage}`);
    }
  };

  return (
    <div class={"flex flex-col w-full items-center gap-8"}>
      <p class={"text-[#5503A6] text-[43px] font-medium mt-6 w-full text-left"}>
        Mint Stamp (Olga)
      </p>

      <div>
        <div class="flex flex-col md:flex-row gap-8">
          <div
            id="image-preview"
            class="relative max-w-sm border border-[#F5F5F5] rounded-md items-center mx-auto text-center cursor-pointer w-[324px] h-[324px] content-center bg-[#2B0E49]"
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
                width={324}
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
                  class="w-20 h-20"
                  alt=""
                />
                <h5 class="text-[#F5F5F5] text-2xl font-semibold">
                  Upload Image
                </h5>
              </label>
            )}
          </div>

          <div class="max-w-sm p-6 mb-4 border border-[#F5F5F5] rounded-md items-center mx-auto text-center cursor-pointer w-[324px] h-[324px] content-center bg-[#2B0E49]">
            {file !== null && (
              <img
                width={350}
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
              <label class="cursor-pointer">
                <h5 class="text-[25px] font-semibold text-[#F5F5F5]">
                  Preview
                </h5>
                <span id="filename" class="text-gray-500 bg-gray-200 z-50">
                </span>
              </label>
            )}
          </div>
        </div>
      </div>

      <div class="w-full">
        <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
          Editions
        </p>
        <div class={"flex gap-[18px] w-full mb-3"}>
          <input
            type="text"
            value={issuance}
            onInput={handleIssuanceChange}
            class={"p-4 text-[#F5F5F5] text-[24px] font-semibold border border-[#B9B9B9] w-full bg-[#6E6E6E]"}
          />
          <div
            class={"w-[60px] flex items-center justify-center p-[14px] cursor-pointer bg-[#6E6E6E]"}
            onClick={() =>
              setIssuance((
                prev,
              ) => (parseInt(prev) > 1
                ? (parseInt(prev) - 1).toString()
                : "1")
              )}
          >
            <svg
              width="32"
              height="4"
              viewBox="0 0 32 4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="32" height="4" fill="#D9D9D9" />
            </svg>
          </div>
          <div
            class={"w-[60px] flex items-center justify-center p-[14px] cursor-pointer bg-[#6E6E6E]"}
            onClick={() =>
              setIssuance((prev) => (parseInt(prev) + 1).toString())}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect y="14" width="32" height="4" fill="#D9D9D9" />
              <rect
                x="14"
                y="32"
                width="32"
                height="4"
                transform="rotate(-90 14 32)"
                fill="#D9D9D9"
              />
            </svg>
          </div>
        </div>
        <div className="flex gap-7">
          <div className="flex gap-2 items-center">
            <input
              type="checkbox"
              id="lockEditions"
              name="lockEditions"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              className="w-5 h-5 bg-[#262424] border border-[#7F7979]"
            />
            <label
              htmlFor="lockEditions"
              className="text-[#B9B9B9] text-[16px] font-semibold"
            >
              Lock Editions
            </label>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="checkbox"
              id="poshStamp"
              name="poshStamp"
              checked={isPoshStamp}
              onChange={(e) => setIsPoshStamp(e.target.checked)}
              className="w-5 h-5 bg-[#262424] border border-[#7F7979]"
            />
            <label
              htmlFor="poshStamp"
              className="text-[#B9B9B9] text-[16px] font-semibold"
            >
              Posh Stamp
            </label>
          </div>
        </div>
        {isPoshStamp && (
          <div className="mt-3">
            <input
              type="text"
              value={stampName}
              onInput={handleStampNameChange}
              placeholder="Stamp Name (max 13 chars, can't start with A)"
              className="p-4 text-[#F5F5F5] text-[16px] font-semibold border border-[#B9B9B9] w-full bg-[#6E6E6E]"
              maxLength={13}
            />
          </div>
        )}
      </div>

      {/* FIXME: FINALIZE OPTIMIZATION ROUTINE */}
      {
        /* <div
        class={"bg-[#6E6E6E] w-full"}
      >
        <p class={"text-[#F5F5F5] text-[22px] font-semibold px-6 py-[15px]"}>
          Optimization
        </p>
        <hr />
        <div class="grid grid-cols-2 md:grid-cols-4 justify-between gap-4 py-6 px-6">
          <div class={"flex items-center"}>
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
          <div class={"flex items-center"}>
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
          <div class={"flex items-center"}>
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
          <div class={"flex items-center"}>
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

      <FeeEstimation
        fee={fee}
        handleChangeFee={handleChangeFee}
        type="stamp"
        fileType={file?.type}
        fileSize={fileSize}
        issuance={issuance}
        BTCPrice={BTCPrice}
        onRefresh={fetchFees}
      />

      <div
        class={"w-full text-white text-center font-bold border-[0.5px] border-[#8A8989] rounded-md mt-4 py-6 px-4 bg-[#5503A6] cursor-pointer"}
        onClick={handleMint}
      >
        Stamp Now
      </div>
    </div>
  );
}
