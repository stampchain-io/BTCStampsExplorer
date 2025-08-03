/**
 * Dummy UTXO Generator for Realistic Fee Estimation
 *
 * Generates realistic dummy UTXOs that simulate actual wallet conditions
 * to improve Phase 2 fee estimation accuracy.
 */

import type { ScriptType, UTXO } from "$lib/types/base.d.ts";
import { TX_CONSTANTS } from "$constants";

export interface DummyUTXOConfig {
  targetAmount: number;
  averageUTXOSize?: number;
  includeSmallUTXOs?: boolean;
  includeDustUTXOs?: boolean;
  scriptType?: ScriptType;
}

/**
 * Generates realistic dummy UTXOs for fee estimation
 * Simulates typical wallet conditions with various UTXO sizes
 */
export function generateRealisticDummyUTXOs(config: DummyUTXOConfig): UTXO[] {
  const {
    targetAmount,
    averageUTXOSize = 50000, // 0.0005 BTC default
    includeSmallUTXOs = true,
    includeDustUTXOs = true,
    scriptType = "P2WPKH",
  } = config;

  const utxos: UTXO[] = [];
  let totalValue = 0;
  let utxoIndex = 0;

  // Add some dust UTXOs if enabled (common in real wallets)
  if (includeDustUTXOs) {
    const dustCount = Math.floor(Math.random() * 3) + 1; // 1-3 dust UTXOs
    for (let i = 0; i < dustCount; i++) {
      const dustValue = TX_CONSTANTS.DUST_SIZE +
        Math.floor(Math.random() * 200);
      utxos.push(createDummyUTXO(utxoIndex++, dustValue, scriptType));
      totalValue += dustValue;
    }
  }

  // Add some small UTXOs if enabled
  if (includeSmallUTXOs) {
    const smallCount = Math.floor(Math.random() * 5) + 2; // 2-6 small UTXOs
    for (let i = 0; i < smallCount; i++) {
      const smallValue = 1000 + Math.floor(Math.random() * 9000); // 1000-10000 sats
      utxos.push(createDummyUTXO(utxoIndex++, smallValue, scriptType));
      totalValue += smallValue;
    }
  }

  // Add medium-sized UTXOs to reach target
  while (totalValue < targetAmount * 1.5) { // Add 50% buffer for fees
    // Vary UTXO sizes realistically
    const sizeMultiplier = 0.5 + Math.random() * 2; // 0.5x to 2.5x average
    const utxoValue = Math.floor(averageUTXOSize * sizeMultiplier);

    utxos.push(createDummyUTXO(utxoIndex++, utxoValue, scriptType));
    totalValue += utxoValue;

    // Occasionally add a larger UTXO
    if (Math.random() < 0.2) { // 20% chance
      const largeValue = averageUTXOSize * (3 + Math.random() * 2); // 3x-5x average
      utxos.push(
        createDummyUTXO(utxoIndex++, Math.floor(largeValue), scriptType),
      );
      totalValue += Math.floor(largeValue);
    }
  }

  // Shuffle UTXOs to simulate random order
  return shuffleArray(utxos);
}

/**
 * Creates a single dummy UTXO
 */
function createDummyUTXO(
  index: number,
  value: number,
  scriptType: ScriptType,
): UTXO {
  const txid = generateDummyTxId(index);

  return {
    txid,
    vout: index % 2, // Alternate between vout 0 and 1
    value,
    script: generateDummyScript(scriptType), // Add dummy script
    confirmations: 100 + index,
    scriptType,
    address: generateDummyAddress(scriptType),
    // Add ancestor info for dust UTXOs to simulate fee bumping scenarios
    ...(value < 1000 && {
      ancestorCount: Math.floor(Math.random() * 3) + 1,
      ancestorSize: 200 + Math.floor(Math.random() * 300),
      ancestorFees: Math.floor(Math.random() * 500),
    }),
  };
}

/**
 * Generates a dummy transaction ID
 */
function generateDummyTxId(index: number): string {
  const base = "dummy" + index.toString().padStart(4, "0");
  const hash = Array(64 - base.length).fill("0").join("") + base;
  return hash;
}

/**
 * Generates a dummy script based on script type
 */
function generateDummyScript(scriptType: ScriptType): string {
  switch (scriptType) {
    case "P2WPKH":
      // OP_0 <20-byte pubkey hash>
      return "0014" + Array(40).fill("a").join("");
    case "P2PKH":
      // OP_DUP OP_HASH160 <20-byte pubkey hash> OP_EQUALVERIFY OP_CHECKSIG
      return "76a914" + Array(40).fill("b").join("") + "88ac";
    case "P2SH":
      // OP_HASH160 <20-byte script hash> OP_EQUAL
      return "a914" + Array(40).fill("c").join("") + "87";
    default:
      return "0014" + Array(40).fill("a").join("");
  }
}

/**
 * Generates a dummy address based on script type
 */
function generateDummyAddress(scriptType: ScriptType): string {
  switch (scriptType) {
    case "P2WPKH":
      return "bc1qdummy" + Array(33).fill("x").join("");
    case "P2PKH":
      return "1Dummy" + Array(28).fill("X").join("");
    case "P2SH":
      return "3Dummy" + Array(28).fill("Y").join("");
    default:
      return "bc1qdummy" + Array(33).fill("x").join("");
  }
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Calculates the number of inputs likely needed for a transaction
 * This helps estimate the transaction size more accurately
 */
export function estimateInputCount(
  targetAmount: number,
  averageUTXOSize: number,
  feeRate: number,
): number {
  // Initial estimate based on target amount
  const baseInputs = Math.ceil(targetAmount / averageUTXOSize);

  // Each input adds ~68 bytes for P2WPKH
  const bytesPerInput = 68;
  const estimatedExtraFee = baseInputs * bytesPerInput * feeRate;

  // May need more inputs to cover the additional fees
  const totalNeeded = targetAmount + estimatedExtraFee;
  const adjustedInputs = Math.ceil(totalNeeded / averageUTXOSize);

  // Add 1-2 extra inputs for safety margin
  return adjustedInputs + Math.floor(Math.random() * 2) + 1;
}
