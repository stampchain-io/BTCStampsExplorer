/**
 * Type System Health Monitor - Main Orchestrator
 * Tasks 35.3, 35.4, 35.5 - Complete Type System Health Monitoring Implementation
 *
 * Main orchestrator that integrates compilation performance tracking, type safety
 * validation pipelines, and automated alerting/dashboard system.
 */

import { logger } from "$lib/utils/logger.ts";

// Import all monitoring components
import { compilationPerformanceTracker } from "./compilation/performanceTracker.ts";
import {
  CompilationMetricsCollector,
  denoCheckWrapper,
} from "./compilation/metricsCollector.ts";
import { astTypeSafetyAnalyzer } from "./types/astAnalyzer.ts";
import { typeCoverageAnalyzer } from "./types/coverageAnalyzer.ts";
import {
  type AlertConfiguration,
  defaultAlertConfiguration,
  TypeSystemAlertManager,
} from "./alerting/typeSystemAlertManager.ts";
import { typeSystemDashboard } from "./dashboard/typeSystemDashboard.ts";

import type { CompilationMetrics } from "./compilation/performanceTracker.ts";
import type { TypeSafetyReport } from "./types/astAnalyzer.ts";
import type { TypeCoverageAnalysis } from "./types/coverageAnalyzer.ts";
import type { DashboardData } from "./dashboard/typeSystemDashboard.ts";

export interface MonitoringConfiguration {
  /** Enable/disable different monitoring components */
  enabled: {
    compilationTracking: boolean;
    typeSafetyValidation: boolean;
    coverageAnalysis: boolean;
    alerting: boolean;
    dashboard: boolean;
  };
  /** Monitoring intervals (in milliseconds) */
  intervals: {
    healthCheck: number;
    fullAnalysis: number;
    dashboardUpdate: number;
  };
  /** Project-specific settings */
  project: {
    rootPath: string;
    includePatterns: string[];
    excludePatterns: string[];
    baselineEnabled: boolean;
  };
  /** Alert configuration */
  alerting: AlertConfiguration;
}

export interface HealthMonitorReport {
  /** Report generation timestamp */
  timestamp: number;
  /** Overall health status */
  status: "healthy" | "warning" | "critical";
  /** Health score (0-100) */
  healthScore: number;
  /** Individual component reports */
  components: {
    compilation?: CompilationMetrics;
    typeSafety?: TypeSafetyReport;
    coverage?: TypeCoverageAnalysis;
  };
  /** Active alerts count */
  activeAlerts: number;
  /** Performance summary */
  performance: {
    monitoringOverhead: number;
    analysisTime: number;
    lastFullAnalysis: number;
  };
  /** Recommendations for improvement */
  recommendations: string[];
}

/**
 * Type System Health Monitor
 *
 * Main orchestrator that coordinates all type system health monitoring
 * components, providing a unified interface for monitoring, alerting,
 * and dashboard generation.
 */
export class TypeSystemHealthMonitor {
  private config: MonitoringConfiguration;
  private alertManager: TypeSystemAlertManager;
  private metricsCollector: CompilationMetricsCollector;

  private isRunning = false;
  private intervals: {
    healthCheck?: number;
    fullAnalysis?: number;
    dashboardUpdate?: number;
  } = {};

  private lastHealthCheck = 0;
  private lastFullAnalysis = 0;
  private lastDashboardUpdate = 0;

  constructor(config?: Partial<MonitoringConfiguration>) {
    this.config = this.mergeWithDefaults(config);
    this.alertManager = new TypeSystemAlertManager(this.config.alerting);
    this.metricsCollector = new CompilationMetricsCollector();

    logger.info("system", { message: "[health-monitor] Type System Health Monitor initialized" });
  }

