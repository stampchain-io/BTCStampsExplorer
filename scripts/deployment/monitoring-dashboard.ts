#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net

/**
 * Monitoring, Alerting, and Deployment Dashboard
 * 
 * Comprehensive monitoring system that integrates with all validation components,
 * provides real-time deployment status, alert management, and a unified dashboard
 * for production deployment oversight and decision making.
 * 
 * Usage:
 *   deno run --allow-all scripts/deployment/monitoring-dashboard.ts
 *   deno run --allow-all scripts/deployment/monitoring-dashboard.ts --server-mode
 *   deno run --allow-all scripts/deployment/monitoring-dashboard.ts --generate-dashboard
 */

import { join } from "@std/path";
import { exists } from "@std/fs";

interface MonitoringMetrics {
  timestamp: string;
  deployment: {
    version: string;
    status: "deploying" | "deployed" | "failed" | "rolling-back";
    environment: string;
    startTime: string;
    duration?: number;
  };
  validation: {
    production_gates: ValidationStatus;
    performance: ValidationStatus;
    security: ValidationStatus;
    cross_module: ValidationStatus;
    regression: ValidationStatus;
  };
  health: {
    overall: number;
    components: {
      api: number;
      database: number;
      frontend: number;
      services: number;
    };
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
  };
  alerts: Alert[];
}

interface ValidationStatus {
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  score: number;
  issues: number;
  duration?: number;
  lastUpdate: string;
}

interface Alert {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  type: "validation" | "performance" | "security" | "infrastructure";
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  component: string;
  actions?: string[];
}

interface DashboardData {
  timestamp: string;
  status: "healthy" | "warning" | "critical";
  currentDeployment?: {
    version: string;
    environment: string;
    status: string;
    progress: number;
    startTime: string;
    estimatedCompletion?: string;
  };
  validationSummary: {
    total: number;
    passed: number;
    failed: number;
    running: number;
  };
  alertSummary: {
    total: number;
    critical: number;
    unresolved: number;
  };
  metrics: MonitoringMetrics;
  recommendations: string[];
  quickActions: {
    [key: string]: {
      label: string;
      action: string;
      severity: "low" | "medium" | "high";
    };
  };
}

