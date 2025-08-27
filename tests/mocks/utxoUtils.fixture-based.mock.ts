/**
 * Fixture-based mock for utxoUtils
 * Uses real API response fixtures instead of making external calls
 */

import type { UTXO } from "$types/index.d.ts";
import { getMempoolTransaction } from "../fixtures/api-responses/mempool-api-fixtures.ts";
import { getScriptTypeInfo } from "$lib/utils/bitcoin/scripts/scriptTypeUtils.ts";

// Mock formatUTXOs function
export function formatUTXOs(utxoData: any[], _address: string): UTXO[] | null {
  console.log(`Formatting UTXOs for data:`, utxoData);

  if (!utxoData || utxoData.length === 0) {
    return null;
  }

  const formattedUtxos: UTXO[] = [];

  for (const utxo of utxoData) {
    console.log("\nProcessing UTXO raw data:", utxo);

    // Extract relevant values
    const txid = utxo.txid;
    const vout = utxo.vout;
    const value = utxo.value;

    // Get script from various possible locations
    const script = utxo.script || utxo.scriptpubkey || utxo.scriptPubKey || "";
    console.log("Initial script value:", script);

    // Validate script
    if (!script || script.length === 0) {
      console.warn(`[formatUTXOs] No script found for UTXO ${txid}:${vout}`);
      continue;
    }

    console.log("Validating script:", {
      script,
      length: script.length,
      prefix: script.substring(0, 4),
    });

    // Get script type info
    const scriptTypeInfo = getScriptTypeInfo(script);

    const formattedUtxo: UTXO = {
      txid,
      vout,
      value,
      script,
      vsize: utxo.vsize || 107, // Default vsize
      ancestorCount: utxo.ancestorCount,
      ancestorSize: utxo.ancestorSize,
      ancestorFees: utxo.ancestorFees,
      weight: utxo.weight,
      scriptType: scriptTypeInfo?.type || utxo.scriptType,
      scriptDesc: scriptTypeInfo?.desc || utxo.scriptDesc,
      coinbase: utxo.coinbase || false,
    };

    console.log("Formatted UTXO:", formattedUtxo);
    formattedUtxos.push(formattedUtxo);
  }

  console.log(
    `Final formatted UTXOs (${formattedUtxos.length}):`,
    formattedUtxos,
  );
  return formattedUtxos.length > 0 ? formattedUtxos : null;
}

// Mock getUTXOForAddress using fixtures
export function getUTXOForAddress(
  address: string,
  specificTxid?: string,
  specificVout?: number,
  includeAncestors = false,
  retries = 3,
): Promise<UTXO[] | TxInfo | null> {
  console.log(`
>>> getUTXOForAddress called with:
Address: ${address}
TxID: ${specificTxid}
Vout: ${specificVout}
Include Ancestors: ${includeAncestors}
Retries: ${retries}
`);

  // Use fixture data
  if (specificTxid && specificVout !== undefined) {
    const tx = getMempoolTransaction(specificTxid);

    if (!tx) {
      console.log(`>>> No fixture found for txid: ${specificTxid}`);
      return Promise.resolve(null);
    }

    console.log(">>> Found transaction fixture");

    if (!tx.vout || !tx.vout[specificVout]) {
      console.log(`>>> No vout ${specificVout} found in transaction`);
      return Promise.resolve(null);
    }

    const utxoData = {
      txid: specificTxid,
      vout: specificVout,
      value: tx.vout[specificVout].value,
      scriptpubkey: tx.vout[specificVout].scriptpubkey,
      status: tx.status,
    };

    const formattedUtxos = formatUTXOs([utxoData], address);
    console.debug(">>> Formatted UTXOs:", formattedUtxos);

    const utxoValue = formattedUtxos?.[0];

    if (includeAncestors && utxoValue) {
      // Mock ancestor data
      utxoValue.ancestorCount = 2;
      utxoValue.ancestorSize = 500;
      utxoValue.ancestorFees = 10000;
    }

    const result: TxInfo = {};

    if (utxoValue) {
      result.utxo = utxoValue;
    }

    if (includeAncestors) {
      result.ancestor = {
        fees: 10000,
        vsize: 500,
        effectiveRate: 20, // fees / vsize
      };
    }

    console.log(">>> Final result:", result);
    return Promise.resolve(result);
  }

  // Return null for unsupported operations
  return Promise.resolve(null);
}

// TxInfo interface matching the internal interface from utxoUtils.ts
interface TxInfo {
  utxo?: UTXO;
  ancestor?: {
    fees: number;
    vsize: number;
    effectiveRate: number;
  };
}
