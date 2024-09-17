import { Foras, Memory, unzlib, zlib } from "compress";

let initialized = false;

export function stringToHex(str: string) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function zLibCompress(data: string) {
  try {
    await initializeForas();
  } catch {
    // Handle the case where WebAssembly initialization fails
    return stringToHex(data); // Return hex string as fallback
  }

  try {
    const bytes = new TextEncoder().encode(data);
    const mem = new Memory(bytes);
    const compressed = zlib(mem).copyAndDispose();
    const hexString = Array.from(compressed).map((b) =>
      b.toString(16).padStart(2, "0")
    ).join("");
    return hexString;
  } catch {
    // Handle compression failure
    return stringToHex(data); // Return hex string as fallback
  }
}

async function zLibUncompress(hexString: string) {
  try {
    await initializeForas();
  } catch {
    // Handle the case where WebAssembly initialization fails
    return hexString; // Return original hex string as fallback
  }

  try {
    const compressed = new Uint8Array(
      hexString.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? [],
    );
    const comp_mem = new Memory(compressed);
    const uncompressed = unzlib(comp_mem).copyAndDispose();
    const decode = new TextDecoder().decode(uncompressed);
    return decode;
  } catch {
    // Handle decompression failure
    return hexString; // Return original hex string as fallback
  }
}

async function initializeForas() {
  if (!initialized) {
    try {
      await Foras.initBundledOnce();
      initialized = true;
    } catch (error) {
      console.error("Failed to initialize Foras:", error);
      // Skip WebAssembly initialization
    }
  }
}

export async function compressWithCheck(data: string) {
  // Convert the data string to a byte array to check its length in bytes
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);

  let hexString;

  // Only compress if data is more than 32 bytes
  if (dataBytes.length > 32) {
    let compressed;
    try {
      compressed = await zLibCompress(data);
    } catch {
      compressed = stringToHex(data); // Fallback to hex string if compression fails
    }

    if (compressed === "") {
      return stringToHex(data); // Return hex string if compression results in an empty string
    }

    let uncompressed;
    try {
      uncompressed = await zLibUncompress(compressed || "");
    } catch {
      uncompressed = data; // Fallback to original data if decompression fails
    }

    if (uncompressed !== data) {
      return stringToHex(data); // Return hex string if decompression does not match original data
    }

    hexString = stringToHex(data);
    // Check if hexString is an empty string
    if (hexString === "") {
      return stringToHex(data); // Return hex string if conversion results in an empty string
    }

    // Use the compressed data if it's shorter than the original hex string
    if (compressed.length < hexString.length) {
      return compressed; // compressed is already in hex format
    }
    // If compressed data is not shorter, return the original data's hex string
    return hexString;
  } else {
    // If data is 32 bytes or less, directly return its hex string
    hexString = stringToHex(data);
    // Check if hexString is an empty string
    if (hexString === "") {
      return stringToHex(data); // Return hex string if conversion results in an empty string
    }
    return hexString;
  }
}

export async function decompressWithCheck(hexString: string): Promise<string> {
  try {
    await initializeForas();
  } catch {
    // Handle the case where WebAssembly initialization fails
    return hexToString(hexString); // Return original string as fallback
  }

  try {
    // First, try to decompress assuming it's compressed data
    const decompressed = await zLibUncompress(hexString);

    // If decompression succeeds and results in a valid string, return it
    if (decompressed && decompressed !== hexString) {
      return decompressed;
    }
  } catch {
    // Decompression failed, which might mean the data wasn't compressed
  }

  // If decompression failed or returned the same string, assume it's not compressed
  // and try to convert from hex to string
  return hexToString(hexString);
}

function hexToString(hexString: string): string {
  // Remove any whitespace and make sure the string has an even number of characters
  hexString = hexString.replace(/\s/g, "");
  if (hexString.length % 2 !== 0) {
    hexString = "0" + hexString;
  }

  // Convert hex to bytes
  const bytes = new Uint8Array(
    hexString.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? [],
  );

  // Convert bytes to string
  return new TextDecoder().decode(bytes);
}

//const strs = [
//  '{"p":"src-20", "op": "deploy", "tick":"PEPE", "dec":"8", "max":"100000000, "lim":"10000"}',
//  '{"p":"src-20", "op": "mint", "tick":"PEPE", "amt":"1000000"}',
//  '{"p":"src-20", "op": "transfer", "tick":"PEPE", "amt":"1000000"}',
//  '{"p":"src-20", "op": "mpma", "amt": ["1000000", "1000000", "1000000"], "tick": "PEPE", "detinations": ["1Lbcfr7sAHTD9CgdQo3HTMTkV8LK4ZnX71", "1Lbcfr7sAHTD9CgdQo3HTMTkV8LK4ZnX71", "1Lbcfr7sAHTD9CgdQo3HTMTkV8LK4ZnX71"]}',
//];
//
//strs.forEach(async (str) => {
//  const hex = await compressWithCheck(str);
//  console.log(hex);
//});
