/**
 * MARA Mode Transaction Size Estimator
 *
 * Accurately estimates transaction sizes for MARA mode with dynamic dust values
 * for P2WSH outputs (1-333 sats based on user choice).
 */

import type { ScriptType } from "$lib/types/index.d.ts";
import { TX_CONSTANTS } from "$constants";
import { logger } from "$lib/utils/monitoring/logging/logger.ts";

export interface MARATransactionEstimateConfig {
  // Input configuration
  inputs: Array<{
    type: ScriptType;
    isWitness?: boolean;
  }>;

  // Stamp-specific parameters
  fileSize: number; // Size of the file in bytes
  outputValue: number; // Dust value per P2WSH output (1-333)

  // Service fee configuration
  includeServiceFee: boolean;
  serviceFeeType?: ScriptType;

  // Change output
  includeChangeOutput: boolean;
  changeOutputType?: ScriptType;

  // MARA specific
  isMaraMode: boolean;
  maraFeeRate: number; // sats/vB
}

/**
 * Calculate the number of CIP33 chunks needed for a file
 */
export function calculateCIP33ChunkCount(fileSize: number): number {
  // Each chunk holds ~32 bytes of data
  return Math.ceil(fileSize / 32);
}

/**
 * Calculate the size of a P2WSH output in vBytes
 * P2WSH outputs are 43 vBytes each
 */
export function getP2WSHOutputSize(): number {
  return 43;
}

/**
 * Calculate the total dust value needed for all P2WSH outputs
 */
export function calculateTotalDustValue(
  chunkCount: number,
  outputValue: number,
): number {
  return chunkCount * outputValue;
}

/**
 * Estimate transaction size for MARA mode transactions
 * Provides accurate estimation for variable dust values
 */
export function estimateMARATransactionSize(
  config: MARATransactionEstimateConfig,
): {
  estimatedSize: number; // in vBytes
  estimatedWeight: number; // in weight units
  chunkCount: number;
  totalDustValue: number;
  estimatedFee: number;
  breakdown: {
    base: number;
    inputs: number;
    opReturn: number;
    dataOutputs: number;
    serviceFee: number;
    change: number;
    total: number;
  };
} {
  const {
    inputs,
    fileSize,
    outputValue,
    includeServiceFee,
    serviceFeeType = "P2WPKH",
    includeChangeOutput,
    changeOutputType = "P2WPKH",
    maraFeeRate,
  } = config;

  // Calculate CIP33 chunks
  const chunkCount = calculateCIP33ChunkCount(fileSize);
  const totalDustValue = calculateTotalDustValue(chunkCount, outputValue);

  // Start with base transaction overhead
  let totalWeight = (TX_CONSTANTS.VERSION + TX_CONSTANTS.LOCKTIME) * 4; // 10 * 4 = 40

  // Check if we have witness inputs
  const hasWitness = inputs.some((input) =>
    input.isWitness || input.type.toUpperCase().includes("P2W")
  );

  if (hasWitness) {
    // Add witness marker and flag
    totalWeight += (TX_CONSTANTS.MARKER + TX_CONSTANTS.FLAG) * 4; // 2 * 4 = 8
  }

  // Calculate input weights
  let inputWeight = 0;
  for (const input of inputs) {
    if (input.isWitness || input.type.toUpperCase().includes("P2W")) {
      // P2WPKH input: 41 bytes base + 27 witness bytes
      // Base: outpoint (36) + sequence (4) + script length (1)
      inputWeight += 41 * 4 + 27; // 164 + 27 = 191 weight units
    } else {
      // P2PKH input: ~148 bytes
      inputWeight += 148 * 4; // 592 weight units
    }
  }

  // Calculate output weights
  let outputWeight = 0;

  // 1. OP_RETURN output (for Counterparty issuance)
  outputWeight += 43 * 4; // 172 weight units

  // 2. P2WSH outputs for CIP33 data
  outputWeight += chunkCount * getP2WSHOutputSize() * 4; // 43 * 4 = 172 per output

  // 3. Service fee output (if applicable)
  if (includeServiceFee) {
    if (serviceFeeType === "P2WPKH") {
      outputWeight += 31 * 4; // 124 weight units
    } else if (serviceFeeType === "P2PKH") {
      outputWeight += 34 * 4; // 136 weight units
    }
  }

  // 4. Change output (if applicable)
  if (includeChangeOutput) {
    if (changeOutputType === "P2WPKH") {
      outputWeight += 31 * 4; // 124 weight units
    } else if (changeOutputType === "P2PKH") {
      outputWeight += 34 * 4; // 136 weight units
    }
  }

  // Calculate total weight
  totalWeight += inputWeight + outputWeight;

  // Convert weight to vBytes
  const estimatedSize = Math.ceil(totalWeight / 4);

  // Calculate estimated fee
  const estimatedFee = Math.ceil(estimatedSize * maraFeeRate);

  // Create breakdown for debugging
  const breakdown = {
    base: 10,
    inputs: Math.ceil(inputWeight / 4),
    opReturn: 43,
    dataOutputs: chunkCount * 43,
    serviceFee: includeServiceFee ? 31 : 0,
    change: includeChangeOutput ? 31 : 0,
    total: estimatedSize,
  };

  logger.info("mara", {
    message: "MARA transaction size estimation",
    config,
    chunkCount,
    totalDustValue,
    estimatedSize,
    estimatedWeight: totalWeight,
    estimatedFee,
    breakdown,
  });

  return {
    estimatedSize,
    estimatedWeight: totalWeight,
    chunkCount,
    totalDustValue,
    estimatedFee,
    breakdown,
  };
}

