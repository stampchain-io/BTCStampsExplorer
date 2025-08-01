/**
 * TypeScript Compilation Performance Tracking Infrastructure
 * Task 35.3 - Create Compilation Performance Tracking Infrastructure
 *
 * Comprehensive performance metrics collection system for TypeScript compilation
 * with baseline measurements and regression detection capabilities.
 */

import type { BaselineStatistics } from "$types/utils.d.ts";
import { logger } from "$lib/utils/logger.ts";
import type { ProjectState } from "$types/ui.d.ts";

export interface CompilationMetrics {
  /** Compilation session identifier */
  sessionId: string;
  /** Timestamp when compilation started */
  startTime: number;
  /** Timestamp when compilation finished */
  endTime: number;
  /** Total compilation time in milliseconds */
  duration: number;
  /** Memory usage during compilation (in MB) */
  memoryUsage: MemoryUsage;
  /** File-level compilation metrics */
  fileMetrics: FileCompilationMetrics[];
  /** TypeScript compiler configuration */
  compilerConfig: CompilerConfiguration;
  /** Performance flags and indicators */
  performanceFlags: PerformanceFlags;
  /** Error information if compilation failed */
  errors?: CompilationError[];
  /** Success indicator */
  success: boolean;
}

export interface MemoryUsage {
  /** Peak memory usage during compilation */
  peak: number;
  /** Average memory usage */
  average: number;
  /** Memory at compilation start */
  initial: number;
  /** Memory at compilation end */
  final: number;
  /** Garbage collection metrics */
  gcMetrics: GCMetrics;
}

export interface GCMetrics {
  /** Number of GC cycles during compilation */
  cycles: number;
  /** Total time spent in GC */
  totalTime: number;
  /** Memory freed by GC */
  memoryFreed: number;
}

export interface FileCompilationMetrics {
  /** File path relative to project root */
  filePath: string;
  /** File size in bytes */
  size: number;
  /** Time to process this file */
  processingTime: number;
  /** Number of dependencies */
  dependencyCount: number;
  /** Type checking time for this file */
  typeCheckTime: number;
  /** Whether this file uses domain-specific imports */
  usesDomainImports: boolean;
  /** Import pattern classification */
  importPatterns: ImportPatternMetrics;
}

export interface ImportPatternMetrics {
  /** Count of domain-specific imports */
  domainImports: number;
  /** Count of legacy $globals imports */
  legacyImports: number;
  /** Count of relative imports */
  relativeImports: number;
  /** Import resolution time */
  resolutionTime: number;
}

export interface CompilerConfiguration {
  /** TypeScript version */
  tsVersion: string;
  /** Deno version */
  denoVersion: string;
  /** Compilation target */
  target: string;
  /** Module resolution strategy */
  moduleResolution: string;
  /** Strict mode enabled */
  strict: boolean;
  /** Incremental compilation enabled */
  incremental: boolean;
}

export interface PerformanceFlags {
  /** Incremental compilation used */
  incrementalUsed: boolean;
  /** Cache effectiveness percentage */
  cacheEffectiveness: number;
  /** Number of files recompiled vs cached */
  recompiledFiles: number;
  /** Number of files served from cache */
  cachedFiles: number;
  /** Type checking parallelization factor */
  parallelization: number;
}

export interface CompilationError {
  /** Error message */
  message: string;
  /** File where error occurred */
  file?: string;
  /** Line number */
  line?: number;
  /** Column number */
  column?: number;
  /** Error category */
  category: "syntax" | "type" | "import" | "configuration";
}

export interface PerformanceBaseline {
  /** Baseline identifier */
  id: string;
  /** Creation timestamp */
  createdAt: number;
  /** Project configuration at time of baseline */
  projectState: ProjectState;
  /** Average metrics across multiple runs */
  averageMetrics: CompilationMetrics;
  /** Statistical data */
  statistics: BaselineStatistics;
}

