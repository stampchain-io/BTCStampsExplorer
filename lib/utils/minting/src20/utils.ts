import { estimateInputSize } from "../utxoSelector.ts";
import { UTXO } from "$lib/types/index.d.ts";

const MAX_RETRIES = 3;
const BLOCKCYPHER_API_BASE_URL = "https://api.blockcypher.com";
const BLOCKCHAIN_API_BASE_URL = "https://blockchain.info";
const MEMPOOL_API_BASE_URL = "https://mempool.space/api";

export function isValidBitcoinAddress(address: string): boolean {
  const p2pkhRegex = /^1[1-9A-HJ-NP-Za-km-z]{25,34}$/; // Legacy P2PKH
  const p2shRegex = /^3[1-9A-HJ-NP-Za-km-z]{25,34}$/; // P2SH
  const bech32Regex = /^(bc1q)[0-9a-z]{38,59}$/; // Bech32 P2WPKH
  const taprootRegex = /^(bc1p)[0-9a-z]{58}$/; // Bech32m P2TR (Taproot)

  return (
    p2pkhRegex.test(address) ||
    p2shRegex.test(address) ||
    bech32Regex.test(address) ||
    taprootRegex.test(address)
  );
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
  return data.map((tx: any) => {
    let txid = tx.txid ?? tx.tx_hash;
    if (tx.tx_hash) {
      // Reverse endianness for APIs that provide tx_hash in big-endian
      txid = reverseEndian(tx.tx_hash);
    }
    const vout = tx.vout ?? tx.tx_output_n ?? tx.n;
    if (typeof vout === "undefined") {
      throw new Error(
        `UTXO is missing 'vout' information: ${JSON.stringify(tx)}`,
      );
    }
    const value = tx.value ?? tx.amount ?? tx.value_sat;
    if (typeof value === "undefined") {
      throw new Error(
        `UTXO is missing 'value' information: ${JSON.stringify(tx)}`,
      );
    }
    return {
      txid,
      vout,
      value,
      address: address,
      script: tx.script ?? tx.scriptpubkey,
      size: tx.size ?? estimateInputSize(tx.script ?? tx.scriptpubkey),
      status: {
        confirmed: tx.status?.confirmed ?? tx.confirmations > 0,
        block_height: tx.status?.block_height ?? tx.block_height,
        block_hash: tx.status?.block_hash ?? tx.block_hash,
        block_time: tx.status?.block_time ??
          (tx.confirmed ? new Date(tx.confirmed).getTime() : undefined),
      },
      index: tx.tx_index ?? vout,
    };
  });
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

async function fetchUTXOsFromBlockstreamAPI(address: string): Promise<UTXO[]> {
  try {
    const endpoint = `https://blockstream.info/api/address/${address}/utxo`;
    const response = await fetch(endpoint);
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return formatUTXOs(data, address);
    } else {
      throw new Error("No UTXOs found");
    }
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
    if (!data.txrefs) {
      console.warn("No UTXOs found in data.txrefs");
      return [];
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
    if (Array.isArray(data) && data.length > 0) {
      return formatUTXOs(data, address);
    } else {
      console.warn("No UTXOs found in Mempool.space API");
      return [];
    }
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
    const utxos = await fetchUTXOsFromMempoolAPI(address);
    if (utxos.length > 0) {
      return utxos;
    }
  } catch (error) {
    console.error("Mempool API failed:", error);
  }
  try {
    const utxos = await fetchUTXOsFromBlockstreamAPI(address);
    if (utxos.length > 0) {
      return utxos;
    }
  } catch (error) {
    console.error("Blockstream API failed:", error);
  }
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

  if (retries < MAX_RETRIES) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return await getUTXOForAddress(address, retries + 1);
  } else {
    console.error("All API calls failed");
    return null;
  }
}
