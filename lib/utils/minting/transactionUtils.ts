// lib/utils/minting/utils.ts

import * as bitcoin from "bitcoinjs-lib";

export function arc4(key: Uint8Array, data: Uint8Array): Uint8Array {
  const S = new Uint8Array(256);

  // Key-scheduling algorithm (KSA)
  for (let i = 0; i < 256; i++) {
    S[i] = i;
  }

  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + key[i % key.length]) & 0xff;
    [S[i], S[j]] = [S[j], S[i]];
  }

  // Pseudo-random generation algorithm (PRGA)
  const result = new Uint8Array(data.length);
  let i = 0;
  j = 0;
  for (let n = 0; n < data.length; n++) {
    i = (i + 1) & 0xff;
    j = (j + S[i]) & 0xff;
    [S[i], S[j]] = [S[j], S[i]];
    const K = S[(S[i] + S[j]) & 0xff];
    result[n] = data[n] ^ K;
  }

  return result;
}

export function hex2bin(hexString: string): Uint8Array {
  const normalizedHex = hexString.replace(/\s/g, "");
  const bytes = new Uint8Array(
    normalizedHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? [],
  );
  return bytes;
}

export function bin2hex(data: Uint8Array): string {
  return Array.from(data)
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

export function extractOutputs(tx: bitcoin.Transaction, address: string) {
  const outputs = [];
  for (const vout of tx.outs) {
    if ("address" in vout) {
      outputs.push({
        value: vout.value,
        address: vout.address,
      });
    } else if ("script" in vout) {
      try {
        if (
          bitcoin.address.fromOutputScript(
            vout.script,
            bitcoin.networks.bitcoin,
          ) !==
            address
        ) {
          outputs.push({
            value: vout.value,
            script: vout.script,
          });
        }
      } catch {
        outputs.push({
          value: vout.value,
          script: vout.script,
        });
      }
    }
  }
  return outputs as Output[];
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}
