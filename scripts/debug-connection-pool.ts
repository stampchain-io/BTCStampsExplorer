#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * Database Connection Pool Debug Script
 *
 * This script helps debug connection pool issues by:
 * 1. Monitoring connection pool status
 * 2. Testing connection pool under load
 * 3. Providing recovery mechanisms
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read scripts/debug-connection-pool.ts [command]
 *
 * Commands:
 *   status  - Show current connection pool status
 *   reset   - Reset the connection pool
 *   test    - Run connection pool stress test
 *   monitor - Continuously monitor connection pool
 */


const BASE_URL = Deno.env.get("DEV_BASE_URL") || "http://localhost:8000";

async function getConnectionPoolStatus() {
  try {
    const response = await fetch(`${BASE_URL}/api/internal/monitoring?action=database&subaction=status`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get connection pool status:", error);
    return null;
  }
}

async function resetConnectionPool() {
  try {
    const response = await fetch(`${BASE_URL}/api/internal/monitoring?action=database&subaction=reset`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to reset connection pool:", error);
    return null;
  }
}

async function showStatus() {
  console.log("🔍 Checking database connection pool status...\n");

  const status = await getConnectionPoolStatus();
  if (!status) {
    console.log("❌ Failed to get connection pool status");
    return;
  }

  const { connectionPool, health } = status.data;

  console.log("📊 Connection Pool Statistics:");
  console.log(`   Active Connections: ${connectionPool.activeConnections}`);
  console.log(`   Pool Size: ${connectionPool.poolSize}`);
  console.log(`   Max Pool Size: ${connectionPool.maxPoolSize}`);
  console.log(`   Total Connections: ${connectionPool.totalConnections}`);

  console.log("\n🏥 Health Status:");
  console.log(`   Pool Utilization: ${(health.poolUtilization * 100).toFixed(1)}%`);
  console.log(`   Has Available Connections: ${health.hasAvailableConnections ? '✅' : '❌'}`);
  console.log(`   Is Healthy: ${health.isHealthy ? '✅' : '❌'}`);

  if (!health.isHealthy) {
    console.log("\n⚠️  Connection pool appears unhealthy!");
    console.log("   Consider running: deno run scripts/debug-connection-pool.ts reset");
  }
}

async function resetPool() {
  console.log("🔄 Resetting database connection pool...\n");

  const result = await resetConnectionPool();
  if (!result) {
    console.log("❌ Failed to reset connection pool");
    return;
  }

  const { before, after } = result.data;

  console.log("📊 Before Reset:");
  console.log(`   Active: ${before.activeConnections}, Pool: ${before.poolSize}, Total: ${before.totalConnections}`);

  console.log("\n📊 After Reset:");
  console.log(`   Active: ${after.activeConnections}, Pool: ${after.poolSize}, Total: ${after.totalConnections}`);

  console.log("\n✅ Connection pool reset completed!");
}

async function runStressTest() {
  console.log("🧪 Running connection pool stress test...\n");

  const testQueries = Array.from({ length: 20 }, (_, i) =>
    fetch(`${BASE_URL}/api/v2/src20?limit=1&page=${i + 1}`)
  );

  console.log("📊 Before stress test:");
  await showStatus();

  console.log("\n🚀 Running 20 concurrent queries...");
  const startTime = Date.now();

  try {
    const results = await Promise.allSettled(testQueries);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    const duration = Date.now() - startTime;

    console.log(`\n📈 Stress test completed in ${duration}ms:`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}`);

    console.log("\n📊 After stress test:");
    await showStatus();

  } catch (error) {
    console.error("Stress test failed:", error);
  }
}

async function monitorPool() {
  console.log("👁️  Starting continuous connection pool monitoring...");
  console.log("   Press Ctrl+C to stop\n");

  let previousStats: any = null;

  const monitor = async () => {
    const status = await getConnectionPoolStatus();
    if (!status) return;

    const { connectionPool, health } = status.data;
    const timestamp = new Date().toLocaleTimeString();

    // Only log if stats changed or if unhealthy
    const statsChanged = !previousStats ||
      JSON.stringify(connectionPool) !== JSON.stringify(previousStats);

    if (statsChanged || !health.isHealthy) {
      const healthIcon = health.isHealthy ? '✅' : '❌';
      const utilizationColor = health.poolUtilization > 0.8 ? '🔴' :
                              health.poolUtilization > 0.5 ? '🟡' : '🟢';

      console.log(`[${timestamp}] ${healthIcon} Active: ${connectionPool.activeConnections}, Pool: ${connectionPool.poolSize}, Total: ${connectionPool.totalConnections}, Util: ${utilizationColor}${(health.poolUtilization * 100).toFixed(1)}%`);

      if (!health.isHealthy) {
        console.log(`   ⚠️  UNHEALTHY: Pool utilization at ${(health.poolUtilization * 100).toFixed(1)}%`);
      }
    }

    previousStats = connectionPool;
  };

  // Initial check
  await monitor();

  // Monitor every 2 seconds
  const interval = setInterval(monitor, 2000);

  // Handle Ctrl+C
  Deno.addSignalListener("SIGINT", () => {
    clearInterval(interval);
    console.log("\n👋 Monitoring stopped");
    Deno.exit(0);
  });
}

async function main() {
  const command = Deno.args[0] || "status";

  switch (command) {
    case "status":
      await showStatus();
      break;
    case "reset":
      await resetPool();
      break;
    case "test":
      await runStressTest();
      break;
    case "monitor":
      await monitorPool();
      break;
    default:
      console.log("Usage: debug-connection-pool.ts [status|reset|test|monitor]");
      console.log("\nCommands:");
      console.log("  status  - Show current connection pool status");
      console.log("  reset   - Reset the connection pool");
      console.log("  test    - Run connection pool stress test");
      console.log("  monitor - Continuously monitor connection pool");
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
