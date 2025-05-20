// was previously // lib/utils/minting/stamp.ts

import { TransactionService } from "$server/services/transaction/index.ts";
import { extractOutputs } from "$lib/utils/minting/transactionUtils.ts";
import * as bitcoin from "bitcoinjs-lib";
import { generateRandomNumber } from "$lib/utils/numberUtils.ts";
import type { stampMintData, stampMintCIP33, PSBTInput } from "$types/index.d.ts";
import CIP33 from "$lib/utils/minting/olga/CIP33.ts";
import { PSBTService, formatPsbtForLogging } from "$server/services/transaction/psbtService.ts";
import { estimateTransactionSize } from "$lib/utils/minting/transactionSizes.ts";
import { getScriptTypeInfo } from "$lib/utils/scriptTypeUtils.ts";
import { validateWalletAddressForMinting } from "$lib/utils/scriptTypeUtils.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { calculateDust, calculateMiningFee, calculateP2WSHMiningFee } from "$lib/utils/minting/feeCalculations.ts";
import { TX_CONSTANTS} from "$lib/utils/minting/constants.ts";
import { hex2bin } from "$lib/utils/binary/baseUtils.ts";
import { CommonUTXOService } from "$server/services/utxo/commonUtxoService.ts";
import { normalizeFeeRate } from "$server/services/xcpService.ts";
import { logger } from "$lib/utils/logger.ts";

export class StampMintService {
  private static commonUtxoService = new CommonUTXOService();

