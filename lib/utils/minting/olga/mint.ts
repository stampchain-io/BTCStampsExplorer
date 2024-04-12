import * as btc from "bitcoin";

import { mintMethodOPRETURN } from "utils/minting/stamp.ts";
import { handleQuery } from "utils/xcp.ts";
import { extractOutputs } from "utils/minting/utils.ts";
import { getUTXOForAddress } from "utils/minting/src20/utils.ts";
import { selectUTXOs } from "utils/minting/src20/utxo-selector.ts";
import CIP33 from "utils/minting/olga/CIP33.ts";
import { UTXO } from "utils/minting/src20/utils.d.ts";
import { Buffer } from "buffer";
import { get_transaction } from "utils/quicknode.ts";
import { PSBTInput } from "utils/minting/src20/src20.d.ts";

export async function mintCIP33ApiCall(
  {
    sourceWallet,
    assetName,
    qty,
    locked = true,
    divisible = false,
    description,
    satsPerKB,
  }: {
    sourceWallet: string;
    assetName: string;
    qty: number;
    locked: boolean;
    divisible: boolean;
    description: string;
    satsPerKB: number;
  },
) {
  try {
    console.log("mintCIP33ApiCall", description);
    const method = mintMethodOPRETURN({
      sourceWallet,
      assetName,
      qty,
      locked,
      divisible,
      description,
      satsPerKB,
    });
    const response = await handleQuery(method);
    return response;
  } catch (error) {
    console.error("mint error", error);
  }
}

export async function mintStampCIP33(
  {
    sourceWallet,
    assetName,
    qty,
    locked = true,
    divisible = false,
    filename,
    file,
    satsPerKB,
    service_fee,
    service_fee_address,
    prefix,
  }: {
    sourceWallet: string;
    assetName: string;
    qty: number;
    locked: boolean;
    divisible: boolean;
    filename: string; // filename
    file: string; // base64 file content
    satsPerKB: number;
    service_fee: number;
    service_fee_address: string;
    prefix: "stamp" | "file";
  },
) {
  try {
    const result = await mintCIP33ApiCall({
      sourceWallet,
      assetName,
      qty,
      locked,
      divisible,
      description: `${prefix}:${filename}`,
      satsPerKB,
    });
    if (!result.tx_hex) {
      throw new Error("Error generating stamp transaction");
    }
    const hex = result.tx_hex;

    const hex_file = CIP33.base64_to_hex(file);
    const cip33Addresses = CIP33.file_to_addresses(hex_file);

    const psbt = generatePSBT(
      hex,
      sourceWallet,
      satsPerKB,
      service_fee,
      service_fee_address,
      cip33Addresses as string[],
    );

    return psbt;
  } catch (error) {
    console.error("mint error", error);
  }
}

const DUST_SIZE = 330;
async function generatePSBT(
  tx: string,
  address: string,
  fee_per_kb: number,
  service_fee: number,
  recipient_fee: string,
  cip33Addresses: string[],
) {
  const psbt = new btc.Psbt({ network: btc.networks.bitcoin });
  const txObj = btc.Transaction.fromHex(tx);
  const vouts = extractOutputs(txObj, address);

  for (let i = 0; i < cip33Addresses.length; i++) {
    const cip33Address = cip33Addresses[i];
    vouts.push({
      value: DUST_SIZE + i,
      address: cip33Address,
    });
  }

  if (service_fee > 0 && recipient_fee) {
    vouts.push({
      value: service_fee,
      address: recipient_fee,
    });
  }

  const utxos = await getUTXOForAddress(address) as UTXO[];

  const { inputs, change } = selectUTXOs(utxos, vouts, fee_per_kb);

  vouts.push({
    value: change,
    address: address,
  });

  for (const input of inputs) {
    const txDetails = await get_transaction(input.txid);
    const inputDetails = txDetails.vout[input.vout];
    const isWitnessUtxo = inputDetails.scriptPubKey.type.startsWith("witness");
    const psbtInput: PSBTInput = {
      hash: input.txid,
      index: input.vout,
      sequence: 0xfffffffd,
    };
    if (isWitnessUtxo) {
      psbtInput.witnessUtxo = {
        script: Buffer.from(inputDetails.scriptPubKey.hex, "hex"),
        value: input.value,
      };
    } else {
      psbtInput.nonWitnessUtxo = Buffer.from(txDetails.hex, "hex");
    }

    psbt.addInput(psbtInput);
  }

  for (const out of vouts) {
    psbt.addOutput(out);
  }

  return psbt;
}
