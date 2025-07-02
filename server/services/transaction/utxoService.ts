import type { Output, UTXO, AncestorInfo, BasicUTXO } from "$types/index.d.ts";
import { CommonUTXOService } from "$server/services/utxo/commonUtxoService.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import * as bitcoin from "bitcoinjs-lib";
import { calculateMiningFee } from "$lib/utils/minting/feeCalculations.ts";
import { 
  getScriptTypeInfo 
} from "$lib/utils/scriptTypeUtils.ts";
import { TX_CONSTANTS } from "$lib/utils/minting/constants.ts";
import { logger } from "$lib/utils/logger.ts";

export class UTXOService {
  private static readonly CHANGE_DUST = 1000;

  private commonUtxoService: CommonUTXOService;

  constructor() {
    this.commonUtxoService = new CommonUTXOService();
  }

  async getAddressUTXOs(
    address: string,
    options: { 
      includeAncestors?: boolean;
      filterStampUTXOs?: boolean;
      excludeUtxos?: Array<{ txid: string; vout: number }>;
    } = {}
  ): Promise<BasicUTXO[]> {
    logger.debug("transaction-utxo-service", { 
      message: "getAddressUTXOs called for basic UTXO list", 
      address, 
      options 
    });

    let basicUtxos = await this.commonUtxoService.getSpendableUTXOs(address, undefined, {
      includeAncestorDetails: options.includeAncestors,
      confirmedOnly: undefined
    });

    if (options.excludeUtxos && options.excludeUtxos.length > 0) {
      const excludeSet = new Set(options.excludeUtxos.map(u => `${u.txid}:${u.vout}`));
      const originalCount = basicUtxos.length;
      basicUtxos = basicUtxos.filter(utxo => !excludeSet.has(`${utxo.txid}:${utxo.vout}`));
      logger.debug("transaction-utxo-service", {
        message: "Filtered excluded UTXOs",
        address,
        excludedCount: originalCount - basicUtxos.length,
        exclusionListSize: excludeSet.size
      });
    }

    if (options.filterStampUTXOs) {
      try {
        logger.debug("transaction-utxo-service", { message: "Filtering stamp UTXOs from basic list", address });
        const stampBalances = await XcpManager.getXcpBalancesByAddress(
          address,
          undefined,
          true,
        );

        const utxosToExcludeFromStamps = new Set<string>();
        for (const balance of stampBalances.balances) {
          if (balance.utxo) {
            utxosToExcludeFromStamps.add(balance.utxo);
          }
        }
        const preStampFilterCount = basicUtxos.length;
        basicUtxos = basicUtxos.filter(
          (utxo) => !utxosToExcludeFromStamps.has(`${utxo.txid}:${utxo.vout}`),
        );
        logger.info("transaction-utxo-service", { 
          message: "Filtered stamp UTXOs from basic list", 
          address, 
          stampUtxosExcluded: preStampFilterCount - basicUtxos.length, 
          remainingCount: basicUtxos.length 
        });
      } catch (error) {
        logger.error("transaction-utxo-service", { 
          message: "Error fetching stamps balance for UTXO exclusion (from basic list)", 
          address, 
          error: error.message 
        });
      }
    }
    return basicUtxos;
  }

  static estimateVoutSize(output: Output): number {
    let scriptSize = 0;
    if (output.script) {
      scriptSize = output.script.length / 2;
    } else if (output.address) {
      try {
        const outputScript = bitcoin.address.toOutputScript(output.address, bitcoin.networks.bitcoin);
        scriptSize = outputScript.length;
      } catch (e) { 
        logger.warn("transaction-utxo-service", { message: "Could not determine script size for address", address: output.address, error: e.message });
        scriptSize = 34;
      }
    }
    return 8 + 1 + scriptSize;
  }

  async selectUTXOsForTransaction(
    address: string,
    vouts: Output[],
    feeRate: number,
    _sigops_rate = 0,
    _rbfBuffer = 1.5,
    options: {
      filterStampUTXOs?: boolean;
      includeAncestors?: boolean;
      excludeUtxos?: Array<{ txid: string; vout: number }>;
    } = {}
  ): Promise<{
    inputs: UTXO[];
    change: number;
    fee: number;
  }> {
    logger.debug("transaction-utxo-service", {
      message: "selectUTXOsForTransaction called",
      address,
      voutsCount: vouts.length,
      feeRate,
      options
    });

    const basicUtxos = await this.getAddressUTXOs(address, {
      includeAncestors: options.includeAncestors,
      filterStampUTXOs: options.filterStampUTXOs,
      excludeUtxos: options.excludeUtxos,
    });

    if (!basicUtxos || basicUtxos.length === 0) {
      logger.warn("transaction-utxo-service", { message: "No basic UTXOs available for transaction after fetching/filtering", address, optionsReceived: options });
      throw new Error("No UTXOs available for transaction after filtering (selectUTXOsForTransaction entry)");
    }

    return this.selectUTXOsLogic(basicUtxos, vouts, feeRate, !!options.includeAncestors);
  }

