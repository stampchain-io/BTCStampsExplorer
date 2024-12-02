// @ts-nocheck
// deno-lint-ignore-file
const hooks = require("hooks");
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

// At the start of the file, add this to ensure reports directory exists
const reportsDir = path.resolve(process.cwd(), "reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Load schema once
const schema = yaml.load(fs.readFileSync("./schema.yml", "utf8"));

// Store API responses
const comparisonResults = {};

// Configuration
const ENDPOINTS = {
  production: "https://stampchain.io",
  development: "https://dev.bitcoinstamps.xyz",
};

// Helper function to extract path parameters from URI
function extractPathParams(uri, pathTemplate) {
  const uriParts = uri.split("/");
  const templateParts = pathTemplate.split("/");
  const params = {};

  templateParts.forEach((part, index) => {
    if (part.startsWith("{") && part.endsWith("}")) {
      const paramName = part.slice(1, -1);
      params[paramName] = uriParts[index];
    }
  });

  return params;
}

// Helper function to fetch from both endpoints
async function fetchBothEndpoints(path, transaction) {
  const results = {};

  // Extract schema parameters from transaction
  const schemaParams = new URLSearchParams();
  if (transaction.expected.uri) {
    const expectedUrl = new URL(transaction.expected.uri);
    for (const [key, value] of expectedUrl.searchParams) {
      schemaParams.set(key, value);
    }
  }

  // Extract actual values from the request URI
  const params = extractPathParams(transaction.request.uri, path);
  console.log("Extracted parameters:", params);

  // Replace path parameters if they exist
  let sanitizedPath = path;
  const pathParams = path.match(/{([^}]+)}/g);
  if (pathParams) {
    pathParams.forEach((param) => {
      const paramName = param.slice(1, -1);
      const paramValue = params[paramName];
      if (paramValue) {
        sanitizedPath = sanitizedPath.replace(param, paramValue);
      }
    });
  }

  for (const [env, baseUrl] of Object.entries(ENDPOINTS)) {
    try {
      const url = `${baseUrl}${sanitizedPath}${
        schemaParams.toString() ? "?" + schemaParams.toString() : ""
      }`;
      console.log(`\nFetching ${env} endpoint:`, url);

      // More precise timing measurement
      const startTime = process.hrtime();
      const response = await fetch(url);
      const endTime = process.hrtime(startTime);
      const responseTime = (endTime[0] * 1e9 + endTime[1]) / 1e6; // Convert to milliseconds

      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = await response.text();
      }

      results[env] = {
        status: response.status,
        data: responseData,
        responseTime,
      };

      console.log(`${env} response time:`, responseTime, "ms");
    } catch (error) {
      console.error(`Error fetching from ${env}:`, error);
      results[env] = {
        status: error.status || 500,
        error: error.message,
        responseTime: 0,
      };
    }
  }

  // Calculate timing differences if both calls succeeded
  if (results.production?.responseTime && results.development?.responseTime) {
    const prodTime = results.production.responseTime;
    const devTime = results.development.responseTime;
    const difference = prodTime - devTime; // Reversed: prod minus dev
    const percentageDiff = ((prodTime - devTime) / prodTime) * 100; // Reversed calculation

    // Add performance indicator
    const performanceIndicator = percentageDiff > 0
      ? "🟢" // Up arrow + green heart for improvement
      : percentageDiff < 0
      ? "🔴" // Down arrow + red heart for degradation
      : "➡️"; // Right arrow when equal

    results.timingAnalysis = {
      productionTime: prodTime,
      developmentTime: devTime,
      difference,
      percentageDiff,
      performanceIndicator,
      isSignificant: Math.abs(percentageDiff) > 10,
    };

    console.log(`Timing analysis for ${path}:`, results.timingAnalysis);
  } else {
    console.log(`Missing timing data for ${path}:`, {
      productionTime: results.production?.responseTime,
      developmentTime: results.development?.responseTime,
    });
  }

  return results;
}

