import { useEffect, useState } from "preact/hooks";
import { useFeePolling } from "$client/hooks/useFeePolling.ts";
import { estimateFee } from "$lib/utils/minting/feeCalculations.ts";
import type { AncestorInfo, Output, ScriptType } from "$types/index.d.ts";
import { calculateTransactionFees } from "$lib/utils/minting/feeEstimator.ts";

interface FeeEstimationProps {
  fee: number;
  handleChangeFee: (fee: number) => void;
  type: string;
  fileType?: string;
  fileSize?: number;
  issuance?: number;
  BTCPrice: number;
  onRefresh: () => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  buttonName: string;
  recipientAddress?: string;
  userAddress?: string;
  inputType?: ScriptType;
  outputTypes?: ScriptType[];
  disabled?: boolean;
  utxoAncestors?: AncestorInfo[];
  feeDetails?: {
    minerFee?: number;
    dustValue?: number;
    totalValue?: number;
    hasExactFees: boolean;
  };
  isModal?: boolean;
  onCancel?: () => void;
  cancelText?: string;
  confirmText?: string;
  showCoinToggle?: boolean;
  className?: string;
  tosAgreed?: boolean;
  onTosChange?: (agreed: boolean) => void;
}

export function FeeEstimation({
  fee,
  handleChangeFee,
  type,
  fileType,
  fileSize,
  issuance,
  BTCPrice,
  onRefresh,
  isSubmitting,
  onSubmit,
  buttonName,
  recipientAddress,
  userAddress,
  inputType = "P2WPKH",
  outputTypes,
  disabled = false,
  utxoAncestors,
  feeDetails,
  isModal = false,
  onCancel,
  cancelText = "CANCEL",
  confirmText,
  showCoinToggle = true,
  className = "",
  tosAgreed = false,
  onTosChange = () => {},
}: FeeEstimationProps) {
  const { fees, loading } = useFeePolling(300000);
  const [visible, setVisible] = useState(false);
  const [txfee, setTxfee] = useState(0.0);
  const [mintfee, setMintfee] = useState(0.0);
  const [dust, setDust] = useState(0.0);
  const [total, setTotal] = useState(0.0);
  const [coinType, setCoinType] = useState("BTC");

  // Update fee when recommended fee changes
  useEffect(() => {
    if (fees && !loading) {
      const recommendedFee = Math.round(fees.recommendedFee);
      handleChangeFee(recommendedFee);
    }
  }, [fees, loading]);

  // Auto-refresh fees every 5 minutes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      onRefresh?.();
    }, 300000);
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (fileSize && fee) {
      console.log("FeeEstimation: Starting fee calculation", {
        fileSize,
        feeRate: fee,
        hasExactFees: feeDetails?.hasExactFees,
        userAddress,
        utxoAncestors: utxoAncestors?.length,
      });

      if (feeDetails?.hasExactFees) {
        console.log("FeeEstimation: Using exact fees from backend", {
          minerFee: feeDetails.minerFee,
          dustValue: feeDetails.dustValue,
          totalValue: feeDetails.totalValue,
        });

        setTxfee(feeDetails.minerFee ?? 0);
        setDust(feeDetails.dustValue ?? 0);
        setTotal(feeDetails.totalValue ?? 0);
      } else {
        // Fall back to estimation
        console.log("FeeEstimation: Using frontend estimation");
        const { minerFee, dustValue, detectedInputType } =
          calculateTransactionFees({
            type: type as "stamp" | "src20" | "fairmint" | "transfer",
            fileSize,
            userAddress,
            outputTypes,
            feeRate: fee,
            isMultisig: type === "src20" && outputTypes?.includes("P2SH"),
            utxoAncestors,
          });

        console.log("FeeEstimation: Frontend calculation results", {
          minerFee,
          dustValue,
          detectedInputType,
          totalWithMintFee: minerFee + dustValue + (mintfee * 1e8),
        });

        setTxfee(minerFee);
        setDust(dustValue);
        setTotal(minerFee + dustValue + (mintfee * 1e8));
      }
    }
  }, [
    fileSize,
    fee,
    type,
    userAddress,
    outputTypes,
    mintfee,
    utxoAncestors,
    feeDetails,
  ]);

  // Define the coin icons
  const btcIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <path
        fill="#996600"
        d="M14.24 10.56c-.31 1.24-2.24.61-2.84.44l.55-2.18c.62.18 2.61.44 2.29 1.74m-3.11 1.56l-.6 2.41c.74.19 3.03.92 3.37-.44c.36-1.42-2.03-1.79-2.77-1.97m10.57 2.3c-1.34 5.36-6.76 8.62-12.12 7.28S.963 14.94 2.3 9.58A9.996 9.996 0 0 1 14.42 2.3c5.35 1.34 8.61 6.76 7.28 12.12m-7.49-6.37l.45-1.8l-1.1-.25l-.44 1.73c-.29-.07-.58-.14-.88-.2l.44-1.77l-1.09-.26l-.45 1.79c-.24-.06-.48-.11-.7-.17l-1.51-.38l-.3 1.17s.82.19.8.2c.45.11.53.39.51.64l-1.23 4.93c-.05.14-.21.32-.5.27c.01.01-.8-.2-.8-.2L6.87 15l1.42.36c.27.07.53.14.79.2l-.46 1.82l1.1.28l.45-1.81c.3.08.59.15.87.23l-.45 1.79l1.1.28l.46-1.82c1.85.35 3.27.21 3.85-1.48c.5-1.35 0-2.15-1-2.66c.72-.19 1.26-.64 1.41-1.62c.2-1.33-.82-2.04-2.2-2.52"
      />
    </svg>
  );

  const usdIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      style={{ padding: "1px" }}
      viewBox="0 0 32 32"
    >
      <path
        fill="#006600"
        fill-rule="evenodd"
        d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16s-7.163 16-16 16m6.5-12.846c0-2.523-1.576-3.948-5.263-4.836v-4.44c1.14.234 2.231.725 3.298 1.496l1.359-2.196a9.49 9.49 0 0 0-4.56-1.776V6h-2.11v1.355c-3.032.234-5.093 1.963-5.093 4.486c0 2.64 1.649 3.925 5.19 4.813v4.58c-1.577-.234-2.886-.935-4.269-2.01L9.5 21.35a11.495 11.495 0 0 0 5.724 2.314V26h2.11v-2.313c3.08-.257 5.166-1.963 5.166-4.533m-7.18-5.327c-1.867-.537-2.327-1.168-2.327-2.15c0-1.027.8-1.845 2.328-1.962zm4.318 5.49c0 1.122-.873 1.893-2.401 2.01v-4.229c1.892.538 2.401 1.168 2.401 2.22z"
      />
    </svg>
  );

  const handleChangeCoin = () => {
    setCoinType((prevType) => (prevType === "BTC" ? "USDT" : "BTC"));
  };

  // Fee selector component
  const renderFeeSelector = () => (
    <div className={`flex flex-col w-full ${isModal ? "w-full" : "w-1/2"}`}>
      <p className="text-base mobileLg:text-lg text-stamp-grey-light font-light">
        <span className="text-stamp-grey-darker">FEE</span>{" "}
        <span className="font-bold">{fee}</span> SAT/vB
      </p>
      {fees?.recommendedFee && (
        <p className="mb-3 text-sm mobileLg:text-base text-stamp-grey-light font-light">
          <span className="text-stamp-grey-darker">RECOMMENDED</span>{" "}
          <span className="font-medium">{fees.recommendedFee}</span> SAT/vB
        </p>
      )}
      <div className="relative w-full">
        <input
          type="range"
          value={fee}
          min="1"
          max="264"
          step="1"
          onInput={(e) =>
            handleChangeFee(parseInt((e.target as HTMLInputElement).value, 10))}
          className="accent-stamp-purple-dark w-full h-[6px] rounded-lg appearance-none cursor-pointer bg-stamp-grey [&::-webkit-slider-thumb]:w-[22px] [&::-webkit-slider-thumb]:h-[22px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-stamp-purple-dark [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-[22px] [&::-moz-range-thumb]:h-[22px] [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:bg-stamp-purple-dark [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>
    </div>
  );

  // Estimate details component
  const renderDetails = () => {
    if (isModal) {
      const detailsTitleClassName = "text-stamp-grey-darker font-light";
      const detailsTextClassName =
        "text-xs mobileLg:text-sm font-medium text-stamp-grey-light";
      // Modal-specific details view
      return (
        <div className="flex flex-col gap-2 mt-2">
          {fileSize && (
            <p className={detailsTextClassName}>
              <span className={detailsTitleClassName}>SIZE</span> {fileSize}
              {" "}
              <span className="font-light">BYTES</span>
            </p>
          )}

          <p className={detailsTextClassName}>
            <span className={detailsTitleClassName}>MINER FEE</span> {txfee}
            {" "}
            <span className="font-light">SATS</span>
          </p>
          {mintfee > 0 && (
            <p className={detailsTextClassName}>
              <span className={detailsTitleClassName}>SERVICE FEE</span>{" "}
              {mintfee} <span className="font-light">SATS</span>
            </p>
          )}
          {dust > 0 && (
            <p className={detailsTextClassName}>
              <span className={detailsTitleClassName}>DUST</span> {dust}{" "}
              <span className="font-light">SATS</span>
            </p>
          )}
        </div>
      );
    }

    // Original Content pages details view
    const detailsTitleClassName = "text-stamp-grey-darker font-light";
    const detailsTextClassName =
      "text-xs mobileLg:text-sm font-medium text-stamp-grey-light";

    return (
      <div className={`${visible ? "visible" : "invisible"}`}>
        {type === "stamp" && (
          <>
            <p className={detailsTextClassName}>
              <span className={detailsTitleClassName}>FILE</span>{" "}
              {fileType?.toUpperCase()}
            </p>
            <p className={detailsTextClassName}>
              <span className={detailsTitleClassName}>EDITIONS</span> {issuance}
            </p>
          </>
        )}
        <p className={detailsTextClassName}>
          <span className={detailsTitleClassName}>SIZE</span> {fileSize}{" "}
          <span className="font-light">BYTES</span>
        </p>
        <p className={detailsTextClassName}>
          <span className={detailsTitleClassName}>SATS PER BYTE</span> {fee}
        </p>

        <p className={detailsTextClassName}>
          <span className={detailsTitleClassName}>MINER FEE</span>{" "}
          {txfee.toFixed(0)} <span className="font-light">SATS</span>
        </p>
        {mintfee > 0 && (
          <p className={detailsTextClassName}>
            <span className={detailsTitleClassName}>MINTING FEE</span>{" "}
            {(mintfee * 1e8).toFixed(0)}{" "}
            <span className="font-light">SATS</span>
          </p>
        )}
        {dust > 0 && (
          <p className={detailsTextClassName}>
            <span className={detailsTitleClassName}>DUST</span>{" "}
            {dust.toFixed(0)} <span className="font-light">SATS</span>
          </p>
        )}
      </div>
    );
  };
  const buttonPurpleOutlineClassName =
    "inline-flex items-center justify-center border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-purple tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:text-stamp-purple-highlight transition-colors";
  const buttonPurpleFlatClassName =
    "inline-flex items-center justify-center bg-stamp-purple border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-black tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:bg-stamp-purple-highlight transition-colors";

  const renderModalActions = () => (
    <div className="flex flex-col items-end gap-4 mt-4">
      {!isModal && (
        <div className="flex gap-2 items-center">
          <input
            type="checkbox"
            id="tosAgreed"
            checked={tosAgreed}
            onChange={(e) =>
              onTosChange((e.target as HTMLInputElement).checked)}
            className="w-3 h-3 mobileLg:w-4 mobileLg:h-4 rounded-[3px] bg-stamp-grey checked:bg-stamp-grey-light appearance-none cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:text-[#660099] checked:after:p-[3px] checked:after:text-[10px] checked:after:font-bold"
          />
          <label
            htmlFor="tosAgreed"
            className={`text-xs mobileLg:text-sm font-medium ${
              tosAgreed ? "text-stamp-grey-light" : "text-stamp-grey"
            }`}
          >
            I AGREE TO THE{" "}
            <span className="text-stamp-purple">
              <span className="mobileLg:hidden">
                <a
                  href="/termsofservice"
                  className="hover:text-stamp-purple-highlight"
                >
                  ToS
                </a>
              </span>
              <span className="hidden mobileLg:inline">
                <a
                  href="/termsofservice"
                  class="hover:text-stamp-purple-highlight"
                >
                  TERMS OF SERVICE
                </a>
              </span>
            </span>
          </label>
        </div>
      )}

      <div className="flex justify-end gap-6">
        {isModal && onCancel && (
          <button
            className={`${buttonPurpleOutlineClassName} ${
              (disabled || isSubmitting || (!isModal && !tosAgreed))
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelText}
          </button>
        )}
        <button
          className={`${buttonPurpleFlatClassName} ${
            (disabled || isSubmitting || (!isModal && !tosAgreed))
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
          onClick={onSubmit}
          disabled={disabled || isSubmitting || (!isModal && !tosAgreed)}
        >
          {isSubmitting ? "Processing..." : confirmText || buttonName}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`text-[#999999] ${className}`}>
      <div className="flex">
        {renderFeeSelector()}
        {showCoinToggle && (
          <div className="flex gap-1 items-center justify-end w-1/2">
            <button
              className="w-12 h-6 rounded-full bg-stamp-grey flex items-center transition duration-300 focus:outline-none shadow"
              onClick={handleChangeCoin}
            >
              <div
                id="switch-toggle"
                className={`coin w-6 h-6 relative rounded-full transition duration-500 transform bg-stamp-grey text-white ${
                  coinType === "BTC" ? "translate-x-full" : ""
                }`}
              >
                {coinType === "BTC" ? btcIcon : usdIcon}
              </div>
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 text-xl mobileLg:text-2xl text-stamp-grey-light font-light">
        <span className="text-stamp-grey-darker">ESTIMATE</span>{" "}
        {coinType === "BTC"
          ? (
            <>
              <span className="font-bold">{total.toFixed(0)}</span> SATS
            </>
          )
          : (
            <>
              <span className="font-bold">
                {(total / 1e8 * BTCPrice).toFixed(2)}
              </span>{" "}
              {coinType}
            </>
          )}
      </p>

      <div
        onClick={() => setVisible(!visible)}
        className="flex items-center gap-1 mt-2 text-sm mobileLg:text-base font-light text-stamp-grey-darker cursor-pointer"
      >
        <span className="mr-[3px] mobileLg:mr-[6px]">DETAILS</span>
        {!visible
          ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="5"
              className="mobileLg:w-[12px] mobileLg:h-[6px]"
              viewBox="0 0 10 5"
              fill="none"
            >
              <path
                d="M9.01552 4.76561C8.98069 4.80047 8.93934 4.82813 8.89381 4.84701C8.84829 4.86588 8.79949 4.87559 8.75021 4.87559C8.70093 4.87559 8.65213 4.86588 8.60661 4.84701C8.56108 4.82813 8.51972 4.80047 8.4849 4.76561L5.00021 1.28045L1.51552 4.76561C1.44516 4.83597 1.34972 4.8755 1.25021 4.8755C1.1507 4.8755 1.05526 4.83597 0.984896 4.76561C0.914531 4.69524 0.875 4.59981 0.875 4.5003C0.875 4.40078 0.914531 4.30535 0.984896 4.23498L4.7349 0.484982C4.76972 0.450116 4.81108 0.422457 4.85661 0.403585C4.90213 0.384714 4.95093 0.375 5.00021 0.375C5.04949 0.375 5.09829 0.384714 5.14381 0.403585C5.18934 0.422457 5.23069 0.450116 5.26552 0.484982L9.01552 4.23498C9.05039 4.26981 9.07805 4.31117 9.09692 4.35669C9.11579 4.40222 9.1255 4.45101 9.1255 4.5003C9.1255 4.54958 9.11579 4.59837 9.09692 4.6439C9.07805 4.68942 9.05039 4.73078 9.01552 4.76561Z"
                fill="#666666"
              />
            </svg>
          )
          : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="5"
              className="mobileLg:w-[12px] mobileLg:h-[6px]"
              viewBox="0 0 10 5"
              fill="none"
            >
              <path
                d="M9.01552 0.765521L5.26552 4.51552C5.23069 4.55039 5.18934 4.57805 5.14381 4.59692C5.09829 4.61579 5.04949 4.6255 5.00021 4.6255C4.95093 4.6255 4.90213 4.61579 4.85661 4.59692C4.81108 4.57805 4.76972 4.55039 4.7349 4.51552L0.984896 0.765521C0.914531 0.695156 0.875 0.59972 0.875 0.500208C0.875 0.400697 0.914531 0.305261 0.984896 0.234896C1.05526 0.164531 1.1507 0.125 1.25021 0.125C1.34972 0.125 1.44516 0.164531 1.51552 0.234896L5.00021 3.72005L8.4849 0.234896C8.51974 0.200054 8.5611 0.172417 8.60662 0.153561C8.65215 0.134705 8.70094 0.125 8.75021 0.125C8.79948 0.125 8.84827 0.134705 8.8938 0.153561C8.93932 0.172417 8.98068 0.200054 9.01552 0.234896C9.05036 0.269737 9.078 0.3111 9.09686 0.356622C9.11571 0.402145 9.12542 0.450935 9.12542 0.500208C9.12542 0.549482 9.11571 0.598272 9.09686 0.643795C9.078 0.689317 9.05036 0.73068 9.01552 0.765521Z"
                fill="#666666"
              />
            </svg>
          )}
      </div>

      {renderDetails()}
      {renderModalActions()}
    </div>
  );
}
