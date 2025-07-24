// was previously // lib/utils/minting/stamp.ts

import CIP33 from "$lib/utils/minting/olga/CIP33.ts";
import { estimateTransactionSize } from "$lib/utils/minting/transactionSizes.ts";
import { extractOutputs } from "$lib/utils/minting/transactionUtils.ts";
import { getScriptTypeInfo, validateWalletAddressForMinting } from "$lib/utils/scriptTypeUtils.ts";
import { formatPsbtForLogging } from "$server/services/transaction/psbtService.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import type { ScriptType } from "$types/index.d.ts";
import * as bitcoin from "bitcoinjs-lib";
import { Buffer } from "node:buffer";
// Removed unused fee calculation imports
import { hex2bin } from "$lib/utils/binary/baseUtils.ts";
import { logger } from "$lib/utils/logger.ts";
import { TX_CONSTANTS } from "$lib/utils/minting/constants.ts";
import { UTXOService } from "$server/services/transaction/utxoService.ts";
import { CommonUTXOService } from "$server/services/utxo/commonUtxoService.ts";
import { normalizeFeeRate } from "$server/services/xcpService.ts";
import type { UTXO } from "$types/index.d.ts";

export class StampMintService {
  private static commonUtxoService = new CommonUTXOService();
  private static utxoService = new UTXOService(); // Add UTXOService instance

  /**
   * 🚀 REMOVED: getFullUTXOsWithDetails method - replaced with optimal UTXOService pattern
   * OLD INEFFICIENT PATTERN: Fetch full details for ALL UTXOs before selection
   * NEW OPTIMAL PATTERN: Fetch basic UTXOs → Select optimal → Fetch full details for selected only
   */

