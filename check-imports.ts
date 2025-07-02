#!/usr/bin/env deno run --allow-env --allow-read

// Check if imports work correctly
console.log("Checking imports...");

try {
  // Skip Redis connection for imports
  (globalThis as any).SKIP_REDIS_CONNECTION = true;
  Deno.env.set("SKIP_REDIS_CONNECTION", "true");

  console.log("1. Importing market data types...");
  const types = await import("./lib/types/marketData.d.ts");
  console.log("✓ Types imported successfully");

  console.log("2. Importing market data utils...");
  const utils = await import("./lib/utils/marketData.ts");
  console.log("✓ Utils imported successfully");

  console.log("3. Importing database manager...");
  const dbManagerModule = await import("./server/database/databaseManager.ts");
  console.log("✓ Database manager imported successfully");

  console.log("4. Importing market data repository...");
  const repoModule = await import("./server/database/marketDataRepository.ts");
  console.log("✓ Market data repository imported successfully");

  console.log("\nAll imports successful! ✅");

  // Check if the repository has all required methods
  const { MarketDataRepository } = repoModule;
  const methods = [
    "getStampMarketData",
    "getStampsWithMarketData",
    "getSRC20MarketData",
    "getCollectionMarketData",
    "getStampHoldersFromCache",
    "getBulkStampMarketData",
  ];

  console.log("\nChecking repository methods:");
  for (const method of methods) {
    if (typeof MarketDataRepository[method] === "function") {
      console.log(`✓ ${method} exists`);
    } else {
      console.log(`✗ ${method} missing!`);
    }
  }
} catch (error) {
  console.error("Import error:", error);
  Deno.exit(1);
}

console.log("\nImport check complete!");