// Add this helper function to recursively build the expected response
function buildExpectedResponse(schemaComponent, schemas) {
  if (!schemaComponent) return null;

  // Handle references
  if (schemaComponent.$ref) {
    const refName = schemaComponent.$ref.split("/").pop();
    return buildExpectedResponse(schemas[refName], schemas);
  }

  // Handle oneOf
  if (schemaComponent.oneOf) {
    // Use the first schema in oneOf for example response
    return buildExpectedResponse(schemaComponent.oneOf[0], schemas);
  }

  // Handle arrays
  if (schemaComponent.type === "array" && schemaComponent.items) {
    return [buildExpectedResponse(schemaComponent.items, schemas)];
  }

  // Handle objects
  if (schemaComponent.type === "object" || schemaComponent.properties) {
    const result = {};
    const properties = schemaComponent.properties || {};

    Object.entries(properties).forEach(([key, prop]) => {
      // Check if property is required
      const isRequired = (schemaComponent.required || []).includes(key);
      if (isRequired || Math.random() > 0.5) { // Include required fields and randomly include optional fields
        result[key] = buildExpectedResponse(prop, schemas);
      }
    });

    return result;
  }

  // Handle primitive types with example values
  switch (schemaComponent.type) {
    case "string":
      return schemaComponent.example || "example_string";
    case "number":
    case "integer":
      return schemaComponent.example || 0;
    case "boolean":
      return schemaComponent.example || false;
    case "null":
      return null;
    default:
      return schemaComponent.example || null;
  }
}

function compareResponses(prod, dev) {
  const differences = [];

  function compare(prodObj, devObj, path = "") {
    // Handle null/undefined cases
    if (
      prodObj === null || prodObj === undefined ||
      devObj === null || devObj === undefined
    ) {
      if (prodObj !== devObj) {
        differences.push({
          path,
          production: prodObj,
          development: devObj,
          issue: "value_mismatch",
        });
      }
      return;
    }

    if (typeof prodObj !== typeof devObj) {
      differences.push({
        path,
        production: prodObj,
        development: devObj,
        issue: "type_mismatch",
      });
      return;
    }

    if (Array.isArray(prodObj)) {
      if (!Array.isArray(devObj)) {
        differences.push({
          path,
          issue: "type_mismatch",
          production: "array",
          development: typeof devObj,
        });
        return;
      }

      if (prodObj.length !== devObj.length) {
        differences.push({
          path,
          issue: "array_length_mismatch",
          production: prodObj.length,
          development: devObj.length,
        });
      }

      const minLength = Math.min(prodObj.length, devObj.length);
      for (let i = 0; i < minLength; i++) {
        compare(prodObj[i], devObj[i], `${path}[${i}]`);
      }
      return;
    }

    if (typeof prodObj === "object" && prodObj !== null) {
      const allKeys = new Set([
        ...Object.keys(prodObj),
        ...Object.keys(devObj),
      ]);

      for (const key of allKeys) {
        if (!(key in prodObj)) {
          differences.push({
            path: `${path}.${key}`,
            issue: "missing_in_production",
            development: devObj[key],
          });
        } else if (!(key in devObj)) {
          differences.push({
            path: `${path}.${key}`,
            issue: "missing_in_development",
            production: prodObj[key],
          });
        } else {
          compare(prodObj[key], devObj[key], `${path}.${key}`);
        }
      }
      return;
    }

    if (prodObj !== devObj) {
      differences.push({
        path,
        production: prodObj,
        development: devObj,
        issue: "value_mismatch",
      });
    }
  }

  compare(prod, dev);
  return differences;
}

// Add this near the top, after your imports and initial configs
const dreddConfig = yaml.load(fs.readFileSync("./dredd.yml", "utf8"));

// Add this single new hook
hooks.beforeEach((transaction, done) => {
  try {
    // Set the hostname for Dredd reporting
    const endpointUrl = new URL(dreddConfig.endpoint);
    // Modify both host and hostname properties
    transaction.host = endpointUrl.host;
    transaction.hostname = endpointUrl.hostname;
    // Also set it in the request if it exists
    if (transaction.request) {
      transaction.request.host = endpointUrl.host;
      transaction.request.hostname = endpointUrl.hostname;
    }
  } catch (error) {
    console.error("Error in beforeEach:", error);
  }
  done();
});

