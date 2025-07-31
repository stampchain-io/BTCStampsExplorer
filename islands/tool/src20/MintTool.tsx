/* ===== SRC20 TOKEN MINTING COMPONENT ===== */
import { useSRC20Form } from "$client/hooks/useSRC20Form.ts";
import { walletContext } from "$client/wallet/wallet.ts";
import { SRC20InputField } from "$form";
import { Icon } from "$icon";
import {
  bodyTool,
  containerBackground,
  containerColForm,
  containerRowForm,
  glassmorphismLayer2,
  imagePreviewTool,
  loaderSkeletonFull,
  loaderSkeletonImage,
  loaderSkeletonLg,
  loaderSkeletonMd,
} from "$layout";
import { useTransactionConstructionService } from "$lib/hooks/useTransactionConstructionService.ts";
import { extractSRC20ErrorMessage } from "$lib/utils/bitcoin/src20/errorHandling.tsx";
import { logger } from "$lib/utils/logger.ts";
import { mapProgressiveFeeDetails } from "$lib/utils/performance/fees/fee-estimation-utils.ts";
import { StatusMessages } from "$notification";
import { FeeCalculatorBase } from "$section";
import { labelLg, labelSm, titleGreyLD, valueLg, valueSm } from "$text";
import axiod from "axiod";
import { useEffect, useRef, useState } from "preact/hooks";

/* ===== MAIN COMPONENT INTERFACE ===== */
interface SRC20MintToolProps {
  trxType?: "olga" | "multisig";
  tick?: string | undefined | null;
  mintStatus?: any | null | undefined; // Using any to accept both SRC20Balance and SRC20MintStatus
  holders?: number;
}

/* ===== MINT PROGRESS SUBCOMPONENT ===== */
interface MintProgressProps {
  progress: string;
  progressWidth: string;
  maxSupply: string;
  limit: string;
  minters: string;
}

const MintProgress = (
  { progress, progressWidth, maxSupply, limit, minters }: MintProgressProps,
) => {
  return (
    <div class="flex flex-col min-[480px]:flex-row
    min-[480px]:justify-between min-[480px]:items-end
    gap-3 min-[480px]:gap-0 mt-2 min-[480px]:mt-0">
      {/* Progress indicator */}
      <div class="flex flex-col w-full min-[480px]:w-[55%] gap-1.5">
        <h5 class={labelLg}>
          PROGRESS
          <span class={`${valueLg} pl-3`}>
            {progress.toString().match(/^-?\d+(?:\.\d{0,2})?/)?.[0]}
            <span class="font-light">
              %
            </span>
          </span>
        </h5>
        {/* Progress bar */}
        <div
          class={`relative w-full max-w-[420px] h-3 ${glassmorphismLayer2} rounded-full`}
        >
          <div
            class="absolute top-[1px] left-[1px] right-[1px] h-2 bg-stamp-grey rounded-full"
            style={{ width: progressWidth }}
          />
        </div>
      </div>

      {/* Supply and limit information */}
      <div
        class={`flex flex-col w-full items-start mt-2
        min-[480px]:w-[45%] min-[480px]:justify-end min-[480px]:items-end
        min-[480px]:-mb-1`}
      >
        <h5 class={labelSm}>
          SUPPLY <span class={`${valueSm} pl-1.5`}>{maxSupply}</span>
        </h5>
        <h5 class={labelSm}>
          LIMIT <span class={`${valueSm} pl-1.5`}>{limit}</span>
        </h5>
        <h5 class={labelSm}>
          MINTERS <span class={`${valueSm} pl-1.5`}>{minters}</span>
        </h5>
      </div>
    </div>
  );
};

/* ===== TOKEN SEARCH INTERFACE ===== */
interface SearchResult {
  tick: string;
  progress: number;
  total_minted: string;
  max_supply: number;
}