export interface PerformanceRegression {
  /** Regression identifier */
  id: string;
  /** Detection timestamp */
  detectedAt: number;
  /** Type of regression detected */
  type: "time" | "memory" | "cache" | "errors";
  /** Severity level */
  severity: "low" | "medium" | "high" | "critical";
  /** Current metrics that triggered regression */
  currentMetrics: CompilationMetrics;
  /** Baseline being compared against */
  baseline: PerformanceBaseline;
  /** Regression magnitude (percentage increase) */
  magnitude: number;
  /** Suggested remediation actions */
  remediation: string[];
  /** Whether regression has been resolved */
  resolved: boolean;
}

/**
 * Compilation Performance Tracker
 *
 * Tracks TypeScript compilation performance, maintains baselines,
 * and detects performance regressions.
 */
export class CompilationPerformanceTracker {
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private recentMetrics: CompilationMetrics[] = [];
  private regressions: Map<string, PerformanceRegression> = new Map();

  private readonly METRICS_RETENTION_LIMIT = 100;
  private readonly REGRESSION_THRESHOLDS = {
    time: 0.20, // 20% increase in compilation time
    memory: 0.30, // 30% increase in memory usage
    cache: 0.15, // 15% decrease in cache effectiveness
    errors: 0.10, // 10% increase in error rate
  };

  /**
   * Start tracking a compilation session
   */
  startCompilationTracking(): string {
    const sessionId = `comp_${Date.now()}_${
      Math.random().toString(36).substr(2, 9)
    }`;

    logger.info(
      `[performance-tracker] Starting compilation tracking: ${sessionId}`,
    );

    return sessionId;
  }

  /**
   * Record compilation metrics
   */
  async recordCompilationMetrics(metrics: CompilationMetrics): Promise<void> {
    // Store metrics
    this.recentMetrics.push(metrics);

    // Maintain retention limit
    if (this.recentMetrics.length > this.METRICS_RETENTION_LIMIT) {
      this.recentMetrics.shift();
    }

    // Check for regressions
    await this.checkForRegressions(metrics);

    // Log performance summary
    this.logPerformanceSummary(metrics);

    logger.info(
      `[performance-tracker] Recorded metrics for session: ${metrics.sessionId}`,
    );
  }

  /**
   * Create or update performance baseline
   */
  async createBaseline(
    id: string,
    projectState: ProjectState,
    sampleMetrics: CompilationMetrics[],
  ): Promise<PerformanceBaseline> {
    if (sampleMetrics.length === 0) {
      throw new Error("Cannot create baseline with no sample metrics");
    }

    // Calculate average metrics
    const averageMetrics = this.calculateAverageMetrics(sampleMetrics);

    // Calculate statistics
    const statistics = this.calculateStatistics(sampleMetrics);

    const baseline: PerformanceBaseline = {
      id,
      createdAt: Date.now(),
      projectState,
      averageMetrics,
      statistics,
    };

    this.baselines.set(id, baseline);

    logger.info(
      `[performance-tracker] Created baseline: ${id} (${sampleMetrics.length} samples)`,
    );

    return baseline;
  }

  /**
   * Get current performance baselines
   */
  getBaselines(): PerformanceBaseline[] {
    return Array.from(this.baselines.values());
  }

  /**
   * Get recent compilation metrics
   */
  getRecentMetrics(limit?: number): CompilationMetrics[] {
    const metrics = [...this.recentMetrics].reverse(); // Most recent first
    return limit ? metrics.slice(0, limit) : metrics;
  }

  /**
   * Get performance regressions
   */
  getRegressions(resolved?: boolean): PerformanceRegression[] {
    const regressions = Array.from(this.regressions.values());
    if (resolved !== undefined) {
      return regressions.filter((r) => r.resolved === resolved);
    }
    return regressions;
  }

  /**
   * Mark regression as resolved
   */
  resolveRegression(regressionId: string): boolean {
    const regression = this.regressions.get(regressionId);
    if (regression) {
      regression.resolved = true;
      logger.info(
        `[performance-tracker] Marked regression as resolved: ${regressionId}`,
      );
      return true;
    }
    return false;
  }

