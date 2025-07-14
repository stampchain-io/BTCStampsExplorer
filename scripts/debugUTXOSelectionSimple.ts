#!/usr/bin/env -S deno run --allow-read

/**
 * Simple debug script for analyzing UTXO selection behavior with real blockchain data
 * Tests UTXO selection algorithms without importing actual services
 */

import { mintAddressUTXOs, mintTestScenarios, expectedSelections } from "../tests/fixtures/utxoFixtures.mint.ts";

// ANSI color codes for output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

interface UTXO {
  txid: string;
  vout: number;
  value: number;
  script: string;
}

interface UTXOSelectionResult {
  selectedUTXOs: UTXO[];
  totalValue: number;
  estimatedFee: number;
  changeAmount: number;
  transactionSize: number;
}

interface TransactionSizeEstimate {
  baseSize: number;
  inputSize: number;
  outputSize: number;
  totalSize: number;
  totalVBytes: number;
}

/**
 * Estimate transaction size based on inputs and outputs
 * Uses standard sizes for P2WPKH (native segwit) transactions
 */
function estimateTransactionSize(
  numInputs: number,
  numOutputs: number,
  opReturnSize: number = 0
): TransactionSizeEstimate {
  // Base transaction overhead (version + locktime + counts)
  const baseSize = 10.5; // More accurate with varints
  
  // P2WPKH input size calculation
  // Non-witness: 32 (txid) + 4 (vout) + 1 (scriptSig length) + 4 (sequence) = 41 bytes
  // Witness: 1 (item count) + 1 (sig length) + 72 (sig) + 1 (pubkey length) + 33 (pubkey) = 108 bytes
  // Witness weight = 108 / 4 = 27 vbytes
  // Total per input = 41 + 27 = 68 vbytes
  const inputSize = numInputs * 68;
  
  // Output sizes
  const p2wpkhOutputSize = 31; // 8 (value) + 1 (script length) + 22 (script)
  let outputSize = (numOutputs - (opReturnSize > 0 ? 1 : 0)) * p2wpkhOutputSize;
  
  // Add OP_RETURN output if needed
  if (opReturnSize > 0) {
    // 8 (value) + varint (script size) + 1 (OP_RETURN) + varint (data size) + data
    const scriptSize = 1 + (opReturnSize <= 75 ? 1 : 3) + opReturnSize;
    const opReturnOutputSize = 8 + (scriptSize < 253 ? 1 : 3) + scriptSize;
    outputSize += opReturnOutputSize;
  }
  
  const totalSize = Math.ceil(baseSize + inputSize + outputSize);
  
  return {
    baseSize,
    inputSize,
    outputSize,
    totalSize,
    totalVBytes: totalSize,
  };
}

/**
 * Branch and Bound UTXO selection algorithm
 * Tries to find an exact match or minimizes change
 */
function branchAndBoundSelection(
  utxos: UTXO[],
  targetAmount: number,
  feeRate: number,
  opReturnSize: number = 0
): UTXOSelectionResult | null {
  // Sort by value descending for efficiency
  const sortedUTXOs = [...utxos].sort((a, b) => b.value - a.value);
  
  let bestResult: UTXOSelectionResult | null = null;
  let bestWaste = Infinity;
  
  function search(
    index: number,
    selectedUTXOs: UTXO[],
    totalValue: number,
    depth: number = 0
  ): void {
    // Limit search depth to prevent excessive computation
    if (depth > 10 || selectedUTXOs.length > 10) return;
    
    // Calculate fee for current selection
    const sizeEstimate = estimateTransactionSize(
      selectedUTXOs.length,
      2, // OP_RETURN + change
      opReturnSize
    );
    const estimatedFee = Math.ceil(sizeEstimate.totalVBytes * feeRate);
    const totalNeeded = targetAmount + estimatedFee;
    
    // Check if we have enough
    if (totalValue >= totalNeeded) {
      const changeAmount = totalValue - targetAmount - estimatedFee;
      
      // Calculate waste (change that's too small to spend economically)
      let waste = changeAmount;
      if (changeAmount < 546) {
        // Dust - will be added to fee
        waste = changeAmount;
      } else if (changeAmount < 1000) {
        // Small change - expensive to spend later
        waste = changeAmount * 0.5;
      } else {
        // Larger change - still has some waste due to future spending cost
        waste = 68 * feeRate; // Cost to spend this output later
      }
      
      if (waste < bestWaste) {
        bestWaste = waste;
        bestResult = {
          selectedUTXOs: [...selectedUTXOs],
          totalValue,
          estimatedFee: changeAmount < 546 ? estimatedFee + changeAmount : estimatedFee,
          changeAmount: changeAmount < 546 ? 0 : changeAmount,
          transactionSize: sizeEstimate.totalVBytes,
        };
      }
      
      // Don't continue if we found an exact match
      if (changeAmount === 0) return;
    }
    
    // Try remaining UTXOs
    for (let i = index; i < sortedUTXOs.length; i++) {
      const utxo = sortedUTXOs[i];
      
      // Skip if adding this UTXO would exceed our target by too much
      if (bestResult && totalValue + utxo.value > totalNeeded + 10000) continue;
      
      search(
        i + 1,
        [...selectedUTXOs, utxo],
        totalValue + utxo.value,
        depth + 1
      );
    }
  }
  
  search(0, [], 0);
  return bestResult;
}

