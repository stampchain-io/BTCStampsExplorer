#!/usr/bin/env node

const fs = require("fs");

function generateMarkdownReport() {
  try {
    const resultsPath = "reports/newman-comprehensive/test-results.json";
    if (!fs.existsSync(resultsPath)) {
      console.log("# Newman Test Report - No Results Found");
      console.log("");
      console.log("No test results found at: " + resultsPath);
      return;
    }

    const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));

    console.log("# Newman Comprehensive Test Report");
    console.log("");
    console.log("**Generated:** " + new Date().toISOString().split("T")[0]);
    console.log(
      "**Test Run:** " +
        (results.run && results.run.stats
          ? "Completed"
          : "Collection Info Only"),
    );
    console.log("");

    if (results.run && results.run.stats) {
      const stats = results.run.stats;

      console.log("## Test Summary");
      console.log("");
      console.log("| Metric | Count |");
      console.log("|--------|-------|");
      console.log("| Total Tests | " + (stats.tests?.total || "N/A") + " |");
      console.log("| Tests Passed | " + (stats.tests?.passed || "N/A") + " |");
      console.log("| Tests Failed | " + (stats.tests?.failed || "N/A") + " |");
      console.log(
        "| Total Assertions | " + (stats.assertions?.total || "N/A") + " |",
      );
      console.log(
        "| Assertions Passed | " + (stats.assertions?.passed || "N/A") + " |",
      );
      console.log(
        "| Assertions Failed | " + (stats.assertions?.failed || "N/A") + " |",
      );
      console.log("");

      if (results.run.timings) {
        console.log("## Performance Metrics");
        console.log("");
        console.log("| Metric | Value |");
        console.log("|--------|-------|");
        console.log(
          "| Response Average | " +
            Math.round(results.run.timings.responseAverage || 0) + "ms |",
        );
        console.log(
          "| Response Min | " +
            Math.round(results.run.timings.responseMin || 0) + "ms |",
        );
        console.log(
          "| Response Max | " +
            Math.round(results.run.timings.responseMax || 0) + "ms |",
        );
        console.log(
          "| Started | " + (results.run.timings.started
            ? new Date(results.run.timings.started).toISOString()
            : "N/A") +
            " |",
        );
        console.log(
          "| Completed | " + (results.run.timings.completed
            ? new Date(results.run.timings.completed).toISOString()
            : "N/A") +
            " |",
        );
        console.log("");
      }

      // Failed tests details
      if (results.run.executions && stats.tests?.failed > 0) {
        console.log("## Failed Tests");
        console.log("");
        results.run.executions.forEach((execution) => {
          if (execution.assertions) {
            const failures = execution.assertions.filter((a) => a.error);
            if (failures.length > 0) {
              console.log("### " + execution.item.name);
              failures.forEach((failure) => {
                console.log("- **Error:** " + failure.error.message);
                if (failure.error.test) {
                  console.log("  - **Test:** " + failure.error.test);
                }
              });
              console.log("");
            }
          }
        });
      }
    }

    // Count endpoint coverage from collection
    const endpoints = new Set();
    if (results.collection && results.collection.item) {
      results.collection.item.forEach((folder) => {
        if (folder.item) {
          folder.item.forEach((request) => {
            if (
              request.request && request.request.url && request.request.url.path
            ) {
              const path = "/" + request.request.url.path.join("/");
              endpoints.add(path);
            }
          });
        }
      });
    }

    console.log("## Endpoint Coverage");
    console.log("");
    console.log("**Total Unique Endpoints:** " + endpoints.size);
    console.log("");
    console.log("### Tested Endpoints:");
    console.log("");
    Array.from(endpoints).sort().forEach((endpoint) => {
      console.log("- `" + endpoint + "`");
    });
    console.log("");

    // Collection structure
    if (results.collection && results.collection.item) {
      console.log("## Test Collection Structure");
      console.log("");
      results.collection.item.forEach((folder) => {
        console.log("### " + folder.name);
        console.log("");
        if (folder.item) {
          folder.item.forEach((request) => {
            console.log("- " + request.name);
          });
        }
        console.log("");
      });
    }

    console.log("## Configuration");
    console.log("");
    console.log("- **Collection:** tests/postman/collections/comprehensive.json");
    console.log("- **Environment:** postman-environment-comprehensive.json");
    console.log("- **Test Mode:** Comprehensive regression testing");
    console.log("- **Coverage Target:** 46/46 endpoints (100%)");
    console.log("");

    console.log("---");
    console.log("*Report generated from: " + resultsPath + "*");
  } catch (error) {
    console.log("# Newman Test Report - Error");
    console.log("");
    console.log("Error generating report: " + error.message);
  }
}

generateMarkdownReport();
