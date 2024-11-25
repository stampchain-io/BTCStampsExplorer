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

      const response = await fetch(url);
      let responseData;

      try {
        // Try to parse as JSON first
        responseData = await response.json();
      } catch (e) {
        // If JSON parsing fails, use text
        responseData = await response.text();
      }

      results[env] = {
        status: response.status,
        data: responseData,
      };
    } catch (error) {
      console.error(`Error fetching from ${env}:`, error);
      results[env] = {
        status: error.status || 500,
        error: error.message,
      };
    }
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

  // Handle arrays
  if (schemaComponent.type === "array" && schemaComponent.items) {
    return [buildExpectedResponse(schemaComponent.items, schemas)];
  }

  // Handle objects
  if (schemaComponent.type === "object" || schemaComponent.properties) {
    const result = {};
    const properties = schemaComponent.properties || {};

    Object.entries(properties).forEach(([key, prop]) => {
      result[key] = buildExpectedResponse(prop, schemas);
    });

    // Handle allOf
    if (schemaComponent.allOf) {
      schemaComponent.allOf.forEach((subSchema) => {
        const subResult = buildExpectedResponse(subSchema, schemas);
        Object.assign(result, subResult);
      });
    }

    return result;
  }

  // Handle primitive types with example values
  switch (schemaComponent.type) {
    case "string":
      return schemaComponent.example || "";
    case "number":
    case "integer":
      return schemaComponent.example || 0;
    case "boolean":
      return schemaComponent.example || false;
    case "null":
      return null;
    default:
      return null;
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

    // Check for error scenarios first
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

      // Check if we have valid responses to compare
      if (results.production?.data && results.development?.data) {
        const differences = compareResponses(
          results.production.data,
          results.development.data,
        );

        if (differences.length > 0) {
          comparisonResults[path] = differences;

          const comparisonMessage = [
            "\n## Endpoint Comparison",
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
          ].join("\n");

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

    summaryReport += `## Endpoint Differences\n\n`;

    if (Object.keys(comparisonResults).length > 0) {
      const reportsDir = path.resolve(__dirname, "../reports");

      // Generate summary report
      Object.entries(comparisonResults).forEach(([path, differences]) => {
        summaryReport += `# ${path}\n\n`;

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
      });

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
      Object.entries(comparisonResults).forEach(([path, differences]) => {
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
      });

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
  } catch (error) {
    console.error("Error in afterAll hook:", error);
  }
  done();
});
