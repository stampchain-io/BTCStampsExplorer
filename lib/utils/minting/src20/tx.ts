import * as bitcoin from "bitcoin";
import * as bitcore from "bitcore";
import * as crypto from "crypto";
import { Buffer } from "buffer";

import { getTransaction } from "utils/quicknode.ts";
import {
  address_from_pubkeyhash,
  bin2hex,
  hex2bin,
  scramble,
} from "utils/minting/utils.ts";
import { IPrepareSRC20TX, PSBTInput, VOUT } from "./src20.d.ts";

import { selectUTXOs } from "./utxo-selector.ts";
import { compressWithCheck } from "../zlib.ts";
import { serverConfig } from "$server/config/config.ts";

const DUST_SIZE = 777;

export const prepareSrc20TX = async ({
  network,
  utxos,
  changeAddress,
  toAddress,
  feeRate,
  transferString,
  publicKey,
}: IPrepareSRC20TX) => {
  console.log("prepareSrc20TX inputs", {
    network,
    utxos,
    changeAddress,
    toAddress,
    feeRate,
    transferString,
    publicKey,
  });

  const psbtNetwork = network === "testnet"
    ? bitcoin.networks.testnet
    : bitcoin.networks.bitcoin;
  console.log("psbtNetwork", psbtNetwork);

  const psbt = new bitcoin.Psbt({ network: psbtNetwork });
  const sortedUtxos = utxos.sort((a, b) => b.value - a.value); // TODO: check for pending trx on this UTXO
  console.log("sortedUtxos", sortedUtxos);

  const vouts: VOUT[] = [{ address: toAddress, value: 789 }];
  let transferHex = await compressWithCheck(`stamp:${transferString}`);
  console.log("Initial transferHex", transferHex);

  const count = (transferHex.length / 2).toString(16);
  let padding = "";
  for (let i = count.length; i < 4; i++) {
    padding += "0";
  }
  transferHex = padding + count + transferHex;

  const remaining = transferHex.length % (62 * 2);
  if (remaining > 0) {
    for (let i = 0; i < 62 * 2 - remaining; i++) {
      transferHex += "0";
    }
  }
  console.log("Initial transferHex", transferHex);

  const encryption = bin2hex(
    scramble(hex2bin(sortedUtxos[0].txid), hex2bin(transferHex)),
  );
  let chunks = [];
  for (let i = 0; i < encryption.length; i = i + 62 * 2) {
    chunks.push(encryption.substring(i, i + 62 * 2));
  }
  chunks = chunks.map((datachunk) => {
    const pubkey_seg1 = datachunk.substring(0, 62);
    const pubkey_seg2 = datachunk.substring(62, 124);
    let second_byte;
    let pubkeyhash;
    let address1 = "";
    let address2 = "";
    let hash1;
    while (address1.length == 0) {
      const first_byte = Math.random() > 0.5 ? "02" : "03";
      second_byte = crypto.randomBytes(1).toString("hex");
      pubkeyhash = first_byte + pubkey_seg1 + second_byte;

      if (bitcore.default.PublicKey.isValid(pubkeyhash)) {
        hash1 = pubkeyhash;
        address1 = address_from_pubkeyhash(pubkeyhash);
      }
    }
    let hash2;
    console.log("Chunks", chunks);

    while (address2.length == 0) {
      const first_byte = Math.random() > 0.5 ? "02" : "03";
      second_byte = crypto.randomBytes(1).toString("hex");
      pubkeyhash = first_byte + pubkey_seg2 + second_byte;

      if (bitcore.default.PublicKey.isValid(pubkeyhash)) {
        hash2 = pubkeyhash;
        address2 = address_from_pubkeyhash(pubkeyhash);
      }
    }
    const data_hashes = [hash1, hash2];
    return data_hashes;
  });

  const cpScripts = chunks.map((each) => {
    return `5121${each[0]}21${
      each[1]
    }2102020202020202020202020202020202020202020202020202020202020202020253ae`;
  });
  for (const cpScriptHex of cpScripts) {
    vouts.push({
      script: Buffer.from(cpScriptHex, "hex"),
      value: DUST_SIZE,
    });
  }
  console.log("cpScripts", cpScripts);

  if (parseInt(serverConfig.MINTING_SERVICE_FEE_ENABLED || "0") === 1) {
    const feeAddress = serverConfig.MINTING_SERVICE_FEE_ADDRESS || "";
    const feeAmount = parseInt(
      serverConfig.MINTING_SERVICE_FEE_FIXED_SATS || "0",
    );
    vouts.push({
      address: feeAddress,
      value: feeAmount,
    });
  }

  let feeTotal = 0;
  for (const vout of vouts) {
    feeTotal += vout.value;
  }

  const { inputs, fee, change } = selectUTXOs(sortedUtxos, vouts, feeRate);
  if (!inputs) {
    throw new Error(`Not enough BTC balance`);
  }

  for (const input of inputs) {
    const txDetails = await getTransaction(input.txid);
    const inputDetails = txDetails.vout[input.vout];
    const isWitnessUtxo = inputDetails.scriptPubKey.type.startsWith("witness");

    const psbtInput: PSBTInput = {
      hash: input.txid,
      index: input.vout,
    };
    if (isWitnessUtxo) {
      psbtInput.witnessUtxo = {
        script: Buffer.from(inputDetails.scriptPubKey.hex, "hex"),
        value: input.value,
      };
    } else {
      psbtInput.nonWitnessUtxo = Buffer.from(txDetails.hex, "hex");
    }

    // 3xxxx: needs to add redeem for p2sh
    if (changeAddress.startsWith("3")) {
      const redeem = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(publicKey, "hex"),
      });
      psbtInput.redeemScript = redeem.output;
    }
    psbt.addInput(psbtInput);
  }
  for (const vout of vouts) {
    psbt.addOutput(vout);
  }
  psbt.addOutput({
    address: changeAddress,
    value: change,
  });

  const psbtHex = psbt.toHex();
  console.log("Final vouts", vouts);
  console.log("Fee total", feeTotal);

  // note!!!!!
  // -- selectSrc20UTXOs needs to be updated to properly estimate fee before going live! (more accurate fee estimation now with sigops estimated with 2.5X)
  // -- getTransaction needs to be updated, should use local node probably before going live! (Using quicknode now for getTransaction)
  // -- this psbt will need to be signed! (Signed on the client side)
  return {
    hex: psbtHex,
    fee: fee,
    change: change,
  };
};

// const address = "address_here_to_test";
// const pubKey = await getPublicKeyFromAddress(address);
// const utxos = await getUTXOForAddress(address);
// if (!utxos || utxos.length === 0) {
//   throw new Error("No UTXO found");
// }
// const psbt = await prepareSrc20TX({
//   network: "mainnet",
//   utxos,
//   changeAddress: address,
//   toAddress: address,
//   feeRate: 70,
//   transferString:
//     '{"p": "src-20","op": "deploy","tick": "PSBT","max": "21000000", "lim": "10000"}',
//   publicKey: pubKey,
// });
// console.log(psbt);
