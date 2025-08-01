/**
 * Type System Health Dashboard
 * Task 35.5 - Implement Automated Alerting and Dashboard System
 *
 * Comprehensive dashboard system for visualizing type system health metrics,
 * compilation performance, and type safety trends using modern web standards.
 */

import { logger } from "$lib/utils/logger.ts";
import type { CompilationMetrics } from "../compilation/performanceTracker.ts";
import type { TypeSafetyReport } from "../types/astAnalyzer.ts";
import type { TypeCoverageAnalysis } from "../types/coverageAnalyzer.ts";
import type { TypeSystemAlert } from "../alerting/typeSystemAlertManager.ts";

export interface DashboardData {
  /** Dashboard generation timestamp */
  timestamp: number;
  /** Overall system health summary */
  healthSummary: SystemHealthSummary;
  /** Compilation performance metrics */
  compilationMetrics: CompilationDashboardData;
  /** Type safety metrics */
  typeSafetyMetrics: TypeSafetyDashboardData;
  /** Type coverage metrics */
  coverageMetrics: CoverageDashboardData;
  /** Active alerts */
  activeAlerts: AlertDashboardData;
  /** Historical trends */
  trends: TrendData;
  /** Performance insights and recommendations */
  insights: SystemInsight[];
}

export interface SystemHealthSummary {
  /** Overall health status */
  status: "healthy" | "warning" | "critical";
  /** Health score (0-100) */
  score: number;
  /** Key metrics summary */
  keyMetrics: {
    compilationTime: MetricSummary;
    typeCoverage: MetricSummary;
    safetyScore: MetricSummary;
    activeAlerts: MetricSummary;
  };
  /** System uptime and availability */
  uptime: {
    percentage: number;
    lastOutage: number | null;
    downtimeMinutes: number;
  };
}

interface MetricSummary {
  current: number;
  previous: number;
  trend: "up" | "down" | "stable";
  status: "good" | "warning" | "critical";
}

export interface CompilationDashboardData {
  /** Current compilation metrics */
  current: CompilationMetrics | null;
  /** Performance trends over time */
  trends: {
    compilationTime: TimeSeriesData[];
    memoryUsage: TimeSeriesData[];
    cacheEffectiveness: TimeSeriesData[];
    errorCount: TimeSeriesData[];
  };
  /** Performance distribution */
  distribution: {
    compilationTimes: DistributionData;
    memoryUsage: DistributionData;
  };
  /** Top slow files */
  slowFiles: {
    filePath: string;
    averageTime: number;
    compilations: number;
  }[];
}

export interface TypeSafetyDashboardData {
  /** Current type safety report */
  current: TypeSafetyReport | null;
  /** Safety trends over time */
  trends: {
    safetyScore: TimeSeriesData[];
    coveragePercentage: TimeSeriesData[];
    violationCount: TimeSeriesData[];
    anyTypeCount: TimeSeriesData[];
  };
  /** Violation breakdown by type */
  violationBreakdown: {
    type: string;
    count: number;
    severity: string;
  }[];
  /** Domain-specific health */
  domainHealth: {
    domain: string;
    score: number;
    status: "good" | "warning" | "critical";
    issueCount: number;
  }[];
}

export interface CoverageDashboardData {
  /** Current coverage analysis */
  current: TypeCoverageAnalysis | null;
  /** Coverage trends over time */
  trends: {
    overallCoverage: TimeSeriesData[];
    safetyScore: TimeSeriesData[];
    anyTypes: TimeSeriesData[];
  };
  /** Coverage by directory */
  byDirectory: {
    directory: string;
    coverage: number;
    files: number;
    status: "good" | "warning" | "critical";
  }[];
  /** Low coverage files */
  lowCoverageFiles: {
    filePath: string;
    coverage: number;
    issues: number;
    complexity: number;
  }[];
}

export interface AlertDashboardData {
  /** Alert count by severity */
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  /** Recent alerts */
  recent: TypeSystemAlert[];
  /** Alert trends over time */
  trends: TimeSeriesData[];
  /** Most common alert types */
  commonTypes: {
    type: string;
    count: number;
    lastOccurrence: number;
  }[];
}

