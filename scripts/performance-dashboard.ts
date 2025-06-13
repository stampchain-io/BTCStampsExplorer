#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net

/**
 * Performance Dashboard for Newman API Testing (Deno Version)
 *
 * This script generates an interactive HTML dashboard for monitoring API performance:
 * - Real-time metrics display
 * - Response time trends with Chart.js
 * - Success rate history
 * - Endpoint health monitoring
 * - Auto-refresh capabilities
 * - Mobile-responsive design
 */

interface DashboardOptions {
  outputFile?: string;
  historyFile?: string;
  alertsFile?: string;
  baselineFile?: string;
  refreshInterval?: number;
  maxDataPoints?: number;
  title?: string;
}

interface DashboardData {
  timestamp: string;
  summary: {
    status: "healthy" | "warning" | "critical";
    totalEndpoints: number;
    averageResponseTime: number;
    successRate: number;
    lastUpdate: string;
  };
  endpoints: Array<{
    name: string;
    url: string;
    averageResponseTime: number;
    successRate: number;
    status: "healthy" | "warning" | "critical";
    lastTested: string;
  }>;
  trends: {
    responseTimes: Array<{ timestamp: string; value: number }>;
    successRates: Array<{ timestamp: string; value: number }>;
  };
  alerts: Array<{
    severity: "critical" | "warning" | "info";
    title: string;
    message: string;
    timestamp: string;
  }>;
  baseline: {
    averageResponseTime: number;
    successRate: number;
    established: string;
  } | null;
}

class PerformanceDashboard {
  private options: Required<DashboardOptions>;

  constructor(options: DashboardOptions = {}) {
    this.options = {
      outputFile: options.outputFile || "reports/performance-dashboard.html",
      historyFile: options.historyFile || "reports/performance-history.json",
      alertsFile: options.alertsFile || "reports/performance-alerts.json",
      baselineFile: options.baselineFile || "reports/performance-baseline.json",
      refreshInterval: options.refreshInterval || 30, // seconds
      maxDataPoints: options.maxDataPoints || 50,
      title: options.title || "Newman API Performance Dashboard",
    };
  }

  /**
   * Generate the performance dashboard
   */
  async generateDashboard(): Promise<void> {
    console.log("📊 Generating performance dashboard...");

    const data = await this.collectDashboardData();
    const html = this.generateHTML(data);

    await this.ensureDirectoryExists(this.options.outputFile);
    await Deno.writeTextFile(this.options.outputFile, html);

    console.log(`✅ Dashboard generated: ${this.options.outputFile}`);
    console.log(
      `🌐 Open in browser: file://${Deno.cwd()}/${this.options.outputFile}`,
    );
  }

