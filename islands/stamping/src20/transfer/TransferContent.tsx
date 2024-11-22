import { useSRC20Form } from "$client/hooks/useSRC20Form.ts";
import { useState } from "preact/hooks";

import { walletContext } from "$client/wallet/wallet.ts";

import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import { InputField } from "$islands/stamping/InputField.tsx";

import { logger } from "$lib/utils/logger.ts";

const titlePurpleLDCenterClassName =
  "text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient3 w-full text-center";
const bodyToolsClassName =
  "flex flex-col w-full items-center gap-3 mobileMd:gap-6";

const inputFieldContainerClassName =
  "flex flex-col gap-3 mobileMd:gap-6 p-3 mobileMd:p-6 dark-gradient w-full";
const inputField2colClassName =
  "flex flex-col mobileMd:flex-row gap-3 mobileMd:gap-6 w-full";
const feeSelectorContainerClassName =
  "p-3 mobileMd:p-6 dark-gradient z-[10] w-full";

export function TransferContent(
  { trxType = "olga" }: { trxType?: "olga" | "multisig" } = { trxType: "olga" },
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

  const [tosAgreed, setTosAgreed] = useState(false);

  const { wallet, isConnected } = walletContext;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!config) {
    return <div>Error: Failed to load configuration</div>;
  }

  const handleTransferSubmit = async () => {
    if (!isConnected) {
      logger.debug("stamps", {
        message: "Showing wallet connect modal - user not connected",
      });
      walletContext.showConnectModal();
      return;
    }

    try {
      await handleSubmit();
    } catch (error) {
      console.error("Transfer error:", error);
    }
  };

  return (
    <div className={bodyToolsClassName}>
      <h1 className={titlePurpleLDCenterClassName}>TRANSFER</h1>

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
          buttonName={isConnected ? "TRANSFER" : "CONNECT WALLET"}
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
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
