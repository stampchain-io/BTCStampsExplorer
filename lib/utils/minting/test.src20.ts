import * as bitcoin from "bitcoin";
import { deploySRC20, prepareSendSrc20 } from "./src20.ts";
import { getUTXOForAddress } from "../mempool.ts";
import { get_public_key_from_address } from "../quicknode.ts";

/* const address = "bc1qwfmtwelj00pghxhg0nsu0jqx0f76d5nm0axxvt";
const utxos = await getUTXOForAddress(address);
console.log(utxos);
const publicKey = await get_public_key_from_address(address);
const deploy_test = {
  network: bitcoin.networks.bitcoin,
  utxos,
  changeAddress: address,
  toAddress: address,
  feeRate: 40,
  transferString:
    '{"p": "src-20","op": "deploy","tick": "PSBT","max": "21000000", "lim": "10000"}',
  publicKey,
};
prepareSendSrc20(deploy_test); */

const address = "bc1qwfmtwelj00pghxhg0nsu0jqx0f76d5nm0axxvt";
const prepare: IDeploySRC20 = {
  toAddress: address,
  changeAddress: address,
  tick: "PSBT",
  feeRate: 40,
  max: 21000000,
  lim: 10000,
  dec: 18,
};
const psbtHex = await deploySRC20(prepare);
