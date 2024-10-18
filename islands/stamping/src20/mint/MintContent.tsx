import axiod from "axiod";
import { useEffect, useState } from "preact/hooks";

import { useSRC20Form } from "$islands/hooks/useSRC20Form.ts";

import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import { InputField } from "$islands/stamping/InputField.tsx";

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
    <div className="flex justify-between text-[#999999] items-end">
      <div className="flex flex-col gap-1">
        <p className="text-base md:text-2xl font-light">
          PROGRESS <span className="font-bold">{progress}%</span>
        </p>
        <div className="min-w-[260px] h-1 bg-[#999999] relative rounded-full">
          <div
            className="absolute left-0 top-0 h-1 bg-[#660099] rounded-full"
            style={{ width: progressWidth }}
          />
        </div>
      </div>
      <div className="text-right text-xs md:text-base font-light">
        <p>
          SUPPLY <span className="font-bold">{maxSupply}</span>
        </p>
        <p>
          LIMIT <span className="font-bold">{limit}</span>
        </p>
        <p>
          MINTERS <span className="font-bold">{minters}</span>
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
  trxType = "multisig",
  tick,
  mintStatus: initialMintStatus,
  holders: initialHolders,
}: MintContentProps) {
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
  } = useSRC20Form("mint", trxType, tick);

  const [mintStatus, setMintStatus] = useState<any>(initialMintStatus || null);
  const [holders, setHolders] = useState<number>(initialHolders || 0);
  const [error, setError] = useState<string | null>(null);

  // Adjusted useEffect hook to always fetch data when token changes
  useEffect(() => {
    const fetchData = async () => {
      if (formState.token) {
        try {
          setError(null);
          const currentTick = formState.token;

          // Fetch combined mint data
          const response = await axiod.get(
            `/api/v2/src20/tick/${currentTick}/mint_data`,
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
  }, [formState.token, setFormState]);

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
    try {
      await handleSubmit();
    } catch (error) {
      console.error("Minting error:", error);
    }
  };

  return (
    <div class="flex flex-col w-full items-center gap-8">
      <p class="purple-gradient1 text-3xl md:text-6xl font-black mt-6 w-full text-center">
        MINT SRC-20
      </p>

      {/* Display error if any */}
      {error && (
        <div className="w-full text-red-500 text-center font-bold">
          {error}
        </div>
      )}

      <div className="dark-gradient p-3 md:p-6 flex flex-col gap-3 md:gap-6 w-full">
        <div className="w-full flex gap-3 md:gap-6">
          <div
            id="image-preview"
            class="relative rounded-md items-center justify-center mx-auto text-center cursor-pointer min-w-[108px] md:min-w-[120px] w-[108px] md:w-[120px] h-[108px] md:h-[120px] content-center bg-[#660099] flex flex-col"
          >
            <img
              src="/img/stamping/image-upload.svg"
              class="w-12 h-12"
              alt=""
            />
          </div>
          <div className="flex flex-col gap-3 md:gap-6 w-full">
            <InputField
              type="text"
              placeholder="Token"
              value={formState.token}
              onChange={(e) => handleInputChange(e, "token")}
              error={formState.tokenError}
            />

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

      <div className="dark-gradient p-3 md:p-6 w-full">
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
          buttonName="Mint"
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
