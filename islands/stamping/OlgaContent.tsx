import { useEffect, useState } from "preact/hooks";
import { walletContext } from "$lib/store/wallet/wallet.ts";
import axiod from "https://deno.land/x/axiod/mod.ts";
import { fetch_quicknode } from "utils/quicknode.ts";

import { frontendConfig } from "utils/frontendConfig.ts";

const API_BASE_URL = frontendConfig.API_BASE_URL;
const MINTING_SERVICE_FEE = frontendConfig.MINTING_SERVICE_FEE;
const MINTING_SERVICE_FEE_ADDRESS = frontendConfig.MINTING_SERVICE_FEE_ADDRESS;

export function OlgaContent() {
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

  const [file, setFile] = useState<any>(null);
  const [fee, setFee] = useState<any>(780);
  const [issuance, setIssuance] = useState(1);
  const [coinType, setCoinType] = useState("BTC");
  const [visible, setVisible] = useState(false);
  const [txfee, setTxfee] = useState(0.001285);
  const [mintfee, setMintfee] = useState(0.00000);
  const [dust, setDust] = useState(0.000113);
  const [total, setTotal] = useState(0.001547);
  const [BTCPrice, setBTCPrice] = useState(60000);

  useEffect(() => {
    const coins = document.getElementsByClassName("coin");
    for (var i = 0; i < coins.length; i++) coins[i].innerHTML = btcIcon;
  }, []);

  useEffect(() => {
    const func = async () => {
      const response = await fetch("/quicknode/getPrice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "cg_simplePrice",
          params: ["bitcoin", "usd", true, true, true],
        }),
      });
      const { price } = await response.json();
      setBTCPrice(price);
    };
    func();
  }, [coinType]);

  const handleChangeFee = (e: any) => {
    setFee(e.target.value);
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
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const handleImage = (e: any) => {
    const selectedFile = e.target.files[0];
    if (selectedFile.size > 64 * 1024) { // Check if file size is greater than 64KB
      alert("File size must be less than 64KB.");
      return;
    }
    setFile(selectedFile);
    console.log(selectedFile);
  };

  const handleDecrease = () => {
    if (issuance === 1) return;
    setIssuance(issuance - 1);
  };

  const handleIncrease = () => {
    setIssuance(issuance + 1);
  };

  const handleMint = async () => {
    if (!isConnected.value) {
      alert("Connect your wallet");
      return;
    }

    if (file === null) {
      alert("Upload your file");
      return;
    }

    const data = await toBase64(file);
    axiod
      .post(API_BASE_URL + "/olga/mint", {
        sourceWallet: address,
        qty: issuance,
        locked: true,
        filename: file.name,
        file: data,
        satsPerKB: fee,
        service_fee: MINTING_SERVICE_FEE,
        service_fee_address: MINTING_SERVICE_FEE_ADDRESS,
      })
      .then((response) => {
        console.log(response);
      })
      .catch((error) => console.log(error));
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
          Asset Issuance
        </p>
        <div class={"flex gap-[18px] w-full mb-3"}>
          <div
            class={"p-4 text-[#F5F5F5] text-[24px] font-semibold border border-[#B9B9B9] w-full bg-[#6E6E6E]"}
          >
            {issuance}
          </div>
          <div
            class={"w-[60px] flex items-center justify-center p-[14px] cursor-pointer bg-[#6E6E6E]"}
            onClick={() => handleDecrease()}
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
            onClick={() => handleIncrease()}
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
              id="assets"
              name="assets"
              className="w-5 h-5 bg-[#262424] border border-[#7F7979]"
            />
            <label
              for="assets"
              className="text-[#B9B9B9] text-[16px] font-semibold"
            >
              Lock assets
            </label>
          </div>
          <div className="flex gap-2 items-center">
            <input type="checkbox" id="burn" name="burn" className="w-5 h-5" />
            <label
              for="burn"
              className="text-[#B9B9B9] text-[16px] font-semibold"
            >
              Keyburn
            </label>
          </div>
        </div>
      </div>

      <div
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
      </div>

      <div class={"w-full flex flex-col gap-2"}>
        <div class="flex justify-between">
          <span class={"text-[#F5F5F5]"}>
            EFFECTIVE FEE RATE: {(fee / 10.0).toFixed(2)} sat/vB
          </span>
          <span class={"text-[#F5F5F5] hidden md:block"}>
            RECOMMENDED: 78 sat/vB
          </span>
        </div>
        <div class="relative">
          <label for="labels-range-input" class="sr-only">
            Labels range
          </label>
          <input
            id="labels-range-input"
            type="range"
            value={fee}
            min="88"
            max="2640"
            onInput={handleChangeFee}
            class="accent-[#5E1BA1] w-full h-[6px] rounded-lg appearance-none cursor-pointer bg-[#3F2A4E]"
          />
        </div>
        <div class="justify-end flex md:hidden">
          <span class={"text-[#F5F5F5]"}>
            RECOMMENDED: 78 sat/vB
          </span>
        </div>
      </div>

      {
        <div class={`${file === null ? "hidden" : ""}`}>
          <div class={"flex text-gray-200 w-[340px] justify-between py-4"}>
            <span>Total Estimated</span>
            <div
              class={"flex gap-1 items-center cursor-pointer"}
              onClick={() => setVisible(!visible)}
            >
              <span class={"flex"}>
                {coinType === "BTC"
                  ? total.toFixed(6)
                  : (total * BTCPrice).toFixed(2)}
                &nbsp;<span className={"coin"}></span>
              </span>
              {!visible
                ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    viewBox="0 0 24 24"
                  >
                    <g fill="none" fill-rule="evenodd">
                      <path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                      <path
                        fill="white"
                        d="M12.707 15.707a1 1 0 0 1-1.414 0L5.636 10.05A1 1 0 1 1 7.05 8.636l4.95 4.95l4.95-4.95a1 1 0 0 1 1.414 1.414z"
                      />
                    </g>
                  </svg>
                )
                : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    viewBox="0 0 24 24"
                  >
                    <g fill="none" fill-rule="evenodd">
                      <path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                      <path
                        fill="white"
                        d="M11.293 8.293a1 1 0 0 1 1.414 0l5.657 5.657a1 1 0 0 1-1.414 1.414L12 10.414l-4.95 4.95a1 1 0 0 1-1.414-1.414z"
                      />
                    </g>
                  </svg>
                )}
            </div>
          </div>

          <div
            style={{
              width: "350px",
              backgroundColor: "#111827",
              border: "solid 1px gray",
            }}
            class={`px-6 py-4 flex flex-col gap-4 text-gray-500 rounded-xl ${
              visible ? "" : "hidden"
            }`}
          >
            <div class={"flex justify-between"}>
              <span class={"text-[20px] text-white"}>Summary</span>
              <button
                class="w-12 h-6 rounded-full bg-gray-700 flex items-center transition duration-300 focus:outline-none shadow"
                onClick={handleChangeCoin}
              >
                <div
                  id="switch-toggle"
                  class="coin w-6 h-6 relative rounded-full transition duration-500 transform text-white translate-x-full"
                >
                </div>
              </button>
            </div>
            <div
              class={"flex justify-between pb-2"}
              style={{ borderBottom: "solid 1px gray" }}
            >
              <span>File Type</span>
              <span>{file?.type}</span>
            </div>
            <div
              class={"flex justify-between pb-2"}
              style={{ borderBottom: "solid 1px gray" }}
            >
              <span>File Size</span>
              <span>{file?.size} bytes</span>
            </div>
            <div
              class={"flex justify-between pb-2"}
              style={{ borderBottom: "solid 1px gray" }}
            >
              <span>Sats Per Byte</span>
              <span>{(fee / 10.0).toFixed(2)}</span>
            </div>
            <div
              class={"flex justify-between pb-2"}
              style={{ borderBottom: "solid 1px gray" }}
            >
              <span>Items to mint</span>
              <span>{issuance}</span>
            </div>
            <div
              class={"flex justify-between pb-2"}
              style={{ borderBottom: "solid 1px gray" }}
            >
              <span>Transaction Fee</span>
              <span class={"flex"}>
                {coinType === "BTC"
                  ? txfee.toFixed(6)
                  : (txfee * BTCPrice).toFixed(2)}
                &nbsp;<span className={"coin"}></span>
              </span>
            </div>
            <div
              class={"flex justify-between pb-2"}
              style={{ borderBottom: "solid 1px gray" }}
            >
              <span>Minting Fee</span>
              <span class={"flex"}>
                {coinType === "BTC"
                  ? mintfee.toFixed(6)
                  : (mintfee * BTCPrice).toFixed(2)}
                &nbsp;<span className={"coin"}></span>
              </span>
            </div>
            <div
              class={"flex justify-between pb-2"}
              style={{ borderBottom: "solid 1px gray" }}
            >
              <span>Multisig Dust</span>
              <span class={"flex"}>
                {coinType === "BTC"
                  ? dust.toFixed(6)
                  : (dust * BTCPrice).toFixed(2)}
                &nbsp;<span className={"coin"}></span>
              </span>
            </div>
            <div
              class={"flex justify-between pb-2"}
            >
              <span>Total estimated</span>
              <span class={"flex"}>
                {coinType === "BTC"
                  ? total.toFixed(6)
                  : (total * BTCPrice).toFixed(2)}
                &nbsp;<span className={"coin"}></span>
              </span>
            </div>
          </div>
        </div>
      }

      <div
        class={"w-full text-white text-center font-bold border-[0.5px] border-[#8A8989] rounded-md mt-4 py-6 px-4 bg-[#5503A6] cursor-pointer"}
        onClick={handleMint}
      >
        Mint Now
      </div>
    </div>
  );
}
