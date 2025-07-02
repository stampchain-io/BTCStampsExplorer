import { UTXO, BasicUTXO } from "$lib/types/base.d.ts";
import { serverConfig } from "$server/config/config.ts";
import { QuicknodeUTXOService, UTXOOptions as QuicknodeInternalUTXOOptions } from "$server/services/quicknode/quicknodeUTXOService.ts";
import {
  getUTXOForAddress as getUTXOsFromPublicAPIsForAddress
} from "$lib/utils/utxoUtils.ts";
import { detectScriptType, getScriptTypeInfo } from "$lib/utils/scriptTypeUtils.ts";
import { logger } from "$lib/utils/logger.ts";
import { ICommonUTXOService, UTXOFetchOptions } from "./utxoServiceInterface.d.ts";
import { BLOCKSTREAM_API_BASE_URL } from "$lib/utils/constants.ts";

interface CommonUTXOFetchOptions extends UTXOFetchOptions {
  forcePublicAPI?: boolean;
}

/**
 * Common UTXO Service managing UTXO fetching from multiple sources,
 * prioritizing QuickNode if configured, and falling back to public APIs.
 */
export class CommonUTXOService implements ICommonUTXOService {
  private isQuickNodeConfigured: boolean;
  private rawTxHexCache: Map<string, string | null>; // Cache for raw tx hex

  constructor() {
    this.isQuickNodeConfigured = !!(serverConfig.QUICKNODE_ENDPOINT && serverConfig.QUICKNODE_API_KEY);
    this.rawTxHexCache = new Map<string, string | null>(); // Initialize cache
    const message = this.isQuickNodeConfigured
      ? "QuickNode is configured. UTXO fetching will prioritize QuickNode."
      : "QuickNode is not configured. UTXO fetching will use public API fallbacks.";
    logger.info("common-utxo-service", { message });
  }

  async getRawTransactionHex(txid: string): Promise<string | null> {
    if (this.rawTxHexCache.has(txid)) {
      const cachedHex = this.rawTxHexCache.get(txid);
      logger.debug("common-utxo-service", { message: "Cache hit for rawTxHex", txid, found: cachedHex !== null });
      return cachedHex;
    }
    logger.debug("common-utxo-service", { message: "Cache miss for rawTxHex", txid });

    let hex: string | null = null;
    if (this.isQuickNodeConfigured) {
      try {
        // Call the actual method from QuicknodeUTXOService
        const qnResponse = await QuicknodeUTXOService.getRawTransactionHex(txid);

        if (qnResponse.data) {
          hex = qnResponse.data;
          logger.info("common-utxo-service", { message: "Successfully fetched rawTxHex from QuickNode", txid });
        } else if (qnResponse.error) {
          logger.warn("common-utxo-service", { message: "QuickNode returned error for getRawTransactionHex", txid, error: qnResponse.error });
          // Fall through to public APIs
        } else {
          logger.warn("common-utxo-service", { message: "QuickNode did not return data or error for getRawTransactionHex", txid, response: qnResponse });
          // Fall through to public APIs
        }
      } catch (error) {
        logger.error("common-utxo-service", { message: "Error during QuickNode getRawTransactionHex call", txid, error: error.message, stack: error.stack });
        // Fall through to public APIs on error
      }
    }

    if (!hex) {
      logger.debug("common-utxo-service", { message: "Falling back to public APIs for getRawTransactionHex", txid });
      try {
        const response = await fetch(`${BLOCKSTREAM_API_BASE_URL}/tx/${txid}/hex`);
        if (response.ok) {
          hex = await response.text();
          logger.info("common-utxo-service", { message: "Successfully fetched rawTxHex from public API (Blockstream)", txid });
        } else {
          logger.warn("common-utxo-service", { message: `Public API (Blockstream) failed to fetch raw tx hex ${txid}`, status: response.statusText, code: response.status });
        }
      } catch (error) {
        logger.error("common-utxo-service", { message: "Error fetching rawTxHex from public APIs", txid, error: error.message, stack: error.stack });
      }
    }

    return hex;
  }

  async getSpendableUTXOs(
    address: string,
    _amountNeeded?: number, 
    options?: UTXOFetchOptions,
  ): Promise<BasicUTXO[]> {
    const logContext = { address, options, quicknodeEnabled: this.isQuickNodeConfigured };
    logger.debug("common-utxo-service", { message: "getSpendableUTXOs called for basic UTXO list", ...logContext });

    if (this.isQuickNodeConfigured) {
      try {
        logger.debug("common-utxo-service", { message: "Attempting to fetch basic UTXOs via QuickNode", address });
        
        const qnOptions: QuicknodeInternalUTXOOptions = {}; 
        if (options?.confirmedOnly !== undefined) qnOptions.confirmedOnly = options.confirmedOnly;

        const result = await QuicknodeUTXOService.getUTXOs(address, qnOptions);
        
        if (result && "data" in result && Array.isArray(result.data)) {
          logger.info("common-utxo-service", { message: "Successfully received basic UTXO data from QuickNode", address, count: result.data.length });
          return result.data;
        } else if (result && "error" in result) {
          logger.warn("common-utxo-service", { message: "QuickNode returned an error for getUTXOs", address, error: result.error });
        } else {
          logger.warn("common-utxo-service", { message: "QuickNode returned unexpected response for getUTXOs", address, response: result });
        }
      } catch (error) {
        logger.error("common-utxo-service", { message: "Error during QuickNode getUTXOs call", address, error: error.message, stack: error.stack });
      }
    }

    logger.debug("common-utxo-service", { message: "Falling back to public APIs for getSpendableUTXOs (basic list)", address });
    try {
      const publicUtxosResult = await getUTXOsFromPublicAPIsForAddress(address, undefined, undefined, false, 3);
      
      if (Array.isArray(publicUtxosResult)) {
        logger.info("common-utxo-service", { message: "Successfully fetched basic UTXOs from public APIs", address, count: publicUtxosResult.length });
        return publicUtxosResult.map(utxo => ({
          txid: utxo.txid,
          vout: utxo.vout,
          value: utxo.value
        }));
      }
      logger.warn("common-utxo-service", { message: "Public APIs returned non-array or null for getSpendableUTXOs", address, response: publicUtxosResult });
      return [];
    } catch (error) {
      logger.error("common-utxo-service", { message: "Error fetching basic UTXOs from public APIs", address, error: error.message, stack: error.stack });
      return [];
    }
  }

