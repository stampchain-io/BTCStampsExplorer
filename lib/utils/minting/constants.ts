export const TX_CONSTANTS = {
  // Base sizes
  VERSION: 4,
  MARKER: 1,
  FLAG: 1,
  LOCKTIME: 4,

  // Script sizes (base sizes, not including witness data)
  P2PKH: { size: 107, isWitness: false }, // 25 bytes scriptPubKey
  P2SH: { size: 260, isWitness: false }, // 23 bytes scriptPubKey
  P2WPKH: { size: 107, isWitness: true }, // 22 bytes scriptPubKey + witness
  P2WSH: { size: 235, isWitness: true }, // 34 bytes scriptPubKey + witness
  P2TR: { size: 65, isWitness: true }, // 34 bytes scriptPubKey + witness

  // Witness stack details
  WITNESS_STACK: {
    P2WPKH: {
      itemsCount: 1, // varint for number of witness items
      lengthBytes: 2, // 1 byte each for sig and pubkey length
      signature: 72, // DER signature + sighash flag
      pubkey: 33, // Compressed pubkey
    },
    P2WSH: {
      size: 235, // Total witness stack size
    },
    P2TR: {
      size: 65, // Single Schnorr signature size
    },
  },

  // Dust thresholds
  DUST_SIZE: 333,
  SRC20_DUST: 420,

  // Helper functions
  weightToVsize(weight: number): number {
    // Don't ceil intermediary calculations
    return Math.ceil(weight / 4);
  },
} as const;
