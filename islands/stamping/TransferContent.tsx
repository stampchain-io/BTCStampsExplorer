import { useEffect, useState } from "preact/hooks";
import { walletContext } from "store/wallet/wallet.ts";
import axiod from "axiod";
import { useConfig } from "$/hooks/useConfig.ts";
import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";
import { useFeePolling } from "hooks/useFeePolling.tsx";
import { fetchBTCPrice } from "$lib/utils/btc.ts";

export function TransferContent() {
  const { config, isLoading } = useConfig();

  if (isLoading) {
    return <div>Loading configuration...</div>;
  }

  if (!config) {
    return <div>Error: Failed to load configuration</div>;
  }

  const [toAddress, setToAddress] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [fee, setFee] = useState<number>(780);
  const [BTCPrice, setBTCPrice] = useState<number>(60000);

  const { wallet, isConnected } = walletContext;
  const { address } = wallet.value;

  const { fees, loading, fetchFees } = useFeePolling(300000); // 5 minutes

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

  const handleChangeFee = (newFee: number) => {
    setFee(newFee);
  };

  const handleTransfer = async () => {
    if (!isConnected.value) {
      alert("Connect your wallet");
      return;
    }

    try {
      const response = await axiod.post(`${config.API_BASE_URL}/src20/create`, {
        fromAddress: address,
        toAddress: toAddress,
        op: "transfer",
        tick: token,
        feeRate: fee,
        amt: 100000,
      });
      console.log(response);
    } catch (error) {
      console.error("Transfer error:", error);
    }
  };

  return (
    <div class="flex flex-col w-full items-center gap-8">
      <p class="text-[#5503A6] text-[43px] font-medium mt-6 w-full text-left">
        TRANSFER SRC-20
      </p>

      <div class="w-full">
        <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
          Transfer To Address <span class="text-[#FF2D2D]">*</span>
        </p>
        <input
          type="text"
          class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
          placeholder="Bitcoin Address"
          value={toAddress}
          onInput={(e: Event) =>
            setToAddress((e.target as HTMLInputElement).value)}
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
          onInput={(e: Event) => setToken((e.target as HTMLInputElement).value)}
        />
      </div>

      <FeeEstimation
        fee={fee}
        handleChangeFee={handleChangeFee}
        type="src20-transfer"
        BTCPrice={BTCPrice}
        onRefresh={fetchFees}
        recommendedFee={fees?.recommendedFee}
      />

      <div
        class="w-full text-white text-center font-bold border-[0.5px] border-[#8A8989] rounded-md mt-4 py-6 px-4 bg-[#5503A6] cursor-pointer"
        onClick={handleTransfer}
      >
        Stamp Now
      </div>
    </div>
  );
}
