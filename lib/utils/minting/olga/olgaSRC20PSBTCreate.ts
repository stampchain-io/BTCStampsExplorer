import * as bitcoin from "bitcoin";
import { Buffer } from "buffer";
import { UTXO } from "utils/minting/src20/utils.d.ts";
import { getTransaction } from "utils/quicknode.ts";
import { PSBTInput } from "$lib/types/index.d.ts";
import CIP33 from "utils/minting/olga/CIP33.ts";
import {
  calculateDust,
  calculateMiningFee,
  estimateP2WSHTransactionSize,
} from "utils/minting/feeCalculations.ts";
import * as msgpack from "msgpack";
import { compressWithCheck } from "../zlib.ts";
import { selectUTXOsForTransaction } from "utils/minting/utxoSelector.ts";

const DUST_SIZE = 420; // Min is 330
const STAMP_PREFIX = "stamp:";

function createAddressOutput(address: string, value: number) {
  return { address, value };
}

export async function prepareSrc20PSBT({
  sourceWallet,
  toAddress,
  src20Action,
  satsPerKB,
  service_fee,
  service_fee_address,
}: {
  sourceWallet: string;
  toAddress: string;
  src20Action: string | object;
  satsPerKB: number;
  service_fee: number;
  service_fee_address: string;
}) {
  console.log("Entering prepareSrc20PSBT with params:", {
    sourceWallet,
    toAddress,
    src20Action,
    satsPerKB,
    service_fee,
    service_fee_address,
  });

  const network = bitcoin.networks.bitcoin;
  const psbt = new bitcoin.Psbt({ network });
  const vouts = [];

  // Prepare src20Action data with msgpack and compression
  let actionData: Uint8Array;
  const stampPrefixBytes = new TextEncoder().encode(STAMP_PREFIX);

  try {
    // Check if src20Action is a string or an object
    const parsedAction = typeof src20Action === "string"
      ? JSON.parse(src20Action)
      : src20Action;

    const msgpackData = msgpack.encode(parsedAction);
    console.log("Action data size after msgpack encoding:", msgpackData.length);

    const { compressedData, compressed } = await compressWithCheck(msgpackData);

    if (compressed) {
      actionData = compressedData;
      console.log(
        "Action data size after compression:",
        compressedData.length,
      );
    } else {
      actionData = msgpackData;
      console.log("Compression did not reduce size.");
    }
  } catch (error) {
    console.warn(
      "Warning: Unable to parse or compress src20Action. Using JSON.stringify(src20Action):",
      error,
    );
    // Use JSON.stringify to convert the object to a string
    const actionString = JSON.stringify(src20Action);
    actionData = new TextEncoder().encode(actionString);
    console.log(
      "Action data size after JSON.stringify and encoding:",
      actionData.length,
    );
  }

  // Add stamp prefix
  const fullData = new Uint8Array([...stampPrefixBytes, ...actionData]);

  // Calculate the length of the data (including the "stamp:" prefix)
  const dataLength = fullData.length;

  // Add 2-byte length prefix (big-endian)
  const lengthPrefix = new Uint8Array(2);
  const dataView = new DataView(lengthPrefix.buffer);
  dataView.setUint16(0, dataLength, false); // false for big-endian

  const finalData = new Uint8Array([...lengthPrefix, ...fullData]);
  const hex_data = Buffer.from(finalData).toString("hex");

  console.log("Final data length (bytes):", finalData.length);
  console.log("Hex data length:", hex_data.length / 2, "bytes");

  const cip33Addresses = CIP33.file_to_addresses(hex_data);
  if (!cip33Addresses || cip33Addresses.length === 0) {
    throw new Error("Failed to generate CIP33 addresses");
  }
  console.log("Number of CIP33 addresses generated:", cip33Addresses.length);

  const fileSize = Math.ceil(hex_data.length / 2);

  const totalDustValue = calculateDust(fileSize);
  let totalOutputValue = 0;

  // Check if toAddress is valid
  if (!toAddress) {
    throw new Error("Invalid toAddress: address is undefined");
  }

  // Add the first output (toAddress)
  try {
    const toAddressScript = bitcoin.address.toOutputScript(toAddress, network);
    vouts.push({
      script: toAddressScript,
      value: DUST_SIZE,
      address: toAddress,
    });
    totalOutputValue += DUST_SIZE;
  } catch (error) {
    console.error(`Error creating output for address ${toAddress}:`, error);
    throw new Error(`Invalid toAddress: ${error.message}`);
  }

  // Add data outputs (always P2WSH)
  for (let i = 0; i < cip33Addresses.length; i++) {
    const dustValue = DUST_SIZE + i;
    const p2wshOutput = createP2WSHOutput(
      cip33Addresses[i],
      dustValue,
      network,
    );
    vouts.push(p2wshOutput);
    totalOutputValue += dustValue;
  }

  // Add service fee output (if applicable)
  if (service_fee > 0 && service_fee_address) {
    vouts.push(createAddressOutput(service_fee_address, service_fee));
    totalOutputValue += service_fee;
  }

  // Replace with selectUTXOsForTransaction
  const { inputs, change } = await selectUTXOsForTransaction(
    sourceWallet,
    vouts,
    satsPerKB,
  );

  totalOutputValue += change;

  // Add inputs
  for (const input of inputs) {
    const txDetails = await getTransaction(input.txid);
    const psbtInput = createPsbtInput(input, txDetails);
    psbt.addInput(psbtInput);
  }

  // Determine the input type for the change output
  const firstInputDetails = await getTransaction(inputs[0].txid);
  const inputType = getInputType(firstInputDetails.vout[inputs[0].vout]);

  // Add change output using the same type as the input
  if (change > DUST_SIZE) {
    const changePayment = createOutputMatchingInputType(
      sourceWallet,
      inputType,
      network,
    );
    const changeOutput = {
      script: changePayment.output,
      value: change,
    };
    vouts.push(changeOutput);
  }

  // Add outputs to PSBT
  for (const out of vouts) {
    if ("script" in out) {
      psbt.addOutput({
        script: out.script,
        value: out.value,
      });
    } else {
      psbt.addOutput(out);
    }
  }

  const estimatedSize = estimateP2WSHTransactionSize(fileSize);
  const estMinerFee = calculateMiningFee(fileSize, satsPerKB);

  console.log("Final PSBT data:", {
    hex: psbt.toHex(),
    base64: psbt.toBase64(),
    estimatedTxSize: estimatedSize,
    totalInputValue,
    totalOutputValue,
    totalChangeOutput: change,
    totalDustValue,
    estMinerFee,
  });

  return {
    psbt,
    feePerKb: satsPerKB,
    estimatedTxSize: estimatedSize,
    totalInputValue,
    totalOutputValue,
    totalChangeOutput: change,
    totalDustValue,
    estMinerFee,
    changeAddress: sourceWallet,
  };
}

