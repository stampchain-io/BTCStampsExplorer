/**
 * Optimal UTXO Selection Service
 * Implements world-class coin selection algorithms for Bitcoin transactions
 * 
 * Algorithms implemented:
 * 1. Branch and Bound (BnB) - Finds exact matches without change
 * 2. Knapsack Solver - Approximates target amount
 * 3. Single Random Draw (SRD) - Accumulates randomly until target
 * 4. Largest First - Fallback greedy algorithm
 */

import type { UTXO, BasicUTXO as BaseUTXO, Output } from "$lib/types/index.d.ts";
import { logger } from "$lib/utils/logger.ts";

// Extend BasicUTXO to include optional fields we need
interface BasicUTXO extends BaseUTXO {
  address?: string;
  script?: string;
  scriptType?: string;
  scriptDesc?: string;
  confirmations?: number;
}

interface SelectionResult {
  inputs: UTXO[];
  change: number;
  fee: number;
  waste: number; // Cost metric for this selection
  algorithm: string; // Which algorithm was used
}

interface SelectionOptions {
  targetValue: bigint;
  feeRate: number;
  longTermFeeRate?: number; // For waste calculation
  dustThreshold?: number;
  consolidationMode?: boolean; // Prefer using more inputs
  avoidChange?: boolean; // Try to find exact matches
  maxTries?: number; // For random selection
}

export class OptimalUTXOSelection {
  private static readonly MIN_CHANGE = 546; // Dust threshold in satoshis
  private static readonly CHANGE_COST_WEIGHT = 0.5; // How much we value avoiding change
  private static readonly DEFAULT_LONG_TERM_FEE_RATE = 10; // sat/vb for waste calculation
  
