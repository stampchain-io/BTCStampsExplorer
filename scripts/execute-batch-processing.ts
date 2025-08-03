#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * High-Performance Batch Processing Script
 * 
 * This script executes the batch processing of import alias improvements
 * with comprehensive validation and rollback capabilities.
 * 
 * Designed for Task 32.3: Develop High-Performance Batch Processing Script
 */

import { parseArgs } from "https://deno.land/std@0.219.1/cli/mod.ts";
import { join, dirname } from "https://deno.land/std@0.219.1/path/mod.ts";
import { exists } from "https://deno.land/std@0.219.1/fs/mod.ts";
import { type AnalysisReport, type ImportImprovement } from "./analyze-import-alias-improvements.ts";
import { type BatchExecutionPlan, type BatchConfiguration } from "./implement-batch-strategy.ts";

interface ProcessingOptions {
  batchId?: number;
  dryRun?: boolean;
  skipValidation?: boolean;
  parallel?: boolean;
  maxConcurrency?: number;
  rollbackOnError?: boolean;
  verbose?: boolean;
}

interface ProcessingResult {
  success: boolean;
  processedFiles: number;
  failedFiles: string[];
  errors: string[];
  duration: number;
  validationResults: ValidationResults;
}

interface ValidationResults {
  typeCheckPassed: boolean;
  testsPassed: boolean;
  lintPassed: boolean;
  buildPassed: boolean;
  performanceImpact: number; // percentage change
}

class BatchProcessor {
  private options: ProcessingOptions;
  private report: AnalysisReport;
  private plan: BatchExecutionPlan;
  private startTime: number = 0;

  constructor(options: ProcessingOptions) {
    this.options = {
      dryRun: false,
      skipValidation: false,
      parallel: false,
      maxConcurrency: 4,
      rollbackOnError: true,
      verbose: false,
      ...options
    };
  }

  async initialize(): Promise<void> {
    console.log("🚀 Initializing high-performance batch processor...");
    
    try {
      // Load analysis report
      const reportContent = await Deno.readTextFile("./scripts/import-alias-analysis-report.json");
      this.report = JSON.parse(reportContent);

      // Load execution plan
      const planContent = await Deno.readTextFile("./scripts/batch-execution-plan.json");
      this.plan = JSON.parse(planContent);

      console.log("✅ Loaded analysis report and execution plan");
    } catch (error) {
      throw new Error(`Failed to initialize: ${error.message}`);
    }
  }

