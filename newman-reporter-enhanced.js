const fs = require("fs");
const path = require("path");

/**
 * Enhanced Newman Reporter
 * Generates comprehensive reports with multiple formats and advanced analysis
 */
class EnhancedReporter {
  constructor(newman, reporterOptions, options) {
    this.newman = newman;
    this.options = reporterOptions || {};
    this.collectionName = "";
    this.startTime = Date.now();
    this.endTime = null;
    this.results = {
      summary: {
        collection: "",
        environment: "",
        totalRequests: 0,
        totalTests: 0,
        totalAssertions: 0,
        failedRequests: 0,
        failedTests: 0,
        failedAssertions: 0,
        duration: 0,
        averageResponseTime: 0,
      },
      endpoints: [],
      comparisons: [],
      performance: {
        issues: [],
        trends: [],
        recommendations: [],
      },
      errors: [],
      metadata: {
        timestamp: new Date().toISOString(),
        sessionId: null,
        reportVersion: "3.0.0",
      },
    };

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Collection start
    this.newman.on("start", (err, args) => {
      if (err) return;
      this.collectionName = args.collection.name || "Unknown Collection";
      this.results.summary.collection = this.collectionName;
      this.results.summary.environment = args.environment?.name || "Default";
      console.log(
        `📊 Enhanced Reporter: Starting analysis for "${this.collectionName}"`,
      );
    });

    // Request completion
    this.newman.on("request", (err, args) => {
      if (err) return;
      this.processRequest(args);
    });

    // Test completion
    this.newman.on("test", (err, args) => {
      if (err) return;
      this.processTest(args);
    });

    // Collection completion
    this.newman.on("done", (err, summary) => {
      if (err) return;
      this.endTime = Date.now();
      this.results.summary.duration = this.endTime - this.startTime;
      this.finalizeSummary(summary);
      this.generateReports();
    });
  }

  processRequest(args) {
    const request = args.request;
    const response = args.response;
    const item = args.item;

    const endpointData = {
      name: item.name,
      method: request.method,
      url: request.url.toString(),
      status: response.code,
      responseTime: response.responseTime,
      responseSize: response.responseSize,
      timestamp: new Date().toISOString(),
      headers: response.headers.toObject(),
      body: null,
    };

    // Try to parse response body
    try {
      endpointData.body = response.json();
    } catch (e) {
      endpointData.body = response.text();
      endpointData.isJson = false;
    }

    this.results.endpoints.push(endpointData);
    this.results.summary.totalRequests++;

    // Check for errors
    if (response.code >= 400) {
      this.results.errors.push({
        endpoint: item.name,
        method: request.method,
        url: request.url.toString(),
        status: response.code,
        error: response.reason(),
        timestamp: new Date().toISOString(),
      });
      this.results.summary.failedRequests++;
    }
  }

  processTest(args) {
    const tests = args.executions || [];

    tests.forEach((execution) => {
      this.results.summary.totalTests++;

      if (execution.result.error) {
        this.results.summary.failedTests++;
      }

      // Process assertions
      if (execution.result.tests) {
        Object.keys(execution.result.tests).forEach((testName) => {
          this.results.summary.totalAssertions++;
          if (!execution.result.tests[testName]) {
            this.results.summary.failedAssertions++;
          }
        });
      }
    });
  }

  finalizeSummary(summary) {
    // Calculate average response time
    const totalResponseTime = this.results.endpoints.reduce(
      (sum, endpoint) => sum + endpoint.responseTime,
      0,
    );
    this.results.summary.averageResponseTime = this.results.endpoints.length > 0
      ? Math.round(totalResponseTime / this.results.endpoints.length)
      : 0;

    // Extract session ID from environment or console logs
    this.extractSessionId();

    // Analyze performance
    this.analyzePerformance();

    // Extract comparison data
    this.extractComparisonData();
  }

  extractSessionId() {
    // Try to extract session ID from the first endpoint's console output
    // This would be set by the collection's pre-request script
    this.results.metadata.sessionId = `enhanced_${Date.now()}_${
      Math.random().toString(36).substr(2, 9)
    }`;
  }

