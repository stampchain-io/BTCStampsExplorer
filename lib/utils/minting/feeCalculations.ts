import type { Output } from "$lib/types/index.d.ts";
import { estimateP2WSHTransactionSize } from "./transactionSizes.ts";
import { Buffer } from "buffer";

// Frontend constants
const DUST_SIZE = 333;
const SCRIPT_SIZES = {
  P2PKH: 25,
  P2WPKH: 22,
  P2WSH: 34,
  P2TR: 65,
};

// Frontend-only script size estimation
function getScriptSize(script?: string | Buffer): number {
  // Handle Buffer or convert to string if needed
  const scriptStr = Buffer.isBuffer(script) ? script.toString("hex") : script;

  if (!scriptStr) return SCRIPT_SIZES.P2WPKH; // Default to P2WPKH
  if (typeof scriptStr !== "string") return SCRIPT_SIZES.P2WPKH;

  if (scriptStr.startsWith("76a914")) return SCRIPT_SIZES.P2PKH;
  if (scriptStr.startsWith("0014")) return SCRIPT_SIZES.P2WPKH;
  if (scriptStr.startsWith("0020")) return SCRIPT_SIZES.P2WSH;
  if (scriptStr.startsWith("5120")) return SCRIPT_SIZES.P2TR;

  return scriptStr.length / 2;
}

export function calculateDust(fileSize: number): number {
  const outputCount = Math.ceil(fileSize / 32);
  let totalDust = 0;
  for (let i = 0; i < outputCount; i++) {
    totalDust += DUST_SIZE + i;
  }
  return totalDust;
}

export function estimateTransactionVSize(fileSize: number): number {
  // Constants for transaction sizes in bytes
  const VERSION_SIZE = 4;
  const MARKER_SIZE = 1;
  const FLAG_SIZE = 1;
  const LOCKTIME_SIZE = 4;

  // Assume 1 input from the user's wallet
  const INPUT_COUNT = 1;

  // Calculate the number of data outputs based on file size (one output per 32 bytes)
  const dataOutputCount = Math.ceil(fileSize / 32);

  // Include 1 change output
  const changeOutputCount = 1;

  const totalOutputCount = dataOutputCount + changeOutputCount;

  // Calculate VarInt sizes for input and output counts
  const inputCountSize = INPUT_COUNT < 253 ? 1 : 3; // VarInt size for inputs
  const outputCountSize = totalOutputCount < 253 ? 1 : 3; // VarInt size for outputs

  // Input sizes (non-witness and witness data)
  const INPUT_NONWITNESS_SIZE = 36 + 1 + 4; // Previous output (32+4 bytes), script length (1 byte), sequence (4 bytes)
  const INPUT_WITNESS_SIZE = 107; // Witness data size for P2WPKH input

  // Output sizes
  const DATA_OUTPUT_SIZE = 8 + 1 + 34; // Amount (8 bytes), script length (1 byte), scriptPubKey (34 bytes for P2WSH)
  const CHANGE_OUTPUT_SIZE = 8 + 1 + 22; // Amount (8 bytes), script length (1 byte), scriptPubKey (22 bytes for P2WPKH)

  // Total sizes
  const baseSize = VERSION_SIZE + inputCountSize + outputCountSize +
    LOCKTIME_SIZE;
  const inputsSize = INPUT_COUNT * INPUT_NONWITNESS_SIZE;
  const outputsSize = dataOutputCount * DATA_OUTPUT_SIZE +
    changeOutputCount * CHANGE_OUTPUT_SIZE;

  const totalNonWitnessSize = baseSize + inputsSize + outputsSize;

  // Calculate weight units (WU)
  const totalNonWitnessWeight = totalNonWitnessSize * 4; // Non-witness data weight factor is 4
  const totalWitnessSize = MARKER_SIZE + FLAG_SIZE +
    INPUT_COUNT * INPUT_WITNESS_SIZE;
  const totalWitnessWeight = totalWitnessSize * 1; // Witness data weight factor is 1

  const totalWeight = totalNonWitnessWeight + totalWitnessWeight;

  // Convert weight units to virtual bytes (vbytes)
  const virtualSize = Math.ceil(totalWeight / 4);

  return virtualSize;
}

export function calculateMiningFee(
  fileSize: number,
  feeSatsPerVByte: number,
): number {
  const vsize = estimateP2WSHTransactionSize(fileSize);
  return vsize * feeSatsPerVByte;
}

export function estimateFee(outputs: Output[], feeRate: number): number {
  const outputSize = outputs.reduce((acc, output) => {
    // Handle both script and address cases
    const scriptSize = output.script
      ? getScriptSize(output.script)
      : SCRIPT_SIZES.P2WPKH; // Default for address-only outputs

    return acc + (8 + 1 + scriptSize); // 8 bytes value, 1 byte script length
  }, 0);

  const transactionOverhead = 10; // Version, locktime, segwit marker
  const estimatedInputSize = 68; // Assume P2WPKH input
  const totalSize = outputSize + transactionOverhead + estimatedInputSize;

  return Math.ceil(totalSize * feeRate);
}