// Modify the getInputType function to return more specific types
function getInputType(inputDetails: any): string {
  if (
    !inputDetails || !inputDetails.scriptPubKey ||
    !inputDetails.scriptPubKey.type
  ) {
    console.error(
      "Invalid inputDetails:",
      JSON.stringify(inputDetails, null, 2),
    );
    throw new Error("Invalid input details: missing scriptPubKey or type");
  }

  const scriptType = inputDetails.scriptPubKey.type;
  switch (scriptType) {
    case "pubkeyhash":
      return "p2pkh";
    case "scripthash":
      return "p2sh";
    case "witness_v0_keyhash":
      return "p2wpkh";
    case "witness_v0_scripthash":
      return "p2wsh";
    default:
      console.warn(`Unknown script type: ${scriptType}`);
      return "unknown";
  }
}

// Update the createPsbtInput function
function createPsbtInput(input: UTXO, txDetails: any): PSBTInput {
  console.log("Creating PSBT input:", JSON.stringify(input, null, 2));
  // console.log("Input Transaction details:", JSON.stringify(txDetails, null, 2));

  const inputDetails = txDetails.vout[input.vout];
  if (!inputDetails) {
    throw new Error(`Invalid input: no details found for vout ${input.vout}`);
  }

  const psbtInput: PSBTInput = {
    hash: input.txid,
    index: input.vout,
    sequence: 0xfffffffd, // Enable RBF
  };

  const inputType = getInputType(inputDetails);

  if (inputType === "p2wpkh" || inputType === "p2wsh") {
    // Witness input
    psbtInput.witnessUtxo = {
      script: Buffer.from(inputDetails.scriptPubKey.hex, "hex"),
      value: input.value,
    };
  } else {
    // Non-witness input
    psbtInput.nonWitnessUtxo = Buffer.from(txDetails.hex, "hex");
  }

  return psbtInput;
}

function createOutputMatchingInputType(
  address: string,
  inputType: string,
  network: bitcoin.Network,
) {
  switch (inputType) {
    case "p2pkh":
      return bitcoin.payments.p2pkh({ address, network });
    case "p2sh":
      return bitcoin.payments.p2sh({ address, network });
    case "p2wpkh":
      return bitcoin.payments.p2wpkh({ address, network });
    case "p2wsh":
      return bitcoin.payments.p2wsh({ address, network });
    default:
      // Default to P2WPKH if input type is unknown
      return bitcoin.payments.p2wpkh({ address, network });
  }
}

function createP2WSHOutput(
  address: string,
  value: number,
  network: bitcoin.Network,
) {
  if (!address) {
    throw new Error("Invalid address: address is undefined");
  }
  try {
    const script = bitcoin.address.toOutputScript(address, network);
    return {
      script:
        bitcoin.payments.p2wsh({ redeem: { output: script }, network }).output,
      value: value,
    };
  } catch (error) {
    console.error(`Error creating P2WSH output for address ${address}:`, error);
    throw error;
  }
}