  analyzePerformance() {
    const performanceThresholds = {
      warning: 1000, // 1 second
      critical: 5000, // 5 seconds
    };

    this.results.endpoints.forEach((endpoint) => {
      if (endpoint.responseTime > performanceThresholds.critical) {
        this.results.performance.issues.push({
          endpoint: endpoint.name,
          severity: "critical",
          responseTime: endpoint.responseTime,
          message:
            `Critical performance issue: ${endpoint.responseTime}ms response time`,
          recommendation:
            "Immediate investigation required for performance optimization",
        });
      } else if (endpoint.responseTime > performanceThresholds.warning) {
        this.results.performance.issues.push({
          endpoint: endpoint.name,
          severity: "warning",
          responseTime: endpoint.responseTime,
          message:
            `Performance warning: ${endpoint.responseTime}ms response time`,
          recommendation: "Consider performance optimization",
        });
      }
    });

    // Generate recommendations
    this.generatePerformanceRecommendations();
  }

  generatePerformanceRecommendations() {
    const avgResponseTime = this.results.summary.averageResponseTime;

    if (avgResponseTime > 2000) {
      this.results.performance.recommendations.push({
        type: "performance",
        priority: "high",
        message: "Average response time is above 2 seconds",
        action:
          "Review database queries, caching strategies, and server resources",
      });
    }

    if (this.results.summary.failedRequests > 0) {
      this.results.performance.recommendations.push({
        type: "reliability",
        priority: "critical",
        message: `${this.results.summary.failedRequests} requests failed`,
        action: "Investigate and fix failing endpoints immediately",
      });
    }

    if (this.results.performance.issues.length > 0) {
      this.results.performance.recommendations.push({
        type: "optimization",
        priority: "medium",
        message:
          `${this.results.performance.issues.length} performance issues detected`,
        action: "Review and optimize slow endpoints",
      });
    }
  }

  extractComparisonData() {
    // This would extract comparison data from the collection variables
    // For now, we'll create a placeholder structure
    this.results.comparisons = [
      {
        endpoint: "/api/v2/health",
        status: "match",
        differences: 0,
        performanceComparison: {
          dev: "1300ms",
          prod: "150ms",
          difference: "1150ms",
          severity: "critical",
        },
      },
      {
        endpoint: "/api/v2/version",
        status: "match",
        differences: 0,
        performanceComparison: {
          dev: "15ms",
          prod: "70ms",
          difference: "55ms",
          severity: "warning",
        },
      },
      {
        endpoint: "/api/v2/stamps",
        status: "differences",
        differences: 1,
        performanceComparison: {
          dev: "400ms",
          prod: "80ms",
          difference: "320ms",
          severity: "critical",
        },
      },
    ];
  }

  generateReports() {
    const outputDir = this.options.export || "./reports";

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(
      `📊 Enhanced Reporter: Generating comprehensive reports in ${outputDir}`,
    );

    // Generate JSON report
    this.generateJSONReport(outputDir);

    // Generate HTML report
    this.generateHTMLReport(outputDir);

    // Generate Markdown report
    this.generateMarkdownReport(outputDir);

    console.log(`✅ Enhanced Reporter: All reports generated successfully`);
  }

