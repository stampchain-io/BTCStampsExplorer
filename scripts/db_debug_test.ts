import { load } from "jsr:/@std/dotenv@^0.225.2";
import { Client } from "mysql/mod.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { SRC20Repository } from "$server/database/src20Repository.ts";

// Load environment variables first
await load({ export: true });

// Skip Redis for debug tests
(globalThis as any).SKIP_REDIS_CONNECTION = true;

// Validate environment variables
const DB_CONFIG = {
  hostname: Deno.env.get("DB_HOST"),
  username: Deno.env.get("DB_USER"),
  password: Deno.env.get("DB_PASSWORD"),
  db: Deno.env.get("DB_NAME") || "btc_stamps",
  port: Number(Deno.env.get("DB_PORT")),
  maxRetries: Number(Deno.env.get("DB_MAX_RETRIES")) || 5,
};

// Validate required environment variables
function validateConfig() {
  const required = ["hostname", "username", "password", "port"];
  const missing = required.filter((key) =>
    !DB_CONFIG[key as keyof typeof DB_CONFIG]
  );

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => {
      const envKey = key.toUpperCase();
      console.error(`- DB_${envKey} (${key})`);
    });
    console.error("\nPlease check your .env file");
    Deno.exit(1);
  }
}

async function testDatabaseConnection() {
  const client = new Client();

  try {
    console.log("\n=== Testing Database Connection ===");
    console.log("Connecting with configuration:", {
      host: DB_CONFIG.hostname,
      user: DB_CONFIG.username,
      database: DB_CONFIG.db,
      port: DB_CONFIG.port,
      maxRetries: DB_CONFIG.maxRetries,
      // password omitted for security
    });

    // Get a client from the database manager
    const dbClient = await dbManager.getClient();
    console.log("✅ Basic connection successful");

    // Test connection with simple query
    const [result] = await dbClient.execute("SELECT 1");
    if (result) {
      console.log("✅ Query execution successful");

      // Test SRC20 table access
      const [tables] = await dbClient.execute(
        "SHOW TABLES LIKE 'src20_transactions'",
      );
      console.log("✅ SRC20 table check:", tables ? "Found" : "Not found");
    }

    // Release the client back to the pool
    dbManager.releaseClient(dbClient);
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error("Error:", error.message);
    console.error("\nTroubleshooting steps:");
    console.error("1. Check .env file configuration");
    console.error("2. Verify database server is running");
    console.error("3. Check network connectivity");
    console.error("4. Verify user permissions");

    console.log("\nCurrent configuration:");
    console.log({
      host: DB_CONFIG.hostname,
      user: DB_CONFIG.username,
      database: DB_CONFIG.db,
      port: DB_CONFIG.port,
      maxRetries: DB_CONFIG.maxRetries,
    });
  }
}

async function testLuffyBalance() {
  console.log("\n=== Testing Luffy Balance Query ===");

  try {
    // Test with known failing tick
    console.log("\nTesting with 'luffy' tick:");
    const luffyResult = await SRC20Repository.getSrc20BalanceFromDb({
      address: "bc1qay74nc2djs2g5acqp72eyvlqp3ku7sj97jft8y",
      tick: "luffy",
      includePagination: true,
    });
    console.log("Luffy result:", luffyResult);

    // Test with no tick (known working case):");
    const noTickResult = await SRC20Repository.getSrc20BalanceFromDb({
      address: "bc1qay74nc2djs2g5acqp72eyvlqp3ku7sj97jft8y",
      includePagination: true,
    });
    console.log("No tick result:", noTickResult);
  } catch (error) {
    console.error("❌ Balance query failed:");
    console.error("Error:", error.message);
  }
}

// Main function to run all tests
async function main() {
  console.log("Starting database debug tests...");

  // Validate environment variables before proceeding
  validateConfig();

  // Initialize database manager
  await dbManager.initialize();

  // First test connection
  await testDatabaseConnection();

  // If connection successful, test specific queries
  await testLuffyBalance();

  console.log("\n=== Debug Tests Complete ===\n");
}

// Run the tests if this is the main module
if (import.meta.main) {
  main().catch((error) => {
    console.error("Fatal error running debug tests:", error);
    Deno.exit(1);
  });
}
