import { useState } from "preact/hooks";
import { walletContext } from "store/wallet/wallet.ts";
import axiod from "https://deno.land/x/axiod/mod.ts";
import { useConfig } from "$/hooks/useConfig.ts";
import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";

export function MintContent() {
  const config = useConfig();

  if (!config) {
    console.error("Config not loaded");
    return null;
  }

  const { wallet, isConnected } = walletContext;
  const { address } = wallet.value;

  const [toAddress, setToAddress] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [repeatMint, setRepeatMint] = useState<number>(1);
  const [fee, setFee] = useState<any>(780);

  const handleChangeFee = (e: any) => {
    setFee(e.target.value);
  };

  const handleMint = async () => {
    if (!isConnected.value) {
      alert("Connect your wallet");
      return;
    }

    axiod
      .post(`${config.API_BASE_URL}/src20/create`, {
        toAddress: toAddress,
        changeAddress: address,
        op: "mint",
        tick: token,
        feeRate: fee,
        amt: repeatMint,
      })
      .then((response) => {
        console.log(response);
      })
      .catch((error) => console.log(error));
  };

  return (
    <div class={"flex flex-col w-full items-center gap-8"}>
      <p class={"text-[#5503A6] text-[43px] font-medium mt-6 w-full text-left"}>
        Mint Src20
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

      <div class="w-full">
        <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
          Repeat Mint
        </p>
        <input
          type="number"
          class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
          placeholder="Number"
          value={repeatMint}
          onChange={(e: any) => setRepeatMint(e.target.value)}
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

      <FeeEstimation fee={fee} type="src20" />

      <div
        class={"w-full text-white text-center font-bold border-[0.5px] border-[#8A8989] rounded-md mt-4 py-6 px-4 bg-[#5503A6] cursor-pointer"}
        onClick={handleMint}
      >
        Mint Now
      </div>
    </div>
  );
}
