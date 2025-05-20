import { TX_CONSTANTS } from "./constants.ts";
import type {
  // InputTypeForSizeEstimation, // Removed as unused
  // OutputTypeForSizeEstimation, // Removed as unused
  ScriptType,
  // ScriptTypeInfo, // Removed as unused
} from "$lib/types/transaction.d.ts";
import { getScriptTypeInfo as getScriptTypeInfoFromUtils } from "$lib/utils/scriptTypeUtils.ts";
import { logger } from "$lib/utils/logger.ts";

// Using imported types for the options if they resolve correctly
interface InternalTransactionSizeOptions {
  inputs: Array<
    {
      type: ScriptType;
      isWitness?: boolean;
      size?: number;
      ancestor?: { txid: string; vout: number; weight?: number };
    }
  >;
  outputs: Array<{ type: ScriptType }>;
  includeChangeOutput?: boolean;
  changeOutputType?: ScriptType;
}

function calculateWitnessWeight(
  input: { type: ScriptType; isWitness?: boolean },
) {
  if (!input.isWitness) return 0;
  if (
    input.type === "P2WPKH" || input.type === "P2WSH" || input.type === "P2TR"
  ) {
    const stack = TX_CONSTANTS.WITNESS_STACK[input.type];
    if (!stack) {
      logger.warn("system", {
        message: `No WITNESS_STACK entry for type: ${input.type}`,
      });
      return 0;
    }
    switch (input.type) {
      case "P2WPKH":
        return stack.itemsCount + stack.lengthBytes + stack.signature +
          stack.pubkey;
      case "P2WSH":
      case "P2TR":
        return stack.size;
    }
  }
  logger.warn("system", {
    message:
      `calculateWitnessWeight called for unhandled witness type: ${input.type}`,
  });
  return 0;
}

export function estimateTransactionSize({
  inputs,
  outputs,
  includeChangeOutput = true,
  changeOutputType = "P2WPKH",
}: InternalTransactionSizeOptions): number {
  let weight = (TX_CONSTANTS.VERSION + TX_CONSTANTS.LOCKTIME) * 4;

  const hasWitness = inputs.some((input) => {
    // If InputTypeForSizeEstimation provides isWitness directly, use it.
    // Otherwise, use getScriptTypeInfo if input only has `type: ScriptType`.
    // The InputTypeForSizeEstimation defined in transaction.d.ts has isWitness?: boolean
    return getScriptTypeInfoFromUtils(input.type).isWitness;
  });

  if (hasWitness) {
    weight += (TX_CONSTANTS.MARKER + TX_CONSTANTS.FLAG) * 4;
  }

  const inputWeights = inputs.map((input) => {
    let inputWeight = 0;
    if (input.isWitness) {
      const outpointWeight = 36 * 4;
      const sequenceWeight = 4 * 4;
      const scriptSigWeight = 1 * 4;
      const witnessWeightVal = calculateWitnessWeight({
        type: input.type,
        isWitness: true,
      });
      inputWeight = outpointWeight + sequenceWeight + scriptSigWeight +
        witnessWeightVal;
    } else {
      const size = TX_CONSTANTS[
        input.type as Exclude<
          ScriptType,
          "OP_RETURN" | "UNKNOWN" | "P2WPKH" | "P2WSH" | "P2TR"
        >
      ]?.size;
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

  const outputWeights = outputs.map((output) => {
    const baseWeight = 9 * 4;
    let scriptWeight = 0;
    const size =
      TX_CONSTANTS[output.type as Exclude<ScriptType, "OP_RETURN" | "UNKNOWN">]
        ?.size;
    if (size !== undefined) {
      scriptWeight = size * 4;
    } else { // Fallback for types like OP_RETURN or if not in constants
      logger.warn("system", {
        message:
          `No size in TX_CONSTANTS for output type: ${output.type}, using P2PKH default size component`,
      });
      scriptWeight = TX_CONSTANTS.P2PKH.size * 4; // Default placeholder
      if (output.type === "OP_RETURN") scriptWeight = (1 + 40) * 4; // Approx. OP_RETURN with 40 bytes data
    }
    return baseWeight + scriptWeight;
  });

  const totalOutputWeight = outputWeights.reduce((sum, w) => sum + w, 0);
  let changeWeight = 0;
  if (includeChangeOutput && changeOutputType) {
    const baseWeight = 9 * 4;
    let scriptSize = 0;
    const size = TX_CONSTANTS[
      changeOutputType as Exclude<ScriptType, "OP_RETURN" | "UNKNOWN">
    ]?.size;
    if (size !== undefined) {
      scriptSize = size;
    } else {
      logger.warn("system", {
        message:
          `No size in TX_CONSTANTS for changeOutput type: ${changeOutputType}, using P2WPKH default size component`,
      });
      scriptSize = TX_CONSTANTS.P2WPKH.size; // Default if not found (e.g. P2WPKH size)
    }
    changeWeight = baseWeight + (scriptSize * 4);
  }

  const totalWeight = weight + totalInputWeight + totalOutputWeight +
    changeWeight;
  const vsize = TX_CONSTANTS.weightToVsize(totalWeight);
  return vsize;
}

export function calculateTransactionFee(
  vsize: number,
  feeRateSatsPerVB: number,
): number {
  return Math.ceil(vsize * feeRateSatsPerVB);
}
