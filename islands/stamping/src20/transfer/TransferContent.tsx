import { useSRC20Form } from "$client/hooks/useSRC20Form.ts";

import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import { InputField } from "$islands/stamping/InputField.tsx";

export function TransferContent(
  { trxType = "olga" }: { trxType?: "olga" | "multisig" },
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
      <p class="purple-gradient1 text-3xl md:text-6xl font-black mt-6 w-full text-center">
        TRANSFER
      </p>

      <div className="flex flex-col gap-3 md:gap-6 dark-gradient p-3 md:p-6 w-full">
        <InputField
          type="text"
          placeholder="Recipient address"
          value={formState.toAddress}
          onChange={(e) => handleInputChange(e, "toAddress")}
          error={formState.toAddressError}
        />

        <div className="w-full flex flex-col md:flex-row gap-3 md:gap-6">
          <InputField
            type="text"
            placeholder="Token"
            value={formState.token}
            onChange={(e) => handleInputChange(e, "token")}
          />

          <InputField
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Amount"
            value={formState.amt}
            onChange={(e) => handleInputChange(e, "amt")}
          />
        </div>
      </div>

      <div className="dark-gradient p-3 md:p-6 w-full z-[10]">
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

        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
          walletError={walletError}
        />
      </div>
    </div>
  );
}
