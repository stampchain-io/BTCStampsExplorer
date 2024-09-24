import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";
import { useSRC20Form } from "$islands/hooks/useSRC20Form.ts";

export function TransferContent(
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
  } = useSRC20Form("transfer", trxType);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!config) {
    return <div>Error: Failed to load configuration</div>;
  }

  const handleTransferSubmit = async () => {
    try {
      await handleSubmit();
    } catch (error) {
      console.error("Transfer error:", error);
    }
  };

  return (
    <div class="flex flex-col w-full items-center gap-8">
      <p class="text-[#5503A6] text-3xl md:text-6xl font-black mt-6 w-full text-center">
        TRANSFER
      </p>

      <div className="flex flex-col gap-6 bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-6 w-full">
        <div class="w-full">
          {
            /* <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
          Transfer To Address <span class="text-[#FF2D2D]">*</span>
        </p> */
          }
          <input
            type="text"
            class="p-4 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md"
            placeholder="Bitcoin Address"
            value={formState.toAddress}
            onChange={(e) => handleInputChange(e, "toAddress")}
          />
          {formState.toAddressError && (
            <p class="text-red-500 mt-2">{formState.toAddressError}</p>
          )}
        </div>

        <div className="w-full flex gap-6">
          <div class="w-full">
            {
              /* <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
          Token
        </p> */
            }
            <input
              type="text"
              class="p-4 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md"
              placeholder="Case Sensitive"
              value={formState.token}
              onChange={(e) => handleInputChange(e, "token")}
            />
          </div>

          <div class="w-full">
            {
              /* <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
          Amount
        </p> */
            }
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              class="p-4 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md"
              placeholder="Transfer Amount"
              value={formState.amt}
              onChange={(e) => handleInputChange(e, "amt")}
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-6 w-full">
        <FeeEstimation
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          type="src20-transfer"
          fileType="application/json"
          fileSize={formState.jsonSize}
          BTCPrice={formState.BTCPrice}
          onRefresh={fetchFees}
          isSubmitting={isSubmitting}
          onSubmit={handleTransferSubmit}
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
