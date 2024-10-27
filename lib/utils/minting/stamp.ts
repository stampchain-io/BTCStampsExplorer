// lib/utils/minting/stamp.ts

// TODO: move to server and integrate with other PSBT services

import * as btc from "bitcoinjs-lib";
import { Buffer } from "buffer";
import { generateRandomNumber } from "$lib/utils/util.ts";
import { handleXcpV1Query } from "$lib/utils/xcpUtils.ts";
import { extractOutputs } from "./transactionUtils.ts";
import { XCPPayload } from "$lib/utils/xcpUtils.ts";
import { getTransaction } from "$lib/utils/quicknode.ts";
import { stampMintData, stampTransferData } from "$types/index.d.ts";
import { TransactionService } from "$server/services/transaction/index.ts";

export const burnkeys = [
  "022222222222222222222222222222222222222222222222222222222222222222",
  "033333333333333333333333333333333333333333333333333333333333333333",
  "020202020202020202020202020202020202020202020202020202020202020202",
];

interface stampMintCIP33 {
  sourceWallet: string;
  assetName: string;
  qty: number;
  locked: boolean;
  divisible: boolean;
  description: string;
  satsPerKB: number;
}

export function mintMethod(
  {
    sourceWallet,
    assetName,
    qty,
    locked,
    divisible,
    base64Data,
    satsPerKB,
  }: stampMintData,
): XCPPayload {
  if (typeof sourceWallet !== "string") {
    throw new Error("Invalid sourceWallet parameter. Expected a string.");
  }
  if (typeof assetName !== "string") {
    throw new Error("Invalid assetName parameter. Expected a string.");
  }
  if (typeof qty !== "number") {
    throw new Error("Invalid qty parameter. Expected a number.");
  }
  if (typeof locked !== "boolean") {
    throw new Error("Invalid locked parameter. Expected a boolean.");
  }
  if (typeof divisible !== "boolean") {
    throw new Error("Invalid divisible parameter. Expected a boolean.");
  }
  if (typeof base64Data !== "string") {
    throw new Error("Invalid base64Data parameter. Expected a string.");
  }
  if (typeof satsPerKB !== "number") {
    throw new Error("Invalid satsPerKB parameter. Expected a number.");
  }
  const selectedBurnKey = burnkeys[generateRandomNumber(0, burnkeys.length)];
  return {
    jsonrpc: "2.0",
    id: 0,
    method: "create_issuance",
    params: {
      "source": sourceWallet,
      "asset": assetName,
      "quantity": qty,
      "divisible": divisible || false,
      "description": "stamp:" + base64Data,
      "lock": locked || true,
      "reset": false,
      "encoding": "multisig",
      "allow_unconfirmed_inputs": true,
      "extended_tx_info": true,
      "multisig_dust_size": 796,
      "disable_utxo_locks": false,
      "dust_return_pubkey": selectedBurnKey,
      "fee_per_kb": satsPerKB,
    },
  };
}