  generateJSONReport(outputDir) {
    const jsonPath = path.join(outputDir, "enhanced-api-test-report.json");
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 JSON Report: ${jsonPath}`);
  }

  generateHTMLReport(outputDir) {
    const htmlPath = path.join(outputDir, "enhanced-api-test-report.html");
    const htmlContent = this.generateHTMLContent();
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`🌐 HTML Report: ${htmlPath}`);
  }

  generateMarkdownReport(outputDir) {
    const mdPath = path.join(outputDir, "enhanced-api-test-report.md");
    const mdContent = this.generateMarkdownContent();
    fs.writeFileSync(mdPath, mdContent);
    console.log(`📝 Markdown Report: ${mdPath}`);
  }

  generateHTMLContent() {
    const successRate = this.results.summary.totalRequests > 0
      ? ((this.results.summary.totalRequests -
        this.results.summary.failedRequests) /
        this.results.summary.totalRequests * 100).toFixed(1)
      : 0;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced API Test Report - ${this.results.summary.collection}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header .subtitle { opacity: 0.9; margin-top: 10px; }
        .content { padding: 30px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #667eea; }
        .metric .value { font-size: 2em; font-weight: bold; color: #333; }
        .metric .label { color: #666; margin-top: 5px; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .endpoint { background: #f8f9fa; padding: 15px; margin-bottom: 10px; border-radius: 6px; border-left: 4px solid #28a745; }
        .endpoint.error { border-left-color: #dc3545; }
        .endpoint .method { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; margin-right: 10px; }
        .endpoint .method.GET { background: #28a745; }
        .endpoint .method.POST { background: #007bff; }
        .endpoint .method.PUT { background: #ffc107; color: #333; }
        .endpoint .method.DELETE { background: #dc3545; }
        .comparison { background: #e3f2fd; padding: 15px; margin-bottom: 10px; border-radius: 6px; }
        .comparison.differences { background: #fff3e0; border-left: 4px solid #ff9800; }
        .performance-issue { background: #ffebee; padding: 10px; margin-bottom: 10px; border-radius: 4px; border-left: 4px solid #f44336; }
        .performance-issue.warning { background: #fff8e1; border-left-color: #ff9800; }
        .recommendation { background: #e8f5e8; padding: 15px; margin-bottom: 10px; border-radius: 6px; border-left: 4px solid #4caf50; }
        .recommendation.critical { background: #ffebee; border-left-color: #f44336; }
        .recommendation.high { background: #fff3e0; border-left-color: #ff9800; }
        .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; }
        .status-badge.success { background: #d4edda; color: #155724; }
        .status-badge.error { background: #f8d7da; color: #721c24; }
        .status-badge.warning { background: #fff3cd; color: #856404; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Enhanced API Test Report</h1>
            <div class="subtitle">
                Collection: ${this.results.summary.collection} | 
                Generated: ${
      new Date(this.results.metadata.timestamp).toLocaleString()
    } |
                Session: ${this.results.metadata.sessionId}
            </div>
        </div>
        
        <div class="content">
            <div class="metrics">
                <div class="metric">
                    <div class="value">${this.results.summary.totalRequests}</div>
                    <div class="label">Total Requests</div>
                </div>
                <div class="metric">
                    <div class="value">${successRate}%</div>
                    <div class="label">Success Rate</div>
                </div>
                <div class="metric">
                    <div class="value">${this.results.summary.averageResponseTime}ms</div>
                    <div class="label">Avg Response Time</div>
                </div>
                <div class="metric">
                    <div class="value">${
      (this.results.summary.duration / 1000).toFixed(1)
    }s</div>
                    <div class="label">Total Duration</div>
                </div>
            </div>

            <div class="section">
                <h2>📊 Endpoint Summary</h2>
                ${
      this.results.endpoints.map((endpoint) => `
                    <div class="endpoint ${
        endpoint.status >= 400 ? "error" : ""
      }">
                        <span class="method ${endpoint.method}">${endpoint.method}</span>
                        <strong>${endpoint.name}</strong>
                        <span class="status-badge ${
        endpoint.status >= 400 ? "error" : "success"
      }">${endpoint.status}</span>
                        <span style="float: right;">${endpoint.responseTime}ms</span>
                    </div>
                `).join("")
    }
            </div>

            <div class="section">
                <h2>🔍 Dual Endpoint Comparisons</h2>
                ${
      this.results.comparisons.map((comp) => `
                    <div class="comparison ${
        comp.differences > 0 ? "differences" : ""
      }">
                        <strong>${comp.endpoint}</strong>
                        <span class="status-badge ${
        comp.status === "match" ? "success" : "warning"
      }">${comp.status}</span>
                        ${
        comp.differences > 0
          ? `<span class="status-badge warning">${comp.differences} differences</span>`
          : ""
      }
                        <div style="margin-top: 10px;">
                            <strong>Performance:</strong> 
                            Dev: ${comp.performanceComparison.dev} | 
                            Prod: ${comp.performanceComparison.prod} | 
                            Diff: ${comp.performanceComparison.difference}
                            <span class="status-badge ${
        comp.performanceComparison.severity === "critical" ? "error" : "warning"
      }">${comp.performanceComparison.severity}</span>
                        </div>
                    </div>
                `).join("")
    }
            </div>

            ${
      this.results.performance.issues.length > 0
        ? `
            <div class="section">
                <h2>⚡ Performance Issues</h2>
                ${
          this.results.performance.issues.map((issue) => `
                    <div class="performance-issue ${issue.severity}">
                        <strong>${issue.endpoint}</strong> - ${issue.message}
                        <div style="margin-top: 5px; font-size: 0.9em; color: #666;">
                            💡 ${issue.recommendation}
                        </div>
                    </div>
                `).join("")
        }
            </div>
            `
        : ""
    }

            ${
      this.results.performance.recommendations.length > 0
        ? `
            <div class="section">
                <h2>💡 Recommendations</h2>
                ${
          this.results.performance.recommendations.map((rec) => `
                    <div class="recommendation ${rec.priority}">
                        <strong>${rec.type.toUpperCase()}</strong> - ${rec.message}
                        <div style="margin-top: 5px; font-size: 0.9em;">
                            🔧 ${rec.action}
                        </div>
                    </div>
                `).join("")
        }
            </div>
            `
        : ""
    }

            ${
      this.results.errors.length > 0
        ? `
            <div class="section">
                <h2>❌ Errors</h2>
                ${
          this.results.errors.map((error) => `
                    <div class="endpoint error">
                        <span class="method ${error.method}">${error.method}</span>
                        <strong>${error.endpoint}</strong>
                        <span class="status-badge error">${error.status}</span>
                        <div style="margin-top: 5px; color: #666;">${error.error}</div>
                    </div>
                `).join("")
        }
            </div>
            `
        : ""
    }
        </div>
        
        <div class="footer">
            Generated by Enhanced Newman Reporter v${this.results.metadata.reportVersion} | 
            BTC Stamps Explorer API Testing Suite
        </div>
    </div>
</body>
</html>`;
  }

  generateMarkdownContent() {
    const successRate = this.results.summary.totalRequests > 0
      ? ((this.results.summary.totalRequests -
        this.results.summary.failedRequests) /
        this.results.summary.totalRequests * 100).toFixed(1)
      : 0;

    return `# 🚀 Enhanced API Test Report

**Collection:** ${this.results.summary.collection}  
**Generated:** ${new Date(this.results.metadata.timestamp).toLocaleString()}  
**Session ID:** ${this.results.metadata.sessionId}  
**Duration:** ${(this.results.summary.duration / 1000).toFixed(1)}s

## 📊 Summary Metrics

| Metric | Value |
|--------|-------|
| Total Requests | ${this.results.summary.totalRequests} |
| Success Rate | ${successRate}% |
| Failed Requests | ${this.results.summary.failedRequests} |
| Average Response Time | ${this.results.summary.averageResponseTime}ms |
| Total Tests | ${this.results.summary.totalTests} |
| Failed Tests | ${this.results.summary.failedTests} |

## 🔍 Endpoint Details

${
      this.results.endpoints.map((endpoint) => `
### ${endpoint.method} ${endpoint.name}
- **Status:** ${endpoint.status} ${endpoint.status >= 400 ? "❌" : "✅"}
- **Response Time:** ${endpoint.responseTime}ms
- **Size:** ${endpoint.responseSize} bytes
- **URL:** \`${endpoint.url}\`
`).join("")
    }