  static async createStampIssuance({
    sourceWallet,
    assetName,
    qty,
    locked = true,
    divisible = false,
    filename,
    file,
    satsPerKB,
    satsPerVB,
    service_fee,
    service_fee_address,
    prefix,
    isDryRun,
  }: {
    sourceWallet: string;
    assetName: string;
    qty: number;
    locked: boolean;
    divisible: boolean;
    filename: string;
    file: string;
    satsPerKB?: number;
    satsPerVB?: number;
    service_fee: number;
    service_fee_address: string;
    prefix: "stamp" | "file" | "glyph";
    isDryRun?: boolean;
  }) {
    // Validate and normalize fee rate
    const { normalizedSatsPerVB, normalizedSatsPerKB } = normalizeFeeRate({
      satsPerKB,
      satsPerVB
    });

    logger.info("stamp-create", { message: "Starting createStampIssuance with params", sourceWallet, assetName, qty, locked, divisible, filename, fileSize: Math.ceil((file.length * 3) / 4), providedSatsPerKB: satsPerKB, providedSatsPerVB: satsPerVB, normalizedSatsPerVB, service_fee, service_fee_address, prefix, isDryRun });

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

      logger.info("stamp-create", { message: "Starting createStampIssuance" });

      const result = await this.createIssuanceTransaction({
        sourceWallet,
        assetName,
        qty,
        locked,
        divisible,
        description: "stamp:",
        satsPerKB: normalizedSatsPerKB,
      });

      if (!result.tx_hex) {
        throw new Error("Transaction creation failed: No transaction hex returned");
      }

      const hex = result.tx_hex;
      const hex_file = CIP33.base64_to_hex(file);
      const cip33Addresses = CIP33.file_to_addresses(hex_file);

      const fileSize = Math.ceil((file.length * 3) / 4);
      logger.debug("stamp-create", { message: "File and CIP33 details", fileSize, cip33AddressCount: cip33Addresses.length, hex_length: hex_file.length });

      const psbtDetails = await this.generatePSBT(
        hex,
        sourceWallet,
        normalizedSatsPerVB,
        service_fee,
        service_fee_address,
        cip33Addresses as string[],
        fileSize,
        !isDryRun
      );

      if (isDryRun) {
        return {
          est_tx_size: psbtDetails.estimatedTxSize,
          input_value: psbtDetails.totalInputValue,
          total_dust_value: psbtDetails.totalDustValue,
          est_miner_fee: psbtDetails.estMinerFee,
          change_value: psbtDetails.totalChangeOutput,
          total_output_value: psbtDetails.totalOutputValue,
        };
      } else {
        return {
          hex: psbtDetails.psbt.toHex(),
          est_tx_size: psbtDetails.estimatedTxSize,
          input_value: psbtDetails.totalInputValue,
          total_dust_value: psbtDetails.totalDustValue,
          est_miner_fee: psbtDetails.estMinerFee,
          change_value: psbtDetails.totalChangeOutput,
          total_output_value: psbtDetails.totalOutputValue,
        };
      }
    } catch (error) {
      logger.error("stamp-create", { message: "Detailed mint error", error: error instanceof Error ? error.message : String(error) });
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
    usePreciseSelection: boolean
  ) {
    let totalOutputValue = 0;
    let psbt;
    let vouts: Array<{ value: number; address?: string; script?: Uint8Array }> = [];
    let estMinerFee = 0;
    let totalDustValue = 0;
    

    try {
      logger.debug("stamp-create", { message: "Starting PSBT generation with params", address, satsPerVB, service_fee, recipient_fee, cip33AddressCount: cip33Addresses.length, fileSize });

      psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
      const txObj = bitcoin.Transaction.fromHex(tx);
      vouts = extractOutputs(txObj, address);

      logger.debug("stamp-create", { message: "Initial vouts from transaction", count: vouts.length, values: vouts.map(v => v.value) });

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
      logger.debug("stamp-create", { message: "Transaction size details", estimatedSize, inputBreakdown: {
        txid: 32,
        vout: 4,
        sequence: 4,
        witnessData: 108,
      }, outputBreakdown: {
        opReturn: 45,
        p2wshOutputs: cip33Addresses.length * 43,
        changeOutput: 31,
      }, totalRaw: 32 + 4 + 4 + 108 + 45 + (cip33Addresses.length * 43) + 31 });

      // Calculate exact fee needed
      const exactFeeNeeded = Math.ceil(estimatedSize * satsPerVB);

      logger.debug("stamp-create", { message: "Size and fee calculation", estimatedSize, requestedFeeRate: satsPerVB, exactFeeNeeded, expectedFeePerVbyte: exactFeeNeeded / estimatedSize });

      // Add data outputs
      for (let i = 0; i < cip33Addresses.length; i++) {
        const dustValue = TX_CONSTANTS.DUST_SIZE;
        vouts.push({
          value: dustValue,
          address: cip33Addresses[i],
        });
        totalOutputValue += dustValue;
        totalDustValue += dustValue;
      }

      logger.debug("stamp-create", { message: "After adding data outputs", totalOutputValue, totalDustValue, outputCount: vouts.length, dustValues: vouts.map(v => v.value) });

      if (service_fee > 0 && recipient_fee) {
        vouts.push({
          value: service_fee,
          address: recipient_fee,
        });
        totalOutputValue += service_fee;
        logger.debug("stamp-create", { message: "Added service fee output", service_fee, newTotalOutputValue: totalOutputValue });
      }

      // Get UTXO selection
      const { inputs, initialChange } = await TransactionService.utxoServiceInstance
        .selectUTXOsForTransaction(
          address,
          vouts,
          satsPerVB,
          0,
          1.5,
          { filterStampUTXOs: true, includeAncestors: usePreciseSelection }
        );

      const totalInputValue = inputs.reduce((sum, input) => sum + input.value, 0);

      logger.debug("stamp-create", { message: "UTXO selection results", inputCount: inputs.length, totalInputValue, initialChange, inputDetails: inputs.map(input => ({
        value: input.value,
        hasAncestor: !!input.ancestor,
        ancestorFees: input.ancestor?.fees,
        ancestorVsize: input.ancestor?.vsize
      })) });

      // Calculate adjusted change
      const adjustedChange = totalInputValue - totalOutputValue - exactFeeNeeded;

      logger.debug("stamp-create", { message: "Change calculation", totalInputValue, totalOutputValue, exactFeeNeeded, adjustedChange, difference: totalInputValue - (totalOutputValue + adjustedChange + exactFeeNeeded) });

      // Ensure adjustedChange is not negative
      if (adjustedChange < 0) {
        logger.error("stamp-create", { message: "Adjusted change is negative, indicating insufficient funds." });
        throw new Error("Insufficient funds to cover outputs and fees.");
      }

      // Add change output if adjustedChange is positive
      if (adjustedChange > 0) {
        vouts.push({
          value: adjustedChange,
          address: address,
        });
        logger.debug("stamp-create", { message: "Added change output", adjustedChange, finalVoutCount: vouts.length, allVoutValues: vouts.map(v => v.value) });
      }

      logger.debug("stamp-create", { message: "Preparing to add outputs to PSBT", outputCount: vouts.length, outputs: vouts.map(out => ({
        hasScript: "script" in out,
        hasAddress: "address" in out,
        value: out.value,
        scriptType: "script" in out ? 
          `Uint8Array: ${out.script instanceof Uint8Array}` : 
          'N/A'
      })) });

      // Add outputs to PSBT
      for (const out of vouts) {
        try {
          if ("script" in out && out.script) {
            // For script-based outputs
            psbt.addOutput({
              script: out.script,
              value: BigInt(out.value),
            });
          } else if ("address" in out && out.address) {
            // For address-based outputs
            psbt.addOutput({
              address: out.address,
              value: BigInt(out.value),
            });
          } else {
            logger.error("stamp-create", { message: "Invalid output", output: out });
            throw new Error("Invalid output format");
          }
        } catch (error) {
          logger.error("stamp-create", { message: "Error adding output to PSBT", output: out, error: error instanceof Error ? error.message : String(error) });
          throw error;
        }
      }

      logger.debug("stamp-create", { message: "Preparing to add inputs to PSBT", inputCount: inputs.length });
      // Add inputs to PSBT
      for (const input of inputs) {
        if (!input.script) {
          logger.error("stamp-create", { message: "Input UTXO is missing script", input });
          throw new Error(`Input UTXO ${input.txid}:${input.vout} is missing script (scriptPubKey).`);
        }

        const scriptTypeInfo = getScriptTypeInfo(input.script);
        const isWitnessInput = scriptTypeInfo.isWitness || 
                              (scriptTypeInfo.type === "P2SH" && scriptTypeInfo.redeemScriptType?.isWitness) ||
                              input.scriptType?.startsWith("witness") ||
                              input.scriptType?.toUpperCase().includes("P2W");

        const psbtInputDataForStamp: any = {
          hash: input.txid,
          index: input.vout,
          sequence: 0xfffffffd,
        };

        if (isWitnessInput) {
          psbtInputDataForStamp.witnessUtxo = {
            script: new Uint8Array(hex2bin(input.script)),
            value: BigInt(input.value),
          };
        } else {
          const rawTxHex = await StampMintService.commonUtxoService.getRawTransactionHex(input.txid);
          if (!rawTxHex) {
            logger.error("stamp-create", { message: "Failed to fetch raw transaction hex for non-witness input", txid: input.txid });
            throw new Error(`Failed to fetch raw transaction for non-witness input ${input.txid}`);
          }
          psbtInputDataForStamp.nonWitnessUtxo = new Uint8Array(hex2bin(rawTxHex));
        }
        
        // Log before adding input
        const currentInputIndexForLog = psbt.inputCount;
        console.log(`[StampMintService] Preparing Minter Input #${currentInputIndexForLog} (from UTXO ${input.txid}:${input.vout})`);
        console.log(`[StampMintService] Minter Input Data for addInput:`, JSON.stringify(psbtInputDataForStamp, (k,v) => typeof v === 'bigint' ? v.toString() : v));

        psbt.addInput(psbtInputDataForStamp as any);

        // Log psbt.data.inputs[currentInputIndexForLog] AFTER adding
        const addedInputData = psbt.data.inputs[currentInputIndexForLog];
        console.log(`[StampMintService] Minter Input #${currentInputIndexForLog} state in psbt.data.inputs AFTER addInput:`);
        console.log(addedInputData ? JSON.stringify({
            hasWitnessUtxo: !!addedInputData.witnessUtxo,
            witnessUtxoValue: addedInputData.witnessUtxo?.value.toString(),
            witnessUtxoScriptLen: addedInputData.witnessUtxo?.script.length,
            hasNonWitnessUtxo: !!addedInputData.nonWitnessUtxo,
            nonWitnessUtxoLen: addedInputData.nonWitnessUtxo?.length,
            hasRedeemScript: !!addedInputData.redeemScript,
            redeemScriptLen: addedInputData.redeemScript?.length,
            hasWitnessScript: !!addedInputData.witnessScript,
            witnessScriptLen: addedInputData.witnessScript?.length,
            sighashType: addedInputData.sighashType,
            sequence: psbt.txInputs[currentInputIndexForLog]?.sequence
        }, (k,v) => typeof v === 'bigint' ? v.toString() : v) : "Added input data not found (ERROR)");
      }

      // Recalculate finalTotalOutputValue to include change output
      const finalTotalOutputValue = totalOutputValue + (adjustedChange > 0 ? adjustedChange : 0);

      // Verify final fee rate (after including change output)
      const actualFee = totalInputValue - finalTotalOutputValue;
      const actualFeeRate = actualFee / estimatedSize;

      logger.debug("stamp-create", { message: "Final fee verification", requestedFeeRate: satsPerVB, actualFeeRate, difference: Math.abs(actualFeeRate - satsPerVB), totalInputValue, finalTotalOutputValue, actualFee, estimatedSize, effectiveFeePerVbyte: actualFee / estimatedSize });

      // Final transaction summary
      logger.info("stamp-create", { message: "Final transaction structure for PSBT", inputCount: inputs.length, outputCount: vouts.length, totalIn: totalInputValue, totalOut: finalTotalOutputValue, fee: actualFee, feeRate: actualFee / estimatedSize, size: estimatedSize, outputs: vouts.map((v, i) => ({
        index: i,
        value: v.value,
        type: v.address === address ? 'change' : 'data',
        address: v.address
      })), psbtDetails: formatPsbtForLogging(psbt) });

      return {
        psbt,
        satsPerVB,
        estimatedTxSize: estimatedSize,
        totalInputValue,
        totalOutputValue: finalTotalOutputValue,
        totalChangeOutput: adjustedChange,
        totalDustValue,
        estMinerFee: exactFeeNeeded,
        changeAddress: address,
      };
    } catch (error) {
      logger.error("stamp-create", { message: "PSBT Generation Error in StampMintService", error: error instanceof Error ? error.message : String(error), address, fileSize, satsPerVB, totalOutputValue, cip33AddressCount: cip33Addresses.length, vouts: vouts.length, estimatedFee: estMinerFee });
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

      logger.info("stamp-create", { message: "Starting createIssuanceTransaction with params", sourceWallet, assetName, qty, locked, divisible, description, satsPerKB });

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

        throw new Error(`API Error: ${response.error || 'Unknown error'}`);
      }

      // Check for nested result and rawtransaction
      if (!response.result?.rawtransaction) {
        logger.error("stamp-create", { message: "API Response", response }); // Log the full response for debugging
        throw new Error('Transaction creation failed: No transaction data returned from API');
      }

      // Return with tx_hex for compatibility with existing code
      return {
        tx_hex: response.result.rawtransaction
      };
    } catch (error) {
      logger.error("stamp-create", { message: "Detailed createIssuanceTransaction error", error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
