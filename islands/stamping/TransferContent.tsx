import { useEffect, useState } from "preact/hooks";
import { walletContext } from "store/wallet/wallet.ts";
import axiod from "https://deno.land/x/axiod/mod.ts";
import { useConfig } from "$/hooks/useConfig.ts";
import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";

export function TransferContent() {
  const config = useConfig();

  if (!config) {
    console.error("Config not loaded in transfercontent");
    return;
  }

  const { wallet, isConnected } = walletContext;
  const { address } = wallet.value;

  const [toAddress, setToAddress] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [fee, setFee] = useState<any>(780);

  const handleChangeFee = (e: any) => {
    setFee(e.target.value);
  };

  const handleTransfer = async () => {
    if (!isConnected.value) {
      alert("Connect your wallet");
      return;
    }

    axiod
      .post(`${config.API_BASE_URL}/src20/create`, {
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

      <FeeEstimation
        fee={fee}
        handleChangeFee={handleChangeFee}
        type="src20-transfer"
      />

      <div
        class={"w-full text-white text-center font-bold border-[0.5px] border-[#8A8989] rounded-md mt-4 py-6 px-4 bg-[#5503A6] cursor-pointer"}
        onClick={handleTransfer}
      >
        Stamp Now
      </div>
    </div>
  );
}
