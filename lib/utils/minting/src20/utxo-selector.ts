import { Buffer } from "buffer";

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
  if ("address" in vout) {
    return 34;
  } else if ("script" in vout) {
    const scriptSize = Buffer.from(vout.script, "hex").length;
    return scriptSize + 8;
  }
}

function estimateFixedTransactionSize(): number {
  return 10;
}

export function selectUTXOs(
  utxos: UTXO[],
  vouts: Output[],
  feePerByte: number,
): { inputs: UTXO[]; change: number; fee: number } {
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
  const finalFee =
    (totalUtxosSize + totalVoutsSize + estimateFixedTransactionSize()) *
    feePerByte;
  const change = totalValue - targetValue - finalFee;
  if (change < 0) {
    throw new Error("Insufficient funds");
  }
  return { inputs: selectedUTXOs, change, fee: finalFee };
}
