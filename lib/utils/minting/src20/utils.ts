import { estimateInputSize } from "../utxoSelector.ts";
import { UTXO } from "$lib/types/index.d.ts";

const MAX_RETRIES = 3;
const BLOCKCYPHER_API_BASE_URL = "https://api.blockcypher.com";
const BLOCKCHAIN_API_BASE_URL = "https://blockchain.info";
const MEMPOOL_API_BASE_URL = "https://mempool.space/api";
const BLOCKSTREAM_API_BASE_URL = "https://blockstream.info/api";

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
    const script = tx.script ?? tx.scriptpubkey;
    if (typeof script === "undefined") {
      throw new Error(
        `UTXO is missing 'script' information: ${JSON.stringify(tx)}`,
      );
    }
    return {
      txid,
      vout,
      value,
      address: address,
      script,
      size: tx.size ?? estimateInputSize(script),
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
    const endpoint = `${BLOCKSTREAM_API_BASE_URL}/api/address/${address}/utxo`;
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
    console.log("UTXOs from Mempool API:", utxos);
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

// Add new constants for transaction info endpoints
const MEMPOOL_TX_API = "https://mempool.space/api/tx";
const BLOCKSTREAM_TX_API = "https://blockstream.info/api/tx";
const BLOCKCHAIN_TX_API = "https://blockchain.info/rawtx";

interface AncestorInfo {
  fees: number;
  vsize: number;
  effectiveRate: number;
}

async function getAncestorInfoFromMempool(
  txid: string,
): Promise<AncestorInfo | null> {
  try {
    const response = await fetch(`${MEMPOOL_TX_API}/${txid}`);
    if (!response.ok) return null;

    const tx = await response.json();
    return {
      fees: tx.ancestor_fees || 0,
      vsize: tx.ancestor_size || 0,
      effectiveRate: tx.effective_fee_rate || 0,
    };
  } catch (error) {
    console.warn("Failed to fetch ancestor info from mempool.space:", error);
    return null;
  }
}

async function getAncestorInfoFromBlockstream(
  txid: string,
): Promise<AncestorInfo | null> {
  try {
    const response = await fetch(`${BLOCKSTREAM_TX_API}/${txid}`);
    if (!response.ok) return null;

    const tx = await response.json();
    // Blockstream API has different field names
    return {
      fees: tx.fee || 0,
      vsize: tx.weight ? Math.ceil(tx.weight / 4) : 0,
      effectiveRate: tx.fee && tx.weight ? (tx.fee / (tx.weight / 4)) : 0,
    };
  } catch (error) {
    console.warn("Failed to fetch ancestor info from blockstream:", error);
    return null;
  }
}

async function getAncestorInfoFromBlockchain(
  txid: string,
): Promise<AncestorInfo | null> {
  try {
    const response = await fetch(`${BLOCKCHAIN_TX_API}/${txid}`);
    if (!response.ok) return null;

    const tx = await response.json();
    return {
      fees: tx.fee || 0,
      vsize: tx.size || 0, // Note: This is not vsize but actual size
      effectiveRate: tx.fee && tx.size ? (tx.fee / tx.size) : 0,
    };
  } catch (error) {
    console.warn("Failed to fetch ancestor info from blockchain.info:", error);
    return null;
  }
}

export async function getAncestorInfo(
  txid: string,
  retries = 0,
): Promise<AncestorInfo | null> {
  // Try mempool.space first
  const mempoolInfo = await getAncestorInfoFromMempool(txid);
  if (mempoolInfo) return mempoolInfo;

  // Try blockstream.info next
  const blockstreamInfo = await getAncestorInfoFromBlockstream(txid);
  if (blockstreamInfo) return blockstreamInfo;

  // Try blockchain.info last
  const blockchainInfo = await getAncestorInfoFromBlockchain(txid);
  if (blockchainInfo) return blockchainInfo;

  // If all APIs fail and we haven't exceeded retries, try again
  if (retries < MAX_RETRIES) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return getAncestorInfo(txid, retries + 1);
  }

  console.error("All APIs failed to fetch ancestor info");
  return null;
}

