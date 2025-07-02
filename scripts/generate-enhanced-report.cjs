#!/usr/bin/env node

const fs = require("fs");

function generateEnhancedReport() {
  try {
    const resultsPath = "reports/newman-comprehensive/test-results.json";
    const validationPath = "reports/expected-changes-validation.json";

    if (!fs.existsSync(resultsPath)) {
      console.log("# Enhanced Newman Test Report - No Results Found");
      return;
    }

    const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
    let validation = null;

    if (fs.existsSync(validationPath)) {
      validation = JSON.parse(fs.readFileSync(validationPath, "utf8"));
    }

    console.log("# Enhanced Newman Test Report - Dev vs Production Analysis");
    console.log("");
    console.log("**Generated:** " + new Date().toISOString().split("T")[0]);
    console.log(
      "**Test Run:** " +
        (results.run && results.run.stats
          ? "Completed"
          : "Collection Info Only"),
    );
    console.log("**Environment Comparison:** Development vs Production");
    console.log("");

    if (results.run && results.run.stats) {
      const stats = results.run.stats;

      console.log("## Overall Test Summary");
      console.log("");
      console.log("| Metric | Count | Status |");
      console.log("|--------|-------|--------|");
      console.log(
        "| Total Tests | " + (stats.tests?.total || "N/A") + " | " +
          getStatusIcon(stats.tests?.total > 0) + " |",
      );
      console.log(
        "| Tests Passed | " + (stats.tests?.passed || "N/A") + " | " +
          getStatusIcon(stats.tests?.passed > 0) + " |",
      );
      console.log(
        "| Tests Failed | " + (stats.tests?.failed || "N/A") + " | " +
          getStatusIcon(stats.tests?.failed === 0) + " |",
      );
      console.log(
        "| Total Assertions | " + (stats.assertions?.total || "N/A") + " | " +
          getStatusIcon(stats.assertions?.total > 0) + " |",
      );
      console.log(
        "| Assertions Failed | " + (stats.assertions?.failed || "N/A") + " | " +
          getStatusIcon(stats.assertions?.failed === 0) + " |",
      );
      console.log("");
    }

    if (validation) {
      console.log("## 🔍 Dev vs Production Differences Analysis");
      console.log("");
      console.log("| Category | Count | Status |");
      console.log("|----------|-------|--------|");
      console.log(
        "| Expected Changes | " + validation.summary.expectedChanges +
          " | ✅ Known differences |",
      );
      console.log(
        "| Unexpected Changes | " + validation.summary.unexpectedChanges +
          " | " + (validation.summary.unexpectedChanges > 0
            ? "❌ Needs investigation"
            : "✅ No issues") +
          " |",
      );
      console.log(
        "| Performance Issues | " +
          (validation.performanceIssues?.length || 0) + " | " +
          (validation.performanceIssues?.length > 0
            ? "⚡ Review needed"
            : "✅ Good performance") +
          " |",
      );
      console.log("");

      // Expected changes section
      if (validation.expectedChanges && validation.expectedChanges.length > 0) {
        console.log("## ✅ Expected Differences (Known & Acceptable)");
        console.log("");
        console.log(
          "These differences are expected between dev and production environments:",
        );
        console.log("");
        validation.expectedChanges.forEach((change) => {
          console.log("### " + change.request);
          console.log("- **Type:** " + change.type);
          console.log("- **Description:** " + change.description);
          console.log("- **Details:** " + change.details);
          console.log("");
        });
      } else {
        console.log("## ✅ Expected Differences (Known & Acceptable)");
        console.log("");
        console.log(
          "**Good news!** No expected differences detected in this test run.",
        );
        console.log("");
        console.log("**Common expected differences include:**");
        console.log(
          "- New fields added in development (marketData, dispenserInfo, cacheStatus)",
        );
        console.log("- Performance differences (dev typically 2-3x slower)");
        console.log("- Missing endpoints not yet implemented");
        console.log("- Status code fixes (404 for invalid IDs)");
        console.log("");
      }

      // Unexpected changes section
      if (
        validation.unexpectedChanges && validation.unexpectedChanges.length > 0
      ) {
        console.log("## ❌ Unexpected Differences (Require Investigation)");
        console.log("");
        console.log(
          "These differences were **NOT expected** and need investigation:",
        );
        console.log("");
        validation.unexpectedChanges.forEach((change) => {
          console.log("### 🚨 " + change.request);
          console.log("- **Assertion:** " + change.assertion);
          console.log("- **Error:** " + change.error);
          if (change.expected && change.actual) {
            console.log("- **Expected:** `" + change.expected + "`");
            console.log("- **Actual:** `" + change.actual + "`");
          }
          console.log("- **Action Needed:** " + getActionNeeded(change));
          console.log("");
        });

        console.log("### 🔧 Recommended Actions:");
        console.log("");
        console.log(
          "1. **Review API error handling** - Several endpoints returning wrong status codes",
        );
        console.log(
          "2. **Update expected changes config** if these differences are intentional",
        );
        console.log(
          "3. **Fix validation logic** for invalid inputs (stamp IDs, addresses, ticks)",
        );
        console.log("4. **Add proper error messages** for validation failures");
        console.log("");
      } else {
        console.log("## ✅ Unexpected Differences");
        console.log("");
        console.log(
          "**Excellent!** No unexpected differences found between dev and production.",
        );
        console.log("All API responses are consistent with expectations.");
        console.log("");
      }

      // Performance section
      if (
        validation.performanceIssues && validation.performanceIssues.length > 0
      ) {
        console.log("## ⚡ Performance Analysis");
        console.log("");
        console.log("Performance issues detected (dev environment):");
        console.log("");
        console.log("| Endpoint | Response Time | Severity | Status |");
        console.log("|----------|---------------|----------|--------|");
        validation.performanceIssues.forEach((issue) => {
          const severityIcon = issue.severity === "critical" ? "🔴" : "🟡";
          const status = issue.severity === "critical"
            ? "Needs optimization"
            : "Monitor trend";
          console.log(
            "| " + issue.request + " | " + issue.responseTime + "ms | " +
              severityIcon + " " + issue.severity + " | " + status + " |",
          );
        });
        console.log("");

        console.log("### Performance Baseline:");
        console.log("- **Target:** < 1000ms for most endpoints");
        console.log("- **Warning:** 1000-2000ms (yellow 🟡)");
        console.log("- **Critical:** > 2000ms (red 🔴)");
        console.log(
          "- **Expected:** Dev environment is typically 2-3x slower than production",
        );
        console.log("");
      }
    }

    // Known configuration differences
    console.log("## 🔧 Known Configuration Differences");
    console.log("");
    console.log("### Expected Field Additions in Development:");
    console.log("- `marketData` - Floor price and market statistics");
    console.log("- `dispenserInfo` - Dispenser counts and status");
    console.log("- `cacheStatus` - Cache freshness indicators");
    console.log("- `createdAt` / `updatedAt` - Timestamp fields");
    console.log("");

    console.log("### Expected Status Code Changes:");
    console.log(
      "- `/api/v2/stamps/invalid` - Should return 404 (currently 200)",
    );
    console.log("- Invalid addresses - Should return 400 (currently 500)");
    console.log("- Invalid SRC20 ticks - Should return 400 with error message");
    console.log("");

    console.log("### Missing Endpoints (To Be Implemented):");
    console.log("- `/api/v2/stamps/{id}/dispensers`");
    console.log("- `/api/v2/stamps/{id}/dispenses`");
    console.log("");

    // Endpoint coverage
    const endpoints = new Set();
    if (results.collection && results.collection.item) {
      results.collection.item.forEach((folder) => {
        if (folder.item) {
          folder.item.forEach((request) => {
            if (
              request.request && request.request.url && request.request.url.path
            ) {
              const path = "/" +
                request.request.url.path.join("/").replace(
                  /\{\{[^}]+\}\}/g,
                  "{param}",
                );
              endpoints.add(path);
            }
          });
        }
      });
    }

    console.log("## 📊 Test Coverage Summary");
    console.log("");
    console.log(
      "**Unique Endpoints Tested:** " + endpoints.size + "/46 (estimated)",
    );
    console.log(
      "**Coverage Percentage:** ~" + Math.round((endpoints.size / 46) * 100) +
        "%",
    );
    console.log("");

    console.log("## 🚀 Next Steps");
    console.log("");
    if (validation && validation.summary.unexpectedChanges > 0) {
      console.log("### High Priority:");
      console.log("1. **Fix error handling** for invalid inputs");
      console.log(
        "2. **Update validation logic** to return proper status codes",
      );
      console.log("3. **Add error messages** for better API usability");
      console.log("");
    }

    console.log("### Ongoing:");
    console.log("1. **Monitor performance trends** in dev environment");
    console.log(
      "2. **Update expected changes config** as new features are added",
    );
    console.log("3. **Expand test coverage** to remaining endpoints");
    console.log("4. **Run daily regression tests** to catch changes early");
    console.log("");

    console.log("---");
    console.log("*Enhanced report generated from:*");
    console.log("- *Test results: " + resultsPath + "*");
    if (validation) {
      console.log("- *Validation: " + validationPath + "*");
    }
    console.log(
      "- *Expected changes config: scripts/validate-expected-changes.js*",
    );
  } catch (error) {
    console.log("# Enhanced Newman Test Report - Error");
    console.log("");
    console.log("Error generating report: " + error.message);
  }
}

function getStatusIcon(isGood) {
  return isGood ? "✅" : "❌";
}

function getActionNeeded(change) {
  if (
    change.error.includes("status code 404") && change.error.includes("got 200")
  ) {
    return "Fix API to return 404 for invalid resources";
  } else if (
    change.error.includes("status code 400") && change.error.includes("got 500")
  ) {
    return "Fix error handling to return 400 for bad requests";
  } else if (
    change.error.includes("status code 400") && change.error.includes("got 200")
  ) {
    return "Add input validation to reject invalid parameters";
  } else if (change.error.includes("match /tick|length|5/i")) {
    return "Add proper error messages for validation failures";
  } else {
    return "Investigate and fix API behavior";
  }
}

generateEnhancedReport();
