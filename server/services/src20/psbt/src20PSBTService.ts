import CIP33 from "$lib/utils/minting/olga/CIP33.ts";
import { AncestorInfo, PSBTInput } from "$types/index.d.ts";
import * as bitcoin from "bitcoinjs-lib";
const { networks, address, Psbt } = bitcoin;
// Removed unused imports: calculateDust, calculateMiningFee, estimateTransactionSize, msgpack
import { hex2bin } from "$lib/utils/binary/baseUtils.ts";
// Removed TransactionService import - using direct OptimalUTXOSelection instead
import { logger } from "$lib/utils/logger.ts";
import { TX_CONSTANTS } from "$lib/utils/minting/constants.ts";
import { getScriptTypeInfo } from "$lib/utils/scriptTypeUtils.ts";
import { CommonUTXOService } from "$server/services/utxo/commonUtxoService.ts";
import { OptimalUTXOSelection } from "$server/services/utxo/optimalUtxoSelection.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import type { UTXO } from "$types/index.d.ts";

interface PSBTParams {
  sourceAddress: string;
  toAddress: string;
  src20Action: Record<string, unknown>;
  satsPerVB: number;
  service_fee: number;
  service_fee_address: string;
  changeAddress: string;
  utxoAncestors?: AncestorInfo[];
  trxType?: "olga" | "multisig";
  utxos?: Array<{
    txid: string;
    vout: number;
    value: number;
    script: string;
    address: string;
  }>;
  isDryRun?: boolean;
}

export class SRC20PSBTService {
  private static readonly STAMP_PREFIX = "stamp:";
  private static commonUtxoService = new CommonUTXOService();

