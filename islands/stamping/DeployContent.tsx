import { useEffect, useState } from "preact/hooks";
import { walletContext } from "store/wallet/wallet.ts";
import axiod from "axiod";
import { useConfig } from "$/hooks/useConfig.ts";
import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";
import { useFeePolling } from "hooks/useFeePolling.tsx";
import { fetchBTCPrice } from "$lib/utils/btc.ts";

export function DeployContent() {
  const { config, isLoading } = useConfig();

  if (isLoading) {
    return <div>Loading configuration...</div>;
  }

  if (!config) {
    return <div>Error: Failed to load configuration</div>;
  }

  const { wallet, isConnected } = walletContext;
  const { address } = wallet.value;

  const [token, setToken] = useState<string>("");
  const [limitPerMint, setLimitPerMint] = useState<string>("");
  const [maxCirculation, setMaxCirculation] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fee, setFee] = useState<number>(780);

  const [BTCPrice, setBTCPrice] = useState<number>(60000);
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

  const handleTokenChange = (e: Event) => {
    const input = (e.target as HTMLInputElement).value.toUpperCase();
    setToken(input.slice(0, 5));
  };

  const handleIntegerInput = (
    value: string,
    setter: (value: string) => void,
    isMaxCirculation: boolean = false,
  ) => {
    // Remove any non-digit characters
    const sanitizedValue = value.replace(/\D/g, "");

    // Check if the value is within uint64 range
    if (sanitizedValue === "") {
      setter("");
      setError("");
    } else {
      const bigIntValue = BigInt(sanitizedValue);
      const maxUint64 = BigInt("18446744073709551615"); // 2^64 - 1
      if (bigIntValue <= maxUint64) {
        setter(sanitizedValue);

        // Additional check for max circulation
        if (isMaxCirculation) {
          const limitPerMintValue = BigInt(limitPerMint || "0");
          if (bigIntValue <= limitPerMintValue) {
            setError("Max Circulation must be greater than Limit Per Mint");
          } else {
            setError("");
          }
        }
      } else {
        setter(maxUint64.toString());
      }
    }
  };

  const handleChangeFee = (newFee: number) => {
    setFee(newFee);
  };

  const handleImage = (e: any) => {
    const file = e.target.files[0];
    const validTypes = ["image/gif", "image/jpeg", "image/png"];
    const img = new Image();

    img.onerror = () => {
      alert("Invalid image file.");
    };

    img.onload = () => {
      if (img.width === 420 && img.height === 420) {
        setFile(file);
        console.log(file);
      } else {
        alert("Image must be 420x420 pixels.");
      }
    };

    if (validTypes.includes(file.type)) {
      img.src = URL.createObjectURL(file);
    } else {
      alert("File type must be GIF, JPG, or PNG.");
    }
  };

  const handleDeploy = async () => {
    if (!isConnected.value) {
      alert("Connect your wallet");
      return;
    }

    axiod
      .post(`${config.API_BASE_URL}/src20/create`, {
        toAddress: address,
        changeAddress: address,
        op: "deploy",
        tick: token,
        feeRate: fee,
        max: maxCirculation,
        lim: limitPerMint,
        dec: 18,
      })
      .then((response) => {
        console.log(response);
      })
      .catch((error) => console.log(error));
  };

  const [error, setError] = useState<string>("");

  return (
    <div class={"flex flex-col w-full items-center gap-8"}>
      <p class={"text-[#5503A6] text-[43px] font-medium mt-6 w-full text-left"}>
        Deploy SRC-20
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
        </div>
      </div>

      <div class="w-full flex flex-col md:flex-row gap-8 md:gap-5">
        <div class="w-full">
          <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
            Token
          </p>
          <input
            type="text"
            class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
            placeholder="Max 5 Chars"
            value={token}
            onChange={handleTokenChange}
            maxLength={5}
          />
        </div>
        <div class="w-full">
          <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
            Limit Per Mint
          </p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
            placeholder="Positive Integer (max uint64)"
            value={limitPerMint}
            onChange={(e: Event) =>
              handleIntegerInput(
                (e.target as HTMLInputElement).value,
                setLimitPerMint,
              )}
          />
        </div>
      </div>

      <div class="w-full">
        <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
          Max Circulation
        </p>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
          placeholder="Positive Integer (max uint64)"
          value={maxCirculation}
          onChange={(e: Event) =>
            handleIntegerInput(
              (e.target as HTMLInputElement).value,
              setMaxCirculation,
              true,
            )}
        />
        {error && <p class="text-red-500 mt-2">{error}</p>}
      </div>

      <FeeEstimation
        fee={fee}
        handleChangeFee={handleChangeFee}
        type="src20-deploy"
        fileType={file?.type}
        fileSize={file?.size}
        issuance={1}
        BTCPrice={BTCPrice}
        onRefresh={fetchFees}
      />

      <div
        class={"w-full text-white text-center font-bold border-[0.5px] border-[#8A8989] rounded-md mt-4 py-6 px-4 bg-[#5503A6] cursor-pointer"}
        onClick={handleDeploy}
      >
        Stamp Now
      </div>
    </div>
  );
}
