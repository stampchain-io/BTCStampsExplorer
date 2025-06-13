#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Performance Monitor for Newman API Testing (Deno Version)
 *
 * This script analyzes Newman test results to:
 * - Collect baseline performance metrics
 * - Detect performance regressions
 * - Generate alerts for critical issues
 * - Track performance trends over time
 * - Enforce performance budgets
 */

interface PerformanceOptions {
  baselineFile?: string;
  historyFile?: string;
  alertsFile?: string;
  regressionThreshold?: number;
  criticalThreshold?: number;
  maxHistoryEntries?: number;
  performanceBudgets?: Record<string, number>;
}

interface PerformanceMetrics {
  timestamp: string;
  sessionId: string;
  overall: {
    totalRequests: number;
    failedRequests: number;
    totalTime: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
  };
  endpoints: Record<string, EndpointMetrics>;
  trends: Record<string, unknown>;
}

interface EndpointMetrics {
  name: string;
  url: string;
  requests: Array<{
    responseTime: number;
    statusCode: number;
    timestamp: string;
  }>;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number;
  statusCodes: Record<number, number>;
}

interface PerformanceRegression {
  type: string;
  endpoint?: string;
  metric: string;
  baseline: number;
  current: number;
  regression: number;
  severity: "critical" | "warning";
}

interface BudgetViolation {
  endpoint: string;
  budget: number;
  actual: number;
  violation: number;
  severity: "critical" | "warning";
}

interface Alert {
  id: string;
  timestamp: string;
  type: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  data: unknown;
}

interface PerformanceSummary {
  timestamp: string;
  sessionId: string;
  status: "healthy" | "warning" | "critical";
  totalEndpoints: number;
  averageResponseTime: number;
  successRate: number;
  issues: {
    critical: number;
    warning: number;
    total: number;
  };
  trends: {
    trend: string;
    slope?: number;
    message: string;
    dataPoints?: number;
  };
  recommendations: Array<{
    type: string;
    priority: string;
    message: string;
    actions: string[];
  }>;
}

class PerformanceMonitor {
  private options: Required<PerformanceOptions>;
  private alerts: Alert[] = [];
  private metrics: PerformanceMetrics | null = null;
  private baseline: PerformanceMetrics | null = null;
  private history: Array<{
    timestamp: string;
    sessionId: string;
    overall: PerformanceMetrics["overall"];
    endpointCount: number;
  }> = [];

  constructor(options: PerformanceOptions = {}) {
    this.options = {
      baselineFile: options.baselineFile || "reports/performance-baseline.json",
      historyFile: options.historyFile || "reports/performance-history.json",
      alertsFile: options.alertsFile || "reports/performance-alerts.json",
      regressionThreshold: options.regressionThreshold || 10, // 10% degradation
      criticalThreshold: options.criticalThreshold || 25, // 25% degradation
      maxHistoryEntries: options.maxHistoryEntries || 100,
      performanceBudgets: options.performanceBudgets || {
        "/api/v2/health": 500, // 500ms max
        "/api/v2/version": 200, // 200ms max
        "/api/v2/stamps": 2000, // 2s max
        "/api/v2/src20": 3000, // 3s max
        "/api/v2/collections": 1500, // 1.5s max
      },
    };

    this.baseline = this.loadBaseline();
    this.history = this.loadHistory();
  }

  /**
   * Analyze Newman test results for performance metrics
   */
  async analyzeResults(resultsFile: string) {
    console.log(`📊 Analyzing performance results from: ${resultsFile}`);

    try {
      await Deno.stat(resultsFile);
    } catch {
      throw new Error(`Results file not found: ${resultsFile}`);
    }

    const resultsText = await Deno.readTextFile(resultsFile);
    const results = JSON.parse(resultsText);
    const timestamp = new Date().toISOString();

    // Extract performance metrics
    const metrics = this.extractMetrics(results, timestamp);

    // Compare with baseline
    const regressions = this.detectRegressions(metrics);

    // Check performance budgets
    const budgetViolations = this.checkPerformanceBudgets(metrics);

    // Update history
    this.updateHistory(metrics);

    // Generate alerts
    this.generateAlerts(regressions, budgetViolations, metrics);

    // Save results
    await this.saveResults(metrics, regressions, budgetViolations);

    return {
      metrics,
      regressions,
      budgetViolations,
      alerts: this.alerts,
      summary: this.generateSummary(metrics, regressions, budgetViolations),
    };
  }

