import * as btc from "bitcoin";
import { Output } from "utils/minting/src20/utils.d.ts";

export function scramble(key, str) {
  const s = [];
  let j = 0,
    i = 0,
    x,
    res = "";
  for (let i = 0; i < 256; i++) {
    s[i] = i;
  }
  for (i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
    x = s[i];
    s[i] = s[j];
    s[j] = x;
  }
  i = 0;
  j = 0;
  for (let y = 0; y < str.length; y++) {
    i = (i + 1) % 256;
    j = (j + s[i]) % 256;
    x = s[i];
    s[i] = s[j];
    s[j] = x;
    res += String.fromCharCode(str.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
  }
  return res;
}

export function hex2bin(hex) {
  var bytes = [];
  var str;
  for (var i = 0; i < hex.length - 1; i += 2) {
    var ch = parseInt(hex.substr(i, 2), 16);
    bytes.push(ch);
  }
  str = String.fromCharCode.apply(String, bytes);
  return str;
}

export function bin2hex(s) {
  // http://kevin.vanzonneveld.net
  var i, l, o = "", n;
  s += "";
  for (i = 0, l = s.length; i < l; i++) {
    n = s.charCodeAt(i).toString(16);
    o += n.length < 2 ? "0" + n : n;
  }
  return o;
}

export function extractOutputs(tx: btc.Transaction, address: string) {
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
          btc.address.fromOutputScript(vout.script, btc.networks.bitcoin) !==
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
