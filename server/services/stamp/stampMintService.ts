// was previously // lib/utils/minting/stamp.ts

import { handleXcpV1Query } from "$lib/utils/xcpUtils.ts";
import { TransactionService } from "$server/services/transaction/index.ts";
import { extractOutputs } from "$lib/utils/minting/transactionUtils.ts";
import { getTransaction } from "$lib/utils/quicknode.ts";
import { Buffer } from "buffer";
import * as bitcoin from "bitcoinjs-lib";
import { generateRandomNumber } from "$lib/utils/util.ts";
import type { stampMintData, stampMintCIP33, PSBTInput } from "$types/index.d.ts";
import type { XCPPayload } from "$lib/utils/xcpUtils.ts";
import CIP33 from "$lib/utils/minting/olga/CIP33.ts";

export class StampMintService {
  private static readonly burnkeys = [
    "022222222222222222222222222222222222222222222222222222222222222222",
    "033333333333333333333333333333333333333333333333333333333333333333",
    "020202020202020202020202020202020202020202020202020202020202020202",
  ];

  // Regular stamp minting (multisig)
  static mintMethod({
    sourceWallet,
    assetName,
    qty,
    locked,
    divisible,
    base64Data,
    satsPerKB,
  }: stampMintData): XCPPayload {
    // Keep original validation inline as it was in stamp.ts
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

    const selectedBurnKey = this.burnkeys[generateRandomNumber(0, this.burnkeys.length)];

    return {
      jsonrpc: "2.0",
      id: 0,
      method: "create_issuance",
      params: {
        source: sourceWallet,
        asset: assetName,
        quantity: qty,
        divisible: divisible || false,
        description: "stamp:" + base64Data,
        lock: locked || true,
        reset: false,
        encoding: "multisig",
        allow_unconfirmed_inputs: true,
        extended_tx_info: true,
        multisig_dust_size: 796,
        disable_utxo_locks: false,
        dust_return_pubkey: selectedBurnKey,
        fee_per_kb: satsPerKB,
      },
    };
  }

