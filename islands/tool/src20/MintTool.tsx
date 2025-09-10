/* ===== SRC20 TOKEN MINTING COMPONENT ===== */
import { useSRC20Form } from "$client/hooks/useSRC20Form.ts";
import { walletContext } from "$client/wallet/wallet.ts";
import { ProgressiveEstimationIndicator } from "$components/indicators/ProgressiveEstimationIndicator.tsx";
import {
  inputFieldDropdown,
  inputFieldDropdownHover,
  SRC20InputField,
} from "$form";
import { Icon } from "$icon";
import { MintToolSkeleton } from "$indicators";
import {
  bodyTool,
  containerBackground,
  containerColForm,
  containerRowForm,
  glassmorphismL2,
  imagePreviewTool,
  loaderSpinGrey,
} from "$layout";
import { useTransactionConstructionService } from "$lib/hooks/useTransactionConstructionService.ts";
import { extractSRC20ErrorMessage } from "$lib/utils/bitcoin/src20/errorHandling.tsx";
import { logger } from "$lib/utils/logger.ts";
import { mapProgressiveFeeDetails } from "$lib/utils/performance/fees/fee-estimation-utils.ts";
import { getSRC20ImageSrc } from "$lib/utils/ui/media/imageUtils.ts";
import { StatusMessages } from "$notification";
import { FeeCalculatorBase } from "$section";
import { labelLg, labelSm, titleGreyLD, valueLg, valueSm } from "$text";
import type { MintProgressProps } from "$types/ui.d.ts";
import axiod from "axiod";
import { useEffect, useRef, useState } from "preact/hooks";

/* ===== MAIN COMPONENT INTERFACE ===== */

/* ===== MINT PROGRESS SUBCOMPONENT ===== */

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
            {progress?.toString().match(/^-?\d+(?:\.\d{0,2})?/)?.[0] ?? "0"}
            <span class="font-light">
              %
            </span>
          </span>
        </h5>
        {/* Progress bar */}
        <div
          class={`relative w-full max-w-[420px] h-3 ${glassmorphismL2} rounded-full`}
        >
          <div
            class="absolute top-[1px] left-[1px] right-[1px] h-2 bg-stamp-grey rounded-full"
            style={{ width: progressWidth }}
          />
        </div>
      </div>

      {/* Supply and limit information */}
      <div
        class={`flex flex-col w-full items-start mt-2 -mb-1
        min-[480px]:w-[45%] min-[480px]:justify-end min-[480px]:items-end`}
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

interface SRC20MintToolProps {
  trxType?: string;
  tick?: string;
  mintStatus?: any;
  holders?: any;
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
  } = useSRC20Form(
    "mint",
    trxType as "olga" | "multisig" | undefined,
    tick ?? undefined,
  );

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
        // Use centralized image URL logic
        const imageUrl = getSRC20ImageSrc({
          ...data.mintStatus,
          deploy_tx: data.mintStatus.tx_hash,
        } as any);
        setSelectedTokenImage(imageUrl);

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
  const progressWidth = `${isNaN(Number(progress)) ? 0 : Number(progress)}%`;
  const maxSupply = Number(mintStatus?.max_supply ?? 0);
  const limit = Number(mintStatus?.limit ?? 0);
  const minters = holders ? holders.toString() : "0";

  /* ===== PROGRESSIVE FEE ESTIMATION INTEGRATION ===== */
  const {
    getBestEstimate,
    isEstimating,
    isPreFetching,
    estimateExact,
    // Phase-specific results for UI indicators
    phase1,
    phase2,
    phase3,
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
        <MintToolSkeleton />
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
                  name="previewImage"
                  weight="extraLight"
                  size="xl"
                  color="custom"
                  className="stroke-[#242424]/80"
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
                <ul class={`${inputFieldDropdown} max-h-[148px]`}>
                  {searchResults.map((result: SearchResult) => (
                    <li
                      key={result.tick}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent input blur
                        handleResultClick(result.tick);
                      }}
                      class={`${inputFieldDropdownHover}`}
                    >
                      <div class="pt-[1px]">
                        {result.tick}
                      </div>
                      <div class="text-xs text-stamp-grey">
                        {(result.progress || 0).toFixed(1)}%
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
          current={Math.floor((Number(progress) * maxSupply) / 100)}
          total={maxSupply}
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
          progressIndicator={
            <ProgressiveEstimationIndicator
              isConnected={!!wallet && !isSubmitting}
              isSubmitting={isSubmitting}
              isPreFetching={isPreFetching}
              currentPhase={currentPhase}
              phase1={!!phase1}
              phase2={!!phase2}
              phase3={!!phase3}
              feeEstimationError={feeEstimationError}
              clearError={clearError}
            />
          }
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
