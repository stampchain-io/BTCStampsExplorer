import { useEffect, useState } from "preact/hooks";
import { walletContext } from "store/wallet/wallet.ts";
import axiod from "axiod";
import { useConfig } from "$/hooks/useConfig.ts";
import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";
import { useFeePolling } from "hooks/useFeePolling.tsx";
import { fetchBTCPrice } from "$lib/utils/btc.ts";
import { calculateJsonSize } from "$lib/utils/jsonUtils.ts";

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
  const [BTCPrice, setBTCPrice] = useState<number>(60000);
  const { fees, loading, fetchFees } = useFeePolling(300000); // 5 minutes
  const [jsonSize, setJsonSize] = useState<number>(0);
  const [amt, setAmt] = useState<string>(""); // Add this line

  const [tokenError, setTokenError] = useState<string>("");
  const [amtError, setAmtError] = useState<string>("");
  const [apiError, setApiError] = useState<string>("");

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

  const handleMint = async () => {
    if (!isConnected.value) {
      alert("Connect your wallet");
      return;
    }

    setApiError("");

    try {
      const response = await axiod.post(`${config.API_BASE_URL}/src20/create`, {
        toAddress: toAddress,
        changeAddress: address,
        op: "mint",
        tick: token,
        feeRate: fee,
        amt: amt,
        service_fee: config?.MINTING_SERVICE_FEE,
        service_fee_address: config?.MINTING_SERVICE_FEE_ADDRESS,
      });
      console.log(response);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setApiError(error.response.data.error);
      } else {
        setApiError("An unexpected error occurred");
      }
      console.error("Mint error:", error);
    }
  };

  useEffect(() => {
    const jsonData = {
      p: "src-20",
      op: "mint",
      tick: token,
      amt: amt,
    };

    const size = calculateJsonSize(jsonData);
    setJsonSize(size);
  }, [token, amt]); // Update dependency array

  return (
    <div class={"flex flex-col w-full items-center gap-8"}>
      <p class={"text-[#5503A6] text-[43px] font-medium mt-6 w-full text-left"}>
        MINT SRC-20
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
        {tokenError && <p class="text-red-500 mt-2">{tokenError}</p>}
      </div>

      <div class="w-full">
        <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
          Mint Amount
        </p>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
          placeholder="Number"
          value={amt}
          onChange={(e: Event) => setAmt((e.target as HTMLInputElement).value)}
        />
        {amtError && <p class="text-red-500 mt-2">{amtError}</p>}
      </div>

      {
        /* <div class="w-full">  // FIXME: Not yet implemented on backend, need to construct multiple transactions
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
        class={"w-full text-white text-center font-bold border-[0.5px] border-[#8A8989] rounded-md mt-4 py-6 px-4 bg-[#5503A6] cursor-pointer"}
        onClick={handleMint}
      >
        Stamp Now
      </div>
    </div>
  );
}