export interface TrendData {
  /** Data points for the last 30 days */
  thirtyDay: {
    healthScore: TimeSeriesData[];
    compilationTime: TimeSeriesData[];
    typeCoverage: TimeSeriesData[];
    alertCount: TimeSeriesData[];
  };
  /** Weekly aggregated data */
  weekly: {
    averageHealthScore: number;
    averageCompilationTime: number;
    averageTypeCoverage: number;
    totalAlerts: number;
  }[];
  /** Performance regression detection */
  regressions: {
    detected: number;
    resolved: number;
    averageResolutionTime: number;
  };
}

interface TimeSeriesData {
  timestamp: number;
  value: number;
  label?: string;
}

interface DistributionData {
  buckets: {
    min: number;
    max: number;
    count: number;
  }[];
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

export interface SystemInsight {
  /** Insight type */
  type: "performance" | "quality" | "maintenance" | "optimization";
  /** Priority level */
  priority: "high" | "medium" | "low";
  /** Insight title */
  title: string;
  /** Detailed description */
  description: string;
  /** Supporting data */
  data: Record<string, any>;
  /** Recommended actions */
  recommendations: string[];
  /** Estimated impact */
  impact: string;
  /** Implementation effort */
  effort: "low" | "medium" | "high";
}

/**
 * Type System Health Dashboard
 *
 * Generates comprehensive dashboard data for visualizing type system health,
 * performance metrics, and trends using modern web technologies.
 */
export class TypeSystemDashboard {
  private compilationHistory: CompilationMetrics[] = [];
  private typeSafetyHistory: TypeSafetyReport[] = [];
  private coverageHistory: TypeCoverageAnalysis[] = [];
  private alertHistory: TypeSystemAlert[] = [];

  private readonly HISTORY_RETENTION_DAYS = 30;
  private readonly MAX_HISTORY_ENTRIES = 1000;

  /**
   * Record compilation metrics for dashboard
   */
  recordCompilationMetrics(metrics: CompilationMetrics): void {
    this.compilationHistory.push(metrics);
    this.cleanupHistory();
    logger.debug("[dashboard] Recorded compilation metrics");
  }

  /**
   * Record type safety report for dashboard
   */
  recordTypeSafetyReport(report: TypeSafetyReport): void {
    this.typeSafetyHistory.push(report);
    this.cleanupHistory();
    logger.debug("[dashboard] Recorded type safety report");
  }

  /**
   * Record coverage analysis for dashboard
   */
  recordCoverageAnalysis(analysis: TypeCoverageAnalysis): void {
    this.coverageHistory.push(analysis);
    this.cleanupHistory();
    logger.debug("[dashboard] Recorded coverage analysis");
  }

  /**
   * Record alert for dashboard
   */
  recordAlert(alert: TypeSystemAlert): void {
    this.alertHistory.push(alert);
    this.cleanupHistory();
    logger.debug("[dashboard] Recorded alert");
  }