  static async createStampIssuance({
    sourceWallet,
    assetName,
    qty,
    locked = true,
    divisible = false,
    filename,
    file,
    satsPerVB,
    service_fee = 0,
    service_fee_address = "",
    prefix = "stamp",
    isDryRun = false
  }: {
    sourceWallet: string;
    assetName?: string;
    qty: string;
    locked?: boolean;
    divisible?: boolean;
    filename: string;
    file: string;
    satsPerVB?: number;
    service_fee?: number;
    service_fee_address?: string;
    prefix?: "stamp" | "file" | "glyph";
    isDryRun?: boolean;
  }) {
    // Validate and normalize fee rate
    const { normalizedSatsPerVB } = normalizeFeeRate({
      ...(satsPerVB !== undefined && { satsPerVB }),
    });

    logger.info("stamp-create", {
      message: "Starting createStampIssuance with params",
      sourceWallet,
      assetName,
      qty,
      locked,
      divisible,
      filename,
      fileSize: Math.ceil((file.length * 3) / 4),
      providedSatsPerVB: satsPerVB,
      normalizedSatsPerVB,
      service_fee,
      service_fee_address,
      prefix,
      isDryRun
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

      logger.info("stamp-create", { message: "Starting createStampIssuance" });

      // Convert qty from string to number if needed
      const qtyNumber = typeof qty === 'string' ? parseInt(qty, 10) : qty;

      const result = await this.createIssuanceTransaction({
        sourceWallet,
        assetName: assetName || "", // Provide default empty string for undefined assetName
        qty: qtyNumber,
        locked,
        divisible,
        description: "stamp:",
        satsPerKB: Math.floor(normalizedSatsPerVB * 1000), // Convert sats/vB to sats/kB and ensure integer
        isDryRun: isDryRun || false,
        file, // Pass file data for accurate size calculation
        service_fee,
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
        isDryRun || false
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
      if (error instanceof Error && error.message.includes('invalid base58')) {
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
    isDryRun: boolean
  ) {
    let totalOutputValue = 0;
    let psbt;
    let vouts: Array<{ value: number; address?: string; script?: Uint8Array }> = [];
    const estMinerFee = 0;
    let totalDustValue = 0;
    let actualEstimatedSize = 0;
    let actualExactFeeNeeded = 0;

    try {
      logger.debug("stamp-create", { message: "Starting PSBT generation with params", address, satsPerVB, service_fee, recipient_fee, cip33AddressCount: cip33Addresses.length, fileSize });

      // For dryRun, return mock PSBT data immediately to avoid unnecessary transaction parsing
      if (isDryRun) {
        logger.info("stamp-create", { message: "DryRun mode: returning mock PSBT data", address, fileSize, cip33AddressCount: cip33Addresses.length });

        // Calculate dust value for CIP33 addresses
        totalDustValue = cip33Addresses.length * TX_CONSTANTS.DUST_SIZE;

        // Calculate accurate estimated size based on transaction structure
        const dryRunEstimatedSize = estimateTransactionSize({
          inputs: [{
            type: "P2WPKH" as ScriptType, // Assume P2WPKH input for estimation
            isWitness: true
          }],
          outputs: [
            { type: "OP_RETURN" as ScriptType }, // OP_RETURN
            ...cip33Addresses.map(() => ({
              type: "P2WSH" as ScriptType
            })),
            ...(service_fee > 0 ? [{ type: "P2WPKH" as ScriptType }] : []) // service fee if applicable
          ],
          includeChangeOutput: true,
          changeOutputType: "P2WPKH" as ScriptType
        });

        const estimatedFee = Math.ceil(dryRunEstimatedSize * satsPerVB);

        // FIXED: Include miner fee in total output value for accurate estimation display
        totalOutputValue = totalDustValue + service_fee + estimatedFee;

        return {
          psbt: new bitcoin.Psbt({ network: bitcoin.networks.bitcoin }), // Empty PSBT for dryRun
          inputs: [{
            txid: "mock_txid_for_estimation",
            vout: 0,
            value: totalOutputValue + estimatedFee + 10000, // Mock sufficient input
            address: address,
            script: "mock_script"
          }],
          vouts: [], // Empty for dryRun
          totalOutputValue,
          totalInputValue: totalOutputValue + estimatedFee + 10000,
          estimatedTxSize: dryRunEstimatedSize,
          estMinerFee: estimatedFee,
          totalDustValue,
          actualExactFeeNeeded: estimatedFee,
          totalChangeOutput: 10000 - (estimatedFee % 10000), // Mock change
          feeRate: satsPerVB
        };
      }

      psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });

      // Parse the transaction - handle potential issues with XCP transactions
      let txObj;
      try {
        txObj = bitcoin.Transaction.fromHex(tx);
      } catch (error) {
        // XCP transactions sometimes have witness data or other issues
        // For stamp minting, we only care about the outputs, so we can
        // create a minimal transaction with just the OP_RETURN data
        if (error instanceof Error &&
            (error.message.includes('superfluous witness data') ||
             error.message.includes('Offset is outside the bounds'))) {
          logger.warn("stamp-create", {
            message: "Transaction parsing failed, using minimal transaction",
            error: error.message
          });

          // Create a minimal transaction with just an OP_RETURN output
          // This is sufficient for stamp minting as we'll be creating
          // a completely new transaction anyway
          txObj = new bitcoin.Transaction();
          txObj.version = 2;

          // Add a dummy OP_RETURN output (XCP issuance data)
          const opReturnScript = bitcoin.script.compile([
            bitcoin.opcodes.OP_RETURN,
            Buffer.from('CNTRPRTY', 'utf8')
          ]);
          txObj.addOutput(opReturnScript, BigInt(0));
        } else {
          throw error;
        }
      }

      const rawOutputs = extractOutputs(txObj, address);
      // Convert Output[] to expected format for selectUTXOsForTransaction
      vouts = rawOutputs.map(output => {
        const scriptString = (output as any).script;
        const scriptBuffer = typeof scriptString === 'string'
          ? new Uint8Array(Buffer.from(scriptString, 'hex'))
          : undefined;

        return {
          value: output.value,
          address: (output as any).address,
          ...(scriptBuffer && { script: scriptBuffer }),
        };
      });

      logger.debug("stamp-create", { message: "Initial vouts from transaction", count: vouts.length, values: vouts.map(v => v.value) });

      // Calculate size first
      const estimatedSize = estimateTransactionSize({
        inputs: [{
          type: "P2WPKH" as ScriptType,
          isWitness: true
        }],
        outputs: [
          { type: "P2PKH" as ScriptType },
          ...cip33Addresses.map(() => ({
            type: "P2WSH" as ScriptType
          })),
          { type: "P2WPKH" as ScriptType }
        ],
        includeChangeOutput: true,
        changeOutputType: "P2WPKH" as ScriptType
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

      // Convert vouts to the expected Output format
      const outputsForSelection = vouts.map(vout => ({
        value: vout.value,
        script: vout.script ? Buffer.from(vout.script).toString('hex') : "",
        ...(vout.address && { address: vout.address })
      }));

      // 🚀 OPTIMIZATION: Use optimal UTXO selection pattern instead of fetching all details upfront
      logger.debug("stamp-create", {
        message: "Using optimal UTXO selection pattern",
        outputsForSelection: outputsForSelection.length,
        satsPerVB: satsPerVB
      });

      // Use UTXOService for optimal UTXO selection with full details
      const selectionResult = await this.utxoService.selectUTXOsForTransaction(
        address,
        outputsForSelection,
        satsPerVB,
        0, // sigops_rate
        1.5, // rbfBuffer
        {
          filterStampUTXOs: true, // Filter out stamp-bearing UTXOs
          includeAncestors: true,  // Get full details for selected UTXOs only
        }
      );

      const { inputs, change: initialChange } = selectionResult;
      const totalInputValue = inputs.reduce((sum: number, input: UTXO) => sum + input.value, 0);

      logger.debug("stamp-create", {
        message: "Optimal UTXO selection completed",
        inputCount: inputs.length,
        totalInputValue,
        initialChange,
        inputDetails: inputs.map((input: UTXO) => ({
          value: input.value,
          hasAncestor: !!input.ancestor,
          ancestorFees: input.ancestor?.fees,
          ancestorVsize: input.ancestor?.vsize
        }))
      });

      // Recalculate the exact fee with the actual number of inputs selected
      actualEstimatedSize = estimateTransactionSize({
        inputs: inputs.map((input: UTXO) => ({
          type: (input.scriptType || "P2WPKH") as ScriptType,
          isWitness: true
        })),
        outputs: [
          { type: "OP_RETURN" as ScriptType }, // OP_RETURN
          ...cip33Addresses.map(() => ({
            type: "P2WSH" as ScriptType
          })),
          { type: "P2WPKH" as ScriptType } // service fee
        ],
        includeChangeOutput: true,
        changeOutputType: "P2WPKH" as ScriptType
      });

      actualExactFeeNeeded = Math.ceil(actualEstimatedSize * satsPerVB);

      logger.debug("stamp-create", { message: "Recalculated size and fee with actual inputs",
        originalEstimatedSize: estimatedSize,
        actualEstimatedSize,
        originalFee: exactFeeNeeded,
        actualFee: actualExactFeeNeeded,
        inputCount: inputs.length
      });

      // Calculate adjusted change
      const adjustedChange = totalInputValue - totalOutputValue - actualExactFeeNeeded;

      logger.debug("stamp-create", { message: "Change calculation", totalInputValue, totalOutputValue, actualExactFeeNeeded, adjustedChange, difference: totalInputValue - (totalOutputValue + adjustedChange + actualExactFeeNeeded) });

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
        console.log(`[StampMintService] Minter Input Data for addInput:`, JSON.stringify(psbtInputDataForStamp, (_k,v) => typeof v === 'bigint' ? v.toString() : v));

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
        }, (_k,v) => typeof v === 'bigint' ? v.toString() : v) : "Added input data not found (ERROR)");
      }

      // Recalculate finalTotalOutputValue to include change output
      const finalTotalOutputValue = totalOutputValue + (adjustedChange > 0 ? adjustedChange : 0);

      // Verify final fee rate (after including change output)
      const actualFee = totalInputValue - finalTotalOutputValue;
      const actualFeeRate = actualFee / actualEstimatedSize;

      logger.debug("stamp-create", { message: "Final fee verification", requestedFeeRate: satsPerVB, actualFeeRate, difference: Math.abs(actualFeeRate - satsPerVB), totalInputValue, finalTotalOutputValue, actualFee, actualEstimatedSize, effectiveFeePerVbyte: actualFee / actualEstimatedSize });

      // Final transaction summary
      logger.info("stamp-create", { message: "Final transaction structure for PSBT", inputCount: inputs.length, outputCount: vouts.length, totalIn: totalInputValue, totalOut: finalTotalOutputValue, fee: actualFee, feeRate: actualFee / actualEstimatedSize, size: actualEstimatedSize, outputs: vouts.map((v, i) => ({
        index: i,
        value: v.value,
        type: v.address === address ? 'change' : 'data',
        address: v.address
      })), psbtDetails: formatPsbtForLogging(psbt) });

      return {
        psbt,
        satsPerVB,
        estimatedTxSize: actualEstimatedSize,
        totalInputValue,
        totalOutputValue: finalTotalOutputValue,
        totalChangeOutput: adjustedChange,
        totalDustValue,
        estMinerFee: actualExactFeeNeeded,
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
    isDryRun,
    file,
    service_fee,
  }: {
    sourceWallet: string;
    assetName: string;
    qty: number;
    locked?: boolean;
    divisible?: boolean;
    description: string;
    satsPerKB: number;
    isDryRun?: boolean;
    file: string;
    service_fee: number;
  }) {
    try {
      // Add wallet validation
      const walletValidation = validateWalletAddressForMinting(sourceWallet);
      if (!walletValidation.isValid) {
        throw new Error(`Invalid source wallet address: ${walletValidation.error}`);
      }

      logger.info("stamp-create", { message: "Starting createIssuanceTransaction with params", sourceWallet, assetName, qty, locked, divisible, description, satsPerKB, isDryRun: isDryRun, isDryRunType: typeof isDryRun });

      // For dryRun, return mock transaction data to avoid UTXO lookup
      if (isDryRun === true) {
        logger.info("stamp-create", { message: "DryRun mode: calculating accurate transaction size", sourceWallet, isDryRunValue: isDryRun });

        // Calculate accurate transaction size based on actual parameters
        // This is much more accurate than the XCP API call and significantly faster!

        // Calculate exact file size and CIP33 chunks from actual file data
        const actualFileSize = Math.ceil((file.length * 3) / 4); // Convert base64 to bytes
        const cip33ChunkCount = Math.ceil(actualFileSize / 32); // Each chunk is ~32 bytes

        // Calculate transaction structure:
        // 1. Base transaction overhead: ~10 bytes
        let estimatedSize = 10;

        // 2. Inputs (assume 1 P2WPKH input for estimation)
        estimatedSize += 68; // P2WPKH input size

        // 3. Outputs:
        estimatedSize += 43; // OP_RETURN output (Counterparty issuance)
        estimatedSize += cip33ChunkCount * 43; // P2WSH data outputs for file chunks
        estimatedSize += 31; // Change output (P2WPKH)

        // 4. Service fee output (if applicable)
        if (service_fee > 0) {
          estimatedSize += 31; // Service fee output
        }

        const estimatedFee = Math.ceil(estimatedSize * (satsPerKB / 1000));
        const totalDustValue = cip33ChunkCount * 333; // Each P2WSH output has dust

        logger.info("stamp-create", {
          message: "DryRun size calculation",
          actualFileSize,
          cip33ChunkCount,
          estimatedSize,
          satsPerKB,
          estimatedFee,
          totalDustValue,
          hasServiceFee: service_fee > 0,
          breakdown: {
            base: 10,
            inputs: 68,
            opReturn: 43,
            dataOutputs: cip33ChunkCount * 43,
            change: 31,
            serviceFee: service_fee > 0 ? 31 : 0
          }
        });

        return {
          tx_hex: "mock_transaction_hex_for_fee_estimation",
          tx_size: estimatedSize,
          fee_rate: satsPerKB,
          total_fee: estimatedFee,
          total_dust_value: totalDustValue,
          inputs: [],
          outputs: [],
          estimated_chunks: cip33ChunkCount,
          estimation_method: "client_side_calculation_exact"
        };
      }

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
