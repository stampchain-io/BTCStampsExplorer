import { UTXO } from "$lib/types/index.d.ts";
import { AncestorInfo } from "$lib/types/base.d.ts";
import { CachedQuicknodeRPCService } from "$server/services/quicknode/cachedQuicknodeRpcService.ts";
import { SATOSHIS_PER_BTC } from "$lib/utils/constants.ts"; // Import for conversion
import { logger } from "$lib/utils/logger.ts"; // Already present in my model of the file
import { address as bjsAddress, networks as bjsNetworks } from "bitcoinjs-lib"; // For toOutputScript & network
import { bytesToHex } from "$lib/utils/binary/baseUtils.ts"; // For logging/comparison
import { getScriptTypeInfo } from "$lib/utils/scriptTypeUtils.ts"; // Added for getScriptTypeInfo

// TODO: Utilize as primary utxo fetching source from utxoSer

// Define options for fetching multiple UTXOs
export interface UTXOOptions {
  confirmedOnly?: boolean;
  includeAncestors?: boolean; // For fetching financial ancestor data and full script details
}

// Define the response structure for fetching a single UTXO
export interface SingleUTXOResponse {
  data?: UTXO;
  error?: string;
}

// Interface for the structure of UTXOs returned by QuickNode's bb_getUTXOs
interface QuickNodeUTXO {
  txid: string;
  vout: number;
  value: string; // Value in satoshis, as a string (per QN docs)
  confirmations: number;
  height: number; // Block height
  coinbase?: boolean;
}

// Interface for the detailed transaction structure from QuickNode's bb_getTxSpecific
interface QuickNodeTxSpecific {
  txid: string;
  size: number;
  vsize: number;
  weight: number;
  fee?: number; // Fee in satoshis
  fee_rate?: number; // Fee rate (e.g., sats/vB)
  height?: number; // Block height of the transaction
  vin: Array<{
    txid?: string; // txid of the input transaction
    vout?: number; // vout of the input transaction
    txinwitness?: string[];
    sequence: number;
    value?: number; // Value of the input being spent (in satoshis)
    // other input fields if available and needed
  }>;
  vout: Array<{
    value: number; // Value of this output - LIKELY IN BTC from bb_getTxSpecific
    n: number; // Output index
    scriptPubKey: {
      asm: string;
      desc: string;
      hex: string;
      address?: string;
      type: string;
    };
  }>;
  confirmations: number;
  time?: number; // Block timestamp
  blocktime?: number; // Alias for block timestamp often used
  // status field was present in some versions, ensure if it's used, it's typed
}

export class QuicknodeUTXOService {
  private static readonly CACHE_DURATION = 60; // 1 minute cache for UTXOs