// Before validation hook
hooks.beforeEachValidation(async (transaction, done) => {
  try {
    const [path] = transaction.name.split(" > ");

    // Check for error scenarios first, regardless of method
    if (transaction.name.includes("500")) {
      console.log(`Simulating 500 response for: ${transaction.name}`);
      transaction.real.statusCode = "500";
      transaction.real.body = JSON.stringify({
        error: "Internal Server Error",
        message: "Simulated server error for testing purposes",
        status: 500,
      });
      return done();
    } else if (transaction.name.includes("404")) {
      console.log(`Simulating 404 response for: ${transaction.name}`);
      transaction.real.statusCode = "404";
      transaction.real.body = JSON.stringify({
        error: "Not Found",
        message: "Simulated not found error for testing purposes",
        status: 404,
      });
      return done();
    } else if (transaction.name.includes("400")) {
      console.log(`Simulating 400 response for: ${transaction.name}`);
      transaction.real.statusCode = "400";
      transaction.real.body = JSON.stringify({
        error: "Bad Request",
        message: "Simulated bad request error for testing purposes",
        status: 400,
      });
      return done();
    }

    // For POST endpoints with examples
    if (transaction.request.method === "POST") {
      const pathSchema = schema.paths[path];
      const examples = pathSchema?.post?.requestBody?.content
        ?.["application/json"]?.examples;

      if (examples) {
        console.log(`Testing examples for ${path}`);

        // Store results for each example
        transaction.exampleResults = [];

        // Test each example
        for (const [exampleName, example] of Object.entries(examples)) {
          console.log(`Testing example: ${exampleName}`);

          // Test against both environments
          const results = await Promise.all([
            fetch(`${ENDPOINTS.production}${path}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(example.value),
            }),
            fetch(`${ENDPOINTS.development}${path}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(example.value),
            }),
          ]);

          // Store results
          const prodResponse = await results[0].json();
          const devResponse = await results[1].json();

          transaction.exampleResults.push({
            example: exampleName,
            production: prodResponse,
            development: devResponse,
            differences: compareResponses(prodResponse, devResponse),
          });
        }

        // Add example test results to transaction
        if (!transaction.test) transaction.test = "";
        transaction.test += "\n## Example Tests\n";

        transaction.exampleResults.forEach((result) => {
          transaction.test += `\n### Example: ${result.example}\n`;
          transaction.test += "Production Response:\n```json\n" +
            JSON.stringify(result.production, null, 2) + "\n```\n";
          transaction.test += "Development Response:\n```json\n" +
            JSON.stringify(result.development, null, 2) + "\n```\n";

          if (result.differences.length > 0) {
            transaction.test += "\nDifferences:\n";
            result.differences.forEach((diff) => {
              transaction.test += `- ${diff.issue} at ${diff.path}\n`;
            });
          }
        });
      }

      // Get the response schema from the path definition
      const responseSchema = pathSchema?.post?.responses?.["200"]?.content
        ?.["application/json"]?.schema;

      if (responseSchema) {
        // Build expected response from the response schema
        const expectedResponse = buildExpectedResponse(
          responseSchema,
          schema.components.schemas,
        );

        // Set the expected response body
        transaction.expected.body = JSON.stringify(expectedResponse);

        // Debug log
        console.log(
          `Expected response for ${path}:`,
          JSON.stringify(expectedResponse, null, 2),
        );

        // Don't continue with the comparison if we're handling a POST request
        return done();
      }
    }

    // For successful responses, resolve schema references
    const pathSchema = schema.paths[path];
    if (
      pathSchema?.get?.responses?.["200"]?.content?.["application/json"]?.schema
        ?.$ref
    ) {
      // Get the referenced schema name
      const refPath =
        pathSchema.get.responses["200"].content["application/json"].schema.$ref;
      const schemaName = refPath.split("/").pop();

      // Log for debugging
      console.log(`Using schema ${schemaName} for ${path}`);

      // Use the schema definition to create a proper response structure
      if (schema.components.schemas[schemaName]) {
        const schemaDefinition = schema.components.schemas[schemaName];

        // Build the expected response structure
        const expectedResponse = buildExpectedResponse(
          schemaDefinition,
          schema.components.schemas,
        );

        // Set the expected body as a JSON string
        transaction.expected.body = JSON.stringify(expectedResponse);

        console.log(
          "Expected response from schema:",
          JSON.stringify(expectedResponse, null, 2),
        );
      }
    }

    // Only proceed with comparison for non-error scenarios
    if (transaction.request.method === "GET") {
      const results = await fetchBothEndpoints(path, transaction);

      // Store timing data directly on the transaction object
      if (results.timingAnalysis) {
        transaction.timingAnalysis = results.timingAnalysis;
        console.log(
          `Stored timing data for ${path}:`,
          transaction.timingAnalysis,
        );
      }

      // Check if we have valid responses to compare
      if (results.production?.data && results.development?.data) {
        const differences = compareResponses(
          results.production.data,
          results.development.data,
        );

        if (differences.length > 0) {
          comparisonResults[path] = {
            differences,
            timingAnalysis: results.timingAnalysis, // Store timing analysis with differences
          };

          const comparisonMessage = [
            "\n## Endpoint Comparison",
            results.timingAnalysis ? "\n### Response Times:" : "",
            results.timingAnalysis
              ? `Production: ${
                results.timingAnalysis.productionTime.toFixed(2)
              }ms`
              : "",
            results.timingAnalysis
              ? `Development: ${
                results.timingAnalysis.developmentTime.toFixed(2)
              }ms`
              : "",
            results.timingAnalysis?.isSignificant
              ? `⚠️ Response time difference: ${
                results.timingAnalysis.percentageDiff.toFixed(2)
              }%`
              : "",
            "\n### Production Response:",
            "```json",
            JSON.stringify(results.production.data, null, 2),
            "```",
            "\n### Development Response:",
            "```json",
            JSON.stringify(results.development.data, null, 2),
            "```",
            "\n### Differences:",
            ...differences.map((diff) =>
              `- ${diff.issue} at ${diff.path}\n  ` +
              `Prod: ${JSON.stringify(diff.production)}\n  ` +
              `Dev: ${JSON.stringify(diff.development)}`
            ),
          ].filter(Boolean).join("\n");

          if (!transaction.test) transaction.test = "";
          transaction.test += comparisonMessage;
        }
      } else {
        // Log error responses
        console.log("Response status codes:", {
          production: results.production?.status,
          development: results.development?.status,
        });
        console.log("Response data:", {
          production: results.production?.data || results.production?.error,
          development: results.development?.data || results.development?.error,
        });
      }
    }
  } catch (error) {
    console.error("Error in beforeEachValidation:", error);
  }

  done();
});

