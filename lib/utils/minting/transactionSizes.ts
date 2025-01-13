import { TX_CONSTANTS } from "./constants.ts";
import type { ScriptType } from "$types/index.d.ts";
import { getScriptTypeInfo } from "$lib/utils/scriptTypeUtils.ts";
import { logger } from "$lib/utils/logger.ts";

interface TransactionSizeOptions {
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

function calculateWitnessWeight(
  input: { type: ScriptType; isWitness?: boolean },
) {
  if (!input.isWitness) return 0;

  const stack = TX_CONSTANTS.WITNESS_STACK[input.type];
  if (!stack) return 0;

  switch (input.type) {
    case "P2WPKH":
      return stack.itemsCount + // witness stack count
        stack.lengthBytes + // length bytes for items
        stack.signature + // signature
        stack.pubkey; // pubkey
    case "P2WSH":
      return stack.size;
    case "P2TR":
      return stack.size;
    default:
      return 0;
  }
}

export function estimateTransactionSize({
  inputs,
  outputs,
  includeChangeOutput = true,
  changeOutputType = "P2WPKH",
}: TransactionSizeOptions): number {
  // Base transaction weight (version + locktime)
  let weight = (TX_CONSTANTS.VERSION + TX_CONSTANTS.LOCKTIME) * 4;

  const hasWitness = inputs.some((input) =>
    getScriptTypeInfo(input.type).isWitness
  );
  if (hasWitness) {
    weight += (TX_CONSTANTS.MARKER + TX_CONSTANTS.FLAG) * 4;
  }

  logger.debug("stamps", {
    message: "Base transaction components",
    data: {
      version: TX_CONSTANTS.VERSION * 4,
      locktime: TX_CONSTANTS.LOCKTIME * 4,
      witnessOverhead: hasWitness
        ? (TX_CONSTANTS.MARKER + TX_CONSTANTS.FLAG) * 4
        : 0,
      totalBase: weight,
    },
  });

  // Calculate input weights
  const inputWeights = inputs.map((input) => {
    const scriptInfo = getScriptTypeInfo(input.type);
    let inputWeight = 0;

    if (scriptInfo.isWitness) {
      // Non-witness data (weight units = bytes * 4)
      const outpointWeight = 36 * 4; // (txid + vout) * 4
      const sequenceWeight = 4 * 4; // nSequence * 4
      const scriptSigWeight = 1 * 4; // Empty scriptSig length * 4

      // Witness data (weight units = bytes * 1)
      const witnessWeight = calculateWitnessWeight(input);

      inputWeight = outpointWeight + sequenceWeight + scriptSigWeight +
        witnessWeight;

      logger.debug("stamps", {
        message: `Witness input weight breakdown for ${input.type}`,
        data: {
          nonWitnessWeight: outpointWeight + sequenceWeight + scriptSigWeight,
          witnessWeight,
          witnessDetails: TX_CONSTANTS.WITNESS_STACK[input.type],
          total: inputWeight,
        },
      });
    } else {
      // Non-witness inputs use TX_CONSTANTS sizes
      inputWeight = TX_CONSTANTS[input.type].size * 4;
      logger.debug("stamps", {
        message: `Non-witness input weight for ${input.type}`,
        data: {
          scriptSize: TX_CONSTANTS[input.type].size,
          weight: inputWeight,
        },
      });
    }
    return inputWeight;
  });

  const totalInputWeight = inputWeights.reduce(
    (sum, weight) => sum + weight,
    0,
  );

  // Calculate output weights using TX_CONSTANTS
  const outputWeights = outputs.map((output) => {
    const scriptInfo = getScriptTypeInfo(output.type);
    const baseWeight = 9 * 4; // value (8) + script length (1) * 4

    let scriptWeight = 0;
    if (scriptInfo.isWitness) {
      // Use TX_CONSTANTS for witness output sizes
      scriptWeight = (output.type === "P2WPKH" ? 22 : 34) * 4;
    } else {
      scriptWeight = TX_CONSTANTS[output.type].size * 4;
    }

    logger.debug("stamps", {
      message: `Output weight breakdown for ${output.type}`,
      data: {
        baseWeight,
        scriptWeight,
        total: baseWeight + scriptWeight,
      },
    });

    return baseWeight + scriptWeight;
  });

  const totalOutputWeight = outputWeights.reduce(
    (sum, weight) => sum + weight,
    0,
  );

  // Add change output using TX_CONSTANTS
  let changeWeight = 0;
  if (includeChangeOutput) {
    const baseWeight = 9 * 4; // value + script length
    const scriptSize = changeOutputType === "P2WPKH" ? 22 : 34;
    changeWeight = baseWeight + (scriptSize * 4);

    logger.debug("stamps", {
      message: "Change output weight breakdown",
      data: {
        type: changeOutputType,
        baseWeight,
        scriptWeight: scriptSize * 4,
        total: changeWeight,
      },
    });
  }

  const totalWeight = weight + totalInputWeight + totalOutputWeight +
    changeWeight;
  const vsize = TX_CONSTANTS.weightToVsize(totalWeight);

  logger.debug("stamps", {
    message: "Final weight calculation breakdown",
    data: {
      baseWeight: weight,
      inputWeight: totalInputWeight,
      outputWeight: totalOutputWeight,
      changeWeight,
      totalWeight,
      vsize,
      effectiveRate: `${vsize} vbytes`,
      inputBreakdown: inputWeights,
      outputBreakdown: outputWeights,
      hasWitness,
      witnessInputCount: inputs.filter((input) =>
        getScriptTypeInfo(input.type).isWitness
      ).length,
    },
  });

  return vsize;
}
