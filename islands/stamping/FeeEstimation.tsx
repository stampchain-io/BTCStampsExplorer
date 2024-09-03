import { useEffect, useState } from "preact/hooks";
import { useFeePolling } from "hooks/useFeePolling.tsx";
import {
  calculateDust,
  calculateMiningFee,
} from "utils/minting/feeCalculations.ts";

export function FeeEstimation(
  { fee, handleChangeFee, type, fileType, fileSize, issuance, BTCPrice }: {
    fee: number;
    handleChangeFee: (fee: number) => void;
    type: string;
    fileType?: string;
    fileSize?: number;
    issuance?: number;
    BTCPrice: number;
  },
) {
  const { fees } = useFeePolling();
  console.log(fees);

  const [visible, setVisible] = useState(true);
  const [txfee, setTxfee] = useState(0.001285);
  const [mintfee, setMintfee] = useState(0.00000);
  const [dust, setDust] = useState(0.000333);
  const [total, setTotal] = useState(0.0);
  const [coinType, setCoinType] = useState("BTC");

  useEffect(() => {
    if (fileSize) {
      const newDust = calculateDust(fileSize) / 100000000; // Convert satoshis to BTC
      setDust(newDust);
    }
  }, [fileSize]);

  useEffect(() => {
    if (fileSize && fee) {
      console.log("[FeeEstimation] Recalculating fees", { fileSize, fee });
      const newTxfee = calculateMiningFee(fileSize, fee) / 100000000; // Convert sats to BTC
      setTxfee(newTxfee);

      const newTotal = newTxfee + mintfee + dust;
      setTotal(newTotal);
      console.log("[FeeEstimation] Updated fees", { newTxfee, newTotal });
    }
  }, [fee, fileSize, mintfee, dust]);

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

  useEffect(() => {
    const coins = document.getElementsByClassName("coin");
    if (coinType === "USDT") {
      for (let i = 0; i < coins.length; i++) coins[i].innerHTML = usdIcon;
    } else {
      for (let i = 0; i < coins.length; i++) coins[i].innerHTML = btcIcon;
    }
  }, [visible]);

  const handleChangeCoin = () => {
    const switchToggle = document.querySelector("#switch-toggle");
    const coins = document.getElementsByClassName("coin");
    if (!switchToggle) return;
    if (coinType === "USDT") {
      switchToggle.classList.add("translate-x-full");
      for (let i = 0; i < coins.length; i++) coins[i].innerHTML = btcIcon;
      setTimeout(() => {
        switchToggle.innerHTML = btcIcon;
      }, 150);
    } else {
      switchToggle.classList.remove("translate-x-full");
      for (let i = 0; i < coins.length; i++) coins[i].innerHTML = usdIcon;
      setTimeout(() => {
        switchToggle.innerHTML = usdIcon;
      }, 150);
    }
    if (coinType === "BTC") setCoinType("USDT");
    else setCoinType("BTC");
  };

  return (
    <>
      <div class={"w-full flex flex-col gap-2"}>
        <div class="flex justify-between">
          <span class={"text-[#F5F5F5]"}>
            EFFECTIVE FEE RATE: {fee} sat/vB
          </span>
          <span class={"text-[#F5F5F5] hidden md:block"}>
            RECOMMENDED: {fees && fees.recomendedFee} sat/vB
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
            min="1"
            max="264"
            step="1"
            onInput={(e) =>
              handleChangeFee(
                parseInt((e.target as HTMLInputElement).value, 10),
              )}
            class="accent-[#5E1BA1] w-full h-[6px] rounded-lg appearance-none cursor-pointer bg-[#3F2A4E]"
          />
        </div>
        <div class="justify-end flex md:hidden">
          <span class={"text-[#F5F5F5]"}>
            RECOMMENDED: {fees && fees.recomendedFee} sat/vB
          </span>
        </div>
      </div>
      <div class="bg-[#6E6E6E] text-[#F5F5F5] px-3 py-1 w-full">
        <div class="flex justify-between py-4 border-b border-[#8A8989]">
          <p className={"flex"}>
            Total Estimated - {coinType === "BTC"
              ? total.toFixed(6)
              : (total * BTCPrice).toFixed(2)}
            &nbsp;<span className={"coin"}></span>
          </p>
          <div className={"flex gap-1 items-center"}>
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
            <div
              onClick={() => setVisible(!visible)}
              className={"cursor-pointer"}
            >
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
        </div>
        {visible && (
          <>
            {type === "src20" && (
              <div class="flex justify-between border-b border-[#8A8989] py-4">
                <p>Sats per byte</p>
                <p>{fee}</p>
              </div>
            )}
            {(type === "stamp" || type === "src20-deploy") &&
              (
                <>
                  <div class="flex flex-col md:flex-row justify-between md:gap-8">
                    <div class="flex justify-between w-full border-b border-[#8A8989] py-4">
                      <p>File Type</p>
                      <p>{fileType}</p>
                    </div>
                    <div class="flex justify-between w-full border-b border-[#8A8989] py-4">
                      <p>File Size</p>
                      <p>{fileSize} bytes</p>
                    </div>
                  </div>
                  <div class="flex flex-col md:flex-row justify-between md:gap-8">
                    <div class="flex justify-between w-full border-b border-[#8A8989] py-4">
                      <p>Sats per byte</p>
                      <p>{fee}</p>
                    </div>
                    <div class="flex justify-between w-full border-b border-[#8A8989] py-4">
                      <p>Items to Mint</p>
                      <p>{issuance}</p>
                    </div>
                  </div>
                </>
              )}
            <div class="flex flex-col md:flex-row justify-between md:gap-8">
              <div class="flex justify-between border-b border-[#8A8989] w-full py-4">
                <p>Miner Fee</p>
                <p className={"flex gap-1 items-center"}>
                  {coinType === "BTC"
                    ? txfee.toFixed(8)
                    : (txfee * BTCPrice).toFixed(2)}
                  &nbsp;<span className={"coin"}></span>
                </p>
              </div>
              <div class="flex justify-between w-full border-b border-[#8A8989] py-4">
                <p>Minting Fee</p>
                <p className={"flex gap-1 items-center"}>
                  {coinType === "BTC"
                    ? mintfee.toFixed(6)
                    : (mintfee * BTCPrice).toFixed(2)}
                  &nbsp;<span className={"coin"}></span>
                </p>
              </div>
            </div>
            <div class="flex flex-col md:flex-row justify-between md:gap-8">
              <div class="flex justify-between border-b border-[#8A8989] md:border-none w-full py-4">
                <p>Multisig Dust</p>
                <p className={"flex gap-1 items-center"}>
                  {coinType === "BTC"
                    ? dust.toFixed(6)
                    : (dust * BTCPrice).toFixed(2)}
                  &nbsp;<span className={"coin"}></span>
                </p>
              </div>
              <div class="flex justify-between w-full py-4">
                <p>Total Estimated</p>
                <p className={"flex gap-1 items-center"}>
                  {coinType === "BTC"
                    ? total.toFixed(8)
                    : (total * BTCPrice).toFixed(2)}
                  &nbsp;<span className={"coin"}></span>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
