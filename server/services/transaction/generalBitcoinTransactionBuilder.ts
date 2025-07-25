/**
 * General Bitcoin Transaction Builder - Clean Architecture for All Counterparty Operations
 *
 * Extracted from the proven StampMintService.generatePSBT() pattern
 * Works with raw hex from Counterparty (return_psbt: false)
 *
 * Supports: Mint, Fairmint, Detach, Dispense, and future operations
 */

import { hex2bin } from "$lib/utils/binary/baseUtils.ts";
import { logger } from "$lib/utils/logger.ts";
import { TX_CONSTANTS } from "$lib/utils/minting/constants.ts";
import { estimateTransactionSize } from "$lib/utils/minting/transactionSizes.ts";
import { extractOutputs } from "$lib/utils/minting/transactionUtils.ts";
import { getScriptTypeInfo } from "$lib/utils/scriptTypeUtils.ts";
import { CommonUTXOService } from "$server/services/utxo/commonUtxoService.ts";
import { OptimalUTXOSelection } from "$server/services/utxo/optimalUtxoSelection.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import type { ScriptType, UTXO } from "$types/index.d.ts";
import * as bitcoin from "bitcoinjs-lib";
import { Buffer } from "node:buffer";

export interface BitcoinTransactionGenerationOptions {
  address: string;
  satsPerVB: number;
  serviceFee?: number;
  serviceFeeAddress?: string;
  operationType: 'mint' | 'fairmint' | 'detach' | 'dispense' | 'generic';
  // For mint operations
  cip33Addresses?: string[];
  fileSize?: number;
  // For generic operations
  customOutputs?: Array<{ value: number; address: string }>;
}

export interface BitcoinTransactionGenerationResult {
  psbt: bitcoin.Psbt;
  estimatedTxSize: number;
  totalInputValue: number;
  totalOutputValue: number;
  totalChangeOutput: number;
  totalDustValue: number;
  estMinerFee: number;
  changeAddress: string;
}

export class GeneralBitcoinTransactionBuilder {
  private static commonUtxoService = new CommonUTXOService();

  /**
   * Universal PSBT generator for all Counterparty operations
   * Uses the proven mint pattern but adapted for any operation type
   */
  static async generatePSBT(
    counterpartyRawHex: string,
    options: BitcoinTransactionGenerationOptions
  ): Promise<BitcoinTransactionGenerationResult> {
    const {
      address,
      satsPerVB,
      serviceFee = 0,
      serviceFeeAddress,
      operationType,
      cip33Addresses = [],
      customOutputs = []
    } = options;

    logger.debug("api", {
      message: "Starting universal PSBT generation",
      operationType,
      address,
      satsPerVB,
      serviceFee,
      customOutputsCount: customOutputs.length,
      cip33AddressCount: cip33Addresses.length
    });

    let totalOutputValue = 0;
    let totalDustValue = 0;
    let psbt: bitcoin.Psbt;
    let vouts: Array<{ value: number; address?: string; script?: Uint8Array }> = [];

    try {
      psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });

      // Parse the Counterparty raw transaction
      let txObj;
      try {
        txObj = bitcoin.Transaction.fromHex(counterpartyRawHex);
      } catch (error) {
        // Handle XCP transaction parsing issues (same as mint pattern)
        if (error instanceof Error &&
            (error.message.includes('superfluous witness data') ||
             error.message.includes('Offset is outside the bounds'))) {
          logger.warn("api", {
            message: "Transaction parsing failed, using minimal transaction",
            error: error.message,
            operationType
          });

          txObj = new bitcoin.Transaction();
          txObj.version = 2;
          const opReturnScript = bitcoin.script.compile([
            bitcoin.opcodes.OP_RETURN,
            Buffer.from('CNTRPRTY', 'utf8')
          ]);
          txObj.addOutput(opReturnScript, BigInt(0));
        } else {
          throw error;
        }
      }

      // Extract outputs from the Counterparty transaction
      const rawOutputs = extractOutputs(txObj, address);
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

