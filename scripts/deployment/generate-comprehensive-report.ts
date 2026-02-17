/**
 * Generate Comprehensive Validation Report
 *
 * Combines validation results from all CI jobs into a single
 * comprehensive report for production deployment review.
 *
 * Called by the comprehensive-validation CI job after all other
 * validation jobs complete.
 */

interface ValidationResult {
  source: string;
  timestamp: string;
  data: unknown;
}

interface ComprehensiveReport {
  generatedAt: string;
  version: string;
  results: ValidationResult[];
  summary: {
    totalFiles: number;
    sources: string[];
  };
}

async function generateReport(): Promise<void> {
  const reportsDir = "reports/comprehensive";
  const results: ValidationResult[] = [];
  const sources: string[] = [];

  try {
    for await (const entry of Deno.readDir(reportsDir)) {
      if (entry.isFile && entry.name.endsWith(".json")) {
        try {
          const content = await Deno.readTextFile(
            `${reportsDir}/${entry.name}`,
          );
          const data = JSON.parse(content);
          results.push({
            source: entry.name.replace(".json", ""),
            timestamp: new Date().toISOString(),
            data,
          });
          sources.push(entry.name);
        } catch {
          console.warn(`  Skipping ${entry.name}: invalid JSON`);
        }
      }
    }
  } catch {
    // No artifacts directory or empty — this is OK
    console.log("  No artifact files found in reports/comprehensive/");
  }

  const report: ComprehensiveReport = {
    generatedAt: new Date().toISOString(),
    version: Deno.env.get("DEPLOYMENT_VERSION") ||
      Deno.env.get("GITHUB_SHA")?.slice(0, 8) || "unknown",
    results,
    summary: {
      totalFiles: results.length,
      sources,
    },
  };

  await Deno.mkdir(reportsDir, { recursive: true });
  await Deno.writeTextFile(
    `${reportsDir}/comprehensive-report.json`,
    JSON.stringify(report, null, 2),
  );

  console.log(
    `\n📊 Comprehensive Report Generated`,
  );
  console.log(`   Files processed: ${results.length}`);
  console.log(`   Sources: ${sources.join(", ") || "none"}`);
  console.log(`   Output: ${reportsDir}/comprehensive-report.json`);
}

await generateReport();
