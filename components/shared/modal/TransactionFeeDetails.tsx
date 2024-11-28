import { useState } from "preact/hooks";
import { useFeePolling } from "$client/hooks/useFeePolling.ts";
import { calculateTransactionFees } from "$lib/utils/minting/feeEstimator.ts";
import { estimateFee } from "$lib/utils/minting/feeCalculations.ts";
import { TX_CONSTANTS } from "$lib/utils/minting/constants.ts";
import { estimateTransactionSize } from "$lib/utils/minting/transactionSizes.ts";
import type {
  Output,
  ScriptType,
  TransactionSizeOptions,
} from "$types/index.d.ts";
import { Button } from "$components/shared/Button.tsx";
import { formatSatoshisToBTC } from "$lib/utils/formatUtils.ts";

interface TransactionFeeDetailsProps {
  fee: number;
  handleChangeFee: (fee: number) => void;
  type: "send" | "transfer" | "buy";
  amount?: number;
  BTCPrice: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
  buttonName: string;
  className?: string;
  recipientAddress?: string;
  userAddress?: string;
  inputType?: ScriptType;
  outputTypes?: ScriptType[];
}

export function TransactionFeeDetails({
  fee,
  handleChangeFee,
  type,
  amount,
  BTCPrice,
  isSubmitting,
  onSubmit,
  onCancel,
  buttonName,
  className = "",
  recipientAddress,
  userAddress,
  inputType = "P2WPKH",
  outputTypes = ["P2WPKH"],
}: TransactionFeeDetailsProps) {
  const { fees } = useFeePolling();
  const [visible, setVisible] = useState(false);
  const [coinType, setCoinType] = useState("BTC");

  // Use both fee calculation methods
  const sizeOptions: TransactionSizeOptions = {
    inputs: [{ type: inputType }],
    outputs: outputTypes.map((type) => ({ type })),
    includeChangeOutput: true,
    changeOutputType: inputType,
  };

  const txSize = estimateTransactionSize(sizeOptions);

  // Define outputs for estimateFee
  const outputs: Output[] = outputTypes.map((type) => ({
    type,
    value: TX_CONSTANTS.DUST_SIZE,
    isWitness: TX_CONSTANTS[type].isWitness,
    size: TX_CONSTANTS[type].size,
  }));

  // Calculate fees using both methods
  const estimatedFee = estimateFee(outputs, fee);
  const { minerFee, dustValue } = calculateTransactionFees({
    type: "transfer",
    userAddress: userAddress || recipientAddress,
    outputTypes,
    feeRate: fee,
    isMultisig: false,
  });

  // Use the higher fee estimation for safety
  const totalFee = Math.max(estimatedFee, minerFee + (dustValue || 0));

  // Add BTC and USD icons
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
        fillRule="evenodd"
        d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16s-7.163 16-16 16m6.5-12.846c0-2.523-1.576-3.948-5.263-4.836v-4.44c1.14.234 2.231.725 3.298 1.496l1.359-2.196a9.49 9.49 0 0 0-4.56-1.776V6h-2.11v1.355c-3.032.234-5.093 1.963-5.093 4.486c0 2.64 1.649 3.925 5.19 4.813v4.58c-1.577-.234-2.886-.935-4.269-2.01L9.5 21.35a11.495 11.495 0 0 0 5.724 2.314V26h2.11v-2.313c3.08-.257 5.166-1.963 5.166-4.533m-7.18-5.327c-1.867-.537-2.327-1.168-2.327-2.15c0-1.027.8-1.845 2.328-1.962zm4.318 5.49c0 1.122-.873 1.893-2.401 2.01v-4.229c1.892.538 2.401 1.168 2.401 2.22z"
      />
    </svg>
  );

  return (
    <div className={`text-stamp-grey-light ${className}`}>
      <div className="flex">
        <div className="flex flex-col w-3/4">
          <p className="text-base mobileLg:text-lg font-light">
            <span className="text-stamp-grey-darker">FEE</span>{" "}
            <span className="font-bold">{fee}</span> SAT/vB
          </p>
          {fees?.recommendedFee && (
            <p className="mb-3 text-sm mobileLg:text-base font-light">
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
                handleChangeFee(
                  parseInt((e.target as HTMLInputElement).value, 10),
                )}
              className="accent-stamp-purple-dark w-full h-[6px] rounded-lg appearance-none cursor-pointer bg-stamp-grey [&::-webkit-slider-thumb]:w-[22px] [&::-webkit-slider-thumb]:h-[22px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-stamp-purple-dark [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-[22px] [&::-moz-range-thumb]:h-[22px] [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:bg-stamp-purple-dark [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>
        </div>

        <div className="flex gap-1 items-start justify-end w-1/4">
          <button
            className="w-12 h-6 rounded-full bg-stamp-grey flex items-center transition duration-300 focus:outline-none shadow"
            onClick={() => setCoinType(coinType === "BTC" ? "USDT" : "BTC")}
          >
            <div
              className={`w-6 h-6 relative rounded-full transition duration-500 transform bg-stamp-grey text-white ${
                coinType === "BTC" ? "translate-x-full" : ""
              }`}
            >
              {coinType === "BTC" ? btcIcon : usdIcon}
            </div>
          </button>
        </div>
      </div>

      <p className="mt-4 text-xl mobileLg:text-2xl font-light">
        <span className="text-stamp-grey-darker">ESTIMATE</span>{" "}
        {coinType === "BTC"
          ? (
            <>
              <span className="font-bold">
                {formatSatoshisToBTC(totalFee, { includeSymbol: false })}
              </span>{" "}
              BTC
            </>
          )
          : (
            <>
              <span className="font-bold">
                {(Number(
                  formatSatoshisToBTC(totalFee, { includeSymbol: false }),
                ) *
                  BTCPrice).toFixed(2)}
              </span>{" "}
              {coinType}
            </>
          )}
      </p>

      <div
        onClick={() => setVisible(!visible)}
        className="flex items-center mt-2 gap-1 text-xs mobileLg:text-sm text-stamp-grey-darker uppercase cursor-pointer"
      >
        DETAILS
        {!visible
          ? <img src="/img/stamping/CaretDown.svg" />
          : <img src="/img/stamping/CaretDown.svg" className="rotate-180" />}
      </div>

      {visible && (
        <div className="flex flex-col gap-0 mt-1.5">
          <p className="text-xs mobileLg:text-sm font-medium">
            <span className="text-stamp-grey-darker font-light">SIZE</span>{" "}
            {txSize} <span className="font-light">BYTES</span>
          </p>
          <p className="text-xs mobileLg:text-sm font-medium">
            <span className="text-stamp-grey-darker font-light">
              SATS PER BYTE
            </span>{" "}
            {fee}
          </p>
          <p className="text-xs mobileLg:text-sm font-medium">
            <span className="text-stamp-grey-darker font-light">MINER FEE</span>
            {" "}
            {coinType === "BTC"
              ? (
                <>
                  {formatSatoshisToBTC(minerFee, { includeSymbol: false })}{" "}
                  <span className="font-light">BTC</span>
                </>
              )
              : (
                <>
                  {((minerFee / 1e8) * BTCPrice).toFixed(2)}{" "}
                  <span className="font-light">USDT</span>
                </>
              )}
          </p>
          {dustValue > 0 && (
            <p className="text-xs mobileLg:text-sm font-medium">
              <span className="text-stamp-grey-darker font-light">DUST</span>
              {" "}
              {coinType === "BTC"
                ? (
                  <>
                    {formatSatoshisToBTC(dustValue, { includeSymbol: false })}
                    {" "}
                    <span className="font-light">BTC</span>
                  </>
                )
                : (
                  <>
                    {((dustValue / 1e8) * BTCPrice).toFixed(2)}{" "}
                    <span className="font-light">USDT</span>
                  </>
                )}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-6 mt-12">
        {onCancel && (
          <Button
            variant="cancel"
            onClick={onCancel}
            disabled={isSubmitting}
            className="border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-purple tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:text-stamp-purple-highlight transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            CANCEL
          </Button>
        )}
        <Button
          variant="submit"
          onClick={onSubmit}
          disabled={isSubmitting}
          isSubmitting={isSubmitting}
          className="bg-stamp-purple border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-black tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:bg-stamp-purple-highlight transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buttonName}
        </Button>
      </div>
    </div>
  );
}