/**
 * Simple greedy UTXO selection (for comparison)
 * Selects largest UTXOs first
 */
function greedySelection(
  utxos: UTXO[],
  targetAmount: number,
  feeRate: number,
  opReturnSize: number = 0
): UTXOSelectionResult | null {
  // Sort by value descending
  const sortedUTXOs = [...utxos].sort((a, b) => b.value - a.value);
  
  const selectedUTXOs: UTXO[] = [];
  let totalValue = 0;
  
  for (const utxo of sortedUTXOs) {
    selectedUTXOs.push(utxo);
    totalValue += utxo.value;
    
    const sizeEstimate = estimateTransactionSize(
      selectedUTXOs.length,
      2,
      opReturnSize
    );
    
    const estimatedFee = Math.ceil(sizeEstimate.totalVBytes * feeRate);
    const totalNeeded = targetAmount + estimatedFee;
    
    if (totalValue >= totalNeeded) {
      const changeAmount = totalValue - targetAmount - estimatedFee;
      
      return {
        selectedUTXOs,
        totalValue,
        estimatedFee: changeAmount < 546 ? estimatedFee + changeAmount : estimatedFee,
        changeAmount: changeAmount < 546 ? 0 : changeAmount,
        transactionSize: sizeEstimate.totalVBytes,
      };
    }
  }
  
  return null;
}

/**
 * Analyze UTXO selection for a specific scenario
 */
function analyzeScenario(
  scenarioName: string,
  scenario: typeof mintTestScenarios.largeImageMint,
  utxos: UTXO[]
) {
  console.log(`\n${colors.bright}${colors.blue}${"=".repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}=== ${scenarioName.toUpperCase()} ===${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${"=".repeat(60)}${colors.reset}`);
  
  console.log(`\n${colors.cyan}Scenario Parameters:${colors.reset}`);
  console.log(`  Image size: ${colors.yellow}${scenario.imageSize.toLocaleString()}${colors.reset} bytes`);
  console.log(`  Fee rate: ${colors.yellow}${scenario.feeRate}${colors.reset} sat/vb`);
  console.log(`  Expected tx size: ${colors.yellow}~${scenario.expectedTransactionSize.toLocaleString()}${colors.reset} vbytes`);
  console.log(`  Required amount: ${colors.yellow}~${scenario.requiredAmount.toLocaleString()}${colors.reset} sats`);
  
  // Test both algorithms
  const algorithms = [
    { name: "Branch and Bound", fn: branchAndBoundSelection },
    { name: "Greedy (Largest First)", fn: greedySelection },
  ];
  
  for (const algo of algorithms) {
    console.log(`\n${colors.magenta}--- ${algo.name} Algorithm ---${colors.reset}`);
    
    const startTime = performance.now();
    const result = algo.fn(utxos, 0, scenario.feeRate, scenario.imageSize);
    const elapsed = performance.now() - startTime;
    
    if (!result) {
      console.log(`${colors.red}❌ UTXO selection failed - insufficient funds${colors.reset}`);
      continue;
    }
    
    console.log(`${colors.green}✓ Selection successful${colors.reset} (${elapsed.toFixed(2)}ms)`);
    console.log(`\nSelected UTXOs: ${colors.yellow}${result.selectedUTXOs.length}${colors.reset}`);
    result.selectedUTXOs.forEach((utxo, i) => {
      console.log(`  ${i + 1}. ${utxo.txid.substring(0, 16)}... vout: ${utxo.vout} value: ${colors.green}${utxo.value.toLocaleString()}${colors.reset} sats`);
    });
    
    console.log(`\n${colors.cyan}Transaction Summary:${colors.reset}`);
    console.log(`  Total input value: ${colors.green}${result.totalValue.toLocaleString()}${colors.reset} sats`);
    console.log(`  Estimated fee: ${colors.yellow}${result.estimatedFee.toLocaleString()}${colors.reset} sats`);
    console.log(`  Change amount: ${colors.blue}${result.changeAmount.toLocaleString()}${colors.reset} sats`);
    console.log(`  Transaction size: ${colors.magenta}${result.transactionSize}${colors.reset} vbytes`);
    console.log(`  Fee rate achieved: ${colors.yellow}${(result.estimatedFee / result.transactionSize).toFixed(2)}${colors.reset} sat/vb`);
    
    // Efficiency metrics
    const efficiency = ((result.estimatedFee / result.totalValue) * 100).toFixed(2);
    const wastedSats = result.changeAmount < 546 ? result.changeAmount : 0;
    console.log(`\n${colors.cyan}Efficiency Metrics:${colors.reset}`);
    console.log(`  Fee percentage: ${colors.yellow}${efficiency}%${colors.reset} of total input`);
    console.log(`  Wasted sats (dust): ${colors.red}${wastedSats}${colors.reset} sats`);
  }
  
  // Compare with expected results
  const expected = expectedSelections[scenarioName as keyof typeof expectedSelections];
  if (expected) {
    console.log(`\n${colors.bright}${colors.yellow}Expected Results Comparison:${colors.reset}`);
    console.log(`  Expected UTXOs: ${expected.selectedUTXOs.length}`);
    console.log(`  Expected fee: ${expected.estimatedFee.toLocaleString()} sats`);
    console.log(`  Expected change: ${expected.changeAmount.toLocaleString()} sats`);
  }
}

