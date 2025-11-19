/**
 * Bitcoin Transaction Size Estimator - Accurate vByte calculations
 *
 * Provides precise Bitcoin transaction size estimation using actual weight units
 * and proper script type analysis for detailed input/output specifications.
 */

import { TX_CONSTANTS } from "$constants";
import type { ScriptType } from "$lib/types/index.d.ts";
import { logger } from "$lib/utils/logger.ts";

/**
 * Detailed transaction size options for precise calculation
 */
export interface TransactionSizeOptions {
  inputs: Array<{
    type: ScriptType;
    isWitness?: boolean;
    size?: number;
    ancestor?: { txid: string; vout: number; weight?: number };
  }>;
  outputs: Array<{ type: ScriptType }>;
  includeChangeOutput?: boolean;
  changeOutputType?: ScriptType;
}

/**
 * Calculate witness weight for a specific input type
 */
function calculateWitnessWeight(
  input: { type: ScriptType; isWitness?: boolean },
): number {
  if (!input.isWitness) return 0;

  const normalizedType = input.type?.toUpperCase() ?? "UNKNOWN";
  if (
    normalizedType === "P2WPKH" || normalizedType === "P2WSH" ||
    normalizedType === "P2TR"
  ) {
    const stack =
      TX_CONSTANTS.WITNESS_STACK[normalizedType as "P2WPKH" | "P2WSH" | "P2TR"];
    if (!stack) {
      logger.warn("system", {
        message: `No WITNESS_STACK entry for type: ${normalizedType}`,
      });
      return 0;
    }

    // Type guard to handle union type properly
    if (normalizedType === "P2WPKH" && "itemsCount" in stack) {
      const p2wpkhStack = stack as {
        readonly itemsCount: 1;
        readonly lengthBytes: 2;
        readonly signature: 72;
        readonly pubkey: 33;
      };
      return p2wpkhStack.itemsCount + p2wpkhStack.lengthBytes +
        p2wpkhStack.signature + p2wpkhStack.pubkey;
    } else if (
      (normalizedType === "P2WSH" || normalizedType === "P2TR") &&
      "size" in stack
    ) {
      const sizeStack = stack as { readonly size: number };
      return sizeStack.size;
    }
  }

  logger.warn("system", {
    message:
      `calculateWitnessWeight called for unhandled witness type: ${input.type}`,
  });
  return 0;
}

/**
 * Calculate output script weight for a specific script type
 */
function calculateOutputScriptWeight(
  outputType: ScriptType | undefined,
): number {
  switch (outputType?.toUpperCase() ?? "P2WPKH") {
    case "P2PKH":
      return 25 * 4; // DUP HASH160 <20 bytes> EQUALVERIFY CHECKSIG
    case "P2WPKH":
      return 22 * 4; // OP_0 <20 bytes>
    case "P2WSH":
      return 34 * 4; // OP_0 <32 bytes>
    case "P2SH":
      return 23 * 4; // HASH160 <20 bytes> EQUAL
    case "P2TR":
      return 34 * 4; // OP_1 <32 bytes>
    case "OP_RETURN":
      return 43 * 4; // OP_RETURN + length + data (~40 bytes)
    default:
      logger.warn("system", {
        message: `Unknown output type: ${outputType}, using P2WPKH default`,
      });
      return 22 * 4; // Default to P2WPKH
  }
}

/**
 * Accurate Bitcoin transaction size estimation using weight units
 *
 * This is the most precise method, analyzing each input and output individually.
 * Uses the same weight calculation as Bitcoin Core.
 */
