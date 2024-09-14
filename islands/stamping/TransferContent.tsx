import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";
import { useSRC20Form } from "$islands/hooks/useSRC20Form.ts";

export function TransferContent() {
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
  } = useSRC20Form("transfer");

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
          value={formState.toAddress}
          onChange={(e) => handleInputChange(e, "toAddress")}
        />
        {formState.toAddressError && (
          <p class="text-red-500 mt-2">{formState.toAddressError}</p>
        )}
      </div>

      <div class="w-full">
        <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
          Token
        </p>
        <input
          type="text"
          class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
          placeholder="Case Sensitive"
          value={formState.token}
          onChange={(e) => handleInputChange(e, "token")}
        />
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
          value={formState.amt}
          onChange={(e) => handleInputChange(e, "amt")}
        />
      </div>

      <FeeEstimation
        fee={formState.fee}
        handleChangeFee={handleChangeFee}
        type="src20-transfer"
        fileType="application/json"
        fileSize={formState.jsonSize}
        BTCPrice={formState.BTCPrice}
        onRefresh={fetchFees}
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

      <div
        class={`w-full text-white text-center font-bold border-[0.5px] border-[#8A8989] rounded-md mt-4 py-6 px-4 ${
          isSubmitting
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-[#5503A6] cursor-pointer"
        }`}
        onClick={isSubmitting ? undefined : handleTransferSubmit}
      >
        {isSubmitting ? "Stamping..." : "Stamp Now"}
      </div>
    </div>
  );
}
