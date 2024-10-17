import { Buffer } from "buffer";
import type { Output, UTXO } from "utils/minting/src20/utils.d.ts";

const CHANGE_DUST = 1000; // This should match the value in tx.ts

function isP2PKH(script: string): boolean {
  return /^76a914[a-fA-F0-9]{40}88ac$/.test(script);
}

function isP2SH(script: string): boolean {
  return /^a914[a-fA-F0-9]{40}87$/.test(script);
}

function isP2WPKH(script: string): boolean {
  return /^0014[a-fA-F0-9]{40}$/.test(script);
}

function isP2TR(script: string): boolean {
  return /^5120[a-fA-F0-9]{64}$/.test(script);
}

function calculateSizeP2WPKH(script: string): number {
  const baseInputSize = 32 + 4 + 4 + 1;
  const witnessSize = 1 + 72 + 1 + 33;
  const witnessWeight = witnessSize * 0.25;

  return Math.floor(baseInputSize + witnessWeight) + 1;
}

export function estimateInputSize(script: string): number {
  let scriptSigSize = 0;
  if (isP2PKH(script)) {
    scriptSigSize = 108;
  } else if (isP2SH(script)) {
    scriptSigSize = 260;
  } else if (isP2WPKH(script)) {
    scriptSigSize = calculateSizeP2WPKH(script);
  } else if (isP2TR(script)) {
    scriptSigSize = 65; // Taproot input size (32 bytes prevout + 4 bytes nSequence + 1 byte scriptSig length + 1 byte witness items count + 1 byte signature length + 64 bytes signature + 1 byte control block length + 32 bytes internal key)
  }

  const txidSize = 32;
  const voutSize = 4;
  const sequenceSize = 4;

  return txidSize + voutSize + sequenceSize + scriptSigSize;
}

function estimateVoutSize(vout: Output): number {
  let size = 0;
  if ("address" in vout) {
    // Assume P2TR output size for Taproot addresses
    size = 43; // 8 bytes value + 1 byte scriptPubKey length + 34 bytes scriptPubKey (1 byte OP_1 + 32 bytes public key)
  } else if ("script" in vout) {
    const scriptSize = Buffer.from(vout.script as string, "hex").length;
    size = scriptSize + 8;
  }
  return size;
}

function estimateFixedTransactionSize(): number {
  return 10;
}

const SIGOPS_RATE = 1; //TODO Calculate in base of the formule:

function calculate_sigops_rate(inputs: UTXO[], vouts: Output[]) {
  const num_inputs = inputs.length;

  let num_normal_outputs = 0;
  let num_msig = 0;
  for (const vout of vouts) {
    if ("address" in vout) {
      num_normal_outputs++;
    } else if ("script" in vout) {
      num_msig++;
    }
  }
  const sigops_rate = (num_inputs + num_normal_outputs + (num_msig * 3)) /
    (num_inputs + num_normal_outputs + num_msig);

  return sigops_rate;
}

// RATE = ((num inputs + num normal outputs + (num msig * 3)) / total)
export function selectUTXOs(
  utxos: UTXO[],
  vouts: Output[],
  feePerByte: number,
  sigops_rate = 0,
  rbfBuffer = 1.5,
): { inputs: UTXO[]; change: number; fee: number } {
  feePerByte = Math.floor(feePerByte * (sigops_rate || SIGOPS_RATE));
  console.log("Fee per byte:", feePerByte);
  utxos.sort((a, b) => b.value - a.value);

  // Ensure all outputs meet the dust threshold
  const adjustedVouts = vouts.map((vout) => ({
    ...vout,
    value: Math.max(vout.value, CHANGE_DUST),
  }));

  let totalVoutsSize = 0;
  for (const vout of adjustedVouts) {
    totalVoutsSize += estimateVoutSize(vout);
  }

  let totalUtxosSize = 0;
  let totalValue = 0;
  const selectedUTXOs: UTXO[] = [];
  const targetValue = adjustedVouts.reduce((acc, vout) => acc + vout.value, 0);

  for (const utxo of utxos) {
    selectedUTXOs.push(utxo);
    totalValue += utxo.value;
    totalUtxosSize += utxo.size;
    const estimatedFee =
      (totalUtxosSize + totalVoutsSize + estimateFixedTransactionSize()) *
      feePerByte * rbfBuffer;
    if (totalValue >= targetValue + estimatedFee + CHANGE_DUST) {
      break;
    }
  }

  const new_sigops_rate = calculate_sigops_rate(selectedUTXOs, adjustedVouts);
  let finalFee =
    (totalUtxosSize + totalVoutsSize + estimateFixedTransactionSize()) *
    feePerByte;

  if (Math.abs(new_sigops_rate - sigops_rate) > 0.01) {
    return selectUTXOs(utxos, vouts, feePerByte, new_sigops_rate);
  }

  let change = totalValue - targetValue - finalFee;

  // Handle dust change
  if (change > 0 && change < CHANGE_DUST) {
    finalFee += change;
    change = 0;
  }

  console.log(`
    Total Value: ${totalValue}
    Target Value: ${targetValue}
    finalFee: ${finalFee}
    Change: ${change}
  `);

  if (totalValue < targetValue + finalFee) {
    throw new Error("Insufficient funds at address for BTC transaction");
  }

  return { inputs: selectedUTXOs, change, fee: finalFee };
}