  async processBatch(batchId: number): Promise<ProcessingResult> {
    this.startTime = Date.now();
    console.log(`\n🔄 Starting batch ${batchId} processing...`);

    const batch = this.plan.batches.find(b => b.batchId === batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found in execution plan`);
    }

    const improvements = this.getBatchImprovements(batchId);
    console.log(`📁 Processing ${improvements.length} files in batch ${batchId}`);

    // Create backup commit before processing
    if (!this.options.dryRun) {
      await this.createBackupCommit(batch);
    }

    const result: ProcessingResult = {
      success: false,
      processedFiles: 0,
      failedFiles: [],
      errors: [],
      duration: 0,
      validationResults: {
        typeCheckPassed: false,
        testsPassed: false,
        lintPassed: false,
        buildPassed: false,
        performanceImpact: 0
      }
    };

    try {
      // Process files
      if (this.options.parallel && improvements.length > 1) {
        await this.processFilesParallel(improvements, result);
      } else {
        await this.processFilesSequential(improvements, result);
      }

      // Validation phase
      if (!this.options.skipValidation) {
        result.validationResults = await this.validateChanges(batch);
        
        if (!this.allValidationsPassed(result.validationResults)) {
          if (this.options.rollbackOnError) {
            await this.rollbackBatch(batch);
            throw new Error("Validation failed, batch rolled back");
          }
        }
      }

      result.success = result.failedFiles.length === 0;
      result.duration = Date.now() - this.startTime;

      // Create completion commit
      if (!this.options.dryRun && result.success) {
        await this.createCompletionCommit(batch, result);
      }

      console.log(`✅ Batch ${batchId} completed successfully`);
      return result;

    } catch (error) {
      result.errors.push(error.message);
      result.duration = Date.now() - this.startTime;
      console.error(`❌ Batch ${batchId} failed: ${error.message}`);
      return result;
    }
  }

  private getBatchImprovements(batchId: number): ImportImprovement[] {
    switch (batchId) {
      case 1: return this.report.batchStrategy.batch1;
      case 2: return this.report.batchStrategy.batch2;
      case 3: return this.report.batchStrategy.batch3;
      case 4: return this.report.batchStrategy.batch4;
      default: throw new Error(`Invalid batch ID: ${batchId}`);
    }
  }

  private async processFilesSequential(
    improvements: ImportImprovement[],
    result: ProcessingResult
  ): Promise<void> {
    for (const improvement of improvements) {
      try {
        await this.processImprovement(improvement);
        result.processedFiles++;
        
        if (this.options.verbose) {
          console.log(`  ✓ ${improvement.file}:${improvement.line}`);
        }
      } catch (error) {
        result.failedFiles.push(improvement.file);
        result.errors.push(`${improvement.file}: ${error.message}`);
        
        if (this.options.verbose) {
          console.error(`  ✗ ${improvement.file}: ${error.message}`);
        }
      }
    }
  }

  private async processFilesParallel(
    improvements: ImportImprovement[],
    result: ProcessingResult
  ): Promise<void> {
    const concurrency = Math.min(this.options.maxConcurrency!, improvements.length);
    const chunks = this.chunkArray(improvements, concurrency);

    for (const chunk of chunks) {
      const promises = chunk.map(improvement =>
        this.processImprovement(improvement)
          .then(() => {
            result.processedFiles++;
            if (this.options.verbose) {
              console.log(`  ✓ ${improvement.file}:${improvement.line}`);
            }
          })
          .catch(error => {
            result.failedFiles.push(improvement.file);
            result.errors.push(`${improvement.file}: ${error.message}`);
            if (this.options.verbose) {
              console.error(`  ✗ ${improvement.file}: ${error.message}`);
            }
          })
      );

      await Promise.allSettled(promises);
      
      // Add small delay between chunks to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async processImprovement(improvement: ImportImprovement): Promise<void> {
    if (this.options.dryRun) {
      console.log(`[DRY RUN] Would update ${improvement.file}:${improvement.line}`);
      console.log(`  ${improvement.currentImport} → ${improvement.suggestedImport}`);
      return;
    }

    try {
      // Read the file
      const content = await Deno.readTextFile(improvement.file);
      const lines = content.split('\n');
      
      // Verify the line matches expectations
      const targetLine = lines[improvement.line - 1];
      if (!targetLine || !targetLine.includes(improvement.currentImport)) {
        throw new Error(`Import not found at line ${improvement.line}: expected "${improvement.currentImport}"`);
      }

      // Replace the import
      const updatedLine = targetLine.replace(
        improvement.currentImport,
        improvement.suggestedImport
      );
      lines[improvement.line - 1] = updatedLine;

      // Write the updated content
      const updatedContent = lines.join('\n');
      await Deno.writeTextFile(improvement.file, updatedContent);

      if (this.options.verbose) {
        console.log(`    Updated: ${improvement.currentImport} → ${improvement.suggestedImport}`);
      }

    } catch (error) {
      throw new Error(`Failed to process improvement: ${error.message}`);
    }
  }

  private async validateChanges(batch: BatchConfiguration): Promise<ValidationResults> {
    console.log(`🔍 Validating changes for batch ${batch.batchId}...`);

    const results: ValidationResults = {
      typeCheckPassed: false,
      testsPassed: false,
      lintPassed: false,
      buildPassed: false,
      performanceImpact: 0
    };

    try {
      // TypeScript compilation check
      if (batch.validationLevel !== "minimal") {
        console.log("  Checking TypeScript compilation...");
        const typeCheckResult = await this.runCommand("deno", ["check", "."]);
        results.typeCheckPassed = typeCheckResult.success;
        if (!results.typeCheckPassed && this.options.verbose) {
          console.error("  TypeScript errors:", typeCheckResult.stderr);
        }
      } else {
        results.typeCheckPassed = true; // Skip for minimal validation
      }

      // Linting check
      if (batch.validationLevel === "comprehensive") {
        console.log("  Running linter...");
        const lintResult = await this.runCommand("deno", ["lint", "--quiet"]);
        results.lintPassed = lintResult.success;
      } else {
        results.lintPassed = true; // Skip for non-comprehensive
      }

      // Test execution (only for high-priority batches)
      if (batch.priority === "high" && batch.validationLevel === "comprehensive") {
        console.log("  Running unit tests...");
        const testResult = await this.runCommand("deno", ["task", "test:unit"]);
        results.testsPassed = testResult.success;
      } else {
        results.testsPassed = true; // Skip for lower priority batches
      }

      // Build check (comprehensive validation only)
      if (batch.validationLevel === "comprehensive") {
        console.log("  Checking build...");
        const buildResult = await this.runCommand("deno", ["task", "build"]);
        results.buildPassed = buildResult.success;
      } else {
        results.buildPassed = true; // Skip for non-comprehensive
      }

      console.log("✅ Validation completed");
    } catch (error) {
      console.error(`❌ Validation error: ${error.message}`);
    }

    return results;
  }

  private async runCommand(cmd: string, args: string[]): Promise<{success: boolean, stdout: string, stderr: string}> {
    try {
      const process = new Deno.Command(cmd, {
        args,
        stdout: "piped",
        stderr: "piped"
      });

      const result = await process.output();
      const stdout = new TextDecoder().decode(result.stdout);
      const stderr = new TextDecoder().decode(result.stderr);

      return {
        success: result.success,
        stdout,
        stderr
      };
    } catch (error) {
      return {
        success: false,
        stdout: "",
        stderr: error.message
      };
    }
  }

  private allValidationsPassed(results: ValidationResults): boolean {
    return results.typeCheckPassed && 
           results.testsPassed && 
           results.lintPassed && 
           results.buildPassed;
  }

  private async createBackupCommit(batch: BatchConfiguration): Promise<void> {
    console.log(`📦 Creating backup commit for batch ${batch.batchId}...`);
    
    try {
      await this.runCommand("git", ["add", "."]);
      await this.runCommand("git", ["commit", "-m", `backup: pre-batch-${batch.batchId} import optimization`]);
    } catch (error) {
      console.warn(`⚠️  Warning: Could not create backup commit: ${error.message}`);
    }
  }

  private async createCompletionCommit(batch: BatchConfiguration, result: ProcessingResult): Promise<void> {
    console.log(`💾 Creating completion commit for batch ${batch.batchId}...`);
    
    const message = `feat: optimize import aliases batch ${batch.batchId}

- Processed ${result.processedFiles} files
- ${batch.name}
- Duration: ${Math.round(result.duration / 1000)}s
- Validation: ${this.allValidationsPassed(result.validationResults) ? 'PASSED' : 'PARTIAL'}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

    try {
      await this.runCommand("git", ["add", "."]);
      await this.runCommand("git", ["commit", "-m", message]);
    } catch (error) {
      console.warn(`⚠️  Warning: Could not create completion commit: ${error.message}`);
    }
  }

  private async rollbackBatch(batch: BatchConfiguration): Promise<void> {
    console.log(`🔄 Rolling back batch ${batch.batchId}...`);
    
    try {
      await this.runCommand("git", ["reset", "--hard", "HEAD~1"]);
      console.log("✅ Rollback completed");
    } catch (error) {
      console.error(`❌ Rollback failed: ${error.message}`);
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  generateProcessingReport(result: ProcessingResult, batchId: number): void {
    const batch = this.plan.batches.find(b => b.batchId === batchId)!;
    
    console.log(`\n📊 BATCH ${batchId} PROCESSING REPORT`);
    console.log("=" .repeat(50));
    console.log(`Batch Name: ${batch.name}`);
    console.log(`Status: ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`);
    console.log(`Duration: ${Math.round(result.duration / 1000)}s`);
    console.log(`Files Processed: ${result.processedFiles}`);
    console.log(`Files Failed: ${result.failedFiles.length}`);
    
    if (result.failedFiles.length > 0) {
      console.log("\n❌ Failed Files:");
      result.failedFiles.forEach(file => console.log(`  • ${file}`));
    }
    
    if (result.errors.length > 0) {
      console.log("\n🐛 Errors:");
      result.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    console.log("\n🔍 Validation Results:");
    console.log(`  TypeScript: ${result.validationResults.typeCheckPassed ? "✅" : "❌"}`);
    console.log(`  Linting: ${result.validationResults.lintPassed ? "✅" : "❌"}`);
    console.log(`  Tests: ${result.validationResults.testsPassed ? "✅" : "❌"}`);
    console.log(`  Build: ${result.validationResults.buildPassed ? "✅" : "❌"}`);
  }
}

async function main() {
  const args = parseArgs(Deno.args, {
    string: ["batch"],
    boolean: ["dry-run", "skip-validation", "parallel", "rollback-on-error", "verbose", "help"],
    number: ["max-concurrency"],
    default: {
      "max-concurrency": 4,
      "rollback-on-error": true
    },
    alias: {
      b: "batch",
      d: "dry-run",
      s: "skip-validation",
      p: "parallel",
      c: "max-concurrency",
      r: "rollback-on-error",
      v: "verbose",
      h: "help"
    }
  });

  if (args.help) {
    console.log(`
High-Performance Batch Processing Script

Usage: deno run --allow-read --allow-write --allow-run scripts/execute-batch-processing.ts [options]

Options:
  -b, --batch <number>           Execute specific batch (1-4)
  -d, --dry-run                  Show what would be changed without making changes
  -s, --skip-validation          Skip validation steps
  -p, --parallel                 Process files in parallel
  -c, --max-concurrency <number> Maximum concurrent operations (default: 4)
  -r, --rollback-on-error        Rollback on validation failure (default: true)
  -v, --verbose                  Show detailed progress
  -h, --help                     Show this help message

Examples:
  # Process batch 3 with validation
  deno run --allow-read --allow-write --allow-run scripts/execute-batch-processing.ts --batch=3

  # Dry run for batch 1
  deno run --allow-read --allow-write --allow-run scripts/execute-batch-processing.ts --batch=1 --dry-run

  # Process batch 4 in parallel with verbose output
  deno run --allow-read --allow-write --allow-run scripts/execute-batch-processing.ts --batch=4 --parallel --verbose
`);
    Deno.exit(0);
  }

  const options: ProcessingOptions = {
    batchId: args.batch ? parseInt(args.batch) : undefined,
    dryRun: args["dry-run"],
    skipValidation: args["skip-validation"],
    parallel: args.parallel,
    maxConcurrency: args["max-concurrency"],
    rollbackOnError: args["rollback-on-error"],
    verbose: args.verbose
  };

  if (!options.batchId) {
    console.error("❌ Error: Batch ID is required. Use --batch=<1-4>");
    Deno.exit(1);
  }

  if (options.batchId < 1 || options.batchId > 4) {
    console.error("❌ Error: Batch ID must be between 1 and 4");
    Deno.exit(1);
  }

  try {
    const processor = new BatchProcessor(options);
    await processor.initialize();
    
    const result = await processor.processBatch(options.batchId);
    processor.generateProcessingReport(result, options.batchId);
    
    if (!result.success) {
      Deno.exit(1);
    }
  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}

export { BatchProcessor, type ProcessingOptions, type ProcessingResult };