/**
 * Validate outputValue parameter for MARA mode
 */
export function validateMARAOutputValue(outputValue: number): {
  isValid: boolean;
  isMaraMode: boolean;
  error?: string;
} {
  if (outputValue < 1) {
    return {
      isValid: false,
      isMaraMode: false,
      error: "Output value must be at least 1 satoshi",
    };
  }

  if (outputValue > 5000) {
    return {
      isValid: false,
      isMaraMode: false,
      error: "Output value cannot exceed 5000 satoshis",
    };
  }

  // MARA mode is activated for outputValue < 330
  const isMaraMode = outputValue < 330;

  return {
    isValid: true,
    isMaraMode,
  };
}

/**
 * Calculate the minimum funding needed for a MARA transaction
 */
export function calculateMinimumFunding(config: {
  fileSize: number;
  outputValue: number;
  maraFeeRate: number;
  includeServiceFee: boolean;
  serviceFeeAmount?: number;
  estimatedInputCount?: number;
}): {
  minimumFunding: number;
  breakdown: {
    dustTotal: number;
    serviceFee: number;
    estimatedMinerFee: number;
    buffer: number;
  };
} {
  const {
    fileSize,
    outputValue,
    maraFeeRate,
    includeServiceFee,
    serviceFeeAmount = 42000, // MARA service fee
    estimatedInputCount = 3, // Assume 3 inputs for realistic estimation
  } = config;

  const chunkCount = calculateCIP33ChunkCount(fileSize);
  const dustTotal = calculateTotalDustValue(chunkCount, outputValue);
  const serviceFee = includeServiceFee ? serviceFeeAmount : 0;

  // Estimate transaction size with realistic inputs
  const txEstimate = estimateMARATransactionSize({
    inputs: Array(estimatedInputCount).fill({
      type: "P2WPKH",
      isWitness: true,
    }),
    fileSize,
    outputValue,
    includeServiceFee,
    includeChangeOutput: true,
    isMaraMode: outputValue < 330,
    maraFeeRate,
  });

  const estimatedMinerFee = txEstimate.estimatedFee;
  const buffer = Math.ceil(estimatedMinerFee * 0.1); // 10% buffer

  const minimumFunding = dustTotal + serviceFee + estimatedMinerFee + buffer;

  return {
    minimumFunding,
    breakdown: {
      dustTotal,
      serviceFee,
      estimatedMinerFee,
      buffer,
    },
  };
}