  /**
   * Main selection method that tries multiple algorithms
   */
  static selectUTXOs(
    availableUTXOs: BasicUTXO[],
    outputs: Output[],
    feeRate: number,
    options: Partial<SelectionOptions> = {}
  ): SelectionResult {
    // Calculate target value from outputs
    const targetValue = outputs.reduce((sum, out) => sum + BigInt(out.value), BigInt(0));
    
    const selectionOptions: SelectionOptions = {
      targetValue,
      feeRate,
      longTermFeeRate: options.longTermFeeRate || this.DEFAULT_LONG_TERM_FEE_RATE,
      dustThreshold: options.dustThreshold || this.MIN_CHANGE,
      consolidationMode: options.consolidationMode || false,
      avoidChange: options.avoidChange !== false, // Default true
      maxTries: options.maxTries || 1000,
    };

    logger.debug("transaction-utxo-service", {
      message: "Starting UTXO selection",
      availableUTXOs: availableUTXOs.length,
      targetValue: targetValue.toString(),
      feeRate,
      options: selectionOptions
    });

    // Filter out dust UTXOs that would cost more to spend than they're worth
    const spendableUTXOs = this.filterDustUTXOs(availableUTXOs, feeRate);
    
    if (spendableUTXOs.length === 0) {
      throw new Error("No spendable UTXOs available after filtering dust");
    }
    
    logger.debug("transaction-utxo-service", {
      message: "After dust filtering",
      originalCount: availableUTXOs.length,
      spendableCount: spendableUTXOs.length,
      filtered: availableUTXOs.length - spendableUTXOs.length
    });

    // Try algorithms in order of preference
    const algorithms = [
      { name: "Branch and Bound", fn: this.branchAndBound.bind(this) },
      { name: "Knapsack", fn: this.knapsack.bind(this) },
      { name: "Single Random Draw", fn: this.singleRandomDraw.bind(this) },
      { name: "Largest First", fn: this.largestFirst.bind(this) },
    ];

    let bestResult: SelectionResult | null = null;
    let bestWaste = Infinity;

    for (const algo of algorithms) {
      try {
        const result = algo.fn(spendableUTXOs, outputs, selectionOptions);
        
        if (result) {
          // Calculate waste metric for this selection
          const waste = this.calculateWaste(result, selectionOptions);
          result.waste = waste;
          result.algorithm = algo.name;

          logger.debug("transaction-utxo-service", {
            message: `${algo.name} found solution`,
            inputs: result.inputs.length,
            fee: result.fee,
            change: result.change,
            waste
          });

          // Keep best result based on waste metric
          if (waste < bestWaste) {
            bestResult = result;
            bestWaste = waste;
            
            // If we found an exact match (no change), we can stop
            if (result.change === 0 && selectionOptions.avoidChange) {
              break;
            }
          }
        }
      } catch (error) {
        logger.debug("transaction-utxo-service", {
          message: `${algo.name} algorithm failed`,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    if (!bestResult) {
      throw new Error("Failed to find valid UTXO selection");
    }

    logger.info("transaction-utxo-service", {
      message: "UTXO selection complete",
      algorithm: bestResult.algorithm,
      inputs: bestResult.inputs.length,
      totalInputValue: bestResult.inputs.reduce((sum, u) => sum + u.value, 0),
      fee: bestResult.fee,
      change: bestResult.change,
      waste: bestResult.waste
    });

    return bestResult;
  }

  /**
   * Branch and Bound algorithm - finds exact matches without change
   * Based on Bitcoin Core's implementation
   */
  private static branchAndBound(
    utxos: BasicUTXO[],
    outputs: Output[],
    options: SelectionOptions
  ): SelectionResult | null {
    const maxTries = 100000; // Prevent infinite loops
    let tries = 0;
    
    // Sort UTXOs by effective value (value - cost to spend)
    const effectiveUTXOs = utxos.map(utxo => ({
      utxo,
      effectiveValue: BigInt(utxo.value) - this.estimateInputCost(utxo, options.feeRate)
    })).filter(u => u.effectiveValue > 0n)
      .sort((a, b) => Number(b.effectiveValue - a.effectiveValue));

    let bestSelection: BasicUTXO[] | null = null;
    let bestWaste = BigInt(Infinity);

    const search = (
      index: number,
      currentSelection: BasicUTXO[],
      currentValue: bigint,
      currentWaste: bigint
    ): boolean => {
      tries++;
      if (tries > maxTries) return true; // Exceeded tries

      // Calculate fee for current selection
      const currentFee = this.calculateFeeForSelection(currentSelection, outputs, options.feeRate);
      const totalNeeded = options.targetValue + currentFee;

      // If we have enough, check if this is better than our best
      if (currentValue >= totalNeeded) {
        const excess = currentValue - totalNeeded;
        
        // Only consider if excess is 0 (exact match) or above dust
        if (excess === 0n || excess >= BigInt(options.dustThreshold!)) {
          const waste = currentWaste + excess;
          if (waste < bestWaste) {
            bestWaste = waste;
            bestSelection = [...currentSelection];
          }
        }
        
        // Don't explore further if we already have excess
        return excess > 0n;
      }

      // Try remaining UTXOs
      for (let i = index; i < effectiveUTXOs.length; i++) {
        const { utxo, effectiveValue } = effectiveUTXOs[i];
        
        // Skip if adding this would exceed our best waste
        if (currentWaste + effectiveValue > bestWaste) continue;

        // Add this UTXO and continue search
        const shouldPrune = search(
          i + 1,
          [...currentSelection, utxo],
          currentValue + BigInt(utxo.value),
          currentWaste + this.estimateInputCost(utxo, options.feeRate)
        );

        if (shouldPrune) break;
      }

      return false;
    };

    search(0, [], 0n, 0n);

    if (!bestSelection) {
      return null;
    }

    // Convert BasicUTXOs to full UTXOs for the result
    const selectedUTXOs = bestSelection.map(basicUtxo => this.basicToFullUTXO(basicUtxo));
    const totalValue = bestSelection.reduce((sum, u) => sum + BigInt(u.value), 0n);
    const fee = this.calculateFeeForSelection(bestSelection, outputs, options.feeRate);
    const change = Number(totalValue - options.targetValue - fee);

    return {
      inputs: selectedUTXOs,
      change: change < options.dustThreshold! ? 0 : change,
      fee: Number(fee),
      waste: Number(bestWaste),
      algorithm: "Branch and Bound"
    };
  }

  /**
   * Knapsack solver - tries to get close to target amount
   */
  private static knapsack(
    utxos: BasicUTXO[],
    outputs: Output[],
    options: SelectionOptions
  ): SelectionResult | null {
    // Use a target slightly higher than needed to account for fees
    const feeEstimate = this.estimateFeeForInputCount(3, outputs.length, options.feeRate);
    const targetWithFee = options.targetValue + feeEstimate + BigInt(options.dustThreshold! * 2);

    // Sort by value
    const sortedUTXOs = [...utxos].sort((a, b) => b.value - a.value);
    
    // Try to find a subset that gets close to target
    let bestSelection: BasicUTXO[] = [];
    let bestDiff = BigInt(Infinity);

    // Dynamic programming approach
    const n = Math.min(sortedUTXOs.length, 50); // Limit for performance
    const dp: Map<string, BasicUTXO[]> = new Map();
    
    for (let i = 0; i < n; i++) {
      const utxo = sortedUTXOs[i];
      const newEntries: [string, BasicUTXO[]][] = [];
      
      // Try adding this UTXO to all existing combinations
      for (const [sumStr, selection] of dp) {
        const sum = BigInt(sumStr);
        const newSum = sum + BigInt(utxo.value);
        const newSelection = [...selection, utxo];
        
        if (newSum <= targetWithFee * 2n) { // Don't go too far over
          newEntries.push([newSum.toString(), newSelection]);
          
          const diff = newSum >= targetWithFee ? 
            newSum - targetWithFee : targetWithFee - newSum;
          
          if (diff < bestDiff) {
            bestDiff = diff;
            bestSelection = newSelection;
          }
        }
      }
      
      // Add new entries
      for (const entry of newEntries) {
        dp.set(entry[0], entry[1]);
      }
      
      // Also consider just this UTXO
      dp.set(utxo.value.toString(), [utxo]);
      const diff = BigInt(utxo.value) >= targetWithFee ? 
        BigInt(utxo.value) - targetWithFee : targetWithFee - BigInt(utxo.value);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestSelection = [utxo];
      }
    }

    if (bestSelection.length === 0) {
      return null;
    }

    // Calculate actual fee and change
    const selectedUTXOs = bestSelection.map(u => this.basicToFullUTXO(u));
    const totalValue = bestSelection.reduce((sum, u) => sum + BigInt(u.value), 0n);
    const fee = this.calculateFeeForSelection(bestSelection, outputs, options.feeRate);
    
    if (totalValue < options.targetValue + fee) {
      return null; // Insufficient funds
    }

    const change = Number(totalValue - options.targetValue - fee);

    return {
      inputs: selectedUTXOs,
      change: change < options.dustThreshold! ? 0 : change,
      fee: Number(fee),
      waste: 0,
      algorithm: "Knapsack"
    };
  }

  /**
   * Single Random Draw - accumulates random inputs until target
   * Good for privacy as it creates varied input sets
   */
  private static singleRandomDraw(
    utxos: BasicUTXO[],
    outputs: Output[],
    options: SelectionOptions
  ): SelectionResult | null {
    const maxTries = options.maxTries || 1000;
    let bestResult: SelectionResult | null = null;
    let bestWaste = Infinity;

    for (let attempt = 0; attempt < maxTries; attempt++) {
      // Shuffle UTXOs
      const shuffled = [...utxos].sort(() => Math.random() - 0.5);
      const selected: BasicUTXO[] = [];
      let totalValue = 0n;

      for (const utxo of shuffled) {
        selected.push(utxo);
        totalValue += BigInt(utxo.value);

        const fee = this.calculateFeeForSelection(selected, outputs, options.feeRate);
        const totalNeeded = options.targetValue + fee;

        if (totalValue >= totalNeeded) {
          const change = Number(totalValue - totalNeeded);
          
          // Skip if change is dust
          if (change > 0 && change < options.dustThreshold!) {
            continue; // Try adding more inputs
          }

          const selectedUTXOs = selected.map(u => this.basicToFullUTXO(u));
          const result: SelectionResult = {
            inputs: selectedUTXOs,
            change: change < options.dustThreshold! ? 0 : change,
            fee: Number(fee),
            waste: 0,
            algorithm: "Single Random Draw"
          };

          const waste = this.calculateWaste(result, options);
          if (waste < bestWaste) {
            bestWaste = waste;
            bestResult = result;
            bestResult.waste = waste;
          }

          break; // Try next random selection
        }
      }
    }

    return bestResult;
  }

  /**
   * Largest First - simple greedy algorithm (fallback)
   */
  private static largestFirst(
    utxos: BasicUTXO[],
    outputs: Output[],
    options: SelectionOptions
  ): SelectionResult {
    const sorted = [...utxos].sort((a, b) => b.value - a.value);
    const selected: BasicUTXO[] = [];
    let totalValue = 0n;

    for (const utxo of sorted) {
      selected.push(utxo);
      totalValue += BigInt(utxo.value);

      const fee = this.calculateFeeForSelection(selected, outputs, options.feeRate);
      const totalNeeded = options.targetValue + fee;

      if (totalValue >= totalNeeded) {
        const change = Number(totalValue - totalNeeded);
        const selectedUTXOs = selected.map(u => this.basicToFullUTXO(u));

        return {
          inputs: selectedUTXOs,
          change: change < options.dustThreshold! ? 0 : change,
          fee: Number(fee),
          waste: 0,
          algorithm: "Largest First"
        };
      }
    }

    throw new Error("Insufficient funds for transaction");
  }

  /**
   * Calculate waste metric for a selection
   * Waste = inputs cost + change cost + excess
   */
  private static calculateWaste(
    result: SelectionResult,
    options: SelectionOptions
  ): number {
    const longTermFeeRate = options.longTermFeeRate || this.DEFAULT_LONG_TERM_FEE_RATE;
    
    // Cost of spending these inputs in the future
    const inputsCost = result.inputs.reduce((sum, input) => {
      const cost = this.estimateInputCost(input, longTermFeeRate);
      return sum + Number(cost);
    }, 0);

    // Cost of spending the change output in the future
    const changeCost = result.change > 0 ? 
      Number(this.estimateInputCost({ value: result.change } as BasicUTXO, longTermFeeRate)) : 0;

    // Excess is any extra amount paid in fees
    const excess = result.fee - Number(this.calculateFeeForSelection(
      result.inputs,
      [], // outputs not needed for min fee calc
      options.feeRate
    ));

    return inputsCost + changeCost * this.CHANGE_COST_WEIGHT + excess;
  }

  /**
   * Filter out UTXOs that cost more to spend than they're worth
   */
  private static filterDustUTXOs(utxos: BasicUTXO[], feeRate: number): BasicUTXO[] {
    return utxos.filter(utxo => {
      const cost = this.estimateInputCost(utxo, feeRate);
      return BigInt(utxo.value) > cost;
    });
  }

  /**
   * Estimate the cost to spend a UTXO at given fee rate
   */
  private static estimateInputCost(utxo: BasicUTXO, feeRate: number): bigint {
    // Assume P2WPKH (68 vbytes) if script type unknown
    const inputSize = utxo.scriptType ? 
      this.getInputSize(utxo.scriptType) : 68;
    
    return BigInt(Math.ceil(inputSize * feeRate));
  }

  /**
   * Get input size in vbytes for different script types
   */
  private static getInputSize(scriptType: string): number {
    // Normalize to uppercase for comparison
    const normalizedType = scriptType.toUpperCase();
    switch (normalizedType) {
      case "P2PKH": return 148;
      case "P2WPKH": return 68;
      case "P2SH": return 91; // Assuming P2SH-P2WPKH
      case "P2WSH": return 104; // Approximate
      case "P2TR": return 58; // Taproot
      default: return 68; // Default to P2WPKH
    }
  }

  /**
   * Calculate fee for a selection of UTXOs
   */
  private static calculateFeeForSelection(
    inputs: BasicUTXO[],
    outputs: Output[],
    feeRate: number
  ): bigint {
    try {
      // Convert to format expected by calculateMiningFee
      // Simple fee calculation
      // Base transaction overhead (version + locktime)
      let totalWeight = 10 * 4;
      
      // Add input weights
      for (const input of inputs) {
        const inputSize = this.getInputSize(input.scriptType || "P2WPKH");
        const isWitness = (input.scriptType || "P2WPKH").toUpperCase().includes("P2W");
        
        if (isWitness) {
          // For witness inputs: base bytes * 4 + witness bytes * 1
          totalWeight += 41 * 4 + 27 * 1; // Typical P2WPKH
        } else {
          totalWeight += inputSize * 4;
        }
      }
      
      // Add output weights
      // Process outputs
      for (const output of outputs) {
        if ('address' in output && output.address) {
          // Estimate based on address type
          if (output.address.startsWith('bc1')) {
            totalWeight += 31 * 4; // P2WPKH output
          } else if (output.address.startsWith('3')) {
            totalWeight += 32 * 4; // P2SH output
          } else {
            totalWeight += 34 * 4; // P2PKH output
          }
        } else {
          totalWeight += 31 * 4; // Default to P2WPKH
        }
      }
      
      // Add change output
      totalWeight += 31 * 4; // P2WPKH change
      
      // Convert weight to vbytes
      const vbytes = Math.ceil(totalWeight / 4);
      
      return BigInt(Math.ceil(vbytes * feeRate));
    } catch (error) {
      logger.error("transaction-utxo-service", {
        message: "Error calculating fee",
        error: error instanceof Error ? error.message : String(error),
        inputCount: inputs.length,
        outputCount: outputs.length,
        feeRate
      });
      // Fallback to simple calculation
      return this.estimateFeeForInputCount(inputs.length, outputs.length, feeRate);
    }
  }

  /**
   * Estimate fee for a given number of inputs
   */
  private static estimateFeeForInputCount(
    inputCount: number,
    outputCount: number,
    feeRate: number
  ): bigint {
    // Assume P2WPKH inputs (68 vbytes each)
    const baseSize = 10; // Version + locktime
    const inputSize = inputCount * 68;
    const outputSize = outputCount * 31 + 31; // Outputs + change
    const totalSize = baseSize + inputSize + outputSize;
    
    return BigInt(Math.ceil(totalSize * feeRate));
  }

  /**
   * Convert BasicUTXO to full UTXO format
   */
  private static basicToFullUTXO(basic: BasicUTXO): UTXO {
    const scriptType = (basic.scriptType || "P2WPKH").toUpperCase();
    return {
      ...basic,
      script: basic.script || "",
      scriptType: scriptType,
      scriptDesc: basic.scriptDesc || scriptType
    };
  }
}

/**
 * Backward compatibility wrapper for existing code
 */
export function selectOptimalUTXOs(
  utxos: BaseUTXO[],
  outputs: Output[],
  feeRate: number,
  options?: Partial<SelectionOptions>
): SelectionResult {
  return OptimalUTXOSelection.selectUTXOs(utxos as BasicUTXO[], outputs, feeRate, options);
}