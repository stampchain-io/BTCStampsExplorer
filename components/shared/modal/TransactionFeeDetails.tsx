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

  return (
    <div className={`text-[#999999] ${className}`}>
      <div className="flex">
        <div className="w-full">
          <p className="font-bold">
            <span className="text-[#666666] font-light">FEE:</span> {fee} sat/vB
          </p>
          <p className="font-medium text-xs">
            <span className="text-[#666666] font-light">RECOMMENDED:</span>{" "}
            {fees?.recommendedFee} sat/vB
          </p>
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
          className="accent-[#5E1BA1] w-full h-[6px] rounded-lg appearance-none cursor-pointer bg-[#3F2A4E]"
        />
      </div>

      <p className="flex font-bold">
        <span className="text-[#666666] font-light uppercase">
          Estimated:{" "}
        </span>
        {coinType === "BTC"
          ? `${totalFee.toFixed(0)} sats`
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
            MINER FEE <span className="font-medium">{minerFee}</span> SATS
          </p>
          {dustValue > 0 && (
            <p className="text-xs font-light text-[#999999]">
              DUST <span className="font-medium">{dustValue}</span> SATS
            </p>
          )}
          <p className="text-xs font-light text-[#999999]">
            TOTAL FEE <span className="font-medium">{totalFee}</span> SATS
          </p>
        </div>
      )}

      <div className="flex justify-end gap-6 mt-4">
        {onCancel && (
          <Button
            variant="cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            CANCEL
          </Button>
        )}
        <Button
          variant="submit"
          onClick={onSubmit}
          disabled={isSubmitting}
          isSubmitting={isSubmitting}
        >
          {buttonName}
        </Button>
      </div>
    </div>
  );
}
