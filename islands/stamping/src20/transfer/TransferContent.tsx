import { FeeEstimation } from "../../FeeEstimation.tsx";
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
          <input
            type="text"
            class="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]"
            placeholder="Recipient address"
            value={formState.toAddress}
            onChange={(e) => handleInputChange(e, "toAddress")}
          />
          {formState.toAddressError && (
            <p class="text-red-500 mt-2">{formState.toAddressError}</p>
          )}
        </div>

        <div className="w-full flex flex-col md:flex-row gap-6">
          <div class="w-full">
            <input
              type="text"
              class="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]"
              placeholder="Token"
              value={formState.token}
              onChange={(e) => handleInputChange(e, "token")}
            />
          </div>

          <div class="w-full">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              class="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]"
              placeholder="Amount"
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
          buttonName="Transfer"
        />

        {submissionMessage && (
          <div class="w-full text-center text-white mt-4">
            <p>{submissionMessage.message}</p>
            {submissionMessage.txid && (
              <div
                class="overflow-x-auto"
                style={{ maxWidth: "100%" }}
              >
                <span>TXID:&nbsp;</span>
                <a
                  href={`https://mempool.space/tx/${submissionMessage.txid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-500 underline whitespace-nowrap"
                >
                  {submissionMessage.txid}
                </a>
              </div>
            )}
          </div>
        )}

        {apiError && (
          <div class="w-full text-red-500 text-center mt-4">
            {apiError}
          </div>
        )}

        {walletError && (
          <div class="w-full text-red-500 text-center mt-4">
            {walletError}
          </div>
        )}
      </div>
    </div>
  );
}