export const mintMethodOPRETURN = ({
  sourceWallet,
  assetName,
  qty,
  locked,
  divisible,
  description,
  satsPerKB,
}: stampMintCIP33) => {
  if (typeof sourceWallet !== "string") {
    throw new Error("Invalid sourceWallet parameter. Expected a string.");
  }
  if (assetName !== undefined && typeof assetName !== "string") {
    throw new Error(
      "Invalid assetName parameter. Expected a string or undefined.",
    );
  }

  const quantity = typeof qty === "string" ? Number(qty) : qty;
  if (isNaN(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Invalid qty parameter. Expected a positive integer.");
  }

  if (typeof locked !== "boolean") {
    throw new Error("Invalid locked parameter. Expected a boolean.");
  }
  if (typeof divisible !== "boolean") {
    throw new Error("Invalid divisible parameter. Expected a boolean.");
  }
  if (typeof description !== "string") {
    throw new Error("Invalid description parameter. Expected a string.");
  }

  const feePerKB = typeof satsPerKB === "string"
    ? Number(satsPerKB)
    : satsPerKB;
  if (isNaN(feePerKB) || feePerKB <= 0) {
    throw new Error("Invalid satsPerKB parameter. Expected a positive number.");
  }

  const params: Record<string, any> = {
    source: sourceWallet,
    quantity: quantity,
    divisible: divisible || false,
    description: `${description}`,
    lock: locked ?? true,
    reset: false,
    allow_unconfirmed_inputs: true,
    extended_tx_info: true,
    disable_utxo_locks: false,
    fee_per_kb: feePerKB,
  };

  if (assetName) {
    params.asset = assetName;
  }

  return {
    jsonrpc: "2.0",
    id: 0,
    method: "create_issuance",
    params,
  };
};

export async function mintStampApiCall(
  {
    sourceWallet,
    assetName,
    qty,
    locked = true,
    divisible = false,
    base64Data,
    satsPerKB,
  }: {
    sourceWallet: string;
    assetName: string;
    qty: number;
    locked: boolean;
    divisible: boolean;
    base64Data: string;
    satsPerKB: number;
  },
) {
  try {
    const method = mintMethod({
      sourceWallet,
      assetName,
      qty,
      locked,
      divisible,
      base64Data,
      satsPerKB,
    });
    const response = await handleXcpV1Query(method);
    return response;
  } catch (error) {
    console.error("mint error", error);
  }
}

export async function mintStamp(
  {
    sourceWallet,
    assetName,
    qty,
    locked = true,
    divisible = false,
    base64Data,
    satsPerKB,
    service_fee,
    service_fee_address,
  }: {
    sourceWallet: string;
    assetName: string;
    qty: number;
    locked: boolean;
    divisible: boolean;
    base64Data: string;
    satsPerKB: number;
    service_fee: number;
    service_fee_address: string;
  },
) {
  try {
    const result = await mintStampApiCall({
      sourceWallet,
      assetName,
      qty,
      locked,
      divisible,
      base64Data,
      satsPerKB,
    });
    if (!result.tx_hex) {
      throw new Error("Error generating stamp transaction");
    }
    const hex = result.tx_hex;
    const psbt = await convertTXToPSBT(
      hex,
      sourceWallet,
      satsPerKB,
      service_fee,
      service_fee_address,
    );

    return psbt;
  } catch (error) {
    console.error("mint error", error);
  }
}

async function convertTXToPSBT(
  tx: string,
  address: string,
  fee_per_kb: number,
  service_fee: number,
  recipient_fee: string,
) {
  const psbt = new btc.Psbt({ network: btc.networks.bitcoin });
  const txObj = btc.Transaction.fromHex(tx);
  const vouts = extractOutputs(txObj, address);

  vouts.push({
    value: service_fee,
    address: recipient_fee,
  });

  const { inputs, change } = await TransactionService.UTXOService
    .selectUTXOsForTransaction(
      address,
      vouts,
      fee_per_kb,
    );

  if (change > 0) {
    vouts.push({
      value: change,
      address: address,
    });
  }

  for (const out of vouts) {
    psbt.addOutput(out);
  }

  // Add inputs to PSBT
  for (const input of inputs) {
    const txDetails = await getTransaction(input.txid);

    // Ensure txDetails are available
    if (!txDetails) {
      throw new Error(`Failed to fetch transaction details for ${input.txid}`);
    }

    const inputDetails = txDetails.vout[input.vout];

    if (!inputDetails || !inputDetails.scriptPubKey) {
      throw new Error(
        `Failed to get scriptPubKey for input ${input.txid}:${input.vout}`,
      );
    }

    const isWitnessUtxo = inputDetails.scriptPubKey.type.startsWith("witness");

    const psbtInput = {
      hash: input.txid,
      index: input.vout,
      sequence: 0xfffffffd, // Enable RBF
    };

    if (isWitnessUtxo) {
      psbtInput["witnessUtxo"] = {
        script: Buffer.from(inputDetails.scriptPubKey.hex, "hex"),
        value: input.value,
      };
    } else {
      // For non-witness inputs, we need the full transaction hex
      psbtInput["nonWitnessUtxo"] = Buffer.from(txDetails.hex, "hex");
    }

    psbt.addInput(psbtInput);
  }

  return psbt;
}

export async function checkAssetAvailability(assetName: string) {
  try {
    const method = {
      "jsonrpc": "2.0",
      "id": 0,
      "method": "get_asset_info",
      "params": {
        "asset": assetName,
      },
    };
    const result = await handleXcpV1Query(method);
    if (!result.legth) {
      return true;
    }
    return false;
  } catch (_error) {
    console.log(`asset: ${assetName} not available`);
    return false;
  }
}

export async function generateAvailableAssetName() {
  const max_asset_id = 2 ** 64 - 1;
  const min_asset_id = 26 ** 12 + 1;
  let asset_name = `${
    generateRandomNumber(min_asset_id - 8008, max_asset_id - 8008)
  }`;
  let nameAvailable = false;
  const maxIterations = 100;
  for (let i = 0; i < maxIterations; i++) {
    asset_name = "A" +
      generateRandomNumber(min_asset_id - 8008, max_asset_id - 8008);
    nameAvailable = await checkAssetAvailability(asset_name);
    if (nameAvailable) {
      break;
    }
  }
  return asset_name;
}

export async function validateAndPrepareAssetName(
  assetName: string | undefined,
): Promise<string> {
  if (!assetName) {
    return generateAvailableAssetName();
  }
  // FIXME: This will only allow named assets, not numeric to be defined.
  // FIXME: We need to check and validate the users address has XCP in the wallet for a cleaner error than 'insufficient funds'
  // FIXME: this should also likely check the qty on the issuance value

  const upperCaseAssetName = assetName.toUpperCase();

  if (upperCaseAssetName.length > 13) {
    throw new Error("Asset name must not exceed 13 characters.");
  }

  if (upperCaseAssetName.startsWith("A")) {
    throw new Error("Asset name must not start with 'A'.");
  }

  if (!/^[B-Z][A-Z]{0,12}$/.test(upperCaseAssetName)) {
    throw new Error(
      "Name must start with letters (B-Z), contain only uppercase letters (A-Z), and must not exceed 13 characters.",
    );
  }

  const isAvailable = await checkAssetAvailability(upperCaseAssetName);
  if (!isAvailable) {
    throw new Error("Asset name is not available.");
  }

  return upperCaseAssetName;
}