  /**
   * Get compilation performance summary
   */
  getPerformanceSummary(): {
    averageCompilationTime: number;
    averageMemoryUsage: number;
    cacheEffectiveness: number;
    errorRate: number;
    recentTrend: "improving" | "stable" | "degrading";
    activeRegressions: number;
  } {
    if (this.recentMetrics.length === 0) {
      return {
        averageCompilationTime: 0,
        averageMemoryUsage: 0,
        cacheEffectiveness: 0,
        errorRate: 0,
        recentTrend: "stable",
        activeRegressions: 0,
      };
    }

    const recent = this.recentMetrics.slice(-10); // Last 10 compilations
    const averageCompilationTime =
      recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
    const averageMemoryUsage =
      recent.reduce((sum, m) => sum + m.memoryUsage.peak, 0) / recent.length;
    const cacheEffectiveness = recent.reduce(
      (sum, m) => sum + m.performanceFlags.cacheEffectiveness,
      0,
    ) / recent.length;
    const errorRate = recent.filter((m) => !m.success).length / recent.length;

    // Calculate trend
    let recentTrend: "improving" | "stable" | "degrading" = "stable";
    if (recent.length >= 5) {
      const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
      const secondHalf = recent.slice(Math.floor(recent.length / 2));

      const firstAvg = firstHalf.reduce((sum, m) => sum + m.duration, 0) /
        firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, m) => sum + m.duration, 0) /
        secondHalf.length;

