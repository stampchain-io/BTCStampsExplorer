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