  /**
   * Simplified UTXO selection that gets full details upfront - same pattern as stamp minting
   */
  private static async getFullUTXOsWithDetails(
    address: string,
    filterStampUTXOs: boolean = true,
    excludeUtxos: Array<{ txid: string; vout: number }> = []
  ): Promise<UTXO[]> {
    logger.debug("src20", {
      message: "Fetching full UTXOs with details upfront",
      address,
      filterStampUTXOs,
      excludeUtxos: excludeUtxos.length
    });

    // Get basic UTXOs first
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
        logger.error("src20", {
          message: "Error filtering stamp UTXOs",
          address,
          error: (error as any).message
        });
      }
    }

    // Now get full details for all UTXOs upfront
    const fullUTXOs: UTXO[] = [];
    for (const basicUtxo of basicUtxos) {
      try {
        const fullUtxo = await this.commonUtxoService.getSpecificUTXO(
          basicUtxo.txid,
          basicUtxo.vout,
          { includeAncestorDetails: true, confirmedOnly: false }
        );

        if (fullUtxo && fullUtxo.script) {
          fullUTXOs.push(fullUtxo);
        } else {
          logger.warn("src20", {
            message: "Skipping UTXO with missing script",
            txid: basicUtxo.txid,
            vout: basicUtxo.vout,
            hasFullUtxo: !!fullUtxo,
            hasScript: !!fullUtxo?.script
          });
        }
      } catch (error) {
        logger.warn("src20", {
          message: "Failed to fetch full UTXO details",
          txid: basicUtxo.txid,
          vout: basicUtxo.vout,
          error: (error as any).message
        });
      }
    }

    logger.debug("src20", {
      message: "Full UTXOs fetched successfully",
      total: fullUTXOs.length,
      withScripts: fullUTXOs.filter(u => u.script).length
    });

    return fullUTXOs;
  }

  static async preparePSBT({
    sourceAddress,
    toAddress,
    src20Action,
    satsPerVB,
    service_fee: _service_fee,
    service_fee_address: _service_fee_address,
    changeAddress,
    trxType = "olga",
    isDryRun = false,
  }: PSBTParams) {
    logger.debug("src20", {
      message: "preparePSBT called",
      data: {
        sourceAddress,
        toAddress,
        satsPerVB,
        trxType,
        action: (src20Action as {op?: string}).op,
        isDryRun,
      }
    });
    try {
      const effectiveChangeAddress = changeAddress || sourceAddress;
      const network = networks.bitcoin;

      const { chunks } = await this.prepareActionData(src20Action);

      const outputs = [
        { script: Array.from(address.toOutputScript(toAddress, network)).map(b => b.toString(16).padStart(2, '0')).join(''), value: TX_CONSTANTS.SRC20_DUST, },
        ...chunks.map((chunk) => ({ script: Array.from(address.toOutputScript(chunk, network)).map(b => b.toString(16).padStart(2, '0')).join(''), value: TX_CONSTANTS.SRC20_DUST, }))
      ];

      // Convert outputs to format expected by OptimalUTXOSelection
      const outputsForSelection = outputs.map(output => ({
        value: output.value,
        script: output.script,
      }));

      // Get full UTXOs with details first - same pattern as stamp minting
      const fullUTXOs = await this.getFullUTXOsWithDetails(sourceAddress, true, []);

      if (fullUTXOs.length === 0) {
        throw new Error("No UTXOs available for SRC-20 transaction");
      }

      // Use optimal UTXO selection directly - same pattern as stamp minting
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

      const { inputs, change } = selectionResult;

      const psbt = new Psbt({ network });

      for (const input of inputs) {
        if (!input.script) {
          logger.error("src20", { message: "Input UTXO is missing script.", input });
          throw new Error(`Input UTXO ${input.txid}:${input.vout} is missing script (scriptPubKey).`);
        }
        const psbtInputArgs: PSBTInput = {
          hash: input.txid,
          index: input.vout,
          sequence: 0xfffffffd,
        };
        const scriptTypeInfo = getScriptTypeInfo(input.script);
        const isWitness = scriptTypeInfo.isWitness ||
                          (scriptTypeInfo.type === "P2SH" && scriptTypeInfo.redeemScriptType?.isWitness) ||
                          input.scriptType?.startsWith("witness") ||
                          input.scriptType?.toUpperCase().includes("P2W");
        if (isWitness) {
          psbtInputArgs.witnessUtxo = {
            script: new Uint8Array(hex2bin(input.script)),
            value: BigInt(input.value),
          };
        } else {
          const rawTxHex = await SRC20PSBTService.commonUtxoService.getRawTransactionHex(input.txid);
          if (!rawTxHex) {
            logger.error("src20", { message: "Failed to fetch raw tx hex for non-witness input", txid: input.txid });
            throw new Error(`Failed to fetch raw transaction for non-witness input ${input.txid}`);
          }
          psbtInputArgs.nonWitnessUtxo = new Uint8Array(hex2bin(rawTxHex));
        }
        psbt.addInput(psbtInputArgs as any);
      }
      outputs.forEach(output => {
        psbt.addOutput({ script: new Uint8Array(output.script.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))), value: BigInt(output.value) });
      });
      if (change > TX_CONSTANTS.SRC20_DUST) {
        psbt.addOutput({ script: address.toOutputScript(effectiveChangeAddress, network), value: BigInt(change) });
      }
      const finalTotalInputValue = inputs.reduce((sum: any, input: any) => sum + Number(input.value), 0);
      const finalTotalOutputAmount = outputs.reduce((sum: any, out: any) => sum + out.value, 0) + (change > TX_CONSTANTS.SRC20_DUST ? change : 0);
      const actualFee = finalTotalInputValue - finalTotalOutputAmount;
      // Calculate dust total: only count P2WSH data outputs, not the recipient output
      const finalDustTotal = chunks.length * TX_CONSTANTS.SRC20_DUST;
      const estimatedSize = Math.ceil(actualFee / satsPerVB);

      logger.debug("src20", {
        message: "Transaction details",
        data: {
          finalTotalInputValue,
          finalTotalOutputAmount,
          actualFee,
          finalDustTotal,
          changeAmount: change,
          feeBreakdown: {
            minerFee: actualFee,
            dustValue: finalDustTotal,
            total: actualFee + finalDustTotal
          },
          outputs: outputs.map(o => o.value),
          change,
          inputValues: inputs.map(i => i.value)
        }
      });

      // DEBUG: Log detailed dust calculation
      logger.debug("src20", {
        message: "DUST CALCULATION DEBUG",
        data: {
          totalOutputs: outputs.length,
          outputValues: outputs.map((o, i) => ({ index: i, value: o.value, script: o.script.substring(0, 10) + '...' })),
          chunks: chunks.length,
          SRC20_DUST_CONSTANT: TX_CONSTANTS.SRC20_DUST,
          calculatedDustTotal: finalDustTotal,
          expectedDustTotal: chunks.length * TX_CONSTANTS.SRC20_DUST,
          recipientOutputValue: TX_CONSTANTS.SRC20_DUST,
          dataOutputsOnly: chunks.length * TX_CONSTANTS.SRC20_DUST
        }
      });

      return {
        psbt,
        estimatedTxSize: estimatedSize,
        totalInputValue: finalTotalInputValue,
        totalOutputValue: finalTotalOutputAmount,
        totalChangeOutput: change,
        totalDustValue: finalDustTotal,
        estMinerFee: actualFee,
        feeDetails: {
          baseFee: actualFee,
          ancestorFee: 0,
          effectiveFeeRate: satsPerVB,
          ancestorCount: 0,
          totalVsize: Math.ceil(actualFee / satsPerVB),
          total: actualFee + finalDustTotal,
          minerFee: actualFee,
          dustValue: finalDustTotal,
          totalValue: actualFee + finalDustTotal
        },
        changeAddress: effectiveChangeAddress,
        inputs: inputs.map((input, index) => ({
          index,
          address: (input as any).address || "",
          sighashType: 1
        }))
      };
    } catch (error) {
      logger.error("src20", {
        message: "Error in prepareActionData",
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private static prepareActionData(src20Action: string | object) {
    try {
      // Parse action if it's a string
      const parsedAction = typeof src20Action === "string"
        ? JSON.parse(src20Action)
        : src20Action;

      // Ensure protocol field is uppercase
      const normalizedAction = {
        ...parsedAction,
        p: "SRC-20" // Always use uppercase for protocol
      };

      // First encode the action data as JSON
      const actionString = JSON.stringify(normalizedAction);
      const jsonData = new TextEncoder().encode(actionString);

      // Create the stamp prefix
      const stampPrefix = new TextEncoder().encode(this.STAMP_PREFIX);

      // Combine stamp prefix and JSON data first (without length prefix)
      const dataWithPrefix = new Uint8Array([...stampPrefix, ...jsonData]);

      // Calculate length
      const dataLength = dataWithPrefix.length;

      // Create hex string in correct format for CIP33
      const hex_data = Array.from(dataWithPrefix)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Debug log the exact format
      console.log("Data Format:", {
        stampPrefix: Array.from(stampPrefix).map(b => b.toString(16).padStart(2, '0')).join(''),
        jsonData: Array.from(jsonData).map(b => b.toString(16).padStart(2, '0')).join(''),
        hex_data,
        dataLength,
        stampPrefixLength: stampPrefix.length,
        jsonDataLength: jsonData.length,
        normalizedAction
      });

      // Let CIP33 handle length prefix and chunking
      const cip33Addresses = CIP33.file_to_addresses(hex_data);
      if (!cip33Addresses || cip33Addresses.length === 0) {
        throw new Error("Failed to generate CIP33 addresses");
      }

      return {
        actionData: jsonData,
        finalData: dataWithPrefix,
        hex_data,
        chunks: cip33Addresses
      };
    } catch (error) {
      logger.error("src20", {
        message: "Error in prepareActionData",
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

}
