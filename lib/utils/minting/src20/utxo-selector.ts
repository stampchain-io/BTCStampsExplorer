import { Buffer } from "buffer";
import type { Output, UTXO } from "utils/minting/src20/utils.d.ts";

function isP2PKH(script: string): boolean {
  return /^76a914[a-fA-F0-9]{40}88ac$/.test(script);
}

function isP2SH(script: string): boolean {
  return /^a914[a-fA-F0-9]{40}87$/.test(script);
}

function isP2WPKH(script: string): boolean {
  return /^0014[a-fA-F0-9]{40}$/.test(script);
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
  }

  const txidSize = 32;
  const voutSize = 4;
  const sequenceSize = 4;

  return txidSize + voutSize + sequenceSize + scriptSigSize;
}

function estimateVoutSize(vout: Output): number {
  let size = 0;
  if ("address" in vout) {
    size = 34;
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
): { inputs: UTXO[]; change: number; fee: number } {
  feePerByte = Math.floor(feePerByte * (sigops_rate || SIGOPS_RATE));
  console.log("Fee per byte:", feePerByte);
  utxos.sort((a, b) => b.value - a.value);
  let totalVoutsSize = 0;
  for (const vout of vouts) {
    totalVoutsSize += estimateVoutSize(vout);
  }
  let totalUtxosSize = 0;
  let totalValue = 0;
  const selectedUTXOs: UTXO[] = [];
  const targetValue = vouts.reduce((acc, vout) => acc + vout.value, 0);
  for (const utxo of utxos) {
    selectedUTXOs.push(utxo);
    totalValue += utxo.value;
    totalUtxosSize += utxo.size;
    const estimatedFee =
      (totalUtxosSize + totalVoutsSize + estimateFixedTransactionSize()) *
      feePerByte;
    if (totalValue >= targetValue + estimatedFee) {
      break;
    }
  }
  const new_sigops_rate = calculate_sigops_rate(selectedUTXOs, vouts);
  const finalFee =
    (totalUtxosSize + totalVoutsSize + estimateFixedTransactionSize()) *
    feePerByte;

  if (new_sigops_rate !== sigops_rate) {
    return selectUTXOs(utxos, vouts, feePerByte, new_sigops_rate);
  }

  const change = totalValue - targetValue - finalFee;
  console.log(`
    Total Value: ${totalValue}
    Target Value: ${targetValue}
    finalFee: ${finalFee}
    Change: ${change}
  `);

  if (change < 0) {
    throw new Error("Insufficient funds at address for BTC transaction");
  }

  return { inputs: selectedUTXOs, change, fee: finalFee };
}