      logger.debug("api", {
        message: "Extracted outputs from Counterparty transaction",
        outputCount: vouts.length,
        operationType
      });

      // Add operation-specific outputs
      if (operationType === 'mint' && cip33Addresses.length > 0) {
        // Add CIP33 data outputs for minting
        for (let i = 0; i < cip33Addresses.length; i++) {
          const dustValue = TX_CONSTANTS.DUST_SIZE;
          vouts.push({
            value: dustValue,
            address: cip33Addresses[i],
          });
          totalOutputValue += dustValue;
          totalDustValue += dustValue;
        }
      } else if (customOutputs.length > 0) {
        // Add custom outputs for other operations
        for (const customOutput of customOutputs) {
          vouts.push({
            value: customOutput.value,
            address: customOutput.address,
          });
          totalOutputValue += customOutput.value;
        }
      }

      // Add service fee output
      if (serviceFee > 0 && serviceFeeAddress) {
        vouts.push({
          value: serviceFee,
          address: serviceFeeAddress,
        });
        totalOutputValue += serviceFee;
        logger.debug("api", {
          message: "Added service fee output",
          serviceFee,
          operationType
        });
      }

      // Get UTXOs for funding
      const fullUTXOs = await this.getFullUTXOsWithDetails(address, true, []);

      if (fullUTXOs.length === 0) {
        throw new Error(`No UTXOs available for ${operationType} operation`);
      }

      // Convert vouts for UTXO selection
      const outputsForSelection = vouts.map(vout => ({
        value: vout.value,
        script: vout.script ? Buffer.from(vout.script).toString('hex') : "",
        ...(vout.address && { address: vout.address })
      }));

      // Select optimal UTXOs
      const selectionResult = OptimalUTXOSelection.selectUTXOs(
        fullUTXOs,
        outputsForSelection,
        satsPerVB,
        {
          avoidChange: true,
          consolidationMode: false,
          dustThreshold: 1000
        }
      );

      const { inputs } = selectionResult;
      const totalInputValue = inputs.reduce((sum: number, input: UTXO) => sum + input.value, 0);

      // Recalculate with actual inputs
      const actualEstimatedSize = estimateTransactionSize({
        inputs: inputs.map((input: UTXO) => ({
          type: (input.scriptType || "P2WPKH") as ScriptType,
          isWitness: true
        })),
        outputs: [
          { type: "OP_RETURN" as ScriptType },
          ...vouts.slice(1).map(() => ({ type: "P2WPKH" as ScriptType })),
        ],
        includeChangeOutput: true,
        changeOutputType: "P2WPKH" as ScriptType
      });

      const actualFeeNeeded = Math.ceil(actualEstimatedSize * satsPerVB);
      const adjustedChange = totalInputValue - totalOutputValue - actualFeeNeeded;

      if (adjustedChange < 0) {
        throw new Error(`Insufficient funds for ${operationType} operation`);
      }

      // Add change output if positive
      if (adjustedChange > 0) {
        vouts.push({
          value: adjustedChange,
          address: address,
        });
      }

