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
}: FeeEstimationProps) {
  const { fees, loading } = useFeePolling(300000);
  const [visible, setVisible] = useState(true);
  const [txfee, setTxfee] = useState(0.0);
  const [mintfee, setMintfee] = useState(0.0);
  const [dust, setDust] = useState(0.0);
  const [total, setTotal] = useState(0.0);
  const [coinType, setCoinType] = useState("BTC");
  const [tosAgreed, setToSAgreed] = useState(false);

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
        fill="#ffa000"
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
        fill="#0E9F6E"
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
      <p className="text-[#999999] font-light">
        FEE <span className="font-bold">{fee}</span> SAT/vB
      </p>
      {fees?.recommendedFee && (
        <p className="text-xs font-light text-[#999999]">
          RECOMMENDED <span className="font-medium">{fees.recommendedFee}</span>
          {" "}
          SAT/vB
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
          className="accent-[#5E1BA1] w-full h-[6px] rounded-lg appearance-none cursor-pointer bg-[#3F2A4E]"
        />
      </div>
    </div>
  );

  // Estimate details component
  const renderDetails = () => {
    if (isModal) {
      // Modal-specific details view
      return (
        <div className="flex flex-col gap-2 mt-2">
          {fileSize && (
            <p className="text-xs font-light text-[#999999]">
              BYTES <span className="font-medium">{fileSize}</span>
            </p>
          )}
          <p className="text-xs font-light text-[#999999]">
            MINER FEE <span className="font-medium">{txfee}</span> SATS
          </p>
          {mintfee > 0 && (
            <p className="text-xs font-light text-[#999999]">
              MINTING FEE <span className="font-medium">{mintfee}</span> SATS
            </p>
          )}
          {dust > 0 && (
            <p className="text-xs font-light text-[#999999]">
              DUST <span className="font-medium">{dust}</span> SATS
            </p>
          )}
        </div>
      );
    }

    // Original Content pages details view
    return (
      <div className={`${visible ? "visible" : "invisible"}`}>
        {type === "src20" && (
          <div className="flex justify-between border-b border-[#8A8989] py-4">
            <p>Sats per byte</p>
            <p>{fee}</p>
          </div>
        )}
        {type === "stamp" && (
          <>
            <p className="font-medium text-xs">
              <span className="text-[#666666] font-light">FILE</span> {fileType}
            </p>
            <p className="font-medium text-xs">
              <span className="text-[#666666] font-light">BYTES</span>{" "}
              {fileSize} bytes
            </p>
            <p className="font-medium text-xs">
              <span className="text-[#666666] font-light">SATS PER BYTE</span>
              {" "}
              {fee}
            </p>
            <p className="font-medium text-xs">
              <span className="text-[#666666] font-light">EDITIONS:</span>{" "}
              {issuance}
            </p>
          </>
        )}
        <p className="flex gap-1 items-center text-xs font-medium">
          <span className="font-light text-[#666666]">MINER FEE</span>{" "}
          {txfee.toFixed(0)} sats
        </p>
        {mintfee > 0 && (
          <p className="flex gap-1 items-center text-xs font-medium">
            <span className="font-light text-[#666666]">MINTING FEE</span>{" "}
            {(mintfee * 1e8).toFixed(0)} sats
          </p>
        )}
        {dust > 0 && (
          <p className="flex gap-1 items-center text-xs font-medium">
            <span className="font-light text-[#666666]">DUST</span>{" "}
            {dust.toFixed(0)} sats
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={`text-[#999999] ${className}`}>
      <div className="flex">
        {renderFeeSelector()}
        {showCoinToggle && (
          <div className="flex gap-1 items-center justify-end w-1/2">
            <button
              className="w-12 h-6 rounded-full bg-gray-700 flex items-center transition duration-300 focus:outline-none shadow"
              onClick={handleChangeCoin}
            >
              <div
                id="switch-toggle"
                className={`coin w-6 h-6 relative rounded-full transition duration-500 transform text-white ${
                  coinType === "BTC" ? "translate-x-full" : ""
                }`}
              >
                {coinType === "BTC" ? btcIcon : usdIcon}
              </div>
            </button>
          </div>
        )}
      </div>

      <p className="flex items-center uppercase">
        Details
        <span onClick={() => setVisible(!visible)} className="cursor-pointer">
          {!visible
            ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
              >
                <path fill="white" d="M12 8l6 6H6l6-6z" />
              </svg>
            )
            : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
              >
                <path fill="white" d="M12 16l-6-6h12l-6 6z" />
              </svg>
            )}
        </span>
      </p>

      {renderDetails()}

      <div className="flex justify-end gap-6 mt-4">
        {isModal && onCancel && (
          <button
            className="border-2 border-[#8800CC] text-[#8800CC] w-[108px] h-[48px] rounded-md font-extrabold"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelText}
          </button>
        )}
        <button
          className={`bg-[#8800CC] text-[#330033] w-[84px] h-[48px] rounded-md font-extrabold ${
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
}
