import { useEffect, useState } from "preact/hooks";
import { walletContext } from "store/wallet/wallet.ts";
import axiod from "axiod";
import { useConfig } from "$/hooks/useConfig.ts";
import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";
import { useFeePolling } from "hooks/useFeePolling.tsx";
import { fetchBTCPrice } from "$lib/utils/btc.ts";
import { calculateJsonSize } from "$lib/utils/jsonUtils.ts";

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
  const [amt, setAmt] = useState<string>(""); // New state for amount
  const [fee, setFee] = useState<number>(780);
  const [BTCPrice, setBTCPrice] = useState<number>(60000);
  const [jsonSize, setJsonSize] = useState<number>(0);

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

    setApiError("");

    try {
      const response = await axiod.post(`${config.API_BASE_URL}/src20/create`, {
        fromAddress: address,
        toAddress: toAddress,
        op: "transfer",
        tick: token,
        feeRate: fee,
        amt: amt,
      });
      console.log(response);
      // Handle successful response here
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setApiError(error.response.data.error);
      } else {
        setApiError("An unexpected error occurred");
      }
      console.error("Transfer error:", error);
    }
  };

  useEffect(() => {
    const jsonData = {
      p: "src-20",
      op: "transfer",
      tick: token,
      amt: amt, // Use the amt state here
    };

    const size = calculateJsonSize(jsonData);
    setJsonSize(size);
  }, [token, amt]); // Add amt to the dependency array

  const [toAddressError, setToAddressError] = useState<string>("");
  const [tokenError, setTokenError] = useState<string>("");
  const [amtError, setAmtError] = useState<string>("");
  const [apiError, setApiError] = useState<string>("");

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
        {toAddressError && <p class="text-red-500 mt-2">{toAddressError}</p>}
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
        {tokenError && <p class="text-red-500 mt-2">{tokenError}</p>}
      </div>

      <div class="w-full">
        <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
          Amount
        </p>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
          placeholder="Transfer Amount"
          value={amt}
          onInput={(e: Event) => setAmt((e.target as HTMLInputElement).value)}
        />
        {amtError && <p class="text-red-500 mt-2">{amtError}</p>}
      </div>

      <FeeEstimation
        fee={fee}
        handleChangeFee={handleChangeFee}
        type="src20-transfer"
        fileType="application/json"
        fileSize={jsonSize}
        BTCPrice={BTCPrice}
        onRefresh={fetchFees}
      />

      {apiError && (
        <div class="w-full text-red-500 text-center">
          {apiError}
        </div>
      )}

      <div
        class="w-full text-white text-center font-bold border-[0.5px] border-[#8A8989] rounded-md mt-4 py-6 px-4 bg-[#5503A6] cursor-pointer"
        onClick={handleTransfer}
      >
        Stamp Now
      </div>
    </div>
  );
}
