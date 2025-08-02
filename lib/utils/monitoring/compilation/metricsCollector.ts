/**
 * TypeScript Compilation Metrics Collector
 * Task 35.3 - Create Compilation Performance Tracking Infrastructure
 *
 * Collects detailed metrics during TypeScript compilation using Deno's APIs
 * and integrates with the performance tracking system.
 */

import type { CompilationContext } from "$types/ui.d.ts";
import { logger } from "$lib/utils/logger.ts";
import type {
  CompilationError,
  CompilationMetrics,
  CompilerConfiguration,
  FileCompilationMetrics,
  GCMetrics,
  ImportPatternMetrics,
  MemoryUsage,
  PerformanceFlags,
} from "./performanceTracker.ts";

/**
 * Compilation Metrics Collector
 *
 * Collects real-time metrics during TypeScript compilation using Deno's
 * performance and memory APIs.
 */
export class CompilationMetricsCollector {
  private activeContexts: Map<string, CompilationContext> = new Map();
  private memoryCheckInterval: number | null = null;

  private readonly MEMORY_CHECK_INTERVAL_MS = 100;

  /**
   * Start collecting metrics for a compilation session
   */
  startCollection(sessionId: string, files: string[]): CompilationContext {
    const config = this.getCompilerConfiguration();

    const context: CompilationContext = {
      sessionId,
      startTime: performance.now(),
      files,
      config,
      memorySnapshots: [this.getCurrentMemoryUsage()],
      fileMetrics: new Map(),
    };

    this.activeContexts.set(sessionId, context);
    this.startMemoryMonitoring(sessionId);

    logger.info(
      "system",
      {
        message:
          `[metrics-collector] Started collection for session: ${sessionId} (${files.length} files)`,
      },
    );

    return context;
  }

  /**
   * Record file-level compilation metrics
   */
  recordFileMetrics(
    sessionId: string,
    filePath: string,
    processingTime: number,
    size: number,
    dependencyCount: number,
  ): void {
    const context = this.activeContexts.get(sessionId);
    if (!context) {
      logger.warn(
        "system",
        {
          message:
            `[metrics-collector] No active context for session: ${sessionId}`,
        },
      );
      return;
    }

    const importPatterns = this.analyzeImportPatterns(filePath);

    const fileMetrics: FileCompilationMetrics = {
      filePath,
      size,
      processingTime,
      dependencyCount,
      typeCheckTime: processingTime * 0.7, // Estimate type checking time
      usesDomainImports: importPatterns.domainImports > 0,
      importPatterns,
    };

    context.fileMetrics.set(filePath, fileMetrics);

    logger.debug(
      "system",
      {
        message:
          `[metrics-collector] Recorded file metrics: ${filePath} (${processingTime}ms)`,
      },
    );
  }

  /**
   * Finish collection and generate compilation metrics
   */
  async finishCollection(
    sessionId: string,
    success: boolean,
    errors?: CompilationError[],
  ): Promise<CompilationMetrics> {
    const context = this.activeContexts.get(sessionId);
    if (!context) {
      throw new Error(`No active context for session: ${sessionId}`);
    }

    this.stopMemoryMonitoring();

    const endTime = performance.now();
    const duration = endTime - context.startTime;

    // Calculate memory usage
    const memoryUsage = this.calculateMemoryUsage(context.memorySnapshots);

    // Calculate performance flags
    const performanceFlags = this.calculatePerformanceFlags(context);

    // Collect file metrics
    const fileMetrics = Array.from(
      context.fileMetrics.values(),
    ) as FileCompilationMetrics[];

    const metrics: CompilationMetrics = {
      sessionId,
      startTime: context.startTime,
      endTime,
      duration,
      memoryUsage,
      fileMetrics,
      compilerConfig: context.config,
      performanceFlags,
      errors,
      success,
    };

    this.activeContexts.delete(sessionId);

    logger.info(
      "system",
      {
        message:
          `[metrics-collector] Finished collection for session: ${sessionId} (${
            duration.toFixed(1)
          }ms)`,
      },
    );

    return metrics;
  }

  /**
   * Get current compiler configuration
   */
  private getCompilerConfiguration(): CompilerConfiguration {
    const tsVersion = "5.6.3"; // Deno 2.4+ TypeScript version
    const denoVersion = Deno.version.deno;

    return {
      tsVersion,
      denoVersion,
      target: "ES2022",
      moduleResolution: "bundler",
      strict: true,
      incremental: true,
    };
  }

  /**
   * Start monitoring memory usage during compilation
   */
  private startMemoryMonitoring(sessionId: string): void {
    this.memoryCheckInterval = setInterval(() => {
      const context = this.activeContexts.get(sessionId);
      if (context) {
        context.memorySnapshots.push(this.getCurrentMemoryUsage());
      }
    }, this.MEMORY_CHECK_INTERVAL_MS);
  }

  /**
   * Stop memory monitoring
   */
  private stopMemoryMonitoring(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }

