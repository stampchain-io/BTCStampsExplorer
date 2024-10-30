import { TX_CONSTANTS } from "./constants.ts";
import type { ScriptType, TransactionSizeOptions } from "$types/index.d.ts";
import { getScriptTypeInfo } from "$lib/utils/scriptTypeUtils.ts";

export function estimateTransactionSize({
  inputs,
  outputs,
  includeChangeOutput = true,
  changeOutputType = "P2WPKH",
}: TransactionSizeOptions): number {
  // Base transaction size
  let size = TX_CONSTANTS.VERSION + TX_CONSTANTS.LOCKTIME;

  // Check if any input is witness
  const hasWitness = inputs.some((input) => {
    const scriptInfo = getScriptTypeInfo(input.type);
    return scriptInfo.isWitness;
  });

  // Add marker and flag if transaction has witness data
  if (hasWitness) {
    size += TX_CONSTANTS.MARKER + TX_CONSTANTS.FLAG;
  }

  // Add input sizes
  const inputSizes = inputs.reduce((sum, input) => {
    const scriptInfo = getScriptTypeInfo(input.type);
    return sum + scriptInfo.size;
  }, 0);
  size += inputSizes;

  // Add output sizes
  const outputSizes = outputs.reduce((sum, output) => {
    const scriptInfo = getScriptTypeInfo(output.type);
    return sum + scriptInfo.size;
  }, 0);
  size += outputSizes;

  // Add change output if needed
  if (includeChangeOutput) {
    const changeScriptInfo = getScriptTypeInfo(changeOutputType);
    size += changeScriptInfo.size;
  }

  // Convert to virtual size (weight units / 4)
  return TX_CONSTANTS.weightToVsize(size);
}
