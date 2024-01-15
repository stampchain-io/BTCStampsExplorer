import { Client } from "$mysql/mod.ts";
import { BigFloat } from "bigfloat/mod.ts";
import * as bitcoin from "bitcoin";

import { connectDb } from "$lib/database/index.ts";
import { get_public_key_from_address } from "utils/quicknode.ts";
import { checkDeployedTick, checkMintedOut } from "./check.ts";
import { prepareSrc20TX } from "./tx.ts";
import { getUTXOForAddress } from "./utils.ts";

//TODO:[WIP] getUTXOForAddress => Now using mempool.space, add other alternatives as mempool.space dont show script and size

export async function mintSRC20({
  toAddress,
  changeAddress,
  feeRate,
  tick,
  amt,
}: IMintSRC20) {
  try {
    const client: Client = await connectDb();

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
    //TODO: check if toAddress is the one how pay the party
    const utxos = await getUTXOForAddress(toAddress);
    if (utxos === null || utxos.length === 0) {
      throw new Error("No UTXO found");
    }
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
    const psbtHex = await prepareSrc20TX(prepare);
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
    if (utxos === null || utxos.length === 0) {
      throw new Error("No UTXO found");
    }
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
    const psbtHex = await prepareSrc20TX(prepare);
    return psbtHex;
  } catch (error) {
    console.error(error);
    return null;
  }
}
