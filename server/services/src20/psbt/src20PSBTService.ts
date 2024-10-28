import * as bitcoin from "bitcoinjs-lib";
import { Buffer } from "buffer";
import { UTXO } from "$types/index.d.ts";
import { getTransaction } from "$lib/utils/quicknode.ts";
import { PSBTInput } from "$types/index.d.ts";
import CIP33 from "$lib/utils/minting/olga/CIP33.ts";
import {
  calculateDust,
  calculateMiningFee,
} from "$lib/utils/minting/feeCalculations.ts";
import { estimateP2WSHTransactionSize } from "$lib/utils/minting/transactionSizes.ts";
import * as msgpack from "msgpack";
import { TransactionService } from "$server/services/transaction/index.ts";
import { SRC20Service } from "$server/services/src20/index.ts";

export class SRC20PSBTService {
  private static readonly DUST_SIZE = 420; // Min is 330
  private static readonly STAMP_PREFIX = "stamp:";

  static async preparePSBT({
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
    console.log("Entering preparePSBT with params:", {
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

    const { actionData, finalData, hex_data } = await this.prepareActionData(src20Action);
    const cip33Addresses = await this.generateCIP33Addresses(hex_data);
    
    // Check if toAddress is valid
    if (!toAddress) {
      throw new Error("Invalid toAddress: address is undefined");
    }

    // Add the first output (toAddress)
    try {
      const toAddressScript = bitcoin.address.toOutputScript(toAddress, network);
      vouts.push({
        script: toAddressScript,
        value: this.DUST_SIZE,
        address: toAddress,
      });
    } catch (error) {
      console.error(`Error creating output for address ${toAddress}:`, error);
      throw new Error(`Invalid toAddress: ${error.message}`);
    }

    // Add data outputs (always P2WSH)
    for (let i = 0; i < cip33Addresses.length; i++) {
      const dustValue = this.DUST_SIZE + i;
      const p2wshOutput = this.createP2WSHOutput(
        cip33Addresses[i],
        dustValue,
        network,
      );
      vouts.push(p2wshOutput);
    }

    // Add service fee output (if applicable)
    if (service_fee > 0 && service_fee_address) {
      vouts.push(this.createAddressOutput(service_fee_address, service_fee));
    }

    const { inputs, change } = await TransactionService.UTXOService.selectUTXOsForTransaction(
      sourceWallet,
      vouts,
      satsPerKB,
    );

    // Add inputs
    for (const input of inputs) {
      const txDetails = await getTransaction(input.txid); // FIXME: need to review these calls to see if we can use the failover between all endpoints in the utxo selection.
      const psbtInput = this.createPsbtInput(input, txDetails);
      psbt.addInput(psbtInput);
    }

    // Determine the input type for the change output
    const firstInputDetails = await getTransaction(inputs[0].txid);
    const inputType = this.getInputType(firstInputDetails.vout[inputs[0].vout]);

    // Add change output using the same type as the input
    if (change > this.DUST_SIZE) {
      const changePayment = this.createOutputMatchingInputType(
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

    const estimatedSize = estimateP2WSHTransactionSize(hex_data.length / 2);
    const estMinerFee = calculateMiningFee(hex_data.length / 2, satsPerKB);

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

  private static async prepareActionData(src20Action: string | object) {
    let actionData: Uint8Array;
    const stampPrefixBytes = new TextEncoder().encode(this.STAMP_PREFIX);

    try {
      const parsedAction = typeof src20Action === "string"
        ? JSON.parse(src20Action)
        : src20Action;

      const msgpackData = msgpack.encode(parsedAction);
      const { compressedData, compressed } = await SRC20Service.CompressionService.compressWithCheck(msgpackData);
      actionData = compressed ? compressedData : msgpackData;
    } catch (error) {
      const actionString = JSON.stringify(src20Action);
      actionData = new TextEncoder().encode(actionString);
    }

    const fullData = new Uint8Array([...stampPrefixBytes, ...actionData]);
    const dataLength = fullData.length;
    const lengthPrefix = new Uint8Array(2);
    new DataView(lengthPrefix.buffer).setUint16(0, dataLength, false);
    const finalData = new Uint8Array([...lengthPrefix, ...fullData]);
    const hex_data = Buffer.from(finalData).toString("hex");

    return { actionData, finalData, hex_data };
  }

  private static createAddressOutput(address: string, value: number) {
    return { address, value };
  }

  private static getInputType(inputDetails: any): string {
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

  private static createPsbtInput(input: UTXO, txDetails: any): PSBTInput {
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

    const inputType = this.getInputType(inputDetails);

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

  private static createOutputMatchingInputType(
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

  private static createP2WSHOutput(
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

  private static async generateCIP33Addresses(hex_data: string) {
    const cip33Addresses = CIP33.file_to_addresses(hex_data);
    if (!cip33Addresses || cip33Addresses.length === 0) {
      throw new Error("Failed to generate CIP33 addresses");
    }
    return cip33Addresses;
  }
}
