/* ===== SRC101 BITNAME REGISTRATION COMPONENT ===== */
import { Button } from "$button";
import { useSRC101Form } from "$client/hooks/userSRC101Form.ts";
import { walletContext } from "$client/wallet/wallet.ts";
import { ROOT_DOMAINS } from "$constants";
import {
  grey,
  inputFieldDropdown,
  inputFieldDropdownHover,
  inputFieldOutline,
  outlineGradient,
} from "$form";
import { ROOT_DOMAIN_TYPES, SRC101Balance } from "$globals";
import DetailSRC101Modal from "$islands/modal/DetailSRC101Modal.tsx";
import { openModal } from "$islands/modal/states.ts";
import {
  bodyTool,
  containerBackground,
  loaderSkeletonFull,
  loaderSkeletonLg,
  loaderSkeletonMd,
} from "$layout";
import { useTransactionConstructionService } from "$lib/hooks/useTransactionConstructionService.ts";
import { logger } from "$lib/utils/logger.ts";
import { mapProgressiveFeeDetails } from "$lib/utils/performance/fees/fee-estimation-utils.ts";
import { StatusMessages, tooltipButton } from "$notification";
import { FeeCalculatorBase } from "$section";
import { titleGreyLD } from "$text";
import { useEffect, useRef, useState } from "preact/hooks";

/* ===== COMPONENT INTERFACE ===== */
interface SRC101RegisterToolProps {
  trxType?: "olga" | "multisig";
}

