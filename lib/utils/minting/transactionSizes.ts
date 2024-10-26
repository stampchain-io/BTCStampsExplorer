// Shared constants for both frontend and backend
export const TX_SIZES = {
  VERSION: 4,
  MARKER: 1,
  FLAG: 1,
  LOCKTIME: 4,
  P2WSH_OUTPUT: 43, // 8 (value) + 1 (script length) + 34 (script)
  P2WPKH_OUTPUT: 31, // 8 (value) + 1 (script length) + 22 (script)
  P2WSH_INPUT: 41, // Previous output (36) + sequence (4) + script length (1)
  WITNESS_OVERHEAD: 2, // Count and length fields
  WITNESS_STACK_ITEM: 107, // Typical witness stack size for P2WSH
  P2PKH_INPUT: 148, // Previous output (36) + script length (1) + scriptSig (107) + sequence (4)
  P2SH_INPUT: 297, // Previous output (36) + script length (1) + scriptSig (256) + sequence (4)
  P2TR_INPUT: 65, // Taproot input size

  // Helper method for weight to vbyte conversion
  weightToVsize(weight: number): number {
    return Math.ceil(weight / 4);
  },
};

export function estimateP2WSHTransactionSize(fileSize: number): number {
  const dataOutputCount = Math.ceil(fileSize / 32);
  const changeOutputCount = 1;
  const inputCount = 1; // Assume one input for estimation

  const baseSize = TX_SIZES.VERSION + TX_SIZES.LOCKTIME;
  const witnessSize = TX_SIZES.MARKER + TX_SIZES.FLAG +
    (inputCount * TX_SIZES.WITNESS_STACK_ITEM);

  const outputsSize = (dataOutputCount * TX_SIZES.P2WSH_OUTPUT) +
    (changeOutputCount * TX_SIZES.P2WPKH_OUTPUT);

  const inputsSize = inputCount * TX_SIZES.P2WSH_INPUT;

  // Calculate weight units
  const totalWeight = (baseSize + inputsSize + outputsSize) * 4 + witnessSize;

  // Convert to vbytes
  return Math.ceil(totalWeight / 4);
}
