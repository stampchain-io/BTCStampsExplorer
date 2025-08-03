#!/usr/bin/env -S deno run --allow-all
/**
 * Baseline Performance Metrics Collector
 * Establishes performance baselines before and after type migration
 */

import type { BaselineMetrics } from "$types/utils.d.ts";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";


class BaselineCollector {
  private projectRoot: string;
  private outputDir: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.outputDir = join(projectRoot, "scripts", "performance", "baselines");
  }

  async collectBaseline(phase: 'before' | 'during' | 'after'): Promise<BaselineMetrics> {
    console.log(`📊 Collecting baseline metrics for phase: ${phase}`);
    
    await ensureDir(this.outputDir);

    const gitInfo = await this.getGitInfo();
    const migrationProgress = await this.analyzeMigrationProgress();
    const performanceMetrics = await this.measurePerformanceMetrics();
    const codeMetrics = await this.analyzeCodeMetrics();

    const baseline: BaselineMetrics = {
      timestamp: new Date().toISOString(),
      version: await this.getProjectVersion(),
      branch: gitInfo.branch,
      commitHash: gitInfo.commit,
      migration: {
        phase,
        aliasImportPercentage: migrationProgress.aliasPercentage,
        domainMigrationProgress: migrationProgress.domainProgress,
      },
      performance: performanceMetrics,
      codeMetrics,
    };

    // Save baseline
    const filename = `baseline-${phase}-${Date.now()}.json`;
    const filepath = join(this.outputDir, filename);
    await Deno.writeTextFile(filepath, JSON.stringify(baseline, null, 2));

    console.log(`✅ Baseline saved: ${filepath}`);
    return baseline;
  }

  async compareBaselines(beforeFile: string, afterFile: string): Promise<void> {
    const beforePath = join(this.outputDir, beforeFile);
    const afterPath = join(this.outputDir, afterFile);

    const before: BaselineMetrics = JSON.parse(await Deno.readTextFile(beforePath));
    const after: BaselineMetrics = JSON.parse(await Deno.readTextFile(afterPath));

    const comparison = this.generateComparison(before, after);
    
    const reportPath = join(this.outputDir, `comparison-${Date.now()}.md`);
    await Deno.writeTextFile(reportPath, comparison);

    console.log(`📈 Comparison report generated: ${reportPath}`);
  }

  private async getGitInfo() {
    try {
      const branchProcess = new Deno.Command("git", {
        args: ["branch", "--show-current"],
        cwd: this.projectRoot,
        stdout: "piped",
      });
      const branchResult = await branchProcess.output();
      const branch = new TextDecoder().decode(branchResult.stdout).trim();

      const commitProcess = new Deno.Command("git", {
        args: ["rev-parse", "HEAD"],
        cwd: this.projectRoot,
        stdout: "piped",
      });
      const commitResult = await commitProcess.output();
      const commit = new TextDecoder().decode(commitResult.stdout).trim();

      return { branch, commit };
    } catch {
      return { branch: 'unknown', commit: 'unknown' };
    }
  }

  private async getProjectVersion(): Promise<string> {
    try {
      const denoJson = JSON.parse(await Deno.readTextFile(join(this.projectRoot, "deno.json")));
      return denoJson.version || "1.0.0";
    } catch {
      return "1.0.0";
    }
  }

  private async analyzeMigrationProgress() {
    let aliasImports = 0;
    let relativeImports = 0;
    let globalTypeUsage = 0;
    let domainTypeUsage = 0;

    for await (const filePath of this.walkTypeScriptFiles()) {
      const content = await Deno.readTextFile(filePath);
      
      // Count import patterns
      const imports = content.match(/import .+ from ['"]([^'"]+)['"]/g) || [];
      for (const importLine of imports) {
        if (importLine.includes('$types/') || importLine.includes('@/lib/types/')) {
          aliasImports++;
        } else if (importLine.includes('./') || importLine.includes('../')) {
          relativeImports++;
        }
      }

      // Count type usage patterns
      if (content.includes('from "$globals"') || content.includes('globals.d.ts')) {
        globalTypeUsage++;
      }
      
      const domainImports = content.match(/from ['"]\$types\/[^'"]*\.d\.ts['"]/g) || [];
      domainTypeUsage += domainImports.length;
    }

    const totalImports = aliasImports + relativeImports;
    const aliasPercentage = totalImports > 0 ? (aliasImports / totalImports) * 100 : 0;
    
    // Calculate domain migration progress (rough estimate)
    const totalTypeUsage = globalTypeUsage + domainTypeUsage;
    const domainProgress = totalTypeUsage > 0 ? (domainTypeUsage / totalTypeUsage) * 100 : 0;

    return {
      aliasPercentage,
      domainProgress,
    };
  }

  private async measurePerformanceMetrics() {
    // Type check performance
    const typeCheckStart = performance.now();
    const typeCheckProcess = new Deno.Command("deno", {
      args: ["check", "."],
      cwd: this.projectRoot,
      stdout: "piped",
      stderr: "piped",
    });
    await typeCheckProcess.output();
    const typeCheckTime = performance.now() - typeCheckStart;

    // Build performance (if possible)
    let buildTime = 0;
    try {
      const buildStart = performance.now();
      const buildProcess = new Deno.Command("deno", {
        args: ["task", "build:fast"],
        cwd: this.projectRoot,
        stdout: "piped",
        stderr: "piped",
      });
      await buildProcess.output();
      buildTime = performance.now() - buildStart;
    } catch {
      buildTime = 0; // Build might not be available
    }

    // Estimate bundle size
    const bundleSize = await this.estimateBundleSize();
    
    // Estimate memory usage (rough)
    const memoryUsage = 100; // Placeholder for Deno memory measurement

    // Import resolution test
    const importResolutionTime = await this.measureImportResolution();

    return {
      typeCheckTimeMs: typeCheckTime,
      buildTimeMs: buildTime,
      bundleSizeKB: bundleSize,
      memoryUsageMB: memoryUsage,
      importResolutionMs: importResolutionTime,
    };
  }

  private async analyzeCodeMetrics() {
    let totalFiles = 0;
    let typeDefinitionFiles = 0;
    let aliasImports = 0;
    let relativeImports = 0;
    let globalTypeUsage = 0;
    let domainTypeUsage = 0;

    for await (const filePath of this.walkTypeScriptFiles()) {
      totalFiles++;
      
      if (filePath.endsWith('.d.ts')) {
        typeDefinitionFiles++;
      }

      const content = await Deno.readTextFile(filePath);
      
      // Count imports
      const imports = content.match(/import .+ from ['"]([^'"]+)['"]/g) || [];
      for (const importLine of imports) {
        if (importLine.includes('$') || importLine.includes('@/')) {
          aliasImports++;
        } else if (importLine.includes('./') || importLine.includes('../')) {
          relativeImports++;
        }
      }

      // Count type usage
      if (content.includes('globals.d.ts') || content.includes('from "$globals"')) {
        globalTypeUsage++;
      }

      const domainImports = content.match(/from ['"]\$types\/[^'"]*\.d\.ts['"]/g) || [];
      domainTypeUsage += domainImports.length;
    }

    return {
      totalFiles,
      typeDefinitionFiles,
      aliasImports,
      relativeImports,
      globalTypeUsage,
      domainTypeUsage,
    };
  }

  private async estimateBundleSize(): Promise<number> {
    let totalSize = 0;
    
    for await (const filePath of this.walkTypeScriptFiles()) {
      try {
        const stat = await Deno.stat(filePath);
        totalSize += stat.size;
      } catch {
        // Ignore files that can't be accessed
      }
    }
    
    return Math.floor(totalSize / 1024); // Convert to KB
  }

  private async measureImportResolution(): Promise<number> {
    const testImports = [
      "import type { StampData } from '$types/stamp.d.ts';",
      "import type { ApiResponse } from '$types/api.d.ts';",
      "import { formatUtils } from '$lib/utils/formatUtils.ts';",
    ];

    const testFile = join(this.projectRoot, "tmp-baseline-test.ts");
    await Deno.writeTextFile(testFile, testImports.join("\n"));

    const start = performance.now();
    const process = new Deno.Command("deno", {
      args: ["check", testFile],
      cwd: this.projectRoot,
      stdout: "piped",
      stderr: "piped",
    });
    await process.output();
    const duration = performance.now() - start;

    // Clean up
    try {
      await Deno.remove(testFile);
    } catch {
      // Ignore cleanup errors
    }

    return duration;
  }

  private async *walkTypeScriptFiles(): AsyncGenerator<string> {
    const extensions = ['.ts', '.tsx'];
    const excludeDirs = ['node_modules', '_fresh', '.git', 'coverage', 'tmp', 'dist', 'build'];
    
    async function* walk(dir: string): AsyncGenerator<string> {
      try {
        for await (const entry of Deno.readDir(dir)) {
          const fullPath = join(dir, entry.name);
          
          if (entry.isDirectory && !excludeDirs.includes(entry.name)) {
            yield* walk(fullPath);
          } else if (entry.isFile && extensions.some(ext => entry.name.endsWith(ext))) {
            yield fullPath;
          }
        }
      } catch {
        // Directory might not be accessible
      }
    }
    
    yield* walk(this.projectRoot);
  }

  private generateComparison(before: BaselineMetrics, after: BaselineMetrics): string {
    const perfImprovement = {
      typeCheck: ((before.performance.typeCheckTimeMs - after.performance.typeCheckTimeMs) / before.performance.typeCheckTimeMs) * 100,
      build: before.performance.buildTimeMs > 0 ? ((before.performance.buildTimeMs - after.performance.buildTimeMs) / before.performance.buildTimeMs) * 100 : 0,
      bundleSize: ((before.performance.bundleSizeKB - after.performance.bundleSizeKB) / before.performance.bundleSizeKB) * 100,
      importResolution: ((before.performance.importResolutionMs - after.performance.importResolutionMs) / before.performance.importResolutionMs) * 100,
    };

    return `# Type Migration Performance Comparison

Generated: ${new Date().toISOString()}

## Migration Progress

| Metric | Before | After | Change |
|--------|---------|-------|---------|
| **Alias Import %** | ${before.migration.aliasImportPercentage.toFixed(1)}% | ${after.migration.aliasImportPercentage.toFixed(1)}% | ${(after.migration.aliasImportPercentage - before.migration.aliasImportPercentage).toFixed(1)}% |
| **Domain Migration %** | ${before.migration.domainMigrationProgress.toFixed(1)}% | ${after.migration.domainMigrationProgress.toFixed(1)}% | ${(after.migration.domainMigrationProgress - before.migration.domainMigrationProgress).toFixed(1)}% |

## Performance Impact

| Metric | Before | After | Improvement |
|--------|---------|-------|-------------|
| **Type Check Time** | ${before.performance.typeCheckTimeMs.toFixed(0)}ms | ${after.performance.typeCheckTimeMs.toFixed(0)}ms | ${perfImprovement.typeCheck.toFixed(1)}% |
| **Build Time** | ${before.performance.buildTimeMs.toFixed(0)}ms | ${after.performance.buildTimeMs.toFixed(0)}ms | ${perfImprovement.build.toFixed(1)}% |
| **Bundle Size** | ${before.performance.bundleSizeKB}KB | ${after.performance.bundleSizeKB}KB | ${perfImprovement.bundleSize.toFixed(1)}% |
| **Import Resolution** | ${before.performance.importResolutionMs.toFixed(0)}ms | ${after.performance.importResolutionMs.toFixed(0)}ms | ${perfImprovement.importResolution.toFixed(1)}% |

## Code Metrics

| Metric | Before | After | Change |
|--------|---------|-------|---------|
| **Total Files** | ${before.codeMetrics.totalFiles} | ${after.codeMetrics.totalFiles} | ${after.codeMetrics.totalFiles - before.codeMetrics.totalFiles} |
| **Type Definition Files** | ${before.codeMetrics.typeDefinitionFiles} | ${after.codeMetrics.typeDefinitionFiles} | ${after.codeMetrics.typeDefinitionFiles - before.codeMetrics.typeDefinitionFiles} |
| **Alias Imports** | ${before.codeMetrics.aliasImports} | ${after.codeMetrics.aliasImports} | ${after.codeMetrics.aliasImports - before.codeMetrics.aliasImports} |
| **Relative Imports** | ${before.codeMetrics.relativeImports} | ${after.codeMetrics.relativeImports} | ${after.codeMetrics.relativeImports - before.codeMetrics.relativeImports} |
| **Global Type Usage** | ${before.codeMetrics.globalTypeUsage} | ${after.codeMetrics.globalTypeUsage} | ${after.codeMetrics.globalTypeUsage - before.codeMetrics.globalTypeUsage} |
| **Domain Type Usage** | ${before.codeMetrics.domainTypeUsage} | ${after.codeMetrics.domainTypeUsage} | ${after.codeMetrics.domainTypeUsage - before.codeMetrics.domainTypeUsage} |

## Summary

${this.generateSummaryAnalysis(perfImprovement, before, after)}

---

**Before**: ${before.branch}@${before.commitHash.substring(0, 8)} (${before.timestamp})
**After**: ${after.branch}@${after.commitHash.substring(0, 8)} (${after.timestamp})
`;
  }

  private generateSummaryAnalysis(improvements: any, before: BaselineMetrics, after: BaselineMetrics): string {
    const positiveChanges: string[] = [];
    const negativeChanges: string[] = [];
    const observations: string[] = [];

    // Analyze performance improvements
    if (improvements.typeCheck > 5) {
      positiveChanges.push(`✅ **Type checking improved by ${improvements.typeCheck.toFixed(1)}%**`);
    } else if (improvements.typeCheck < -5) {
      negativeChanges.push(`❌ **Type checking degraded by ${Math.abs(improvements.typeCheck).toFixed(1)}%**`);
    }

    if (improvements.importResolution > 5) {
      positiveChanges.push(`✅ **Import resolution improved by ${improvements.importResolution.toFixed(1)}%**`);
    } else if (improvements.importResolution < -5) {
      negativeChanges.push(`❌ **Import resolution degraded by ${Math.abs(improvements.importResolution).toFixed(1)}%**`);
    }

    // Analyze migration progress
    const aliasImprovement = after.migration.aliasImportPercentage - before.migration.aliasImportPercentage;
    if (aliasImprovement > 10) {
      positiveChanges.push(`✅ **Alias import usage increased by ${aliasImprovement.toFixed(1)}%**`);
    }

    const domainImprovement = after.migration.domainMigrationProgress - before.migration.domainMigrationProgress;
    if (domainImprovement > 10) {
      positiveChanges.push(`✅ **Domain type migration progressed by ${domainImprovement.toFixed(1)}%**`);
    }

    // Generate observations
    if (after.migration.aliasImportPercentage > 75) {
      observations.push("📊 **High alias import adoption** - Project is following modern import patterns");
    }

    if (after.migration.domainMigrationProgress > 50) {
      observations.push("📊 **Significant domain migration progress** - Types are being properly organized");
    }

    const sections = [];
    if (positiveChanges.length > 0) {
      sections.push("### Positive Changes\n" + positiveChanges.join('\n'));
    }
    if (negativeChanges.length > 0) {
      sections.push("### Areas of Concern\n" + negativeChanges.join('\n'));
    }
    if (observations.length > 0) {
      sections.push("### Observations\n" + observations.join('\n'));
    }

    return sections.join('\n\n') || "No significant changes detected.";
  }
}

// CLI Interface
if (import.meta.main) {
  const args = Deno.args;
  const projectRoot = Deno.cwd();
  const collector = new BaselineCollector(projectRoot);

  const command = args[0];

  try {
    switch (command) {
      case 'collect': {
        const phase = (args[1] as 'before' | 'during' | 'after') || 'during';
        const baseline = await collector.collectBaseline(phase);
        console.log(`Baseline collected for phase: ${phase}`);
        console.log(`Alias import percentage: ${baseline.migration.aliasImportPercentage.toFixed(1)}%`);
        break;
      }
      case 'compare': {
        const beforeFile = args[1];
        const afterFile = args[2];
        if (!beforeFile || !afterFile) {
          console.error("Usage: baseline-collector.ts compare <before-file> <after-file>");
          Deno.exit(1);
        }
        await collector.compareBaselines(beforeFile, afterFile);
        break;
      }
      default:
        console.log("Usage:");
        console.log("  baseline-collector.ts collect [before|during|after]");
        console.log("  baseline-collector.ts compare <before-file> <after-file>");
        break;
    }
  } catch (error) {
    console.error("Error:", error);
    Deno.exit(1);
  }
}

export { BaselineCollector };
export type { BaselineMetrics };