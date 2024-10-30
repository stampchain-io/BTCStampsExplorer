import {
  FeeEstimationParams,
  FeeEstimationResult,
  TransactionOutput,
} from "$types/transaction.d.ts";
import { TX_CONSTANTS } from "./constants.ts";
import { calculateDust, estimateFee } from "./feeCalculations.ts";
import { detectScriptType } from "$lib/utils/scriptTypeUtils.ts";

interface EnhancedFeeEstimationParams extends FeeEstimationParams {
  userAddress?: string;
}

export function calculateTransactionFees({
  type,
  fileSize = 0,
  userAddress,
  outputTypes = ["P2WSH"],
  feeRate,
  isMultisig = false,
}: EnhancedFeeEstimationParams): FeeEstimationResult {
  // Detect input type from address if provided, otherwise default to P2WPKH
  const detectedInputType = userAddress
    ? detectScriptType(userAddress)
    : "P2WPKH";

  let outputs: TransactionOutput[] = [];
  let dustValue = 0;

  switch (type) {
    case "stamp":
      dustValue = calculateDust(fileSize);
      outputs = Array(Math.ceil(fileSize / 32)).fill({
        type: "P2WSH" as const,
        value: TX_CONSTANTS.DUST_SIZE,
        isWitness: TX_CONSTANTS.P2WSH.isWitness,
        size: TX_CONSTANTS.P2WSH.size,
      });
      break;

    case "src20":
      outputs = outputTypes.map((outputType) => ({
        type: outputType,
        value: isMultisig ? TX_CONSTANTS.SRC20_DUST : TX_CONSTANTS.DUST_SIZE,
        isWitness: TX_CONSTANTS[outputType].isWitness,
        size: TX_CONSTANTS[outputType].size,
      }));
      dustValue = outputs.reduce(
        (sum, output) =>
          sum + (output.value <= TX_CONSTANTS.DUST_SIZE ? output.value : 0),
        0,
      );
      break;

    case "fairmint":
    case "transfer":
      outputs = [{
        type: detectedInputType,
        value: TX_CONSTANTS.DUST_SIZE,
        isWitness: TX_CONSTANTS[detectedInputType].isWitness,
        size: TX_CONSTANTS[detectedInputType].size,
      }];
      break;
  }

  const minerFee = estimateFee(outputs, feeRate, 1, detectedInputType);

  return {
    minerFee,
    dustValue,
    outputs,
    detectedInputType,
  };
}