      const change = (secondAvg - firstAvg) / firstAvg;
      if (change > 0.1) recentTrend = "degrading";
      else if (change < -0.1) recentTrend = "improving";
    }

    const activeRegressions = this.getRegressions(false).length;

    return {
      averageCompilationTime: Math.round(averageCompilationTime),
      averageMemoryUsage: Math.round(averageMemoryUsage),
      cacheEffectiveness: Math.round(cacheEffectiveness * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      recentTrend,
      activeRegressions,
    };
  }

  /**
   * Check for performance regressions
   */
  private async checkForRegressions(
    metrics: CompilationMetrics,
  ): Promise<void> {
    for (const baseline of this.baselines.values()) {
      const regressions = this.detectRegressions(metrics, baseline);

      for (const regression of regressions) {
        const existingRegression = Array.from(this.regressions.values())
          .find((r) => r.type === regression.type && !r.resolved);

        if (!existingRegression) {
          this.regressions.set(regression.id, regression);
          logger.warn(
            `[performance-tracker] Performance regression detected: ${regression.type} (${
              regression.magnitude.toFixed(1)
            }% increase)`,
          );
        }
      }
    }
  }

  /**
   * Detect regressions compared to baseline
   */
  private detectRegressions(
    current: CompilationMetrics,
    baseline: PerformanceBaseline,
  ): PerformanceRegression[] {
    const regressions: PerformanceRegression[] = [];

    // Check compilation time regression
    const timeIncrease = (current.duration - baseline.averageMetrics.duration) /
      baseline.averageMetrics.duration;
    if (timeIncrease > this.REGRESSION_THRESHOLDS.time) {
      regressions.push({
        id: `time_regression_${Date.now()}`,
        detectedAt: Date.now(),
        type: "time",
        severity: this.getSeverity(timeIncrease),
        currentMetrics: current,
        baseline,
        magnitude: timeIncrease * 100,
        remediation: [
          "Check for new dependencies or complex type definitions",
          "Verify incremental compilation is working properly",
          "Consider optimizing import patterns",
        ],
        resolved: false,
      });
    }

    // Check memory usage regression
    const memoryIncrease =
      (current.memoryUsage.peak - baseline.averageMetrics.memoryUsage.peak) /
      baseline.averageMetrics.memoryUsage.peak;
    if (memoryIncrease > this.REGRESSION_THRESHOLDS.memory) {
      regressions.push({
        id: `memory_regression_${Date.now()}`,
        detectedAt: Date.now(),
        type: "memory",
        severity: this.getSeverity(memoryIncrease),
        currentMetrics: current,
        baseline,
        magnitude: memoryIncrease * 100,
        remediation: [
          "Check for memory leaks in type definitions",
          "Verify garbage collection is working effectively",
          "Consider breaking up large type unions",
        ],
        resolved: false,
      });
    }

    // Check cache effectiveness regression
    const cacheDecrease =
      (baseline.averageMetrics.performanceFlags.cacheEffectiveness -
        current.performanceFlags.cacheEffectiveness) /
      baseline.averageMetrics.performanceFlags.cacheEffectiveness;
    if (cacheDecrease > this.REGRESSION_THRESHOLDS.cache) {
      regressions.push({
        id: `cache_regression_${Date.now()}`,
        detectedAt: Date.now(),
        type: "cache",
        severity: this.getSeverity(cacheDecrease),
        currentMetrics: current,
        baseline,
        magnitude: cacheDecrease * 100,
        remediation: [
          "Check if incremental compilation cache is being invalidated",
          "Verify file modification timestamps are correct",
          "Consider cache warming strategies",
        ],
        resolved: false,
      });
    }

    return regressions;
  }

  /**
   * Calculate average metrics from samples
   */
  private calculateAverageMetrics(
    samples: CompilationMetrics[],
  ): CompilationMetrics {
    const averageDuration = samples.reduce((sum, s) => sum + s.duration, 0) /
      samples.length;
    const averageMemoryPeak =
      samples.reduce((sum, s) => sum + s.memoryUsage.peak, 0) / samples.length;
    const averageCacheEffectiveness = samples.reduce(
      (sum, s) => sum + s.performanceFlags.cacheEffectiveness,
      0,
    ) / samples.length;

    // Use the most recent sample as template and override with averages
    const template = samples[samples.length - 1];

    return {
      ...template,
      duration: averageDuration,
      memoryUsage: {
        ...template.memoryUsage,
        peak: averageMemoryPeak,
      },
      performanceFlags: {
        ...template.performanceFlags,
        cacheEffectiveness: averageCacheEffectiveness,
      },
    };
  }

  /**
   * Calculate baseline statistics
   */
  private calculateStatistics(
    samples: CompilationMetrics[],
  ): BaselineStatistics {
    const durations = samples.map((s) => s.duration);
    const memoryUsages = samples.map((s) => s.memoryUsage.peak);

    const avgDuration = durations.reduce((sum, d) => sum + d, 0) /
      durations.length;
    const avgMemory = memoryUsages.reduce((sum, m) => sum + m, 0) /
      memoryUsages.length;

    const timeVariance =
      durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) /
      durations.length;
    const memoryVariance =
      memoryUsages.reduce((sum, m) => sum + Math.pow(m - avgMemory, 2), 0) /
      memoryUsages.length;

    const timeStdDev = Math.sqrt(timeVariance);
    const memoryStdDev = Math.sqrt(memoryVariance);

    // 95% confidence interval for duration
    const margin = 1.96 * (timeStdDev / Math.sqrt(samples.length));
    const confidenceInterval: [number, number] = [
      avgDuration - margin,
      avgDuration + margin,
    ];

    return {
      sampleSize: samples.length,
      timeStdDev,
      memoryStdDev,
      confidenceInterval,
    };
  }

  /**
   * Determine regression severity
   */
  private getSeverity(
    magnitude: number,
  ): "low" | "medium" | "high" | "critical" {
    if (magnitude > 1.0) return "critical";
    if (magnitude > 0.5) return "high";
    if (magnitude > 0.25) return "medium";
    return "low";
  }

  /**
   * Log performance summary
   */
  private logPerformanceSummary(metrics: CompilationMetrics): void {
    const success = metrics.success ? "✅" : "❌";
    const duration = `${metrics.duration}ms`;
    const memory = `${Math.round(metrics.memoryUsage.peak)}MB`;
    const cache = `${
      Math.round(metrics.performanceFlags.cacheEffectiveness * 100)
    }%`;

    logger.info(
      `[performance-tracker] ${success} Compilation: ${duration}, Memory: ${memory}, Cache: ${cache}`,
    );

    if (metrics.errors && metrics.errors.length > 0) {
      logger.warn(
        `[performance-tracker] Compilation errors: ${metrics.errors.length}`,
      );
    }
  }
}

/**
 * Global compilation performance tracker instance
 */
export const compilationPerformanceTracker =
  new CompilationPerformanceTracker();
