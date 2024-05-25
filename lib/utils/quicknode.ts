import { conf } from "utils/config.ts";
import { MAX_XCP_RETRIES } from "utils/constants.ts";

const { QUICKNODE_ENDPOINT, QUICKNODE_API_KEY } = conf;
const QUICKNODE_URL = `${QUICKNODE_ENDPOINT}/${QUICKNODE_API_KEY}`;

export const fetch_quicknode = async (
  method: string,
  params: unknown[],
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
  } catch (error) {
    if (retries < MAX_XCP_RETRIES) {
      console.log(`Retrying... (${retries + 1}/${MAX_XCP_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await fetch_quicknode(method, params, retries + 1);
    } else {
      console.error("Max retries reached. Returning null.");
      return null;
    }
  }
};

export async function get_public_key_from_address(address: string) {
  const method = "validateaddress";
  const params = [address];
  try {
    const result = await fetch_quicknode(method, params);
    return result.result.scriptPubKey;
  } catch (error) {
    console.error(`ERROR: Error getting public key from address:`, error);
    throw error;
  }
}

async function get_raw_tx(txHash: string) {
  const method = "getrawtransaction";
  const params = [txHash, 0];
  try {
    const result = await fetch_quicknode(method, params);
    if (!result) {
      throw new Error(`Error: No result for txHash: ${txHash}`);
    }
    return result.result;
  } catch (error) {
    console.error(`ERROR: Error getting raw tx:`, error);
    throw error;
  }
}

async function get_decoded_tx(txHex: string) {
  const method = "decoderawtransaction";
  const params = [txHex];
  try {
    const result = await fetch_quicknode(method, params);
    return result.result;
  } catch (error) {
    console.error(`ERROR: Error getting decoded tx:`, error);
    throw error;
  }
}

export async function get_transaction(txHash: string) {
  const hex = await get_raw_tx(txHash);
  const tx_data = await get_decoded_tx(hex);
  return { ...tx_data, hex };
}