  /**
   * Start the monitoring system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("system", { message: "[health-monitor] Monitor is already running" });
      return;
    }

    logger.info("system", { message: "[health-monitor] Starting Type System Health Monitor" });

    try {
      // Initialize components
      await this.initializeComponents();

      // Set up monitoring intervals
      this.setupMonitoringIntervals();

      // Perform initial analysis
      await this.performInitialAnalysis();

      this.isRunning = true;
      logger.info(
        "system",
        { message: "[health-monitor] Type System Health Monitor started successfully" },
      );
    } catch (error) {
      logger.error(
        "system",
        { message: `[health-monitor] Failed to start monitor: ${error.message}` },
      );
      throw error;
    }
  }

  /**
   * Stop the monitoring system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn("system", { message: "[health-monitor] Monitor is not running" });
      return;
    }

    logger.info("system", { message: "[health-monitor] Stopping Type System Health Monitor" });

    // Clear intervals
    Object.values(this.intervals).forEach((intervalId) => {
      if (intervalId) clearInterval(intervalId);
    });
    this.intervals = {};

    this.isRunning = false;
    logger.info("system", { message: "[health-monitor] Type System Health Monitor stopped" });
  }

  /**
   * Perform a quick health check
   */
  async performHealthCheck(): Promise<HealthMonitorReport> {
    const startTime = performance.now();
    logger.info("system", { message: "[health-monitor] Performing health check" });

    try {
      // Quick compilation check
      let compilationMetrics: CompilationMetrics | undefined;
      if (this.config.enabled.compilationTracking) {
        const result = await denoCheckWrapper.runTypeCheck(
          [this.config.project.rootPath + "/main.ts"],
          { noCheck: false },
        );
        compilationMetrics = result.metrics;

        // Record metrics
        await compilationPerformanceTracker.recordCompilationMetrics(
          compilationMetrics,
        );
        typeSystemDashboard.recordCompilationMetrics(compilationMetrics);

        // Check for alerts
        await this.alertManager.processCompilationMetrics(compilationMetrics);
      }

      // Get active alerts
      const activeAlerts = this.alertManager.getActiveAlerts();

      // Calculate health score
      const healthScore = this.calculateQuickHealthScore(
        compilationMetrics,
        activeAlerts,
      );
      const status = this.determineHealthStatus(healthScore, activeAlerts);

      // Generate recommendations
      const recommendations = this.generateQuickRecommendations(
        compilationMetrics,
        activeAlerts,
      );

      const analysisTime = performance.now() - startTime;
      this.lastHealthCheck = Date.now();

      const report: HealthMonitorReport = {
        timestamp: Date.now(),
        status,
        healthScore,
        components: {
          compilation: compilationMetrics,
        },
        activeAlerts: activeAlerts.length,
        performance: {
          monitoringOverhead: analysisTime,
          analysisTime,
          lastFullAnalysis: this.lastFullAnalysis,
        },
        recommendations,
      };

      logger.info(
        "system",
        { message: `[health-monitor] Health check completed in ${analysisTime.toFixed(1)}ms - Status: ${status}` },
      );
      return report;
    } catch (error) {
      logger.error("system", { message: `[health-monitor] Health check failed: ${error.message}` });
      throw error;
    }
  }

  /**
   * Perform comprehensive analysis
   */
  async performFullAnalysis(): Promise<HealthMonitorReport> {
    const startTime = performance.now();
    logger.info("system", { message: "[health-monitor] Performing full analysis" });

    try {
      const components: HealthMonitorReport["components"] = {};

      // Compilation analysis
      if (this.config.enabled.compilationTracking) {
        logger.info("system", { message: "[health-monitor] Running compilation analysis" });
        const result = await denoCheckWrapper.runTypeCheck();
        components.compilation = result.metrics;

        await compilationPerformanceTracker.recordCompilationMetrics(
          result.metrics,
        );
        typeSystemDashboard.recordCompilationMetrics(result.metrics);
        await this.alertManager.processCompilationMetrics(result.metrics);
      }

      // Type safety analysis
      if (this.config.enabled.typeSafetyValidation) {
        logger.info("system", { message: "[health-monitor] Running type safety analysis" });
        await astTypeSafetyAnalyzer.initialize(this.config.project.rootPath);
        components.typeSafety = await astTypeSafetyAnalyzer.analyzeTypeSafety();

        typeSystemDashboard.recordTypeSafetyReport(components.typeSafety);
        await this.alertManager.processTypeSafetyReport(components.typeSafety);
      }

      // Coverage analysis
      if (this.config.enabled.coverageAnalysis) {
        logger.info("system", { message: "[health-monitor] Running coverage analysis" });
        components.coverage = await typeCoverageAnalyzer.analyzeCoverage(
          this.config.project.rootPath,
        );

        typeSystemDashboard.recordCoverageAnalysis(components.coverage);
        await this.alertManager.processCoverageAnalysis(components.coverage);
      }

      // Get active alerts
      const activeAlerts = this.alertManager.getActiveAlerts();

      // Calculate comprehensive health score
      const healthScore = this.calculateComprehensiveHealthScore(
        components,
        activeAlerts,
      );
      const status = this.determineHealthStatus(healthScore, activeAlerts);

      // Generate comprehensive recommendations
      const recommendations = this.generateComprehensiveRecommendations(
        components,
        activeAlerts,
      );

      const analysisTime = performance.now() - startTime;
      this.lastFullAnalysis = Date.now();

      const report: HealthMonitorReport = {
        timestamp: Date.now(),
        status,
        healthScore,
        components,
        activeAlerts: activeAlerts.length,
        performance: {
          monitoringOverhead: analysisTime,
          analysisTime,
          lastFullAnalysis: this.lastFullAnalysis,
        },
        recommendations,
      };

      logger.info(
        "system",
        { message: `[health-monitor] Full analysis completed in ${
          analysisTime.toFixed(1)
        }ms - Status: ${status}` },
      );
      return report;
    } catch (error) {
      logger.error("system", { message: `[health-monitor] Full analysis failed: ${error.message}` });
      throw error;
    }
  }