  async getSpecificUTXO(
    txid: string,
    vout: number,
    options?: CommonUTXOFetchOptions,
  ): Promise<UTXO | null> {
    const logContext = { txid, vout, options, quicknodeEnabled: this.isQuickNodeConfigured };
    // logger.debug("common-utxo-service", { message: "getSpecificUTXO called for", txid, vout, options }); // Original debug line

    if (this.isQuickNodeConfigured && !options?.forcePublicAPI) {
      const qnAttemptLogContext = {
        message: "Attempting QuickNode for getSpecificUTXO",
        txid,
        vout,
        includeAncestorDetails: options?.includeAncestorDetails,
        isQuickNodeConfigured: this.isQuickNodeConfigured,
        forcePublicAPI: options?.forcePublicAPI,
      };
      logger.info("common-utxo-service", qnAttemptLogContext); // More visible log

      try {
        // logger.debug("common-utxo-service", { message: "Attempting QuickNode for getSpecificUTXO", txid, vout }); // Original debug line moved and enhanced above
        const qnResult = await QuicknodeUTXOService.getUTXO(txid, vout, options?.includeAncestorDetails);
        
        const qnResultLog = {
            message: "QuickNode getUTXO result received",
            txid,
            vout,
            hasData: !!(qnResult && qnResult.data),
            hasError: qnResult && qnResult.error ? qnResult.error : "no explicit error property",
        };
        logger.info("common-utxo-service", qnResultLog);
        
        if (qnResult && qnResult.data) {
          // console.log(\`[CommonUTXO] USING QuickNode for ${txid}:${vout}. Script: ${qnResult.data.script}, Value: ${qnResult.data.value}\`); // Original console.log
          logger.info("common-utxo-service", { 
            message: "[CommonUTXO] USING QuickNode for " + txid + ":" + vout + ". Script: " + qnResult.data.script?.substring(0,20) + "... Value: " + qnResult.data.value
          }); // Changed to logger.info and truncated script, using string concatenation
          return qnResult.data;
        }
        if (qnResult && qnResult.error) {
            logger.warn("common-utxo-service", { message: "QuickNode returned error for getSpecificUTXO (after detailed log)", txid, vout, error: qnResult.error });
        } else if (!qnResult?.data) { // Covers qnResult being null/undefined, or qnResult.data being null/undefined
            logger.info("common-utxo-service", { message: "QuickNode did not find specific UTXO or returned no data (after detailed log)", txid, vout });
        }
      } catch (error) {
        logger.error("common-utxo-service", { message: "Error during QuickNode getSpecificUTXO call (exception caught)", txid, vout, error: error.message, stack: error.stack });
      }
    }

    logger.debug("common-utxo-service", { 
        message: (this.isQuickNodeConfigured && options?.forcePublicAPI) 
            ? "FORCING public APIs for getSpecificUTXO due to option" 
            : "Falling back/using public APIs for getSpecificUTXO", 
        txid, vout 
    });
    try {
        const response = await fetch(`${BLOCKSTREAM_API_BASE_URL}/tx/${txid}`);
        if (!response.ok) {
            logger.warn("common-utxo-service", { message: `Public API (Blockstream) failed to fetch tx ${txid}`, status: response.statusText, code: response.status });
            return null;
        }
        const txData = await response.json();
        if (txData && Array.isArray(txData.vout) && txData.vout[vout]) {
            const output = txData.vout[vout];
            if (output.value === undefined || !output.scriptpubkey) {
                 logger.warn("common-utxo-service", { message: "Blockstream output missing value or scriptpubkey", txid, vout, output });
                 return null;
            }
            
            const scriptFromBlockstream = output.scriptpubkey; // hex string
            console.log(`[CommonUTXO] USING Blockstream for ${txid}:${vout}. Fetched scriptpubkey: ${scriptFromBlockstream}, Value: ${output.value}`);
            
            const formattedUtxo: UTXO = {
                txid: txid, vout: vout, value: output.value, script: scriptFromBlockstream,
                vsize: txData.weight ? Math.ceil(txData.weight / 4) : undefined,
                weight: txData.weight,
                scriptType: detectScriptType(scriptFromBlockstream),
            };
            logger.info("common-utxo-service", { message: "Successfully fetched and formatted specific UTXO from public API (Blockstream)", txid, vout });
            console.log(`[CommonUTXOService.getSpecificUTXO - Blockstream Path] Returning for ${txid}:${vout}, script in UTXO object: ${formattedUtxo.script}`);
            return formattedUtxo;
        } else {
            logger.warn("common-utxo-service", { message: "Specific output not found in tx from public API (Blockstream)", txid, vout, receivedVoutLength: txData?.vout?.length });
            return null;
        }
    } catch (error) {
      logger.error("common-utxo-service", { message: "Error fetching specific UTXO from public APIs", txid, vout, error: error.message, stack: error.stack });
      return null;
    }
  }
} 