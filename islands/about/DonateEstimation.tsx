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

interface DonateFeeDetailsProps {
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

export function DonateEstimation({
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
}: DonateFeeDetailsProps) {
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

  return (
    <div className={`text-[#999999] ${className}`}>
      <div className="flex">
        <div className="w-full">
          <p className="font-bold">
            <span className="text-[#666666] font-light">FEE:</span> {fee} SAT/VB
          </p>
          <p className="font-medium text-xs">
            <span className="text-[#666666] font-light">RECOMMENDED:</span>{" "}
            {fees?.recommendedFee} SAT/VB
          </p>
        </div>
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
      </div>

      <div className="relative w-full">
        <input
          type="range"
          value={fee}
          min="1"
          max="264"
          step="1"
          onInput={(e) =>
            handleChangeFee(parseInt((e.target as HTMLInputElement).value, 10))}
          className="accent-[#5E1BA1] w-full h-[6px] rounded-lg appearance-none cursor-pointer bg-stamp-grey"
        />
      </div>

      <p className="flex font-bold">
        <span className="text-[#666666] font-light uppercase">
          Estimated:{" "}
        </span>
        {coinType === "BTC"
          ? `${totalFee.toFixed(0)} ₿`
          : `${(totalFee / 1e8 * BTCPrice).toFixed(2)} ${coinType}`}
      </p>

      <div
        className="flex items-center gap-2 uppercase cursor-pointer"
        onClick={() => setVisible(!visible)}
      >
        <span>Details</span>
        <span>{visible ? "▼" : "▲"}</span>
      </div>

      {visible && (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-xs font-light text-[#999999]">
            BYTES <span className="font-medium">{txSize}</span>
          </p>
          <p className="text-xs font-light text-[#999999]">
            MINER FEE <span className="font-medium">{minerFee}</span> ₿
          </p>
          {dustValue > 0 && (
            <p className="text-xs font-light text-[#999999]">
              DUST <span className="font-medium">{dustValue}</span> ₿
            </p>
          )}
          <p className="text-xs font-light text-[#999999]">
            TOTAL FEE <span className="font-medium">{totalFee}</span> ₿
          </p>
        </div>
      )}

      <div className="flex justify-end gap-6 mt-4">
        <button
          className="border-2 border-[#8800CC] text-[#8800CC] w-[108px] h-[48px] rounded-md font-extrabold"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          CANCEL
        </button>
        <button
          className="bg-[#8800CC] text-[#330033] w-[84px] h-[48px] rounded-md font-extrabold"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : buttonName}
        </button>
      </div>
    </div>
  );
}
