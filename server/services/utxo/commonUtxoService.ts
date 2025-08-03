import type { CommonUTXOFetchOptions } from "$types/base.d.ts";
import { UTXO } from "$lib/types/base.d.ts";
import { BLOCKSTREAM_API_BASE_URL, MEMPOOL_API_BASE_URL } from "$constants";
import { logger } from "$lib/utils/logger.ts";
import { detectScriptType } from "$lib/utils/bitcoin/scripts/scriptTypeUtils.ts";
import {
    getUTXOForAddress as getUTXOsFromPublicAPIsForAddress
} from "$lib/utils/bitcoin/utxo/utxoUtils.ts";
import { serverConfig } from "$server/config/config.ts";
import { FetchHttpClient } from "$server/interfaces/httpClient.ts";
import { UTXOOptions as QuicknodeInternalUTXOOptions, QuicknodeUTXOService } from "$server/services/quicknode/quicknodeUTXOService.ts";
import { ICommonUTXOService, UTXOFetchOptions } from "$server/services/utxo/utxoServiceInterface.d.ts";

const httpClient = new FetchHttpClient();


// Added interface for mempool.space transaction response
interface MempoolTransaction {
  txid: string;
  version: number;
  locktime: number;
  vin: Array<{
    txid: string;
    vout: number;
    prevout?: {
      scriptpubkey: string;
      scriptpubkey_asm: string;
      scriptpubkey_type: string;
      scriptpubkey_address?: string;
      value: number;
    };
    scriptsig: string;
    scriptsig_asm: string;
    witness?: string[];
    is_coinbase: boolean;
    sequence: number;
  }>;
  vout: Array<{
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address?: string;
    value: number;
  }>;
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

/**
 * Common UTXO Service managing UTXO fetching from multiple sources,
 * prioritizing QuickNode if configured, and falling back to public APIs.
 */
export class CommonUTXOService implements ICommonUTXOService {
  private static instance: CommonUTXOService;
  protected isQuickNodeConfigured: boolean;
  protected rawTxHexCache: Map<string, string | null>; // Cache for raw tx hex

  constructor() {
    // Initialize QuickNode configuration check
    this.isQuickNodeConfigured = !!(
      serverConfig.QUICKNODE_ENDPOINT && serverConfig.QUICKNODE_API_KEY
    );
    this.rawTxHexCache = new Map();
    logger.info("common-utxo-service", { message: "CommonUTXOService initialized", isQuickNodeConfigured: this.isQuickNodeConfigured });
  }

  static getInstance(): CommonUTXOService {
    if (!CommonUTXOService.instance) {
      CommonUTXOService.instance = new CommonUTXOService();
    }
    return CommonUTXOService.instance;
  }

