import axiod from "axiod";
import { useEffect, useState } from "preact/hooks";

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
  // Add other fields that might be in the search results
  status?: string;
  progress?: number;
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
    setIsSearching,
  } = useSRC20Form("mint", trxType, tick ?? undefined);

  const [mintStatus, setMintStatus] = useState<any>(initialMintStatus || null);
  const [holders, setHolders] = useState<number>(initialHolders || 0);
  const [error, setError] = useState<string | null>(null);
  const [tosAgreed, setTosAgreed] = useState(false);

  const { isConnected, wallet } = walletContext;

  const [searchTerm, setSearchTerm] = useState("");
  const [showList, setShowList] = useState<boolean>(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedTokenImage, setSelectedTokenImage] = useState<string | null>(
    null,
  );
  const [isImageLoading, setIsImageLoading] = useState(false);

  const resetTokenData = () => {
    setMintStatus(null);
    setHolders(0);
    setSelectedTokenImage(null);
    setFormState((prevState) => ({
      ...prevState,
      amt: "",
    }));
  };

  // Update useEffect to handle search results with better debouncing
  useEffect(() => {
    if (isSelecting) {
      setIsSelecting(false);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim()) {
        try {
          const response = await fetch(
            `/api/v2/src20/search?q=${encodeURIComponent(searchTerm.trim())}`,
          );
          const data = await response.json();

          logger.debug("stamps", {
            message: "Search results received",
            searchTerm,
            resultsCount: data.data?.length || 0,
          });

          if (data.data && Array.isArray(data.data)) {
            setSearchResults(data.data);
          }
        } catch (error) {
          logger.error("stamps", {
            message: "Search error",
            error,
            searchTerm,
          });
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
        resetTokenData();
      }
      setIsSearching(false);
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      setIsSearching(false);
    };
  }, [searchTerm, isSelecting]);

  // Update handleResultClick to be more efficient
  const handleResultClick = async (tick: string) => {
    setShowList(false);
    setIsSelecting(true);
    setSearchResults([]); // Clear results immediately
    setSearchTerm(tick);

    // Update form state after getting token data
    try {
      setIsImageLoading(true);
      setError(null);

      const response = await axiod.get(`/api/v2/src20/tick/${tick}/mintData`);
      const data = response.data;

      if (!data || data.error || !data.mintStatus) {
        setError("Token not deployed");
        resetTokenData();
      } else {
        // Set all token-related state at once
        setMintStatus(data.mintStatus);
        setHolders(data.holders || 0);
        setSelectedTokenImage(`/content/${data.mintStatus.tx_hash}.svg`);

        // Update form state last to minimize re-renders
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

  if (!config) {
    return <div>Error: Failed to load configuration</div>;
  }

  const handleMintSubmit = async () => {
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
      console.error("Minting error:", error);
    }
  };

  useEffect(() => {
    if (tick) {
      setSearchTerm(tick);
      handleResultClick(tick);
    }
  }, [tick]);

  return (
    <div class={bodyToolsClassName}>
      <h1 class={titlePurpleLDCenterClassName}>MINT SRC-20</h1>

      {error && (
        <div class="w-full text-red-500 text-center font-bold">
          {error}
        </div>
      )}

      <div class={inputFieldContainerClassName}>
        <div class="w-full flex gap-3 mobileMd:gap-6">
          <div
            id="image-preview"
            class="relative rounded-md items-center justify-center mx-auto text-center min-w-[108px] mobileMd:min-w-[120px] w-[108px] mobileMd:w-[120px] h-[108px] mobileMd:h-[120px] content-center bg-[#660099] flex flex-col"
          >
            {isImageLoading
              ? (
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              )
              : (
                <img
                  src={selectedTokenImage || `/img/stamping/image-upload.svg`}
                  class={selectedTokenImage ? "w-full h-full" : "w-12 h-12"}
                  alt=""
                  loading="lazy"
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)}
                />
              )}
          </div>
          <div class="flex flex-col gap-3 mobileMd:gap-6 w-full relative">
            <SRC20InputField
              type="text"
              placeholder="Token"
              value={searchTerm}
              onChange={(e) => {
                setShowList(true);
                setSearchTerm((e.target as HTMLInputElement).value);
              }}
              error={formState.tokenError}
              isUppercase
            />
            {showList && searchResults.length > 1 && (
              <ul class="absolute top-[54px] left-0 w-full bg-[#999999] rounded-b text-[#333333] font-bold text-[12px] leading-[14px] z-[11] max-h-60 overflow-y-auto">
                {searchResults.map((result: SearchResult) => (
                  <li
                    key={result.tick}
                    onClick={() => handleResultClick(result.tick)}
                    class="cursor-pointer p-2 hover:bg-gray-600 uppercase"
                  >
                    {result.tick}
                  </li>
                ))}
              </ul>
            )}

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
          BTCPrice={formState.BTCPrice}
          onRefresh={fetchFees}
          isSubmitting={isSubmitting}
          onSubmit={handleMintSubmit}
          buttonName={isConnected ? "MINT" : "CONNECT WALLET"}
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
          inputType={trxType === "olga" ? "P2WSH" : "P2SH"}
          outputTypes={trxType === "olga" ? ["P2WSH"] : ["P2SH", "P2WSH"]}
          userAddress={wallet?.address}
          utxoAncestors={formState.utxoAncestors}
          feeDetails={{
            minerFee: formState.psbtFees?.estMinerFee || 0,
            dustValue: formState.psbtFees?.totalDustValue || 0,
            hasExactFees: !!formState.psbtFees?.hasExactFees,
          }}
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
