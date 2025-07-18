#!/usr/bin/env deno run --allow-net --allow-env --allow-read

import { BTCPriceService } from "../server/services/price/btcPriceService.ts";

console.log("Testing BTC Price Service with permanent disabling...\n");

// Get initial service metrics
console.log("Initial service metrics:");
const initialMetrics = BTCPriceService.getServiceMetrics();
console.log("Available sources:", initialMetrics.availableSources);
console.log("Permanently disabled:", initialMetrics.permanentlyDisabled);
console.log("");

// Fetch price multiple times to see behavior
for (let i = 0; i < 5; i++) {
  console.log(`\n--- Attempt ${i + 1} ---`);
  try {
    const result = await BTCPriceService.getPrice();
    console.log(`Price: $${result.price} from ${result.source}`);
    
    // Show circuit breaker states
    const metrics = BTCPriceService.getServiceMetrics();
    console.log("\nCircuit breaker states:");
    for (const [source, state] of Object.entries(metrics.circuitBreakers)) {
      console.log(`  ${source}: ${state.state} (failures: ${state.failures}, total: ${state.totalFailures})`);
    }
    console.log("Available sources:", metrics.availableSources);
    console.log("Permanently disabled:", metrics.permanentlyDisabled);
  } catch (error) {
    console.error("Error:", error.message);
  }
  
  // Wait a bit between attempts
  await new Promise(resolve => setTimeout(resolve, 2000));
}

console.log("\n\nFinal service metrics:");
const finalMetrics = BTCPriceService.getServiceMetrics();
console.log("Available sources:", finalMetrics.availableSources);
console.log("Permanently disabled:", finalMetrics.permanentlyDisabled);
console.log("\nDetailed circuit breaker states:");
for (const [source, state] of Object.entries(finalMetrics.circuitBreakers)) {
  console.log(`\n${source}:`);
  console.log(`  State: ${state.state}`);
  console.log(`  Total requests: ${state.totalRequests}`);
  console.log(`  Total failures: ${state.totalFailures}`);
  console.log(`  Total successes: ${state.totalSuccesses}`);
}