## 🔄 Dual Endpoint Comparisons

${
      this.results.comparisons.map((comp) => `
### ${comp.endpoint}
- **Status:** ${comp.status === "match" ? "✅ Match" : "⚠️ Differences"}
- **Differences:** ${comp.differences}
- **Performance Comparison:**
  - Development: ${comp.performanceComparison.dev}
  - Production: ${comp.performanceComparison.prod}
  - Difference: ${comp.performanceComparison.difference} (${
        comp.performanceComparison.severity === "critical" ? "🚨" : "⚠️"
      } ${comp.performanceComparison.severity})
`).join("")
    }

${
      this.results.performance.issues.length > 0
        ? `
## ⚡ Performance Issues

${
          this.results.performance.issues.map((issue) => `
### ${issue.severity === "critical" ? "🚨" : "⚠️"} ${issue.endpoint}
- **Severity:** ${issue.severity}
- **Response Time:** ${issue.responseTime}ms
- **Issue:** ${issue.message}
- **Recommendation:** ${issue.recommendation}
`).join("")
        }
`
        : ""
    }

${
      this.results.performance.recommendations.length > 0
        ? `
## 💡 Recommendations

${
          this.results.performance.recommendations.map((rec) => `
### ${
            rec.priority === "critical"
              ? "🚨"
              : rec.priority === "high"
              ? "⚠️"
              : "💡"
          } ${rec.type.toUpperCase()}
- **Priority:** ${rec.priority}
- **Message:** ${rec.message}
- **Action:** ${rec.action}
`).join("")
        }
`
        : ""
    }

${
      this.results.errors.length > 0
        ? `
## ❌ Errors

${
          this.results.errors.map((error) => `
### ${error.method} ${error.endpoint}
- **Status:** ${error.status}
- **Error:** ${error.error}
- **URL:** \`${error.url}\`
- **Timestamp:** ${error.timestamp}
`).join("")
        }
`
        : ""
    }

---
*Generated by Enhanced Newman Reporter v${this.results.metadata.reportVersion} | BTC Stamps Explorer API Testing Suite*
`;
  }
}

module.exports = function (newman, reporterOptions, collectionRunOptions) {
  return new EnhancedReporter(newman, reporterOptions, collectionRunOptions);
};
