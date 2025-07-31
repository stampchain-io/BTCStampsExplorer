#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net --allow-env

/**
 * Real-Time Type Resolution Monitoring System
 * Part of Task 35.1 - TypeScript Language Service API integration
 *
 * This system provides continuous type checking and performance monitoring
 * for the Type Domain Migration using Deno's built-in TypeScript APIs.
 */

import {
  join,
  relative,
  resolve,
} from "https://deno.land/std@0.213.0/path/mod.ts";
import { createHash } from "https://deno.land/std@0.213.0/crypto/crypto.ts";

interface TypeCheckResult {
  timestamp: number;
  filePath: string;
  success: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
  memoryUsage: number;
}

interface PerformanceMetrics {
  averageCheckTime: number;
  successRate: number;
  errorCount: number;
  warningCount: number;
  memoryUsageAverage: number;
  filesChecked: number;
}

interface MonitoringConfig {
  projectRoot: string;
  outputPath: string;
  watchPatterns: string[];
  alertThresholds: {
    errorRate: number;
    averageCheckTime: number;
    memoryUsage: number;
  };
}

class RealTimeTypeChecker {
  private config: MonitoringConfig;
  private results: TypeCheckResult[] = [];
  private watcher?: Deno.FsWatcher;
  private isRunning = false;
  private startTime = Date.now();

  constructor(config: MonitoringConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    console.log("🎼 Starting Real-Time Type Resolution Monitoring System...");
    this.isRunning = true;

    // Initial type check
    await this.performFullTypeCheck();

    // Set up file watcher
    await this.setupFileWatcher();

    // Start periodic reporting
    this.startPeriodicReporting();

    console.log("✅ Real-Time Type Monitoring is now active!");
  }

  private async performFullTypeCheck(): Promise<void> {
    console.log("🔍 Performing initial full type check...");
    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();

    try {
      // Use Deno's built-in TypeScript checker
      const command = new Deno.Command("deno", {
        args: ["check", "--unstable", join(this.config.projectRoot, "**/*.ts")],
        cwd: this.config.projectRoot,
        stdout: "piped",
        stderr: "piped",
      });

      const { success, stdout, stderr } = await command.output();
      const duration = performance.now() - startTime;
      const memoryUsage = this.getMemoryUsage() - memoryBefore;

      const result: TypeCheckResult = {
        timestamp: Date.now(),
        filePath: "full-check",
        success,
        errors: success ? [] : [new TextDecoder().decode(stderr)],
        warnings: [],
        duration,
        memoryUsage,
      };

      this.results.push(result);
      await this.saveResult(result);

      if (success) {
        console.log(`✅ Full type check completed in ${duration.toFixed(2)}ms`);
      } else {
        console.log(`❌ Full type check failed in ${duration.toFixed(2)}ms`);
      }
    } catch (error) {
      console.error("❌ Type check error:", error);
    }
  }

  private async setupFileWatcher(): Promise<void> {
    try {
      this.watcher = Deno.watchFs(this.config.projectRoot, { recursive: true });

      for await (const event of this.watcher) {
        if (!this.isRunning) break;

        // Filter for TypeScript files
        const tsFiles = event.paths.filter((path) =>
          path.endsWith(".ts") || path.endsWith(".tsx") ||
          path.endsWith(".d.ts")
        );

        if (tsFiles.length > 0 && event.kind === "modify") {
          await this.checkModifiedFiles(tsFiles);
        }
      }
    } catch (error) {
      console.error("❌ File watcher error:", error);
    }
  }

  private async checkModifiedFiles(files: string[]): Promise<void> {
    for (const filePath of files) {
      await this.checkSingleFile(filePath);
    }
  }

  private async checkSingleFile(filePath: string): Promise<void> {
    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();

    try {
      const command = new Deno.Command("deno", {
        args: ["check", "--unstable", filePath],
        cwd: this.config.projectRoot,
        stdout: "piped",
        stderr: "piped",
      });

      const { success, stdout, stderr } = await command.output();
      const duration = performance.now() - startTime;
      const memoryUsage = this.getMemoryUsage() - memoryBefore;

      const result: TypeCheckResult = {
        timestamp: Date.now(),
        filePath: relative(this.config.projectRoot, filePath),
        success,
        errors: success ? [] : [new TextDecoder().decode(stderr)],
        warnings: [],
        duration,
        memoryUsage,
      };

      this.results.push(result);
      await this.saveResult(result);

      // Check thresholds and alert if necessary
      await this.checkThresholds(result);
    } catch (error) {
      console.error(`❌ Error checking ${filePath}:`, error);
    }
  }

  private getMemoryUsage(): number {
    // Use Deno's memory usage API
    try {
      return Deno.memoryUsage().heapUsed;
    } catch {
      return 0;
    }
  }

  private async saveResult(result: TypeCheckResult): Promise<void> {
    const outputDir = join(this.config.outputPath, "type-check-results");
    await Deno.mkdir(outputDir, { recursive: true });

    const filename = `type-check-${Date.now()}.json`;
    const filePath = join(outputDir, filename);

    await Deno.writeTextFile(filePath, JSON.stringify(result, null, 2));
  }

