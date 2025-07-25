/**
 * Core binary data manipulation utilities that work in all environments
 */

export function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(
    hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
  );
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  const binaryString = String.fromCharCode(...bytes);
  return btoa(binaryString);
}

export function base64ToHex(base64: string): string {
  return bytesToHex(base64ToBytes(base64));
}

export function hexToBase64(hex: string): string {
  // Maintain CIP33 compatibility: empty hex should throw TypeError
  if (hex === "") {
    // Simulate the original CIP33 behavior where match returns null and map throws
    throw new TypeError("Cannot read properties of null (reading 'map')");
  }
  return bytesToBase64(hexToBytes(hex));
}

export function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Provide aliases for backward compatibility
export const hexToBuffer = hexToBytes;
export const bufferToHex = bytesToHex;
export const hex2bin = hexToBytes;
export const bin2hex = bytesToHex;

// New aliases for base64 functions
export const base64_to_hex = base64ToHex;
export const hex_to_base64 = hexToBase64;
