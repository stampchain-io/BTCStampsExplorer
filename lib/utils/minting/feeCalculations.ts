const DUST_SIZE = 333;

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

export function estimateP2WSHTransactionSize(fileSize: number): number {
  const outputVB = Math.ceil(fileSize / 32) * 43;
  const overHeadVB = 185; // estimate based on 1 input 1 op return and 2 outputs
  const totalSizeInB = overHeadVB + outputVB;
  return totalSizeInB;
}

export function calculateMiningFee(
  fileSize: number,
  feeSatsPerVByte: number,
): number {
  const totalVSize = estimateTransactionVSize(fileSize);
  const totalMiningFee = totalVSize * feeSatsPerVByte;
  return totalMiningFee;
}
