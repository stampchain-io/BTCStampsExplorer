import * as bitcoin from "bitcoinjs-lib";
import { Buffer } from "buffer";
import { arc4, bin2hex, hex2bin } from "$lib/utils/minting/utils.ts";
import { zLibUncompress } from "$lib/utils/minting/zlib.ts";
import { getTransaction } from "$lib/utils/quicknode.ts";
import * as msgpack from "msgpack";

const STAMP_PREFIX = "stamp:";

async function decodeSRC20Transaction(txHash: string): Promise<string> {
  try {
    // Fetch the transaction details
    const txDetails = await getTransaction(txHash);

    // Reconstruct the encrypted data from multisig outputs
    const multisigOutputs = txDetails.vout.filter(
      (output: any) => output.scriptPubKey.type === "multisig",
    );

    if (multisigOutputs.length === 0) {
      throw new Error("No multisig outputs found in the transaction");
    }

    let encryptedData = "";
    for (const output of multisigOutputs) {
      const script = Buffer.from(output.scriptPubKey.hex, "hex");
      const pubkeys = bitcoin.script.decompile(script)?.slice(
        1,
        -2,
      ) as Buffer[];
      if (!pubkeys || pubkeys.length !== 3) continue;

      const chunk1 = pubkeys[0].toString("hex").slice(2, -2);
      const chunk2 = pubkeys[1].toString("hex").slice(2, -2);
      encryptedData += chunk1 + chunk2;
    }

    console.log("Encrypted data:", encryptedData);

    // Decrypt the data using the first input's txid as the key
    const decryptionKey = txDetails.vin[0].txid;
    console.log("Decryption key:", decryptionKey);
    const decryptedData = arc4(hex2bin(decryptionKey), hex2bin(encryptedData));

    console.log("Decrypted data (hex):", bin2hex(decryptedData));

    // Extract the length and actual data
    const chunkLength = parseInt(bin2hex(decryptedData.slice(0, 2)), 16);
    console.log("Chunk length:", chunkLength);
    const chunk = decryptedData.slice(2, 2 + chunkLength);

    console.log("Chunk (hex):", bin2hex(chunk));

    // Check for STAMP prefix
    const prefix = new TextDecoder().decode(
      chunk.slice(0, STAMP_PREFIX.length),
    );
    console.log("Detected prefix:", prefix);

    if (prefix !== STAMP_PREFIX) {
      throw new Error("Invalid data format: missing STAMP prefix");
    }

    const data = chunk.slice(STAMP_PREFIX.length);
    console.log("Data without prefix (hex):", bin2hex(data));

    // Validate data length
    const dataLength = chunk.length - STAMP_PREFIX.length;
    if (dataLength !== chunkLength - STAMP_PREFIX.length) {
      throw new Error("Invalid data length");
    }

    // Try to decompress and decode the data
    try {
      const uncompressedData = await zLibUncompress(data);
      console.log("Uncompressed data (hex):", bin2hex(uncompressedData));

      // Decode using MessagePack
      const decodedData = msgpack.decode(uncompressedData);
      return decodedData;
    } catch (error) {
      console.warn("Failed to decompress data, raw text output");
      // If decompression fails, return the data as a string without parsing
      return new TextDecoder().decode(data).trim();
    }
  } catch (error) {
    console.error("Error decoding data:", error);
    // If all decoding attempts fail, return the data as a string
    return new TextDecoder().decode(data).trim();
  }
}

// Example usage
async function main() {
  //     "3e5960feb9bf662d922eb3f5d02577d8e741499b964a878ea0690430f596c7e3";
  const txHash = Deno.args[0];
  if (!txHash) {
    console.error("Please provide a transaction hash as an argument.");
    console.error("Usage: deno run --allow-net decode_src20_tx.ts <tx_hash>");
    Deno.exit(1);
  }

  try {
    const decodedData = await decodeSRC20Transaction(txHash);
    console.log("Decoded SRC-20 Data:", decodedData);
  } catch (error) {
    console.error("Failed to decode SRC-20 transaction:", error);
  }
}

main();
