import { useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";

import { ComplexFeeCalculator } from "$islands/fee/ComplexFeeCalculator.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import { InputField } from "$islands/stamping/InputField.tsx";
import DetailModal from "$islands/stamping/src101/DetailModal.tsx";
import { ROOT_DOMAIN_TYPES, SRC101Balance } from "$globals";
import { useSRC101Form } from "$client/hooks/userSRC101Form.ts";
import { SelectField } from "$islands/stamping/SelectField.tsx";
import { ROOT_DOMAINS } from "$lib/utils/constants.ts";

// CSS Class Constants
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

// Props and State Types
interface RegisterBitnameContentProps {
  trxType?: "olga" | "multisig";
}

// Main Component
export function RegisterBitnameContent({
  trxType = "olga",
}: RegisterBitnameContentProps) {
  const {
    formState,
    handleChangeFee,
    handleInputChange,
    handleSubmit,
    fetchFees,
    config,
    isSubmitting,
    submissionMessage,
    apiError,
  } = useSRC101Form("mint", trxType);

  const [tosAgreed, setTosAgreed] = useState<boolean>(false);
  const { wallet } = walletContext;
  const [isExist, setIsExist] = useState(true);
  const [checkStatus, setCheckStatus] = useState(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [modalData, setModalData] = useState<SRC101Balance | null>(null);

  if (!config) {
    return <div>Error: Failed to load configuration</div>;
  }

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleTransferSubmit = async (): Promise<void> => {
    try {
      if (!formState.toAddress) return;
      const checkStatus = await checkAvailability();
      if (checkStatus) {
        await handleSubmit();
      }
    } catch (error) {
      console.error("Transfer error:", (error as Error).message);
    }
  };

  const checkAvailability = async (): Promise<boolean> => {
    setCheckStatus(false);
    try {
      const url =
        `/api/v2/src101/77fb147b72a551cf1e2f0b37dccf9982a1c25623a7fe8b4d5efaac566cf63fed/${
          btoa((formState.toAddress + formState.root)?.toLowerCase())
        }`;
      const res = await fetch(url);
      const jsonData = await res.json();
      setCheckStatus(true);
      if (res.status === 200) {
        if (jsonData?.data.length) {
          setIsExist(true);
          setIsOpen(true);
          // setModalData(jsonData.data[0]);
          return false;
        } else {
          setIsExist(false);
          setIsOpen(false);
          setModalData(null);
          return true;
        }
      }
      return false;
    } catch (error: unknown) {
      return false;
    }
  };

  return (
    <div className={bodyTools}>
      <h1 className={titlePurpleLDCenter}>REGISTER</h1>

      <div className={inputFieldContainer}>
        <div class={animatedInputContainer}>
          <div class="flex justify-between relative z-[2] !bg-[#100318] placeholder:!bg-[#100318] rounded-md">
            <input
              type="search"
              id="search-dropdown"
              class="h-[54px] mobileLg:h-[60px] w-full bg-transparent rounded-md pl-6 text-base mobileLg:text-lg font-bold text-stamp-grey-light placeholder:!text-stamp-grey placeholder:lowercase !outline-none focus-visible:!outline-none focus:!bg-[#100318]"
              placeholder="Please input your bitname"
              required
              value={formState.toAddress || ""}
              onChange={(e) => handleInputChange(e, "toAddress")}
            />
            <select
              className="h-[54px] max-w-32 mobileLg:h-[60px] px-3 rounded-md bg-transparent text-stamp-grey-light placeholder:lowercase text-base focus-visible:!outline-none appearance-none"
              onChange={(e) =>
                handleInputChange(
                  {
                    target: {
                      value: e.currentTarget.value,
                    },
                  },
                  "root",
                )}
              value={formState.root}
            >
              {ROOT_DOMAINS.map((item: ROOT_DOMAIN_TYPES) => (
                <option
                  key={item}
                  value={item}
                  class="bg-[#100318]"
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

          {
            /* <div className={animatedInputContainer}>
            <InputField
              type="text"
              placeholder="Please input your bitname"
              value={formState.toAddress?.replace(".btc", "") || ""}
              onChange={(e) => {
                const value = (e.target as HTMLInputElement).value.toLowerCase()
                  .replace(
                    ".btc",
                    "",
                  );
                handleInputChange(
                  {
                    target: {
                      value: value ? `${value}.btc` : "",
                    },
                  },
                  "toAddress",
                );
              }}
              error={formState.toAddressError}
              class="relative z-[2] h-[54px] mobileLg:h-[60px] w-full !bg-[#100318] rounded-md pl-6 text-base mobileLg:text-lg font-bold text-stamp-grey-light placeholder:!bg-[#100318] placeholder:!text-stamp-grey placeholder:lowercase outline-none focus:!bg-[#100318]"
            />
          </div>
          <span class="absolute z-[3] right-6 top-1/2 -translate-y-1/2 text-base mobileLg:text-lg font-black text-stamp-purple pointer-events-none">
            .btc
          </span> */
          }
        </div>
        <div className="flex flex-row justify-between w-full">
          <div className="flex flex-col justify-center items-start">
            {/* message - default:noDisplay / display on user input & onClick - either already registered or available */}
            <p className="text-sm mobileLg:text-base font-medium text-[#999999]">
              {formState.toAddress && checkStatus
                ? isExist
                  ? `${
                    formState.toAddress.toLowerCase() + formState.root
                  } is already registered`
                  : `${
                    formState.toAddress.toLowerCase() + formState.root
                  } is available`
                : ""}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <button
              type="button"
              className={buttonPurpleOutline}
              onClick={checkAvailability}
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
          bitname={formState.toAddress + formState.root}
        />

        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
        />
      </div>

      {isOpen && modalData && (
        <DetailModal
          handleClose={handleClose}
          name={modalData.tokenid_utf8}
          img={modalData.img}
          owner={modalData.owner}
        />
      )}
    </div>
  );
}