  static async getUTXO(
    txid: string,
    vout: number,
    includeAncestors = false,
  ): Promise<SingleUTXOResponse> {
    console.log(`[QN_UTXO_V6.1_STRICT_FALLBACK] Called for: ${txid}:${vout}`);
    const network = bjsNetworks.bitcoin;
    try {
      const txResponse = await CachedQuicknodeRPCService.executeRPC<QuickNodeTxSpecific>("bb_getTxSpecific", [txid]);

      if (txResponse.error || !txResponse.result) {
        const errorMsg = txResponse.error ? (typeof txResponse.error === 'string' ? txResponse.error : JSON.stringify(txResponse.error)) : "No result from QuickNode";
        console.error(`[QN_UTXO_V6.1] Error or no result from RPC for ${txid}:`, errorMsg);
        return { error: errorMsg };
      }

      const tx = txResponse.result!;
      if (!tx.vout || vout >= tx.vout.length || !tx.vout[vout]) {
        console.error(`[QN_UTXO_V6.1] UTXO ${txid}:${vout} not found in tx.vout array`);
        return { error: `UTXO ${txid}:${vout} not found in tx.vout array` };
      }
      const outputDetail = tx.vout[vout];
      const qnProvidedHex = outputDetail.scriptPubKey?.hex?.toLowerCase();
      const qnProvidedAddress = outputDetail.scriptPubKey?.address;
      console.log(`[QN_UTXO_V6.1] For ${txid}:${vout} - QN Raw Data: scriptHex='${qnProvidedHex}', address='${qnProvidedAddress}'`);

      let finalScriptHex: string | undefined;

      if (qnProvidedAddress && typeof qnProvidedAddress === 'string') {
        let derivedScriptHex: string | undefined;
        try {
          derivedScriptHex = bytesToHex(bjsAddress.toOutputScript(qnProvidedAddress, network)).toLowerCase();
          console.log(`[QN_UTXO_V6.1] Derived script from QN address '${qnProvidedAddress}' -> ${derivedScriptHex}`);
        } catch (e) {
          console.error(`[QN_UTXO_V6.1] Error deriving script from QN address '${qnProvidedAddress}': ${e.message}`);
          // derivedScriptHex remains undefined, proceed to check qnProvidedHex
        }

        if (qnProvidedHex && qnProvidedHex.length > 0) {
          if (derivedScriptHex && qnProvidedHex !== derivedScriptHex) {
            console.error(`[QN_UTXO_V6.1] INCONSISTENCY for ${txid}:${vout}. QNHex: ${qnProvidedHex}, QNAddr: ${qnProvidedAddress} (derives ${derivedScriptHex}). Forcing fallback.`);
            return { error: "QuickNode script/address mismatch" }; // Force fallback
          }
          // Consistent, or derivation failed so we trust QN hex, or no address to compare against.
          finalScriptHex = qnProvidedHex;
          console.log(`[QN_UTXO_V6.1] Using QN-provided hex (verified if address was present & derivation succeeded): ${finalScriptHex}`);
        } else if (derivedScriptHex) {
          // No QN hex, but derived from address is available
          finalScriptHex = derivedScriptHex;
          console.log(`[QN_UTXO_V6.1] No QN hex, using script derived from QN address: ${finalScriptHex}`);
        } else {
          // No QN hex, and address either wasn't there or derivation failed.
          return { error: `Cannot determine script for ${txid}:${vout} from QN (no hex, and address unusable).` };
        }
      } else if (qnProvidedHex && qnProvidedHex.length > 0) {
        // No QN address, only QN hex. Trust QN hex.
        finalScriptHex = qnProvidedHex;
        console.log(`[QN_UTXO_V6.1] No QN address, using QN-provided hex: ${finalScriptHex}`);
      } else {
        return { error: `Neither script hex nor address from QN for ${txid}:${vout}.` };
      }

      if (!finalScriptHex || finalScriptHex.length === 0) {
         return { error: `Script for UTXO ${txid}:${vout} could not be resolved.` };
      }
      
      const valueInSatoshis = Math.round(outputDetail.value * SATOSHIS_PER_BTC);
      const utxoToReturn: UTXO = {
        txid, vout, value: valueInSatoshis, script: finalScriptHex,
        scriptType: getScriptTypeInfo(finalScriptHex).type, 
        scriptDesc: outputDetail.scriptPubKey.desc, 
        vsize: tx.vsize, weight: tx.weight, coinbase: !!(tx.vin[0]?.coinbase),
        rawTxHex: tx.hex,
      };
      if (includeAncestors && tx.vin && tx.vin.length > 0) {
        const firstInput = tx.vin[0];
        utxoToReturn.ancestor = {
            fees: tx.fee || 0, vsize: tx.vsize,
            effectiveRate: tx.fee_rate || (tx.fee && tx.vsize ? tx.fee / tx.vsize : 0),
            txid: tx.txid, vout, weight: tx.weight, size: tx.size,
            scriptType: outputDetail.scriptPubKey.type, 
            sequence: firstInput?.sequence, 
            blockHeight: tx.height, confirmations: tx.confirmations,
        };
      }
      console.log(`[QN_UTXO_V6.1] RETURNING for ${txid}:${vout}: script=${utxoToReturn.script}, value=${utxoToReturn.value}, type=${utxoToReturn.scriptType}`);
      return { data: utxoToReturn };
    } catch (error) {
      console.error(`[QN_UTXO_V6.1] CATCH BLOCK Error for ${txid}:${vout}:`, error);
      return { error: error instanceof Error ? error.message : "Catastrophic failure in getUTXO_v6.1" };
    }
  }

  static async getUTXOs(address: string, options: UTXOOptions = {}): Promise<{ data?: Pick<UTXO, 'txid' | 'vout' | 'value'>[]; error?: string }> {
    try {
      const basicUtxosResult = await this.fetchBasicUTXOs(address, options);
      
      if ("error" in basicUtxosResult && basicUtxosResult.error) {
        return { error: basicUtxosResult.error };
      }
      return { data: basicUtxosResult.data || [] };
    } catch (error) {
      console.error("Error in getUTXOs:", error);
      return { error: error instanceof Error ? error.message : "Failed to fetch UTXOs" };
    }
  }

  private static async fetchBasicUTXOs(address: string, options: UTXOOptions): Promise<{ data?: Pick<UTXO, 'txid' | 'vout' | 'value'>[]; error?: string }> {
    const params = [address, { confirmed: options.confirmedOnly }]; 
    
    const response = await CachedQuicknodeRPCService.executeRPC<QuickNodeUTXO[]>(
      "bb_getUTXOs", 
      params,
      this.CACHE_DURATION
    );

    if ("error" in response && response.error) {
      return { error: typeof response.error === 'string' ? response.error : JSON.stringify(response.error) };
    }
    if (!response.result) {
        return { error: "No result in txResponse for fetchBasicUTXOs" };
    }

    // Parse string value to number (satoshis)
    const formattedUtxos = response.result.map(utxo => ({
      txid: utxo.txid,
      vout: utxo.vout,
      value: Number(utxo.value), // Convert string satoshis to number satoshis
    }));

    return { data: formattedUtxos };
  }

