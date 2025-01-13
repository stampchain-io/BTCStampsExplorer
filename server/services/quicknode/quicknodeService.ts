import { serverConfig } from "$server/config/config.ts";
import { MAX_XCP_RETRIES, BLOCKCHAIN_API_BASE_URL } from "$lib/utils/constants.ts";
import {
  FetchQuicknodeFunction,
  GetDecodedTx,
  GetPublicKeyFromAddress,
  GetRawTx,
  GetTransaction,
} from "$types/index.d.ts";

export class QuicknodeService {
  private static readonly QUICKNODE_URL = `${serverConfig.QUICKNODE_ENDPOINT}/${serverConfig.QUICKNODE_API_KEY}`;

  static async fetchQuicknode(
    method: string,
    params: any[],
    retries = 0,
  ) {
    try {
      const response = await fetch(this.QUICKNODE_URL, {
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
      if (retries < MAX_XCP_RETRIES) {
        console.log(`Retrying... (${retries + 1}/${MAX_XCP_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return await this.fetchQuicknode(method, params, retries + 1);
      } else {
        console.error("Max retries reached. Returning null.");
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
} 