  /**
   * Get current memory usage in MB
   */
  private getCurrentMemoryUsage(): number {
    try {
      // Deno 2.4+ memory usage API
      const memInfo = Deno.memoryUsage();
      return memInfo.rss / 1024 / 1024; // Convert to MB
    } catch {
      // Fallback for older Deno versions
      return 0;
    }
  }

  /**
   * Calculate memory usage statistics
   */
  private calculateMemoryUsage(snapshots: number[]): MemoryUsage {
    if (snapshots.length === 0) {
      return {
        peak: 0,
        average: 0,
        initial: 0,
        final: 0,
        gcMetrics: { cycles: 0, totalTime: 0, memoryFreed: 0 },
      };
    }

    const peak = Math.max(...snapshots);
    const average = snapshots.reduce((sum, val) => sum + val, 0) /
      snapshots.length;
    const initial = snapshots[0];
    const final = snapshots[snapshots.length - 1];

    // Estimate GC metrics based on memory patterns
    const gcMetrics = this.estimateGCMetrics(snapshots);

    return {
      peak,
      average,
      initial,
      final,
      gcMetrics,
    };
  }

  /**
   * Estimate garbage collection metrics from memory snapshots
   */
  private estimateGCMetrics(snapshots: number[]): GCMetrics {
    let cycles = 0;
    let totalTime = 0;
    let memoryFreed = 0;

    // Detect GC cycles by looking for significant memory drops
    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i - 1];
      const current = snapshots[i];
      const drop = prev - current;

      if (drop > 5) { // 5MB drop indicates potential GC
        cycles++;
        memoryFreed += drop;
        totalTime += this.MEMORY_CHECK_INTERVAL_MS; // Rough estimate
      }
    }

    return {
      cycles,
      totalTime,
      memoryFreed,
    };
  }

  /**
   * Calculate performance flags and metrics
   */
  private calculatePerformanceFlags(
    context: CompilationContext,
  ): PerformanceFlags {
    const totalFiles = context.files.length;
    const processedFiles = context.fileMetrics.size;

    // Estimate cache effectiveness based on processing patterns
    const avgProcessingTime = Array.from(context.fileMetrics.values())
      .reduce((sum, fm) => sum + (fm.processingTime || 0), 0) / processedFiles;

    // Files processed very quickly likely came from cache
    const quickFiles = Array.from(context.fileMetrics.values())
      .filter((fm) => (fm.processingTime || 0) < avgProcessingTime * 0.5)
      .length;

    const cacheEffectiveness = processedFiles > 0
      ? quickFiles / processedFiles
      : 0;

    return {
      incrementalUsed: true, // Deno uses incremental compilation by default
      cacheEffectiveness,
      recompiledFiles: processedFiles - quickFiles,
      cachedFiles: quickFiles,
      parallelization: Math.min(navigator.hardwareConcurrency || 4, totalFiles),
    };
  }

  /**
   * Analyze import patterns in a file
   */
  private analyzeImportPatterns(filePath: string): ImportPatternMetrics {
    try {
      const startTime = performance.now();
      const content = Deno.readTextFileSync(filePath);
      const lines = content.split("\n");

      let domainImports = 0;
      let legacyImports = 0;
      let relativeImports = 0;

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("import") || trimmed.startsWith("export")) {
          if (trimmed.includes('from "$')) {
            if (trimmed.includes('from "$globals"')) {
              legacyImports++;
            } else {
              domainImports++;
            }
          } else if (
            trimmed.includes('from "./') || trimmed.includes('from "../')
          ) {
            relativeImports++;
          }
        }
      }

      const resolutionTime = performance.now() - startTime;

      return {
        domainImports,
        legacyImports,
        relativeImports,
        resolutionTime,
      };
    } catch (error) {
      logger.warn(
        "system",
        {
          message:
            `[metrics-collector] Failed to analyze imports for ${filePath}: ${error.message}`,
        },
      );
      return {
        domainImports: 0,
        legacyImports: 0,
        relativeImports: 0,
        resolutionTime: 0,
      };
    }
  }
}

/**
 * Deno Check Command Wrapper
 *
 * Wraps the `deno check` command to collect compilation metrics.
 */
export class DenoCheckWrapper {
  private metricsCollector = new CompilationMetricsCollector();

