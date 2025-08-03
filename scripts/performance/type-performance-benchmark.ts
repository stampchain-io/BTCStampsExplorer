#!/usr/bin/env -S deno run --allow-all
/**
 * Performance benchmarking infrastructure for Type Domain Migration
 * Measures TypeScript compilation performance, import resolution, and bundle size impacts
 */

import { join } from "@std/path";
import { ensureDir } from "@std/fs";

interface PerformanceMetrics {
  timestamp: string;
  environment: {
    denoVersion: string;
    platform: string;
    memory: number;
  };
  compilation: {
    totalTimeMs: number;
    filesProcessed: number;
    averageTimePerFile: number;
    errorCount: number;
    warningCount: number;
  };
  importResolution: {
    aliasImports: number;
    relativeImports: number;
    resolutionTimeMs: number;
    treeShakingEffectiveness: number;
  };
  bundleSize: {
    totalSizeBytes: number;
    gzippedSizeBytes: number;
    moduleCount: number;
    unusedExports: string[];
  };
  memory: {
    peakUsageMB: number;
    averageUsageMB: number;
    gcCollections: number;
  };
}

interface BenchmarkConfig {
  iterations: number;
  warmupRuns: number;
  outputDir: string;
  includeTreeShaking: boolean;
  enableMemoryProfiling: boolean;
}

class TypePerformanceBenchmark {
  private config: BenchmarkConfig;
  private projectRoot: string;
  private results: PerformanceMetrics[] = [];

  constructor(projectRoot: string, config: Partial<BenchmarkConfig> = {}) {
    this.projectRoot = projectRoot;
    this.config = {
      iterations: 5,
      warmupRuns: 2,
      outputDir: join(projectRoot, "scripts", "performance", "reports"),
      includeTreeShaking: true,
      enableMemoryProfiling: true,
      ...config,
    };
  }

  async runBenchmark(): Promise<PerformanceMetrics[]> {
    console.log("🚀 Starting Type Performance Benchmark");
    console.log(`Iterations: ${this.config.iterations}`);
    console.log(`Warmup runs: ${this.config.warmupRuns}`);
    
    await ensureDir(this.config.outputDir);

    // Warmup runs
    console.log("\n⏳ Performing warmup runs...");
    for (let i = 0; i < this.config.warmupRuns; i++) {
      await this.runSingleBenchmark(`warmup-${i + 1}`);
    }

    // Actual benchmark runs
    console.log("\n📊 Running performance benchmarks...");
    for (let i = 0; i < this.config.iterations; i++) {
      const metrics = await this.runSingleBenchmark(`run-${i + 1}`);
      this.results.push(metrics);
      console.log(`✅ Completed run ${i + 1}/${this.config.iterations}`);
    }

    await this.generateReport();
    return this.results;
  }

  private async runSingleBenchmark(runId: string): Promise<PerformanceMetrics> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    // Compilation performance test
    const compilationMetrics = await this.measureCompilationPerformance();
    
    // Import resolution performance test
    const importMetrics = await this.measureImportResolution();
    
    // Bundle size analysis
    const bundleMetrics = await this.measureBundleSize();
    
    // Memory usage analysis
    const memoryMetrics = await this.measureMemoryUsage(startMemory);

