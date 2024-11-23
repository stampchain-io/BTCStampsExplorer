import { UTXO } from "$types/index.d.ts";
import { decodeBase58 } from "@std/encoding/base58";
import { getScriptTypeInfo } from "$lib/utils/scriptTypeUtils.ts";

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

function estimateInputSize(script: string): number {
  const scriptType = getScriptTypeInfo(script);
  return scriptType.size;
}

function formatUTXOs(data: any[], address: string): UTXO[] | null {
  try {
    console.log("Formatting UTXOs for data:", data);

    const formattedUtxos = data.map((tx: any) => {
      console.log("\nProcessing UTXO raw data:", tx);

      let txid = tx.txid ?? tx.tx_hash;
      if (tx.tx_hash) {
        txid = reverseEndian(tx.tx_hash);
      }
      const vout = tx.vout ?? tx.tx_output_n ?? tx.n;
      const value = tx.value ?? tx.amount ?? tx.value_sat;

      // Enhanced script handling
      let script = tx.script ?? tx.scriptpubkey;
      if (!script && tx.scriptPubKey) {
        script = tx.scriptPubKey.hex ?? tx.scriptPubKey;
      }

      console.log("Initial script value:", script);

      // If script is missing or invalid, try to construct it
      if (!script || !isValidScript(script)) {
        console.log("Attempting to construct script from address");
        script = constructScriptFromAddress(address);
        if (script) {
          console.log("Successfully constructed script:", script);
        } else {
          console.warn("Failed to construct valid script");
          return null;
        }
      }

      console.log("Extracted values:", {
        txid,
        vout,
        value,
        script,
        scriptSources: {
          directScript: tx.script,
          scriptpubkey: tx.scriptpubkey,
          scriptPubKey: tx.scriptPubKey,
        },
      });

      if (
        !txid || typeof vout === "undefined" || typeof value === "undefined"
      ) {
        console.warn("Missing required UTXO fields:", {
          txid,
          vout,
          value,
          script,
          rawData: tx,
        });
        return null;
      }

      const formattedUtxo: UTXO = {
        txid,
        vout,
        value,
        address: address,
        script,
        size: tx.size ?? estimateInputSize(script),
        status: {
          confirmed: tx.status?.confirmed ?? tx.confirmations > 0,
          block_height: tx.status?.block_height ?? tx.block_height ?? undefined,
          block_hash: tx.status?.block_hash ?? tx.block_hash ?? undefined,
          block_time: tx.status?.block_time ??
            (tx.confirmed ? new Date(tx.confirmed).getTime() : undefined),
        },
        index: tx.tx_index ?? vout,
      };

      console.log("Formatted UTXO:", formattedUtxo);
      return formattedUtxo;
    }).filter((utxo): utxo is UTXO => {
      if (!utxo) return false;

      // Additional validation for script
      if (!utxo.script) {
        console.warn(
          `Filtering out UTXO ${utxo.txid}:${utxo.vout} due to missing script`,
        );
        return false;
      }
      // Validate script format
      if (!isValidScript(utxo.script)) {
        console.warn(
          `Filtering out UTXO ${utxo.txid}:${utxo.vout} due to invalid script format`,
        );
        return false;
      }
      return true;
    });

    console.log(
      `Final formatted UTXOs (${formattedUtxos.length}):`,
      formattedUtxos,
    );
    return formattedUtxos;
  } catch (error) {
    console.warn(
      "Error formatting UTXOs:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

// Helper function to validate script format
function isValidScript(script: string): boolean {
  // Basic validation of script format
  if (!script || typeof script !== "string") {
    console.log("Script validation failed: script is empty or not a string");
    return false;
  }

  // Check if it's a valid hex string
  if (!/^[0-9a-fA-F]+$/.test(script)) {
    console.log("Script validation failed: not a valid hex string");
    return false;
  }

  // Log the script and its length
  console.log("Validating script:", {
    script,
    length: script.length,
    prefix: script.substring(0, 4),
  });

  // Check for common script prefixes and patterns
  const validPrefixes = [
    "0014", // P2WPKH
    "5120", // P2TR
    "a914", // P2SH
    "76a9", // P2PKH
    "0020", // P2WSH
  ];

  const hasValidPrefix = validPrefixes.some((prefix) =>
    script.startsWith(prefix)
  );
  if (!hasValidPrefix) {
    console.log(
      "Script validation failed: does not start with any valid prefix",
      validPrefixes,
    );
  }

  return hasValidPrefix;
}

// Update script construction for P2WPKH addresses
function constructScriptFromAddress(address: string): string | null {
  try {
    console.log("Constructing script for address:", address);

    if (address.startsWith("bc1q")) {
      // For P2WPKH addresses
      const witnessProgram = address.slice(4);
      const script = `0014${witnessProgram}`;
      console.log("Constructed P2WPKH script:", script);
      return script;
    } else if (address.startsWith("bc1p")) {
      // For P2TR addresses
      const witnessProgram = address.slice(4);
      const script = `5120${witnessProgram}`;
      console.log("Constructed P2TR script:", script);
      return script;
    } else if (address.startsWith("3")) {
      // For P2SH addresses
      const decoded = decodeBase58(address);
      const pubKeyHash = decoded.slice(1, -4);
      const script = `a914${pubKeyHash}87`;
      console.log("Constructed P2SH script:", script);
      return script;
    } else if (address.startsWith("1")) {
      // For legacy P2PKH addresses
      const decoded = decodeBase58(address);
      const pubKeyHash = decoded.slice(1, -4);
      const script = `76a914${pubKeyHash}88ac`;
      console.log("Constructed P2PKH script:", script);
      return script;
    }

    console.log("Unknown address format:", address);
    return null;
  } catch (error) {
    console.warn("Failed to construct script from address:", error);
    return null;
  }
}

// Generic API request handler with failover
async function tryAPIs<T extends UTXO[] | TxInfo>(
  endpoints: Array<{
    name: string;
    fn: () => Promise<T | null>;
  }>,
  maxRetries = 3,
): Promise<T | null> {
  console.log(`\n>>> tryAPIs called with ${endpoints.length} endpoints`);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    console.log(
      `\n=== Starting API Attempt ${attempt + 1} of ${maxRetries} ===`,
    );

    for (const endpoint of endpoints) {
      console.log(`\n>>> Starting attempt with ${endpoint.name}`);

      try {
        // Execute the endpoint function and await its result
        console.log(`>>> Executing ${endpoint.name} function`);
        const result = await endpoint.fn();
        console.log(`>>> ${endpoint.name} execution completed`);

        // Log the result structure
        console.log(`>>> ${endpoint.name} result:`, {
          hasResult: result !== null,
          type: result ? typeof result : "null",
          isArray: Array.isArray(result),
          structure: result ? Object.keys(result) : "null",
        });

        // If we got a valid result, return it immediately
        if (result !== null) {
          if (Array.isArray(result) && result.length === 0) {
            console.log(
              `>>> ${endpoint.name}: Empty array result, trying next endpoint`,
            );
            continue;
          }

          // For TxInfo type results, validate the structure
          if (typeof result === "object" && "utxo" in result) {
            const txInfo = result as { utxo?: any };
            if (!txInfo.utxo) {
              console.log(
                `>>> ${endpoint.name}: Missing UTXO data, trying next endpoint`,
              );
              continue;
            }

            // Validate required UTXO fields
            const utxo = txInfo.utxo;
            if (!utxo.script || !utxo.value) {
              console.log(
                `>>> ${endpoint.name}: Incomplete UTXO data, trying next endpoint`,
              );
              continue;
            }
          }

          console.log(`>>> ${endpoint.name}: Success! Returning result`);
          return result;
        }

        console.log(`>>> ${endpoint.name}: Null result, trying next endpoint`);
      } catch (error) {
        console.error(`>>> ${endpoint.name} error:`, {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }

    // If we get here, all endpoints failed in this attempt
    if (attempt < maxRetries - 1) {
      const delay = (attempt + 1) * 1000;
      console.log(
        `\n>>> All endpoints failed in attempt ${
          attempt + 1
        }. Waiting ${delay}ms before retry...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error("\n=== All API endpoints failed after all retries ===");
  return null;
}

interface TxInfo {
  utxo?: UTXO;
  ancestor?: {
    fees: number;
    vsize: number;
    effectiveRate: number;
  };
}

export async function getUTXOForAddress(
  address: string,
  specificTxid?: string,
  specificVout?: number,
  includeAncestors = false,
  retries = 3,
): Promise<UTXO[] | TxInfo | null> {
  console.log(`
>>> getUTXOForAddress called with:
Address: ${address}
TxID: ${specificTxid}
Vout: ${specificVout}
Include Ancestors: ${includeAncestors}
Retries: ${retries}
`);

  const endpoints = [
    {
      name: "mempool.space",
      fn: async () => {
        console.log("\n>>> MEMPOOL: Function called");
        try {
          if (specificTxid && specificVout !== undefined) {
            const url = `${MEMPOOL_API_BASE_URL}/tx/${specificTxid}`;
            console.log(">>> MEMPOOL: Fetching from URL:", url);

            const response = await fetch(url);
            console.log(`>>> MEMPOOL: Response status: ${response.status}`);

            if (!response.ok) {
              console.log(">>> MEMPOOL: Response not OK");
              return null;
            }

            const tx = await response.json();
            console.log(">>> MEMPOOL: Got transaction data");

            if (!tx.vout || !tx.vout[specificVout]) return null;

            const utxoData = {
              txid: specificTxid,
              vout: specificVout,
              value: tx.vout[specificVout].value,
              scriptpubkey: tx.vout[specificVout].scriptpubkey,
              status: tx.status,
            };

            const formattedUtxos = formatUTXOs([utxoData], address);
            return {
              utxo: formattedUtxos?.[0],
              ancestor: includeAncestors
                ? {
                  fees: tx.ancestor_fees || 0,
                  vsize: tx.ancestor_size || 0,
                  effectiveRate: tx.effective_fee_rate || 0,
                }
                : undefined,
            } as TxInfo;
          } else {
            // Bulk UTXO fetch - return all UTXOs
            const response = await fetch(
              `${MEMPOOL_API_BASE_URL}/address/${address}/utxo`,
            );
            if (!response.ok) return null;

            const utxos = await response.json();
            return formatUTXOs(utxos, address); // Return all formatted UTXOs
          }
        } catch (error) {
          console.error(">>> MEMPOOL: Error in function:", error);
          return null;
        }
      },
    },
    {
      name: "blockstream.info",
      fn: async () => {
        console.log(">>> BLOCKSTREAM: Starting fetch");
        try {
          if (specificTxid && specificVout !== undefined) {
            // Specific UTXO fetch remains the same
            const response = await fetch(
              `${BLOCKSTREAM_API_BASE_URL}/tx/${specificTxid}`,
            );
            console.log(`>>> BLOCKSTREAM: Response status: ${response.status}`);
            if (!response.ok) return null;

            const tx = await response.json();
            console.log(">>> BLOCKSTREAM: Transaction data:", tx);
            if (!tx.vout || !tx.vout[specificVout]) return null;

            const utxoData = {
              txid: specificTxid,
              vout: specificVout,
              value: tx.vout[specificVout].value,
              scriptpubkey: tx.vout[specificVout].scriptpubkey,
              status: tx.status,
            };

            const formattedUtxos = formatUTXOs([utxoData], address);
            console.log(">>> BLOCKSTREAM: Formatted UTXOs:", formattedUtxos);

            const result: TxInfo = {
              utxo: formattedUtxos?.[0],
            };

            if (includeAncestors) {
              result.ancestor = {
                fees: tx.fee || 0,
                vsize: tx.weight ? Math.ceil(tx.weight / 4) : 0,
                effectiveRate: tx.fee && tx.weight
                  ? (tx.fee / (tx.weight / 4))
                  : 0,
              };
            }

            return result;
          } else {
            const response = await fetch(
              `${BLOCKSTREAM_API_BASE_URL}/address/${address}/utxo`,
            );
            if (!response.ok) return null;

            const utxos = await response.json();
            return formatUTXOs(utxos, address); // Return all formatted UTXOs
          }
        } catch (error) {
          console.error(">>> BLOCKSTREAM: Error:", error);
          return null;
        }
      },
    },
    {
      name: "blockchain.info",
      fn: async () => {
        console.log(">>> BLOCKCHAIN: Starting fetch");
        try {
          if (specificTxid && specificVout !== undefined) {
            // Specific UTXO fetch remains the same
            const response = await fetch(
              `${BLOCKCHAIN_API_BASE_URL}/rawtx/${specificTxid}`,
            );
            console.log(`>>> BLOCKCHAIN: Response status: ${response.status}`);
            if (!response.ok) return null;

            const tx = await response.json();
            console.log(">>> BLOCKCHAIN: Transaction data:", tx);
            if (!tx.out || !tx.out[specificVout]) return null;

            const utxoData = {
              txid: specificTxid,
              vout: specificVout,
              value: tx.out[specificVout].value,
              script: tx.out[specificVout].script,
              status: { confirmed: tx.block_height > 0 },
            };

            const formattedUtxos = formatUTXOs([utxoData], address);
            console.log(">>> BLOCKCHAIN: Formatted UTXOs:", formattedUtxos);

            return { utxo: formattedUtxos?.[0] };
          } else {
            // Bulk UTXO fetch - return all UTXOs
            const response = await fetch(
              `${BLOCKCHAIN_API_BASE_URL}/unspent?active=${address}`,
            );
            if (!response.ok) return null;

            const data = await response.json();
            if (data.error) return null;

            return formatUTXOs(data.unspent_outputs, address); // Return all formatted UTXOs
          }
        } catch (error) {
          console.error(">>> BLOCKCHAIN: Error:", error);
          return null;
        }
      },
    },
    {
      name: "blockcypher",
      fn: async () => {
        console.log(">>> BLOCKCYPHER: Starting fetch");
        try {
          if (specificTxid && specificVout !== undefined) {
            // Specific UTXO fetch remains the same
            const response = await fetch(
              `${BLOCKCYPHER_API_BASE_URL}/v1/btc/main/txs/${specificTxid}?includeHex=true&includeScript=true`,
            );
            console.log(`>>> BLOCKCYPHER: Response status: ${response.status}`);
            if (!response.ok) return null;

            const tx = await response.json();
            console.log(">>> BLOCKCYPHER: Transaction data:", tx);
            if (!tx.outputs || !tx.outputs[specificVout]) return null;

            const utxoData = {
              txid: specificTxid,
              vout: specificVout,
              value: tx.outputs[specificVout].value,
              script: tx.outputs[specificVout].script,
              status: {
                confirmed: tx.confirmations > 0,
                block_height: tx.block_height,
                block_hash: tx.block_hash,
                block_time: tx.confirmed
                  ? new Date(tx.confirmed).getTime()
                  : undefined,
              },
            };

            const formattedUtxos = formatUTXOs([utxoData], address);
            console.log(">>> BLOCKCYPHER: Formatted UTXOs:", formattedUtxos);

            return { utxo: formattedUtxos?.[0] };
          } else {
            // Bulk UTXO fetch - return all UTXOs
            const response = await fetch(
              `${BLOCKCYPHER_API_BASE_URL}/v1/btc/main/addrs/${address}?unspentOnly=true&includeScript=true`,
            );
            if (!response.ok) return null;

            const data = await response.json();
            if (data.error || !data.txrefs) return null;

            return formatUTXOs(data.txrefs, address); // Return all formatted UTXOs
          }
        } catch (error) {
          console.error(">>> BLOCKCYPHER: Error:", error);
          return null;
        }
      },
    },
  ];

  console.log(`>>> Starting tryAPIs with ${endpoints.length} endpoints`);
  return await tryAPIs(endpoints, retries);
}
