import axiod from "axiod";
import { useEffect, useState } from "preact/hooks";
import { set_precision } from "bigfloat/mod.ts";

import { useSRC20Form } from "$client/hooks/useSRC20Form.ts";
import { walletContext } from "$client/wallet/wallet.ts";

import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import { InputField } from "$islands/stamping/InputField.tsx";

import { logger } from "$lib/utils/logger.ts";
import { getStampImageSrc } from "$lib/utils/imageUtils.ts";
import { convertEmojiToTick } from "$lib/utils/emojiUtils.ts";

import { Src20Controller } from "$server/controller/src20Controller.ts";

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
    <div className="flex justify-between text-stamp-grey items-end">
      <div className="w-1/2 flex flex-col gap-[6px]">
        <p className="text-xl mobileLg:text-2xl font-light text-stamp-grey-light">
          <span className="text-stamp-grey-darker">PROGRESS</span>{" "}
          <span className="font-bold">
            {progress.toString().match(/^-?\d+(?:\.\d{0,2})?/)?.[0]}
          </span>
          %
        </p>
        <div className="w-full max-w-[420px] h-[6px] bg-stamp-grey relative rounded-full">
          <div
            className="absolute left-0 top-0 h-[6px] bg-[#660099] rounded-full"
            style={{ width: progressWidth }}
          />
        </div>
      </div>
      <div className="w-1/2 text-sm mobileLg:text-base font-light text-stamp-grey-darker text-right">
        <p>
          SUPPLY{" "}
          <span className="text-stamp-grey-light font-bold">{maxSupply}</span>
        </p>
        <p>
          LIMIT <span className="text-stamp-grey-light font-bold">{limit}</span>
        </p>
        <p className="-mb-[5px] mobileLg:-mb-[7px]">
          MINTERS{" "}
          <span className="text-stamp-grey-light font-bold">{minters}</span>
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
    isLoading,
    config,
    isSubmitting,
    submissionMessage,
    walletError,
    apiError,
    setFormState,
  } = useSRC20Form("mint", trxType, tick ?? undefined);

  const [mintStatus, setMintStatus] = useState<any>(initialMintStatus || null);
  const [holders, setHolders] = useState<number>(initialHolders || 0);
  const [error, setError] = useState<string | null>(null);
  const [tosAgreed, setTosAgreed] = useState(false);

  const { wallet, isConnected } = walletContext;

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);

  // Fetch search results based on searchTerm
  useEffect(() => {
    if (isSelecting) {
      setIsSelecting(false); // Reset flag after selection
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim()) {
        const response = await fetch(
          `/api/v2/src20/search?q=${encodeURIComponent(searchTerm.trim())}`,
        );
        const data = await response.json();
        setSearchResults(data.data);
      } else {
        setSearchResults([]);
      }
    }, 300); // Debounce the search input by 300ms

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleResultClick = async (tick: string) => {
    setIsSelecting(true); // Set flag to true to prevent search
    setFormState((prevState) => ({
      ...prevState,
      token: tick,
    }));
    setSearchTerm(tick);
    setSearchResults([]);

    // TODO: This one occurs error atm
    // try {
    //   if (!tick) return;

    //   tick = convertEmojiToTick(tick);
    //   set_precision(-4);
    //   const body = await Src20Controller.handleTickPageRequest(tick);

    //   if (!body || body.error) return;

    //   setSelectedToken(body.deployment);
    // } catch (error) {
    //   console.error("Error in SRC20 tick page:", error);
    //   return;
    // }
  };

  // Adjusted useEffect hook to always fetch data when token changes
  useEffect(() => {
    const fetchData = async () => {
      if (searchTerm) {
        try {
          setError(null);
          const currentTick = searchTerm;

          // Fetch combined mint data
          const response = await axiod.get(
            `/api/v2/src20/tick/${currentTick}/mintData`,
          );
          const data = response.data;

          if (!data || data.error || !data.mintStatus) {
            setError("Token not deployed");
            setMintStatus(null);
            setHolders(0);
          } else {
            setMintStatus(data.mintStatus);
            setHolders(data.holders || 0);

            // Pre-populate amt with limit value
            if (data.mintStatus.limit) {
              setFormState((prevState) => ({
                ...prevState,
                amt: data.mintStatus.limit.toString(),
              }));
            }
          }
        } catch (err) {
          console.error("Error fetching mint data:", err);
          setError("Error fetching token data");
          setMintStatus(null);
          setHolders(0);
        }
      } else {
        setMintStatus(null);
        setHolders(0);
        setError(null);
      }
    };

    fetchData();
  }, [searchTerm, setFormState]);

  // Calculate progress and other values
  const progress = mintStatus ? mintStatus.progress : "0";
  const progressWidth = `${progress}%`;
  const maxSupply = mintStatus
    ? Number(mintStatus.max_supply).toLocaleString()
    : "0";
  const limit = mintStatus ? Number(mintStatus.limit).toLocaleString() : "0";
  const minters = holders ? holders.toString() : "0";

  if (isLoading) {
    return <div>Loading...</div>;
  }

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

  const bodyToolsClassName =
    "flex flex-col w-full items-center gap-3 mobileMd:gap-6";
  const titlePurpleLDCenterClassName =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient3 w-full text-center";
  const feeSelectorContainerClassName =
    "p-3 mobileMd:p-6 dark-gradient z-[10] w-full";
  const inputFieldContainerClassName =
    "flex flex-col gap-3 mobileMd:gap-6 p-3 mobileMd:p-6 dark-gradient w-full";

  return (
    <div className={bodyToolsClassName}>
      <h1 className={titlePurpleLDCenterClassName}>MINT SRC-20</h1>

      {/* Display error if any */}
      {error && (
        <div className="w-full text-red-500 text-center font-bold">
          {error}
        </div>
      )}

      <div className={inputFieldContainerClassName}>
        <div className="w-full flex gap-3 mobileMd:gap-6">
          <div
            id="image-preview"
            class="relative rounded-md items-center justify-center mx-auto text-center min-w-[108px] mobileMd:min-w-[120px] w-[108px] mobileMd:w-[120px] h-[108px] mobileMd:h-[120px] content-center bg-[#660099] flex flex-col"
          >
            <img
              src={selectedToken
                ? `/content/${selectedToken.tx_hash}.svg`
                : `/img/stamping/image-upload.svg`}
              class="w-12 h-12"
              alt=""
              loading="lazy"
            />
          </div>
          <div className="flex flex-col gap-3 mobileMd:gap-6 w-full relative">
            <InputField
              type="text"
              placeholder="Token"
              value={searchTerm}
              // onChange={(e) => handleInputChange(e, "token")}
              onInput={(e) =>
                setSearchTerm((e.target as HTMLInputElement).value)}
              error={formState.tokenError}
              isUppercase
            />
            {searchResults.length > 0 && (
              <ul class="absolute top-[54px] left-0 w-full bg-[#999999] rounded-b text-[#333333] font-bold text-[12px] leading-[14px] z-[20] max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <li
                    key={result.tick}
                    onClick={() => handleResultClick(result.tick)}
                    class="cursor-pointer p-2 hover:bg-gray-600"
                  >
                    {result.tick}
                  </li>
                ))}
              </ul>
            )}

            <InputField
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Amount"
              value={formState.amt}
              onChange={(e) => handleInputChange(e, "amt")}
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

      <div className={feeSelectorContainerClassName}>
        <FeeEstimation
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          type="src20-mint"
          fileType="application/json"
          fileSize={formState.jsonSize}
          BTCPrice={formState.BTCPrice}
          onRefresh={fetchFees}
          isSubmitting={isSubmitting}
          onSubmit={handleMintSubmit}
          buttonName={isConnected ? "MINT" : "CONNECT WALLET"}
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
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