  private async selectUTXOsLogic(
    basicUtxos: BasicUTXO[],
    vouts: Output[],
    feeRate: number,
    fetchFullDetails: boolean,
  ): Promise<{
    inputs: UTXO[];
    change: number;
    fee: number;
  }> {
    const totalOutputValue = vouts.reduce((sum, vout) => 
      BigInt(sum) + BigInt(vout.value), BigInt(0));
    let totalInputValue = BigInt(0);
    const selectedInputs: UTXO[] = [];

    const sortedBasicUtxos = [...basicUtxos].sort((a, b) => Number(BigInt(b.value) - BigInt(a.value)));

    try {
      for (const basicUtxo of sortedBasicUtxos) {
        let utxoToProcess: UTXO;

        if (fetchFullDetails) {
          console.log(`[UTXOService.selectUTXOsLogic] Fetching full details for buyer UTXO: ${basicUtxo.txid}:${basicUtxo.vout}`);
          const fullUtxo = await this.commonUtxoService.getSpecificUTXO(
            basicUtxo.txid,
            basicUtxo.vout,
            { includeAncestorDetails: true, confirmedOnly: undefined }
          );
          if (!fullUtxo || !fullUtxo.script) {
            logger.warn("transaction-utxo-service", { message: "Failed to fetch full details for UTXO in selectUTXOsLogic, skipping.", txid: basicUtxo.txid, vout: basicUtxo.vout });
            continue; 
          }
          console.log(`[UTXOService.selectUTXOsLogic] For buyer UTXO ${basicUtxo.txid}:${basicUtxo.vout}, fetched fullUtxo.script (hex): ${fullUtxo.script}`);
          utxoToProcess = fullUtxo;
        } else {
          utxoToProcess = {
            ...basicUtxo,
            script: "assumed_for_estimation",
            scriptType: "P2WPKH",
            scriptDesc: "assumed P2WPKH for estimation",
          };
        }
        
        selectedInputs.push(utxoToProcess);
        totalInputValue += BigInt(utxoToProcess.value);
  
        const currentFee = BigInt(calculateMiningFee(
          selectedInputs.map(input => {
            let scriptTypeForFeeCalc: string;
            let scriptForFeeCalc: string | undefined = input.script;
            let ancestorForFeeCalc: AncestorInfo | undefined = input.ancestor;

            if (!fetchFullDetails) {
              scriptTypeForFeeCalc = "P2WPKH";
              ancestorForFeeCalc = undefined;
              return {
                type: "P2WPKH" as ScriptType,
                size: TX_CONSTANTS.P2WPKH.size,
                isWitness: true,
                ancestor: ancestorForFeeCalc 
              };
            } else {
              if (!scriptForFeeCalc) throw new Error(`Script missing for selected input ${input.txid}:${input.vout} in final calculation`);
              const actualScriptTypeInfo = getScriptTypeInfo(scriptForFeeCalc);
              return {
                type: actualScriptTypeInfo.type as ScriptType,
                size: actualScriptTypeInfo.size,
                isWitness: actualScriptTypeInfo.isWitness,
                ancestor: ancestorForFeeCalc
              };
            }
          }),
          vouts.map(output => {
            let scriptTypeInfo;
            if (output.script) {
                scriptTypeInfo = getScriptTypeInfo(output.script);
            } else if (output.address) {
                scriptTypeInfo = getScriptTypeInfo(bitcoin.address.toOutputScript(output.address, bitcoin.networks.bitcoin));
            } else {
                logger.warn("transaction-utxo-service", {message: "Output missing script/address for fee calc, defaulting P2WPKH"});
                scriptTypeInfo = { type: "P2WPKH", size: TX_CONSTANTS.P2WPKH.size, isWitness: true }; 
            }
            return {
              type: scriptTypeInfo.type as ScriptType,
              size: scriptTypeInfo.size,
              isWitness: scriptTypeInfo.isWitness,
              value: Number(output.value) 
            };
          }),
          feeRate,
          {
            includeChangeOutput: true,
            changeOutputType: "P2WPKH" 
          }
        ));
  
        if (totalInputValue >= totalOutputValue + currentFee) {
          const change = totalInputValue - totalOutputValue - currentFee;
          const changeDust = BigInt(UTXOService.CHANGE_DUST); 
          
          if (change >= changeDust || change === BigInt(0)) {
            logger.info("transaction-utxo-service", { message: "UTXO selection successful", inputsSelected: selectedInputs.length, totalInputValue: totalInputValue.toString(), totalOutputValue: totalOutputValue.toString(), fee: currentFee.toString(), change: change.toString(), fetchFullDetails });
            return {
              inputs: selectedInputs, 
              change: change >= changeDust ? Number(change) : 0,
              fee: Number(currentFee),
            };
          }
        }
      }
  
      logger.warn("transaction-utxo-service", { message: "Insufficient funds to cover outputs and fees after processing all UTXOs", address: basicUtxos[0]?.address, fetchFullDetails });
      throw new Error("Insufficient funds to cover outputs and fees");
    } catch (error) {
      logger.error("transaction-utxo-service", { message: "Error in selectUTXOsLogic", error: error.message, stack: error.stack, fetchFullDetails });
      throw error;
    }
  }
}
