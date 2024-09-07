import { useState } from "preact/hooks";
import { walletContext } from "store/wallet/wallet.ts";
import axiod from "axiod";
import { useConfig } from "$/hooks/useConfig.ts";
import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";

export function MintContent() {
  const { config, isLoading } = useConfig();

  if (isLoading) {
    return <div>Loading configuration...</div>;
  }

  if (!config) {
    return <div>Error: Failed to load configuration</div>;
  }

  const { wallet, isConnected } = walletContext;
  const { address } = wallet.value;

  const [toAddress, setToAddress] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [repeatMint, setRepeatMint] = useState<number>(1);
  const [fee, setFee] = useState<number>(780);

  const handleChangeFee = (newFee: number) => {
    setFee(newFee);
  };

  const handleMint = async () => {
    if (!isConnected.value) {
      alert("Connect your wallet");
      return;
    }

    try {
      const response = await axiod.post(`${config.API_BASE_URL}/src20/create`, {
        toAddress: toAddress,
        changeAddress: address,
        op: "mint",
        tick: token,
        feeRate: fee,
        amt: repeatMint,
      });
      console.log(response);
    } catch (error) {
      console.error("Mint error:", error);
    }
  };

  return (
    <div class={"flex flex-col w-full items-center gap-8"}>
      <p class={"text-[#5503A6] text-[43px] font-medium mt-6 w-full text-left"}>
        Mint SRC-20
      </p>

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

      {
        /* <div class="w-full">  Not yet implemented on backend
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
      </div> */
      }

      <FeeEstimation
        fee={fee}
        handleChangeFee={handleChangeFee}
        type="src20-mint"
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
