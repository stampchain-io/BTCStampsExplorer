// was previously // lib/utils/minting/stamp.ts

import { TransactionService } from "$server/services/transaction/index.ts";
import { extractOutputs } from "$lib/utils/minting/transactionUtils.ts";
import { getTransaction } from "$lib/utils/quicknode.ts";
import * as bitcoin from "bitcoinjs-lib";
import { generateRandomNumber } from "$lib/utils/numberUtils.ts";
import type { stampMintData, stampMintCIP33, PSBTInput } from "$types/index.d.ts";
import CIP33 from "$lib/utils/minting/olga/CIP33.ts";
import { PSBTService } from "$server/services/transaction/psbtService.ts";
import { estimateTransactionSize } from "$lib/utils/minting/transactionSizes.ts";
import { getScriptTypeInfo } from "$lib/utils/scriptTypeUtils.ts";
import { validateWalletAddressForMinting } from "$lib/utils/scriptTypeUtils.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { calculateDust, calculateMiningFee, calculateP2WSHMiningFee } from "$lib/utils/minting/feeCalculations.ts";
import { TX_CONSTANTS} from "$lib/utils/minting/constants.ts";
import { hex2bin } from "$lib/utils/binary/baseUtils.ts";

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
    console.log("Starting createStampIssuance with params:", {
      sourceWallet,
      assetName,
      qty,
      locked,
      divisible,
      filename,
      fileSize: Math.ceil((file.length * 3) / 4),
      satsPerKB,
      satsPerVB: satsPerKB / 1000,
      service_fee,
      service_fee_address,
      prefix
    });

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
      console.log("File and CIP33 details:", {
        fileSize,
        cip33AddressCount: cip33Addresses.length,
        hex_length: hex_file.length
      });

      const psbt = await this.generatePSBT(
        hex,
        sourceWallet,
        satsPerKB / 1000, // Convert to sat/vB
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
    satsPerVB: number,
    service_fee: number,
    recipient_fee: string,
    cip33Addresses: string[],
    fileSize: number,
  ) {
    let totalOutputValue = 0;
    let psbt;
    let vouts = [];
    let estMinerFee = 0;

    try {
      console.log("Starting PSBT generation with params:", {
        address,
        satsPerVB,
        satsPerKB: satsPerVB * 1000,
        service_fee,
        recipient_fee,
        cip33AddressCount: cip33Addresses.length,
        fileSize
      });

      psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
      const txObj = bitcoin.Transaction.fromHex(tx);
      vouts = extractOutputs(txObj, address);

      // Log initial vouts
      console.log("Initial vouts from transaction:", {
        count: vouts.length,
        values: vouts.map(v => v.value)
      });

      // Calculate size first
      const estimatedSize = estimateTransactionSize({
        inputs: [{ 
          type: "P2WPKH",
          isWitness: true
        }],
        outputs: [
          { type: "P2PKH", isWitness: false },
          ...cip33Addresses.map(() => ({ 
            type: "P2WSH", 
            isWitness: true 
          })),
          { type: "P2WPKH", isWitness: true }
        ],
        includeChangeOutput: true,
        changeOutputType: "P2WPKH"
      });

      // Add detailed size logging
      console.log("Transaction size details:", {
        estimatedSize,
        inputBreakdown: {
          txid: 32,
          vout: 4,
          sequence: 4,
          witnessData: 108,
        },
        outputBreakdown: {
          opReturn: 45,
          p2wshOutputs: cip33Addresses.length * 43,
          changeOutput: 31,
        },
        totalRaw: 32 + 4 + 4 + 108 + 45 + (cip33Addresses.length * 43) + 31
      });

      // Calculate exact fee needed
      const exactFeeNeeded = Math.ceil(estimatedSize * satsPerVB);

      console.log("Size and fee calculation:", {
        estimatedSize,
        requestedFeeRate: satsPerVB,
        exactFeeNeeded,
        expectedFeePerVbyte: exactFeeNeeded / estimatedSize
      });

      // Add data outputs
      for (let i = 0; i < cip33Addresses.length; i++) {
        const dustValue = TX_CONSTANTS.DUST_SIZE + i;
        vouts.push({
          value: dustValue,
          address: cip33Addresses[i],
        });
        totalOutputValue += dustValue;
      }

      console.log("After adding data outputs:", {
        totalOutputValue,
        outputCount: vouts.length,
        dustValues: vouts.map(v => v.value)
      });

      if (service_fee > 0 && recipient_fee) {
        vouts.push({
          value: service_fee,
          address: recipient_fee,
        });
        totalOutputValue += service_fee;
        console.log("Added service fee output:", {
          service_fee,
          newTotalOutputValue: totalOutputValue
        });
      }

      // Get UTXO selection
      const { inputs, initialChange } = await TransactionService.UTXOService
        .selectUTXOsForTransaction(
          address,
          vouts,
          satsPerVB,
          0,
          1.5,
          { filterStampUTXOs: true, includeAncestors: true }
        );

      const totalInputValue = inputs.reduce((sum, input) => sum + input.value, 0);

      console.log("UTXO selection results:", {
        inputCount: inputs.length,
        totalInputValue,
        initialChange,
        inputDetails: inputs.map(input => ({
          value: input.value,
          hasAncestor: !!input.ancestor,
          ancestorFees: input.ancestor?.fees,
          ancestorVsize: input.ancestor?.vsize
        }))
      });

      // Calculate adjusted change
      const adjustedChange = totalInputValue - totalOutputValue - exactFeeNeeded;

      console.log("Change calculation:", {
        totalInputValue,
        totalOutputValue,
        exactFeeNeeded,
        adjustedChange,
        difference: totalInputValue - (totalOutputValue + adjustedChange + exactFeeNeeded)
      });

      // Verify final fee rate
      const finalTotalOutputValue = totalOutputValue + adjustedChange;
      const actualFee = totalInputValue - finalTotalOutputValue;
      const actualFeeRate = actualFee / estimatedSize;

      console.log("Final fee verification:", {
        requestedFeeRate: satsPerVB,
        actualFeeRate,
        difference: Math.abs(actualFeeRate - satsPerVB),
        totalInputValue,
        finalTotalOutputValue,
        actualFee,
        estimatedSize,
        effectiveFeePerVbyte: actualFee / estimatedSize
      });

      // Add change output
      if (adjustedChange > 0) {
        vouts.push({
          value: adjustedChange,
          address: address,
        });
        console.log("Added change output:", {
          adjustedChange,
          finalVoutCount: vouts.length,
          allVoutValues: vouts.map(v => v.value)
        });
      }

      // Before adding outputs
      console.log("Preparing to add outputs:", {
        outputCount: vouts.length,
        outputs: vouts.map(out => ({
          hasScript: "script" in out,
          hasAddress: "address" in out,
          value: out.value,
          scriptType: "script" in out ? 
            `Uint8Array: ${out.script instanceof Uint8Array}` : 
            'N/A'
        }))
      });

      // Add inputs to PSBT
      for (const input of inputs) {
        const txDetails = await getTransaction(input.txid);

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
          psbtInput.witnessUtxo = {
            script: new Uint8Array(hex2bin(inputDetails.scriptPubKey.hex)),
            value: BigInt(input.value),
          };
        } else {
          psbtInput.nonWitnessUtxo = new Uint8Array(hex2bin(txDetails.hex));
        }

        psbt.addInput(psbtInput);
      }

      // Add outputs
      for (const out of vouts) {
        try {
          if ("script" in out) {
            // For script-based outputs, ensure script is Uint8Array
            psbt.addOutput({
              script: out.script instanceof Uint8Array ? 
                out.script : 
                new Uint8Array(out.script),
              value: BigInt(out.value),
            });
          } else if ("address" in out && out.address) {
            // For address-based outputs
            psbt.addOutput({
              address: out.address,
              value: BigInt(out.value),
            });
          } else {
            console.error("Invalid output:", out);
            throw new Error("Invalid output format");
          }
        } catch (error) {
          console.error("Error adding output:", {
            output: out,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }
      }

      // Final transaction summary
      console.log("Final transaction structure:", {
        inputCount: inputs.length,
        outputCount: vouts.length,
        totalIn: totalInputValue,
        totalOut: finalTotalOutputValue,
        fee: actualFee,
        feeRate: actualFee / estimatedSize,
        size: estimatedSize,
        outputs: vouts.map((v, i) => ({
          index: i,
          value: v.value,
          type: v.address === address ? 'change' : 'data'
        }))
      });

      return {
        psbt,
        feePerKb: satsPerVB,
        estimatedTxSize: estimatedSize,
        totalInputValue,
        totalOutputValue: finalTotalOutputValue,
        totalChangeOutput: adjustedChange,
        totalDustValue: 0,
        estMinerFee: exactFeeNeeded,
        changeAddress: address,
      };
    } catch (error) {
      console.error("PSBT Generation Error:", {
        error,
        address,
        fileSize,
        satsPerVB,
        totalOutputValue,
        cip33AddressCount: cip33Addresses.length,
        vouts: vouts.length,
        estimatedFee: estMinerFee
      });
      throw error;
    }
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
