import { Buffer } from "buffer";
import type { Output, UTXO } from "$lib/types/index.d.ts";
import { getUTXOForAddress } from "$lib/utils/utxoUtils.ts";
import { XcpManager } from "$lib/services/xcpService.ts";
import { TX_SIZES } from "./transactionSizes.ts";

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
  // First validate that this is actually a P2WPKH script
  if (!isP2WPKH(script)) {
    console.warn("Non-P2WPKH script provided to calculateSizeP2WPKH:", script);
    return 0;
  }

  // Use constants from transactionSizes.ts
  const baseSize = TX_SIZES.P2WSH_INPUT; // Previous output (36) + sequence (4) + script length (1)
  const witnessSize = TX_SIZES.WITNESS_OVERHEAD + // Count and length fields
    TX_SIZES.WITNESS_STACK_ITEM; // Signature + pubkey

  // Calculate weight units and convert to vbytes
  const totalWeight = (baseSize * 4) + witnessSize;
  return Math.ceil(totalWeight / 4);
}

export function estimateInputSize(script: string): number {
  let scriptSigSize = 0;
  if (isP2PKH(script)) {
    scriptSigSize = 108; // Legacy P2PKH
  } else if (isP2SH(script)) {
    scriptSigSize = 260; // P2SH
  } else if (isP2WPKH(script)) {
    scriptSigSize = calculateSizeP2WPKH(script);
  } else if (isP2TR(script)) {
    // Use Taproot constants if we add them to TX_SIZES
    scriptSigSize = 65; // Taproot input size
  }

  return TX_SIZES.VERSION + TX_SIZES.LOCKTIME + scriptSigSize;
}

function estimateVoutSize(vout: Output): number {
  if ("address" in vout) {
    return TX_SIZES.P2WPKH_OUTPUT; // Default to P2WPKH output size
  } else if ("script" in vout) {
    const scriptSize = Buffer.from(vout.script as string, "hex").length;
    return scriptSize + 8; // 8 bytes for value
  }
  return TX_SIZES.P2WPKH_OUTPUT; // Default
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

export async function selectUTXOsForTransaction(
  address: string,
  vouts: Output[],
  feeRate: number,
  sigops_rate = 0,
  rbfBuffer = 1.5,
): Promise<{
  inputs: UTXO[];
  change: number;
  fee: number;
}> {
  // Fetch UTXOs for the address
  let utxos = await getUTXOForAddress(address) as UTXO[];
  if (!utxos || utxos.length === 0) {
    throw new Error("No UTXOs found for the given address");
  }

  // Fetch stamps balance to get UTXOs to exclude
  try {
    const stampBalances = await XcpManager.getXcpBalancesByAddress(
      address,
      undefined, // cpid
      true, // utxoOnly
    );

    const utxosToExclude = new Set<string>();

    // Collect UTXOs to exclude
    for (const balance of stampBalances) {
      if (balance.utxo) {
        utxosToExclude.add(balance.utxo);
      }
    }

    // Filter out UTXOs that are in the stamps balance
    utxos = utxos.filter(
      (utxo) => !utxosToExclude.has(`${utxo.txid}:${utxo.vout}`),
    );

    console.log(
      `Excluded ${utxosToExclude.size} UTXOs from stamps balance`,
    );
  } catch (error) {
    console.error("Error fetching stamps balance:", error);
    // Decide whether to proceed without excluding UTXOs or throw an error
    // For safety, you might choose to throw an error
    throw new Error("Failed to fetch stamps balance for UTXO exclusion");
  }

  if (!utxos || utxos.length === 0) {
    throw new Error(
      "No UTXOs available for transaction after excluding stamps UTXOs",
    );
  }

  // Proceed with UTXO selection using the filtered UTXO list
  return selectUTXOs(utxos, vouts, feeRate, sigops_rate, rbfBuffer);
}
