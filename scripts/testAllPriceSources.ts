#!/usr/bin/env deno run --allow-net --allow-env --allow-read

import { BTCPriceService } from "$server/services/price/btcPriceService.ts";

console.log("Testing all BTC price sources...\n");

// Get initial service metrics
const initialMetrics = BTCPriceService.getServiceMetrics();
console.log("Available sources:", initialMetrics.availableSources);
console.log("Total sources configured:", initialMetrics.sources.length);
console.log("Sources:", initialMetrics.sources.join(", "));
console.log("\n" + "=".repeat(80) + "\n");

// Test each source individually
const sources = ["coingecko", "kraken", "coinbase", "bitstamp", "blockchain", "binance"];

for (const source of sources) {
  console.log(`Testing ${source.toUpperCase()}...`);

  try {
    const startTime = Date.now();
    const result = await BTCPriceService.getPrice(source);
    const duration = Date.now() - startTime;

    if (result.source === source || result.source === "cached") {
      console.log(`✅ SUCCESS: $${result.price.toFixed(2)} (${result.source}) - ${duration}ms`);
      if (result.details) {
        console.log(`   Details available: ${Object.keys(result.details).slice(0, 3).join(", ")}...`);
      }
    } else {
      console.log(`⚠️  FALLBACK: Used ${result.source} instead (${duration}ms)`);
      if (result.errors && result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.join("; ")}`);
      }
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }

  // Check circuit breaker status for this source
  const metrics = BTCPriceService.getServiceMetrics();
  const breaker = metrics.circuitBreakers[source];
  if (breaker) {
    console.log(`   Circuit breaker: ${breaker.state} (failures: ${breaker.totalFailures}, successes: ${breaker.totalSuccesses})`);
  }

  console.log("");

  // Small delay between tests
  await new Promise(resolve => setTimeout(resolve, 1000));
}

console.log("\n" + "=".repeat(80) + "\n");

// Test round-robin behavior
console.log("Testing round-robin load distribution (5 requests)...\n");

const sourceCounts: Record<string, number> = {};

for (let i = 0; i < 5; i++) {
  try {
    const result = await BTCPriceService.getPrice();
    const source = result.source;
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    console.log(`Request ${i + 1}: ${source} - $${result.price.toFixed(2)}`);
  } catch (error) {
    console.log(`Request ${i + 1}: ERROR - ${error.message}`);
  }
  await new Promise(resolve => setTimeout(resolve, 500));
}

console.log("\nSource distribution:");
for (const [source, count] of Object.entries(sourceCounts)) {
  console.log(`  ${source}: ${count} requests`);
}

// Final metrics
console.log("\n" + "=".repeat(80) + "\n");
console.log("FINAL METRICS:\n");

const finalMetrics = BTCPriceService.getServiceMetrics();
console.log("Available sources:", finalMetrics.availableSources.join(", "));
console.log("Permanently disabled:", Object.entries(finalMetrics.permanentlyDisabled)
  .filter(([_, disabled]) => disabled)
  .map(([source]) => source)
  .join(", ") || "none");

console.log("\nCircuit breaker summary:");
for (const [source, metrics] of Object.entries(finalMetrics.circuitBreakers)) {
  const health = finalMetrics.healthStatus[source] ? "✅" : "❌";
  const permanent = finalMetrics.permanentlyDisabled[source] ? " (PERMANENTLY DISABLED)" : "";
  console.log(`  ${health} ${source}: ${metrics.state}${permanent} - ${metrics.totalSuccesses}/${metrics.totalRequests} successful`);
}

console.log("\n✨ Test complete!");
