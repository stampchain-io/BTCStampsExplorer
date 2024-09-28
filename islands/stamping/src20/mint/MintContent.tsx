import { FeeEstimation } from "../../FeeEstimation.tsx";
import { useSRC20Form } from "$islands/hooks/useSRC20Form.ts";

export function MintContent(
  { trxType = "multisig" }: { trxType?: "olga" | "multisig" },
) {
  const {
    formState,
    handleChangeFee,
    handleInputChange,
    handleSubmit,
    fetchFees,
    isLoading,
    config,
    isSubmitting,
    submissionMessage,
    walletError,
    apiError,
  } = useSRC20Form("mint", trxType);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!config) {
    return <div>Error: Failed to load configuration</div>;
  }

  const handleMintSubmit = async () => {
    try {
      await handleSubmit();
    } catch (error) {
      console.error("Minting error:", error);
    }
  };

  return (
    <div class="flex flex-col w-full items-center gap-8">
      <p class="bg-clip-text text-transparent bg-gradient-to-r from-[#440066] via-[#660099] to-[#8800CC] text-3xl md:text-6xl font-black mt-6 w-full text-center">
        MINT SRC-20
      </p>

      <div className="bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-6 flex flex-col gap-6 w-full">
        <div className="w-full flex flex-col md:flex-row gap-6">
          <div
            id="image-preview"
            class="relative rounded-md items-center justify-center mx-auto text-center cursor-pointer min-w-[120px] w-[120px] h-[120px] content-center bg-[#2B0E49] flex flex-col"
          >
            <img
              src="/img/mint/icon-image-upload.png"
              class="w-10 h-10"
              alt=""
            />
            <h5 class="text-[#F5F5F5] text-sm font-semibold">
              Upload Image
            </h5>
          </div>
          <div className="flex flex-col gap-6 w-full">
            <div class="w-full">
              <input
                type="text"
                class="p-4 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]"
                placeholder="Token"
                value={formState.token}
                onChange={(e) => handleInputChange(e, "token")}
              />
              {formState.tokenError && (
                <p class="text-red-500 mt-2">{formState.tokenError}</p>
              )}
            </div>

            <div class="w-full">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                class="p-4 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]"
                placeholder="Amount"
                value={formState.amt}
                onChange={(e) => handleInputChange(e, "amt")}
              />
              {formState.amtError && (
                <p class="text-red-500 mt-2">{formState.amtError}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-between text-[#999999] items-end">
          <div className="flex flex-col gap-1">
            <p className="text-base md:text-2xl font-light">
              PROGRESS <span className="font-bold">30.00%</span>
            </p>
            <div className="min-w-[260px] h-1 bg-[#999999] relative rounded-full">
              <div className="absolute left-0 top-0 w-[80px] h-1 bg-[#660099] rounded-full">
              </div>
            </div>
          </div>
          <div className="text-right text-xs md:text-base font-light">
            <p>
              SUPPLY <span className="font-bold">10.000.000.000</span>
            </p>
            <p>
              LIMIT <span className="font-bold">5.000.000</span>
            </p>
            <p>
              MINTERS <span className="font-bold">32</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-6 w-full">
        <FeeEstimation
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          type="src20-mint"
          fileType="application/json"
          fileSize={formState.jsonSize}
          BTCPrice={formState.BTCPrice}
          onRefresh={fetchFees}
          isSubmitting={isSubmitting}
          onSubmit={handleMintSubmit}
        />

        {apiError && (
          <div class="w-full text-red-500 text-center">
            {apiError}
          </div>
        )}

        {walletError && (
          <div class="w-full text-red-500 text-center">
            {walletError}
          </div>
        )}

        {submissionMessage && (
          <div class="w-full text-center font-bold">
            {submissionMessage}
          </div>
        )}
      </div>
    </div>
  );
}