  /**
   * Run type checking with metrics collection
   */
  async runTypeCheck(
    files?: string[],
    options: {
      noCheck?: boolean;
      remote?: boolean;
      config?: string;
    } = {},
  ): Promise<{
    success: boolean;
    metrics: CompilationMetrics;
    output: string;
    errors: CompilationError[];
  }> {
    const sessionId = `typecheck_${Date.now()}_${
      Math.random().toString(36).substr(2, 9)
    }`;

    // Determine files to check
    const filesToCheck = files || await this.getAllTypeScriptFiles();

    // Start metrics collection
    this.metricsCollector.startCollection(
      sessionId,
      filesToCheck,
    );

    let success = false;
    let output = "";
    let errors: CompilationError[] = [];

    try {
      // Build command arguments
      const args = ["check"];

      if (options.noCheck) args.push("--no-check");
      if (options.remote) args.push("--no-remote");
      if (options.config) args.push("--config", options.config);

      if (files && files.length > 0) {
        args.push(...files);
      } else {
        args.push("."); // Check entire project
      }

      // Record start time for each file
      const fileStartTimes = new Map<string, number>();
      filesToCheck.forEach((file) => {
        fileStartTimes.set(file, performance.now());
      });

      // Execute type checking
      const command = new Deno.Command("deno", {
        args,
        stdout: "piped",
        stderr: "piped",
        cwd: Deno.cwd(),
      });

      const startTime = performance.now();
      const result = await command.output();
      const endTime = performance.now();

      success = result.code === 0;

      const decoder = new TextDecoder();
      output = decoder.decode(result.stdout);
      const errorOutput = decoder.decode(result.stderr);

      // Parse errors from stderr
      if (!success && errorOutput) {
        errors = this.parseTypeScriptErrors(errorOutput);
      }

      // Record file metrics (estimated based on file sizes)
      for (const file of filesToCheck) {
        try {
          const stat = await Deno.stat(file);
          const processingTime = (endTime - startTime) / filesToCheck.length; // Rough estimate
          const dependencyCount = await this.estimateDependencyCount(file);

          this.metricsCollector.recordFileMetrics(
            sessionId,
            file,
            processingTime,
            stat.size,
            dependencyCount,
          );
        } catch (error) {
          logger.warn(
            "system",
            {
              message:
                `[deno-check-wrapper] Failed to collect metrics for ${file}: ${error.message}`,
            },
          );
        }
      }
    } catch (error) {
      logger.error(
        "system",
        {
          message:
            `[deno-check-wrapper] Type checking failed: ${error.message}`,
        },
      );
      errors.push({
        message: error.message,
        category: "configuration",
      });
    }

    // Finish metrics collection
    const metrics = await this.metricsCollector.finishCollection(
      sessionId,
      success,
      errors,
    );

    return {
      success,
      metrics,
      output,
      errors,
    };
  }

  /**
   * Get all TypeScript files in the project
   */
  private async getAllTypeScriptFiles(): Promise<string[]> {
    const files: string[] = [];

    try {
      const command = new Deno.Command("find", {
        args: [
          ".",
          "-type",
          "f",
          "(",
          "-name",
          "*.ts",
          "-o",
          "-name",
          "*.tsx",
          ")",
          "-not",
          "-path",
          "./node_modules/*",
          "-not",
          "-path",
          "./_fresh/*",
          "-not",
          "-path",
          "./.git/*",
          "-not",
          "-path",
          "./coverage/*",
          "-not",
          "-path",
          "./tmp/*",
          "-not",
          "-path",
          "./.taskmaster/*",
        ],
        stdout: "piped",
      });

      const result = await command.output();
      if (result.code === 0) {
        const output = new TextDecoder().decode(result.stdout);
        files.push(...output.split("\n").filter((f) => f.trim().length > 0));
      }
    } catch (error) {
      logger.warn(
        "system",
        {
          message:
            `[deno-check-wrapper] Failed to enumerate TypeScript files: ${error.message}`,
        },
      );
    }

    return files;
  }

  /**
   * Parse TypeScript errors from compiler output
   */
  private parseTypeScriptErrors(errorOutput: string): CompilationError[] {
    const errors: CompilationError[] = [];
    const lines = errorOutput.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("Check file:")) continue;

      // Pattern: error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
      const errorMatch = trimmed.match(
        /^(.+?):(\d+):(\d+) - error TS\d+: (.+)$/,
      );
      if (errorMatch) {
        const [, file, line, column, message] = errorMatch;
        errors.push({
          message,
          file,
          line: parseInt(line, 10),
          column: parseInt(column, 10),
          category: "type",
        });
        continue;
      }

      // Pattern: error: Module not found "some-module"
      const moduleErrorMatch = trimmed.match(/^error: (.+)$/);
      if (moduleErrorMatch) {
        errors.push({
          message: moduleErrorMatch[1],
          category: "import",
        });
        continue;
      }

      // Generic error pattern
      if (trimmed.includes("error")) {
        errors.push({
          message: trimmed,
          category: "syntax",
        });
      }
    }

    return errors;
  }

  /**
   * Estimate dependency count for a file
   */
  private async estimateDependencyCount(filePath: string): Promise<number> {
    try {
      const content = await Deno.readTextFile(filePath);
      const importLines = content
        .split("\n")
        .filter((line) => line.trim().startsWith("import"))
        .length;

      return importLines;
    } catch {
      return 0;
    }
  }
}

/**
 * Global Deno check wrapper instance
 */
export const denoCheckWrapper = new DenoCheckWrapper();
