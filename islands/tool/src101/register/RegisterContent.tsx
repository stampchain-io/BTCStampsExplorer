/* ===== SRC101 BITNAME REGISTRATION COMPONENT ===== */
import { useEffect, useRef, useState } from "preact/hooks";
import { walletContext } from "$client/wallet/wallet.ts";
import DetailSRC101Modal from "$islands/modal/DetailSRC101Modal.tsx";
import { ROOT_DOMAIN_TYPES, SRC101Balance } from "$globals";
import { useSRC101Form } from "$client/hooks/userSRC101Form.ts";
import { ROOT_DOMAINS } from "$lib/utils/constants.ts";
import { BasicFeeCalculator } from "$components/shared/fee/BasicFeeCalculator.tsx";
import { bodyTool, containerBackground } from "$layout";
import { titlePurpleLD } from "$text";
import { Button } from "$buttons";
import { inputFieldOutline, outlineGradient, purpleGradient } from "$forms";
import { StatusMessages, tooltipButton } from "$notifications";

/* ===== COMPONENT INTERFACE ===== */
interface RegisterBitnameContentProps {
  trxType?: "olga" | "multisig";
}

/* ===== MAIN COMPONENT IMPLEMENTATION ===== */
export function RegisterBitnameContent({
  trxType = "olga",
}: RegisterBitnameContentProps) {
  /* ===== FORM AND CONFIG HOOKS ===== */
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

  /* ===== STATE MANAGEMENT ===== */
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

  /* ===== CLICK OUTSIDE HANDLER ===== */
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

  /* ===== TOOLTIP CLEANUP ===== */
  useEffect(() => {
    return () => {
      if (tldTooltipTimeoutRef.current) {
        globalThis.clearTimeout(tldTooltipTimeoutRef.current);
      }
    };
  }, []);

  /* ===== TLD HANDLERS ===== */
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

  /* ===== TOOLTIP HANDLERS ===== */
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

  /* ===== CONFIG CHECK ===== */
  if (!config) {
    return <div>Error: Failed to load configuration</div>;
  }

  /* ===== MODAL HANDLERS ===== */
  const handleClose = () => {
    setIsOpen(false);
  };

  /* ===== SUBMISSION HANDLERS ===== */
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

  /* ===== AVAILABILITY CHECK ===== */
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

  /* ===== COMPONENT RENDER ===== */
  return (
    <div class={bodyTool}>
      <h1 class={`${titlePurpleLD} mobileMd:text-center mb-1`}>REGISTER</h1>

      <form
        class={`${containerBackground} gap-5`}
        onSubmit={(e) => {
          e.preventDefault();
          handleTransferSubmit();
        }}
        aria-label="Bitname registration form"
        novalidate
      >
        {/* Animated Input Container */}
        <div
          class={`${outlineGradient} ${purpleGradient} ${
            openTldDropdown && !isSelectingTld ? "input-open-right" : ""
          }`}
        >
          <div class="flex justify-between relative z-[2]">
            <input
              type="text"
              placeholder="bitname"
              id="search-dropdown"
              class={inputFieldOutline}
              required
              value={formState.toAddress || ""}
              onChange={(e) => handleInputChange(e, "toAddress")}
              autocomplete="off"
              autoCorrect="off"
              aria-label="Bitname input"
            />
            {/* TLD Dropdown Container */}
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
                className="h-12 min-w-20 mt-[1px] px-5 rounded-md bg-transparent font-bold text-base text-stamp-grey text-right hover:text-stamp-grey-light tracking-wider transition-colors duration-300 focus-visible:!outline-none"
                onMouseEnter={handleTldMouseEnter}
                onMouseLeave={handleTldMouseLeave}
                aria-label="Select top level domain"
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
                <ul className="absolute top-[100%] right-[-2px] max-h-[160px] w-[80px] bg-[#100318] bg-opacity-70 backdrop-filter backdrop-blur-md border-2 border-t-0 border-stamp-purple-bright rounded-b-md z-[11] overflow-y-auto">
                  {ROOT_DOMAINS.map((tld) => (
                    <li
                      key={tld}
                      className="py-2 last:pb-4 tablet:py-1.5 tablet:last:pb-3 pr-5 font-bold text-sm text-stamp-grey text-right tracking-wide leading-none hover:bg-stamp-purple-bright/15 hover:text-stamp-grey-light transition-colors duration-300 cursor-pointer"
                      onClick={() => handleTldSelect(tld)}
                      onMouseDown={(e) => e.preventDefault()}
                      role="option"
                      aria-selected={formState.root === tld}
                    >
                      {tld}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Status and Availability Check Section */}
        <div className="flex flex-row justify-between w-full">
          <div className="flex flex-col justify-center items-start">
            {/* message - default:noDisplay / display on user input & onClick - either already registered or available */}
            <h6 className="font-medium text-sm text-stamp-grey">
              {formState.toAddress && checkStatus
                ? isExist
                  ? `${
                    formState.toAddress.toLowerCase() + formState.root
                  } is already registered`
                  : `${
                    formState.toAddress.toLowerCase() + formState.root
                  } is available`
                : ""}
            </h6>
          </div>
          <div className="flex flex-col items-end">
            <Button
              type="button"
              variant="outline"
              color="purple"
              size="lg"
              onClick={checkAvailability}
              aria-label="Check bitname availability"
            >
              AVAILABILITY
            </Button>
          </div>
        </div>
      </form>

      {/* ===== FEE CALCULATOR AND STATUS MESSAGES ===== */}
      <div className={containerBackground}>
        <BasicFeeCalculator
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
          bitname={formState.toAddress + formState.root}
        />

        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
        />
      </div>

      {isOpen && modalData && (
        <DetailSRC101Modal
          handleClose={handleClose}
          name={modalData.tokenid_utf8}
          img={modalData.img}
          owner={modalData.owner}
        />
      )}
    </div>
  );
}

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