  async getRawTransactionHex(txid: string): Promise<string | null> {
    if (this.rawTxHexCache.has(txid)) {
      const cachedHex = this.rawTxHexCache.get(txid);
      logger.debug("common-utxo-service", { message: "Cache hit for rawTxHex", txid, found: cachedHex !== null });
      return cachedHex || null;
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
        logger.error("common-utxo-service", { message: "Error during QuickNode getRawTransactionHex call", txid, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        // Fall through to public APIs on error
      }
    }

    if (!hex) {
      logger.debug("common-utxo-service", { message: "Falling back to public APIs for getRawTransactionHex", txid });
      try {
        const response = await httpClient.get(`${BLOCKSTREAM_API_BASE_URL}/tx/${txid}/hex`);
        if (response.ok) {
          hex = response.data;
          logger.info("common-utxo-service", { message: "Successfully fetched rawTxHex from public API (Blockstream)", txid });
        } else {
          logger.warn("common-utxo-service", { message: `Public API (Blockstream) failed to fetch raw tx hex ${txid}`, status: response.statusText, code: response.status });
        }
      } catch (error) {
        logger.error("common-utxo-service", { message: "Error fetching rawTxHex from public APIs", txid, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      }
    }

    return hex;
  }

  async getSpendableUTXOs(
    address: string,
    _amountNeeded?: number,
    options?: UTXOFetchOptions,
  ): Promise<UTXO[]> {
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
          return result.data.map(utxo => ({
            txid: utxo.txid,
            vout: utxo.vout,
            value: utxo.value,
            script: "" // QuickNode doesn't provide script in basic UTXO response
          }));
        } else if (result && "error" in result) {
          logger.warn("common-utxo-service", { message: "QuickNode returned an error for getUTXOs", address, error: result.error });
        } else {
          logger.warn("common-utxo-service", { message: "QuickNode returned unexpected response for getUTXOs", address, response: result });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error("common-utxo-service", { message: "Error during QuickNode getUTXOs call", address, error: errorMessage, stack: errorStack });
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
          value: utxo.value,
          script: utxo.script || ""
        }));
      }
      logger.warn("common-utxo-service", { message: "Public APIs returned non-array or null for getSpendableUTXOs", address, response: publicUtxosResult });
      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error("common-utxo-service", { message: "Error fetching basic UTXOs from public APIs", address, error: errorMessage, stack: errorStack });
      return [];
    }
  }

  async getSpecificUTXO(
    txid: string,
    vout: number,
    options?: CommonUTXOFetchOptions,
  ): Promise<UTXO | null> {
    // Context for debugging if needed
    // const logContext = { txid, vout, options, quicknodeEnabled: this.isQuickNodeConfigured };
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error("common-utxo-service", { message: "Error during QuickNode getSpecificUTXO call (exception caught)", txid, vout, error: errorMessage, stack: errorStack });
      }
    }

    logger.debug("common-utxo-service", {
        message: (this.isQuickNodeConfigured && options?.forcePublicAPI)
            ? "FORCING public APIs for getSpecificUTXO due to option"
            : "Falling back/using public APIs for getSpecificUTXO",
        txid, vout
    });

    // Try mempool.space first as it's often faster and more reliable
    try {
      logger.debug("common-utxo-service", { message: "Attempting mempool.space for getSpecificUTXO", txid, vout });
      const response = await httpClient.get(`${MEMPOOL_API_BASE_URL}/tx/${txid}`);

      if (response.ok && response.data) {
        const txData = response.data as MempoolTransaction;

        if (txData && Array.isArray(txData.vout) && txData.vout[vout]) {
          const output = txData.vout[vout];
          if (output.value !== undefined && output.scriptpubkey) {
            const scriptFromMempool = output.scriptpubkey; // hex string
            const formattedUtxo: UTXO = {
              txid: txid,
              vout: vout,
              value: output.value,
              script: scriptFromMempool,
              vsize: txData.weight ? Math.ceil(txData.weight / 4) : 0,
              weight: txData.weight,
              scriptType: detectScriptType(scriptFromMempool),
            };
            logger.info("common-utxo-service", { message: "Successfully fetched and formatted specific UTXO from public API (Mempool.space)", txid, vout });
            return formattedUtxo;
          } else {
            logger.warn("common-utxo-service", { message: "Mempool.space output missing value or scriptpubkey", txid, vout, output });
            // Return null without fallback - if mempool has the tx but output is malformed,
            // other APIs likely won't have better data
            return null;
          }
        } else {
          logger.warn("common-utxo-service", { message: "Specific output not found in tx from mempool.space", txid, vout, receivedVoutLength: txData?.vout?.length });
          // Continue to fallback APIs
        }
      } else {
        logger.warn("common-utxo-service", { message: `Mempool.space failed to fetch tx ${txid}`, status: response.statusText, code: response.status });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn("common-utxo-service", { message: "Error fetching specific UTXO from mempool.space, trying Blockstream", txid, vout, error: errorMessage });
    }

    // Fallback to Blockstream API
    try {
        const response = await httpClient.get(`${BLOCKSTREAM_API_BASE_URL}/tx/${txid}`);
        if (!response.ok) {
            logger.warn("common-utxo-service", { message: `Public API (Blockstream) failed to fetch tx ${txid}`, status: response.statusText, code: response.status });
            return null;
        }
        const txData = response.data;
        if (txData && Array.isArray(txData.vout) && txData.vout[vout]) {
            const output = txData.vout[vout];
            if (output.value === undefined || !output.scriptpubkey) {
                 logger.warn("common-utxo-service", { message: "Blockstream output missing value or scriptpubkey", txid, vout, output });
                 return null;
            }

            const scriptFromBlockstream = output.scriptpubkey; // hex string
            const formattedUtxo: UTXO = {
                txid: txid, vout: vout, value: output.value, script: scriptFromBlockstream,
                vsize: txData.weight ? Math.ceil(txData.weight / 4) : 0,
                weight: txData.weight,
                scriptType: detectScriptType(scriptFromBlockstream),
            };
            logger.info("common-utxo-service", { message: "Successfully fetched and formatted specific UTXO from public API (Blockstream)", txid, vout });
            return formattedUtxo;
        } else {
            logger.warn("common-utxo-service", { message: "Specific output not found in tx from public API (Blockstream)", txid, vout, receivedVoutLength: txData?.vout?.length });
            return null;
        }
    } catch (error) {
      logger.error("common-utxo-service", { message: "Error fetching specific UTXO from all fallback APIs", txid, vout, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      return null;
    }
  }
}
