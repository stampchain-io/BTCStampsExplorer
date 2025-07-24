/**
 * Transaction Size Estimator - Calculate Bitcoin transaction sizes in vBytes
 *
 * Provides accurate vByte estimation for different transaction types used in BTCStampsExplorer.
 * Uses standard Bitcoin transaction size formulas: base_size + (witness_size / 4)
 */

export interface TransactionSizeParams {
  /** Number of inputs in the transaction */
  inputCount: number;
  /** Number of outputs in the transaction */
  outputCount: number;
  /** Transaction type affects size calculation */
  transactionType: "stamp" | "src20" | "src101" | "send" | "dispense";
  /** File size in bytes (for stamp transactions) */
  fileSize?: number;
  /** Whether transaction uses witness data (P2WPKH/P2WSH) */
  hasWitnessData?: boolean;
}

/**
 * Standard Bitcoin transaction component sizes in bytes
 */
const TX_COMPONENT_SIZES = {
  // Base transaction components
  VERSION: 4,
  INPUT_COUNT: 1, // VarInt (usually 1 byte for small counts)
  OUTPUT_COUNT: 1, // VarInt (usually 1 byte for small counts)
  LOCKTIME: 4,

  // Input components (non-witness)
  OUTPOINT: 36, // 32-byte txid + 4-byte vout
  SCRIPT_LENGTH: 1, // VarInt for script length
  SEQUENCE: 4,

  // Output components
  VALUE: 8, // 64-bit value
  SCRIPT_PUBKEY_LENGTH: 1, // VarInt for script length

  // Script sizes
  P2PKH_SCRIPT: 25, // OP_DUP OP_HASH160 <20-byte-hash> OP_EQUALVERIFY OP_CHECKSIG
  P2WPKH_SCRIPT: 22, // OP_0 <20-byte-hash>
  P2WSH_SCRIPT: 34, // OP_0 <32-byte-hash>
  P2SH_SCRIPT: 23, // OP_HASH160 <20-byte-hash> OP_EQUAL
  OP_RETURN_SCRIPT: 83, // OP_RETURN + data (varies, this is typical for stamps)

  // Witness data (counted at 1/4 weight)
  WITNESS_STACK_ITEMS: 1, // Number of witness stack items
  SIGNATURE_LENGTH: 1, // Length prefix for signature
  SIGNATURE: 72, // Typical DER signature size
  PUBKEY_LENGTH: 1, // Length prefix for pubkey
  PUBKEY: 33, // Compressed public key
} as const;

/**
 * Estimate transaction size in vBytes for different transaction types
 */
export function estimateTransactionSize(params: TransactionSizeParams): number {
  const {
    inputCount,
    outputCount,
    transactionType,
    fileSize,
    hasWitnessData = true,
  } = params;

  // Base transaction size (non-witness data)
  let baseSize = TX_COMPONENT_SIZES.VERSION +
    TX_COMPONENT_SIZES.INPUT_COUNT +
    TX_COMPONENT_SIZES.OUTPUT_COUNT +
    TX_COMPONENT_SIZES.LOCKTIME;

  // Input sizes (non-witness)
  baseSize += inputCount * (
    TX_COMPONENT_SIZES.OUTPOINT +
    TX_COMPONENT_SIZES.SCRIPT_LENGTH +
    TX_COMPONENT_SIZES.SEQUENCE
  );

  // Add input script sizes (empty for witness transactions)
  if (hasWitnessData) {
    // Witness transactions have empty input scripts
    baseSize += inputCount * 0;
  } else {
    // Legacy transactions have full scripts in inputs
    baseSize += inputCount * TX_COMPONENT_SIZES.P2PKH_SCRIPT;
  }

  // Output sizes
  baseSize += outputCount * (
    TX_COMPONENT_SIZES.VALUE +
    TX_COMPONENT_SIZES.SCRIPT_PUBKEY_LENGTH
  );

  // Add output script sizes based on transaction type
  baseSize += calculateOutputScriptSizes(
    transactionType,
    outputCount,
    fileSize,
  );

  // Witness data (if applicable)
  let witnessSize = 0;
  if (hasWitnessData) {
    // Witness flag and marker
    witnessSize += 2;

    // Witness data for each input
    witnessSize += inputCount * (
      TX_COMPONENT_SIZES.WITNESS_STACK_ITEMS +
      TX_COMPONENT_SIZES.SIGNATURE_LENGTH +
      TX_COMPONENT_SIZES.SIGNATURE +
      TX_COMPONENT_SIZES.PUBKEY_LENGTH +
      TX_COMPONENT_SIZES.PUBKEY
    );
  }

  // Calculate vBytes: base_size + (witness_size / 4)
  const vBytes = baseSize + Math.ceil(witnessSize / 4);

  return vBytes;
}

