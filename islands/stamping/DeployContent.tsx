import { useState } from "preact/hooks";
import { walletContext } from "store/wallet/wallet.ts";
import axiod from "https://deno.land/x/axiod/mod.ts";
import { useConfig } from "$/hooks/useConfig.ts";
import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";

export function DeployContent() {
  const config = useConfig();

  if (!config) {
    console.error("Config not loaded in deploycontent");
    return null;
  }

  const { wallet, isConnected } = walletContext;
  const { address } = wallet.value;

  const [toAddress, setToAddress] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [limitPerMint, setLimitPerMint] = useState<number>(0);
  const [maxCirculation, setMaxCirculation] = useState<number>(0);
  const [file, setFile] = useState<any>(null);
  const [fee, setFee] = useState<any>(780);

  const handleChangeFee = (e: any) => {
    setFee(e.target.value);
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
        toAddress: toAddress,
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

  return (
    <div class={"flex flex-col w-full items-center gap-8"}>
      <p class={"text-[#5503A6] text-[43px] font-medium mt-6 w-full text-left"}>
        Deploy Src20
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

      <div class="w-full">
        <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
          Artist / Creator Bitcoin Addres <span class="text-[#FF2D2D]">*</span>
        </p>
        <input
          type="text"
          class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
          placeholder="Legacy (starts with 1) or Segwit (starts with bc1q)"
          value={toAddress}
          onChange={(e: any) => setToAddress(e.target.value)}
        />
      </div>

      <div class="w-full flex flex-col md:flex-row gap-8 md:gap-5">
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
            Limit Per Mint
          </p>
          <input
            type="number"
            class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
            placeholder="Positive Integer"
            value={limitPerMint}
            onChange={(e: any) => setLimitPerMint(e.target.value)}
          />
        </div>
      </div>

      <div class="w-full">
        <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
          Max Circulation
        </p>
        <input
          type="number"
          class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
          placeholder="Positive Integer"
          value={maxCirculation}
          onChange={(e: any) => setMaxCirculation(e.target.value)}
        />
      </div>

      <FeeEstimation
        fee={fee}
        handleChangeFee={handleChangeFee}
        type="src20-deploy"
        fileType={file?.type}
        fileSize={file?.size}
        issuance={1}
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
