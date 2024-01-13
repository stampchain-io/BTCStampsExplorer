import { conf } from "utils/config.ts";
import { MAX_XCP_RETRIES } from "utils/constants.ts";

//const { QUICKNODE_ENDPOINT, QUICKNODE_API_KEY } = conf;
const QUICKNODE_ENDPOINT = "https://restless-fittest-cloud.btc.quiknode.pro";
const QUICKNODE_API_KEY = "bcd1571a0d975dadf4d8be878ebcc15b2bc7fae4";

const QUICKNODE_URL = `${QUICKNODE_ENDPOINT}/${QUICKNODE_API_KEY}`;
export const fetch_quicknode = async (
  method: string,
  params: unknown[],
  retries = 0,
) => {
  try {
    console.log(method, params);
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
    console.log("options", options);
    const response = await fetch(QUICKNODE_URL, options);
    console.log("response", response);
    if (!response.ok) {
      throw new Error(
        `Error: response for method: ${method} at ${QUICKNODE_ENDPOINT} unsuccessful. Response: ${response.status}`,
      );
    }
    const result = await response.json();
    return result;
  } catch (error) {
    if (retries < MAX_XCP_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await fetch_quicknode(method, params, retries + 1);
    } else {
      console.error(error);
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
    console.log("get_raw_tx", result);
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
    console.log("decode_tx", result);
    return result.result;
  } catch (error) {
    console.error(`ERROR: Error getting decoded tx:`, error);
    throw error;
  }
}

export async function get_transaction(txHash: string) {
  console.log("get_transaction", txHash);
  const hex = await get_raw_tx(txHash);
  const tx_data = await get_decoded_tx(hex);
  return { ...tx_data, hex };
}