/**
 * Calculate output script sizes based on transaction type
 */
function calculateOutputScriptSizes(
  transactionType: TransactionSizeParams["transactionType"],
  outputCount: number,
  fileSize?: number,
): number {
  switch (transactionType) {
    case "stamp":
      // Stamp transactions: 1 OP_RETURN output + change output
      const opReturnSize = Math.min(fileSize || 0, 80) + 2; // OP_RETURN + length byte
      return opReturnSize + TX_COMPONENT_SIZES.P2WPKH_SCRIPT;

    case "src20":
    case "src101":
      // SRC-20/101 transactions: multiple P2WSH outputs for data + change
      const dataOutputs = outputCount - 1; // Assume last output is change
      return (dataOutputs * TX_COMPONENT_SIZES.P2WSH_SCRIPT) +
        TX_COMPONENT_SIZES.P2WPKH_SCRIPT;

    case "send":
      // Send transactions: recipient + change (both P2WPKH typically)
      return outputCount * TX_COMPONENT_SIZES.P2WPKH_SCRIPT;

    case "dispense":
      // Dispenser transactions: OP_RETURN + recipient + change
      return TX_COMPONENT_SIZES.OP_RETURN_SCRIPT +
        ((outputCount - 1) * TX_COMPONENT_SIZES.P2WPKH_SCRIPT);

    default:
      // Default to P2WPKH outputs
      return outputCount * TX_COMPONENT_SIZES.P2WPKH_SCRIPT;
  }
}

/**
 * Get estimated input/output counts for different transaction types
 */
export function getTypicalTransactionParams(
  transactionType: TransactionSizeParams["transactionType"],
  fileSize?: number,
): Omit<TransactionSizeParams, "transactionType"> {
  switch (transactionType) {
    case "stamp":
      return {
        inputCount: 1, // Typical single UTXO
        outputCount: 2, // OP_RETURN + change
        fileSize: fileSize ?? 0,
        hasWitnessData: true,
      };

    case "src20":
      // SRC-20 transactions create multiple P2WSH outputs for data
      const dataChunks = Math.ceil((fileSize || 100) / 32); // Rough estimate
      return {
        inputCount: 1,
        outputCount: Math.min(dataChunks + 1, 6), // Data outputs + change, capped
        hasWitnessData: true,
      };

    case "src101":
      return {
        inputCount: 1,
        outputCount: 3, // Typical multisig transaction
        hasWitnessData: true,
      };

    case "send":
      return {
        inputCount: 1,
        outputCount: 2, // Recipient + change
        hasWitnessData: true,
      };

    case "dispense":
      return {
        inputCount: 2, // Buyer UTXO + dispenser UTXO
        outputCount: 3, // OP_RETURN + recipient + change
        hasWitnessData: true,
      };

    default:
      return {
        inputCount: 1,
        outputCount: 2,
        hasWitnessData: true,
      };
  }
}

/**
 * Convenience function to estimate transaction size for a given type and file size
 */
export function estimateTransactionSizeForType(
  transactionType: TransactionSizeParams["transactionType"],
  fileSize?: number,
): number {
  const params = getTypicalTransactionParams(transactionType, fileSize);
  return estimateTransactionSize({
    ...params,
    transactionType,
  });
}
