#!/usr/bin/env -S deno run --allow-read --allow-env

/**
 * Market Data Tests Runner
 *
 * This script runs all market data related tests in the correct order:
 * 1. Unit tests - Test individual functions and utilities
 * 2. Integration tests - Test component interactions
 * 3. Performance tests - Verify performance benchmarks
 *
 * Usage:
 *   deno run --allow-read --allow-env tests/runMarketDataTests.ts
 *
 * Or make it executable:
 *   chmod +x tests/runMarketDataTests.ts
 *   ./tests/runMarketDataTests.ts
 */

import { bold, green, red, yellow } from "@std/fmt/colors";

interface TestResult {
  category: string;
  file: string;
  success: boolean;
  duration: number;
  error?: string;
}

async function runTest(category: string, file: string): Promise<TestResult> {
  console.log(`\n${bold(yellow(`Running ${category} test:`))} ${file}`);

  const start = performance.now();

  try {
    const p = new Deno.Command("deno", {
      args: ["test", "--allow-read", "--allow-env", file],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await p.output();
    const duration = performance.now() - start;

    if (code === 0) {
      console.log(green("✓ Passed"));
      const output = new TextDecoder().decode(stdout);
      console.log(output);
      return { category, file, success: true, duration };
    } else {
      const error = new TextDecoder().decode(stderr);
      console.log(red("✗ Failed"));
      console.error(error);
      return { category, file, success: false, duration, error };
    }
  } catch (error) {
    const duration = performance.now() - start;
    console.log(red("✗ Error running test"));
    console.error(error);
    return {
      category,
      file,
      success: false,
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log(bold(green("\n🧪 Market Data Test Suite Runner\n")));

  const tests = [
    // Unit tests
    { category: "Unit", file: "tests/unit/marketDataUtils.test.ts" },
    { category: "Unit", file: "tests/unit/marketDataInterfaces.test.ts" },
    { category: "Unit", file: "tests/unit/marketDataApiResponse.test.ts" },
    { category: "Unit", file: "tests/unit/marketDataEdgeCases.test.ts" },

    // Integration tests
    {
      category: "Integration",
      file: "tests/integration/marketDataIntegration.test.ts",
    },

    // Performance tests
    {
      category: "Performance",
      file: "tests/performance/marketDataPerformance.test.ts",
    },
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    const result = await runTest(test.category, test.file);
    results.push(result);
  }

  // Summary
  console.log(bold(yellow("\n\n📊 Test Summary\n")));

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total tests: ${results.length}`);
  console.log(`${green(`Passed: ${passed}`)}`);
  if (failed > 0) {
    console.log(`${red(`Failed: ${failed}`)}`);
  }
  console.log(`Total duration: ${(totalDuration / 1000).toFixed(2)}s\n`);

  // Detailed results
  console.log(bold("Detailed Results:"));
  console.log("─".repeat(80));

  for (const result of results) {
    const status = result.success ? green("✓ PASS") : red("✗ FAIL");
    const duration = `${result.duration.toFixed(0)}ms`;
    console.log(
      `${status} | ${result.category.padEnd(12)} | ${
        result.file.padEnd(50)
      } | ${duration}`,
    );

    if (!result.success && result.error) {
      console.log(`  ${red("Error:")} ${result.error.split("\n")[0]}`);
    }
  }

  console.log("─".repeat(80));

  // Exit with appropriate code
  if (failed > 0) {
    console.log(
      red("\n❌ Some tests failed. Please check the output above.\n"),
    );
    Deno.exit(1);
  } else {
    console.log(green("\n✅ All tests passed!\n"));
    Deno.exit(0);
  }
}

// Run the test suite
if (import.meta.main) {
  await main();
}
