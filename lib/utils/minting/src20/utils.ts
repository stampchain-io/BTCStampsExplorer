import * as bitcoin from "bitcoin";
import { estimateInputSize } from "utils/minting/src20/utxo-selector.ts";
import { SRC20Row } from "globals";

const MAX_RETRIES = 3;
const BLOCKCYPHER_API_BASE_URL = "https://api.blockcypher.com";
const BLOCKCHAIN_API_BASE_URL = "https://blockchain.info";

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

// export async function fetchPricefromBlockCypherAPI(
//   tx_hash: string,
//   source: string,
// ): Promise<number | null> {
//   // lookup tx_hash details from api, look in the outputs  key to match the source var
//   // with the outputs key addresses and return satoshirate from the addresses value that mamtches the
//   // source var - the returned value is  the sale price of the dispense
//   // {
//   // "outputs": [
//   //   {
//   //     "value": 85380,
//   //     "script": "0014b991d97a78403dfe523f721a7bdc61f2636d4b35",
//   //     "addresses": [
//   //       "bc1qhxgaj7ncgq7lu53lwgd8hhrp7f3k6je4mzmp8r"
//   //     ],
//   //     "script_type": "pay-to-witness-pubkey-hash"
//   //   }, ...
//   //  ]
//   try {
//     const endpoint = `${BLOCKCYPHER_API_BASE_URL}/v1/btc/main/txs/${tx_hash}`;
//     const response = await fetch(endpoint);
//     const data = await response.json();
//     if (data.error) {
//       throw new Error(data.error);
//     }
//     const outputs = data.outputs;
//     for (const output of outputs) {
//       if (output.addresses.includes(source)) {
//         return output.value;
//       }
//     }
//     return null;
//   } catch (error) {
//     console.error(error);
//     return null;
//   }
// }

async function fetchUTXOsFromBlockchainAPI(address: string) {
  try {
    const endpoint = `${BLOCKCHAIN_API_BASE_URL}/unspent?active=${address}`;
    const response = await fetch(endpoint);
    const data = await response.json();
    if (data.error) {
      throw new Error(data.message);
    }
    const formatedUtxos = data.unspent_outputs.map((tx: UTXOFromBlockchain) => {
      const formatedUTXO: UTXO = {
        txid: tx.tx_hash_big_endian,
        tx_hash: tx.tx_hash,
        vout: tx.tx_output_n,
        status: {
          confirmed: tx.confirmations > 0,
          block_height: undefined,
          block_hash: undefined,
          block_time: undefined,
        },
        value: tx.value,
        script: tx.script,
        index: tx.tx_index,
        size: estimateInputSize(tx.script),
      };
      return formatedUTXO;
    });
    return formatedUtxos;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function fetchUTXOsFromBlockCypherAPI(address: string) {
  try {
    const endpoint =
      `${BLOCKCYPHER_API_BASE_URL}/v1/btc/main/addrs/${address}?unspentOnly=true&includeScript=true`;
    const response = await fetch(endpoint);
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    const formatedUtxos = data.txrefs.map((tx: UTXOFromBlockCypher) => {
      const formatedUTXO: UTXO = {
        txid: reverseEndian(tx.tx_hash),
        tx_hash: tx.tx_hash,
        vout: tx.tx_output_n,
        status: {
          confirmed: tx.confirmations > 0,
          block_height: tx.block_height,
          block_hash: undefined,
          block_time: new Date(tx.confirmed).getTime(),
        },
        value: tx.value,
        script: tx.script,
        size: estimateInputSize(tx.script),
      };
      return formatedUTXO;
    });
    return formatedUtxos;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getUTXOForAddress(
  address: string,
  retries = 0,
): Promise<UTXO[] | null> {
  try {
    let utxos = await fetchUTXOsFromBlockchainAPI(address);
    if (!utxos || utxos.length === 0) {
      utxos = await fetchUTXOsFromBlockCypherAPI(address);
    }
    return utxos;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await getUTXOForAddress(address, retries + 1);
    } else {
      console.error(error);
      return null;
    }
  }
}