  private static async enrichWithAncestorInfo(utxos: Partial<UTXO>[], includeFinancialAncestors = true): Promise<UTXO[]> {
    const enrichedUtxos = await Promise.all(
        utxos.map(async (baseUtxo) => {
            if (baseUtxo.txid === undefined || baseUtxo.vout === undefined) {
                console.error("Cannot enrich UTXO without txid or vout", baseUtxo);
                return null; 
            }
            try {
                const txResponse = await CachedQuicknodeRPCService.executeRPC<QuickNodeTxSpecific>(
                    "bb_getTxSpecific",
                    [baseUtxo.txid]
                );

                if ("error" in txResponse && txResponse.error) {
                    console.error('Error fetching tx details for ' + baseUtxo.txid + ':', txResponse.error);
                    return null; 
                }
                if (!txResponse.result) {
                    console.error('No result for tx details for ' + baseUtxo.txid);
                    return null;
                }

                const tx = txResponse.result;
                if (!tx.vout || baseUtxo.vout >= tx.vout.length || !tx.vout[baseUtxo.vout]) {
                     console.error("TxSpecific response vout index out of bounds", { txid: baseUtxo.txid, vout: baseUtxo.vout });
                    return null;
                }
                const outputDetail = tx.vout[baseUtxo.vout];

                // Ensure value from bb_getTxSpecific (outputDetail.value) is converted from BTC to satoshis
                const valueFromTxSpecificInSatoshis = Math.round(outputDetail.value * SATOSHIS_PER_BTC);

                let ancestorData: AncestorInfo | undefined = undefined;
                if (includeFinancialAncestors) {
                    ancestorData = {
                        fees: tx.fee || 0,
                        vsize: tx.vsize,
                        effectiveRate: tx.fee_rate || (tx.fee && tx.vsize ? tx.fee / tx.vsize : 0),
                        size: tx.size,
                        weight: tx.weight,
                        scriptType: outputDetail.scriptPubKey.type,
                        sequence: tx.vin[0]?.sequence,
                        blockHeight: tx.height,
                        confirmations: tx.confirmations,
                        txid: tx.txid,
                        vout: baseUtxo.vout,
                    };
                }

                return {
                    txid: baseUtxo.txid,
                    vout: baseUtxo.vout,
                    // Use baseUtxo.value if available (assumed already satoshis from bb_getUTXOs),
                    // otherwise use the converted value from bb_getTxSpecific.
                    value: baseUtxo.value !== undefined ? baseUtxo.value : valueFromTxSpecificInSatoshis,
                    script: outputDetail.scriptPubKey.hex,
                    scriptType: outputDetail.scriptPubKey.type,
                    scriptDesc: outputDetail.scriptPubKey.desc,
                    vsize: tx.vsize,
                    weight: tx.weight,
                    coinbase: tx.vin[0]?.txid === undefined && tx.vin[0]?.vout === undefined,
                    ancestor: ancestorData, // This will be undefined if includeFinancialAncestors is false
                } as UTXO; // All fields of UTXO should be present or explicitly undefined if optional
            } catch (error) {
                console.error('Failed to enrich UTXO ' + baseUtxo.txid + ':', error);
                return null; 
            }
        })
    );
    return enrichedUtxos.filter(utxo => utxo !== null) as UTXO[];
}

  static async getRawTransactionHex(txid: string): Promise<{ data?: string; error?: string }> {
    try {
      // Assuming QuickNode has an RPC like bb_getRawTransaction or similar that returns the hex string
      // Replace "bb_getRawTransaction" with the actual RPC method name if different.
      const response = await CachedQuicknodeRPCService.executeRPC<string>(
        "getrawtransaction", // Standard Bitcoin Core RPC name, QN might use bb_getRawTransaction or similar
        [txid, 0], // Typically 0 for non-verbose, just the hex string
      );

      if ("error" in response && response.error) {
        return { error: response.error };
      }
      if (typeof response.result === 'string') {
        return { data: response.result };
      }
      return { error: "Invalid response format for raw transaction hex" };
    } catch (error) {
      console.error('Failed to fetch raw transaction hex for ' + txid + ':', error);
      return { error: "Exception fetching raw transaction hex" };
    }
  }

  // Add method to fetch witness information when needed
// ... existing code ...

} 