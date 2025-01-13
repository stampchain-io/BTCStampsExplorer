// lib/utils/minting/utils.ts

import * as bitcoin from "bitcoinjs-lib";
import { Output } from "$types/index.d.ts";

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
