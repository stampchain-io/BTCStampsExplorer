import { serverConfig } from "$server/config/config.ts";
import { MAX_XCP_RETRIES, BLOCKCHAIN_API_BASE_URL } from "$lib/utils/constants.ts";
import {
  FetchQuicknodeFunction,
  GetDecodedTx,
  GetPublicKeyFromAddress,
  GetRawTx,
  GetTransaction,
} from "$types/index.d.ts";

// Interface for QuickNode estimatesmartfee response
interface EstimateSmartFeeResponse {
  feerate?: number; // Fee rate in BTC/kB
  blocks?: number;  // Number of blocks for which estimate is valid
  errors?: string[]; // Any errors encountered
}

// Interface for our normalized fee response
interface NormalizedFeeEstimate {
  feeRateSatsPerVB: number; // Converted to sats/vB
  blocks: number;
  source: 'quicknode';
  confidence: 'high' | 'medium' | 'low';
}

export class QuicknodeService {
  // Instead of storing the full URL with API key as a static property,
  // construct it only when needed and never expose it
  private static getQuickNodeUrl(): string {
    const endpoint = serverConfig.QUICKNODE_ENDPOINT;
    const apiKey = serverConfig.QUICKNODE_API_KEY;
    
    if (!endpoint || !apiKey) {
      throw new Error("QuickNode API configuration is missing or invalid");
    }
    
    // Ensure the endpoint doesn't already contain a protocol
    const formattedEndpoint = endpoint.replace(/^https?:\/\//, '');
    
    // Return the properly formatted URL
    return `https://${formattedEndpoint}/${apiKey}`;
  }
  
  // For logging and error reporting, use this safe version that hides the API key
  private static getSafeEndpointForLogs(): string {
    const endpoint = serverConfig.QUICKNODE_ENDPOINT;
    if (!endpoint) return "undefined-endpoint";
    return endpoint.replace(/^https?:\/\//, '');
  }

  static async fetchQuicknode(
    method: string,
    params: any[],
    retries = 0,
  ) {
    try {
      // Log the request without exposing sensitive information
      console.log("Fetching from QuickNode:", { 
        method, 
        paramsCount: params.length,
        endpoint: this.getSafeEndpointForLogs() 
      });
      
      // Get the URL only when needed, never store it
      const quicknodeUrl = this.getQuickNodeUrl();
      const response = await fetch(quicknodeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method,
          params,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Error: response for method: ${method} unsuccessful. Response: ${response.status} - ${errorText}`,
        );

        if (
          response.status === 402 ||
          (response.status >= 400 && response.status < 500)
        ) {
          throw new Error(`Fatal error: ${response.status} - ${errorText}`);
        }

        throw new Error(
          `Error: response for method: ${method} unsuccessful. Response: ${response.status}`,
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      // Log detailed error information without exposing sensitive data
      console.error("QuickNode fetch error:", {
        error: error instanceof Error ? error.message : String(error),
        method,
        paramsCount: params.length,
        endpoint: this.getSafeEndpointForLogs(), 
        retryCount: retries,
      });
      
      if (retries < MAX_XCP_RETRIES) {
        console.log(`Retrying QuickNode request... (${retries + 1}/${MAX_XCP_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return await this.fetchQuicknode(method, params, retries + 1);
      } else {
        console.error("Max retries reached. Giving up on QuickNode request.");
        throw error;
      }
    }
  }

  static async getPublicKeyFromAddress(address: string) {
    const method = "validateaddress";
    const params = [address];
    try {
      const result = await this.fetchQuicknode(method, params);
      return result?.result.scriptPubKey;
    } catch (error) {
      console.error(`ERROR: Error getting public key from address:`, error);
      throw error;
    }
  }

  static async getRawTx(txHash: string) {
    const method = "getrawtransaction";
    const params = [txHash, 0];
    try {
      const result = await this.fetchQuicknode(method, params);
      if (!result || !result.result) {
        return await this.fallbackGetRawTx(txHash);
      }
      return result.result;
    } catch (error) {
      console.error(`ERROR: Error getting raw tx from QuickNode:`, error);
      return await this.fallbackGetRawTx(txHash);
    }
  }

  private static async fallbackGetRawTx(txHash: string): Promise<string> {
    console.log(`Attempting fallback for transaction: ${txHash}`);
    try {
      const response = await fetch(
        `${BLOCKCHAIN_API_BASE_URL}/rawtx/${txHash}?format=hex`,
      );
      if (!response.ok) {
        throw new Error(`Blockchain.info API error: ${response.status}`);
      }
      const rawTx = await response.text();
      return rawTx;
    } catch (error) {
      console.error(`ERROR: Fallback failed for tx:`, error);
      throw new Error(`Unable to retrieve transaction ${txHash} from any source`);
    }
  }

  static async getDecodedTx(txHex: string) {
    const method = "decoderawtransaction";
    const params = [txHex];
    try {
      const result = await this.fetchQuicknode(method, params);
      return result?.result;
    } catch (error) {
      console.error(`ERROR: Error getting decoded tx:`, error);
      throw error;
    }
  }

  static async getTransaction(txHash: string) {
    const hex = await this.getRawTx(txHash);
    const txData = await this.getDecodedTx(hex);
    return { ...txData, hex };
  }

  /**
   * Estimate smart fee using QuickNode's Bitcoin Core RPC
   * @param confTarget Confirmation target in blocks (default: 6)
   * @param estimateMode Fee estimate mode: 'economical' or 'conservative' (default: 'economical')
   * @returns Normalized fee estimate in sats/vB or null if failed
   */
  static async estimateSmartFee(
    confTarget: number = 6,
    estimateMode: 'economical' | 'conservative' = 'economical'
  ): Promise<NormalizedFeeEstimate | null> {
    const method = "estimatesmartfee";
    const params = [confTarget, estimateMode];
    
    try {
      console.log(`[QuickNode] Estimating smart fee for ${confTarget} blocks (${estimateMode} mode)`);
      
      const result = await this.fetchQuicknode(method, params);
      
      if (!result?.result) {
        console.error("[QuickNode] estimatesmartfee: No result in response");
        return null;
      }

      const feeData: EstimateSmartFeeResponse = result.result;
      
      // Check for errors in the response
      if (feeData.errors && feeData.errors.length > 0) {
        console.error("[QuickNode] estimatesmartfee errors:", feeData.errors);
        return null;
      }

      // Validate feerate exists and is a valid number
      if (typeof feeData.feerate !== 'number' || feeData.feerate <= 0) {
        console.error("[QuickNode] estimatesmartfee: Invalid or missing feerate", feeData);
        return null;
      }

      // Convert BTC/kB to sats/vB
      // 1 BTC = 100,000,000 satoshis
      // 1 kB = 1000 vB (virtual bytes)
      // Formula: (feerate_btc_per_kb * 100000000) / 1000
      const feeRateSatsPerVB = Math.round((feeData.feerate * 100000000) / 1000);
      
      // Ensure minimum fee rate of 1 sat/vB
      const normalizedFeeRate = Math.max(feeRateSatsPerVB, 1);
      
      // Determine confidence based on confirmation target
      let confidence: 'high' | 'medium' | 'low';
      if (confTarget <= 2) {
        confidence = 'high';
      } else if (confTarget <= 6) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      const estimate: NormalizedFeeEstimate = {
        feeRateSatsPerVB: normalizedFeeRate,
        blocks: feeData.blocks || confTarget,
        source: 'quicknode',
        confidence
      };

      console.log(`[QuickNode] Fee estimate successful:`, {
        originalBtcPerKb: feeData.feerate,
        convertedSatsPerVb: normalizedFeeRate,
        blocks: estimate.blocks,
        confidence: estimate.confidence
      });

      return estimate;
      
    } catch (error) {
      console.error("[QuickNode] estimateSmartFee failed:", {
        error: error instanceof Error ? error.message : String(error),
        confTarget,
        estimateMode,
        endpoint: this.getSafeEndpointForLogs()
      });
      return null;
    }
  }

  /**
   * Get multiple fee estimates for different confirmation targets
   * Useful for providing fast/normal/economy options
   */
  static async getMultipleFeeEstimates(): Promise<{
    fast: NormalizedFeeEstimate | null;    // 1-2 blocks
    normal: NormalizedFeeEstimate | null;  // 6 blocks  
    economy: NormalizedFeeEstimate | null; // 144 blocks
  }> {
    try {
      console.log("[QuickNode] Fetching multiple fee estimates");
      
      // Fetch all estimates in parallel
      const [fastEstimate, normalEstimate, economyEstimate] = await Promise.all([
        this.estimateSmartFee(1, 'conservative'),  // Fast: 1 block, conservative
        this.estimateSmartFee(6, 'economical'),   // Normal: 6 blocks, economical
        this.estimateSmartFee(144, 'economical')  // Economy: 144 blocks, economical
      ]);

      return {
        fast: fastEstimate,
        normal: normalEstimate,
        economy: economyEstimate
      };
      
    } catch (error) {
      console.error("[QuickNode] getMultipleFeeEstimates failed:", error);
      return {
        fast: null,
        normal: null,
        economy: null
      };
    }
  }
} 