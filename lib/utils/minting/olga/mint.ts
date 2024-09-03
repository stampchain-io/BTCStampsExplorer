import * as btc from "bitcoin";
import { mintMethodOPRETURN } from "utils/minting/stamp.ts";
import { handleXcpV1Query } from "utils/xcpUtils.ts";
import { extractOutputs } from "utils/minting/utils.ts";
import { getUTXOForAddress } from "utils/minting/src20/utils.ts";
import { selectUTXOs } from "utils/minting/src20/utxo-selector.ts";
import CIP33 from "utils/minting/olga/CIP33.ts";
import { UTXO } from "utils/minting/src20/utils.d.ts";
import { Buffer } from "buffer";
import { get_transaction } from "utils/quicknode.ts";
import { PSBTInput } from "utils/minting/src20/src20.d.ts";
import {
  calculateDust,
  calculateMiningFee,
  estimateP2WSHTransactionSize,
} from "utils/minting/feeCalculations.ts";

const DUST_SIZE = 333;

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
    const response = await handleXcpV1Query(method);
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
    console.log("hex", hex);

    const fileSize = Math.ceil((file.length * 3) / 4);

    const psbt = await generatePSBT(
      hex,
      sourceWallet,
      satsPerKB,
      service_fee,
      service_fee_address,
      cip33Addresses as string[],
      fileSize,
    );

    return psbt;
  } catch (error) {
    console.error("mint error", error);
    throw error;
  }
}

async function generatePSBT(
  tx: string,
  address: string,
  fee_per_kb: number, // this is actuall fee per vbyte
  service_fee: number,
  recipient_fee: string,
  cip33Addresses: string[],
  fileSize: number,
) {
  const psbt = new btc.Psbt({ network: btc.networks.bitcoin });
  const txObj = btc.Transaction.fromHex(tx);
  const vouts = extractOutputs(txObj, address);

  const totalDustValue = calculateDust(fileSize);
  let totalOutputValue = totalDustValue; // Initialize with dust value

  for (let i = 0; i < cip33Addresses.length; i++) {
    const dustValue = DUST_SIZE + i;
    const cip33Address = cip33Addresses[i];
    vouts.push({
      value: dustValue,
      address: cip33Address,
    });
  }

  if (service_fee > 0 && recipient_fee) {
    vouts.push({
      value: service_fee,
      address: recipient_fee,
    });
    totalOutputValue += service_fee; // Add service fee to total output value
  }

  const utxos = await getUTXOForAddress(address) as UTXO[];
  let totalInputValue = 0; // Initialize total input value
  utxos.forEach((utxo) => totalInputValue += utxo.value); // Sum up input values

  let inputs, change;

  try {
    ({ inputs, change } = selectUTXOs(utxos, vouts, fee_per_kb));
  } catch (error) {
    console.error(error);
    throw Error(error.message);
  }

  totalOutputValue += change; // Add change to total output value

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

  // console.log(`PSBT is instance of btc.Psbt: ${psbt instanceof btc.Psbt}`);

  const estimatedSize = estimateP2WSHTransactionSize(fileSize);

  // Use calculateMiningFee instead of manual calculation
  const estMinerFee = calculateMiningFee(fileSize, fee_per_kb);

  // // Clarify the fee rate unit and calculation
  // console.log(
  //   `Fee Rate: ${fee_per_kb} satoshis per vbyte`,
  // );
  // console.log(`Estimated Miner Fee: ${estMinerFee} satoshis`);

  // // Display total input, output values, and change
  // console.log(`Total Input Value: ${totalInputValue} satoshis`);
  // console.log(
  //   `Total Output Value (including change): ${totalOutputValue} satoshis`,
  // );
  // console.log(`Change: ${change} satoshis`);

  // // Reconcile the values
  // const expectedTotalOutput = totalOutputValue + estMinerFee;
  // console.log(
  //   `Expected Total Output (Outputs + Miner Fee): ${expectedTotalOutput} satoshis`,
  // );

  // // Check if the input covers all outputs including fees
  // const isCovered = totalInputValue >= expectedTotalOutput;
  // console.log(
  //   `Does Total Input Cover All Outputs Including Fees? ${isCovered}`,
  // );

  // // If there's a discrepancy, show the difference
  // if (!isCovered) {
  //   const shortfall = expectedTotalOutput - totalInputValue;
  //   console.log(`Shortfall: ${shortfall} satoshis`);
  // }

  // console.log(`Total Dust Value: ${totalDustValue} satoshis`);

  const psbtData = {
    psbt: psbt,
    feePerKb: fee_per_kb,
    estimatedTxSize: estimatedSize,
    totalInputValue: totalInputValue,
    totalOutputValue: totalOutputValue, // includes change, dust
    totalChangeOutput: change,
    totalDustValue: totalDustValue,
    estMinerFee: estMinerFee,
    changeAddress: address,
  };
  return psbtData;
}