  static mintMethodOPRETURN({
    sourceWallet,
    assetName,
    qty,
    locked,
    divisible,
    description,
    satsPerKB,
  }: stampMintCIP33): XCPPayload {
    // Keep original validation inline
    if (typeof sourceWallet !== "string") {
      throw new Error("Invalid sourceWallet parameter. Expected a string.");
    }
    if (assetName !== undefined && typeof assetName !== "string") {
      throw new Error("Invalid assetName parameter. Expected a string or undefined.");
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

    const feePerKB = typeof satsPerKB === "string" ? Number(satsPerKB) : satsPerKB;
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
  }

  static async mintStampApiCall({
    sourceWallet,
    assetName,
    qty,
    locked = true,
    divisible = false,
    base64Data,
    satsPerKB,
  }) {
    try {
      const method = this.mintMethod({
        sourceWallet,
        assetName,
        qty,
        locked,
        divisible,
        base64Data,
        satsPerKB,
      });
      return await handleXcpV1Query(method);  // This needs to be in an async function
    } catch (error) {
      console.error("mint error", error);
      throw error;
    }
  }

  static async mintStamp(params: stampMintData & { service_fee: number; service_fee_address: string }) {
    try {
      const result = await this.mintStampApiCall(params);
      if (!result.tx_hex) {
        throw new Error("Error generating stamp transaction");
      }
      
      return await this.convertTXToPSBT(
        result.tx_hex,
        params.sourceWallet,
        params.satsPerKB,
        params.service_fee,
        params.service_fee_address,
      );
    } catch (error) {
      console.error("mint error", error);
      throw error;
    }
  }

  private static async convertTXToPSBT(
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

  private static validateMintParams(params: stampMintData) {
    if (typeof params.sourceWallet !== "string") throw new Error("Invalid sourceWallet parameter");
    if (typeof params.assetName !== "string") throw new Error("Invalid assetName parameter");
    if (typeof params.qty !== "number") throw new Error("Invalid qty parameter");
    if (typeof params.locked !== "boolean") throw new Error("Invalid locked parameter");
    if (typeof params.divisible !== "boolean") throw new Error("Invalid divisible parameter");
    if (typeof params.base64Data !== "string") throw new Error("Invalid base64Data parameter");
    if (typeof params.satsPerKB !== "number") throw new Error("Invalid satsPerKB parameter");
  }

  private static validateOPRETURNParams(params: stampMintCIP33) {
    if (typeof params.sourceWallet !== "string") throw new Error("Invalid sourceWallet parameter. Expected a string.");
    if (params.assetName !== undefined && typeof params.assetName !== "string") {
      throw new Error(
        "Invalid assetName parameter. Expected a string or undefined.",
      );
    }

    const quantity = typeof params.qty === "string" ? Number(params.qty) : params.qty;
    if (isNaN(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Invalid qty parameter. Expected a positive integer.");
    }

    if (typeof params.locked !== "boolean") {
      throw new Error("Invalid locked parameter. Expected a boolean.");
    }
    if (typeof params.divisible !== "boolean") {
      throw new Error("Invalid divisible parameter. Expected a boolean.");
    }
    if (typeof params.description !== "string") {
      throw new Error("Invalid description parameter. Expected a string.");
    }

    const feePerKB = typeof params.satsPerKB === "string"
      ? Number(params.satsPerKB)
      : params.satsPerKB;
    if (isNaN(feePerKB) || feePerKB <= 0) {
      throw new Error("Invalid satsPerKB parameter. Expected a positive number.");
    }
  }

  // CIP33 minting (OP_RETURN + P2WSH)
  static async mintCIP33ApiCall({
    sourceWallet,
    assetName,
    qty,
    locked = true,
    divisible = false,
    description,
    satsPerKB,
  }) {
    try {
      console.log("Starting mintCIP33ApiCall with params:", {
        sourceWallet,
        assetName,
        qty,
        locked,
        divisible,
        description,
        satsPerKB,
      });

      const method = this.mintMethodOPRETURN({
        sourceWallet,
        assetName,
        qty,
        locked,
        divisible,
        description,
        satsPerKB,
      });

      return await handleXcpV1Query(method);
    } catch (error) {
      console.error("Detailed mintCIP33ApiCall error:", error);
      throw error;
    }
  }

  static async mintStampCIP33({
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
    filename: string;
    file: string;
    satsPerKB: number;
    service_fee: number;
    service_fee_address: string;
    prefix: "stamp" | "file" | "glyph";
  }) {
    try {
      console.log("Starting mintStampCIP33");

      const result = await this.mintCIP33ApiCall({
        sourceWallet,
        assetName,
        qty,
        locked,
        divisible,
        description: `${prefix}:${filename}`,
        satsPerKB,
      });

      if (result.error) {
        throw new Error(result.error.message || "Error in mintCIP33ApiCall");
      }

      if (!result.tx_hex) {
        throw new Error("tx_hex not found in mintCIP33ApiCall result");
      }

      const hex = result.tx_hex;

      const hex_file = CIP33.base64_to_hex(file);
      const cip33Addresses = CIP33.file_to_addresses(hex_file);
      console.log("hex", hex);

      const fileSize = Math.ceil((file.length * 3) / 4);

      const psbt = await this.generatePSBT(
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
      console.error("Detailed mint error:", error);
      throw error;
    }
  }

  private static async generatePSBT(
    tx: string,
    address: string,
    fee_per_kb: number,
    service_fee: number,
    recipient_fee: string,
    cip33Addresses: string[],
    fileSize: number,
  ) {
    const psbt = new btc.Psbt({ network: btc.networks.bitcoin });
    const txObj = btc.Transaction.fromHex(tx);
    const vouts = extractOutputs(txObj, address);

    const totalDustValue = calculateDust(fileSize);
    let totalOutputValue = totalDustValue;

    // Add CIP33 addresses to outputs
    for (let i = 0; i < cip33Addresses.length; i++) {
      const dustValue = DUST_SIZE + i;
      const cip33Address = cip33Addresses[i];
      vouts.push({
        value: dustValue,
        address: cip33Address,
      });
      totalOutputValue += dustValue;
    }

    if (service_fee > 0 && recipient_fee) {
      vouts.push({
        value: service_fee,
        address: recipient_fee,
      });
      totalOutputValue += service_fee;
    }

    const { inputs, change } = await TransactionService.UTXOService
      .selectUTXOsForTransaction(
        address,
        vouts,
        fee_per_kb,
      );

    const totalInputValue = inputs.reduce((sum, input) => sum + input.value, 0);

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

    if (change > 0) {
      vouts.push({
        value: change,
        address: address,
      });
      totalOutputValue += change;
    }

    // Add outputs to PSBT
    for (const out of vouts) {
      psbt.addOutput(out);
    }

    const estimatedSize = estimateP2WSHTransactionSize(fileSize);
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

    return {
      psbt,
      feePerKb: fee_per_kb,
      estimatedTxSize: estimatedSize,
      totalInputValue,
      totalOutputValue,
      totalChangeOutput: change,
      totalDustValue,
      estMinerFee,
      changeAddress: address,
    };
  }
}
