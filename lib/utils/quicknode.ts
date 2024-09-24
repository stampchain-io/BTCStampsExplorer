import { serverConfig } from "$server/config/config.ts";
import { MAX_XCP_RETRIES } from "utils/constants.ts";
import {
  FetchQuicknodeFunction,
  GetDecodedTx,
  GetPublicKeyFromAddress,
  GetRawTx,
  GetTransaction,
} from "$lib/types/index.d.ts";

const { QUICKNODE_ENDPOINT, QUICKNODE_API_KEY } = serverConfig;
const QUICKNODE_URL = `${QUICKNODE_ENDPOINT}/${QUICKNODE_API_KEY}`;

export const fetchQuicknode: FetchQuicknodeFunction = async (
  method,
  params,
  retries = 0,
) => {
  try {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    const body = JSON.stringify({
      method,
      params,
    });
    const options: RequestInit = {
      method: "POST",
      headers: headers,
      body: body,
      redirect: "follow",
    };
    const response = await fetch(QUICKNODE_URL, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Error: response for method: ${method} at ${QUICKNODE_ENDPOINT} unsuccessful. Response: ${response.status} - ${errorText}`,
      );

      // Handle specific fatal HTTP responses
      if (
        response.status === 402 ||
        response.status >= 400 && response.status < 500
      ) {
        throw new Error(`Fatal error: ${response.status} - ${errorText}`);
      }

      throw new Error(
        `Error: response for method: ${method} at ${QUICKNODE_ENDPOINT} unsuccessful. Response: ${response.status}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (_error) {
    if (retries < MAX_XCP_RETRIES) {
      console.log(`Retrying... (${retries + 1}/${MAX_XCP_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await fetchQuicknode(method, params, retries + 1);
    } else {
      console.error("Max retries reached. Returning null.");
      return null;
    }
  }
};

export const getPublicKeyFromAddress: GetPublicKeyFromAddress = async (
  address,
) => {
  const method = "validateaddress";
  const params = [address];
  try {
    const result = await fetchQuicknode(method, params);
    return result?.result.scriptPubKey;
  } catch (error) {
    console.error(`ERROR: Error getting public key from address:`, error);
    throw error;
  }
};

export const getRawTx: GetRawTx = async (txHash) => {
  const method = "getrawtransaction";
  const params = [txHash, 0];
  try {
    const result = await fetchQuicknode(method, params);
    if (!result || !result.result) {
      return await fallbackGetRawTx(txHash);
    }
    return result.result;
  } catch (error) {
    console.error(`ERROR: Error getting raw tx from QuickNode:`, error);
    return await fallbackGetRawTx(txHash);
  }
};

async function fallbackGetRawTx(txHash: string): Promise<string> {
  console.log(`Attempting fallback for transaction: ${txHash}`);
  try {
    const response = await fetch(
      `https://blockchain.info/rawtx/${txHash}?format=hex`,
    );
    if (!response.ok) {
      throw new Error(`Blockchain.info API error: ${response.status}`);
    }
    const rawTx = await response.text();
    // Format the response to match QuickNode's format
    return rawTx;
  } catch (error) {
    console.error(`ERROR: Fallback failed for tx:`, error);
    throw new Error(`Unable to retrieve transaction ${txHash} from any source`);
  }
}

export const getDecodedTx: GetDecodedTx = async (txHex) => {
  const method = "decoderawtransaction";
  const params = [txHex];
  try {
    const result = await fetchQuicknode(method, params);
    return result?.result;
  } catch (error) {
    console.error(`ERROR: Error getting decoded tx:`, error);
    throw error;
  }
};

export const getTransaction: GetTransaction = async (txHash) => {
  const hex = await getRawTx(txHash);
  const txData = await getDecodedTx(hex);
  return { ...txData, hex };
};
