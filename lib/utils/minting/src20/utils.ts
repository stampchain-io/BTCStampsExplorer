import * as bitcoin from "bitcoin";
import { estimateInputSize } from "./utxo-selector.ts";
import { UTXO } from "$lib/types/index.d.ts";

const MAX_RETRIES = 3;
const BLOCKCYPHER_API_BASE_URL = "https://api.blockcypher.com";
const BLOCKCHAIN_API_BASE_URL = "https://blockchain.info";
const MEMPOOL_API_BASE_URL = "https://mempool.space/api";

export function isValidBitcoinAddress(address: string) {
  try {
    bitcoin.address.toOutputScript(address);
    return true;
  } catch (_e) {
    return false;
  }
}

function reverseEndian(hexString: string): string {
  if (hexString.length % 2 !== 0) {
    hexString = "0" + hexString;
  }
  let result = "";
  for (let i = hexString.length; i > 0; i -= 2) {
    result += hexString.substring(i - 2, i);
  }
  return result;
}

function formatUTXOs(data: any[], address: string): UTXO[] {
  return data.map((tx: any) => ({
    txid: tx.txid || reverseEndian(tx.tx_hash),
    vout: tx.vout || tx.tx_output_n,
    value: tx.value,
    address: address,
    script: tx.script,
    size: tx.size || estimateInputSize(tx.script),
    status: {
      confirmed: tx.confirmations > 0,
      block_height: tx.block_height,
      block_hash: undefined,
      block_time: tx.confirmed ? new Date(tx.confirmed).getTime() : undefined,
    },
    index: tx.tx_index,
  }));
}

async function fetchUTXOsFromBlockchainAPI(address: string): Promise<UTXO[]> {
  try {
    const endpoint = `${BLOCKCHAIN_API_BASE_URL}/unspent?active=${address}`;
    const response = await fetch(endpoint);
    const data = await response.json();
    if (data.error) {
      throw new Error(data.message);
    }
    return formatUTXOs(data.unspent_outputs, address);
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function fetchUTXOsFromBlockCypherAPI(address: string): Promise<UTXO[]> {
  try {
    const endpoint =
      `${BLOCKCYPHER_API_BASE_URL}/v1/btc/main/addrs/${address}?unspentOnly=true&includeScript=true`;
    const response = await fetch(endpoint);
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return formatUTXOs(data.txrefs, address);
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function fetchUTXOsFromMempoolAPI(address: string): Promise<UTXO[]> {
  try {
    const endpoint = `${MEMPOOL_API_BASE_URL}/address/${address}/utxo`;
    const response = await fetch(endpoint);
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return formatUTXOs(data, address);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getUTXOForAddress(
  address: string,
  retries = 0,
): Promise<UTXO[] | null> {
  try {
    const utxos = await fetchUTXOsFromBlockchainAPI(address);
    if (utxos.length > 0) {
      return utxos;
    }
  } catch (error) {
    console.error("Blockchain API failed:", error);
  }

  try {
    const utxos = await fetchUTXOsFromBlockCypherAPI(address);
    if (utxos.length > 0) {
      return utxos;
    }
  } catch (error) {
    console.error("BlockCypher API failed:", error);
  }

  try {
    const utxos = await fetchUTXOsFromMempoolAPI(address);
    if (utxos.length > 0) {
      return utxos;
    }
  } catch (error) {
    console.error("Mempool API failed:", error);
  }

  if (retries < MAX_RETRIES) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return await getUTXOForAddress(address, retries + 1);
  } else {
    console.error("All API calls failed");
    return null;
  }
}