  /**
   * Generate dashboard data
   */
  async generateDashboard(): Promise<DashboardData> {
    logger.info("system", { message: "[health-monitor] Generating dashboard data" });

    try {
      const dashboardData = await typeSystemDashboard.generateDashboardData();
      this.lastDashboardUpdate = Date.now();

      logger.info("system", { message: "[health-monitor] Dashboard data generated successfully" });
      return dashboardData;
    } catch (error) {
      logger.error(
        "system",
        { message: `[health-monitor] Dashboard generation failed: ${error.message}` },
      );
      throw error;
    }
  }

  /**
   * Get current monitoring status
   */
  getMonitoringStatus(): {
    isRunning: boolean;
    lastHealthCheck: number;
    lastFullAnalysis: number;
    lastDashboardUpdate: number;
    activeAlerts: number;
    configuration: MonitoringConfiguration;
  } {
    return {
      isRunning: this.isRunning,
      lastHealthCheck: this.lastHealthCheck,
      lastFullAnalysis: this.lastFullAnalysis,
      lastDashboardUpdate: this.lastDashboardUpdate,
      activeAlerts: this.alertManager.getActiveAlerts().length,
      configuration: this.config,
    };
  }

  /**
   * Update monitoring configuration
   */
  updateConfiguration(updates: Partial<MonitoringConfiguration>): void {
    this.config = { ...this.config, ...updates };
    logger.info("system", { message: "[health-monitor] Configuration updated" });

    // Restart intervals if running
    if (this.isRunning) {
      this.setupMonitoringIntervals();
    }
  }

  /**
   * Initialize monitoring components
   */
  private async initializeComponents(): Promise<void> {
    if (this.config.enabled.typeSafetyValidation) {
      await astTypeSafetyAnalyzer.initialize(this.config.project.rootPath);
    }
  }

  /**
   * Set up monitoring intervals
   */
  private setupMonitoringIntervals(): void {
    // Clear existing intervals
    Object.values(this.intervals).forEach((intervalId) => {
      if (intervalId) clearInterval(intervalId);
    });

    // Health check interval
    if (this.config.intervals.healthCheck > 0) {
      this.intervals.healthCheck = setInterval(
        () => this.performHealthCheck(),
        this.config.intervals.healthCheck,
      );
    }

    // Full analysis interval
    if (this.config.intervals.fullAnalysis > 0) {
      this.intervals.fullAnalysis = setInterval(
        () => this.performFullAnalysis(),
        this.config.intervals.fullAnalysis,
      );
    }

    // Dashboard update interval
    if (this.config.intervals.dashboardUpdate > 0) {
      this.intervals.dashboardUpdate = setInterval(
        () => this.generateDashboard(),
        this.config.intervals.dashboardUpdate,
      );
    }
  }

  /**
   * Perform initial analysis on startup
   */
  private async performInitialAnalysis(): Promise<void> {
    logger.info("system", { message: "[health-monitor] Performing initial analysis" });

    // Start with a health check
    await this.performHealthCheck();

    // If enabled, perform full analysis
    if (
      this.config.enabled.typeSafetyValidation ||
      this.config.enabled.coverageAnalysis
    ) {
      await this.performFullAnalysis();
    }

    // Generate initial dashboard
    if (this.config.enabled.dashboard) {
      await this.generateDashboard();
    }
  }

