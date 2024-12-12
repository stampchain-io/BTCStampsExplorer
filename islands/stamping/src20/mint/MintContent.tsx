import axiod from "axiod";
import { useEffect, useRef, useState } from "preact/hooks";

import { useSRC20Form } from "$client/hooks/useSRC20Form.ts";
import { walletContext } from "$client/wallet/wallet.ts";

import { ComplexFeeCalculator } from "$islands/fee/ComplexFeeCalculator.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import { SRC20InputField } from "../SRC20InputField.tsx";

import { logger } from "$lib/utils/logger.ts";

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
    <div class="flex justify-between text-stamp-grey items-end">
      <div class="w-1/2 flex flex-col gap-[6px]">
        <p class="text-xl mobileLg:text-2xl font-light text-stamp-grey-light">
          <span class="text-stamp-grey-darker">PROGRESS</span>{" "}
          <span class="font-bold">
            {progress.toString().match(/^-?\d+(?:\.\d{0,2})?/)?.[0]}
          </span>
          %
        </p>
        <div class="w-full max-w-[420px] h-[6px] bg-stamp-grey relative rounded-full">
          <div
            class="absolute left-0 top-0 h-[6px] bg-[#660099] rounded-full"
            style={{ width: progressWidth }}
          />
        </div>
      </div>
      <div class="w-1/2 text-sm mobileLg:text-base font-light text-stamp-grey-darker text-right">
        <p>
          SUPPLY{" "}
          <span class="text-stamp-grey-light font-bold">{maxSupply}</span>
        </p>
        <p>
          LIMIT <span class="text-stamp-grey-light font-bold">{limit}</span>
        </p>
        <p class="-mb-[5px] mobileLg:-mb-[7px]">
          MINTERS <span class="text-stamp-grey-light font-bold">{minters}</span>
        </p>
      </div>
    </div>
  );
};

interface MintContentProps {
  trxType?: "olga" | "multisig";
  tick?: string | null;
  mintStatus?: any;
  holders?: number;
}

// Add interface for search results
interface SearchResult {
  tick: string;
  progress: number;
  total_minted: string;
  max_supply: number;
}

// Add consistent class names at the top
const bodyToolsClassName =
  "flex flex-col w-full items-center gap-3 mobileMd:gap-6";
const titlePurpleLDCenterClassName =
  "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient3 w-full text-center";
const feeSelectorContainerClassName =
  "p-3 mobileMd:p-6 dark-gradient z-[10] w-full";
const inputFieldContainerClassName =
  "flex flex-col gap-3 mobileMd:gap-6 p-3 mobileMd:p-6 dark-gradient w-full";