  /**
   * Extract performance metrics from Newman results
   */
  private extractMetrics(results: any, timestamp: string): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      timestamp,
      sessionId: this.generateSessionId(),
      overall: {
        totalRequests: results.run.stats.requests.total,
        failedRequests: results.run.stats.requests.failed,
        totalTime: results.run.timings.completed - results.run.timings.started,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
      },
      endpoints: {},
      trends: {},
    };

    let totalResponseTime = 0;
    let responseCount = 0;

    // Analyze individual requests
    results.run.executions.forEach((execution: any) => {
      if (
        execution.response?.responseTime && execution.item?.name &&
        execution.request?.url
      ) {
        const responseTime = execution.response.responseTime;
        const endpointName = execution.item.name;
        const url = execution.request.url.toString();
        const statusCode = execution.response.code;

        // Extract endpoint path for categorization
        const urlPath = this.extractEndpointPath(url);

        if (!metrics.endpoints[urlPath]) {
          metrics.endpoints[urlPath] = {
            name: endpointName,
            url: urlPath,
            requests: [],
            averageResponseTime: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            successRate: 0,
            statusCodes: {},
          };
        }

        const endpoint = metrics.endpoints[urlPath];
        endpoint.requests.push({
          responseTime,
          statusCode,
          timestamp: new Date().toISOString(),
        });

        // Update endpoint statistics
        endpoint.minResponseTime = Math.min(
          endpoint.minResponseTime,
          responseTime,
        );
        endpoint.maxResponseTime = Math.max(
          endpoint.maxResponseTime,
          responseTime,
        );
        endpoint.statusCodes[statusCode] =
          (endpoint.statusCodes[statusCode] || 0) + 1;

        // Update overall statistics
        totalResponseTime += responseTime;
        responseCount++;
        metrics.overall.minResponseTime = Math.min(
          metrics.overall.minResponseTime,
          responseTime,
        );
        metrics.overall.maxResponseTime = Math.max(
          metrics.overall.maxResponseTime,
          responseTime,
        );
      }
    });

    // Calculate averages and success rates
    metrics.overall.averageResponseTime = responseCount > 0
      ? totalResponseTime / responseCount
      : 0;

    Object.keys(metrics.endpoints).forEach((path) => {
      const endpoint = metrics.endpoints[path];
      const requests = endpoint.requests;

      if (requests.length > 0) {
        endpoint.averageResponseTime = requests.reduce((sum, req) =>
          sum + req.responseTime, 0) / requests.length;

        const successfulRequests = requests.filter((req) =>
          req.statusCode >= 200 && req.statusCode < 400
        ).length;
        endpoint.successRate = (successfulRequests / requests.length) * 100;
      }
    });

    return metrics;
  }

  /**
   * Detect performance regressions compared to baseline
   */
  private detectRegressions(
    currentMetrics: PerformanceMetrics,
  ): PerformanceRegression[] {
    const regressions: PerformanceRegression[] = [];

    if (!this.baseline || !this.baseline.endpoints) {
      console.log(
        "⚠️ No baseline found, establishing current metrics as baseline",
      );
      this.baseline = { ...currentMetrics };
      this.saveBaseline();
      return regressions;
    }

    // Check overall performance regression
    const overallRegression = this.calculateRegression(
      this.baseline.overall.averageResponseTime,
      currentMetrics.overall.averageResponseTime,
    );

    if (overallRegression > this.options.regressionThreshold) {
      regressions.push({
        type: "overall",
        metric: "averageResponseTime",
        baseline: this.baseline.overall.averageResponseTime,
        current: currentMetrics.overall.averageResponseTime,
        regression: overallRegression,
        severity: overallRegression > this.options.criticalThreshold
          ? "critical"
          : "warning",
      });
    }

    // Check endpoint-specific regressions
    Object.keys(currentMetrics.endpoints).forEach((path) => {
      const currentEndpoint = currentMetrics.endpoints[path];
      const baselineEndpoint = this.baseline!.endpoints[path];

      if (baselineEndpoint) {
        const responseTimeRegression = this.calculateRegression(
          baselineEndpoint.averageResponseTime,
          currentEndpoint.averageResponseTime,
        );

        if (responseTimeRegression > this.options.regressionThreshold) {
          regressions.push({
            type: "endpoint",
            endpoint: path,
            metric: "averageResponseTime",
            baseline: baselineEndpoint.averageResponseTime,
            current: currentEndpoint.averageResponseTime,
            regression: responseTimeRegression,
            severity: responseTimeRegression > this.options.criticalThreshold
              ? "critical"
              : "warning",
          });
        }

        // Check success rate regression
        const successRateRegression = baselineEndpoint.successRate -
          currentEndpoint.successRate;
        if (successRateRegression > 5) { // 5% drop in success rate
          regressions.push({
            type: "endpoint",
            endpoint: path,
            metric: "successRate",
            baseline: baselineEndpoint.successRate,
            current: currentEndpoint.successRate,
            regression: successRateRegression,
            severity: successRateRegression > 10 ? "critical" : "warning",
          });
        }
      }
    });

    return regressions;
  }

  /**
   * Check performance budgets
   */
  private checkPerformanceBudgets(
    metrics: PerformanceMetrics,
  ): BudgetViolation[] {
    const violations: BudgetViolation[] = [];

    Object.keys(metrics.endpoints).forEach((path) => {
      const endpoint = metrics.endpoints[path];
      const budget = this.options.performanceBudgets[path];

      if (budget && endpoint.averageResponseTime > budget) {
        violations.push({
          endpoint: path,
          budget: budget,
          actual: endpoint.averageResponseTime,
          violation: endpoint.averageResponseTime - budget,
          severity: endpoint.averageResponseTime > (budget * 1.5)
            ? "critical"
            : "warning",
        });
      }
    });

    return violations;
  }

  /**
   * Generate alerts for regressions and budget violations
   */
  private generateAlerts(
    regressions: PerformanceRegression[],
    budgetViolations: BudgetViolation[],
    metrics: PerformanceMetrics,
  ) {
    const timestamp = new Date().toISOString();

    // Regression alerts
    regressions.forEach((regression) => {
      this.alerts.push({
        id: this.generateAlertId(),
        timestamp,
        type: "regression",
        severity: regression.severity,
        title: `Performance Regression Detected: ${
          regression.endpoint || "Overall"
        }`,
        message: `${regression.metric} increased by ${
          regression.regression.toFixed(1)
        }% (${regression.baseline.toFixed(0)}ms → ${
          regression.current.toFixed(0)
        }ms)`,
        data: regression,
      });
    });

    // Budget violation alerts
    budgetViolations.forEach((violation) => {
      this.alerts.push({
        id: this.generateAlertId(),
        timestamp,
        type: "budget_violation",
        severity: violation.severity,
        title: `Performance Budget Exceeded: ${violation.endpoint}`,
        message: `Response time ${
          violation.actual.toFixed(0)
        }ms exceeds budget of ${violation.budget}ms by ${
          violation.violation.toFixed(0)
        }ms`,
        data: violation,
      });
    });

    // Availability alerts
    Object.keys(metrics.endpoints).forEach((path) => {
      const endpoint = metrics.endpoints[path];
      if (endpoint.successRate < 95) {
        this.alerts.push({
          id: this.generateAlertId(),
          timestamp,
          type: "availability",
          severity: endpoint.successRate < 90 ? "critical" : "warning",
          title: `Low Success Rate: ${path}`,
          message: `Success rate dropped to ${
            endpoint.successRate.toFixed(1)
          }%`,
          data: { endpoint: path, successRate: endpoint.successRate },
        });
      }
    });
  }

  /**
   * Update performance history
   */
  private updateHistory(metrics: PerformanceMetrics) {
    this.history.push({
      timestamp: metrics.timestamp,
      sessionId: metrics.sessionId,
      overall: metrics.overall,
      endpointCount: Object.keys(metrics.endpoints).length,
    });

    // Keep only recent entries
    if (this.history.length > this.options.maxHistoryEntries) {
      this.history = this.history.slice(-this.options.maxHistoryEntries);
    }

    this.saveHistory();
  }

  /**
   * Generate performance summary
   */
  private generateSummary(
    metrics: PerformanceMetrics,
    regressions: PerformanceRegression[],
    budgetViolations: BudgetViolation[],
  ): PerformanceSummary {
    const criticalIssues = [...regressions, ...budgetViolations].filter(
      (issue) => issue.severity === "critical",
    );
    const warningIssues = [...regressions, ...budgetViolations].filter(
      (issue) => issue.severity === "warning",
    );

    return {
      timestamp: metrics.timestamp,
      sessionId: metrics.sessionId,
      status: criticalIssues.length > 0
        ? "critical"
        : warningIssues.length > 0
        ? "warning"
        : "healthy",
      totalEndpoints: Object.keys(metrics.endpoints).length,
      averageResponseTime: metrics.overall.averageResponseTime,
      successRate: this.calculateOverallSuccessRate(metrics),
      issues: {
        critical: criticalIssues.length,
        warning: warningIssues.length,
        total: criticalIssues.length + warningIssues.length,
      },
      trends: this.calculateTrends(),
      recommendations: this.generateRecommendations(
        regressions,
        budgetViolations,
      ),
    };
  }

  /**
   * Calculate performance trends
   */
  private calculateTrends() {
    if (this.history.length < 2) {
      return {
        trend: "insufficient_data",
        message: "Need more data points for trend analysis",
      };
    }

    const recent = this.history.slice(-5); // Last 5 runs
    const responseTimes = recent.map((entry) =>
      entry.overall.averageResponseTime
    );

    // Simple linear trend calculation
    const trend = this.calculateLinearTrend(responseTimes);

    return {
      trend: trend > 5 ? "degrading" : trend < -5 ? "improving" : "stable",
      slope: trend,
      message: this.getTrendMessage(trend),
      dataPoints: recent.length,
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    regressions: PerformanceRegression[],
    budgetViolations: BudgetViolation[],
  ) {
    const recommendations: Array<{
      type: string;
      priority: string;
      message: string;
      actions: string[];
    }> = [];

    if (regressions.length > 0) {
      recommendations.push({
        type: "regression",
        priority: "high",
        message:
          "Investigate recent code changes that may have caused performance regressions",
        actions: [
          "Review recent deployments and code changes",
          "Check database query performance",
          "Monitor server resource utilization",
          "Consider rolling back recent changes if critical",
        ],
      });
    }

    if (budgetViolations.length > 0) {
      recommendations.push({
        type: "budget",
        priority: "medium",
        message: "Optimize endpoints that exceed performance budgets",
        actions: [
          "Profile slow endpoints to identify bottlenecks",
          "Implement caching strategies",
          "Optimize database queries",
          "Consider API response pagination",
        ],
      });
    }

    const slowEndpoints = Object.values(this.metrics?.endpoints || {})
      .filter((endpoint) => endpoint.averageResponseTime > 1000);

    if (slowEndpoints.length > 0) {
      recommendations.push({
        type: "optimization",
        priority: "low",
        message:
          "Consider optimizing slow endpoints for better user experience",
        actions: [
          "Implement response caching",
          "Optimize data serialization",
          "Use CDN for static content",
          "Consider async processing for heavy operations",
        ],
      });
    }

    return recommendations;
  }

  // Utility methods
  private calculateRegression(baseline: number, current: number): number {
    if (baseline === 0) return 0;
    return ((current - baseline) / baseline) * 100;
  }

  private calculateOverallSuccessRate(metrics: PerformanceMetrics): number {
    const endpoints = Object.values(metrics.endpoints);
    if (endpoints.length === 0) return 100;

    const totalRequests = endpoints.reduce(
      (sum, endpoint) => sum + endpoint.requests.length,
      0,
    );
    const successfulRequests = endpoints.reduce((sum, endpoint) => {
      return sum +
        endpoint.requests.filter((req) =>
          req.statusCode >= 200 && req.statusCode < 400
        ).length;
    }, 0);

    return totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;
  }

  private calculateLinearTrend(values: number[]): number {
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private getTrendMessage(trend: number): string {
    if (trend > 10) return "Performance is degrading significantly";
    if (trend > 5) return "Performance is slowly degrading";
    if (trend < -10) return "Performance is improving significantly";
    if (trend < -5) return "Performance is slowly improving";
    return "Performance is stable";
  }

  private extractEndpointPath(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.replace(/\/\d+/g, "/:id"); // Replace IDs with :id
    } catch {
      return url;
    }
  }

  private generateSessionId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  // File operations
  private loadBaseline(): PerformanceMetrics | null {
    try {
      const data = Deno.readTextFileSync(this.options.baselineFile);
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private async saveBaseline() {
    try {
      await this.ensureDirectoryExists(this.options.baselineFile);
      await Deno.writeTextFile(
        this.options.baselineFile,
        JSON.stringify(this.baseline, null, 2),
      );
      console.log(`✅ Baseline saved to: ${this.options.baselineFile}`);
    } catch (error) {
      console.error(
        `Error saving baseline: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private loadHistory(): Array<{
    timestamp: string;
    sessionId: string;
    overall: PerformanceMetrics["overall"];
    endpointCount: number;
  }> {
    try {
      const data = Deno.readTextFileSync(this.options.historyFile);
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async saveHistory() {
    try {
      await this.ensureDirectoryExists(this.options.historyFile);
      await Deno.writeTextFile(
        this.options.historyFile,
        JSON.stringify(this.history, null, 2),
      );
    } catch (error) {
      console.error(
        `Error saving history: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async saveResults(
    metrics: PerformanceMetrics,
    regressions: PerformanceRegression[],
    budgetViolations: BudgetViolation[],
  ) {
    const results = {
      timestamp: metrics.timestamp,
      sessionId: metrics.sessionId,
      metrics,
      regressions,
      budgetViolations,
      alerts: this.alerts,
      summary: this.generateSummary(metrics, regressions, budgetViolations),
    };

    try {
      await this.ensureDirectoryExists(this.options.alertsFile);
      await Deno.writeTextFile(
        this.options.alertsFile,
        JSON.stringify(results, null, 2),
      );
      console.log(
        `📊 Performance analysis saved to: ${this.options.alertsFile}`,
      );
    } catch (error) {
      console.error(
        `Error saving results: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async ensureDirectoryExists(filePath: string) {
    const dir = filePath.substring(0, filePath.lastIndexOf("/"));
    try {
      await Deno.mkdir(dir, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw error;
      }
    }
  }

  // Public API methods
  async setBaseline(resultsFile: string) {
    console.log(`📏 Setting new performance baseline from: ${resultsFile}`);
    const resultsText = await Deno.readTextFile(resultsFile);
    const results = JSON.parse(resultsText);
    this.baseline = this.extractMetrics(results, new Date().toISOString());
    await this.saveBaseline();
    console.log("✅ New baseline established");
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      baseline: this.baseline,
      history: this.history.slice(-10), // Last 10 runs
      trends: this.calculateTrends(),
      alerts: this.alerts,
      summary: {
        totalRuns: this.history.length,
        averageResponseTime: this.history.length > 0
          ? this.history.reduce(
            (sum, entry) => sum + entry.overall.averageResponseTime,
            0,
          ) / this.history.length
          : 0,
        trends: this.calculateTrends(),
      },
    };

    const reportFile = `reports/performance-report-${Date.now()}.json`;
    await this.ensureDirectoryExists(reportFile);
    await Deno.writeTextFile(reportFile, JSON.stringify(report, null, 2));
    console.log(`📈 Performance report generated: ${reportFile}`);

    return report;
  }
}

// CLI interface
if (import.meta.main) {
  const args = Deno.args;
  const command = args[0];
  const resultsFile = args[1];

  const monitor = new PerformanceMonitor();

  switch (command) {
    case "analyze":
      if (!resultsFile) {
        console.error(
          "Usage: deno run --allow-read --allow-write scripts/performance-monitor.ts analyze <results-file>",
        );
        Deno.exit(1);
      }
      try {
        const analysis = await monitor.analyzeResults(resultsFile);
        console.log("\n📊 Performance Analysis Complete:");
        console.log(`Status: ${analysis.summary.status.toUpperCase()}`);
        console.log(
          `Total Issues: ${analysis.summary.issues.total} (${analysis.summary.issues.critical} critical, ${analysis.summary.issues.warning} warnings)`,
        );
        console.log(
          `Average Response Time: ${
            analysis.summary.averageResponseTime.toFixed(0)
          }ms`,
        );
        console.log(
          `Success Rate: ${analysis.summary.successRate.toFixed(1)}%`,
        );

        if (analysis.alerts.length > 0) {
          console.log("\n🚨 Alerts:");
          analysis.alerts.forEach((alert) => {
            console.log(`  ${alert.severity.toUpperCase()}: ${alert.title}`);
            console.log(`    ${alert.message}`);
          });
        }
      } catch (error) {
        console.error(
          `Error analyzing results: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        Deno.exit(1);
      }
      break;

    case "baseline":
      if (!resultsFile) {
        console.error(
          "Usage: deno run --allow-read --allow-write scripts/performance-monitor.ts baseline <results-file>",
        );
        Deno.exit(1);
      }
      try {
        await monitor.setBaseline(resultsFile);
      } catch (error) {
        console.error(
          `Error setting baseline: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        Deno.exit(1);
      }
      break;

    case "report":
      try {
        await monitor.generateReport();
      } catch (error) {
        console.error(
          `Error generating report: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        Deno.exit(1);
      }
      break;

    default:
      console.log("Newman Performance Monitor (Deno)");
      console.log("");
      console.log("Usage:");
      console.log(
        "  deno run --allow-read --allow-write scripts/performance-monitor.ts analyze <results-file>",
      );
      console.log(
        "  deno run --allow-read --allow-write scripts/performance-monitor.ts baseline <results-file>",
      );
      console.log(
        "  deno run --allow-read --allow-write scripts/performance-monitor.ts report",
      );
      console.log("");
      console.log("Examples:");
      console.log(
        "  deno run --allow-read --allow-write scripts/performance-monitor.ts analyze reports/newman/results.json",
      );
      console.log(
        "  deno run --allow-read --allow-write scripts/performance-monitor.ts baseline reports/newman/baseline-results.json",
      );
      console.log(
        "  deno run --allow-read --allow-write scripts/performance-monitor.ts report",
      );
      break;
  }
}
