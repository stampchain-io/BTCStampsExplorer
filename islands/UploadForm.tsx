import { useEffect, useState } from "preact/hooks";
import { walletContext } from "store/wallet/wallet.ts";
import axiod from "https://deno.land/x/axiod/mod.ts";

export function UploadForm() {
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
  const [inssuance, setInssuance] = useState(1);
  const [coinType, setCoinType] = useState("BTC");
  const [visible, setVisible] = useState(false);
  const [txfee, setTxfee] = useState(0.001285);
  const [mintfee, setMintfee] = useState(0.00015);
  const [dust, setDust] = useState(0.000113);
  const [total, setTotal] = useState(0.001547);
  const [BTCPrice, setBTCPrice] = useState(60000);

  useEffect(() => {
    const coins = document.getElementsByClassName("coin");
    for (var i = 0; i < coins.length; i++) coins[i].innerHTML = btcIcon;
  }, []);

  useEffect(() => {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const data = {
      jsonrpc: "2.0",
      id: 1,
      method: "cg_simplePrice",
      params: ["bitcoin", "usd", true, true, true],
    };
    axiod
      .post(
        "https://wider-winter-seed.btc.quiknode.pro/e19fdcea2a4d1af8238330fc4832c8d4cc32bdaf",
        data,
        config,
      )
      .then(function (response) {
        // handle success

        console.log(response.data.result.bitcoin.usd);

        setBTCPrice(parseFloat(response.data.result.bitcoin.usd));
      })
      .catch((err: any) => {
        // handle error
        console.log(err);
      });
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

  const getImageBlobFromUrl = async (url: any) => {
    const fetchedImageData = await fetch(url);
    const blob = await fetchedImageData.blob();
    return blob;
  };

  const handleImage = (e: any) => {
    setFile(e.target.files[0]);
    console.log(e.target.files[0]);
  };

  const removeImage = () => {
    setFile(null);
  };

  const copyImage = async () => {
    const blob = await getImageBlobFromUrl(URL.createObjectURL(file));
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
  };

  const handleDecrease = () => {
    if (inssuance === 1) return;
    setInssuance(inssuance - 1);
  };

  const handleIncrease = () => {
    setInssuance(inssuance + 1);
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
      .post("https://stampchain.io/api/v2/olga/mint", {
        sourceWallet: address,
        qty: inssuance,
        locked: true,
        filename: file.name,
        file: data,
        satsPerKB: fee,
        service_fee: null,
        service_fee_address: null,
      })
      .then((response) => {
        console.log(response);
      })
      .catch((error) => console.log(error));
  };

  return (
    <div class={"flex flex-col w-full items-center"}>
      <div class="flex px-4 pt-6 gap-8">
        <div
          id="image-preview"
          class="relative max-w-sm p-6 border-dashed border-2 border-gray-400 rounded-lg items-center mx-auto text-center cursor-pointer w-[384px] h-[384px] content-center bg-gray-800"
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
            <label for="upload" class="cursor-pointer h-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8 text-gray-200 mx-auto mb-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <h5 class="mb-2 text-xl font-bold tracking-tight text-gray-100">
                Drop file here
                <p class="font-normal text-sm text-gray-400 md:px-6">
                  or click to upload
                </p>
              </h5>
              <p class="font-normal text-sm text-gray-400 md:px-6">
                Max File Size: 65000 bytes
              </p>
              <span id="filename" class="text-gray-500 bg-gray-200 z-50"></span>
            </label>
          )}
        </div>
      </div>
      <div class="flex w-full justify-center gap-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          class={"cursor-pointer"}
          onClick={removeImage}
        >
          <path
            fill="#cc6d00"
            d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"
          />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          class={"cursor-pointer"}
          onClick={copyImage}
        >
          <g fill="none">
            <path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
            <path
              fill="#cc6d00"
              d="M19 2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2zm-4 6H5v12h10zm-5 7a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2zm9-11H9v2h6a2 2 0 0 1 2 2v8h2zm-7 7a1 1 0 0 1 .117 1.993L12 13H8a1 1 0 0 1-.117-1.993L8 11z"
            />
          </g>
        </svg>
      </div>
      <div
        class={"text-white font-bold rounded-md mt-4 py-2 px-4 bg-yellow-700 cursor-pointer"}
        onClick={handleMint}
      >
        Mint Stamp
      </div>
    </div>
  );
}