  private calculateMetrics(): PerformanceMetrics {
    if (this.results.length === 0) {
      return {
        averageCheckTime: 0,
        successRate: 0,
        errorCount: 0,
        warningCount: 0,
        memoryUsageAverage: 0,
        filesChecked: 0,
      };
    }

    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
    const successCount = this.results.filter((r) => r.success).length;
    const totalErrors = this.results.reduce(
      (sum, r) => sum + r.errors.length,
      0,
    );
    const totalWarnings = this.results.reduce(
      (sum, r) => sum + r.warnings.length,
      0,
    );
    const totalMemory = this.results.reduce((sum, r) => sum + r.memoryUsage, 0);

    return {
      averageCheckTime: totalTime / this.results.length,
      successRate: (successCount / this.results.length) * 100,
      errorCount: totalErrors,
      warningCount: totalWarnings,
      memoryUsageAverage: totalMemory / this.results.length,
      filesChecked: this.results.length,
    };
  }

  private async checkThresholds(result: TypeCheckResult): Promise<void> {
    const metrics = this.calculateMetrics();
    const alerts: string[] = [];

    // Check error rate threshold
    if (metrics.successRate < (100 - this.config.alertThresholds.errorRate)) {
      alerts.push(
        `❌ Error rate exceeded threshold: ${
          (100 - metrics.successRate).toFixed(2)
        }%`,
      );
    }

    // Check average check time threshold
    if (
      metrics.averageCheckTime > this.config.alertThresholds.averageCheckTime
    ) {
      alerts.push(
        `⏱️ Average check time exceeded threshold: ${
          metrics.averageCheckTime.toFixed(2)
        }ms`,
      );
    }

    // Check memory usage threshold
    if (metrics.memoryUsageAverage > this.config.alertThresholds.memoryUsage) {
      alerts.push(
        `🧠 Memory usage exceeded threshold: ${
          (metrics.memoryUsageAverage / 1024 / 1024).toFixed(2)
        }MB`,
      );
    }

    if (alerts.length > 0) {
      console.log("🚨 ALERTS:");
      alerts.forEach((alert) => console.log(`  ${alert}`));
      await this.saveAlert(alerts, metrics);
    }
  }

  private async saveAlert(
    alerts: string[],
    metrics: PerformanceMetrics,
  ): Promise<void> {
    const alertData = {
      timestamp: Date.now(),
      alerts,
      metrics,
      recentResults: this.results.slice(-10), // Last 10 results
    };

    const alertsDir = join(this.config.outputPath, "alerts");
    await Deno.mkdir(alertsDir, { recursive: true });

    const filename = `alert-${Date.now()}.json`;
    const filePath = join(alertsDir, filename);

    await Deno.writeTextFile(filePath, JSON.stringify(alertData, null, 2));
  }

  private startPeriodicReporting(): void {
    setInterval(() => {
      const metrics = this.calculateMetrics();
      const uptime = Date.now() - this.startTime;

      console.log("\n📊 TYPE MONITORING REPORT:");
      console.log(`  Uptime: ${(uptime / 1000 / 60).toFixed(1)} minutes`);
      console.log(`  Files checked: ${metrics.filesChecked}`);
      console.log(`  Success rate: ${metrics.successRate.toFixed(2)}%`);
      console.log(
        `  Average check time: ${metrics.averageCheckTime.toFixed(2)}ms`,
      );
      console.log(`  Total errors: ${metrics.errorCount}`);
      console.log(`  Total warnings: ${metrics.warningCount}`);
      console.log(
        `  Average memory usage: ${
          (metrics.memoryUsageAverage / 1024 / 1024).toFixed(2)
        }MB`,
      );
      console.log("────────────────────────────────");
    }, 60000); // Report every minute
  }

  async stop(): Promise<void> {
    console.log("🛑 Stopping Real-Time Type Monitoring...");
    this.isRunning = false;

    if (this.watcher) {
      this.watcher.close();
    }

    // Save final report
    const metrics = this.calculateMetrics();
    const reportPath = join(this.config.outputPath, "final-report.json");
    await Deno.writeTextFile(
      reportPath,
      JSON.stringify(
        {
          timestamp: Date.now(),
          totalUptime: Date.now() - this.startTime,
          finalMetrics: metrics,
          totalResults: this.results.length,
        },
        null,
        2,
      ),
    );

    console.log("✅ Type Monitoring stopped. Final report saved.");
  }
}

// Main execution
if (import.meta.main) {
  const config: MonitoringConfig = {
    projectRoot: Deno.cwd(),
    outputPath: join(Deno.cwd(), ".taskmaster", "monitoring"),
    watchPatterns: ["**/*.ts", "**/*.tsx", "**/*.d.ts"],
    alertThresholds: {
      errorRate: 5, // 5% error rate threshold
      averageCheckTime: 5000, // 5 seconds average check time
      memoryUsage: 100 * 1024 * 1024, // 100MB memory usage
    },
  };

  const monitor = new RealTimeTypeChecker(config);

  // Handle graceful shutdown
  Deno.addSignalListener("SIGINT", async () => {
    await monitor.stop();
    Deno.exit(0);
  });

  Deno.addSignalListener("SIGTERM", async () => {
    await monitor.stop();
    Deno.exit(0);
  });

  try {
    await monitor.start();
  } catch (error) {
    console.error("❌ Monitor failed to start:", error);
    Deno.exit(1);
  }
}

export { RealTimeTypeChecker };
export type { MonitoringConfig, PerformanceMetrics, TypeCheckResult };