  /**
   * Generate complete dashboard data
   */
  async generateDashboardData(): Promise<DashboardData> {
    const startTime = performance.now();
    logger.info("[dashboard] Generating dashboard data");

    try {
      const healthSummary = this.generateHealthSummary();
      const compilationMetrics = this.generateCompilationDashboardData();
      const typeSafetyMetrics = this.generateTypeSafetyDashboardData();
      const coverageMetrics = this.generateCoverageDashboardData();
      const activeAlerts = this.generateAlertDashboardData();
      const trends = this.generateTrendData();
      const insights = this.generateSystemInsights();

      const dashboardData: DashboardData = {
        timestamp: Date.now(),
        healthSummary,
        compilationMetrics,
        typeSafetyMetrics,
        coverageMetrics,
        activeAlerts,
        trends,
        insights,
      };

      const duration = performance.now() - startTime;
      logger.info(
        `[dashboard] Dashboard data generated in ${duration.toFixed(1)}ms`,
      );

      return dashboardData;
    } catch (error) {
      logger.error(
        `[dashboard] Failed to generate dashboard data: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Generate health summary
   */
  private generateHealthSummary(): SystemHealthSummary {
    const latestCompilation =
      this.compilationHistory[this.compilationHistory.length - 1];
    const latestTypeSafety =
      this.typeSafetyHistory[this.typeSafetyHistory.length - 1];
    const latestCoverage =
      this.coverageHistory[this.coverageHistory.length - 1];
    const activeAlerts = this.alertHistory.filter((a) => a.status === "active");

    // Calculate key metrics
    const compilationTime: MetricSummary = {
      current: latestCompilation?.duration || 0,
      previous: this.getPreviousValue(this.compilationHistory, "duration"),
      trend: this.getTrend(
        latestCompilation?.duration || 0,
        this.getPreviousValue(this.compilationHistory, "duration"),
      ),
      status: this.getCompilationTimeStatus(latestCompilation?.duration || 0),
    };

    const typeCoverage: MetricSummary = {
      current: latestCoverage?.overall.coveragePercentage || 0,
      previous: this.getPreviousValue(
        this.coverageHistory,
        "overall.coveragePercentage",
      ),
      trend: this.getTrend(
        latestCoverage?.overall.coveragePercentage || 0,
        this.getPreviousValue(
          this.coverageHistory,
          "overall.coveragePercentage",
        ),
      ),
      status: this.getCoverageStatus(
        latestCoverage?.overall.coveragePercentage || 0,
      ),
    };

    const safetyScore: MetricSummary = {
      current: latestTypeSafety?.safetyScore || 0,
      previous: this.getPreviousValue(this.typeSafetyHistory, "safetyScore"),
      trend: this.getTrend(
        latestTypeSafety?.safetyScore || 0,
        this.getPreviousValue(this.typeSafetyHistory, "safetyScore"),
      ),
      status: this.getSafetyScoreStatus(latestTypeSafety?.safetyScore || 0),
    };

    const activeAlertsMetric: MetricSummary = {
      current: activeAlerts.length,
      previous: this.getPreviousActiveAlertCount(),
      trend: this.getTrend(
        activeAlerts.length,
        this.getPreviousActiveAlertCount(),
      ),
      status: this.getAlertStatus(activeAlerts),
    };

    // Calculate overall health score
    const healthScore = this.calculateOverallHealthScore(
      compilationTime,
      typeCoverage,
      safetyScore,
      activeAlertsMetric,
    );

    // Determine overall status
    const status = this.getOverallStatus(healthScore, activeAlerts);

    return {
      status,
      score: healthScore,
      keyMetrics: {
        compilationTime,
        typeCoverage,
        safetyScore,
        activeAlerts: activeAlertsMetric,
      },
      uptime: {
        percentage: 99.9, // Would be calculated from actual uptime data
        lastOutage: null,
        downtimeMinutes: 0,
      },
    };
  }

  /**
   * Generate compilation dashboard data
   */
  private generateCompilationDashboardData(): CompilationDashboardData {
    const current =
      this.compilationHistory[this.compilationHistory.length - 1] || null;

    // Generate time series data
    const compilationTime = this.compilationHistory.map((m) => ({
      timestamp: m.startTime,
      value: m.duration,
    }));

    const memoryUsage = this.compilationHistory.map((m) => ({
      timestamp: m.startTime,
      value: m.memoryUsage.peak,
    }));

    const cacheEffectiveness = this.compilationHistory.map((m) => ({
      timestamp: m.startTime,
      value: m.performanceFlags.cacheEffectiveness * 100,
    }));

    const errorCount = this.compilationHistory.map((m) => ({
      timestamp: m.startTime,
      value: m.errors?.length || 0,
    }));

    // Calculate distribution data
    const compilationTimes = this.calculateDistribution(
      this.compilationHistory.map((m) => m.duration),
    );

    const memoryDistribution = this.calculateDistribution(
      this.compilationHistory.map((m) => m.memoryUsage.peak),
    );

    // Find slow files
    const filePerformance = new Map<
      string,
      { totalTime: number; count: number }
    >();
    for (const metrics of this.compilationHistory) {
      for (const fileMetric of metrics.fileMetrics) {
        const existing = filePerformance.get(fileMetric.filePath) ||
          { totalTime: 0, count: 0 };
        existing.totalTime += fileMetric.processingTime;
        existing.count += 1;
        filePerformance.set(fileMetric.filePath, existing);
      }
    }

    const slowFiles = Array.from(filePerformance.entries())
      .map(([filePath, data]) => ({
        filePath,
        averageTime: data.totalTime / data.count,
        compilations: data.count,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    return {
      current,
      trends: {
        compilationTime,
        memoryUsage,
        cacheEffectiveness,
        errorCount,
      },
      distribution: {
        compilationTimes,
        memoryUsage: memoryDistribution,
      },
      slowFiles,
    };
  }

  /**
   * Generate type safety dashboard data
   */
  private generateTypeSafetyDashboardData(): TypeSafetyDashboardData {
    const current = this.typeSafetyHistory[this.typeSafetyHistory.length - 1] ||
      null;

    // Generate time series data
    const safetyScore = this.typeSafetyHistory.map((r) => ({
      timestamp: r.timestamp,
      value: r.safetyScore,
    }));

    const coveragePercentage = this.typeSafetyHistory.map((r) => ({
      timestamp: r.timestamp,
      value: r.coverage.coveragePercentage,
    }));

    const violationCount = this.typeSafetyHistory.map((r) => ({
      timestamp: r.timestamp,
      value: r.violations.length,
    }));

    const anyTypeCount = this.typeSafetyHistory.map((r) => ({
      timestamp: r.timestamp,
      value: r.coverage.anyTypes,
    }));

    // Violation breakdown
    const violationBreakdown: {
      type: string;
      count: number;
      severity: string;
    }[] = [];
    if (current) {
      const violationsByType = new Map<
        string,
        { count: number; severity: string }
      >();
      for (const violation of current.violations) {
        const existing = violationsByType.get(violation.type) ||
          { count: 0, severity: violation.severity };
        existing.count += 1;
        if (
          this.getSeverityWeight(violation.severity) >
            this.getSeverityWeight(existing.severity)
        ) {
          existing.severity = violation.severity;
        }
        violationsByType.set(violation.type, existing);
      }

      violationBreakdown.push(
        ...Array.from(violationsByType.entries()).map(([type, data]) => ({
          type,
          count: data.count,
          severity: data.severity,
        })),
      );
    }

    // Domain health
    const domainHealth: {
      domain: string;
      score: number;
      status: "good" | "warning" | "critical";
      issueCount: number;
    }[] = [];
    if (current) {
      for (
        const [domain, validation] of Object.entries(current.domainValidation)
      ) {
        const score = validation.typesAnalyzed > 0
          ? (validation.validTypes / validation.typesAnalyzed) * 100
          : 100;

        let status: "good" | "warning" | "critical";
        if (score >= 90) status = "good";
        else if (score >= 75) status = "warning";
        else status = "critical";

        domainHealth.push({
          domain,
          score: Math.round(score),
          status,
          issueCount: validation.issues.length,
        });
      }
    }

    return {
      current,
      trends: {
        safetyScore,
        coveragePercentage,
        violationCount,
        anyTypeCount,
      },
      violationBreakdown,
      domainHealth,
    };
  }

  /**
   * Generate coverage dashboard data
   */
  private generateCoverageDashboardData(): CoverageDashboardData {
    const current = this.coverageHistory[this.coverageHistory.length - 1] ||
      null;

    // Generate time series data
    const overallCoverage = this.coverageHistory.map((a) => ({
      timestamp: a.timestamp,
      value: a.overall.coveragePercentage,
    }));

    const safetyScore = this.coverageHistory.map((a) => ({
      timestamp: a.timestamp,
      value: a.overall.safetyScore,
    }));

    const anyTypes = this.coverageHistory.map((a) => ({
      timestamp: a.timestamp,
      value: a.overall.anyIdentifiers,
    }));

    // Coverage by directory
    const byDirectory: {
      directory: string;
      coverage: number;
      files: number;
      status: "good" | "warning" | "critical";
    }[] = [];
    if (current) {
      for (const [directory, stats] of Object.entries(current.byDirectory)) {
        let status: "good" | "warning" | "critical";
        if (stats.coveragePercentage >= 80) status = "good";
        else if (stats.coveragePercentage >= 60) status = "warning";
        else status = "critical";

        byDirectory.push({
          directory,
          coverage: Math.round(stats.coveragePercentage),
          files: 1, // Would be calculated from actual file counts
          status,
        });
      }
    }

    // Low coverage files
    const lowCoverageFiles = current?.lowCoverageFiles.map((f) => ({
      filePath: f.filePath,
      coverage: Math.round(f.coverage.coveragePercentage),
      issues: f.issues.length,
      complexity: f.complexityScore,
    })) || [];

    return {
      current,
      trends: {
        overallCoverage,
        safetyScore,
        anyTypes,
      },
      byDirectory,
      lowCoverageFiles,
    };
  }

  /**
   * Generate alert dashboard data
   */
  private generateAlertDashboardData(): AlertDashboardData {
    const activeAlerts = this.alertHistory.filter((a) => a.status === "active");

    const bySeverity = {
      critical: activeAlerts.filter((a) => a.severity === "critical").length,
      high: activeAlerts.filter((a) => a.severity === "high").length,
      medium: activeAlerts.filter((a) => a.severity === "medium").length,
      low: activeAlerts.filter((a) => a.severity === "low").length,
    };

    const recent = activeAlerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    // Alert trends (daily counts)
    const trends = this.generateDailyAlertTrends();

    // Common alert types
    const typeCount = new Map<
      string,
      { count: number; lastOccurrence: number }
    >();
    for (const alert of this.alertHistory) {
      const existing = typeCount.get(alert.type) ||
        { count: 0, lastOccurrence: 0 };
      existing.count += 1;
      existing.lastOccurrence = Math.max(
        existing.lastOccurrence,
        alert.timestamp,
      );
      typeCount.set(alert.type, existing);
    }

    const commonTypes = Array.from(typeCount.entries())
      .map(([type, data]) => ({
        type,
        count: data.count,
        lastOccurrence: data.lastOccurrence,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      bySeverity,
      recent,
      trends,
      commonTypes,
    };
  }

  /**
   * Generate trend data
   */
  private generateTrendData(): TrendData {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    // Filter data to last 30 days
    const recentCompilation = this.compilationHistory.filter((m) =>
      m.startTime >= thirtyDaysAgo
    );
    const recentTypeSafety = this.typeSafetyHistory.filter((r) =>
      r.timestamp >= thirtyDaysAgo
    );
    const recentCoverage = this.coverageHistory.filter((a) =>
      a.timestamp >= thirtyDaysAgo
    );
    const recentAlerts = this.alertHistory.filter((a) =>
      a.timestamp >= thirtyDaysAgo
    );

    // Generate daily aggregated data for trends
    const healthScore = this.generateDailyHealthScores();
    const compilationTime = recentCompilation.map((m) => ({
      timestamp: m.startTime,
      value: m.duration,
    }));
    const typeCoverage = recentCoverage.map((a) => ({
      timestamp: a.timestamp,
      value: a.overall.coveragePercentage,
    }));
    const alertCount = this.generateDailyAlertCounts();

    return {
      thirtyDay: {
        healthScore,
        compilationTime,
        typeCoverage,
        alertCount,
      },
      weekly: [], // Would generate weekly aggregated data
      regressions: {
        detected: 0, // Would be calculated from regression data
        resolved: 0,
        averageResolutionTime: 0,
      },
    };
  }

  /**
   * Generate system insights
   */
  private generateSystemInsights(): SystemInsight[] {
    const insights: SystemInsight[] = [];

    // Analyze compilation performance
    if (this.compilationHistory.length > 5) {
      const avgTime = this.compilationHistory
        .slice(-5)
        .reduce((sum, m) => sum + m.duration, 0) / 5;

      if (avgTime > 15000) { // 15 seconds
        insights.push({
          type: "performance",
          priority: "high",
          title: "Slow Compilation Performance",
          description: `Average compilation time is ${
            (avgTime / 1000).toFixed(1)
          }s, which is above optimal range`,
          data: { averageTime: avgTime },
          recommendations: [
            "Enable incremental compilation if not already active",
            "Review complex type definitions that may slow compilation",
            "Consider breaking up large files",
          ],
          impact: "Improved developer productivity and CI/CD speed",
          effort: "medium",
        });
      }
    }

    // Analyze type coverage trends
    const latestCoverage =
      this.coverageHistory[this.coverageHistory.length - 1];
    if (latestCoverage && latestCoverage.overall.coveragePercentage < 80) {
      insights.push({
        type: "quality",
        priority: "medium",
        title: "Low Type Coverage",
        description: `Type coverage is ${
          latestCoverage.overall.coveragePercentage.toFixed(1)
        }%, below recommended 80%`,
        data: { coverage: latestCoverage.overall.coveragePercentage },
        recommendations: [
          "Add type annotations to untyped variables",
          "Replace any types with specific types",
          "Focus on files with lowest coverage first",
        ],
        impact: "Better type safety and fewer runtime errors",
        effort: "high",
      });
    }

    // Analyze active alerts
    const criticalAlerts = this.alertHistory.filter((a) =>
      a.status === "active" && a.severity === "critical"
    );
    if (criticalAlerts.length > 0) {
      insights.push({
        type: "maintenance",
        priority: "high",
        title: "Critical Alerts Need Attention",
        description:
          `${criticalAlerts.length} critical alerts are currently active`,
        data: { alertCount: criticalAlerts.length },
        recommendations: [
          "Review and address critical alerts immediately",
          "Investigate root causes to prevent recurrence",
          "Consider adjusting alert thresholds if appropriate",
        ],
        impact: "Reduced system reliability risks",
        effort: "high",
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Calculate distribution data for values
   */
  private calculateDistribution(values: number[]): DistributionData {
    if (values.length === 0) {
      return {
        buckets: [],
        percentiles: { p50: 0, p90: 0, p95: 0, p99: 0 },
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const bucketCount = Math.min(10, sorted.length);
    const bucketSize = (max - min) / bucketCount;

    const buckets = [];
    for (let i = 0; i < bucketCount; i++) {
      const bucketMin = min + (i * bucketSize);
      const bucketMax = min + ((i + 1) * bucketSize);
      const count = sorted.filter((v) =>
        v >= bucketMin && v < bucketMax
      ).length;
      buckets.push({ min: bucketMin, max: bucketMax, count });
    }

    const percentiles = {
      p50: this.getPercentile(sorted, 0.5),
      p90: this.getPercentile(sorted, 0.9),
      p95: this.getPercentile(sorted, 0.95),
      p99: this.getPercentile(sorted, 0.99),
    };

    return { buckets, percentiles };
  }

  /**
   * Get percentile value from sorted array
   */
  private getPercentile(sorted: number[], percentile: number): number {
    const index = Math.floor(sorted.length * percentile);
    return sorted[Math.min(index, sorted.length - 1)];
  }

  /**
   * Get previous value from history array
   */
  private getPreviousValue(history: any[], path: string): number {
    if (history.length < 2) return 0;

    const previous = history[history.length - 2];
    const keys = path.split(".");
    let value = previous;

    for (const key of keys) {
      value = value?.[key];
    }

    return typeof value === "number" ? value : 0;
  }

  /**
   * Determine trend direction
   */
  private getTrend(
    current: number,
    previous: number,
  ): "up" | "down" | "stable" {
    if (Math.abs(current - previous) < 0.01) return "stable";
    return current > previous ? "up" : "down";
  }

  /**
   * Get status for compilation time
   */
  private getCompilationTimeStatus(
    duration: number,
  ): "good" | "warning" | "critical" {
    if (duration < 10000) return "good"; // < 10s
    if (duration < 30000) return "warning"; // < 30s
    return "critical";
  }

  /**
   * Get status for coverage percentage
   */
  private getCoverageStatus(coverage: number): "good" | "warning" | "critical" {
    if (coverage >= 85) return "good";
    if (coverage >= 70) return "warning";
    return "critical";
  }

  /**
   * Get status for safety score
   */
  private getSafetyScoreStatus(score: number): "good" | "warning" | "critical" {
    if (score >= 80) return "good";
    if (score >= 60) return "warning";
    return "critical";
  }

  /**
   * Get status for alerts
   */
  private getAlertStatus(
    alerts: TypeSystemAlert[],
  ): "good" | "warning" | "critical" {
    const critical = alerts.filter((a) => a.severity === "critical").length;
    const high = alerts.filter((a) => a.severity === "high").length;

    if (critical > 0) return "critical";
    if (high > 2) return "warning";
    return "good";
  }

  /**
   * Calculate overall health score
   */
  private calculateOverallHealthScore(
    compilationTime: MetricSummary,
    typeCoverage: MetricSummary,
    safetyScore: MetricSummary,
    activeAlerts: MetricSummary,
  ): number {
    const weights = {
      compilation: 0.2,
      coverage: 0.3,
      safety: 0.3,
      alerts: 0.2,
    };

    const compilationScore = this.getStatusScore(compilationTime.status);
    const coverageScoreValue = typeCoverage.current;
    const safetyScoreValue = safetyScore.current;
    const alertScore = this.getAlertHealthScore(activeAlerts.current);

    return Math.round(
      (compilationScore * weights.compilation) +
        (coverageScoreValue * weights.coverage) +
        (safetyScoreValue * weights.safety) +
        (alertScore * weights.alerts),
    );
  }

  /**
   * Get numeric score for status
   */
  private getStatusScore(status: "good" | "warning" | "critical"): number {
    switch (status) {
      case "good":
        return 100;
      case "warning":
        return 70;
      case "critical":
        return 30;
      default:
        return 50;
    }
  }

  /**
   * Get alert health score
   */
  private getAlertHealthScore(alertCount: number): number {
    if (alertCount === 0) return 100;
    if (alertCount <= 2) return 80;
    if (alertCount <= 5) return 60;
    return 20;
  }

  /**
   * Get overall system status
   */
  private getOverallStatus(
    healthScore: number,
    activeAlerts: TypeSystemAlert[],
  ): "healthy" | "warning" | "critical" {
    const criticalAlerts =
      activeAlerts.filter((a) => a.severity === "critical").length;

    if (criticalAlerts > 0 || healthScore < 50) return "critical";
    if (healthScore < 75) return "warning";
    return "healthy";
  }

  /**
   * Get severity weight for comparison
   */
  private getSeverityWeight(severity: string): number {
    switch (severity) {
      case "critical":
        return 4;
      case "high":
        return 3;
      case "medium":
        return 2;
      case "low":
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Get previous active alert count
   */
  private getPreviousActiveAlertCount(): number {
    // This would be calculated from historical alert data
    return 0;
  }

  /**
   * Generate daily health scores
   */
  private generateDailyHealthScores(): TimeSeriesData[] {
    // This would aggregate health scores by day
    return [];
  }

  /**
   * Generate daily alert counts
   */
  private generateDailyAlertCounts(): TimeSeriesData[] {
    // This would count alerts by day
    return [];
  }

  /**
   * Generate daily alert trends
   */
  private generateDailyAlertTrends(): TimeSeriesData[] {
    // This would generate alert count trends by day
    return [];
  }

  /**
   * Clean up old history data
   */
  private cleanupHistory(): void {
    const retentionMs = this.HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - retentionMs;

    this.compilationHistory = this.compilationHistory
      .filter((m) => m.startTime >= cutoff)
      .slice(-this.MAX_HISTORY_ENTRIES);

    this.typeSafetyHistory = this.typeSafetyHistory
      .filter((r) => r.timestamp >= cutoff)
      .slice(-this.MAX_HISTORY_ENTRIES);

    this.coverageHistory = this.coverageHistory
      .filter((a) => a.timestamp >= cutoff)
      .slice(-this.MAX_HISTORY_ENTRIES);

    this.alertHistory = this.alertHistory
      .filter((a) => a.timestamp >= cutoff)
      .slice(-this.MAX_HISTORY_ENTRIES);
  }
}

/**
 * Global dashboard instance
 */
export const typeSystemDashboard = new TypeSystemDashboard();
