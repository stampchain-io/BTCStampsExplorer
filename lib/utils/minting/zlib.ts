import { Foras, Memory, unzlib, zlib } from "compress";

async function zLibCompress(data: string) {
  await Foras.initBundledOnce();

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
    hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)),
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
  const compressed = await zLibCompress(data);
  const uncompressed = await zLibUncompress(compressed);

  if (uncompressed !== data) {
    throw new Error("Error: ZLIB Compression error");
  }
  const hexString = stringToHex(data);
  if (compressed.length < hexString.length) {
    return compressed;
  }
  return hexString;
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
