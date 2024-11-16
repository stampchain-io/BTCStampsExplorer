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

  export default function TransferToken() {
  const bodyCenterClassName =
    "flex flex-col gap-3 mobileMd:gap-6 items-center w-full"; 
  const titleCenterClassName =
    "text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient1 text-center mt-6 w-full";
  const inputFieldContainerClassName =
    "flex flex-col gap-3 mobileMd:gap-6 p-3 mobileMd:p-6 dark-gradient w-full";
  const inputField2colClassName =
    "flex flex-col mobileMd:flex-row gap-3 mobileMd:gap-6 w-full";
  const feeSelectorContainerClassName =
    "p-3 mobileMd:p-6 dark-gradient z-[10] w-full ";  

  return (
    <div className={bodyCenterClassName}>
      <h1 className={titleCenterClassName}>TRANSFER</h1>

      <div className={inputFieldContainerClassName}>
        <InputField
          type="text"
          placeholder="Recipient address"
          value={formState.toAddress}
          onChange={(e) => handleInputChange(e, "toAddress")}
          error={formState.toAddressError}
        />

        <div className={inputField2colClassName}>
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

      <div className={feeSelectorContainerClassName}>
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
          buttonName="TRANSFER"
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