export function estimateTransactionSize(
  options: TransactionSizeOptions,
): number {
  const {
    inputs,
    outputs,
    includeChangeOutput = true,
    changeOutputType = "P2WPKH",
  } = options;

  // Base transaction weight (version + locktime)
  let weight = (TX_CONSTANTS.VERSION + TX_CONSTANTS.LOCKTIME) * 4;

  // Check if transaction has witness data
  const hasWitness = inputs.some((input) => {
    if (input.isWitness !== undefined) {
      return input.isWitness;
    }
    // Directly lookup type in TX_CONSTANTS instead of using getScriptTypeInfo
    const typeInfo = TX_CONSTANTS[input.type as keyof typeof TX_CONSTANTS] as {
      isWitness?: boolean;
    } | undefined;
    return typeInfo?.isWitness ?? false;
  });

  // Add witness marker and flag
  if (hasWitness) {
    weight += (TX_CONSTANTS.MARKER + TX_CONSTANTS.FLAG) * 4;
  }

  // Calculate input weights
  const inputWeights = inputs.map((input) => {
    let inputWeight = 0;
    const isWitness = input.isWitness !== undefined
      ? input.isWitness
      : (TX_CONSTANTS[input.type as keyof typeof TX_CONSTANTS] as {
        isWitness: boolean;
      } | undefined)?.isWitness ?? false;

    if (isWitness) {
      // Witness input: outpoint + sequence + empty script + witness data
      const outpointWeight = 36 * 4; // 32-byte txid + 4-byte vout
      const sequenceWeight = 4 * 4;
      const scriptSigWeight = 1 * 4; // Empty script (just length byte)
      const witnessWeight = calculateWitnessWeight({
        type: input.type,
        isWitness: true,
      });
      inputWeight = outpointWeight + sequenceWeight + scriptSigWeight +
        witnessWeight;
    } else {
      // Non-witness input: outpoint + script + sequence
      const inputType: Exclude<
        ScriptType,
        "OP_RETURN" | "UNKNOWN" | "P2WPKH" | "P2WSH" | "P2TR" | undefined
      > =
        (input.type && input.type !== "OP_RETURN" && input.type !== "UNKNOWN" &&
            input.type !== "P2WPKH" && input.type !== "P2WSH" &&
            input.type !== "P2TR")
          ? input.type
          : "P2PKH"; // Default to P2PKH if type is undefined or excluded
      const size = TX_CONSTANTS[inputType]?.size;

      if (size === undefined) {
        logger.warn("system", {
          message:
            `No size in TX_CONSTANTS for non-witness type: ${input.type}, using P2PKH default`,
        });
        inputWeight = TX_CONSTANTS.P2PKH.size * 4;
      } else {
        inputWeight = size * 4;
      }
    }
    return inputWeight;
  });

  const totalInputWeight = inputWeights.reduce((sum, w) => sum + w, 0);

  // Calculate output weights
  const outputWeights = outputs.map((output) => {
    const baseWeight = 8 * 4; // 8 bytes for amount
    const scriptWeight = calculateOutputScriptWeight(output.type);
    return baseWeight + 1 * 4 + scriptWeight; // +1 for script length varint
  });

  const totalOutputWeight = outputWeights.reduce((sum, w) => sum + w, 0);

  // Add change output if requested
  let changeWeight = 0;
  if (includeChangeOutput && changeOutputType) {
    const baseWeight = 8 * 4;
    const scriptWeight = calculateOutputScriptWeight(changeOutputType);
    changeWeight = baseWeight + 1 * 4 + scriptWeight;
  }

  // Calculate total weight and convert to vBytes
  const totalWeight = weight + totalInputWeight + totalOutputWeight +
    changeWeight;
  return TX_CONSTANTS.weightToVsize(totalWeight);
}

/**
 * Calculate transaction fee based on size and fee rate
 */
export function calculateTransactionFee(
  vsize: number,
  feeRateSatsPerVB: number,
): number {
  return Math.ceil(vsize * feeRateSatsPerVB);
}

/**
 * Quick estimation for frontend fee calculator
 * Uses typical values for different transaction types when exact UTXOs aren't available
 */
export function estimateTransactionSizeForType(
  transactionType: "stamp" | "src20" | "src101" | "send" | "dispense",
  fileSize?: number,
): number {
  // For frontend fee estimation when we don't have actual UTXOs
  // Note: Transaction size depends only on input/output count and types, not values
  const inputType: ScriptType = "P2WPKH"; // Most common
  const inputs = [{ type: inputType, isWitness: true }];

  let outputs: Array<{ type: ScriptType }>;
  switch (transactionType) {
    case "stamp": {
      // Calculate P2WSH outputs needed for stamp data based on file size
      const dataChunks = Math.max(1, Math.ceil((fileSize || 100) / 32));
      outputs = [
        { type: "OP_RETURN" }, // Stamp protocol marker
        ...Array(dataChunks).fill({ type: "P2WSH" }), // Data outputs with custom dust
        { type: "P2WPKH" }, // change
      ];
      break;
    }
    case "src20":
    case "src101": {
      // Estimate data chunks needed (capped at reasonable amount)
      const dataChunks = Math.min(Math.ceil((fileSize || 100) / 32), 5);
      outputs = [
        ...Array(dataChunks).fill({ type: "P2WSH" }),
        { type: "P2WPKH" }, // change
      ];
      break;
    }
    case "send":
      outputs = [{ type: "P2WPKH" }, { type: "P2WPKH" }]; // recipient + change
      break;
    case "dispense":
      outputs = [
        { type: "OP_RETURN" },
        { type: "P2WPKH" }, // recipient
        { type: "P2WPKH" }, // change
      ];
      break;
    default:
      outputs = [{ type: "P2WPKH" }, { type: "P2WPKH" }];
  }

  return estimateTransactionSize({
    inputs,
    outputs,
    includeChangeOutput: false, // Already included in outputs
  });
}
