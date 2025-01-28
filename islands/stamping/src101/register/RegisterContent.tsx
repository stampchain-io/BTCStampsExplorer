import { useEffect, useRef, useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import { ComplexFeeCalculator } from "$islands/fee/ComplexFeeCalculator.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import DetailModal from "$islands/stamping/src101/DetailModal.tsx";
import { ROOT_DOMAIN_TYPES, SRC101Balance } from "$globals";
import { useSRC101Form } from "$client/hooks/userSRC101Form.ts";
import { ROOT_DOMAINS } from "$lib/utils/constants.ts";

const bodyTools = "flex flex-col w-full items-center gap-3 mobileMd:gap-6";
const titlePurpleLDCenter =
  "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black purple-gradient3 w-full text-center";
const backgroundContainer =
  "flex flex-col dark-gradient rounded-lg p-3 mobileMd:p-6";
const buttonPurpleOutline =
  "inline-flex items-center justify-center border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-purple tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:text-stamp-purple-highlight transition-colors";
const animatedBorderPurple = `
  relative rounded-md !bg-[#100318] p-[2px]
  before:absolute before:inset-0 before:rounded-md before:z-[1]
  before:bg-[conic-gradient(from_var(--angle),#660099,#8800CC,#AA00FF,#8800CC,#660099)]
  before:[--angle:0deg] before:animate-rotate
  hover:before:bg-[conic-gradient(from_var(--angle),#AA00FF,#AA00FF,#AA00FF,#AA00FF,#AA00FF)]
  focus-within:before:bg-[conic-gradient(from_var(--angle),#AA00FF,#AA00FF,#AA00FF,#AA00FF,#AA00FF)]
  [&>*]:relative [&>*]:z-[2] [&>*]:rounded-md [&>*]:bg-[#100318]
`;
const tooltipButton =
  "absolute left-1/2 -translate-x-1/2 bg-[#000000BF] px-2 py-1 rounded-sm mb-1 bottom-full text-[10px] mobileLg:text-xs text-stamp-grey-light font-normal whitespace-nowrap transition-opacity duration-300";

interface RegisterBitnameContentProps {
  trxType?: "olga" | "multisig";
}

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

  const { wallet, isConnected } = walletContext;
  const [isExist, setIsExist] = useState(true);
  const [checkStatus, setCheckStatus] = useState(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [modalData, setModalData] = useState<SRC101Balance | null>(null);
  const [openTldDropdown, setOpenTldDropdown] = useState<boolean>(false);
  const [isSelectingTld, setIsSelectingTld] = useState(false);
  const tldDropdownRef = useRef<HTMLDivElement>(null);
  const [isTldTooltipVisible, setIsTldTooltipVisible] = useState(false);
  const [allowTldTooltip, setAllowTldTooltip] = useState(true);
  const tldTooltipTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tldDropdownRef.current &&
        !tldDropdownRef.current.contains(event.target as Node)
      ) {
        setOpenTldDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (tldTooltipTimeoutRef.current) {
        globalThis.clearTimeout(tldTooltipTimeoutRef.current);
      }
    };
  }, []);

  const handleTldSelect = (tld: ROOT_DOMAIN_TYPES) => {
    setOpenTldDropdown(false);
    setIsSelectingTld(true);
    handleInputChange(
      {
        target: { value: tld },
      },
      "root",
    );
    setIsSelectingTld(false);
  };

  const handleTldMouseEnter = () => {
    if (allowTldTooltip) {
      if (tldTooltipTimeoutRef.current) {
        globalThis.clearTimeout(tldTooltipTimeoutRef.current);
      }
      tldTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsTldTooltipVisible(true);
      }, 1500);
    }
  };

  const handleTldMouseLeave = () => {
    if (tldTooltipTimeoutRef.current) {
      globalThis.clearTimeout(tldTooltipTimeoutRef.current);
    }
    setIsTldTooltipVisible(false);
    setAllowTldTooltip(true);
  };

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

      <div className={`${backgroundContainer} w-full gap-3 mobileLg:gap-6`}>
        <div
          class={`${animatedBorderPurple} ${
            openTldDropdown && !isSelectingTld ? "input-open-right" : ""
          }`}
        >
          <div class="flex justify-between relative z-[2] !bg-[#100318] placeholder:!bg-[#100318] rounded-md">
            <input
              type="search"
              id="search-dropdown"
              class="h-[54px] mobileLg:h-[60px] w-full bg-transparent rounded-md pl-6 text-base mobileLg:text-lg font-medium text-stamp-grey-light placeholder:font-light placeholder:!text-stamp-grey !outline-none focus-visible:!outline-none focus:!bg-[#100318]"
              placeholder="bitname"
              required
              value={formState.toAddress || ""}
              onChange={(e) => handleInputChange(e, "toAddress")}
            />
            <div
              className="relative"
              ref={tldDropdownRef}
            >
              <button
                type="button"
                onClick={() => {
                  setOpenTldDropdown(!openTldDropdown);
                  setAllowTldTooltip(false);
                  setIsTldTooltipVisible(false);
                }}
                className="h-[54px] min-w-24 mobileLg:h-[60px] px-[18px] mobileLg:px-6 rounded-md bg-transparent text-base mobileLg:text-lg font-bold text-stamp-grey hover:text-stamp-grey-light tracking-[0.05em] focus-visible:!outline-none"
                onMouseEnter={handleTldMouseEnter}
                onMouseLeave={handleTldMouseLeave}
              >
                <div
                  className={`${tooltipButton} tracking-normal ${
                    isTldTooltipVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  SELECT TOP LEVEL DOMAIN
                </div>
                {formState.root}
              </button>
              {openTldDropdown && (
                <ul className="absolute top-[100%] right-[-2px] max-h-[134px] w-[88px] mobileLg:max-h-[162px] mobileLg:w-[96px] bg-[#100318] bg-opacity-70 backdrop-filter backdrop-blur-md border-2 border-t-0 border-stamp-purple-bright rounded-b-md z-[11] overflow-y-auto">
                  {ROOT_DOMAINS.map((tld) => (
                    <li
                      key={tld}
                      className="cursor-pointer py-1.5 mobileLg:py-1 px-5 mobileLg:px-[26px] text-sm mobileLg:text-base text-stamp-grey font-bold tracking-[0.05em] leading-none hover:bg-stamp-purple-bright/15 hover:text-stamp-grey-light transition-colors"
                      onClick={() => handleTldSelect(tld)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {tld}
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
                    formState.toAddress + formState.root
                  } is already registered`
                  : `${formState.toAddress + formState.root} is available`
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

      <div className={`${backgroundContainer} w-full`}>
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
          buttonName={isConnected ? "REGISTER" : "CONNECT WALLET"}
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
