import type {
  AncestorInfo,
  FeeEstimationParams,
  FeeEstimationResult,
  ScriptType,
  TransactionInput,
  TransactionOutput,
} from "$types/index.d.ts";
import { TX_CONSTANTS } from "./constants.ts";
import { calculateMiningFee } from "$lib/utils/minting/feeCalculations.ts";
import {
  detectScriptType,
  getScriptTypeInfo,
} from "$lib/utils/scriptTypeUtils.ts";
import { estimateTransactionSize } from "./transactionSizes.ts";
import { logger } from "$lib/utils/logger.ts";

interface EnhancedFeeEstimationParams extends FeeEstimationParams {
  userAddress?: string;
  utxoAncestors?: AncestorInfo[];
  isMultisig?: boolean;
}

export async function calculateTransactionFees({
  type,
  fileSize = 0,
  userAddress,
  outputTypes = ["P2WSH"],
  feeRate,
  isMultisig = false,
  utxoAncestors = [],
}: EnhancedFeeEstimationParams): Promise<FeeEstimationResult> {
  // For SRC-20, we don't calculate here - it's handled by the PSBT service
  if (type === "src20") {
    logger.debug("stamps", {
      message: "SRC-20 fee calculation bypassed - handled by PSBT service",
    });
    return {
      minerFee: 0,
      dustValue: 0,
      outputs: [],
      detectedInputType: isMultisig ? "P2SH" : "P2WPKH",
    };
  }

  // For all other transaction types (stamps, etc), use local calculation
  logger.debug("stamps", {
    message: "Using local fee calculation",
    type,
  });
  return calculateLocalFees({
    type,
    fileSize,
    userAddress,
    outputTypes,
    feeRate,
    isMultisig,
    utxoAncestors,
  });
}

// Local fee calculation function
function calculateLocalFees(
  params: EnhancedFeeEstimationParams,
): FeeEstimationResult {
  const { type, fileSize = 0, userAddress, isMultisig = false } = params;

  const detectedInputType = userAddress
    ? detectScriptType(userAddress)
    : "P2WPKH";
  const outputs: TransactionOutput[] = [];
  let dustValue = 0;

  // Handle SRC-20 deployments
  if (type === "src20") {
    // Add first output (real pubkey)
    outputs.push({
      type: isMultisig ? "P2SH" : "P2WPKH",
      value: TX_CONSTANTS.SRC20_DUST,
      isWitness: !isMultisig,
      size: getScriptTypeInfo(isMultisig ? "P2SH" : "P2WPKH").size,
    });

    // Calculate CIP33 outputs
    const numCIP33Outputs = Math.ceil(fileSize / 520); // Each output can hold ~520 bytes

    // Add CIP33 outputs (fake pubkeys)
    for (let i = 0; i < numCIP33Outputs; i++) {
      outputs.push({
        type: "P2WSH",
        value: TX_CONSTANTS.SRC20_DUST + i,
        isWitness: true,
        size: getScriptTypeInfo("P2WSH").size,
      });
    }

    // Calculate dust value
    dustValue = outputs.reduce((sum, output) => sum + output.value, 0);
  } else if (type === "stamp") {
    // Original stamp logic
    const dataChunks = Math.ceil(fileSize / 32);

    // Add initial P2PKH output
    outputs.push({
      type: "P2PKH",
      value: TX_CONSTANTS.DUST_SIZE,
      isWitness: false,
      size: getScriptTypeInfo("P2PKH").size,
    });

    // Add data outputs
    for (let i = 0; i < dataChunks; i++) {
      outputs.push({
        type: "P2WSH",
        value: TX_CONSTANTS.DUST_SIZE + i,
        isWitness: true,
        size: getScriptTypeInfo("P2WSH").size,
      });
    }

    // Add service fee output
    outputs.push({
      type: "P2WPKH",
      value: TX_CONSTANTS.DUST_SIZE,
      isWitness: true,
      size: getScriptTypeInfo("P2WPKH").size,
    });

    dustValue = outputs.reduce((sum, output) => sum + output.value, 0);
  }

  // Create input with proper script type info
  const inputScriptInfo = getScriptTypeInfo(detectedInputType);
  const inputs: TransactionInput[] = [{
    type: detectedInputType as ScriptType,
    isWitness: inputScriptInfo.isWitness,
    size: inputScriptInfo.size,
    ancestor: params.utxoAncestors?.[0],
  }];

  // Use transactionSizes utility to get accurate size
  const estimatedSize = estimateTransactionSize({
    inputs: inputs.map((input) => ({
      type: input.type,
      isWitness: input.isWitness,
      size: input.size,
      ancestor: input.ancestor,
    })),
    outputs: outputs.map((output) => ({
      type: output.type as ScriptType,
      value: output.value,
      isWitness: output.isWitness,
      size: output.size,
    })),
    includeChangeOutput: true,
    changeOutputType: detectedInputType as ScriptType,
  });

  // Calculate final miner fee
  const minerFee = calculateMiningFee(inputs, outputs, params.feeRate, {
    includeChangeOutput: true,
    changeOutputType: detectedInputType as ScriptType,
  });

  return {
    minerFee,
    dustValue,
    outputs,
    detectedInputType: detectedInputType as ScriptType,
    estimatedSize,
  };
}