  /**
   * Calculate quick health score for health checks
   */
  private calculateQuickHealthScore(
    compilation?: CompilationMetrics,
    activeAlerts: any[] = [],
  ): number {
    let score = 100;

    // Compilation score
    if (compilation) {
      if (!compilation.success) score -= 30;
      if (compilation.duration > 30000) score -= 20; // > 30s
      if (compilation.memoryUsage.peak > 1024) score -= 15; // > 1GB
    }

    // Alert penalty
    const criticalAlerts =
      activeAlerts.filter((a) => a.severity === "critical").length;
    const highAlerts = activeAlerts.filter((a) => a.severity === "high").length;

    score -= (criticalAlerts * 25) + (highAlerts * 10);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate comprehensive health score
   */
  private calculateComprehensiveHealthScore(
    components: HealthMonitorReport["components"],
    activeAlerts: any[] = [],
  ): number {
    let totalScore = 0;
    let componentCount = 0;

    // Compilation score
    if (components.compilation) {
      const comp = components.compilation;
      let compScore = 100;

      if (!comp.success) compScore -= 40;
      if (comp.duration > 30000) compScore -= 20;
      if (comp.memoryUsage.peak > 1024) compScore -= 15;
      if (comp.performanceFlags.cacheEffectiveness < 0.7) compScore -= 10;

      totalScore += Math.max(0, compScore);
      componentCount++;
    }

    // Type safety score
    if (components.typeSafety) {
      totalScore += components.typeSafety.safetyScore;
      componentCount++;
    }

    // Coverage score
    if (components.coverage) {
      totalScore += components.coverage.overall.safetyScore;
      componentCount++;
    }

    // Calculate average
    let averageScore = componentCount > 0 ? totalScore / componentCount : 100;

    // Apply alert penalties
    const criticalAlerts =
      activeAlerts.filter((a) => a.severity === "critical").length;
    const highAlerts = activeAlerts.filter((a) => a.severity === "high").length;

    averageScore -= (criticalAlerts * 20) + (highAlerts * 8);

    return Math.max(0, Math.min(100, averageScore));
  }

  /**
   * Determine health status from score and alerts
   */
  private determineHealthStatus(
    healthScore: number,
    activeAlerts: any[],
  ): "healthy" | "warning" | "critical" {
    const criticalAlerts =
      activeAlerts.filter((a) => a.severity === "critical").length;

    if (criticalAlerts > 0 || healthScore < 50) return "critical";
    if (healthScore < 75) return "warning";
    return "healthy";
  }

  /**
   * Generate quick recommendations
   */
  private generateQuickRecommendations(
    compilation?: CompilationMetrics,
    activeAlerts: any[] = [],
  ): string[] {
    const recommendations: string[] = [];

    if (compilation && !compilation.success) {
      recommendations.push("Fix compilation errors to restore type checking");
    }

    if (compilation && compilation.duration > 30000) {
      recommendations.push(
        "Optimize compilation performance - consider incremental compilation",
      );
    }

    if (activeAlerts.length > 0) {
      recommendations.push(`Address ${activeAlerts.length} active alerts`);
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "System is running smoothly - maintain current practices",
      );
    }

    return recommendations;
  }

  /**
   * Generate comprehensive recommendations
   */
  private generateComprehensiveRecommendations(
    components: HealthMonitorReport["components"],
    activeAlerts: any[],
  ): string[] {
    const recommendations: string[] = [];

    // Compilation recommendations
    if (components.compilation) {
      const comp = components.compilation;
      if (comp.duration > 20000) {
        recommendations.push(
          "Consider optimizing slow compilation performance",
        );
      }
      if (comp.performanceFlags.cacheEffectiveness < 0.8) {
        recommendations.push(
          "Improve incremental compilation cache effectiveness",
        );
      }
    }

    // Type safety recommendations
    if (components.typeSafety) {
      const safety = components.typeSafety;
      if (safety.safetyScore < 80) {
        recommendations.push(
          "Improve type safety score by addressing violations",
        );
      }
      if (safety.coverage.anyTypes > 10) {
        recommendations.push(
          "Reduce usage of 'any' types for better type safety",
        );
      }
    }

    // Coverage recommendations
    if (components.coverage) {
      const coverage = components.coverage;
      if (coverage.overall.coveragePercentage < 80) {
        recommendations.push(
          "Increase type coverage by adding explicit type annotations",
        );
      }
      if (coverage.lowCoverageFiles.length > 5) {
        recommendations.push(
          "Focus on improving type coverage in low-coverage files",
        );
      }
    }

    // Alert recommendations
    if (activeAlerts.length > 0) {
      const critical = activeAlerts.filter((a) =>
        a.severity === "critical"
      ).length;
      const high = activeAlerts.filter((a) => a.severity === "high").length;

      if (critical > 0) {
        recommendations.push(`Immediately address ${critical} critical alerts`);
      }
      if (high > 0) {
        recommendations.push(`Review and resolve ${high} high-priority alerts`);
      }
    }

    return recommendations;
  }

  /**
   * Merge configuration with defaults
   */
  private mergeWithDefaults(
    config?: Partial<MonitoringConfiguration>,
  ): MonitoringConfiguration {
    const defaults: MonitoringConfiguration = {
      enabled: {
        compilationTracking: true,
        typeSafetyValidation: true,
        coverageAnalysis: true,
        alerting: true,
        dashboard: true,
      },
      intervals: {
        healthCheck: 5 * 60 * 1000, // 5 minutes
        fullAnalysis: 30 * 60 * 1000, // 30 minutes
        dashboardUpdate: 10 * 60 * 1000, // 10 minutes
      },
      project: {
        rootPath: ".",
        includePatterns: ["**/*.ts", "**/*.tsx"],
        excludePatterns: ["node_modules/**", "_fresh/**", "coverage/**"],
        baselineEnabled: true,
      },
      alerting: defaultAlertConfiguration,
    };

    return { ...defaults, ...config };
  }
}

/**
 * Global health monitor instance
 */
export const typeSystemHealthMonitor = new TypeSystemHealthMonitor();