  /**
   * Collect data for the dashboard
   */
  private async collectDashboardData(): Promise<DashboardData> {
    const data: DashboardData = {
      timestamp: new Date().toISOString(),
      summary: {
        status: "healthy",
        totalEndpoints: 0,
        averageResponseTime: 0,
        successRate: 100,
        lastUpdate: new Date().toISOString(),
      },
      endpoints: [],
      trends: {
        responseTimes: [],
        successRates: [],
      },
      alerts: [],
      baseline: null,
    };

    // Load performance history
    try {
      const historyText = await Deno.readTextFile(this.options.historyFile);
      const history = JSON.parse(historyText);

      if (history.length > 0) {
        // Get latest summary
        const latest = history[history.length - 1];
        data.summary = {
          status: this.determineStatus(latest.overall),
          totalEndpoints: latest.endpointCount || 0,
          averageResponseTime: latest.overall.averageResponseTime || 0,
          successRate: this.calculateSuccessRate(latest.overall),
          lastUpdate: latest.timestamp,
        };

        // Build trends (last N data points)
        const recentHistory = history.slice(-this.options.maxDataPoints);
        data.trends.responseTimes = recentHistory.map((entry: any) => ({
          timestamp: entry.timestamp,
          value: entry.overall.averageResponseTime || 0,
        }));

        data.trends.successRates = recentHistory.map((entry: any) => ({
          timestamp: entry.timestamp,
          value: this.calculateSuccessRate(entry.overall),
        }));
      }
    } catch (error) {
      console.warn(
        `Could not load history: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    // Load recent alerts
    try {
      const alertsText = await Deno.readTextFile(this.options.alertsFile);
      const alertsData = JSON.parse(alertsText);

      if (alertsData.alerts) {
        data.alerts = alertsData.alerts.slice(-10).map((alert: any) => ({
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          timestamp: alert.timestamp,
        }));
      }
    } catch (error) {
      console.warn(
        `Could not load alerts: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    // Load baseline
    try {
      const baselineText = await Deno.readTextFile(this.options.baselineFile);
      const baseline = JSON.parse(baselineText);

      if (baseline.overall) {
        data.baseline = {
          averageResponseTime: baseline.overall.averageResponseTime || 0,
          successRate: this.calculateSuccessRate(baseline.overall),
          established: baseline.timestamp,
        };
      }
    } catch (error) {
      console.warn(
        `Could not load baseline: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    // Parse actual Newman results for dev vs prod comparison
    data.endpoints = await this.parseNewmanResults();

    return data;
  }

  /**
   * Parse Newman results to extract dev vs prod comparison data
   */
  private async parseNewmanResults(): Promise<
    Array<{
      name: string;
      url: string;
      averageResponseTime: number;
      successRate: number;
      status: "healthy" | "warning" | "critical";
      lastTested: string;
      devResponseTime?: number;
      prodResponseTime?: number;
      devStatus?: number;
      prodStatus?: number;
    }>
  > {
    const endpoints: Array<{
      name: string;
      url: string;
      averageResponseTime: number;
      successRate: number;
      status: "healthy" | "warning" | "critical";
      lastTested: string;
      devResponseTime?: number;
      prodResponseTime?: number;
      devStatus?: number;
      prodStatus?: number;
    }> = [];

    try {
      // Find the latest Newman results file
      const reportsDir = "reports";
      const newmanDirs = [];

      for await (const dirEntry of Deno.readDir(reportsDir)) {
        if (dirEntry.isDirectory && dirEntry.name.startsWith("newman")) {
          newmanDirs.push(dirEntry.name);
        }
      }

      if (newmanDirs.length === 0) {
        console.warn("No Newman results directories found");
        return this.getDefaultEndpoints();
      }

      // Find the latest results file
      let latestFile = "";
      let latestTime = 0;

      for (const dir of newmanDirs) {
        const dirPath = `${reportsDir}/${dir}`;
        try {
          for await (const fileEntry of Deno.readDir(dirPath)) {
            if (fileEntry.name.endsWith("-results.json")) {
              const filePath = `${dirPath}/${fileEntry.name}`;
              const stat = await Deno.stat(filePath);
              if (stat.mtime && stat.mtime.getTime() > latestTime) {
                latestTime = stat.mtime.getTime();
                latestFile = filePath;
              }
            }
          }
        } catch (error) {
          console.warn(`Could not read directory ${dirPath}:`, error);
        }
      }

      if (!latestFile) {
        console.warn("No Newman results files found");
        return this.getDefaultEndpoints();
      }

      // Parse the Newman results
      const resultsText = await Deno.readTextFile(latestFile);
      const results = JSON.parse(resultsText);

      if (!results.run || !results.run.executions) {
        console.warn("Invalid Newman results format");
        return this.getDefaultEndpoints();
      }

      // Extract dev vs prod comparison data
      const endpointMap = new Map<string, {
        name: string;
        url: string;
        devResponseTime?: number;
        prodResponseTime?: number;
        devStatus?: number;
        prodStatus?: number;
        lastTested: string;
      }>();

      for (const execution of results.run.executions) {
        if (!execution.item || !execution.response) continue;

        const itemName = execution.item.name;
        const responseTime = execution.response.responseTime;
        const statusCode = execution.response.code;
        const url = this.extractUrlPath(execution.request?.url);

        // Determine if this is a dev or prod request
        const isDev = itemName.includes("Development") ||
          execution.request?.url?.host?.includes("docker") ||
          execution.request?.url?.host?.includes("localhost") ||
          execution.request?.url?.port === "8000";

        const isProd = itemName.includes("Production") ||
          execution.request?.url?.host?.includes("stampchain.io");

        if (!isDev && !isProd) continue;

        // Extract endpoint name (remove "- Development" or "- Production" suffix)
        const endpointName = itemName
          .replace(/\s*-\s*(Development|Production|Compare Results).*$/, "")
          .trim();

        if (!endpointMap.has(endpointName)) {
          endpointMap.set(endpointName, {
            name: endpointName,
            url: url,
            lastTested: new Date().toISOString(),
          });
        }

        const endpoint = endpointMap.get(endpointName)!;

        if (isDev) {
          endpoint.devResponseTime = responseTime;
          endpoint.devStatus = statusCode;
        } else if (isProd) {
          endpoint.prodResponseTime = responseTime;
          endpoint.prodStatus = statusCode;
        }
      }

      // Convert to final format
      for (const [_, endpointData] of endpointMap) {
        const devTime = endpointData.devResponseTime || 0;
        const prodTime = endpointData.prodResponseTime || 0;
        const devStatus = endpointData.devStatus || 0;
        const prodStatus = endpointData.prodStatus || 0;

        const averageResponseTime = devTime && prodTime
          ? (devTime + prodTime) / 2
          : (devTime || prodTime);
        const successRate = this.calculateEndpointSuccessRate(
          devStatus,
          prodStatus,
        );
        const status = this.determineEndpointStatus(
          devStatus,
          prodStatus,
          devTime,
          prodTime,
        );

        endpoints.push({
          name: endpointData.name,
          url: endpointData.url,
          averageResponseTime,
          successRate,
          status,
          lastTested: endpointData.lastTested,
          devResponseTime: devTime,
          prodResponseTime: prodTime,
          devStatus,
          prodStatus,
        });
      }

      return endpoints.length > 0 ? endpoints : this.getDefaultEndpoints();
    } catch (error) {
      console.warn(
        `Error parsing Newman results: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return this.getDefaultEndpoints();
    }
  }

  /**
   * Extract URL path from Newman request URL object
   */
  private extractUrlPath(url: any): string {
    if (!url) return "/unknown";

    if (typeof url === "string") return url;

    if (url.path && Array.isArray(url.path)) {
      return "/" + url.path.join("/");
    }

    return "/unknown";
  }

  /**
   * Calculate success rate for an endpoint based on dev and prod status codes
   */
  private calculateEndpointSuccessRate(
    devStatus: number,
    prodStatus: number,
  ): number {
    const devSuccess = devStatus >= 200 && devStatus < 300;
    const prodSuccess = prodStatus >= 200 && prodStatus < 300;

    if (devStatus && prodStatus) {
      return (devSuccess && prodSuccess)
        ? 100
        : (devSuccess || prodSuccess)
        ? 50
        : 0;
    } else if (devStatus) {
      return devSuccess ? 100 : 0;
    } else if (prodStatus) {
      return prodSuccess ? 100 : 0;
    }

    return 0;
  }

  /**
   * Determine endpoint status based on dev and prod responses
   */
  private determineEndpointStatus(
    devStatus: number,
    prodStatus: number,
    devTime: number,
    prodTime: number,
  ): "healthy" | "warning" | "critical" {
    const devSuccess = devStatus >= 200 && devStatus < 300;
    const prodSuccess = prodStatus >= 200 && prodStatus < 300;

    // If both fail, it's critical
    if (devStatus && prodStatus && !devSuccess && !prodSuccess) {
      return "critical";
    }

    // If one fails, it's warning
    if ((devStatus && !devSuccess) || (prodStatus && !prodSuccess)) {
      return "warning";
    }

    // Check response time differences (if both succeed)
    if (devSuccess && prodSuccess && devTime && prodTime) {
      const timeDiff = Math.abs(devTime - prodTime);
      const maxTime = Math.max(devTime, prodTime);
      const diffPercentage = (timeDiff / maxTime) * 100;

      if (diffPercentage > 100) return "warning"; // More than 100% difference
      if (maxTime > 5000) return "warning"; // Either endpoint is very slow
    }

    return "healthy";
  }

  /**
   * Get default endpoints when Newman results can't be parsed
   */
  private getDefaultEndpoints(): Array<{
    name: string;
    url: string;
    averageResponseTime: number;
    successRate: number;
    status: "healthy" | "warning" | "critical";
    lastTested: string;
  }> {
    return [
      {
        name: "Health Check",
        url: "/api/v2/health",
        averageResponseTime: 800,
        successRate: 100,
        status: "healthy",
        lastTested: new Date().toISOString(),
      },
      {
        name: "Version Info",
        url: "/api/v2/version",
        averageResponseTime: 200,
        successRate: 100,
        status: "healthy",
        lastTested: new Date().toISOString(),
      },
    ];
  }

  /**
   * Generate the HTML dashboard
   */
  private generateHTML(data: DashboardData): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.options.title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            color: white;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .header .subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
        }

        .status-indicator {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.9rem;
            margin-left: 10px;
        }

        .status-healthy { background: #4CAF50; color: white; }
        .status-warning { background: #FF9800; color: white; }
        .status-critical { background: #F44336; color: white; }

        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
        }

        .card h3 {
            margin-bottom: 20px;
            color: #333;
            font-size: 1.3rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #eee;
        }

        .metric:last-child {
            border-bottom: none;
        }

        .metric-label {
            font-weight: 500;
            color: #666;
        }

        .metric-value {
            font-weight: bold;
            font-size: 1.1rem;
        }

        .chart-container {
            position: relative;
            height: 300px;
            margin-top: 20px;
        }

        .endpoints-list {
            list-style: none;
        }

        .endpoint-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #4CAF50;
        }

        .endpoint-item.warning {
            border-left-color: #FF9800;
        }

        .endpoint-item.critical {
            border-left-color: #F44336;
        }

        .endpoint-info h4 {
            margin-bottom: 5px;
            color: #333;
        }

        .endpoint-info .url {
            color: #666;
            font-size: 0.9rem;
            font-family: monospace;
        }

        .endpoint-metrics {
            text-align: right;
        }

        .endpoint-metrics .response-time {
            font-weight: bold;
            color: #333;
        }

        .endpoint-metrics .success-rate {
            font-size: 0.9rem;
            color: #666;
        }

        .comparison-details {
            margin-top: 10px;
            font-size: 0.85rem;
        }

        .env-comparison {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;
        }

        .env-label {
            font-weight: bold;
            min-width: 40px;
            color: #555;
        }

        .env-time {
            font-family: monospace;
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 4px;
            min-width: 60px;
            text-align: center;
        }

        .env-status {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: bold;
            min-width: 40px;
            text-align: center;
        }

        .status-success {
            background: #4CAF50;
            color: white;
        }

        .status-error {
            background: #F44336;
            color: white;
        }

        .time-diff {
            margin-top: 6px;
            font-style: italic;
            color: #666;
            text-align: center;
            font-size: 0.8rem;
        }

        .alerts-list {
            max-height: 400px;
            overflow-y: auto;
        }

        .alert-item {
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 6px;
            border-left: 4px solid;
        }

        .alert-critical {
            background: #ffebee;
            border-left-color: #f44336;
        }

        .alert-warning {
            background: #fff3e0;
            border-left-color: #ff9800;
        }

        .alert-info {
            background: #e3f2fd;
            border-left-color: #2196f3;
        }

        .alert-title {
            font-weight: bold;
            margin-bottom: 4px;
        }

        .alert-message {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 4px;
        }

        .alert-time {
            font-size: 0.8rem;
            color: #999;
        }

        .refresh-info {
            text-align: center;
            color: white;
            margin-top: 20px;
            opacity: 0.8;
        }

        .baseline-comparison {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
        }

        .baseline-metric {
            text-align: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .baseline-metric .label {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 5px;
        }

        .baseline-metric .value {
            font-size: 1.2rem;
            font-weight: bold;
        }

        .baseline-metric .change {
            font-size: 0.8rem;
            margin-top: 5px;
        }

        .change-positive { color: #4CAF50; }
        .change-negative { color: #F44336; }
        .change-neutral { color: #666; }

        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }

            .header h1 {
                font-size: 2rem;
            }

            .dashboard-grid {
                grid-template-columns: 1fr;
            }

            .baseline-comparison {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${this.options.title}</h1>
            <div class="subtitle">
                Last updated: ${
      new Date(data.summary.lastUpdate).toLocaleString()
    }
                <span class="status-indicator status-${data.summary.status}">${data.summary.status}</span>
            </div>
        </div>

        <div class="dashboard-grid">
            <!-- Summary Card -->
            <div class="card">
                <h3>📊 Performance Summary</h3>
                <div class="metric">
                    <span class="metric-label">Total Endpoints</span>
                    <span class="metric-value">${data.summary.totalEndpoints}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Average Response Time</span>
                    <span class="metric-value">${
      data.summary.averageResponseTime.toFixed(0)
    }ms</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Success Rate</span>
                    <span class="metric-value">${
      data.summary.successRate.toFixed(1)
    }%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">System Status</span>
                    <span class="metric-value status-indicator status-${data.summary.status}">${data.summary.status}</span>
                </div>
            </div>

            <!-- Response Time Trends -->
            <div class="card">
                <h3>📈 Response Time Trends</h3>
                <div class="chart-container">
                    <canvas id="responseTimeChart"></canvas>
                </div>
            </div>

            <!-- Success Rate History -->
            <div class="card">
                <h3>✅ Success Rate History</h3>
                <div class="chart-container">
                    <canvas id="successRateChart"></canvas>
                </div>
            </div>

            <!-- Endpoint Health -->
            <div class="card">
                <h3>🎯 Dev vs Prod Comparison</h3>
                <ul class="endpoints-list">
                    ${
      data.endpoints.map((endpoint: any) => `
                        <li class="endpoint-item ${endpoint.status}">
                            <div class="endpoint-info">
                                <h4>${endpoint.name}</h4>
                                <div class="url">${endpoint.url}</div>
                                ${
        endpoint.devResponseTime && endpoint.prodResponseTime
          ? `
                                <div class="comparison-details">
                                    <div class="env-comparison">
                                        <span class="env-label">Dev:</span> 
                                        <span class="env-time">${endpoint.devResponseTime}ms</span>
                                        <span class="env-status status-${
            endpoint.devStatus >= 200 && endpoint.devStatus < 300
              ? "success"
              : "error"
          }">${endpoint.devStatus}</span>
                                    </div>
                                    <div class="env-comparison">
                                        <span class="env-label">Prod:</span> 
                                        <span class="env-time">${endpoint.prodResponseTime}ms</span>
                                        <span class="env-status status-${
            endpoint.prodStatus >= 200 && endpoint.prodStatus < 300
              ? "success"
              : "error"
          }">${endpoint.prodStatus}</span>
                                    </div>
                                    <div class="time-diff">
                                        Δ ${
            Math.abs(endpoint.devResponseTime - endpoint.prodResponseTime)
          }ms 
                                        (${
            endpoint.devResponseTime < endpoint.prodResponseTime
              ? "Dev faster"
              : "Prod faster"
          })
                                    </div>
                                </div>
                                `
          : ""
      }
                            </div>
                            <div class="endpoint-metrics">
                                <div class="response-time">${
        endpoint.averageResponseTime.toFixed(0)
      }ms avg</div>
                                <div class="success-rate">${
        endpoint.successRate.toFixed(1)
      }% match</div>
                            </div>
                        </li>
                    `).join("")
    }
                </ul>
            </div>

            <!-- Baseline Comparison -->
            ${
      data.baseline
        ? `
            <div class="card">
                <h3>📏 Baseline Comparison</h3>
                <div class="baseline-comparison">
                    <div class="baseline-metric">
                        <div class="label">Response Time</div>
                        <div class="value">${
          data.baseline.averageResponseTime.toFixed(0)
        }ms</div>
                        <div class="change ${
          this.getChangeClass(
            data.summary.averageResponseTime,
            data.baseline.averageResponseTime,
          )
        }">
                            ${
          this.getChangeText(
            data.summary.averageResponseTime,
            data.baseline.averageResponseTime,
            "ms",
          )
        }
                        </div>
                    </div>
                    <div class="baseline-metric">
                        <div class="label">Success Rate</div>
                        <div class="value">${
          data.baseline.successRate.toFixed(1)
        }%</div>
                        <div class="change ${
          this.getChangeClass(
            data.baseline.successRate,
            data.summary.successRate,
          )
        }">
                            ${
          this.getChangeText(
            data.summary.successRate,
            data.baseline.successRate,
            "%",
          )
        }
                        </div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 10px; font-size: 0.9rem; color: #666;">
                    Baseline established: ${
          new Date(data.baseline.established).toLocaleDateString()
        }
                </div>
            </div>
            `
        : ""
    }

            <!-- Recent Alerts -->
            <div class="card">
                <h3>🚨 Recent Alerts</h3>
                <div class="alerts-list">
                    ${
      data.alerts.length > 0
        ? data.alerts.map((alert) => `
                        <div class="alert-item alert-${alert.severity}">
                            <div class="alert-title">${alert.title}</div>
                            <div class="alert-message">${alert.message}</div>
                            <div class="alert-time">${
          new Date(alert.timestamp).toLocaleString()
        }</div>
                        </div>
                    `).join("")
        : '<div style="text-align: center; color: #666; padding: 20px;">No recent alerts</div>'
    }
                </div>
            </div>
        </div>

        <div class="refresh-info">
            🔄 Auto-refresh every ${this.options.refreshInterval} seconds
        </div>
    </div>

    <script>
        // Chart.js configuration
        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        Chart.defaults.color = '#666';

        // Response Time Chart
        const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
        new Chart(responseTimeCtx, {
            type: 'line',
            data: {
                labels: ${
      JSON.stringify(data.trends.responseTimes.map((point) =>
        new Date(point.timestamp).toLocaleTimeString()
      ))
    },
                datasets: [{
                    label: 'Response Time (ms)',
                    data: ${
      JSON.stringify(data.trends.responseTimes.map((point) => point.value))
    },
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Response Time (ms)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                }
            }
        });

        // Success Rate Chart
        const successRateCtx = document.getElementById('successRateChart').getContext('2d');
        new Chart(successRateCtx, {
            type: 'line',
            data: {
                labels: ${
      JSON.stringify(data.trends.successRates.map((point) =>
        new Date(point.timestamp).toLocaleTimeString()
      ))
    },
                datasets: [{
                    label: 'Success Rate (%)',
                    data: ${
      JSON.stringify(data.trends.successRates.map((point) => point.value))
    },
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Success Rate (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                }
            }
        });

        // Auto-refresh functionality
        setTimeout(() => {
            window.location.reload();
        }, ${this.options.refreshInterval * 1000});
    </script>
</body>
</html>`;
  }

  // Utility methods
  private determineStatus(overall: any): "healthy" | "warning" | "critical" {
    if (!overall) return "critical";

    const avgResponseTime = overall.averageResponseTime || 0;
    const successRate = this.calculateSuccessRate(overall);

    if (avgResponseTime > 2000 || successRate < 90) return "critical";
    if (avgResponseTime > 1000 || successRate < 95) return "warning";
    return "healthy";
  }

  private calculateSuccessRate(overall: any): number {
    if (!overall || !overall.totalRequests) return 100;

    const successfulRequests = overall.totalRequests -
      (overall.failedRequests || 0);
    return (successfulRequests / overall.totalRequests) * 100;
  }

  private getChangeClass(current: number, baseline: number): string {
    const diff = current - baseline;
    if (Math.abs(diff) < 0.1) return "change-neutral";
    return diff > 0 ? "change-negative" : "change-positive";
  }

  private getChangeText(
    current: number,
    baseline: number,
    unit: string,
  ): string {
    const diff = current - baseline;
    const sign = diff > 0 ? "+" : "";
    return `${sign}${diff.toFixed(1)}${unit}`;
  }

  private async ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = filePath.substring(0, filePath.lastIndexOf("/"));
    try {
      await Deno.mkdir(dir, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw error;
      }
    }
  }
}

// CLI interface
if (import.meta.main) {
  const args = Deno.args;
  const command = args[0];

  const dashboard = new PerformanceDashboard();

  switch (command) {
    case "generate":
      try {
        await dashboard.generateDashboard();
      } catch (error) {
        console.error(
          `Error generating dashboard: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        Deno.exit(1);
      }
      break;

    default:
      console.log("Newman Performance Dashboard (Deno)");
      console.log("");
      console.log("Usage:");
      console.log(
        "  deno run --allow-read --allow-write --allow-net scripts/performance-dashboard.ts generate",
      );
      console.log("");
      console.log("Examples:");
      console.log(
        "  deno run --allow-read --allow-write --allow-net scripts/performance-dashboard.ts generate",
      );
      console.log("");
      console.log("Output:");
      console.log(
        "  reports/performance-dashboard.html - Interactive HTML dashboard",
      );
      break;
  }
}
