import { Client } from "$mysql/mod.ts";
import * as bitcoin from "bitcoin";
import { UTXO } from "utils/minting/src20/utils.d.ts";

import { getClient } from "$lib/database/index.ts";
import { get_public_key_from_address } from "utils/quicknode.ts";
import {
  checkDeployedTick,
  checkDeployParams,
  checkEnoughBalance,
  checkMintedOut,
  checkMintParams,
  checkTransferParams,
} from "./check.ts";
import { prepareSrc20TX } from "./tx.ts";
import { getUTXOForAddress } from "./utils.ts";
import {
  IDeploySRC20,
  IMintSRC20,
  IPrepareSRC20TX,
  ITransferSRC20,
} from "./src20.d.ts";
import { releaseClient } from "$lib/database/db.ts";

export async function mintSRC20({
  toAddress,
  changeAddress,
  feeRate,
  tick,
  amt,
}: IMintSRC20) {
  try {
    checkMintParams({
      toAddress,
      changeAddress,
      feeRate,
      tick,
      amt,
    });

    const client: Client = await getClient();
    const mint_info = await checkMintedOut(
      client,
      tick,
      amt,
    );
    if (mint_info.minted_out === true) {
      throw new Error(`Error: token ${tick} already minted out`);
    }
    const src20_mint_obj = {
      op: "MINT",
      p: "SRC-20",
      tick: tick,
      amt: amt,
    };
    const transferString = JSON.stringify(src20_mint_obj);
    //TODO: check if toAddress is the one how pay the party
    const fetchedUtxos = await getUTXOForAddress(fromAddress);
    if (fetchedUtxos === null || fetchedUtxos.length === 0) {
      throw new Error("No UTXO found");
    }
    const utxos: UTXO[] = fetchedUtxos;
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
    releaseClient(client);
    return psbtHex;
  } catch (error) {
    console.log(error.message);
    return {
      error: error.message,
    };
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
    checkDeployParams({
      toAddress,
      changeAddress,
      tick,
      feeRate,
      max,
      lim,
      dec,
    });
    const client = await getClient();

    const mint_info = await checkDeployedTick(
      client,
      tick,
    );
    if (mint_info.deployed === true) {
      throw new Error(`Error: Token ${tick} already deployed`);
    }
    const src20_mint_obj = {
      op: "DEPLOY",
      p: "SRC-20",
      tick: tick,
      max: max,
      lim: lim,
      dec: dec,
    };
    const transferString = JSON.stringify(src20_mint_obj);
    const fetchedUtxos = await getUTXOForAddress(fromAddress);
    if (fetchedUtxos === null || fetchedUtxos.length === 0) {
      throw new Error("No UTXO found");
    }
    const utxos: UTXO[] = fetchedUtxos;
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
    return {
      error: error.message,
    };
  }
}

export async function transferSRC20({
  toAddress,
  fromAddress,
  tick,
  feeRate,
  amt,
}: ITransferSRC20) {
  try {
    checkTransferParams({
      toAddress,
      fromAddress,
      tick,
      feeRate,
      amt,
    });
    const client = await getClient();
    const has_enough_balance = await checkEnoughBalance(
      client,
      fromAddress,
      tick,
      amt,
    );
    if (has_enough_balance !== true) {
      throw new Error("Error: Not enough balance");
    }
    const src20_mint_obj = {
      op: "TRANSFER",
      p: "SRC-20",
      tick: tick,
      amt: amt,
    };
    const transferString = JSON.stringify(src20_mint_obj);
    const fetchedUtxos = await getUTXOForAddress(fromAddress);
    if (fetchedUtxos === null || fetchedUtxos.length === 0) {
      throw new Error("No UTXO found");
    }
    const utxos: UTXO[] = fetchedUtxos;
    if (utxos === null || utxos.length === 0) {
      throw new Error("No UTXO found");
    }
    const publicKey = await get_public_key_from_address(toAddress);
    const prepare: IPrepareSRC20TX = {
      network: bitcoin.networks.bitcoin,
      utxos,
      changeAddress: fromAddress,
      toAddress,
      feeRate,
      transferString,
      publicKey,
    };
    const psbtHex = await prepareSrc20TX(prepare);
    return psbtHex;
  } catch (error) {
    console.error(error);
    return {
      error: error.message,
    };
  }
}
