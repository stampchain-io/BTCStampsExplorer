#!/usr/bin/env node

import fs from "fs";
import path from "path";
import process from "node:process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Analyze Newman test results for regression detection
 * Compares dev vs prod responses to identify breaking changes
 */

// Configuration for allowed changes
const ALLOWED_FIELD_ADDITIONS = ["marketData", "dispenserInfo", "cacheStatus"];
const PERFORMANCE_THRESHOLD_WARNING = 10; // 10% slower = warning
const PERFORMANCE_THRESHOLD_CRITICAL = 25; // 25% slower = critical

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function findLatestReport(reportDir) {
  const files = fs.readdirSync(reportDir)
    .filter((f) => f.endsWith("-results.json"))
    .map(f => ({
      name: f,
      path: path.join(reportDir, f),
      time: fs.statSync(path.join(reportDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time); // Sort by modification time descending

  return files.length > 0 ? files[0].path : null;
}

function analyzeRegression(results) {
  const regressions = {
    breaking: [],
    nonBreaking: [],
    performance: [],
    improvements: [],
  };

  if (!results.run || !results.run.executions) {
    console.error("Invalid Newman results format");
    return regressions;
  }

  results.run.executions.forEach((execution) => {
    const request = execution.item.name;
    const devResponse = execution.response;

    // Skip if no assertions or all passed
    if (!execution.assertions || execution.assertions.length === 0) {
      return;
    }

    // Check for failed assertions
    execution.assertions.forEach((assertion) => {
      if (assertion.error) {
        const error = assertion.error;
        const isBreaking = analyzeBreaking(error, request);

        if (isBreaking) {
          regressions.breaking.push({
            request,
            assertion: assertion.assertion,
            error: error.message,
            expected: error.expected,
            actual: error.actual,
          });
        } else {
          regressions.nonBreaking.push({
            request,
            assertion: assertion.assertion,
            error: error.message,
            type: categorizeNonBreaking(error),
          });
        }
      }
    });

    // Analyze performance
    if (devResponse && devResponse.responseTime) {
      const perfAnalysis = analyzePerformance(execution, request);
      if (perfAnalysis) {
        regressions.performance.push(perfAnalysis);
      }
    }
  });

  return regressions;
}

function analyzeBreaking(error, _request) {
  // Check if it's a field addition vs removal
  if (error.message && error.message.includes("field")) {
    const fieldMatch = error.message.match(/field\s+["'](\w+)["']/);
    if (fieldMatch && ALLOWED_FIELD_ADDITIONS.includes(fieldMatch[1])) {
      return false; // Non-breaking addition
    }
  }

  // Missing fields, type changes, status code changes are breaking
  if (
    error.message && (
      error.message.includes("missing") ||
      error.message.includes("type mismatch") ||
      error.message.includes("status code")
    )
  ) {
    return true;
  }

  return false;
}

function categorizeNonBreaking(error) {
  if (error.message.includes("additional field")) {
    return "field_addition";
  }
  if (error.message.includes("timezone")) {
    return "timezone_difference";
  }
  if (error.message.includes("ordering")) {
    return "ordering_change";
  }
  return "other";
}

function analyzePerformance(execution, request) {
  const devTime = execution.response.responseTime;

  // Look for prod comparison in global variables or environment
  const prodTime = execution.globals?.get(`${request}_prod_time`) || null;

  if (!prodTime) {
    return null;
  }

  const percentChange = ((devTime - prodTime) / prodTime) * 100;

  if (percentChange > PERFORMANCE_THRESHOLD_CRITICAL) {
    return {
      request,
      devTime,
      prodTime,
      percentChange: percentChange.toFixed(2),
      severity: "critical",
    };
  } else if (percentChange > PERFORMANCE_THRESHOLD_WARNING) {
    return {
      request,
      devTime,
      prodTime,
      percentChange: percentChange.toFixed(2),
      severity: "warning",
    };
  } else if (percentChange < -10) {
    // Performance improvement
    return {
      request,
      devTime,
      prodTime,
      percentChange: percentChange.toFixed(2),
      severity: "improvement",
    };
  }

  return null;
}

function generateReport(regressions) {
  console.log(
    "\n" + colors.bright + "=== Newman Regression Analysis Report ===" +
      colors.reset,
  );
  console.log(new Date().toISOString());

  // Breaking Changes
  if (regressions.breaking.length > 0) {
    console.log(
      "\n" + colors.red + colors.bright + "⚠️  BREAKING CHANGES DETECTED" +
        colors.reset,
    );
    regressions.breaking.forEach((reg) => {
      console.log(colors.red + `\n  ${reg.request}:` + colors.reset);
      console.log(`    Assertion: ${reg.assertion}`);
      console.log(`    Error: ${reg.error}`);
      if (reg.expected) console.log(`    Expected: ${reg.expected}`);
      if (reg.actual) console.log(`    Actual: ${reg.actual}`);
    });
  } else {
    console.log(
      "\n" + colors.green + "✓ No breaking changes detected" + colors.reset,
    );
  }

  // Non-Breaking Changes
  if (regressions.nonBreaking.length > 0) {
    console.log(
      "\n" + colors.yellow + "⚡ Non-Breaking Changes:" + colors.reset,
    );
    const grouped = regressions.nonBreaking.reduce((acc, reg) => {
      if (!acc[reg.type]) acc[reg.type] = [];
      acc[reg.type].push(reg);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([type, items]) => {
      console.log(
        `\n  ${
          type.replace(/_/g, " ").toUpperCase()
        } (${items.length} occurrences)`,
      );
      items.slice(0, 3).forEach((item) => {
        console.log(`    - ${item.request}: ${item.assertion}`);
      });
      if (items.length > 3) {
        console.log(`    ... and ${items.length - 3} more`);
      }
    });
  }

  // Performance Issues
  if (regressions.performance.length > 0) {
    console.log(
      "\n" + colors.magenta + "⏱️  Performance Analysis:" + colors.reset,
    );

    const critical = regressions.performance.filter((p) =>
      p.severity === "critical"
    );
    const warnings = regressions.performance.filter((p) =>
      p.severity === "warning"
    );
    const improvements = regressions.performance.filter((p) =>
      p.severity === "improvement"
    );

    if (critical.length > 0) {
      console.log(
        colors.red + "\n  Critical Performance Issues:" + colors.reset,
      );
      critical.forEach((perf) => {
        console.log(
          `    - ${perf.request}: ${perf.percentChange}% slower (${perf.devTime}ms vs ${perf.prodTime}ms)`,
        );
      });
    }

    if (warnings.length > 0) {
      console.log(colors.yellow + "\n  Performance Warnings:" + colors.reset);
      warnings.forEach((perf) => {
        console.log(
          `    - ${perf.request}: ${perf.percentChange}% slower (${perf.devTime}ms vs ${perf.prodTime}ms)`,
        );
      });
    }

    if (improvements.length > 0) {
      console.log(
        colors.green + "\n  Performance Improvements:" + colors.reset,
      );
      improvements.forEach((perf) => {
        console.log(
          `    - ${perf.request}: ${
            Math.abs(perf.percentChange)
          }% faster (${perf.devTime}ms vs ${perf.prodTime}ms)`,
        );
      });
    }
  }

  // Summary
  console.log("\n" + colors.bright + "=== Summary ===" + colors.reset);
  console.log(`Breaking Changes: ${regressions.breaking.length}`);
  console.log(`Non-Breaking Changes: ${regressions.nonBreaking.length}`);
  console.log(
    `Performance Issues: ${
      regressions.performance.filter((p) => p.severity !== "improvement").length
    }`,
  );
  console.log(
    `Performance Improvements: ${
      regressions.performance.filter((p) => p.severity === "improvement").length
    }`,
  );

  // Exit code
  const exitCode = regressions.breaking.length > 0 ? 1 : 0;
  console.log(`\nExit Code: ${exitCode}`);

  return exitCode;
}

// Main execution
function main() {
  // Check both possible locations for Newman reports
  const comprehensiveDir = path.join(
    __dirname,
    "..",
    "reports",
    "newman-comprehensive",
  );
  const regularDir = path.join(
    __dirname,
    "..",
    "reports",
    "newman",
  );

  // Prefer regular newman directory if it exists and has recent results
  let reportDir = regularDir;
  if (!fs.existsSync(regularDir) || fs.readdirSync(regularDir).filter(f => f.endsWith('-results.json')).length === 0) {
    // Fall back to comprehensive directory
    reportDir = comprehensiveDir;
  }

  if (!fs.existsSync(reportDir)) {
    console.error(
      colors.red +
        "Error: No Newman reports found. Run tests first." +
        colors.reset,
    );
    console.log("Run: npm run test:api:comprehensive or npm run test:api:regression");
    process.exit(1);
  }

  const latestReport = findLatestReport(reportDir);
  if (!latestReport) {
    console.error(
      colors.red + "Error: No test results found in reports directory." +
        colors.reset,
    );
    process.exit(1);
  }

  const fileStats = fs.statSync(latestReport);
  const fileDate = fileStats.mtime.toISOString();
  console.log(`Analyzing: ${path.relative(process.cwd(), latestReport)}`);
  console.log(`File Date: ${fileDate}`);
  console.log(`Directory: ${reportDir}`);
  console.log("");

  try {
    const resultsData = fs.readFileSync(latestReport, "utf8");
    const results = JSON.parse(resultsData);

    const regressions = analyzeRegression(results);
    const exitCode = generateReport(regressions);

    // Save analysis report
    const analysisReport = {
      timestamp: new Date().toISOString(),
      sourceFile: path.basename(latestReport),
      regressions,
      summary: {
        breaking: regressions.breaking.length,
        nonBreaking: regressions.nonBreaking.length,
        performanceIssues: regressions.performance.filter((p) =>
          p.severity !== "improvement"
        ).length,
        performanceImprovements: regressions.performance.filter((p) =>
          p.severity === "improvement"
        ).length,
      },
    };

    const analysisPath = latestReport.replace(
      "-results.json",
      "-analysis.json",
    );
    fs.writeFileSync(analysisPath, JSON.stringify(analysisReport, null, 2));
    console.log(`\nAnalysis saved to: ${path.basename(analysisPath)}`);

    process.exit(exitCode);
  } catch (error) {
    console.error(
      colors.red + "Error analyzing results:" + colors.reset,
      error.message,
    );
    process.exit(1);
  }
}

// Run the analysis
main().catch(console.error);