/**
 * Main debug function
 */
function main() {
  console.log(`${colors.bright}${colors.cyan}UTXO Selection Debug Analysis${colors.reset}`);
  console.log(`${colors.cyan}${"=".repeat(60)}${colors.reset}\n`);
  
  // Display available UTXOs
  console.log(`${colors.bright}Available UTXOs for address:${colors.reset}`);
  console.log(`${colors.blue}${mintAddressUTXOs.address}${colors.reset}`);
  console.log(`\nTotal balance: ${colors.green}${mintAddressUTXOs.total_balance.toLocaleString()}${colors.reset} sats\n`);
  
  const headers = ["#", "Transaction ID", "Output", "Value (sats)", "Confirmations"];
  const colWidths = [3, 20, 6, 15, 13];
  
  // Print header
  headers.forEach((header, i) => {
    process.stdout.write(header.padEnd(colWidths[i]));
  });
  console.log();
  console.log("-".repeat(colWidths.reduce((a, b) => a + b, 0)));
  
  // Print UTXOs
  mintAddressUTXOs.utxos.forEach((utxo, i) => {
    const row = [
      (i + 1).toString(),
      utxo.txid.substring(0, 16) + "...",
      utxo.vout.toString(),
      utxo.value.toLocaleString(),
      utxo.confirmations.toLocaleString(),
    ];
    
    row.forEach((cell, j) => {
      process.stdout.write(cell.padEnd(colWidths[j]));
    });
    console.log();
  });
  
  // Convert fixture UTXOs to UTXO type
  const utxos: UTXO[] = mintAddressUTXOs.utxos.map(u => ({
    txid: u.txid,
    vout: u.vout,
    value: u.value,
    script: u.script,
  }));
  
  // Test each scenario
  analyzeScenario("largeImageMint", mintTestScenarios.largeImageMint, utxos);
  analyzeScenario("smallStampMint", mintTestScenarios.smallStampMint, utxos);
  analyzeScenario("highFeeMint", mintTestScenarios.highFeeMint, utxos);
  
  // Summary
  console.log(`\n${colors.bright}${colors.green}${"=".repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.green}Debug analysis complete!${colors.reset}`);
  console.log(`${colors.bright}${colors.green}${"=".repeat(60)}${colors.reset}\n`);
  
  // Recommendations
  console.log(`${colors.bright}${colors.yellow}Recommendations:${colors.reset}`);
  console.log("1. Branch and Bound algorithm provides more optimal UTXO selection");
  console.log("2. Consider implementing coin control for better fee optimization");
  console.log("3. Monitor for dust outputs that increase future transaction costs");
  console.log("4. For large OP_RETURN data, consider chunking across multiple transactions\n");
}

// Run the debug script
if (import.meta.main) {
  main();
}