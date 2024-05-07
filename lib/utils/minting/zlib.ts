import { Foras, Memory, unzlib, zlib } from "compress";

let initialized = false;

async function zLibCompress(data: string) {
  if (!initialized) {
    try {
      await Foras.initBundledOnce(); // this fails on vs code debugger, not in production
      initialized = true;
    } catch (error) {
      console.error("Failed to initialize Foras:", error);
      return;
    }
  }
  const bytes = new TextEncoder().encode(data);
  const mem = new Memory(bytes);
  const compressed = zlib(mem).copyAndDispose();
  const hexString = Array.from(compressed).map((b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
  return hexString;
}

async function zLibUncompress(hexString: string) {
  await Foras.initBundledOnce();

  const compressed = new Uint8Array(
    hexString.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? [],
  );
  const comp_mem = new Memory(compressed);
  const uncompressed = unzlib(comp_mem).copyAndDispose();
  const decode = new TextDecoder().decode(uncompressed);
  return decode;
}

function stringToHex(str: string) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function compressWithCheck(data: string) {
  // Convert the data string to a byte array to check its length in bytes
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);

  let hexString;

  // Only compress if data is more than 32 bytes
  if (dataBytes.length > 16) {
    const compressed = await zLibCompress(data);
    if (compressed === "") {
      throw new Error("Compression resulted in an empty string");
    }

    const uncompressed = await zLibUncompress(compressed || "");

    if (uncompressed !== data) {
      throw new Error("Error: ZLIB Compression error");
    }

    // Use the compressed data if it's shorter than the original hex string
    hexString = stringToHex(data);
    // Check if hexString is an empty string
    if (hexString === "") {
      throw new Error("Hex string conversion resulted in an empty string");
    }

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
      throw new Error("Hex string conversion resulted in an empty string");
    }
    return hexString;
  }
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
