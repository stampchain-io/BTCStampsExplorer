import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";
import * as bitcoin from "bitcoin";
import * as bitcore from "npm:bitcore";
import * as crypto from "crypto";
import { BigFloat } from "bigfloat/mod.ts";
import { Client } from "$mysql/mod.ts";

import {
  address_from_pubkeyhash,
  bin2hex,
  hex2bin,
  scramble,
} from "utils/minting/utils.ts";
import {
  get_public_key_from_address,
  get_transaction,
} from "utils/quicknode.ts";
import { connectDb, Src20Class } from "$lib/database/index.ts";
import { getUTXOForAddress } from "utils/mempool.ts";

async function checkMintedOut(
  client: Client,
  tick: string,
  amount: string,
) {
  try {
    const mint_status = await Src20Class
      .get_src20_minting_progress_by_tick_with_client(
        client,
        tick,
      );
    if (!mint_status) {
      throw new Error("Tick not found");
    }
    const { max_supply, total_minted } = mint_status;
    if (BigFloat(total_minted).add(BigFloat(amount)).gt(max_supply)) {
      return { ...mint_status, minted_out: true };
    }
    return { ...mint_status, minted_out: false };
  } catch (error) {
    console.error(error);
    throw new Error("Error: Internal server error");
  }
}

async function checkDeployedTick(
  client: Client,
  tick: string,
) {
  try {
    const token_status = await Src20Class
      .get_total_valid_src20_tx_by_tick_with_op_with_client(
        client,
        tick,
        "DEPLOY",
      );
    console.log(token_status.rows[0]["total"]);
    if (!token_status.rows[0]["total"]) {
      return {
        deployed: false,
      };
    }
    return {
      deployed: true,
    };
  } catch (error) {
    console.error(error);
    throw new Error("Error: Internal server error");
  }
}

export async function mintSRC20({
  toAddress,
  changeAddress,
  feeRate,
  tick,
  amt,
}: IMintSRC20) {
  try {
    const client = await connectDb();

    const mint_info = await checkMintedOut(
      client,
      tick,
      amt,
    );
    if (mint_info.minted_out === true) {
      throw new Error("Minted out");
    }
    if (new BigFloat(amt).gt(mint_info.lim)) {
      amt = mint_info.lim;
    }
    const src20_mint_obj = {
      op: "MINT",
      p: "SRC-20",
      tick: tick,
      amt: amt,
    };
    const transferString = JSON.stringify(src20_mint_obj, null, 2);
    const utxos = await getUTXOForAddress(toAddress);
    const publicKey = await get_public_key_from_address(toAddress);
    const prepare: IPrepareSRC20TX = {
      network: bitcoin.networks.bitcoin,
      utxos,
      changeAddress,
      toAddress,
      feeRate,
      transferString,
      publicKey,
    };
    const psbtHex = await prepareSendSrc20(prepare);
    return psbtHex;
  } catch (error) {
    console.error(error);
    throw new Error("Error: Internal server error");
  }
}

export async function deploySRC20({
  toAddress,
  changeAddress,
  tick,
  feeRate,
  max,
  lim,
  dec = 18,
}: IDeploySRC20) {
  try {
    const client = await connectDb();

    const mint_info = await checkDeployedTick(
      client,
      tick,
    );
    if (mint_info.deployed === true) {
      throw new Error("Deployed out");
    }
    const src20_mint_obj = {
      op: "DEPLOY",
      p: "SRC-20",
      tick: tick,
      max: max,
      lim: lim,
      dec: dec,
    };
    const transferString = JSON.stringify(src20_mint_obj, null, 2);
    //TODO: check if toAddress is the one how pay the party
    const utxos = await getUTXOForAddress(toAddress);
    const publicKey = await get_public_key_from_address(toAddress);
    const prepare: IPrepareSRC20TX = {
      network: bitcoin.networks.bitcoin,
      utxos,
      changeAddress,
      toAddress,
      feeRate,
      transferString,
      publicKey,
    };
    const psbtHex = await prepareSendSrc20(prepare);
    return psbtHex;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const prepareSendSrc20 = async ({
  network,
  utxos,
  changeAddress,
  toAddress,
  feeRate,
  transferString,
  publicKey,
}: IPrepareSRC20TX) => {
  const psbtNetwork = network === "testnet"
    ? bitcoin.networks.testnet
    : bitcoin.networks.bitcoin;
  const psbt = new bitcoin.Psbt({ network: psbtNetwork });
  const sortedUtxos = utxos.sort((a, b) => b.value - a.value);

  const vouts = [{ address: toAddress, value: 808 }];
  let transferHex = Buffer.from(transferString, "utf-8").toString("hex");
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
      value: 810,
    });
  }

  let feeTotal = 0;
  for (let vout of vouts) {
    feeTotal += vout.value;
  }

  const { inputs, fee, change } = selectSrc20Utxos(sortedUtxos, vouts, feeRate);
  if (!inputs) {
    throw new Error(`Not enough BTC balance`);
  }

  for (const input of inputs) {
    const txDetails = await get_transaction(input.txid);
    const inputDetails = txDetails.vout[input.vout];
    const isWitnessUtxo = inputDetails.scriptPubKey.type.startsWith("witness");

    const psbtInput = {
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
  // note!!!!!
  // -- selectSrc20UTXOs needs to be updated to properly estimate fee before going live!
  // -- getTransaction needs to be updated, should use local node probably before going live!
  // -- this psbt will need to be signed!
  return psbtHex;
};

function selectSrc20Utxos(sortedUtxos: UTXO[], vouts: VOUT[], feeRate: number) {
  // need a more precise effective fee rate calculation!
  // this assumes a single input large enough to pay for the tx
  let inputSize = 42; // rough avg input size
  let outputSize = 42; // rough estimate
  let multisigSize = 114; // rough estimate
  let vsize = inputSize; // assumes single input large enough
  let fullFee = 0;
  vouts.forEach((vout) => {
    fullFee += vout.value;
    // add the sizes of each output
    if (vout.address) {
      vsize += outputSize;
    } else {
      vsize += multisigSize;
    }
  });
  vsize += inputSize; // remember to add the size of the change output
  fullFee += vsize * feeRate; // calculate the full fee
  if (sortedUtxos[0].value > fullFee) { // if the input is large enough to pay, return
    return {
      inputs: [sortedUtxos[0]],
      fee: fullFee,
      change: (sortedUtxos[0].value - fullFee),
    };
  } else {
    return { error: "Largest UTXO is too small to pay this fee" };
  }
}
