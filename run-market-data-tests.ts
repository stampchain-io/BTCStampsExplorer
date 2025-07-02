#!/usr/bin/env deno run --allow-env --allow-read

// Simple test runner for market data repository tests
// This avoids the npm module initialization issues

console.log("Market Data Repository Test Suite");
console.log("=================================");

// Set environment variable to skip Redis
Deno.env.set("SKIP_REDIS_CONNECTION", "true");

// Import and run tests
await import("./tests/unit/marketDataRepository.test.ts");

console.log("\nTest run complete!");