      // Add outputs to PSBT
      for (const out of vouts) {
        try {
          if ("script" in out && out.script) {
            psbt.addOutput({
              script: out.script,
              value: BigInt(out.value),
            });
          } else if ("address" in out && out.address) {
            psbt.addOutput({
              address: out.address,
              value: BigInt(out.value),
            });
          } else {
            throw new Error("Invalid output format");
          }
        } catch (error) {
          logger.error("api", {
            message: "Error adding output to PSBT",
            output: out,
            operationType,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }
      }

      // Add inputs to PSBT
      for (const input of inputs) {
        if (!input.script) {
          throw new Error(`Input UTXO ${input.txid}:${input.vout} is missing script`);
        }

        const scriptTypeInfo = getScriptTypeInfo(input.script);
        const isWitnessInput = scriptTypeInfo.isWitness ||
                              (scriptTypeInfo.type === "P2SH" && scriptTypeInfo.redeemScriptType?.isWitness) ||
                              input.scriptType?.startsWith("witness") ||
                              input.scriptType?.toUpperCase().includes("P2W");

        const psbtInputData: any = {
          hash: input.txid,
          index: input.vout,
          sequence: 0xfffffffd,
        };

        if (isWitnessInput) {
          psbtInputData.witnessUtxo = {
            script: new Uint8Array(hex2bin(input.script)),
            value: BigInt(input.value),
          };
        } else {
          const rawTxHex = await this.commonUtxoService.getRawTransactionHex(input.txid);
          if (!rawTxHex) {
            throw new Error(`Failed to fetch raw transaction for ${input.txid}`);
          }
          psbtInputData.nonWitnessUtxo = new Uint8Array(hex2bin(rawTxHex));
        }

        psbt.addInput(psbtInputData as any);
      }

      const finalTotalOutputValue = totalOutputValue + (adjustedChange > 0 ? adjustedChange : 0);
      const actualFee = totalInputValue - finalTotalOutputValue;
      const actualFeeRate = actualFee / actualEstimatedSize;

      logger.info("api", {
        message: `${operationType} PSBT generation complete`,
        inputCount: inputs.length,
        outputCount: vouts.length,
        totalInputValue,
        totalOutputValue: finalTotalOutputValue,
        fee: actualFee,
        feeRate: actualFeeRate,
        size: actualEstimatedSize
      });

      return {
        psbt,
        estimatedTxSize: actualEstimatedSize,
        totalInputValue,
        totalOutputValue: finalTotalOutputValue,
        totalChangeOutput: adjustedChange,
        totalDustValue,
        estMinerFee: actualFeeNeeded,
        changeAddress: address,
      };

    } catch (error) {
      logger.error("api", {
        message: `${operationType} PSBT generation error`,
        error: error instanceof Error ? error.message : String(error),
        address,
        satsPerVB
      });
      throw error;
    }
  }

  /**
   * Get full UTXO details (copied from StampMintService pattern)
   */
  private static async getFullUTXOsWithDetails(
    address: string,
    filterStampUTXOs: boolean = true,
    excludeUtxos: Array<{ txid: string; vout: number }> = []
  ): Promise<UTXO[]> {
    let basicUtxos = await this.commonUtxoService.getSpendableUTXOs(address, undefined, {
      includeAncestorDetails: true,
      confirmedOnly: false
    });

    // Apply exclusions
    if (excludeUtxos.length > 0) {
      const excludeSet = new Set(excludeUtxos.map(u => `${u.txid}:${u.vout}`));
      basicUtxos = basicUtxos.filter(utxo => !excludeSet.has(`${utxo.txid}:${utxo.vout}`));
    }

    // Filter stamp UTXOs if requested
    if (filterStampUTXOs) {
      try {
        const stampBalances = await XcpManager.getXcpBalancesByAddress(address, undefined, true);
        const utxosToExcludeFromStamps = new Set<string>();
        for (const balance of stampBalances.balances) {
          if (balance.utxo) {
            utxosToExcludeFromStamps.add(balance.utxo);
          }
        }
        basicUtxos = basicUtxos.filter(
          (utxo) => !utxosToExcludeFromStamps.has(`${utxo.txid}:${utxo.vout}`),
        );
      } catch (error) {
        logger.error("api", {
          message: "Error filtering stamp UTXOs",
          address,
          error: (error as any).message
        });
      }
    }

    // Get full details for all UTXOs
    const fullUTXOs: UTXO[] = [];
    for (const basicUtxo of basicUtxos) {
      try {
        const fullUtxo = await this.commonUtxoService.getSpecificUTXO(
          basicUtxo.txid,
          basicUtxo.vout,
          { includeAncestorDetails: true }
        );

        if (fullUtxo && fullUtxo.script && fullUtxo.value > 0) {
          fullUTXOs.push(fullUtxo);
        }
      } catch (error) {
        logger.warn("api", {
          message: "Skipping UTXO due to fetch error",
          txid: basicUtxo.txid,
          vout: basicUtxo.vout,
          error: (error as any).message
        });
      }
    }

    return fullUTXOs;
  }
}