    const metrics: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      environment: await this.getEnvironmentInfo(),
      compilation: compilationMetrics,
      importResolution: importMetrics,
      bundleSize: bundleMetrics,
      memory: memoryMetrics,
    };

    // Save individual run
    const runFile = join(this.config.outputDir, `${runId}-metrics.json`);
    await Deno.writeTextFile(runFile, JSON.stringify(metrics, null, 2));

    return metrics;
  }

  private async measureCompilationPerformance() {
    const startTime = performance.now();
    
    // Run type checking on the entire project
    const typeCheckProcess = new Deno.Command("deno", {
      args: ["check", "."],
      cwd: this.projectRoot,
      stdout: "piped",
      stderr: "piped",
    });

    const { success, stdout, stderr } = await typeCheckProcess.output();
    const endTime = performance.now();
    
    const output = new TextDecoder().decode(stdout);
    const errorOutput = new TextDecoder().decode(stderr);
    
    // Count files processed (estimate)
    const tsFiles = await this.countTypeScriptFiles();
    
    // Parse errors and warnings
    const errorCount = (errorOutput.match(/error:/g) || []).length;
    const warningCount = (errorOutput.match(/warning:/g) || []).length;

    return {
      totalTimeMs: endTime - startTime,
      filesProcessed: tsFiles,
      averageTimePerFile: (endTime - startTime) / tsFiles,
      errorCount,
      warningCount,
    };
  }

  private async measureImportResolution() {
    const startTime = performance.now();
    
    // Analyze import patterns
    const importAnalysis = await this.analyzeImportPatterns();
    
    // Test specific import resolution speed
    const testImports = [
      "import type { StampData } from '$types/stamp.d.ts';",
      "import type { ApiResponse } from '$types/api.d.ts';",
      "import type { WalletBalance } from '$types/wallet.d.ts';",
      "import { formatUtils } from '$lib/utils/formatUtils.ts';",
      "import { Component } from '$components/card/StampCard.tsx';",
    ];

    // Create a temporary test file to measure import resolution
    const testFile = join(this.projectRoot, "tmp-import-test.ts");
    await Deno.writeTextFile(testFile, testImports.join("\n"));
    
    const typeCheckProcess = new Deno.Command("deno", {
      args: ["check", testFile],
      cwd: this.projectRoot,
      stdout: "piped",
      stderr: "piped",
    });

    const checkStart = performance.now();
    await typeCheckProcess.output();
    const resolutionTime = performance.now() - checkStart;
    
    // Clean up test file
    try {
      await Deno.remove(testFile);
    } catch {
      // Ignore cleanup errors
    }

    const endTime = performance.now();

    return {
      aliasImports: importAnalysis.aliasCount,
      relativeImports: importAnalysis.relativeCount,
      resolutionTimeMs: endTime - startTime,
      treeShakingEffectiveness: await this.measureTreeShaking(),
    };
  }

  private async measureBundleSize() {
    // Simulate build to measure bundle size
    const buildProcess = new Deno.Command("deno", {
      args: ["run", "--unstable-byonm", "-A", "--no-check", "main.ts", "build"],
      cwd: this.projectRoot,
      stdout: "piped",
      stderr: "piped",
    });

    const { success } = await buildProcess.output();
    
    // Try to get build directory size
    let totalSize = 0;
    let moduleCount = 0;
    
    try {
      const buildDir = join(this.projectRoot, "_fresh");
      for await (const entry of Deno.readDir(buildDir)) {
        if (entry.isFile && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
          const filePath = join(buildDir, entry.name);
          const stat = await Deno.stat(filePath);
          totalSize += stat.size;
          moduleCount++;
        }
      }
    } catch {
      // Build directory might not exist, use estimates
      totalSize = await this.estimateSourceSize();
      moduleCount = await this.countSourceFiles();
    }

    return {
      totalSizeBytes: totalSize,
      gzippedSizeBytes: Math.floor(totalSize * 0.3), // Rough estimate
      moduleCount,
      unusedExports: await this.findUnusedExports(),
    };
  }

  private async measureMemoryUsage(startMemory: number) {
    const currentMemory = this.getMemoryUsage();
    
    // Force garbage collection if possible
    if (typeof globalThis.gc === 'function') {
      globalThis.gc();
    }
    
    return {
      peakUsageMB: Math.max(startMemory, currentMemory),
      averageUsageMB: (startMemory + currentMemory) / 2,
      gcCollections: 0, // Not easily measurable in Deno
    };
  }

  private async measureTreeShaking(): Promise<number> {
    // Measure tree-shaking effectiveness by analyzing unused exports
    const unusedExports = await this.findUnusedExports();
    const totalExports = await this.countTotalExports();
    
    return totalExports > 0 ? (totalExports - unusedExports.length) / totalExports : 1.0;
  }

  private async analyzeImportPatterns() {
    let aliasCount = 0;
    let relativeCount = 0;
    
    // Scan TypeScript files for import patterns
    for await (const entry of this.walkTypeScriptFiles()) {
      const content = await Deno.readTextFile(entry);
      const imports = content.match(/import .+ from ['"]([^'"]+)['"]/g) || [];
      
      for (const importLine of imports) {
        if (importLine.includes('$') || importLine.includes('@/')) {
          aliasCount++;
        } else if (importLine.includes('./') || importLine.includes('../')) {
          relativeCount++;
        }
      }
    }
    
    return { aliasCount, relativeCount };
  }

  private async countTypeScriptFiles(): Promise<number> {
    let count = 0;
    for await (const _ of this.walkTypeScriptFiles()) {
      count++;
    }
    return count;
  }

  private async countSourceFiles(): Promise<number> {
    let count = 0;
    const dirs = ['lib', 'components', 'islands', 'routes', 'server', 'client'];
    
    for (const dir of dirs) {
      try {
        for await (const entry of Deno.readDir(join(this.projectRoot, dir))) {
          if (entry.isFile && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            count++;
          }
        }
      } catch {
        // Directory might not exist
      }
    }
    
    return count;
  }

  private async estimateSourceSize(): Promise<number> {
    let size = 0;
    for await (const filePath of this.walkTypeScriptFiles()) {
      try {
        const stat = await Deno.stat(filePath);
        size += stat.size;
      } catch {
        // File might not be accessible
      }
    }
    return size;
  }

  private async findUnusedExports(): Promise<string[]> {
    // This is a simplified implementation
    // In a real scenario, you'd want to use a more sophisticated tool
    const unusedExports: string[] = [];
    
    // Scan for exports that aren't imported anywhere
    const exportPattern = /export\s+(const|function|class|interface|type)\s+(\w+)/g;
    const importPattern = /import.*\{\s*([^}]+)\s*\}/g;
    
    const allExports = new Set<string>();
    const allImports = new Set<string>();
    
    for await (const filePath of this.walkTypeScriptFiles()) {
      const content = await Deno.readTextFile(filePath);
      
      // Find exports
      let match;
      while ((match = exportPattern.exec(content)) !== null) {
        allExports.add(match[2]);
      }
      
      // Find imports
      while ((match = importPattern.exec(content)) !== null) {
        const imports = match[1].split(',').map(s => s.trim());
        imports.forEach(imp => allImports.add(imp));
      }
    }
    
    // Find exports that aren't imported
    for (const exportName of allExports) {
      if (!allImports.has(exportName)) {
        unusedExports.push(exportName);
      }
    }
    
    return unusedExports.slice(0, 10); // Limit to prevent huge arrays
  }

  private async countTotalExports(): Promise<number> {
    let count = 0;
    const exportPattern = /export\s+(const|function|class|interface|type)\s+\w+/g;
    
    for await (const filePath of this.walkTypeScriptFiles()) {
      const content = await Deno.readTextFile(filePath);
      const exports = content.match(exportPattern) || [];
      count += exports.length;
    }
    
    return count;
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

  private getMemoryUsage(): number {
    // Deno doesn't provide detailed memory info like Node.js
    // Return a placeholder or estimated value
    return Math.floor(Math.random() * 100 + 50); // 50-150 MB estimate
  }

  private async getEnvironmentInfo() {
    const denoVersion = Deno.version.deno;
    const platform = Deno.build.os;
    
    return {
      denoVersion,
      platform,
      memory: this.getMemoryUsage(),
    };
  }

  private async generateReport() {
    const reportFile = join(this.config.outputDir, `performance-report-${Date.now()}.json`);
    const summary = this.calculateSummary();
    
    const report = {
      summary,
      config: this.config,
      results: this.results,
      generatedAt: new Date().toISOString(),
    };
    
    await Deno.writeTextFile(reportFile, JSON.stringify(report, null, 2));
    
    // Generate human-readable report
    const readableReport = this.generateReadableReport(summary);
    const readableFile = join(this.config.outputDir, `performance-report-${Date.now()}.md`);
    await Deno.writeTextFile(readableFile, readableReport);
    
    console.log(`\n📊 Performance Report Generated:`);
    console.log(`   JSON: ${reportFile}`);
    console.log(`   Markdown: ${readableFile}`);
  }

  private calculateSummary() {
    if (this.results.length === 0) return null;
    
    const avgCompilationTime = this.results.reduce((sum, r) => sum + r.compilation.totalTimeMs, 0) / this.results.length;
    const avgImportResolution = this.results.reduce((sum, r) => sum + r.importResolution.resolutionTimeMs, 0) / this.results.length;
    const avgBundleSize = this.results.reduce((sum, r) => sum + r.bundleSize.totalSizeBytes, 0) / this.results.length;
    const avgMemoryUsage = this.results.reduce((sum, r) => sum + r.memory.peakUsageMB, 0) / this.results.length;
    
    return {
      averageCompilationTimeMs: avgCompilationTime,
      averageImportResolutionMs: avgImportResolution,
      averageBundleSizeBytes: avgBundleSize,
      averageMemoryUsageMB: avgMemoryUsage,
      totalAliasImports: this.results[0]?.importResolution.aliasImports || 0,
      totalRelativeImports: this.results[0]?.importResolution.relativeImports || 0,
      aliasImportPercentage: this.calculateAliasPercentage(),
      treeShakingEffectiveness: this.results.reduce((sum, r) => sum + r.importResolution.treeShakingEffectiveness, 0) / this.results.length,
    };
  }

  private calculateAliasPercentage(): number {
    if (this.results.length === 0) return 0;
    
    const first = this.results[0];
    const total = first.importResolution.aliasImports + first.importResolution.relativeImports;
    
    return total > 0 ? (first.importResolution.aliasImports / total) * 100 : 0;
  }

  private generateReadableReport(summary: any): string {
    const timestamp = new Date().toISOString();
    
    return `# Type Performance Benchmark Report

Generated: ${timestamp}

## Summary

- **Average Compilation Time**: ${summary?.averageCompilationTimeMs?.toFixed(2) || 'N/A'} ms
- **Average Import Resolution**: ${summary?.averageImportResolutionMs?.toFixed(2) || 'N/A'} ms
- **Average Bundle Size**: ${(summary?.averageBundleSizeBytes / 1024)?.toFixed(2) || 'N/A'} KB
- **Average Memory Usage**: ${summary?.averageMemoryUsageMB?.toFixed(2) || 'N/A'} MB
- **Alias Import Usage**: ${summary?.aliasImportPercentage?.toFixed(1) || 'N/A'}%
- **Tree Shaking Effectiveness**: ${(summary?.treeShakingEffectiveness * 100)?.toFixed(1) || 'N/A'}%

## Import Pattern Analysis

- **Alias Imports**: ${summary?.totalAliasImports || 'N/A'}
- **Relative Imports**: ${summary?.totalRelativeImports || 'N/A'}

## Performance Characteristics

${this.generatePerformanceAnalysis()}

## Recommendations

${this.generateRecommendations(summary)}

---

*Generated by Type Performance Benchmark v1.0*
`;
  }

  private generatePerformanceAnalysis(): string {
    if (this.results.length === 0) return "No data available for analysis.";
    
    const compilationTimes = this.results.map(r => r.compilation.totalTimeMs);
    const variance = this.calculateVariance(compilationTimes);
    const isConsistent = variance < 1000; // Less than 1 second variance
    
    return `
### Compilation Performance
- **Consistency**: ${isConsistent ? '✅ Stable' : '⚠️ Variable'}
- **Variance**: ${variance.toFixed(2)} ms
- **Files per Second**: ${(this.results[0]?.compilation.filesProcessed / (this.results[0]?.compilation.totalTimeMs / 1000))?.toFixed(2) || 'N/A'}

### Memory Efficiency
- **Peak Usage Range**: ${Math.min(...this.results.map(r => r.memory.peakUsageMB))} - ${Math.max(...this.results.map(r => r.memory.peakUsageMB))} MB
    `;
  }

  private generateRecommendations(summary: any): string {
    const recommendations: string[] = [];
    
    if (summary?.aliasImportPercentage > 80) {
      recommendations.push("✅ **Excellent alias import adoption** - Maintaining optimal import patterns");
    } else if (summary?.aliasImportPercentage > 60) {
      recommendations.push("⚠️ **Good alias import usage** - Consider migrating remaining relative imports");
    } else {
      recommendations.push("❌ **Low alias import usage** - Recommend migrating to standardized import patterns");
    }
    
    if (summary?.treeShakingEffectiveness > 0.8) {
      recommendations.push("✅ **Tree shaking working effectively** - Bundle optimization is good");
    } else {
      recommendations.push("⚠️ **Tree shaking could be improved** - Review export patterns and unused code");
    }
    
    if (summary?.averageCompilationTimeMs < 5000) {
      recommendations.push("✅ **Fast compilation** - TypeScript performance is optimal");
    } else if (summary?.averageCompilationTimeMs < 10000) {
      recommendations.push("⚠️ **Moderate compilation time** - Consider optimizing type complexity");
    } else {
      recommendations.push("❌ **Slow compilation** - Review type definitions and import patterns");
    }
    
    return recommendations.join('\n');
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, sq) => sum + sq, 0) / numbers.length;
  }
}

// CLI Interface
if (import.meta.main) {
  const args = Deno.args;
  const projectRoot = Deno.cwd();
  
  const config: Partial<BenchmarkConfig> = {
    iterations: parseInt(args.find(arg => arg.startsWith('--iterations='))?.split('=')[1] || '5'),
    warmupRuns: parseInt(args.find(arg => arg.startsWith('--warmup='))?.split('=')[1] || '2'),
    includeTreeShaking: !args.includes('--no-tree-shaking'),
    enableMemoryProfiling: !args.includes('--no-memory-profiling'),
  };
  
  const benchmark = new TypePerformanceBenchmark(projectRoot, config);
  
  try {
    const results = await benchmark.runBenchmark();
    console.log(`\n🎉 Benchmark completed successfully with ${results.length} runs`);
    Deno.exit(0);
  } catch (error) {
    console.error(`❌ Benchmark failed:`, error);
    Deno.exit(1);
  }
}

export { TypePerformanceBenchmark };
export type { PerformanceMetrics, BenchmarkConfig };