/* ===== MINT CONTENT COMPONENT IMPLEMENTATION ===== */
export function SRC20MintTool({
  trxType = "olga",
  tick,
  mintStatus: initialMintStatus,
  holders: initialHolders,
}: SRC20MintToolProps = { trxType: "olga" }) {
  /* ===== FORM HOOK AND STATE ===== */
  const {
    formState,
    handleChangeFee,
    handleInputChange,
    handleSubmit,
    config,
    isSubmitting,
    submissionMessage,
    apiError,
    setFormState,
    handleInputBlur,
  } = useSRC20Form("mint", trxType, tick ?? undefined);

  /* ===== LOCAL STATE ===== */
  const [mintStatus, setMintStatus] = useState<any>(initialMintStatus || null);
  const [holders, setHolders] = useState<number>(initialHolders || 0);
  const [error, setError] = useState<string | null>(null);
  const [tosAgreed, setTosAgreed] = useState(false);

  /* ===== WALLET CONTEXT ===== */
  const { isConnected, wallet } = walletContext;

  /* ===== SEARCH & DROPDOWN STATE ===== */
  const [searchTerm, setSearchTerm] = useState("");
  const [openDrop, setOpenDrop] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedTokenImage, setSelectedTokenImage] = useState<string | null>(
    null,
  );
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isSwitchingFields, setIsSwitchingFields] = useState(false);

  /* ===== REFS ===== */
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ===== TOKEN DATA RESET FUNCTION ===== */
  const resetTokenData = () => {
    setMintStatus(null);
    setHolders(0);
    setSelectedTokenImage(null);
    setFormState((prevState) => ({
      ...prevState,
      amt: "",
    }));
  };

  /* ===== URL PARAMETER HANDLING EFFECT ===== */
  useEffect(() => {
    if (tick) {
      setOpenDrop(false);
      setSearchTerm(tick);
      handleResultClick(tick).then(() => {
        setOpenDrop(false);
        setSearchResults([]);
      });
    }
  }, [tick]);

  /* ===== CUSTOM EVENT LISTENER FOR TRENDING TOKEN SELECTION ===== */
  useEffect(() => {
    const handleMintTokenSelected = (event: CustomEvent) => {
      const { tick: selectedTick } = event.detail;
      if (selectedTick) {
        setOpenDrop(false);
        setSearchTerm(selectedTick);
        handleResultClick(selectedTick).then(() => {
          setOpenDrop(false);
          setSearchResults([]);
        });
      }
    };

    globalThis.addEventListener(
      "mintTokenSelected",
      handleMintTokenSelected as EventListener,
    );

    return () => {
      globalThis.removeEventListener(
        "mintTokenSelected",
        handleMintTokenSelected as EventListener,
      );
    };
  }, []);

  /* ===== TOKEN SEARCH EFFECT ===== */
  useEffect(() => {
    if (isSelecting || tick || isSwitchingFields) {
      return;
    }

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setOpenDrop(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/v2/src20/search?q=${encodeURIComponent(searchTerm.trim())}`,
        );
        const data = await response.json();

        if (data.data && Array.isArray(data.data)) {
          setSearchResults(data.data);
          setOpenDrop(!isSelecting && !isSwitchingFields);
        }
      } catch (error) {
        logger.error("stamps", {
          message: "Search error",
          error,
          searchTerm,
        });
        setSearchResults([]);
        setOpenDrop(false);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [searchTerm, isSelecting, tick, isSwitchingFields]);

  /* ===== TOKEN SELECTION HANDLER ===== */
  const handleResultClick = async (tick: string) => {
    setOpenDrop(false);
    setIsSelecting(true);
    setIsSwitchingFields(true);
    setSearchResults([]);
    setSearchTerm(tick.toUpperCase());

    try {
      setIsImageLoading(true);
      setError(null);

      const response = await axiod.get(`/api/v2/src20/tick/${tick}/mintData`);
      const data = response.data;

      if (!data || data.error || !data.mintStatus) {
        setError("Token not deployed");
        resetTokenData();
      } else {
        setMintStatus(data.mintStatus);
        setHolders(data.holders || 0);
        setSelectedTokenImage(`/content/${data.mintStatus.tx_hash}.svg`);

        setFormState((prevState) => ({
          ...prevState,
          token: tick,
          amt: data.mintStatus.limit?.toString() || prevState.amt,
        }));
      }
    } catch (err) {
      logger.error("stamps", {
        message: "Error fetching token data",
        error: err,
        tick,
      });
      const errorMessage = extractSRC20ErrorMessage(err, "mint");
      setError(errorMessage);
      resetTokenData();
    } finally {
      setIsImageLoading(false);
    }
  };

  /* ===== EMPTY SEARCH TERM EFFECT ===== */
  useEffect(() => {
    if (!searchTerm) {
      setError(null);
      resetTokenData();
    }
  }, [searchTerm]);

  /* ===== MINT PROGRESS CALCULATIONS ===== */
  const progress = mintStatus ? mintStatus.progress : "0";
  const progressWidth = `${progress}%`;
  const maxSupply = mintStatus
    ? Number(mintStatus.max_supply).toLocaleString()
    : "0";
  const limit = mintStatus ? Number(mintStatus.limit).toLocaleString() : "0";
  const minters = holders ? holders.toString() : "0";

  /* ===== PROGRESSIVE FEE ESTIMATION INTEGRATION ===== */
  const {
    getBestEstimate,
    isEstimating,
    estimateExact,
    currentPhase,
    error: feeEstimationError,
    clearError,
  } = useTransactionConstructionService({
    toolType: "src20-mint", // Correct tool type for SRC-20 minting
    feeRate: isSubmitting ? 0 : formState.fee,
    walletAddress: wallet?.address || "", // Provide empty string instead of undefined
    isConnected: !!wallet && !isSubmitting,
    isSubmitting,
    // SRC-20 mint specific parameters
    op: "MINT",
    tick: formState.token,
    amt: formState.amt,
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

  // Wrapper function for minting that gets exact fees first - StampingTool pattern
  const handleMint = async () => {
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

      // Call the original form submission
      await handleSubmit();
    } catch (error) {
      logger.error("stamps", {
        message: "Error in SRC20 mint exact fee estimation",
        data: { error: error instanceof Error ? error.message : String(error) },
      });
      // Still proceed with submission even if exact fees fail
      await handleSubmit();
    }
  };

  /* ===== FEE DETAILS SYNCHRONIZATION ===== */
  useEffect(() => {
    if (progressiveFeeDetails && !isEstimating) {
      logger.debug("stamps", {
        message: "SRC20 MintTool progressive fee details update",
        data: {
          minerFee: progressiveFeeDetails.minerFee,
          dustValue: progressiveFeeDetails.dustValue,
          totalValue: progressiveFeeDetails.totalValue,
          hasExactFees: progressiveFeeDetails.hasExactFees,
          currentPhase,
        },
      });
    }
  }, [progressiveFeeDetails, isEstimating, currentPhase]);

  /* ===== CONFIG CHECK ===== */
  if (!config) {
    return (
      <div class={bodyTool}>
        <h1 class={`${titleGreyLD} mx-auto mb-4`}>MINT</h1>

        {/* Skeleton Form */}
        <div class={`${containerBackground} mb-6`}>
          <div class={`${containerRowForm} mb-5`}>
            {/* Token image preview skeleton */}
            <div class={loaderSkeletonImage}>
            </div>

            {/* Token inputs skeleton */}
            <div class={containerColForm}>
              {/* Token search field skeleton */}
              <div class={`h-10 ${loaderSkeletonLg}`}>
              </div>

              {/* Amount input skeleton */}
              <div class={`h-10 ${loaderSkeletonLg}`}>
              </div>
            </div>
          </div>

          {/* Mint progress skeleton */}
          <div class="flex flex-col min-[480px]:flex-row
          min-[480px]:justify-between min-[480px]:items-end
          gap-4 min-[480px]:gap-0 mt-2 min-[480px]:mt-0">
            {/* Progress indicator skeleton */}
            <div class="flex flex-col w-full min-[480px]:w-[55%] gap-2.5">
              <div class={`h-4 w-36 ${loaderSkeletonMd}`}>
              </div>
              {/* Progress bar skeleton */}
              <div
                class={`relative w-full max-w-[420px] h-3 ${loaderSkeletonFull}`}
              >
              </div>
            </div>

            {/* Supply and limit information skeleton */}
            <div class="flex flex-col w-full items-start mt-2 min-[480px]:w-[45%] min-[480px]:justify-end min-[480px]:items-end min-[480px]:-mb-1">
              <div class={`h-14 min-[480px]:h-[52px] w-24 ${loaderSkeletonMd}`}>
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton Fee Calculator */}
        <div class={containerBackground}>
          {/* Fee slider skeleton */}
          <div class="flex justify-between">
            <div class={`h-4 w-28 ${loaderSkeletonMd}`}>
            </div>
            {/* Toggle switch skeleton */}
            <div class={`w-10 h-5 ${loaderSkeletonFull}`}>
            </div>
          </div>
          <div class={`h-4 w-[168px] mt-1 ${loaderSkeletonMd}`}>
          </div>
          {/* Fee slider skeleton */}
          <div class={`h-3 w-[50%] mt-4 ${loaderSkeletonFull}`}>
          </div>

          {/* Estimate and fee details skeleton */}
          <div class={`h-5 w-full min-[480px]:w-72 mt-8 ${loaderSkeletonMd}`}>
          </div>
          <div class={`h-4 w-16 mt-4 ${loaderSkeletonMd}`}>
          </div>

          {/* Terms and Submit button skeleton */}
          <div class="flex justify-end pt-10">
            <div class="flex flex-col space-y-3 items-end">
              <div class={`h-4 w-[156px] tablet:w-56 ${loaderSkeletonMd}`}>
              </div>
              <div class={`h-10 tablet:h-9 w-[156px] ${loaderSkeletonMd}`}>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ===== COMPONENT RENDER ===== */
  return (
    <div class={bodyTool}>
      <h1 class={`${titleGreyLD} mx-auto mb-4`}>MINT</h1>

      {/* ===== ERROR MESSAGE DISPLAY ===== */}
      {error && (
        <div class="w-full text-red-500 text-center font-bold">
          {error}
        </div>
      )}

      <form
        class={`${containerBackground} mb-6`}
        onSubmit={(e) => {
          e.preventDefault();
          handleMint();
        }}
        aria-label="Mint SRC20 tokens"
        novalidate
      >
        {/* ===== TOKEN SEARCH AND AMOUNT INPUT ===== */}
        <div class={`${containerRowForm} mb-3`}>
          {/* Token image preview */}
          <div
            id="image-preview"
            class={imagePreviewTool}
          >
            {isImageLoading
              ? <div class={loaderSpinGrey} />
              : selectedTokenImage
              ? (
                <img
                  src={selectedTokenImage}
                  class="w-full h-full"
                  alt=""
                  loading="lazy"
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)}
                />
              )
              : (
                <Icon
                  type="icon"
                  name="uploadImage"
                  weight="extraLight"
                  size="xxl"
                  color="grey"
                />
              )}
          </div>

          {/* Token inputs */}
          <div class={containerColForm}>
            {/* Token search field with dropdown */}
            <div
              class={`relative ${
                openDrop && searchResults.length > 0 && !isSelecting
                  ? "input-open"
                  : ""
              }`}
              ref={dropdownRef}
            >
              <SRC20InputField
                type="text"
                placeholder="Token"
                value={searchTerm}
                onChange={(e) => {
                  const newValue = (e.target as HTMLInputElement).value
                    .toUpperCase();
                  if (newValue !== searchTerm) {
                    if (!isSelecting && !isSwitchingFields) {
                      setOpenDrop(true);
                    }
                    setIsSelecting(false);
                    setSearchTerm(newValue);
                  }
                }}
                onFocus={() => {
                  if (
                    !searchTerm.trim() && !isSwitchingFields && !isSelecting
                  ) {
                    setOpenDrop(true);
                  }
                  setIsSelecting(false);
                }}
                onBlur={() => {
                  setIsSwitchingFields(true);
                  setTimeout(() => {
                    setOpenDrop(false);
                    setIsSwitchingFields(false);
                    if (!searchTerm.trim()) {
                      setIsSelecting(false);
                    }
                  }, 150);
                }}
                error={formState.tokenError}
                isUppercase
              />

              {/* Search results dropdown */}
              {(() => {
                const shouldShow = openDrop && searchResults.length > 0 &&
                  !isSelecting;
                return shouldShow;
              })() && (
                <ul class="absolute top-[100%] left-0 max-h-[146px] w-full bg-[#252026]/90 border-b-[1px] backdrop-blur-xl border-stamp-grey-darker/20 rounded-b-lg text-stamp-grey-light text-sm leading-none font-bold z-[11]
                overflow-y-auto scrollbar-glassmorphism shadow-lg">
                  {searchResults.map((result: SearchResult) => (
                    <li
                      key={result.tick}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent input blur
                        handleResultClick(result.tick);
                      }}
                      class="flex justify-between py-2 px-3 hover:bg-stamp-grey-darker/50 hover:text-stamp-grey-light uppercase border-x-[1px] border-b-[1px] border-stamp-grey-darker/20 last:border-b-0 transition-colors duration-200 cursor-pointer"
                    >
                      <div class="font-medium text-sm">{result.tick}</div>
                      <div class="font-medium text-xs text-stamp-grey-darker mt-0.5">
                        {(result.progress || 0).toFixed(1)}% minted
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Amount input field */}
            <SRC20InputField
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Amount"
              value={formState.amt}
              onChange={(e) => handleInputChange(e, "amt")}
              onBlur={() => handleInputBlur("amt")}
              error={formState.amtError}
            />
          </div>
        </div>

        {/* ===== MINT PROGRESS DISPLAY ===== */}
        <MintProgress
          progress={progress}
          progressWidth={progressWidth}
          maxSupply={maxSupply}
          limit={limit}
          minters={minters}
        />
      </form>

      {/* ===== FEE CALCULATOR ===== */}
      <div class={containerBackground}>
        <FeeCalculatorBase
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          type="src20"
          fromPage="src20_mint"
          BTCPrice={formState.BTCPrice}
          mintDetails={{
            token: formState.token,
            amount: Number(formState.amt) || 0,
          }}
          feeDetails={mapProgressiveFeeDetails(
            exactFeeDetails || progressiveFeeDetails,
          )}
          isSubmitting={isSubmitting}
          onSubmit={handleMint}
          buttonName={isConnected ? "MINT" : "CONNECT WALLET"}
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
        />

        {/* Error Display */}
        {feeEstimationError && (
          <div className="mt-2 text-red-500 text-sm">
            Fee estimation error: {feeEstimationError}
            <button
              type="button"
              onClick={clearError}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* ===== STATUS MESSAGES ===== */}
        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
        />
      </div>
    </div>
  );
}