export function MintContent({
  trxType = "olga",
  tick,
  mintStatus: initialMintStatus,
  holders: initialHolders,
}: MintContentProps = { trxType: "olga" }) {
  const [isSearching, setIsSearching] = useState(false);

  const {
    formState,
    handleChangeFee,
    handleInputChange,
    handleSubmit,
    fetchFees,
    config,
    isSubmitting,
    submissionMessage,
    walletError,
    apiError,
    setFormState,
    handleInputBlur,
  } = useSRC20Form("mint", trxType, tick ?? undefined);

  const [mintStatus, setMintStatus] = useState<any>(initialMintStatus || null);
  const [holders, setHolders] = useState<number>(initialHolders || 0);
  const [error, setError] = useState<string | null>(null);
  const [tosAgreed, setTosAgreed] = useState(false);

  const { isConnected, wallet } = walletContext;

  const [searchTerm, setSearchTerm] = useState("");
  const [openDrop, setOpenDrop] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedTokenImage, setSelectedTokenImage] = useState<string | null>(
    null,
  );
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Add a ref to track if we're switching fields
  const [isSwitchingFields, setIsSwitchingFields] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const resetTokenData = () => {
    setMintStatus(null);
    setHolders(0);
    setSelectedTokenImage(null);
    setFormState((prevState) => ({
      ...prevState,
      amt: "",
    }));
  };

  // Update the useEffect that handles URL params
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

  // Update the search useEffect to respect switching fields state
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

    setIsSearching(true);
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
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      setIsSearching(false);
    };
  }, [searchTerm, isSelecting, tick, isSwitchingFields]);

  // Update handleResultClick to handle field switching
  const handleResultClick = async (tick: string) => {
    setOpenDrop(false);
    setIsSelecting(true);
    setIsSwitchingFields(true); // Set switching state when selecting
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
      // Keep isSelecting and isSwitchingFields true until next focus
    }
  };

  // Adjusted useEffect hook to always fetch data when token changes
  useEffect(() => {
    if (!searchTerm) {
      setError(null);
      resetTokenData();
    }
  }, [searchTerm]);

  // Calculate progress and other values
  const progress = mintStatus ? mintStatus.progress : "0";
  const progressWidth = `${progress}%`;
  const maxSupply = mintStatus
    ? Number(mintStatus.max_supply).toLocaleString()
    : "0";
  const limit = mintStatus ? Number(mintStatus.limit).toLocaleString() : "0";
  const minters = holders ? holders.toString() : "0";

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

  if (!config) {
    return <div>Error: Failed to load configuration</div>;
  }

  // Before rendering ComplexFeeCalculator
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

  return (
    <div class={bodyToolsClassName}>
      <h1 class={titlePurpleLDCenterClassName}>MINT</h1>

      {error && (
        <div class="w-full text-red-500 text-center font-bold">
          {error}
        </div>
      )}

      <div class={inputFieldContainerClassName}>
        <div class="w-full flex gap-3 mobileMd:gap-6">
          <div
            id="image-preview"
            class="relative rounded-md items-center justify-center mx-auto text-center min-w-[100px] w-[100px] h-[100px] mobileMd:min-w-[112px] mobileMd:w-[112px] mobileMd:h-[112px] mobileLg:min-w-[120px] mobileLg:w-[120px] mobileLg:h-[120px] content-center bg-[#660099] flex flex-col"
          >
            {isImageLoading
              ? (
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              )
              : (
                <img
                  src={selectedTokenImage || `/img/stamping/image-upload.svg`}
                  class={selectedTokenImage
                    ? "w-full h-full"
                    : "w-9 h-9 mobileLg:w-12 mobileLg:h-12"}
                  alt=""
                  loading="lazy"
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)}
                />
              )}
          </div>
          <div class="flex flex-col gap-3 mobileMd:gap-6 w-full relative">
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
              {openDrop && searchResults.length > 0 && !isSelecting && (
                <ul class="absolute top-[100%] left-0 max-h-[168px] mobileLg:max-h-[208px] w-full bg-stamp-grey-light rounded-b-md text-stamp-grey-darkest text-sm mobileLg:text-base leading-none font-bold z-[11] overflow-y-auto scrollbar-grey">
                  {searchResults.map((result: SearchResult) => (
                    <li
                      key={result.tick}
                      onClick={() => handleResultClick(result.tick)}
                      class="cursor-pointer p-1.5 pl-3 hover:bg-[#C3C3C3] uppercase"
                    >
                      {result.tick}
                      <p class="text-xs mobileLg:text-sm text-stamp-grey-darker font-medium mobileLg:-mt-1">
                        {(result.progress || 0).toFixed(1)}% minted
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

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
        <MintProgress
          progress={progress}
          progressWidth={progressWidth}
          maxSupply={maxSupply}
          limit={limit}
          minters={minters}
        />
      </div>

      <div class={feeSelectorContainerClassName}>
        <ComplexFeeCalculator
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          type="src20"
          fileType="application/json"
          fileSize={undefined}
          issuance={undefined}
          serviceFee={undefined}
          BTCPrice={formState.BTCPrice}
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

        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
          walletError={walletError}
        />
      </div>
    </div>
  );
}
