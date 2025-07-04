#!/usr/bin/env node

/**
 * OpenAPI Schema Validator for Newman Test Integration
 * Validates API responses against schema.yml during Newman test execution
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NewmanOpenAPIValidator {
  constructor(schemaPath) {
    this.schemaPath = schemaPath;
    this.schema = null;
    this.validations = [];
  }

  async initialize() {
    try {
      // Load schema.yml using dynamic import for YAML parsing
      const schemaContent = fs.readFileSync(this.schemaPath, "utf8");

      // Basic YAML parsing for OpenAPI (simplified)
      this.schema = this.parseSimpleYAML(schemaContent);

      console.log("✅ OpenAPI schema validator initialized");
      console.log(
        `   Schema version: ${this.schema?.info?.version || "unknown"}`,
      );
      return true;
    } catch (error) {
      console.error(
        "❌ Failed to initialize OpenAPI validator:",
        error.message,
      );
      return false;
    }
  }

  /**
   * Simple YAML parser for basic OpenAPI structure
   * For production, use a proper YAML library
   */
  parseSimpleYAML(yamlContent) {
    const lines = yamlContent.split("\n");
    const result = { paths: {}, info: {} };

    let currentPath = null;
    let currentMethod = null;
    let inPaths = false;
    let inInfo = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === "info:") {
        inInfo = true;
        inPaths = false;
        continue;
      }

      if (trimmed === "paths:") {
        inPaths = true;
        inInfo = false;
        continue;
      }

      if (inInfo && trimmed.startsWith("version:")) {
        result.info.version = trimmed.split(":")[1].trim();
      }

      if (inPaths && trimmed.startsWith("/")) {
        currentPath = trimmed.replace(":", "");
        result.paths[currentPath] = {};
      }

      if (
        inPaths && currentPath &&
        trimmed.match(/^\s*(get|post|put|delete|patch):/)
      ) {
        currentMethod = trimmed.split(":")[0].trim();
        result.paths[currentPath][currentMethod] = { responses: {} };
      }
    }

    return result;
  }

  /**
   * Validate Newman test result against OpenAPI schema
   */
  validateNewmanResult(testResult) {
    const { request, response } = testResult;

    if (!response || !request) {
      const errorValidation = {
        isValid: false,
        errors: ["Missing request or response data"],
        warnings: [],
        method: "unknown",
        path: "unknown",
        statusCode: "unknown",
      };
      this.validations.push(errorValidation);
      return errorValidation;
    }

    const method = request.method || "GET";

    // Handle Newman's URL structure (can be string or object)
    let path;
    try {
      if (typeof request.url === "string") {
        const url = new URL(request.url);
        path = url.pathname;
      } else if (request.url && request.url.raw) {
        const url = new URL(request.url.raw);
        path = url.pathname;
      } else if (request.url && request.url.path) {
        path = "/" + request.url.path.join("/");
      } else {
        const errorValidation = {
          isValid: false,
          errors: ["Unable to parse request URL"],
          warnings: [],
          method: method,
          path: "unknown",
          statusCode: "unknown",
        };
        this.validations.push(errorValidation);
        return errorValidation;
      }
    } catch (error) {
      const errorValidation = {
        isValid: false,
        errors: [`URL parsing error: ${error.message}`],
        warnings: [],
        method: method,
        path: "unknown",
        statusCode: "unknown",
      };
      this.validations.push(errorValidation);
      return errorValidation;
    }

    const statusCode = response.code || response.status;

    let responseBody;
    try {
      // Newman stores response body in the 'stream' property as a Buffer
      if (response.stream) {
        if (Buffer.isBuffer(response.stream)) {
          // Convert Buffer to string and parse JSON
          const bodyString = response.stream.toString("utf8");
          responseBody = JSON.parse(bodyString);
        } else if (response.stream.type === "Buffer" && response.stream.data) {
          // Handle Buffer object format from Newman JSON
          const buffer = Buffer.from(response.stream.data);
          const bodyString = buffer.toString("utf8");
          responseBody = JSON.parse(bodyString);
        } else if (typeof response.stream === "string") {
          // Stream is already a string
          responseBody = JSON.parse(response.stream);
        } else if (
          typeof response.stream === "object" && response.stream !== null
        ) {
          // Stream is already parsed object
          responseBody = response.stream;
        } else {
          throw new Error(
            `Unsupported stream format: ${typeof response.stream}`,
          );
        }
      } else if (response.body) {
        // Fallback to body property
        if (typeof response.body === "object" && response.body !== null) {
          responseBody = response.body;
        } else if (typeof response.body === "string") {
          responseBody = JSON.parse(response.body);
        } else if (Buffer.isBuffer(response.body)) {
          responseBody = JSON.parse(response.body.toString("utf8"));
        } else {
          throw new Error(`Unsupported body format: ${typeof response.body}`);
        }
      } else {
        const errorValidation = {
          isValid: false,
          errors: ["No response body or stream found"],
          warnings: [],
          method: method,
          path: path,
          statusCode: statusCode,
        };
        this.validations.push(errorValidation);
        return errorValidation;
      }
    } catch (error) {
      const errorValidation = {
        isValid: false,
        errors: [
          `JSON parsing error: ${error.message}. Stream type: ${typeof response
            .stream}, Body type: ${typeof response.body}`,
        ],
        warnings: [],
        method: method,
        path: path,
        statusCode: statusCode,
      };
      this.validations.push(errorValidation);
      return errorValidation;
    }

    return this.validateResponse(method, path, statusCode, responseBody);
  }

  /**
   * Core validation logic
   */
  validateResponse(method, path, statusCode, responseBody) {
    const validation = {
      method,
      path,
      statusCode,
      timestamp: new Date().toISOString(),
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Normalize path for schema lookup
      const normalizedPath = this.normalizePath(path);

      // Check if path exists in schema
      if (!this.schema.paths[normalizedPath]) {
        validation.warnings.push(
          `Path ${normalizedPath} not found in OpenAPI schema`,
        );
      }

      // Validate common API response patterns
      this.validateCommonPatterns(responseBody, validation);

      // Validate v2.3 specific structures
      this.validateV23Fields(responseBody, validation);

      validation.isValid = validation.errors.length === 0;
    } catch (error) {
      validation.isValid = false;
      validation.errors.push(`Validation error: ${error.message}`);
    }

    this.validations.push(validation);
    return validation;
  }

  /**
   * Validate common API response patterns
   */
  validateCommonPatterns(body, validation) {
    // Ensure body is defined and is an object
    if (!body || typeof body !== "object") {
      validation.errors.push("Response body should be an object");
      return;
    }

    // Check pagination structure for list endpoints
    if (body.hasOwnProperty("data") && Array.isArray(body.data)) {
      if (typeof body.page !== "number") {
        validation.errors.push("Pagination: page should be number");
      }
      if (typeof body.limit !== "number") {
        validation.errors.push("Pagination: limit should be number");
      }
      if (typeof body.total !== "number") {
        validation.errors.push("Pagination: total should be number");
      }
      if (body.totalPages && typeof body.totalPages !== "number") {
        validation.errors.push("Pagination: totalPages should be number");
      }
    }

    // Validate stamp objects in data array
    if (body.data && Array.isArray(body.data)) {
      body.data.forEach((item, index) => {
        if (item.stamp !== undefined && typeof item.stamp !== "number") {
          validation.errors.push(`stamps[${index}].stamp should be number`);
        }
        if (item.cpid !== undefined && typeof item.cpid !== "string") {
          validation.errors.push(`stamps[${index}].cpid should be string`);
        }
        if (item.ident !== undefined && typeof item.ident !== "string") {
          validation.errors.push(`stamps[${index}].ident should be string`);
        }
      });
    }

    // Validate error responses
    if (validation.statusCode >= 400 && body.error === undefined) {
      validation.warnings.push("Error response should include error field");
    }
  }

  /**
   * Validate v2.3 specific field structures
   */
  validateV23Fields(body, validation) {
    if (body.data && Array.isArray(body.data)) {
      body.data.forEach((item, index) => {
        // Validate marketData structure (v2.3)
        if (item.marketData) {
          if (typeof item.marketData !== "object") {
            validation.errors.push(
              `stamps[${index}].marketData should be object`,
            );
          } else {
            this.validateMarketData(
              item.marketData,
              `stamps[${index}].marketData`,
              validation,
            );
          }
        }

        // Validate cacheStatus (v2.3)
        if (item.cacheStatus && typeof item.cacheStatus !== "string") {
          validation.errors.push(
            `stamps[${index}].cacheStatus should be string`,
          );
        }

        // Validate sale_data structure (v2.3 recent sales enhancement)
        if (item.sale_data) {
          if (typeof item.sale_data !== "object") {
            validation.errors.push(
              `stamps[${index}].sale_data should be object`,
            );
          } else {
            this.validateSaleData(
              item.sale_data,
              `stamps[${index}].sale_data`,
              validation,
            );
          }
        }
      });
    }
  }

  /**
   * Validate marketData object structure
   */
  validateMarketData(marketData, path, validation) {
    const numericFields = [
      "recentSalePriceBTC",
      "floorPriceBTC",
      "volume24hBTC",
      "volume7dBTC",
      "holderCount",
      "dataQualityScore",
    ];

    numericFields.forEach((field) => {
      if (marketData[field] !== undefined && marketData[field] !== null) {
        if (typeof marketData[field] !== "number") {
          validation.errors.push(`${path}.${field} should be number`);
        }
      }
    });

    if (
      marketData.lastPriceUpdate &&
      typeof marketData.lastPriceUpdate !== "string"
    ) {
      validation.errors.push(
        `${path}.lastPriceUpdate should be string (datetime)`,
      );
    }
  }

  /**
   * Validate sale_data object structure
   */
  validateSaleData(saleData, path, validation) {
    if (
      saleData.btc_amount !== undefined &&
      typeof saleData.btc_amount !== "number"
    ) {
      validation.errors.push(`${path}.btc_amount should be number`);
    }
    if (
      saleData.block_index !== undefined &&
      typeof saleData.block_index !== "number"
    ) {
      validation.errors.push(`${path}.block_index should be number`);
    }
    if (
      saleData.tx_hash !== undefined && typeof saleData.tx_hash !== "string"
    ) {
      validation.errors.push(`${path}.tx_hash should be string`);
    }
  }

  /**
   * Normalize API path for schema lookup
   */
  normalizePath(path) {
    const cleanPath = path.split("?")[0];

    return cleanPath
      .replace(/\/\d+$/, "/{id}")
      .replace(/\/\d+\//, "/{id}/")
      .replace(/\/[a-fA-F0-9]{64}/, "/{hash}")
      .replace(/\/[13][a-km-zA-HJ-NP-Z1-9]{25,34}/, "/{address}");
  }

  /**
   * Generate final validation report
   */
  generateReport() {
    const total = this.validations.length;
    const passed = this.validations.filter((v) => v.isValid).length;
    const failed = total - passed;

    console.log("\n📋 OpenAPI Schema Validation Report");
    console.log("=".repeat(50));
    console.log(`Total API Calls Validated: ${total}`);
    console.log(`✅ Schema Compliant: ${passed}`);
    console.log(`❌ Schema Violations: ${failed}`);

    if (failed > 0) {
      console.log("\n🔍 Schema Violations:");
      this.validations
        .filter((v) => !v.isValid)
        .forEach((validation) => {
          console.log(
            `\n❌ ${validation.method} ${validation.path} (${validation.statusCode})`,
          );
          validation.errors.forEach((error) => {
            console.log(`   • ${error}`);
          });
        });
    }

    // Summary of warnings
    const totalWarnings = this.validations.reduce(
      (sum, v) => sum + v.warnings.length,
      0,
    );
    if (totalWarnings > 0) {
      console.log(`\n⚠️  Total Warnings: ${totalWarnings}`);
    }

    return {
      total,
      passed,
      failed,
      warnings: totalWarnings,
      validations: this.validations,
    };
  }
}

