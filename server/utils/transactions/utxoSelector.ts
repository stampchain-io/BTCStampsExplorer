import type { Output, UTXO } from "$types/index.d.ts";
import { getUTXOForAddress } from "$lib/utils/utxoUtils.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import * as bitcoin from "bitcoinjs-lib";

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

function isP2WSH(script: string): boolean {
  return /^0020[a-fA-F0-9]{64}$/.test(script);
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

export function estimateVoutSize(output: Output): number {
  let scriptSize = 0;

  if (output.script) {
    scriptSize = output.script.length / 2; // Hex string length divided by 2
  } else if (output.address) {
    // Determine script size based on address type
    if (bitcoin.address.toOutputScript(output.address).length === 25) {
      scriptSize = 25; // P2PKH
    } else if (bitcoin.address.toOutputScript(output.address).length === 22) {
      scriptSize = 22; // P2WPKH
    } else {
      // Add cases for multisig or other types
      scriptSize = 34; // Default to P2WSH size
    }
  }

  return 8 + 1 + scriptSize; // 8 bytes for value, 1 byte for script length
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
  // Fetch all UTXOs for address (no specific UTXO needed)
  const txInfo = await getUTXOForAddress(address);
  if (!txInfo?.utxo) {
    throw new Error("No UTXOs found for the given address");
  }

  let utxos = [txInfo.utxo]; // Convert single UTXO to array

  // ... rest of the function
}
