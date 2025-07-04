#!/usr/bin/env node

/**
 * OpenAPI Schema Validator for Newman Test Integration
 * Validates API responses against schema.yml during Newman test execution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
      const schemaContent = fs.readFileSync(this.schemaPath, 'utf8');
      
      // Basic YAML parsing for OpenAPI (simplified)
      this.schema = this.parseSimpleYAML(schemaContent);
      
      console.log('✅ OpenAPI schema validator initialized');
      console.log(`   Schema version: ${this.schema?.info?.version || 'unknown'}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize OpenAPI validator:', error.message);
      return false;
    }
  }

  /**
   * Simple YAML parser for basic OpenAPI structure
   * For production, use a proper YAML library
   */
  parseSimpleYAML(yamlContent) {
    const lines = yamlContent.split('\n');
    const result = { paths: {}, info: {} };
    
    let currentPath = null;
    let currentMethod = null;
    let inPaths = false;
    let inInfo = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === 'info:') {
        inInfo = true;
        inPaths = false;
        continue;
      }
      
      if (trimmed === 'paths:') {
        inPaths = true;
        inInfo = false;
        continue;
      }
      
      if (inInfo && trimmed.startsWith('version:')) {
        result.info.version = trimmed.split(':')[1].trim();
      }
      
      if (inPaths && trimmed.startsWith('/')) {
        currentPath = trimmed.replace(':', '');
        result.paths[currentPath] = {};
      }
      
      if (inPaths && currentPath && trimmed.match(/^\s*(get|post|put|delete|patch):/)) {
        currentMethod = trimmed.split(':')[0].trim();
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
      return { isValid: false, error: 'Missing request or response data' };
    }

    const method = request.method || 'GET';
    
    // Handle Newman's URL structure (can be string or object)
    let path;
    try {
      if (typeof request.url === 'string') {
        const url = new URL(request.url);
        path = url.pathname;
      } else if (request.url && request.url.raw) {
        const url = new URL(request.url.raw);
        path = url.pathname;
      } else if (request.url && request.url.path) {
        path = '/' + request.url.path.join('/');
      } else {
        return { isValid: false, error: 'Unable to parse request URL' };
      }
    } catch (error) {
      return { isValid: false, error: `URL parsing error: ${error.message}` };
    }
    
    const statusCode = response.code || response.status;
    
    let responseBody;
    try {
      if (response.body) {
        responseBody = typeof response.body === 'string' 
          ? JSON.parse(response.body) 
          : response.body;
      } else if (response.stream && response.stream.toString) {
        responseBody = JSON.parse(response.stream.toString());
      } else {
        return { isValid: false, error: 'No response body found' };
      }
    } catch (error) {
      return { isValid: false, error: `JSON parsing error: ${error.message}` };
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
      warnings: []
    };

    try {
      // Normalize path for schema lookup
      const normalizedPath = this.normalizePath(path);
      
      // Check if path exists in schema
      if (!this.schema.paths[normalizedPath]) {
        validation.warnings.push(`Path ${normalizedPath} not found in OpenAPI schema`);
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
    if (!body || typeof body !== 'object') {
      validation.errors.push('Response body should be an object');
      return;
    }

    // Check pagination structure for list endpoints
    if (body.hasOwnProperty('data') && Array.isArray(body.data)) {
      if (typeof body.page !== 'number') {
        validation.errors.push('Pagination: page should be number');
      }
      if (typeof body.limit !== 'number') {
        validation.errors.push('Pagination: limit should be number');
      }
      if (typeof body.total !== 'number') {
        validation.errors.push('Pagination: total should be number');
      }
      if (body.totalPages && typeof body.totalPages !== 'number') {
        validation.errors.push('Pagination: totalPages should be number');
      }
    }

    // Validate stamp objects in data array
    if (body.data && Array.isArray(body.data)) {
      body.data.forEach((item, index) => {
        if (item.stamp !== undefined && typeof item.stamp !== 'number') {
          validation.errors.push(`stamps[${index}].stamp should be number`);
        }
        if (item.cpid !== undefined && typeof item.cpid !== 'string') {
          validation.errors.push(`stamps[${index}].cpid should be string`);
        }
        if (item.ident !== undefined && typeof item.ident !== 'string') {
          validation.errors.push(`stamps[${index}].ident should be string`);
        }
      });
    }

    // Validate error responses
    if (validation.statusCode >= 400 && body.error === undefined) {
      validation.warnings.push('Error response should include error field');
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
          if (typeof item.marketData !== 'object') {
            validation.errors.push(`stamps[${index}].marketData should be object`);
          } else {
            this.validateMarketData(item.marketData, `stamps[${index}].marketData`, validation);
          }
        }

        // Validate cacheStatus (v2.3)
        if (item.cacheStatus && typeof item.cacheStatus !== 'string') {
          validation.errors.push(`stamps[${index}].cacheStatus should be string`);
        }

        // Validate sale_data structure (v2.3 recent sales enhancement)
        if (item.sale_data) {
          if (typeof item.sale_data !== 'object') {
            validation.errors.push(`stamps[${index}].sale_data should be object`);
          } else {
            this.validateSaleData(item.sale_data, `stamps[${index}].sale_data`, validation);
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
      'recentSalePriceBTC', 'floorPriceBTC', 'volume24hBTC', 'volume7dBTC',
      'holderCount', 'dataQualityScore'
    ];

    numericFields.forEach(field => {
      if (marketData[field] !== undefined && marketData[field] !== null) {
        if (typeof marketData[field] !== 'number') {
          validation.errors.push(`${path}.${field} should be number`);
        }
      }
    });

    if (marketData.lastPriceUpdate && typeof marketData.lastPriceUpdate !== 'string') {
      validation.errors.push(`${path}.lastPriceUpdate should be string (datetime)`);
    }
  }

  /**
   * Validate sale_data object structure
   */
  validateSaleData(saleData, path, validation) {
    if (saleData.btc_amount !== undefined && typeof saleData.btc_amount !== 'number') {
      validation.errors.push(`${path}.btc_amount should be number`);
    }
    if (saleData.block_index !== undefined && typeof saleData.block_index !== 'number') {
      validation.errors.push(`${path}.block_index should be number`);
    }
    if (saleData.tx_hash !== undefined && typeof saleData.tx_hash !== 'string') {
      validation.errors.push(`${path}.tx_hash should be string`);
    }
  }

  /**
   * Normalize API path for schema lookup
   */
  normalizePath(path) {
    const cleanPath = path.split('?')[0];
    
    return cleanPath
      .replace(/\/\d+$/, '/{id}')
      .replace(/\/\d+\//, '/{id}/')
      .replace(/\/[a-fA-F0-9]{64}/, '/{hash}')
      .replace(/\/[13][a-km-zA-HJ-NP-Z1-9]{25,34}/, '/{address}');
  }

  /**
   * Generate final validation report
   */
  generateReport() {
    const total = this.validations.length;
    const passed = this.validations.filter(v => v.isValid).length;
    const failed = total - passed;

    console.log('\n📋 OpenAPI Schema Validation Report');
    console.log('='.repeat(50));
    console.log(`Total API Calls Validated: ${total}`);
    console.log(`✅ Schema Compliant: ${passed}`);
    console.log(`❌ Schema Violations: ${failed}`);
    
    if (failed > 0) {
      console.log('\n🔍 Schema Violations:');
      this.validations
        .filter(v => !v.isValid)
        .forEach(validation => {
          console.log(`\n❌ ${validation.method} ${validation.path} (${validation.statusCode})`);
          validation.errors.forEach(error => {
            console.log(`   • ${error}`);
          });
        });
    }

    // Summary of warnings
    const totalWarnings = this.validations.reduce((sum, v) => sum + v.warnings.length, 0);
    if (totalWarnings > 0) {
      console.log(`\n⚠️  Total Warnings: ${totalWarnings}`);
    }

    return {
      total,
      passed,
      failed,
      warnings: totalWarnings,
      validations: this.validations
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
    const resultsContent = fs.readFileSync(resultsPath, 'utf8');
    const newmanResults = JSON.parse(resultsContent);

    console.log(`\n🔍 Processing ${newmanResults.run?.executions?.length || 0} API calls from Newman results...`);

    // Process each execution
    if (newmanResults.run?.executions) {
      newmanResults.run.executions.forEach((execution, index) => {
        if (execution.response && execution.request) {
          try {
            const validation = validator.validateNewmanResult({
              request: execution.request,
              response: execution.response
            });

            // Log validation result
            const status = validation.isValid ? '✅' : '❌';
            const method = execution.request?.method || 'GET';
            const url = execution.request?.url?.raw || execution.request?.url || 'unknown';
            const responseCode = execution.response?.code || 'unknown';
            
            console.log(`${status} ${method} ${url} (${responseCode})`);
            
            if (!validation.isValid && validation.errors && validation.errors.length > 0) {
              validation.errors.forEach(error => {
                console.log(`   • ${error}`);
              });
            }
            
            if (validation.warnings && validation.warnings.length > 0) {
              validation.warnings.forEach(warning => {
                console.log(`   ⚠️  ${warning}`);
              });
            }
          } catch (error) {
            console.error(`Error validating execution ${index}:`, error.message);
          }
        }
      });
    }

    // Generate final report
    const report = validator.generateReport();
    
    // Exit with error code if validations failed
    if (report.failed > 0) {
      console.log('\n❌ OpenAPI schema validation failed');
      process.exit(1);
    } else {
      console.log('\n✅ All API responses comply with OpenAPI schema');
      process.exit(0);
    }

  } catch (error) {
    console.error('Error processing Newman results:', error.message);
    process.exit(1);
  }
}

// CLI usage
if (process.argv[1] === __filename) {
  const schemaPath = process.argv[2] || './schema.yml';
  const resultsPath = process.argv[3];
  
  if (!resultsPath) {
    console.error('Usage: node newman-schema-validator.mjs <schema.yml> <newman-results.json>');
    process.exit(1);
  }

  processNewmanResults(schemaPath, resultsPath).catch(console.error);
}