/* ===== MAIN COMPONENT IMPLEMENTATION ===== */
export function SRC101RegisterTool({
  trxType = "olga",
}: SRC101RegisterToolProps) {
  /* ===== FORM AND CONFIG HOOKS ===== */
  const {
    formState,
    handleChangeFee,
    handleInputChange,
    handleSubmit,
    config,
    isSubmitting,
    submissionMessage,
    apiError,
  } = useSRC101Form("mint", trxType);

  /* ===== STATE MANAGEMENT ===== */
  const [tosAgreed, setTosAgreed] = useState<boolean>(false);
  const { isConnected, wallet } = walletContext;
  const [isExist, setIsExist] = useState(true);
  const [checkStatus, setCheckStatus] = useState(false);
  const [_modalData, setModalData] = useState<SRC101Balance | null>(null);
  const [openTldDropdown, setOpenTldDropdown] = useState<boolean>(false);
  const [isSelectingTld, setIsSelectingTld] = useState(false);
  const tldDropdownRef = useRef<HTMLDivElement>(null);
  const [isTldTooltipVisible, setIsTldTooltipVisible] = useState(false);
  const [allowTldTooltip, setAllowTldTooltip] = useState(true);
  const tldTooltipTimeoutRef = useRef<number | null>(null);

  /* ===== PROGRESSIVE FEE ESTIMATION ===== */
  const {
    getBestEstimate,
    estimateExact, // Phase 3: Exact estimation before registering
    error: feeEstimationError,
    clearError,
  } = useTransactionConstructionService({
    toolType: "src101-create",
    feeRate: isSubmitting ? 0 : formState.fee,
    walletAddress: wallet?.address || "", // Provide empty string instead of undefined
    isConnected: !!wallet && !isSubmitting,
    isSubmitting,
    // SRC-101 specific parameters
    bitname: formState.toAddress ? formState.toAddress + formState.root : "",
  });

  // Get the best available fee estimate
  const progressiveFeeDetails = getBestEstimate();

  // Local state for exact fee details (updated when Phase 3 completes) - StampingTool pattern
  const [exactFeeDetails, setExactFeeDetails] = useState<
    typeof progressiveFeeDetails | null
  >(null);

  // Reset exactFeeDetails when fee rate changes to allow slider updates - StampingTool pattern
  useEffect(() => {
    // Clear exact fee details when fee rate changes so slider updates work
    setExactFeeDetails(null);
  }, [formState.fee]);

  // Wrapper function for registering that gets exact fees first - StampingTool pattern
  const handleRegisterWithExactFees = async () => {
    try {
      // Get exact fees before final submission
      const exactFees = await estimateExact();
      if (exactFees) {
        // Calculate net spend amount (matches wallet display)
        const netSpendAmount = exactFees.totalValue || 0;
        setExactFeeDetails({
          ...exactFees,
          totalValue: netSpendAmount, // Matches wallet
        });
      }
      // Call the original register submission
      await handleSubmit();
    } catch (error) {
      logger.error("stamps", {
        message: "Error in SRC101 register exact fee estimation",
        data: { error: error instanceof Error ? error.message : String(error) },
      });
      // Still proceed with submission even if exact fees fail
      await handleSubmit();
    }
  };

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
      } as Event & { target: { value: string } },
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
    return (
      <div class={bodyTool}>
        <h1 class={`${titleGreyLD} mx-auto mb-4`}>REGISTER</h1>

        {/* Skeleton Form */}
        <div class={`${containerBackground} gap-5 mb-6`}>
          {/* Bitname input skeleton */}
          <div class={`h-11 ${loaderSkeletonLg}`}>
          </div>

          {/* Availability Check Section skeleton */}
          <div class="flex flex-row justify-end w-full">
            <div class="flex flex-col items-end">
              {/* Availability button skeleton */}
              <div class={`h-8 w-[118px] ${loaderSkeletonLg}`}>
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton Fee Calculator */}
        <div class={containerBackground}>
          {/* Fee slider skeleton */}
          <div class="flex justify-between">
            <div class={`mt-1 h-2.5 w-[160px] ${loaderSkeletonMd}`}>
            </div>
            {/* Toggle switch skeleton */}
            <div class={`w-10 h-5 ${loaderSkeletonFull}`}>
            </div>
          </div>
          <div class={`mt-0.5 h-[14px] w-[116px] ${loaderSkeletonMd}`}>
          </div>
          {/* Fee slider skeleton */}
          <div class={`mt-2.5 h-5 tablet:h-4 w-[85%] ${loaderSkeletonFull}`}>
          </div>

          {/* Estimate and fee details skeleton */}
          <div
            class={`mt-6 h-[18px] w-full min-[480px]:w-[256px] ${loaderSkeletonMd}`}
          >
          </div>
          <div class={`mt-2 h-3 w-[72px] ${loaderSkeletonMd}`}>
          </div>

          {/* Terms and Submit button skeleton */}
          <div class="flex justify-end pt-[42px] tablet:pt-[44px]">
            <div class="flex flex-col items-end">
              <div
                class={`h-4 tablet:h-3 w-[160px] tablet:w-[226px] ${loaderSkeletonMd}`}
              >
              </div>
              <div
                class={`mt-4 tablet:mt-5 h-9 tablet:h-8 w-[168px] tablet:w-[150px] ${loaderSkeletonLg}`}
              >
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ===== MODAL HANDLERS ===== */
  const handleOpenDetailModal = (data: SRC101Balance) => {
    const modalContent = (
      <DetailSRC101Modal
        img={data.img}
        name={data.tokenid_utf8}
        owner={data.owner}
      />
    );
    openModal(modalContent, "zoomInOut");
  };

  /* ===== SUBMISSION HANDLERS ===== */
  const handleTransferSubmit = async (): Promise<void> => {
    try {
      if (!formState.toAddress) return;
      const checkStatus = await checkAvailability();
      if (checkStatus) {
        await handleRegisterWithExactFees();
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
          handleOpenDetailModal(jsonData.data[0]);
          return false;
        } else {
          setIsExist(false);
          setModalData(null);
          return true;
        }
      }
      return false;
    } catch (_error: unknown) {
      return false;
    }
  };

  /* ===== COMPONENT RENDER ===== */
  return (
    <div class={bodyTool}>
      <h1 class={`${titleGreyLD} mx-auto mb-4`}>REGISTER</h1>

      <form
        class={`${containerBackground} gap-5 mb-6`}
        onSubmit={(e) => {
          e.preventDefault();
          handleTransferSubmit();
        }}
        aria-label="Bitname registration form"
        novalidate
      >
        {/* Animated Input Container */}
        <div
          class={`${outlineGradient} ${grey} ${
            openTldDropdown && !isSelectingTld ? "input-open-right" : ""
          }`}
        >
          <div class="flex justify-between relative z-[2]">
            <input
              type="text"
              placeholder="bitname"
              id="search-dropdown"
              class={`${inputFieldOutline}`}
              required
              value={formState.toAddress || ""}
              onChange={(e) => handleInputChange(e, "toAddress")}
              autocomplete="off"
              autoCorrect="off"
              aria-label="Bitname input"
            />
            {/* TLD Dropdown Container */}
            <div
              class="relative"
              ref={tldDropdownRef}
            >
              <button
                type="button"
                onClick={() => {
                  setOpenTldDropdown(!openTldDropdown);
                  setAllowTldTooltip(false);
                  setIsTldTooltipVisible(false);
                }}
                class="h-10 min-w-16 mt-[1px] px-4 rounded-lg bg-transparent font-semibold text-sm text-stamp-grey text-right hover:text-stamp-grey-light tracking-wider transition-all duration-50 focus-visible:!outline-none"
                onMouseEnter={handleTldMouseEnter}
                onMouseLeave={handleTldMouseLeave}
                aria-label="Select top level domain"
              >
                <div
                  class={`${tooltipButton} tracking-normal ${
                    isTldTooltipVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  SELECT TOP LEVEL DOMAIN
                </div>
                {formState.root}
              </button>
              {openTldDropdown && (
                <ul
                  class={`${inputFieldDropdown} !left-[1px] max-h-[73px] !w-[64px] !bg-gradient-to-b !from-[#252129] !to-[#252129]/50
                  `}
                >
                  {ROOT_DOMAINS.map((tld) => (
                    <li
                      key={tld}
                      class={`${inputFieldDropdownHover} !px-[14px] !text-xs !lowercase !justify-end`}
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
        <div class="flex flex-row justify-between w-full">
          <div class="flex flex-col justify-center items-start">
            {/* message - default:noDisplay / display on user input & onClick - either already registered or available */}
            <h6 class="font-medium text-sm text-stamp-grey">
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
          <div class="flex flex-col items-end">
            <Button
              type="button"
              variant="glassmorphism"
              color="grey"
              size="mdR"
              onClick={checkAvailability}
              aria-label="Check bitname availability"
            >
              AVAILABILITY
            </Button>
          </div>
        </div>
      </form>

      {/* ===== FEE CALCULATOR AND STATUS MESSAGES ===== */}
      <div class={containerBackground}>
        <FeeCalculatorBase
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          type="src101"
          fromPage="src101_bitname"
          fileType="application/json"
          fileSize={formState.jsonSize}
          BTCPrice={formState.BTCPrice}
          isSubmitting={isSubmitting}
          onSubmit={handleRegisterWithExactFees}
          buttonName={isConnected ? "REGISTER" : "CONNECT WALLET"}
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
          bitname={formState.toAddress + formState.root}
          feeDetails={mapProgressiveFeeDetails(
            exactFeeDetails || progressiveFeeDetails,
          )}
          // Progressive fee estimation props removed - not supported by FeeCalculatorBase
        />

        {/* ===== 🚨 FEE ESTIMATION ERROR HANDLING ===== */}
        {feeEstimationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-red-700 text-sm">
                Fee estimation error: {feeEstimationError}
              </span>
              <button
                type="button"
                onClick={clearError}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
        />
      </div>
    </div>
  );
}
