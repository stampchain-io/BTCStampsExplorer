import { TX_CONSTANTS } from "$constants";
import type { ScriptType } from "$lib/types/index.d.ts";
import { logger } from "$lib/utils/logger.ts";
import { getScriptTypeInfo as getScriptTypeInfoFromUtils } from "$lib/utils/bitcoin/scripts/scriptTypeUtils.ts";

// Using imported types for the options if they resolve correctly
interface InternalTransactionSizeOptions {
  inputs: Array<
    {
      type?: ScriptType;
      isWitness?: boolean;
      size?: number;
      ancestor?: { txid: string; vout: number; weight?: number };
    }
  >;
  outputs: Array<{ type?: ScriptType }>;
  includeChangeOutput?: boolean;
  changeOutputType?: ScriptType;
}

function calculateWitnessWeight(
  input: { type: ScriptType; isWitness?: boolean },
) {
  if (!input.isWitness) return 0;
  // Normalize script type to uppercase for comparison
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
        p2wpkhStack.signature +
        p2wpkhStack.pubkey;
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

export function estimateMintingTransactionSize({
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
    return input.type
      ? getScriptTypeInfoFromUtils(input.type).isWitness
      : false;
  });

  if (hasWitness) {
    weight += (TX_CONSTANTS.MARKER + TX_CONSTANTS.FLAG) * 4;
  }

  const inputWeights = inputs.map((input) => {
    let inputWeight = 0;
    if (
      input.isWitness ??
        (input.type ? getScriptTypeInfoFromUtils(input.type).isWitness : false)
    ) {
      const outpointWeight = 36 * 4;
      const sequenceWeight = 4 * 4;
      const scriptSigWeight = 1 * 4;
      const witnessWeightVal = calculateWitnessWeight({
        type: input.type ?? "UNKNOWN",
        isWitness: true,
      });
      inputWeight = outpointWeight + sequenceWeight + scriptSigWeight +
        witnessWeightVal;
    } else {
      const nonConstSizes = ["P2PKH", "P2SH"] as const;
      const size = input.type &&
          nonConstSizes.includes(input.type as (typeof nonConstSizes)[number])
        ? TX_CONSTANTS[input.type as (typeof nonConstSizes)[number]]?.size
        : undefined;
      if (size === undefined) {
        logger.warn("system", {
          message: `No size in TX_CONSTANTS for non-witness type: ${
            input.type ?? "UNDEFINED"
          }, using P2PKH default`,
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
    const baseWeight = 8 * 4; // 8 bytes for amount
    let scriptWeight = 0;

    // Output script sizes are different from input sizes
    // P2PKH output: 25 bytes (DUP HASH160 <20 bytes> EQUALVERIFY CHECKSIG)
    // P2WPKH output: 22 bytes (OP_0 <20 bytes>)
    // P2WSH output: 34 bytes (OP_0 <32 bytes>)
    // P2SH output: 23 bytes (HASH160 <20 bytes> EQUAL)
    // P2TR output: 34 bytes (OP_1 <32 bytes>)

    switch (output.type?.toUpperCase() ?? "UNKNOWN") {
      case "P2PKH":
        scriptWeight = 25 * 4;
        break;
      case "P2WPKH":
        scriptWeight = 22 * 4;
        break;
      case "P2WSH":
        scriptWeight = 34 * 4;
        break;
      case "P2SH":
        scriptWeight = 23 * 4;
        break;
      case "P2TR":
        scriptWeight = 34 * 4;
        break;
      case "OP_RETURN":
        // OP_RETURN with ~40 bytes of data
        scriptWeight = 43 * 4; // 1 (length) + 1 (OP_RETURN) + 1 (push length) + 40 (data)
        break;
      default:
        logger.warn("system", {
          message: `Unknown output type: ${
            output.type ?? "UNDEFINED"
          }, using P2WPKH default`,
        });
        scriptWeight = 22 * 4; // Default to P2WPKH
    }

    const totalWeight = baseWeight + 1 * 4 + scriptWeight; // +1 for script length varint
    return totalWeight;
  });

  const totalOutputWeight = outputWeights.reduce((sum, w) => sum + w, 0);
  let changeWeight = 0;
  if (includeChangeOutput && changeOutputType) {
    const baseWeight = 8 * 4; // 8 bytes for amount
    let scriptWeight = 0;

    switch (changeOutputType.toUpperCase()) {
      case "P2PKH":
        scriptWeight = 25 * 4;
        break;
      case "P2WPKH":
        scriptWeight = 22 * 4;
        break;
      case "P2WSH":
        scriptWeight = 34 * 4;
        break;
      case "P2SH":
        scriptWeight = 23 * 4;
        break;
      case "P2TR":
        scriptWeight = 34 * 4;
        break;
      default:
        logger.warn("system", {
          message:
            `Unknown change output type: ${changeOutputType}, using P2WPKH default`,
        });
        scriptWeight = 22 * 4; // Default to P2WPKH
    }

    changeWeight = baseWeight + 1 * 4 + scriptWeight; // +1 for script length varint
  }

  const totalWeight = weight + totalInputWeight + totalOutputWeight +
    changeWeight;
  const vsize = TX_CONSTANTS.weightToVsize(totalWeight);
  return vsize;
}

// Backward compatibility wrapper for tests
export function estimateTransactionSize(
  options: InternalTransactionSizeOptions,
): number {
  return estimateMintingTransactionSize(options);
}

export function calculateTransactionFee(
  vsize: number,
  feeRateSatsPerVB: number,
): number {
  return Math.ceil(vsize * feeRateSatsPerVB);
}
