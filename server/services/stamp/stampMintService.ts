// was previously // lib/utils/minting/stamp.ts

import { TransactionService } from "$server/services/transaction/index.ts";
import { extractOutputs } from "$lib/utils/minting/transactionUtils.ts";
import { getTransaction } from "$lib/utils/quicknode.ts";
import { Buffer } from "buffer";
import * as bitcoin from "bitcoinjs-lib";
import { generateRandomNumber } from "$lib/utils/util.ts";
import type { stampMintData, stampMintCIP33, PSBTInput } from "$types/index.d.ts";
import CIP33 from "$lib/utils/minting/olga/CIP33.ts";
import { PSBTService } from "$server/services/transaction/psbtService.ts";
import { estimateTransactionSize } from "$lib/utils/minting/transactionSizes.ts";
import { getScriptTypeInfo } from "$lib/utils/scriptTypeUtils.ts";
import { validateWalletAddressForMinting } from "$lib/utils/scriptTypeUtils.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { calculateDust, calculateMiningFee, calculateP2WSHMiningFee } from "$lib/utils/minting/feeCalculations.ts";
import { TX_CONSTANTS} from "$lib/utils/minting/constants.ts";

export class StampMintService {


  static async createStampIssuance({
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
      // Validate source wallet
      const sourceWalletValidation = validateWalletAddressForMinting(sourceWallet);
      if (!sourceWalletValidation.isValid) {
        throw new Error(`Invalid source wallet: ${sourceWalletValidation.error}`);
      }

      // Validate service fee address if present
      if (service_fee > 0 && service_fee_address) {
        const feeAddressValidation = validateWalletAddressForMinting(service_fee_address);
        if (!feeAddressValidation.isValid) {
          throw new Error(`Invalid service fee address: ${feeAddressValidation.error}`);
        }
      }

      console.log("Starting createStampIssuance");

      const result = await this.createIssuanceTransaction({
        sourceWallet,
        assetName,
        qty,
        locked,
        divisible,
        description: `${prefix}:${filename}`,
        satsPerKB,
      });

      if (!result.tx_hex) {
        throw new Error("Transaction creation failed: No transaction hex returned");
      }

      const hex = result.tx_hex;
      const hex_file = CIP33.base64_to_hex(file);
      const cip33Addresses = CIP33.file_to_addresses(hex_file);

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
      // Enhance error messages for common issues
      if (error.message.includes('invalid base58')) {
        throw new Error('Invalid address format. Please use a supported Bitcoin address format (P2PKH, P2WPKH, or P2SH).');
      }
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
    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
    const txObj = bitcoin.Transaction.fromHex(tx);
    const vouts = extractOutputs(txObj, address);

    const totalDustValue = calculateDust(fileSize);
    let totalOutputValue = totalDustValue;

    // Add CIP33 addresses to outputs
    for (let i = 0; i < cip33Addresses.length; i++) {
      const dustValue = TX_CONSTANTS.DUST_SIZE + i;
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

    const estimatedSize = estimateTransactionSize({
      inputs: inputs,
      outputs: vouts,
      includeChangeOutput: true,
      changeOutputType: "P2WPKH"
    });

    // Calculate mining fee using the fileSize and fee_per_kb directly
    const estMinerFee = calculateP2WSHMiningFee(fileSize, fee_per_kb);

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

  static async createIssuanceTransaction({
    sourceWallet,
    assetName,
    qty,
    locked = true,
    divisible = false,
    description,
    satsPerKB,
  }) {
    try {
      // Add wallet validation
      const walletValidation = validateWalletAddressForMinting(sourceWallet);
      if (!walletValidation.isValid) {
        throw new Error(`Invalid source wallet address: ${walletValidation.error}`);
      }

      console.log("Starting createIssuanceTransaction with params:", {
        sourceWallet,
        assetName,
        qty,
        locked,
        divisible,
        description,
        satsPerKB,
      });

      // Use the new V2 API call
      const response = await XcpManager.createIssuance(
        sourceWallet,
        assetName,
        qty,
        {
          divisible,
          lock: locked,
          description,
          fee_per_kb: satsPerKB,
          allow_unconfirmed_inputs: true,
          return_psbt: false, // Request hex instead of PSBT
          verbose: true,
          encoding: 'opreturn'
        }
      );

      // Handle specific error cases
      if (response.error) {
        if (response.error.message?.includes('invalid base58')) {
          throw new Error(`Invalid wallet address format: ${sourceWallet}. Only P2PKH (1), P2WPKH (bc1q), and P2SH (3) addresses are supported.`);
        }
        throw new Error(`API Error: ${response.error.message || 'Unknown error'}`);
      }

      // Check for nested result and rawtransaction
      if (!response.result?.rawtransaction) {
        console.error("API Response:", response); // Log the full response for debugging
        throw new Error('Transaction creation failed: No transaction data returned from API');
      }

      // Return with tx_hex for compatibility with existing code
      return {
        tx_hex: response.result.rawtransaction
      };
    } catch (error) {
      console.error("Detailed createIssuanceTransaction error:", error);
      throw error;
    }
  }
}
