// At the very top of the file, before any imports
(globalThis as any).SKIP_REDIS_CONNECTION = true;

import { hex2bin } from "$lib/utils/binary/baseUtils.ts";
import { SRC20Service } from "$server/services/src20/index.ts";
import * as msgpack from "msgpack";
import { QuicknodeService } from "$server/services/quicknode/quicknodeService.ts";
const STAMP_PREFIX = "stamp:";

async function decodeSRC20OLGATransaction(txHash: string): Promise<string> {
  try {
    const txDetails = await QuicknodeService.getTransaction(txHash);

    // Find P2WSH outputs (starting from the second output)
    const dataOutputs = txDetails.vout.slice(1).filter(
      (output: any) => output.scriptPubKey.type === "witness_v0_scripthash",
    );

    if (dataOutputs.length === 0) {
      throw new Error("No data outputs found in the transaction");
    }

    let encodedData = "";
    for (const output of dataOutputs) {
      const script = new Uint8Array(hex2bin(output.scriptPubKey.hex));
      // Remove the first two bytes (OP_0 and push 32 bytes) and convert to hex
      encodedData += Array.from(script.slice(2))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    console.log("Encoded data:", encodedData);

    // Remove padding zeros
    encodedData = encodedData.replace(/0+$/, "");

    // Extract the length prefix (2 bytes)
    const lengthPrefix = parseInt(encodedData.slice(0, 4), 16);
    console.log("Length prefix:", lengthPrefix);

    // Decode the hex data to a Uint8Array, excluding the length prefix
    const decodedBuffer = new Uint8Array(hex2bin(encodedData.slice(4)))
      .slice(0, lengthPrefix);

    console.log("Decoded buffer length:", decodedBuffer.length);

    // Check for STAMP prefix
    const prefix = new TextDecoder().decode(
      decodedBuffer.slice(0, STAMP_PREFIX.length),
    );
    if (prefix !== STAMP_PREFIX) {
      throw new Error("Invalid data format: missing STAMP prefix");
    }

    // Remove the STAMP prefix
    const data = decodedBuffer.slice(STAMP_PREFIX.length);

    // Try to decompress and decode the data
    try {
      const uncompressedData = await SRC20Service.CompressionService
        .zLibUncompress(data);
      console.log("Uncompressed data length:", uncompressedData.length);

      // Decode using MessagePack
      const decodedData = msgpack.decode(uncompressedData);
      console.log("Decoded data (msgpack):", decodedData);
      return JSON.stringify(decodedData);
    } catch (_error) {
      console.warn(
        "Failed to decompress or decode with msgpack, attempting JSON parse",
      );
      // If decompression or msgpack decoding fails, try parsing as JSON
      const jsonString = new TextDecoder().decode(data);
      const parsedData = JSON.parse(jsonString);
      console.log("Decoded data (JSON):", parsedData);
      return JSON.stringify(parsedData);
    }
  } catch (error) {
    console.error("Error decoding data:", error);
    throw error;
  }
}

// Example usage
async function main() {
  const txHash = Deno.args[0];
  if (!txHash) {
    console.error("Please provide a transaction hash as an argument.");
    console.error(
      "Usage: deno run --allow-net decode_src20_olga_tx.ts <tx_hash>",
    );
    Deno.exit(1);
  }

  try {
    const decodedData = await decodeSRC20OLGATransaction(txHash);
    console.log("Decoded SRC-20 OLGA Data:", decodedData);
  } catch (error) {
    console.error("Failed to decode SRC-20 OLGA transaction:", error);
  }
}

main();
