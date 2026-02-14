#!/usr/bin/env -S deno run --allow-read --allow-env --allow-net

/**
 * Test runner for test-seed-data.sql validation
 *
 * Runs tests in the correct order:
 * 1. Unit tests (syntax validation - no DB required)
 * 2. Integration tests (database validation - requires MySQL)
 *
 * Usage:
 *   deno run --allow-read --allow-env --allow-net tests/scripts/run_seed_data_tests.ts
 *
 * Environment variables:
 *   TEST_DB_HOST - MySQL host (default: localhost)
 *   TEST_DB_USER - MySQL user (default: root)
 *   TEST_DB_PASSWORD - MySQL password (default: empty)
 *   TEST_DB_NAME - Test database name (default: btcstamps_test)
 *   SKIP_INTEGRATION - Set to "1" to skip integration tests
 */

import {
  blue,
  bold,
  green,
  red,
  yellow,
} from "https://deno.land/std@0.208.0/fmt/colors.ts";

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

interface TestSuite {
  name: string;
  file: string;
  results: TestResult[];
  totalDuration: number;
}

const runTests = async (
  testFile: string,
  suiteName: string,
): Promise<TestSuite> => {
  console.log(blue(bold(`\n▶ Running ${suiteName}...`)));
  console.log(`  File: ${testFile}\n`);

  const startTime = Date.now();

  try {
    const command = new Deno.Command("deno", {
      args: [
        "test",
        "--allow-read",
        "--allow-env",
        "--allow-net",
        testFile,
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stderr } = await command.output();
    const duration = Date.now() - startTime;

    const errorOutput = new TextDecoder().decode(stderr);

    // Parse test results from output
    const results: TestResult[] = [];
    const passed = code === 0;

    if (passed) {
      console.log(green(`✓ ${suiteName} passed`));
    } else {
      console.log(red(`✗ ${suiteName} failed`));
      if (errorOutput) {
        console.log(red("Error output:"));
        console.log(errorOutput);
      }
    }

    return {
      name: suiteName,
      file: testFile,
      results,
      totalDuration: duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(red(`✗ ${suiteName} crashed: ${(error as Error).message}`));

    return {
      name: suiteName,
      file: testFile,
      results: [],
      totalDuration: duration,
    };
  }
};

const printSummary = (suites: TestSuite[]) => {
  console.log(blue(bold("\n" + "=".repeat(60))));
  console.log(blue(bold("Test Summary")));
  console.log(blue(bold("=".repeat(60))));

  let totalTests = 0;
  let totalPassed = 0;
  let totalDuration = 0;

  for (const suite of suites) {
    totalDuration += suite.totalDuration;

    const status = suite.results.every((r) => r.passed)
      ? green("✓ PASS")
      : red("✗ FAIL");
    console.log(`\n${status} ${suite.name}`);
    console.log(`     Duration: ${suite.totalDuration}ms`);
    console.log(`     File: ${suite.file}`);

    totalTests += suite.results.length;
    totalPassed += suite.results.filter((r) => r.passed).length;
  }

  console.log(blue(bold("\n" + "=".repeat(60))));
  console.log(`Total duration: ${totalDuration}ms`);

  if (totalPassed === totalTests && totalTests > 0) {
    console.log(
      green(bold(`\n✓ All tests passed! (${totalPassed}/${totalTests})`)),
    );
  } else {
    console.log(
      red(bold(`\n✗ Some tests failed (${totalPassed}/${totalTests} passed)`)),
    );
  }
  console.log(blue(bold("=".repeat(60) + "\n")));
};

const main = async () => {
  console.log(
    bold("\n╔════════════════════════════════════════════════════════════╗"),
  );
  console.log(
    bold("║  Test Seed Data SQL Validation Test Suite                 ║"),
  );
  console.log(
    bold("╚════════════════════════════════════════════════════════════╝\n"),
  );

  const suites: TestSuite[] = [];

  // Run unit tests (syntax validation - no DB required)
  const unitTestFile =
    new URL("../unit/test_seed_data_syntax.test.ts", import.meta.url).pathname;
  const unitSuite = await runTests(
    unitTestFile,
    "Unit Tests - SQL Syntax Validation",
  );
  suites.push(unitSuite);

  // Run integration tests (database validation) unless skipped
  const skipIntegration = Deno.env.get("SKIP_INTEGRATION") === "1";

  if (skipIntegration) {
    console.log(yellow("\n⚠ Skipping integration tests (SKIP_INTEGRATION=1)"));
  } else {
    console.log(blue("\n▶ Preparing to run integration tests..."));
    console.log("  Database configuration:");
    console.log(`    Host: ${Deno.env.get("TEST_DB_HOST") || "localhost"}`);
    console.log(`    User: ${Deno.env.get("TEST_DB_USER") || "root"}`);
    console.log(
      `    Database: ${Deno.env.get("TEST_DB_NAME") || "btcstamps_test"}`,
    );

    const integrationTestFile = new URL(
      "../integration/test_seed_data_validation.test.ts",
      import.meta.url,
    ).pathname;
    const integrationSuite = await runTests(
      integrationTestFile,
      "Integration Tests - Database Validation",
    );
    suites.push(integrationSuite);
  }

  // Print summary
  printSummary(suites);

  // Exit with appropriate code
  const allPassed = suites.every((s) => s.results.every((r) => r.passed));
  Deno.exit(allPassed ? 0 : 1);
};

// Run main function
if (import.meta.main) {
  await main();
}
