import type { Output, UTXO } from "$types/index.d.ts";
import { getUTXOForAddress } from "$lib/utils/utxoUtils.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import * as bitcoin from "bitcoinjs-lib";

export class UTXOService {
  private static readonly CHANGE_DUST = 1000;

  private static isP2PKH(script: string): boolean {
    return /^76a914[a-fA-F0-9]{40}88ac$/.test(script);
  }

  private static isP2SH(script: string): boolean {
    return /^a914[a-fA-F0-9]{40}87$/.test(script);
  }

  private static isP2WPKH(script: string): boolean {
    return /^0014[a-fA-F0-9]{40}$/.test(script);
  }

  private static isP2WSH(script: string): boolean {
    return /^0020[a-fA-F0-9]{64}$/.test(script);
  }

  private static isP2TR(script: string): boolean {
    return /^5120[a-fA-F0-9]{64}$/.test(script);
  }

  private static calculateSizeP2WPKH(script: string): number {
    const baseInputSize = 32 + 4 + 4 + 1;
    const witnessSize = 1 + 72 + 1 + 33;
    const witnessWeight = witnessSize * 0.25;
    return Math.floor(baseInputSize + witnessWeight) + 1;
  }

  static estimateInputSize(script: string): number {
    let scriptSigSize = 0;
    if (this.isP2PKH(script)) {
      scriptSigSize = 108;
    } else if (this.isP2SH(script)) {
      scriptSigSize = 260;
    } else if (this.isP2WPKH(script)) {
      scriptSigSize = this.calculateSizeP2WPKH(script);
    } else if (this.isP2TR(script)) {
      scriptSigSize = 65;
    }

    const txidSize = 32;
    const voutSize = 4;
    const sequenceSize = 4;

    return txidSize + voutSize + sequenceSize + scriptSigSize;
  }

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
  ): Promise<{
    inputs: UTXO[];
    change: number;
    fee: number;
  }> {
    let utxos = await getUTXOForAddress(address) as UTXO[];
    if (!utxos || utxos.length === 0) {
      throw new Error("No UTXOs found for the given address");
    }

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

    if (!utxos || utxos.length === 0) {
      throw new Error(
        "No UTXOs available for transaction after excluding stamps UTXOs",
      );
    }

    return this.selectUTXOs(utxos, vouts, feeRate, sigops_rate, rbfBuffer);
  }

  private static selectUTXOs(
    utxos: UTXO[],
    vouts: Output[],
    feeRate: number,
    sigops_rate: number,
    rbfBuffer: number,
  ) {
    // Copy implementation from server/utils/transactions/utxoSelector.ts
    const totalOutputValue = vouts.reduce((sum, vout) => sum + vout.value, 0);
    let totalInputValue = 0;
    const selectedInputs: UTXO[] = [];

    // Sort UTXOs by value in descending order
    utxos.sort((a, b) => b.value - a.value);

    for (const utxo of utxos) {
      selectedInputs.push(utxo);
      totalInputValue += utxo.value;

      // Calculate current fee
      const currentFee = Math.ceil(
        (selectedInputs.length * 180 + vouts.length * 34 + 10) * feeRate,
      );

      // Check if we have enough to cover outputs and fees
      if (totalInputValue >= totalOutputValue + currentFee) {
        const change = totalInputValue - totalOutputValue - currentFee;
        if (change >= this.CHANGE_DUST || change === 0) {
          return {
            inputs: selectedInputs,
            change: change >= this.CHANGE_DUST ? change : 0,
            fee: currentFee,
          };
        }
      }
    }

    throw new Error("Insufficient funds to cover outputs and fees");
  }
}
