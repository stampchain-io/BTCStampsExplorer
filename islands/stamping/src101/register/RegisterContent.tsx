import { useSRC20Form } from "$client/hooks/useSRC20Form.ts";
import { useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";

import { ComplexFeeCalculator } from "$islands/fee/ComplexFeeCalculator.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import { InputField } from "$islands/stamping/InputField.tsx";

const bodyTools = "flex flex-col w-full items-center gap-3 mobileMd:gap-6";
const titlePurpleLDCenter =
  "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black purple-gradient3 w-full text-center";
const inputFieldContainer =
  "flex flex-col gap-3 mobileMd:gap-6 p-3 mobileMd:p-6 dark-gradient rounded-lg w-full";
const feeSelectorContainer = "p-3 mobileMd:p-6 dark-gradient rounded-lg w-full";
const buttonPurpleOutline =
  "inline-flex items-center justify-center border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-purple tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:text-stamp-purple-highlight transition-colors";
const animatedInputContainer = `
  relative rounded-md !bg-[#100318]
  before:absolute before:inset-[-2px] before:rounded-md before:z-[1]
  before:bg-[conic-gradient(from_var(--angle),#660099,#8800CC,#AA00FF,#8800CC,#660099)]
  before:[--angle:0deg] before:animate-rotate
  hover:before:bg-[conic-gradient(from_var(--angle),#AA00FF,#AA00FF,#AA00FF,#AA00FF,#AA00FF)]
  focus-within:before:bg-[conic-gradient(from_var(--angle),#AA00FF,#AA00FF,#AA00FF,#AA00FF,#AA00FF)]
`;

export function RegisterBitnameContent(
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
  } = useSRC20Form("mint", trxType);

  const [tosAgreed, setTosAgreed] = useState(false);
  const { wallet } = walletContext;

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
    <div className={bodyTools}>
      <h1 className={titlePurpleLDCenter}>REGISTER</h1>

      <div className={inputFieldContainer}>
        <div class="relative w-full">
          <div className={animatedInputContainer}>
            <InputField
              type="text"
              placeholder="wannabe"
              value={formState.toAddress?.replace(".btc", "") || ""}
              onChange={(e) => {
                const value = e.target.value.replace(".btc", "");
                handleInputChange({
                  target: {
                    value: value ? `${value}.btc` : "",
                  },
                }, "toAddress");
              }}
              error={formState.toAddressError}
              class="relative z-[2] h-[54px] mobileLg:h-[60px] w-full !bg-[#100318] rounded-md pl-6 text-base mobileLg:text-lg font-bold text-stamp-grey-light placeholder:!bg-[#100318] placeholder:!text-stamp-grey  placeholder:lowercase outline-none focus:!bg-[#100318]"
            />
          </div>
          <span class="absolute z-[3] right-6 top-1/2 -translate-y-1/2 text-base mobileLg:text-lg font-black text-stamp-purple pointer-events-none">
            .btc
          </span>
        </div>

        <div className="flex flex-row justify-between w-full">
          <div className="flex flex-col justify-center items-start">
            {/* message - default:noDisplay / display on user input & onClick - either already registered or available */}
            <p className="text-sm mobileLg:text-base font-medium text-[#999999]">
              userinput.btc is already registered
            </p>
          </div>
          <div className="flex flex-col items-end">
            <button
              type="submit"
              className={buttonPurpleOutline}
            >
              AVAILABILITY
            </button>
          </div>
        </div>
      </div>

      <div className={feeSelectorContainer}>
        <ComplexFeeCalculator
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          type="src101"
          fileType="application/json"
          fileSize={formState.jsonSize}
          BTCPrice={formState.BTCPrice}
          onRefresh={fetchFees}
          isSubmitting={isSubmitting}
          onSubmit={handleTransferSubmit}
          buttonName="REGISTER"
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
          userAddress={wallet?.address}
          utxoAncestors={formState.utxoAncestors}
          inputType={trxType === "olga" ? "P2WSH" : "P2SH"}
          outputTypes={trxType === "olga" ? ["P2WSH"] : ["P2SH", "P2WSH"]}
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
