import type { Output, UTXO } from "$types/index.d.ts";
import { getUTXOForAddress } from "$lib/utils/utxoUtils.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import * as bitcoin from "bitcoinjs-lib";
import { calculateMiningFee } from "$lib/utils/minting/feeCalculations.ts";
import { PSBTService } from "$server/services/transaction/psbtService.ts";
import { 
  isP2PKH, 
  isP2SH, 
  isP2WPKH, 
  isP2TR, 
  isP2WSH,
  getScriptTypeInfo 
} from "$lib/utils/scriptTypeUtils.ts";
import { TX_CONSTANTS } from "$lib/utils/minting/constants.ts";


export class UTXOService {
  private static readonly CHANGE_DUST = 1000;

  static estimateVoutSize(output: Output): number {
    let scriptSize = 0;

    if (output.script) {
      scriptSize = output.script.length / 2;
    } else if (output.address) {
      if (bitcoin.address.toOutputScript(output.address).length === 25) {
        scriptSize = 25;
      } else if (bitcoin.address.toOutputScript(output.address).length === 22) {
        scriptSize = 22;
      } else {
        scriptSize = 34;
      }
    }

    return 8 + 1 + scriptSize;
  }

  static async selectUTXOsForTransaction(
    address: string,
    vouts: Output[],
    feeRate: number,
    sigops_rate = 0,
    rbfBuffer = 1.5,
    options = { 
      filterStampUTXOs: true,    // Default to filtering stamp UTXOs
      includeAncestors: false    // Default to not including ancestors
    }
  ): Promise<{
    inputs: UTXO[];
    change: number;
    fee: number;
  }> {
    // Get UTXOs with ancestor information if requested
    let utxos = await getUTXOForAddress(
      address, 
      undefined, 
      undefined, 
      options.includeAncestors
    ) as UTXO[];

    if (!utxos || utxos.length === 0) {
      throw new Error("No UTXOs found for the given address");
    }

    // Filter stamp UTXOs if requested
    if (options.filterStampUTXOs) {
      try {
        const stampBalances = await XcpManager.getXcpBalancesByAddress(
          address,
          undefined,
          true,
        );

        const utxosToExclude = new Set<string>();
        for (const balance of stampBalances) {
          if (balance.utxo) {
            utxosToExclude.add(balance.utxo);
          }
        }

        utxos = utxos.filter(
          (utxo) => !utxosToExclude.has(`${utxo.txid}:${utxo.vout}`),
        );

        console.log(`Excluded ${utxosToExclude.size} UTXOs from stamps balance`);
      } catch (error) {
        console.error("Error fetching stamps balance:", error);
        throw new Error("Failed to fetch stamps balance for UTXO exclusion");
      }
    }

    if (!utxos || utxos.length === 0) {
      throw new Error(
        "No UTXOs available for transaction after filtering",
      );
    }

    return this.selectUTXOs(utxos, vouts, feeRate, sigops_rate, rbfBuffer);
  }

  private static async selectUTXOs(
    utxos: UTXO[],
    vouts: Output[],
    feeRate: number,
    sigops_rate: number,
    rbfBuffer: number,
  ) {
    // Convert values to BigInt at the start
    const totalOutputValue = vouts.reduce((sum, vout) => 
      BigInt(sum) + BigInt(vout.value), BigInt(0));
    let totalInputValue = BigInt(0);
    const selectedInputs: Array<UTXO & { ancestor?: AncestorInfo }> = [];

    // Sort UTXOs by effective value
    const utxosWithValues = utxos.map(utxo => ({
      ...utxo,
      effectiveValue: BigInt(utxo.value) - BigInt(utxo.ancestor?.fees || 0)
    }));

    // Sort using BigInt comparison
    utxosWithValues.sort((a, b) => 
      Number(b.effectiveValue - a.effectiveValue)); // Convert back to number for sort comparison

    for (const utxo of utxosWithValues) {
      selectedInputs.push(utxo);
      totalInputValue += BigInt(utxo.value);

      // Calculate current fee with proper script type detection
      const currentFee = BigInt(calculateMiningFee(
        selectedInputs.map(input => {
          const scriptType = getScriptTypeInfo(input.script);
          return {
            type: scriptType.type,
            size: scriptType.size,
            isWitness: scriptType.isWitness,
            ancestor: input.ancestor
          };
        }),
        vouts.map(output => {
          const scriptType = output.script ? 
            getScriptTypeInfo(output.script) : 
            { type: "P2WPKH", size: TX_CONSTANTS.P2WPKH.size, isWitness: true };
          return {
            type: scriptType.type,
            size: scriptType.size,
            isWitness: scriptType.isWitness,
            value: Number(output.value) // Keep as number for fee calculation
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
        const changeDust = BigInt(this.CHANGE_DUST);
        
        if (change >= changeDust || change === BigInt(0)) {
          return {
            inputs: selectedInputs,
            change: change >= changeDust ? Number(change) : 0, // Convert back to number
            fee: Number(currentFee), // Convert back to number
          };
        }
      }
    }

    throw new Error("Insufficient funds to cover outputs and fees");
  }

  private static isWitnessInput(script: string): boolean {
    const scriptType = getScriptTypeInfo(script);
    return scriptType.isWitness;
  }

  private static isWitnessOutput(output: Output): boolean {
    if (output.script) {
      return this.isWitnessInput(output.script);
    }
    // For address-based outputs, check if it's a bech32 address
    return output.address?.startsWith('bc1') || false;
  }
}
