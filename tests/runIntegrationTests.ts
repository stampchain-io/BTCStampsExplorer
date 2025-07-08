#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net --no-check

/**
 * Script to run integration tests
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-env --allow-net tests/runIntegrationTests.ts
 *
 * Or make it executable:
 *   chmod +x tests/runIntegrationTests.ts
 *   ./tests/runIntegrationTests.ts
 */

import { parse } from "@std/flags";

const args = parse(Deno.args, {
  boolean: ["help", "verbose"],
  string: ["filter"],
  default: {
    verbose: false,
  },
});

if (args.help) {
  console.log(`
Integration Test Runner

Usage:
  deno run --allow-read --allow-write --allow-env --allow-net tests/runIntegrationTests.ts [options]

Options:
  --help      Show this help message
  --verbose   Show detailed output
  --filter    Filter tests by pattern (e.g., --filter=stamp)

Examples:
  # Run all integration tests
  ./tests/runIntegrationTests.ts

  # Run only stamp repository tests
  ./tests/runIntegrationTests.ts --filter=stamp

  # Run with verbose output
  ./tests/runIntegrationTests.ts --verbose
`);
  Deno.exit(0);
}

console.log("🧪 Running Integration Tests...\n");

// Check if we have database connection
const dbHost = Deno.env.get("DB_HOST") || Deno.env.get("TEST_DB_HOST");
if (!dbHost) {
  console.error(
    "❌ No database host configured. Set DB_HOST or TEST_DB_HOST environment variable.",
  );
  Deno.exit(1);
}

console.log(`📊 Using database: ${dbHost}\n`);

// Build test command
const testArgs = [
  "test",
  "--allow-env",
  "--allow-read",
  "--allow-write",
  "--allow-net",
  "--no-check", // Skip type checking for faster execution
  "tests/integration/",
];

if (args.filter) {
  testArgs.push(`--filter=${args.filter}`);
}

if (!args.verbose) {
  testArgs.push("--quiet");
}

// Run tests
const command = new Deno.Command("deno", {
  args: testArgs,
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
});

const { code } = await command.output();

if (code === 0) {
  console.log("\n✅ All integration tests passed!");
} else {
  console.log("\n❌ Some tests failed.");
}

Deno.exit(code);
