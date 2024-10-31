import type {
  AncestorInfo,
  FeeEstimationParams,
  FeeEstimationResult,
  TransactionInput,
  TransactionOutput,
} from "$types/index.d.ts";
import { TX_CONSTANTS } from "./constants.ts";
import {
  calculateDust,
  calculateMiningFee,
} from "$lib/utils/minting/feeCalculations.ts";
import { detectScriptType } from "$lib/utils/scriptTypeUtils.ts";

interface EnhancedFeeEstimationParams extends FeeEstimationParams {
  userAddress?: string;
  utxoAncestors?: AncestorInfo[];
}

export function calculateTransactionFees({
  type,
  fileSize = 0,
  userAddress,
  outputTypes = ["P2WSH"],
  feeRate,
  isMultisig = false,
  utxoAncestors = [],
}: EnhancedFeeEstimationParams): FeeEstimationResult {
  const detectedInputType = userAddress
    ? detectScriptType(userAddress)
    : "P2WPKH";
  const outputs: TransactionOutput[] = [];
  let dustValue = 0;

  if (type === "stamp") {
    // Calculate CIP33 outputs
    const dataChunks = Math.ceil(fileSize / 32);

    // Add issuance output
    outputs.push({
      type: "P2PKH", // Issuance output type
      value: TX_CONSTANTS.DUST_SIZE,
      isWitness: false,
      size: TX_CONSTANTS.P2PKH.size,
    });

    // Add CIP33 data outputs
    for (let i = 0; i < dataChunks; i++) {
      outputs.push({
        type: "P2WSH",
        value: TX_CONSTANTS.DUST_SIZE + i, // Match the actual dust calculation
        isWitness: true,
        size: TX_CONSTANTS.P2WSH.size,
      });
    }

    // Add service fee output
    outputs.push({
      type: "P2WPKH",
      value: TX_CONSTANTS.DUST_SIZE,
      isWitness: true,
      size: TX_CONSTANTS.P2WPKH.size,
    });

    // Calculate total dust
    dustValue = outputs.reduce((sum, output) => sum + output.value, 0);
  }

  const inputs: TransactionInput[] = [{
    type: detectedInputType,
    isWitness: TX_CONSTANTS[detectedInputType].isWitness,
    size: TX_CONSTANTS[detectedInputType].size,
    ancestor: utxoAncestors?.[0]?.ancestor,
  }];

  const minerFee = calculateMiningFee(inputs, outputs, feeRate, {
    includeChangeOutput: true,
    changeOutputType: detectedInputType,
  });

  return {
    minerFee,
    dustValue,
    outputs,
    detectedInputType,
  };
}
