#!/usr/bin/env -S deno run --allow-env --allow-read --allow-net

/**
 * Test script for the new optimal UTXO selection implementation
 */

import { OptimalUTXOSelection } from "../server/services/utxo/optimalUtxoSelection.ts";
import { mintAddressUTXOs } from "../tests/fixtures/utxoFixtures.mint.ts";
import type { BasicUTXO, Output } from "../lib/types/index.d.ts";
import { logger } from "../lib/utils/logger.ts";

// Set up logging
Deno.env.set("LOG_LEVEL", "DEBUG");

console.log("=== Testing Optimal UTXO Selection ===\n");

// Convert fixture UTXOs to BasicUTXO format
const basicUTXOs: BasicUTXO[] = mintAddressUTXOs.utxos.map(utxo => ({
  txid: utxo.txid,
  vout: utxo.vout,
  value: utxo.value,
  address: utxo.address,
  script: utxo.script,
  scriptType: utxo.scriptType || "p2wpkh",
  confirmations: utxo.confirmations,
}));

console.log(`Available UTXOs: ${basicUTXOs.length}`);
console.log(`Total balance: ${mintAddressUTXOs.total_balance} sats\n`);

// Test scenarios
const scenarios = [
  {
    name: "31KB Stamp Mint (Original Problem)",
    opReturnSize: 31 * 1024, // 31KB
    feeRate: 1.1, // 1.1 sat/vb
    serviceFee: 50000, // Service fee
    dustOutputs: 5, // CIP33 data outputs
  },
  {
    name: "Small Stamp Mint",
    opReturnSize: 5 * 1024, // 5KB
    feeRate: 1.5,
    serviceFee: 30000,
    dustOutputs: 2,
  },
  {
    name: "High Fee Rate Scenario",
    opReturnSize: 10 * 1024, // 10KB
    feeRate: 5.0, // 5 sat/vb
    serviceFee: 50000,
    dustOutputs: 3,
  },
];

for (const scenario of scenarios) {
  console.log(`\n--- ${scenario.name} ---`);
  
  // Create outputs for the scenario
  const outputs: Output[] = [];
  
  // OP_RETURN output (doesn't have value but affects size)
  // Note: We don't include the actual OP_RETURN in the outputs for UTXO selection
  // because it has 0 value and the fee calculation should handle its size separately
  
  // Dust outputs for CIP33 data
  for (let i = 0; i < scenario.dustOutputs; i++) {
    outputs.push({
      value: 546, // Dust threshold
      address: "bc1qnpszanef2ed9yxtqndvyxy72tdmnks6m28rn3d", // P2WPKH
    });
  }
  
  // Service fee output
  if (scenario.serviceFee > 0) {
    outputs.push({
      value: scenario.serviceFee,
      address: "bc1qservicefeeaddressexample", // Service fee address
    });
  }
  
  const totalOutputValue = outputs.reduce((sum, out) => sum + out.value, 0);
  console.log(`Total output value: ${totalOutputValue} sats`);
  
  try {
    const selection = OptimalUTXOSelection.selectUTXOs(
      basicUTXOs,
      outputs,
      scenario.feeRate,
      {
        avoidChange: true,
        consolidationMode: false,
        dustThreshold: 546,
      }
    );
    
    console.log(`\nSelection Result:`);
    console.log(`  Algorithm: ${selection.algorithm}`);
    console.log(`  Inputs selected: ${selection.inputs.length}`);
    console.log(`  Total input value: ${selection.inputs.reduce((sum, u) => sum + u.value, 0)} sats`);
    console.log(`  Fee: ${selection.fee} sats`);
    console.log(`  Change: ${selection.change} sats`);
    console.log(`  Waste metric: ${selection.waste}`);
    console.log(`  Fee rate achieved: ${(selection.fee / (scenario.opReturnSize + 200)).toFixed(2)} sat/vb`);
    
    // Show selected UTXOs
    console.log(`  Selected UTXOs:`);
    for (const input of selection.inputs) {
      console.log(`    - ${input.txid}:${input.vout} (${input.value} sats)`);
    }
    
  } catch (error) {
    console.error(`  ERROR: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log("\n=== Test Complete ===");