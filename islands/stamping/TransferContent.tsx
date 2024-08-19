import { useEffect, useState } from "preact/hooks";
import { walletContext } from "store/wallet/wallet.ts";
import axiod from "https://deno.land/x/axiod/mod.ts";
import { fetch_quicknode } from "utils/quicknode.ts";

export function TransferContent() {
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

  const [toAddress, setToAddress] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [file, setFile] = useState<any>(null);
  const [fee, setFee] = useState<any>(780);
  const [inssuance, setInssuance] = useState(1);
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

  const handleMint = async () => {
    if (!isConnected.value) {
      alert("Connect your wallet");
      return;
    }

    axiod
      .post("https://stampchain.io/api/v2/src20/create", {
        fromAddress: address,
        toAddress: toAddress,
        op: "transfer",
        tick: token,
        feeRate: fee,
        amt: 100000,
      })
      .then((response) => {
        console.log(response);
      })
      .catch((error) => console.log(error));
  };

  return (
    <div class={"flex flex-col w-full items-center gap-8"}>
      <p class={"text-[#5503A6] text-[43px] font-medium mt-6 w-full text-left"}>
        Transfer Src20
      </p>

      <div class="w-full">
        <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
          Address <span class="text-[#FF2D2D]">*</span>
        </p>
        <input
          type="text"
          class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
          placeholder="Legacy (starts with 1) or Segwit (starts with bc1q)"
          value={toAddress}
          onChange={(e: any) => setToAddress(e.target.value)}
        />
      </div>

      <div class="w-full">
        <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
          Token
        </p>
        <input
          type="text"
          class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
          placeholder="Case Sensitive"
          value={token}
          onChange={(e: any) => setToken(e.target.value)}
        />
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

      <div class="bg-[#6E6E6E] text-[#F5F5F5] px-3 py-1 w-full">
        <div class="border-b border-[#8A8989] py-4">
          <p className={"flex"}>
            Total Estimated - {coinType === "BTC"
              ? total.toFixed(6)
              : (total * BTCPrice).toFixed(2)}
            &nbsp;<span className={"coin"}></span>
          </p>
        </div>
        <div class="flex justify-between border-b border-[#8A8989] py-4">
          <p>Sats per byte</p>
          <p>{(fee / 10.0).toFixed(2)}</p>
        </div>
        <div class="flex flex-col md:flex-row justify-between md:gap-8">
          <div class="flex justify-between w-full border-b border-[#8A8989] py-4">
            <p>Transaction Fee</p>
            <p className={"flex"}>
              {coinType === "BTC"
                ? txfee.toFixed(6)
                : (txfee * BTCPrice).toFixed(2)}
              &nbsp;<span className={"coin"}></span>
            </p>
          </div>
          <div class="flex justify-between w-full border-b border-[#8A8989] py-4">
            <p>Minting Fee</p>
            <p className={"flex"}>
              {coinType === "BTC"
                ? mintfee.toFixed(6)
                : (mintfee * BTCPrice).toFixed(2)}
              &nbsp;<span className={"coin"}></span>
            </p>
          </div>
        </div>
        <div class="flex flex-col md:flex-row justify-between md:gap-8">
          <div class="flex justify-between w-full border-b border-[#8A8989] md:border-none py-4">
            <p>Multisig Dust</p>
            <p className={"flex"}>
              {coinType === "BTC"
                ? dust.toFixed(6)
                : (dust * BTCPrice).toFixed(2)}
              &nbsp;<span className={"coin"}></span>
            </p>
          </div>
          <div class="flex justify-between w-full py-4">
            <p>Total Estimated</p>
            <p className={"flex"}>
              {coinType === "BTC"
                ? total.toFixed(6)
                : (total * BTCPrice).toFixed(2)}
              &nbsp;<span className={"coin"}></span>
            </p>
          </div>
        </div>
      </div>

      <div
        class={"w-full text-white text-center font-bold border-[0.5px] border-[#8A8989] rounded-md mt-4 py-6 px-4 bg-[#5503A6] cursor-pointer"}
        onClick={handleMint}
      >
        Mint Now
      </div>
    </div>
  );
}