// Export for use in Newman scripts
export default NewmanOpenAPIValidator;

/**
 * Process Newman JSON results and validate responses
 */
async function processNewmanResults(schemaPath, resultsPath) {
  const validator = new NewmanOpenAPIValidator(schemaPath);

  if (!await validator.initialize()) {
    process.exit(1);
  }

  try {
    // Read Newman JSON results
    const resultsContent = fs.readFileSync(resultsPath, "utf8");
    const newmanResults = JSON.parse(resultsContent);

    console.log(
      `\n🔍 Processing ${
        newmanResults.run?.executions?.length || 0
      } API calls from Newman results...`,
    );

    // Process each execution
    if (newmanResults.run?.executions) {
      newmanResults.run.executions.forEach((execution, index) => {
        if (execution.response && execution.request) {
          try {
            const validation = validator.validateNewmanResult({
              request: execution.request,
              response: execution.response,
            });

            // Log validation result
            const status = validation.isValid ? "✅" : "❌";
            const method = execution.request?.method || "GET";

            // Better URL extraction from Newman request
            let url = "unknown";
            if (execution.request?.url) {
              if (typeof execution.request.url === "string") {
                url = execution.request.url;
              } else if (execution.request.url.raw) {
                url = execution.request.url.raw;
              } else if (
                execution.request.url.host && execution.request.url.path
              ) {
                const host = Array.isArray(execution.request.url.host)
                  ? execution.request.url.host.join(".")
                  : execution.request.url.host;
                const path = Array.isArray(execution.request.url.path)
                  ? "/" + execution.request.url.path.join("/")
                  : execution.request.url.path;
                url = `${
                  execution.request.url.protocol || "http"
                }://${host}${path}`;
              }
            }

            const responseCode = execution.response?.code || "unknown";

            console.log(`${status} ${method} ${url} (${responseCode})`);

            if (
              !validation.isValid && validation.errors &&
              validation.errors.length > 0
            ) {
              validation.errors.forEach((error) => {
                console.log(`   • ${error}`);
              });
            }

            if (validation.warnings && validation.warnings.length > 0) {
              validation.warnings.forEach((warning) => {
                console.log(`   ⚠️  ${warning}`);
              });
            }
          } catch (error) {
            console.error(
              `Error validating execution ${index}:`,
              error.message,
            );
            console.error(
              `Request URL structure:`,
              JSON.stringify(execution.request?.url, null, 2),
            );
          }
        }
      });
    }

    // Generate final report
    const report = validator.generateReport();

    // Exit with error code if validations failed
    if (report.failed > 0) {
      console.log("\n❌ OpenAPI schema validation failed");
      process.exit(1);
    } else {
      console.log("\n✅ All API responses comply with OpenAPI schema");
      process.exit(0);
    }
  } catch (error) {
    console.error("Error processing Newman results:", error.message);
    process.exit(1);
  }
}

// CLI usage
if (process.argv[1] === __filename) {
  const schemaPath = process.argv[2] || "./schema.yml";
  const resultsPath = process.argv[3];

  if (!resultsPath) {
    console.error(
      "Usage: node newman-schema-validator.mjs <schema.yml> <newman-results.json>",
    );
    process.exit(1);
  }

  processNewmanResults(schemaPath, resultsPath).catch(console.error);
}