// Move relevant functions from btc.ts and btc_server.ts
interface DetailedUTXO {
  value: number;
  scriptPubKey: string;
  hex?: string;
}

async function fetchDetailedUTXOFromMempool(
  txid: string,
  vout: number,
): Promise<DetailedUTXO | null> {
  try {
    const response = await fetch(`${MEMPOOL_API_BASE_URL}/tx/${txid}`);
    if (!response.ok) return null;

    const txData = await response.json();
    const output = txData.vout[vout];
    if (!output) return null;

    return {
      value: output.value,
      scriptPubKey: output.scriptpubkey,
      hex: txData.hex,
    };
  } catch (error) {
    console.warn("Failed to fetch UTXO details from mempool.space:", error);
    return null;
  }
}

async function fetchDetailedUTXOFromBlockstream(
  txid: string,
  vout: number,
): Promise<DetailedUTXO | null> {
  try {
    const response = await fetch(`${BLOCKSTREAM_API_BASE_URL}/tx/${txid}`);
    if (!response.ok) return null;

    const txData = await response.json();
    const output = txData.vout[vout];
    if (!output) return null;

    return {
      value: output.value,
      scriptPubKey: output.scriptpubkey,
      hex: txData.hex,
    };
  } catch (error) {
    console.warn("Failed to fetch UTXO details from blockstream:", error);
    return null;
  }
}

async function fetchDetailedUTXOFromBlockchain(
  txid: string,
  vout: number,
): Promise<DetailedUTXO | null> {
  try {
    const response = await fetch(`${BLOCKCHAIN_API_BASE_URL}/rawtx/${txid}`);
    if (!response.ok) return null;

    const txData = await response.json();
    const output = txData.out[vout];
    if (!output) return null;

    return {
      value: output.value,
      scriptPubKey: output.script,
      // Blockchain.info doesn't provide raw hex
    };
  } catch (error) {
    console.warn("Failed to fetch UTXO details from blockchain.info:", error);
    return null;
  }
}

async function fetchDetailedUTXOFromBlockCypher(
  txid: string,
  vout: number,
): Promise<DetailedUTXO | null> {
  try {
    const response = await fetch(
      `${BLOCKCYPHER_API_BASE_URL}/v1/btc/main/txs/${txid}?includeHex=true`,
    );
    if (!response.ok) return null;

    const txData = await response.json();
    const output = txData.outputs[vout];
    if (!output) return null;

    return {
      value: output.value,
      scriptPubKey: output.script,
      hex: txData.hex,
    };
  } catch (error) {
    console.warn("Failed to fetch UTXO details from blockcypher:", error);
    return null;
  }
}

export async function fetchDetailedUTXO(
  txid: string,
  vout: number,
  retries = 0,
): Promise<DetailedUTXO> {
  // Try mempool.space first
  const mempoolResult = await fetchDetailedUTXOFromMempool(txid, vout);
  if (mempoolResult) return mempoolResult;

  // Try blockstream.info next
  const blockstreamResult = await fetchDetailedUTXOFromBlockstream(txid, vout);
  if (blockstreamResult) return blockstreamResult;

  // Try blockchain.info
  const blockchainResult = await fetchDetailedUTXOFromBlockchain(txid, vout);
  if (blockchainResult) return blockchainResult;

  // Try blockcypher last
  const blockcypherResult = await fetchDetailedUTXOFromBlockCypher(txid, vout);
  if (blockcypherResult) return blockcypherResult;

  // If all APIs fail and we haven't exceeded retries, try again
  if (retries < MAX_RETRIES) {
    console.log(`Retrying fetchDetailedUTXO (attempt ${retries + 1})`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return fetchDetailedUTXO(txid, vout, retries + 1);
  }

  throw new Error(
    `Failed to fetch UTXO details for ${txid}:${vout} from any API`,
  );
}