class DeploymentMonitoringSystem {
  private projectRoot: string;
  private monitoringDir: string;
  private alerts: Alert[] = [];
  private isServerMode: boolean = false;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.monitoringDir = join(projectRoot, "reports", "monitoring");
  }

  async startMonitoring(): Promise<void> {
    console.log("📊 Starting Deployment Monitoring System");
    console.log("=" * 50);

    await Deno.mkdir(this.monitoringDir, { recursive: true });

    if (this.isServerMode) {
      await this.startServer();
    } else {
      await this.runMonitoringCycle();
    }
  }

  async generateDashboard(): Promise<string> {
    console.log("🎛️ Generating deployment dashboard...");

    const dashboardData = await this.collectDashboardData();
    const htmlContent = this.generateDashboardHTML(dashboardData);
    
    const dashboardPath = join(this.monitoringDir, "dashboard.html");
    await Deno.writeTextFile(dashboardPath, htmlContent);

    console.log(`📄 Dashboard generated: ${dashboardPath}`);
    return dashboardPath;
  }

  private async startServer(): Promise<void> {
    console.log("🌐 Starting monitoring server on http://localhost:8080");
    
    const server = Deno.serve({ port: 8080 }, async (request: Request) => {
      const url = new URL(request.url);
      
      switch (url.pathname) {
        case "/":
        case "/dashboard":
          return await this.serveDashboard();
        case "/api/metrics":
          return await this.serveMetrics();
        case "/api/alerts":
          return await this.serveAlerts();
        case "/api/status":
          return await this.serveStatus();
        default:
          return new Response("Not Found", { status: 404 });
      }
    });

    // Keep server running
    console.log("🔄 Monitoring server started. Press Ctrl+C to stop.");
  }

  private async runMonitoringCycle(): Promise<void> {
    console.log("🔄 Running single monitoring cycle...");

    const metrics = await this.collectMetrics();
    await this.processAlerts(metrics);
    await this.saveMetrics(metrics);
    
    const dashboardPath = await this.generateDashboard();
    this.printMonitoringSummary(metrics);

    console.log(`\n✅ Monitoring cycle completed`);
    console.log(`📊 Dashboard available at: file://${dashboardPath}`);
  }

  private async collectMetrics(): Promise<MonitoringMetrics> {
    console.log("📈 Collecting monitoring metrics...");

    const timestamp = new Date().toISOString();
    const version = Deno.env.get("DEPLOYMENT_VERSION") || "unknown";
    const environment = Deno.env.get("DEPLOYMENT_ENV") || "development";

    // Collect validation statuses from recent reports
    const validation = await this.collectValidationStatuses();
    
    // Collect health metrics
    const health = await this.collectHealthMetrics();
    
    // Collect performance metrics
    const performance = await this.collectPerformanceMetrics();
    
    // Get deployment status
    const deployment = {
      version,
      status: await this.getDeploymentStatus(),
      environment,
      startTime: Deno.env.get("DEPLOYMENT_START_TIME") || timestamp,
      duration: this.calculateDeploymentDuration()
    };

    return {
      timestamp,
      deployment: deployment as any,
      validation,
      health,
      performance,
      alerts: this.alerts
    };
  }

  private async collectValidationStatuses(): Promise<MonitoringMetrics["validation"]> {
    const reportsDir = join(this.projectRoot, "reports");
    
    const readLatestReport = async (pattern: string): Promise<ValidationStatus> => {
      try {
        const files = [];
        for await (const entry of Deno.readDir(reportsDir)) {
          if (entry.name.includes(pattern) && entry.name.endsWith('.json')) {
            files.push(entry.name);
          }
        }
        
        if (files.length === 0) {
          return {
            status: "skipped",
            score: 0,
            issues: 0,
            lastUpdate: new Date().toISOString()
          };
        }

        // Get most recent file
        const latestFile = files.sort().reverse()[0];
        const content = await Deno.readTextFile(join(reportsDir, latestFile));
        const report = JSON.parse(content);

        return {
          status: report.passed ? "passed" : "failed",
          score: report.overallScore || report.summary?.overallHealth || 0,
          issues: report.blockers?.length || report.summary?.criticalFailures || 0,
          duration: report.totalDuration || 0,
          lastUpdate: report.timestamp
        };
      } catch (error) {
        return {
          status: "skipped",
          score: 0,
          issues: 0,
          lastUpdate: new Date().toISOString()
        };
      }
    };

    const [
      production_gates,
      performance,
      security,
      cross_module,
      regression
    ] = await Promise.all([
      readLatestReport("production-readiness"),
      readLatestReport("performance-baselines"),
      readLatestReport("advanced-validation"),
      readLatestReport("cross-module-integration"),
      readLatestReport("regression-detection")
    ]);

    return {
      production_gates,
      performance,
      security,
      cross_module,
      regression
    };
  }

  private async collectHealthMetrics(): Promise<MonitoringMetrics["health"]> {
    // Mock health metrics - in real implementation, integrate with actual health checks
    const components = {
      api: 85 + Math.random() * 15, // 85-100%
      database: 90 + Math.random() * 10, // 90-100%
      frontend: 95 + Math.random() * 5, // 95-100%
      services: 80 + Math.random() * 20 // 80-100%
    };

    const overall = Object.values(components).reduce((sum, val) => sum + val, 0) / Object.keys(components).length;

    return { overall, components };
  }

  private async collectPerformanceMetrics(): Promise<MonitoringMetrics["performance"]> {
    // Mock performance metrics - in real implementation, integrate with APM tools
    return {
      responseTime: 150 + Math.random() * 100, // 150-250ms
      throughput: 800 + Math.random() * 200, // 800-1000 req/s
      errorRate: Math.random() * 2, // 0-2%
      cpuUsage: 30 + Math.random() * 40, // 30-70%
      memoryUsage: 40 + Math.random() * 30 // 40-70%
    };
  }

  private async getDeploymentStatus(): Promise<"deploying" | "deployed" | "failed" | "rolling-back"> {
    // Check deployment status from environment or recent reports
    const deploymentStatus = Deno.env.get("DEPLOYMENT_STATUS");
    if (deploymentStatus) {
      return deploymentStatus as any;
    }

    // Check for recent rollback reports
    try {
      const reportsDir = join(this.projectRoot, "reports");
      const files = [];
      for await (const entry of Deno.readDir(reportsDir)) {
        if (entry.name.includes("rollback") && entry.name.endsWith('.json')) {
          files.push(entry.name);
        }
      }
      
      if (files.length > 0) {
        const latestFile = files.sort().reverse()[0];
        const content = await Deno.readTextFile(join(reportsDir, latestFile));
        const report = JSON.parse(content);
        
        if (report.timestamp && (Date.now() - new Date(report.timestamp).getTime()) < 300000) { // 5 minutes
          return "rolling-back";
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return "deployed";
  }

  private calculateDeploymentDuration(): number | undefined {
    const startTime = Deno.env.get("DEPLOYMENT_START_TIME");
    if (!startTime) return undefined;
    
    return Date.now() - new Date(startTime).getTime();
  }

  private async processAlerts(metrics: MonitoringMetrics): Promise<void> {
    console.log("🚨 Processing alerts...");

    // Clear resolved alerts
    this.alerts = this.alerts.filter(alert => !alert.resolved);

    // Generate new alerts based on metrics
    await this.generateValidationAlerts(metrics.validation);
    await this.generatePerformanceAlerts(metrics.performance);
    await this.generateHealthAlerts(metrics.health);
    await this.generateDeploymentAlerts(metrics.deployment);

    console.log(`   Active alerts: ${this.alerts.length}`);
  }

  private async generateValidationAlerts(validation: MonitoringMetrics["validation"]): Promise<void> {
    for (const [component, status] of Object.entries(validation)) {
      if (status.status === "failed") {
        const alertId = `validation-${component}-${Date.now()}`;
        
        this.alerts.push({
          id: alertId,
          severity: status.issues > 0 ? "critical" : "high",
          type: "validation",
          title: `Validation Failed: ${component.replace('_', ' ').toUpperCase()}`,
          description: `${component} validation failed with ${status.issues} issues and score ${status.score}`,
          timestamp: new Date().toISOString(),
          resolved: false,
          component,
          actions: [
            "Review validation report",
            "Fix critical issues",
            "Re-run validation"
          ]
        });
      }
    }
  }

  private async generatePerformanceAlerts(performance: MonitoringMetrics["performance"]): Promise<void> {
    if (performance.responseTime > 500) {
      this.alerts.push({
        id: `performance-response-time-${Date.now()}`,
        severity: performance.responseTime > 1000 ? "critical" : "high",
        type: "performance",
        title: "High Response Time",
        description: `Average response time is ${performance.responseTime.toFixed(0)}ms`,
        timestamp: new Date().toISOString(),
        resolved: false,
        component: "api",
        actions: [
          "Check database performance",
          "Review API endpoints",
          "Scale infrastructure"
        ]
      });
    }

    if (performance.errorRate > 5) {
      this.alerts.push({
        id: `performance-error-rate-${Date.now()}`,
        severity: performance.errorRate > 10 ? "critical" : "high",
        type: "performance",
        title: "High Error Rate",
        description: `Error rate is ${performance.errorRate.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false,
        component: "api",
        actions: [
          "Check application logs",
          "Review recent deployments",
          "Monitor user impact"
        ]
      });
    }
  }

  private async generateHealthAlerts(health: MonitoringMetrics["health"]): Promise<void> {
    if (health.overall < 80) {
      this.alerts.push({
        id: `health-overall-${Date.now()}`,
        severity: health.overall < 60 ? "critical" : "high",
        type: "infrastructure",
        title: "Overall Health Degraded",
        description: `Overall system health is ${health.overall.toFixed(0)}%`,
        timestamp: new Date().toISOString(),
        resolved: false,
        component: "infrastructure",
        actions: [
          "Check component health",
          "Review infrastructure metrics",
          "Scale resources if needed"
        ]
      });
    }

    for (const [component, healthScore] of Object.entries(health.components)) {
      if (healthScore < 70) {
        this.alerts.push({
          id: `health-${component}-${Date.now()}`,
          severity: healthScore < 50 ? "critical" : "high",
          type: "infrastructure",
          title: `${component.toUpperCase()} Health Issues`,
          description: `${component} health is ${healthScore.toFixed(0)}%`,
          timestamp: new Date().toISOString(),
          resolved: false,
          component,
          actions: [
            `Check ${component} logs`,
            `Restart ${component} service`,
            "Monitor recovery"
          ]
        });
      }
    }
  }

  private async generateDeploymentAlerts(deployment: MonitoringMetrics["deployment"]): Promise<void> {
    if (deployment.status === "failed") {
      this.alerts.push({
        id: `deployment-failed-${Date.now()}`,
        severity: "critical",
        type: "validation",
        title: "Deployment Failed",
        description: `Deployment of version ${deployment.version} to ${deployment.environment} failed`,
        timestamp: new Date().toISOString(),
        resolved: false,
        component: "deployment",
        actions: [
          "Review deployment logs",
          "Check validation reports",
          "Initiate rollback if needed"
        ]
      });
    }

    if (deployment.status === "rolling-back") {
      this.alerts.push({
        id: `deployment-rollback-${Date.now()}`,
        severity: "high",
        type: "validation",
        title: "Deployment Rollback in Progress",
        description: `Rolling back deployment of version ${deployment.version}`,
        timestamp: new Date().toISOString(),
        resolved: false,
        component: "deployment",
        actions: [
          "Monitor rollback progress",
          "Verify system stability",
          "Plan remediation"
        ]
      });
    }
  }

  private async collectDashboardData(): Promise<DashboardData> {
    const metrics = await this.collectMetrics();
    
    const validationSummary = {
      total: Object.keys(metrics.validation).length,
      passed: Object.values(metrics.validation).filter(v => v.status === "passed").length,
      failed: Object.values(metrics.validation).filter(v => v.status === "failed").length,
      running: Object.values(metrics.validation).filter(v => v.status === "running").length
    };

    const alertSummary = {
      total: this.alerts.length,
      critical: this.alerts.filter(a => a.severity === "critical").length,
      unresolved: this.alerts.filter(a => !a.resolved).length
    };

    const status = alertSummary.critical > 0 ? "critical" :
                   alertSummary.unresolved > 0 ? "warning" : "healthy";

    const recommendations = this.generateRecommendations(metrics);
    const quickActions = this.generateQuickActions(metrics);

    return {
      timestamp: new Date().toISOString(),
      status,
      currentDeployment: metrics.deployment.status !== "deployed" ? {
        version: metrics.deployment.version,
        environment: metrics.deployment.environment,
        status: metrics.deployment.status,
        progress: this.calculateDeploymentProgress(metrics.deployment),
        startTime: metrics.deployment.startTime,
        estimatedCompletion: this.estimateCompletion(metrics.deployment)
      } : undefined,
      validationSummary,
      alertSummary,
      metrics,
      recommendations,
      quickActions
    };
  }

  private calculateDeploymentProgress(deployment: any): number {
    if (deployment.status === "deployed") return 100;
    if (deployment.status === "failed") return 0;
    
    // Mock progress calculation
    const elapsed = deployment.duration || 0;
    const estimated = 600000; // 10 minutes
    return Math.min(95, (elapsed / estimated) * 100);
  }

  private estimateCompletion(deployment: any): string | undefined {
    if (deployment.status === "deployed" || deployment.status === "failed") {
      return undefined;
    }

    const elapsed = deployment.duration || 0;
    const estimated = 600000; // 10 minutes
    const remaining = Math.max(0, estimated - elapsed);
    
    const completionTime = new Date(Date.now() + remaining);
    return completionTime.toISOString();
  }

  private generateRecommendations(metrics: MonitoringMetrics): string[] {
    const recommendations: string[] = [];

    const failedValidations = Object.entries(metrics.validation)
      .filter(([_, status]) => status.status === "failed");
    
    if (failedValidations.length > 0) {
      recommendations.push(`Address ${failedValidations.length} failed validation(s) before proceeding`);
    }

    if (metrics.performance.responseTime > 300) {
      recommendations.push("Optimize API response times");
    }

    if (metrics.health.overall < 90) {
      recommendations.push("Investigate component health issues");
    }

    const criticalAlerts = this.alerts.filter(a => a.severity === "critical" && !a.resolved);
    if (criticalAlerts.length > 0) {
      recommendations.push(`Resolve ${criticalAlerts.length} critical alert(s) immediately`);
    }

    if (recommendations.length === 0) {
      recommendations.push("System is healthy - continue monitoring");
    }

    return recommendations;
  }

  private generateQuickActions(metrics: MonitoringMetrics): DashboardData["quickActions"] {
    const actions: DashboardData["quickActions"] = {};

    if (metrics.deployment.status === "failed") {
      actions.rollback = {
        label: "Initiate Rollback",
        action: "deno run --allow-all scripts/deployment/automated-rollback.ts --execute",
        severity: "high"
      };
    }

    const failedValidations = Object.entries(metrics.validation)
      .filter(([_, status]) => status.status === "failed");
    
    if (failedValidations.length > 0) {
      actions.revalidate = {
        label: "Re-run Validations",
        action: "deno task deploy:validate",
        severity: "medium"
      };
    }

    if (metrics.performance.errorRate > 5) {
      actions.checkLogs = {
        label: "Check Application Logs",
        action: "kubectl logs -f deployment/btc-stamps-explorer",
        severity: "medium"
      };
    }

    if (Object.keys(actions).length === 0) {
      actions.refresh = {
        label: "Refresh Dashboard",
        action: "deno run --allow-all scripts/deployment/monitoring-dashboard.ts",
        severity: "low"
      };
    }

    return actions;
  }

  private generateDashboardHTML(data: DashboardData): string {
    const statusColor = data.status === "healthy" ? "#22c55e" :
                       data.status === "warning" ? "#f59e0b" : "#ef4444";

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BTC Stamps Explorer - Deployment Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #334155; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { display: flex; justify-content: between; align-items: center; margin-bottom: 30px; }
        .status-badge { padding: 8px 16px; border-radius: 20px; color: white; font-weight: 600; background: ${statusColor}; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card h3 { margin-bottom: 16px; color: #1e293b; }
        .metric { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .metric-value { font-weight: 600; font-size: 18px; }
        .alert { padding: 12px; border-radius: 8px; margin-bottom: 8px; }
        .alert.critical { background: #fef2f2; border-left: 4px solid #ef4444; }
        .alert.high { background: #fffbeb; border-left: 4px solid #f59e0b; }
        .alert.medium { background: #f0f9ff; border-left: 4px solid #3b82f6; }
        .progress-bar { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: #22c55e; transition: width 0.3s ease; }
        .timestamp { color: #64748b; font-size: 14px; text-align: center; margin-top: 30px; }
        .quick-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .action-btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; }
        .action-high { background: #ef4444; color: white; }
        .action-medium { background: #f59e0b; color: white; }
        .action-low { background: #6b7280; color: white; }
        .validation-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
        .validation-item { padding: 12px; border-radius: 8px; text-align: center; }
        .validation-passed { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .validation-failed { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .validation-running { background: #fffbeb; color: #92400e; border: 1px solid #fed7aa; }
        .validation-skipped { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
    </style>
    <script>
        function refreshDashboard() {
            location.reload();
        }
        
        function executeAction(action) {
            alert('Action: ' + action + '\\n\\nThis would execute the command in a real deployment environment.');
        }
        
        // Auto-refresh every 30 seconds
        setTimeout(refreshDashboard, 30000);
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 BTC Stamps Explorer - Deployment Dashboard</h1>
            <div class="status-badge">${data.status.toUpperCase()}</div>
        </div>

        ${data.currentDeployment ? `
        <div class="card" style="margin-bottom: 20px;">
            <h3>🔄 Current Deployment</h3>
            <div class="metric">
                <span>Version:</span>
                <span class="metric-value">${data.currentDeployment.version}</span>
            </div>
            <div class="metric">
                <span>Environment:</span>
                <span class="metric-value">${data.currentDeployment.environment}</span>
            </div>
            <div class="metric">
                <span>Status:</span>
                <span class="metric-value">${data.currentDeployment.status}</span>
            </div>
            <div class="metric">
                <span>Progress:</span>
                <span class="metric-value">${data.currentDeployment.progress.toFixed(0)}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${data.currentDeployment.progress}%"></div>
            </div>
            ${data.currentDeployment.estimatedCompletion ? `
            <div class="metric" style="margin-top: 12px;">
                <span>Est. Completion:</span>
                <span class="metric-value">${new Date(data.currentDeployment.estimatedCompletion).toLocaleTimeString()}</span>
            </div>
            ` : ''}
        </div>
        ` : ''}

        <div class="grid">
            <div class="card">
                <h3>✅ Validation Summary</h3>
                <div class="metric">
                    <span>Total Validations:</span>
                    <span class="metric-value">${data.validationSummary.total}</span>
                </div>
                <div class="metric">
                    <span>Passed:</span>
                    <span class="metric-value" style="color: #22c55e">${data.validationSummary.passed}</span>
                </div>
                <div class="metric">
                    <span>Failed:</span>
                    <span class="metric-value" style="color: #ef4444">${data.validationSummary.failed}</span>
                </div>
                <div class="metric">
                    <span>Running:</span>
                    <span class="metric-value" style="color: #f59e0b">${data.validationSummary.running}</span>
                </div>
            </div>

            <div class="card">
                <h3>🚨 Alert Summary</h3>
                <div class="metric">
                    <span>Total Alerts:</span>
                    <span class="metric-value">${data.alertSummary.total}</span>
                </div>
                <div class="metric">
                    <span>Critical:</span>
                    <span class="metric-value" style="color: #ef4444">${data.alertSummary.critical}</span>
                </div>
                <div class="metric">
                    <span>Unresolved:</span>
                    <span class="metric-value" style="color: #f59e0b">${data.alertSummary.unresolved}</span>
                </div>
            </div>

            <div class="card">
                <h3>📊 System Health</h3>
                <div class="metric">
                    <span>Overall:</span>
                    <span class="metric-value" style="color: ${data.metrics.health.overall > 80 ? '#22c55e' : data.metrics.health.overall > 60 ? '#f59e0b' : '#ef4444'}">${data.metrics.health.overall.toFixed(0)}%</span>
                </div>
                <div class="metric">
                    <span>API:</span>
                    <span class="metric-value">${data.metrics.health.components.api.toFixed(0)}%</span>
                </div>
                <div class="metric">
                    <span>Database:</span>
                    <span class="metric-value">${data.metrics.health.components.database.toFixed(0)}%</span>
                </div>
                <div class="metric">
                    <span>Frontend:</span>
                    <span class="metric-value">${data.metrics.health.components.frontend.toFixed(0)}%</span>
                </div>
            </div>

            <div class="card">
                <h3>⚡ Performance</h3>
                <div class="metric">
                    <span>Response Time:</span>
                    <span class="metric-value">${data.metrics.performance.responseTime.toFixed(0)}ms</span>
                </div>
                <div class="metric">
                    <span>Throughput:</span>
                    <span class="metric-value">${data.metrics.performance.throughput.toFixed(0)} req/s</span>
                </div>
                <div class="metric">
                    <span>Error Rate:</span>
                    <span class="metric-value" style="color: ${data.metrics.performance.errorRate > 5 ? '#ef4444' : '#22c55e'}">${data.metrics.performance.errorRate.toFixed(1)}%</span>
                </div>
                <div class="metric">
                    <span>CPU Usage:</span>
                    <span class="metric-value">${data.metrics.performance.cpuUsage.toFixed(0)}%</span>
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 20px;">
            <h3>🔍 Validation Status</h3>
            <div class="validation-grid">
                ${Object.entries(data.metrics.validation).map(([name, status]) => `
                <div class="validation-item validation-${status.status}">
                    <div style="font-weight: 600; margin-bottom: 4px;">${name.replace('_', ' ').toUpperCase()}</div>
                    <div style="font-size: 14px;">Score: ${status.score}</div>
                    <div style="font-size: 12px;">${status.issues} issues</div>
                </div>
                `).join('')}
            </div>
        </div>

        ${data.metrics.alerts.length > 0 ? `
        <div class="card" style="margin-bottom: 20px;">
            <h3>🚨 Active Alerts</h3>
            ${data.metrics.alerts.slice(0, 10).map(alert => `
            <div class="alert ${alert.severity}">
                <div style="font-weight: 600; margin-bottom: 4px;">${alert.title}</div>
                <div style="font-size: 14px; margin-bottom: 8px;">${alert.description}</div>
                <div style="font-size: 12px; color: #64748b;">
                    ${alert.component} • ${new Date(alert.timestamp).toLocaleString()}
                </div>
            </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="card" style="margin-bottom: 20px;">
            <h3>💡 Recommendations</h3>
            ${data.recommendations.map(rec => `
            <div style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">• ${rec}</div>
            `).join('')}
        </div>

        <div class="card">
            <h3>⚡ Quick Actions</h3>
            <div class="quick-actions">
                ${Object.entries(data.quickActions).map(([key, action]) => `
                <button class="action-btn action-${action.severity}" onclick="executeAction('${action.action}')">
                    ${action.label}
                </button>
                `).join('')}
                <button class="action-btn action-low" onclick="refreshDashboard()">
                    🔄 Refresh Dashboard
                </button>
            </div>
        </div>

        <div class="timestamp">
            Last updated: ${new Date(data.timestamp).toLocaleString()}
        </div>
    </div>
</body>
</html>`;
  }

  private async serveDashboard(): Promise<Response> {
    const dashboardData = await this.collectDashboardData();
    const html = this.generateDashboardHTML(dashboardData);
    
    return new Response(html, {
      headers: { "Content-Type": "text/html" }
    });
  }

  private async serveMetrics(): Promise<Response> {
    const metrics = await this.collectMetrics();
    
    return new Response(JSON.stringify(metrics, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  private async serveAlerts(): Promise<Response> {
    return new Response(JSON.stringify(this.alerts, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  private async serveStatus(): Promise<Response> {
    const metrics = await this.collectMetrics();
    const status = {
      status: this.alerts.filter(a => a.severity === "critical").length > 0 ? "critical" :
              this.alerts.length > 0 ? "warning" : "healthy",
      timestamp: new Date().toISOString(),
      deployment: metrics.deployment,
      health: metrics.health.overall
    };
    
    return new Response(JSON.stringify(status, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  private async saveMetrics(metrics: MonitoringMetrics): Promise<void> {
    try {
      const metricsPath = join(this.monitoringDir, `metrics-${Date.now()}.json`);
      await Deno.writeTextFile(metricsPath, JSON.stringify(metrics, null, 2));
    } catch (error) {
      console.warn(`Failed to save metrics: ${error.message}`);
    }
  }

  private printMonitoringSummary(metrics: MonitoringMetrics): void {
    console.log("\n" + "=" * 50);
    console.log("📊 DEPLOYMENT MONITORING SUMMARY");
    console.log("=" * 50);

    console.log(`\n🚀 Deployment Status:`);
    console.log(`   Version: ${metrics.deployment.version}`);
    console.log(`   Environment: ${metrics.deployment.environment}`);
    console.log(`   Status: ${metrics.deployment.status}`);
    if (metrics.deployment.duration) {
      console.log(`   Duration: ${Math.floor(metrics.deployment.duration / 1000)}s`);
    }

    console.log(`\n✅ Validation Summary:`);
    const validations = Object.entries(metrics.validation);
    const passed = validations.filter(([_, v]) => v.status === "passed").length;
    const failed = validations.filter(([_, v]) => v.status === "failed").length;
    console.log(`   Passed: ${passed}/${validations.length}`);
    console.log(`   Failed: ${failed}`);

    if (failed > 0) {
      console.log(`\n❌ Failed Validations:`);
      validations.filter(([_, v]) => v.status === "failed").forEach(([name, status]) => {
        console.log(`   • ${name}: ${status.issues} issues, score ${status.score}`);
      });
    }

    console.log(`\n📈 System Health:`);
    console.log(`   Overall: ${metrics.health.overall.toFixed(0)}%`);
    Object.entries(metrics.health.components).forEach(([component, health]) => {
      console.log(`   ${component}: ${health.toFixed(0)}%`);
    });

    console.log(`\n⚡ Performance:`);
    console.log(`   Response Time: ${metrics.performance.responseTime.toFixed(0)}ms`);
    console.log(`   Error Rate: ${metrics.performance.errorRate.toFixed(1)}%`);
    console.log(`   CPU Usage: ${metrics.performance.cpuUsage.toFixed(0)}%`);

    if (this.alerts.length > 0) {
      console.log(`\n🚨 Active Alerts: ${this.alerts.length}`);
      const critical = this.alerts.filter(a => a.severity === "critical").length;
      const high = this.alerts.filter(a => a.severity === "high").length;
      console.log(`   Critical: ${critical}, High: ${high}`);

      if (critical > 0) {
        console.log(`\n🔴 Critical Alerts:`);
        this.alerts.filter(a => a.severity === "critical").forEach(alert => {
          console.log(`   • ${alert.title}: ${alert.description}`);
        });
      }
    }

    const overallStatus = this.alerts.filter(a => a.severity === "critical").length > 0 ? "CRITICAL" :
                         this.alerts.length > 0 ? "WARNING" : "HEALTHY";
    
    console.log(`\n${overallStatus === "HEALTHY" ? "✅" : overallStatus === "WARNING" ? "⚠️" : "🔴"} Overall Status: ${overallStatus}`);
  }

  setServerMode(enabled: boolean): void {
    this.isServerMode = enabled;
  }
}

// CLI execution
if (import.meta.main) {
  const args = Deno.args;
  const serverMode = args.includes("--server-mode");
  const generateDashboard = args.includes("--generate-dashboard");
  
  const projectRoot = Deno.cwd();
  const monitor = new DeploymentMonitoringSystem(projectRoot);

  try {
    if (serverMode) {
      monitor.setServerMode(true);
      await monitor.startMonitoring();
    } else if (generateDashboard) {
      const dashboardPath = await monitor.generateDashboard();
      console.log(`✅ Dashboard generated: ${dashboardPath}`);
      Deno.exit(0);
    } else {
      await monitor.startMonitoring();
      console.log("✅ Monitoring cycle completed");
      Deno.exit(0);
    }

  } catch (error) {
    console.error("💥 Monitoring system failed:", error.message);
    Deno.exit(1);
  }
}

export { DeploymentMonitoringSystem, type MonitoringMetrics, type DashboardData };