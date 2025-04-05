/* ===== SRC20 TOKEN MINTING COMPONENT ===== */
import axiod from "axiod";
import { useEffect, useRef, useState } from "preact/hooks";
import { useSRC20Form } from "$client/hooks/useSRC20Form.ts";
import { walletContext } from "$client/wallet/wallet.ts";
import { BasicFeeCalculator } from "$components/shared/fee/BasicFeeCalculator.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import { logger } from "$lib/utils/logger.ts";
import { SRC20MintStatus } from "$types/src20.d.ts";
import {
  bodyTool,
  containerBackground,
  containerColForm,
  containerRowForm,
} from "$layout";
import { SRC20InputField } from "$forms";
import { labelSm, labelXl, titlePurpleLD, valueSm, valueXl } from "$text";
import { Icon } from "$icons";

/* ===== MAIN COMPONENT INTERFACE ===== */
interface MintContentProps {
  trxType?: "olga" | "multisig";
  tick?: string | undefined | null;
  mintStatus?: SRC20MintStatus | null | undefined;
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
    <div class="flex justify-between items-end">
      {/* Progress indicator */}
      <div class=" flex flex-col w-1/2 gap-1.5">
        <h5 class={labelXl}>
          PROGRESS
          <span class={`${valueXl} pl-3`}>
            {progress.toString().match(/^-?\d+(?:\.\d{0,2})?/)?.[0]}
            %
          </span>
        </h5>
        {/* Progress bar */}
        <div class="relative w-full max-w-[420px] h-1.5 bg-stamp-grey rounded-full">
          <div
            class="absolute left-0 top-0 h-1.5 bg-stamp-purple-dark rounded-full"
            style={{ width: progressWidth }}
          />
        </div>
      </div>

      {/* Supply and limit information */}
      <div class="flex flex-col w-1/2 justify-end items-end -mb-1">
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
export function MintContent({
  trxType = "olga",
  tick,
  mintStatus: initialMintStatus,
  holders: initialHolders,
}: MintContentProps = { trxType: "olga" }) {
  /* ===== FORM HOOK AND STATE ===== */
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

  /* ===== TOKEN SEARCH STATE ===== */
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

  /* ===== TOKEN SEARCH EFFECT ===== */
  useEffect(() => {
    if (isSelecting || tick || isSwitchingFields) {
      return;
    }

    // Don't show results if field is empty and not focused
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
      setError("Error fetching token data");
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

  /* ===== DEBUG LOGGING EFFECT ===== */
  useEffect(() => {
    logger.debug("stamps", {
      message: "MintContent formState updated",
      data: {
        fee: formState.fee,
        psbtFees: formState.psbtFees,
        hasFeesData: !!formState.psbtFees,
      },
    });
  }, [formState.fee, formState.psbtFees]);

  /* ===== CONFIG CHECK ===== */
  if (!config) {
    return <div>Error: Failed to load configuration</div>;
  }

  /* ===== FEE CALCULATOR PREPARATION ===== */
  const feeDetailsForCalculator = {
    minerFee: formState.psbtFees?.estMinerFee || 0,
    dustValue: formState.psbtFees?.totalDustValue || 0,
    hasExactFees: true,
    totalValue: formState.psbtFees?.totalValue || 0,
    estimatedSize: formState.psbtFees?.est_tx_size || 0,
  };

  logger.debug("stamps", {
    message: "Fee details for calculator",
    data: {
      psbtFees: formState.psbtFees,
      calculatorInput: feeDetailsForCalculator,
      formState: {
        fee: formState.fee,
        BTCPrice: formState.BTCPrice,
      },
    },
  });

  /* ===== COMPONENT RENDER ===== */
  return (
    <div class={bodyTool}>
      <h1 class={`${titlePurpleLD} mobileMd:text-center mb-1`}>MINT</h1>

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
          handleSubmit();
        }}
        aria-label="Mint SRC20 tokens"
        novalidate
      >
        {/* ===== TOKEN SEARCH AND AMOUNT INPUT ===== */}
        <div class={`${containerRowForm} mb-5`}>
          {/* Token image preview */}
          <div
            id="image-preview"
            class="relative flex flex-col items-center justify-center content-center mx-auto h-[100px] min-w-[100px] rounded bg-stamp-purple-darker"
          >
            {isImageLoading
              ? (
                <div class="animate-spin rounded-full w-7 h-7 border-b-[3px] border-stamp-grey" />
              )
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
                  name="image"
                  weight="normal"
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
              {openDrop && searchResults.length > 0 && !isSelecting && (
                <ul class="absolute top-[100%] left-0 max-h-[168px] w-full bg-stamp-grey-light rounded-b-md text-stamp-grey-darkest text-sm leading-none font-bold z-[11] overflow-y-auto scrollbar-grey">
                  {searchResults.map((result: SearchResult) => (
                    <li
                      key={result.tick}
                      onClick={() => handleResultClick(result.tick)}
                      class="p-1.5 pl-3 hover:bg-[#C3C3C3] uppercase cursor-pointer"
                    >
                      {result.tick}
                      <h6 class="font-medium text-xs text-stamp-grey-darker">
                        {(result.progress || 0).toFixed(1)}% minted
                      </h6>
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
      <div className={containerBackground}>
        <BasicFeeCalculator
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          type="src20"
          fileType="application/json"
          fileSize={undefined}
          issuance={undefined}
          serviceFee={undefined}
          BTCPrice={formState.BTCPrice}
          mintDetails={{
            token: formState.token,
            amount: formState.amt,
          }}
          onRefresh={fetchFees}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          buttonName={isConnected ? "MINT" : "CONNECT WALLET"}
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
          inputType={trxType === "olga" ? "P2WSH" : "P2SH"}
          outputTypes={trxType === "olga" ? ["P2WSH"] : ["P2SH", "P2WSH"]}
          userAddress={wallet?.address}
          disabled={undefined}
          effectiveFeeRate={undefined}
          utxoAncestors={undefined}
          feeDetails={feeDetailsForCalculator}
        />

        {/* ===== STATUS MESSAGES ===== */}
        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
        />
      </div>
    </div>
  );
}