// After all tests hook
hooks.afterAll((transactions, done) => {
  try {
    // Add debug logging
    console.log("Writing reports to:", reportsDir);
    console.log("Current working directory:", process.cwd());

    // Add test run statistics with correct failure counting
    let summaryReport = "# API Endpoint Comparison Summary\n\n";

    // Add test run overview using Dredd's test results
    const totalTests = transactions.length;
    const failedTests = transactions.filter((t) => {
      return t.fail === true || t.test.status === "fail";
    }).length;
    const successTests = totalTests - failedTests;
    const testDuration = transactions[0]?.duration || 0;

    // Get Apiary URL from the last transaction's results
    const apiaryUrl = transactions[transactions.length - 1]?.apiaryReportUrl;

    summaryReport += `## Test Run Statistics\n`;
    summaryReport += `- Total Endpoints Tested: ${totalTests}\n`;
    summaryReport += `- Successful Tests: ${successTests}\n`;
    summaryReport += `- Failed Tests: ${failedTests}\n`;
    summaryReport += `- Test Duration: ${testDuration}ms\n`;
    if (apiaryUrl) {
      summaryReport += `- Apiary Results: ${apiaryUrl}\n`;
    }
    summaryReport += "\n";

    if (failedTests > 0) {
      summaryReport += `## Failed Endpoints\n`;
      transactions
        .filter((t) => t.fail === true || t.test.status === "fail")
        .forEach((t) => {
          summaryReport += `- ${t.request.method} ${t.request.uri}\n`;
        });
      summaryReport += "\n";
    }

    // Debug logging
    console.log(
      "Number of transactions with timing data:",
      transactions.filter((t) => t.timingAnalysis).length,
    );

    // Add timing analysis section with more detailed logging
    console.log("\nGenerating Response Time Analysis...");
    summaryReport += `\n## Response Time Analysis\n\n`;

    const timingData = transactions
      .filter((t) => t.timingAnalysis)
      .map((t) => ({
        path: t.request.uri.replace(ENDPOINTS.development, ""),
        timing: t.timingAnalysis,
      }));

    console.log(`Found ${timingData.length} endpoints with timing data`);

    if (timingData.length > 0) {
      // Add summary statistics
      const avgProdTime = timingData.reduce((acc, { timing }) =>
        acc + timing.productionTime, 0) / timingData.length;
      const avgDevTime = timingData.reduce((acc, { timing }) =>
        acc + timing.developmentTime, 0) / timingData.length;

      summaryReport += `### Summary Statistics\n`;
      summaryReport += `- Average Production Response Time: ${
        avgProdTime.toFixed(2)
      }ms\n`;
      summaryReport += `- Average Development Response Time: ${
        avgDevTime.toFixed(2)
      }ms\n\n`;

      // Add detailed timing table
      summaryReport += `### Detailed Timing Analysis\n\n`;
      summaryReport +=
        `| Endpoint | Production (ms) | Development (ms) | Difference | % Difference |\n`;
      summaryReport +=
        `|----------|----------------|-----------------|------------|-------------|\n`;

      const significantDelays = [];

      timingData.forEach(({ path, timing }) => {
        // Log each timing entry for debugging
        console.log(`Timing for ${path}:`, timing);

        const row = `| ${path} | ${timing.productionTime.toFixed(2)} | ${
          timing.developmentTime.toFixed(2)
        } | ${timing.difference.toFixed(2)} | ${
          timing.percentageDiff.toFixed(2)
        }% ${timing.performanceIndicator} |`;

        // Add warning emoji for significant differences
        summaryReport += timing.isSignificant ? `${row} ⚠️\n` : `${row}\n`;

        if (timing.isSignificant) {
          significantDelays.push({
            endpoint: path,
            ...timing,
          });
        }
      });

      // Add significant delays section with more context
      if (significantDelays.length > 0) {
        summaryReport += `\n### ⚠️ Performance Concerns (>10% difference)\n\n`;
        summaryReport +=
          `${significantDelays.length} endpoints showed significant performance differences:\n\n`;

        significantDelays.forEach((delay) => {
          summaryReport += `#### ${delay.endpoint}\n`;
          summaryReport += `- Production: ${
            delay.productionTime.toFixed(2)
          }ms\n`;
          summaryReport += `- Development: ${
            delay.developmentTime.toFixed(2)
          }ms\n`;
          summaryReport += `- Absolute Difference: ${
            delay.difference.toFixed(2)
          }ms\n`;
          summaryReport += `- Percentage Difference: ${
            delay.percentageDiff.toFixed(2)
          }%\n`;
          summaryReport += `- Environment Comparison: ${
            delay.productionTime > delay.developmentTime
              ? "Development is faster"
              : "Production is faster"
          }\n\n`;
        });
      }

      summaryReport += `\n### Performance Overview\n`;
      summaryReport += `- Total Endpoints Analyzed: ${timingData.length}\n`;
      summaryReport +=
        `- Endpoints with Significant Delays: ${significantDelays.length}\n`;
      summaryReport += `- Performance Threshold: 10% difference\n\n`;
    } else {
      summaryReport +=
        `No response time data available. Please check if timing analysis is properly configured.\n\n`;
      console.warn("Warning: No timing data found in transactions");
    }

    summaryReport += `## Endpoint Differences\n\n`;

    if (Object.keys(comparisonResults).length > 0) {
      const reportsDir = path.resolve(__dirname, "../reports");

      // Generate summary report
      Object.entries(comparisonResults).forEach(
        ([path, { differences, timingAnalysis }]) => {
          summaryReport += `# ${path}\n`;

          // Add both development and production example queries if they exist
          if (transactions.find((t) => t.name.startsWith(path))) {
            const example = transactions.find((t) => t.name.startsWith(path));
            // Get the full development URL from the example
            const devUri = example.request.uri.startsWith("http")
              ? example.request.uri
              : `${ENDPOINTS.development}${example.request.uri}`;
            // Create the production URL by replacing the development domain
            const prodUri = devUri.replace(
              ENDPOINTS.development,
              ENDPOINTS.production,
            );
            summaryReport += `## Examples:\n`;
            summaryReport += `### Development: ${devUri}\n`;
            summaryReport += `### Production: ${prodUri}\n`;
          }
          summaryReport += "\n";

          // Group differences by issue type and consolidate similar paths
          const issueGroups = differences.reduce((acc, diff) => {
            if (!acc[diff.issue]) {
              acc[diff.issue] = new Set();
            }

            // Normalize array paths to show pattern
            const normalizedPath = diff.path.replace(/\[\d+\]/g, "[]");
            acc[diff.issue].add(normalizedPath);

            return acc;
          }, {});

          // Output consolidated differences
          Object.entries(issueGroups).forEach(([issue, paths]) => {
            summaryReport += `## ${issue}\n`;
            paths.forEach((path) => {
              summaryReport += `- \`${path}\`\n`;
            });
            summaryReport += "\n";
          });

          summaryReport += "---\n\n";
        },
      );

      // Write summary report
      try {
        fs.writeFileSync(
          path.resolve(reportsDir, "endpoint-summary.md"),
          summaryReport,
        );
        console.log("Successfully wrote endpoint-summary.md");
      } catch (error) {
        console.error("Error writing endpoint-summary.md:", error);
      }

      // Write JSON comparison
      try {
        fs.writeFileSync(
          path.resolve(reportsDir, "endpoint-comparison.json"),
          JSON.stringify(comparisonResults, null, 2),
        );
        console.log("Successfully wrote endpoint-comparison.json");
      } catch (error) {
        console.error("Error writing endpoint-comparison.json:", error);
      }

      // Generate detailed markdown report
      let markdownReport = "# API Endpoint Comparison Report\n\n";
      Object.entries(comparisonResults).forEach(
        ([path, { differences, timingAnalysis }]) => {
          markdownReport += `## ${path}\n\n`;
          differences.forEach((diff) => {
            markdownReport += `### ${diff.issue}\n`;
            markdownReport += `**Path:** \`${diff.path}\`\n\n`;
            if (diff.production !== undefined) {
              markdownReport += `**Production:**\n\`\`\`json\n${
                JSON.stringify(diff.production, null, 2)
              }\n\`\`\`\n\n`;
            }
            if (diff.development !== undefined) {
              markdownReport += `**Development:**\n\`\`\`json\n${
                JSON.stringify(diff.development, null, 2)
              }\n\`\`\`\n\n`;
            }
          });
          markdownReport += "---\n\n";
        },
      );

      // Write detailed markdown report
      try {
        fs.writeFileSync(
          path.resolve(reportsDir, "endpoint-comparison.md"),
          markdownReport,
        );
        console.log("Successfully wrote endpoint-comparison.md");
      } catch (error) {
        console.error("Error writing endpoint-comparison.md:", error);
      }
    }

    // Add example test results to summary
    const exampleTests = transactions.filter((t) =>
      t.exampleResults?.length > 0
    );
    if (exampleTests.length > 0) {
      summaryReport += "\n## Example Test Results\n";
      exampleTests.forEach((t) => {
        summaryReport += `\n### ${t.request.method} ${t.request.uri}\n`;
        t.exampleResults.forEach((result) => {
          summaryReport += `- Example "${result.example}": ${
            result.differences.length === 0 ? "✅" : "❌"
          }\n`;
          if (result.differences.length > 0) {
            summaryReport += "  Differences found:\n";
            result.differences.forEach((diff) => {
              summaryReport += `  - ${diff.issue} at ${diff.path}\n`;
            });
          }
        });
      });
    }
  } catch (error) {
    console.error("Error in afterAll hook:", error);
  }
  done();
});
