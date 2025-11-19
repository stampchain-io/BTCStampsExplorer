#!/usr/bin/env deno run --allow-read --allow-write --allow-run

/**
 * Type Testing Pipeline
 * 
 * Automated type testing pipeline with regression detection, coverage reporting,
 * and CI/CD integration for the BTCStampsExplorer Deno Fresh 2.4 project.
 * 
 * Usage:
 *   deno task type:test:regression  # Run regression tests
 *   deno task type:test:ci          # Run CI/CD pipeline
 *   deno task type:coverage         # Generate coverage report
 */

import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";
import { exists } from "https://deno.land/std@0.224.0/fs/exists.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";

interface TestResult {
  success: boolean;
  duration: number;
  errors: string[];
  output: string;
}

interface RegressionTestResult {
  timestamp: string;
  baseline: TestResult;
  current: TestResult;
  regressions: string[];
  improvements: string[];
}

interface CoverageReport {
  timestamp: string;
  totalFiles: number;
  testedFiles: number;
  coverage: number;
  untested: string[];
  domainCoverage: Record<string, {
    files: number;
    tested: number;
    coverage: number;
  }>;
}

class TypeTestingPipeline {
  private outputDir = "reports/type-testing";
  private baselineFile = "reports/type-testing/baseline.json";

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    await ensureDir(this.outputDir);
  }

  /**
   * Run type checks and collect results
   */
  private async runTypeCheck(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let output = "";

    try {
      // Run deno check on type definition files
      const typeCheckCmd = new Deno.Command("deno", {
        args: ["check", "lib/types/**/*.d.ts", "server/types/**/*.d.ts"],
        stdout: "piped",
        stderr: "piped",
      });

      const typeCheckResult = await typeCheckCmd.output();
      output += new TextDecoder().decode(typeCheckResult.stdout);
      const stderr = new TextDecoder().decode(typeCheckResult.stderr);
      
      if (stderr) {
        errors.push(`Type check errors: ${stderr}`);
      }

      // Run type tests
      const testCmd = new Deno.Command("deno", {
        args: [
          "test",
          "--allow-read",
          "--allow-run", 
          "test/types/",
          "--no-check=remote"
        ],
        stdout: "piped",
        stderr: "piped",
      });

      const testResult = await testCmd.output();
      const testOutput = new TextDecoder().decode(testResult.stdout);
      const testStderr = new TextDecoder().decode(testResult.stderr);
      
      output += testOutput;
      
      if (testStderr) {
        errors.push(`Test errors: ${testStderr}`);
      }

      const success = typeCheckResult.success && testResult.success;
      const duration = Date.now() - startTime;

      return {
        success,
        duration,
        errors,
        output
      };

    } catch (error) {
      errors.push(`Pipeline error: ${error.message}`);
      return {
        success: false,
        duration: Date.now() - startTime,
        errors,
        output
      };
    }
  }

  /**
   * Run regression testing by comparing against baseline
   */
  async runRegressionTest(): Promise<RegressionTestResult> {
    console.log("🔄 Running regression tests...");

    const current = await this.runTypeCheck();
    let baseline: TestResult;

    // Load or create baseline
    if (await exists(this.baselineFile)) {
      try {
        const baselineData = await Deno.readTextFile(this.baselineFile);
        baseline = JSON.parse(baselineData);
      } catch {
        console.log("⚠️  Could not load baseline, creating new one...");
        baseline = current;
        await this.saveBaseline(baseline);
      }
    } else {
      console.log("📝 Creating initial baseline...");
      baseline = current;
      await this.saveBaseline(baseline);
    }

    // Compare results
    const regressions: string[] = [];
    const improvements: string[] = [];

    // Check for new errors
    current.errors.forEach(error => {
      if (!baseline.errors.includes(error)) {
        regressions.push(`New error: ${error}`);
      }
    });

    // Check for resolved errors
    baseline.errors.forEach(error => {
      if (!current.errors.includes(error)) {
        improvements.push(`Resolved error: ${error}`);
      }
    });

    // Check success status
    if (baseline.success && !current.success) {
      regressions.push("Type checking now failing");
    } else if (!baseline.success && current.success) {
      improvements.push("Type checking now passing");
    }

    const result: RegressionTestResult = {
      timestamp: new Date().toISOString(),
      baseline,
      current,
      regressions,
      improvements
    };

    // Save regression report
    const reportPath = `${this.outputDir}/regression-${Date.now()}.json`;
    await Deno.writeTextFile(reportPath, JSON.stringify(result, null, 2));

    console.log(`✅ Regression test complete. Report saved to ${reportPath}`);
    console.log(`📊 Regressions: ${regressions.length}, Improvements: ${improvements.length}`);

    return result;
  }

  /**
   * Generate type coverage report
   */
  async generateCoverageReport(): Promise<CoverageReport> {
    console.log("📊 Generating type coverage report...");

    const typeFiles = await this.findTypeFiles();
    const testFiles = await this.findTypeTestFiles();
    
    // Calculate coverage by domain
    const domainCoverage: Record<string, { files: number; tested: number; coverage: number }> = {};
    
    const domains = ['base', 'api', 'stamp', 'src20', 'src101', 'transaction', 'wallet', 'marketData'];
    
    for (const domain of domains) {
      const domainFiles = typeFiles.filter(f => f.includes(`${domain}.d.ts`));
      const domainTests = testFiles.filter(f => f.includes(`${domain}_test.ts`));
      
      domainCoverage[domain] = {
        files: domainFiles.length,
        tested: domainTests.length,
        coverage: domainFiles.length > 0 ? (domainTests.length / domainFiles.length) * 100 : 0
      };
    }

    const totalFiles = typeFiles.length;
    const testedFiles = testFiles.length;
    const coverage = totalFiles > 0 ? (testedFiles / totalFiles) * 100 : 0;
    
    const untested = typeFiles.filter(file => {
      const testFile = file.replace('.d.ts', '_test.ts');
      return !testFiles.some(test => test.includes(testFile));
    });

    const report: CoverageReport = {
      timestamp: new Date().toISOString(),
      totalFiles,
      testedFiles,
      coverage,
      untested,
      domainCoverage
    };

    // Save coverage report
    const reportPath = `${this.outputDir}/coverage-${Date.now()}.json`;
    await Deno.writeTextFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`✅ Coverage report generated: ${reportPath}`);
    console.log(`📈 Overall coverage: ${coverage.toFixed(1)}% (${testedFiles}/${totalFiles} files)`);

    return report;
  }

  /**
   * Run CI/CD pipeline with comprehensive checks
   */
  async runCIPipeline(): Promise<boolean> {
    console.log("🚀 Running CI/CD type testing pipeline...");

    let success = true;

    try {
      // 1. Run type check
      console.log("1️⃣ Running type checks...");
      const typeResult = await this.runTypeCheck();
      if (!typeResult.success) {
        console.error("❌ Type checks failed:");
        typeResult.errors.forEach(error => console.error(`  ${error}`));
        success = false;
      } else {
        console.log("✅ Type checks passed");
      }

      // 2. Run regression tests
      console.log("2️⃣ Running regression tests...");
      const regressionResult = await this.runRegressionTest();
      if (regressionResult.regressions.length > 0) {
        console.error("❌ Regressions detected:");
        regressionResult.regressions.forEach(regression => 
          console.error(`  ${regression}`)
        );
        success = false;
      } else {
        console.log("✅ No regressions detected");
      }

      // 3. Generate coverage report
      console.log("3️⃣ Generating coverage report...");
      const coverageResult = await this.generateCoverageReport();
      console.log(`📊 Type coverage: ${coverageResult.coverage.toFixed(1)}%`);

      // 4. Check coverage threshold (80%)
      const coverageThreshold = 80;
      if (coverageResult.coverage < coverageThreshold) {
        console.warn(`⚠️  Coverage below threshold: ${coverageResult.coverage.toFixed(1)}% < ${coverageThreshold}%`);
        // Note: Don't fail CI for coverage, just warn
      }

      // 5. Save CI report
      const ciReport = {
        timestamp: new Date().toISOString(),
        success,
        typeCheck: typeResult,
        regression: regressionResult,
        coverage: coverageResult
      };

      const ciReportPath = `${this.outputDir}/ci-report-${Date.now()}.json`;
      await Deno.writeTextFile(ciReportPath, JSON.stringify(ciReport, null, 2));

      console.log(`📄 CI report saved: ${ciReportPath}`);

      if (success) {
        console.log("🎉 CI pipeline completed successfully!");
      } else {
        console.error("💥 CI pipeline failed!");
      }

      return success;

    } catch (error) {
      console.error(`❌ CI pipeline error: ${error.message}`);
      return false;
    }
  }

  /**
   * Save baseline for regression testing
   */
  private async saveBaseline(baseline: TestResult): Promise<void> {
    await Deno.writeTextFile(this.baselineFile, JSON.stringify(baseline, null, 2));
  }

  /**
   * Find all type definition files
   */
  private async findTypeFiles(): Promise<string[]> {
    const files: string[] = [];
    
    for await (const entry of Deno.readDir("lib/types")) {
      if (entry.isFile && entry.name.endsWith(".d.ts")) {
        files.push(`lib/types/${entry.name}`);
      }
    }

    // Also check server/types if it exists
    try {
      for await (const entry of Deno.readDir("server/types")) {
        if (entry.isFile && entry.name.endsWith(".d.ts")) {
          files.push(`server/types/${entry.name}`);
        }
      }
    } catch {
      // server/types might not exist
    }

    return files;
  }

  /**
   * Find all type test files
   */
  private async findTypeTestFiles(): Promise<string[]> {
    const files: string[] = [];
    
    async function walkDir(dir: string) {
      try {
        for await (const entry of Deno.readDir(dir)) {
          if (entry.isFile && entry.name.endsWith("_test.ts")) {
            files.push(`${dir}/${entry.name}`);
          } else if (entry.isDirectory) {
            await walkDir(`${dir}/${entry.name}`);
          }
        }
      } catch {
        // Directory might not exist
      }
    }

    await walkDir("test/types");
    return files;
  }
}

// Main execution
async function main() {
  const args = parseArgs(Deno.args, {
    string: ["mode"],
    default: { mode: "regression" }
  });

  const pipeline = new TypeTestingPipeline();

  switch (args.mode) {
    case "regression":
      await pipeline.runRegressionTest();
      break;
    case "coverage":
      await pipeline.generateCoverageReport();
      break;
    case "ci":
      const success = await pipeline.runCIPipeline();
      Deno.exit(success ? 0 : 1);
      break;
    default:
      console.error(`Unknown mode: ${args.mode}`);
      console.error("Available modes: regression, coverage, ci");
      Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}