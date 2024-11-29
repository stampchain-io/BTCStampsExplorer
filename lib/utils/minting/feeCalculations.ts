import { TX_CONSTANTS } from "./constants.ts";
import { estimateTransactionSize } from "./transactionSizes.ts";
import type {
  AncestorInfo,
  Output,
  ScriptType,
  TransactionInput,
  TransactionOutput,
} from "$lib/types/index.d.ts";
import { detectScriptType } from "$lib/utils/scriptTypeUtils.ts";

// Frontend-specific calculations
export function calculateDust(fileSize: number): number {
  const outputCount = Math.ceil(fileSize / 32);
  return outputCount * TX_CONSTANTS.DUST_SIZE;
}

function determineOutputType(output: Output): ScriptType {
  if ("script" in output) {
    return detectScriptType(output.script);
  }
  if ("address" in output && output.address) {
    return detectScriptType(output.address);
  }
  return "P2WPKH";
}

// Frontend estimation with more dynamic input handling
export function estimateFee(
  outputs: Output[],
  feeRate: number,
  inputCount = 1,
  utxoAncestors?: AncestorInfo[],
): number {
  // Consider ancestors in fee calculation
  const ancestorFees =
    utxoAncestors?.reduce((sum, info) => sum + (info.fees || 0), 0) || 0;
  const baseEstimate = calculateBaseFee(outputs, feeRate, inputCount);

  return baseEstimate + ancestorFees;
}

// Calculate actual fee rate considering ancestors
function calculateActualFeeRate(
  inputs: Array<TransactionInput>,
  txSize: number,
  baseFeeRate: number,
): number {
  let totalAncestorFees = 0;
  let totalAncestorSize = 0;

  inputs.forEach((input) => {
    if (input.ancestor) {
      totalAncestorFees += input.ancestor.fees;
      totalAncestorSize += input.ancestor.vsize;
    }
  });

  if (totalAncestorSize === 0) {
    return baseFeeRate;
  }

  // Calculate actual fee rate including ancestors
  const actualRate = (totalAncestorFees + (txSize * baseFeeRate)) /
    (totalAncestorSize + txSize);

  return Math.max(actualRate, baseFeeRate);
}

// Backend precise calculation
export function calculateMiningFee(
  inputs: TransactionInput[],
  outputs: TransactionOutput[],
  feeRate: number,
  options = {
    includeChangeOutput: true,
    changeOutputType: "P2WPKH" as ScriptType,
  },
): number {
  // Calculate transaction size
  const txSize = estimateTransactionSize({
    inputs: inputs.map((input) => ({
      type: input.type,
      isWitness: input.isWitness,
    })),
    outputs: outputs.map((output) => ({
      type: output.type,
      isWitness: output.isWitness,
    })),
    includeChangeOutput: options.includeChangeOutput,
    changeOutputType: options.changeOutputType,
  });

  // Get actual fee rate considering ancestors
  const actualFeeRate = calculateActualFeeRate(inputs, txSize, feeRate);

  return Math.ceil(txSize * actualFeeRate);
}

// For backward compatibility with existing code
export function calculateP2WSHMiningFee(
  fileSize: number,
  feeRate: number,
  includeAncestors = false,
  ancestorInfo?: AncestorInfo,
): number {
  const dataOutputCount = Math.ceil(fileSize / 32);

  const inputs: TransactionInput[] = [{
    type: "P2WPKH",
    size: TX_CONSTANTS.P2WPKH.size,
    isWitness: true,
    ...(includeAncestors && ancestorInfo ? { ancestor: ancestorInfo } : {}),
  }];

  const outputs: TransactionOutput[] = Array(dataOutputCount).fill({
    type: "P2WSH",
    size: TX_CONSTANTS.P2WSH.size,
    isWitness: true,
    value: TX_CONSTANTS.DUST_SIZE,
  });

  return calculateMiningFee(
    inputs,
    outputs,
    feeRate,
    {
      includeChangeOutput: true,
      changeOutputType: "P2WPKH",
    },
  );
}

// Add this function for basic fee calculation
function calculateBaseFee(
  outputs: Output[],
  feeRate: number,
  inputCount = 1,
  inputType: ScriptType = "P2WPKH",
): number {
  const txSize = estimateTransactionSize({
    inputs: Array(inputCount).fill({ type: inputType }),
    outputs: outputs.map((output) => ({
      type: determineOutputType(output),
    })),
    includeChangeOutput: true,
    changeOutputType: inputType,
  });

  return Math.ceil(txSize * feeRate);
}
