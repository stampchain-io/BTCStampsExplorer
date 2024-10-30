export const TX_CONSTANTS = {
  // Base sizes
  VERSION: 4,
  MARKER: 1,
  FLAG: 1,
  LOCKTIME: 4,

  // Script sizes
  P2PKH: { size: 107, isWitness: false },
  P2SH: { size: 260, isWitness: false },
  P2WPKH: { size: 107, isWitness: true },
  P2WSH: { size: 235, isWitness: true },
  P2TR: { size: 65, isWitness: true },

  // Dust thresholds
  DUST_SIZE: 333,
  SRC20_DUST: 420,

  // Helper functions
  weightToVsize(weight: number): number {
    return Math.ceil(weight / 4);
  },
} as const;
