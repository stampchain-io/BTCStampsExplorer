#!/usr/bin/env node

/**
 * Newman OpenAPI Contract Testing Script
 * 
 * Validates Newman test responses against OpenAPI schema definitions
 * Supports v2.2/v2.3 API version testing and middleware transitions
 * 
 * Task 82: Add OpenAPI Contract Testing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import newman from 'newman';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NewmanOpenAPIValidator {
  constructor(openapiPath) {
    this.openapiPath = openapiPath;
    this.ajv = new Ajv({ 
      allErrors: true, 
      strict: false,
      validateFormats: true,
      verbose: true
    });
    addFormats(this.ajv);
    this.schemas = new Map();
    this.validationResults = [];
  }

  async loadOpenAPISpec() {
    try {
      const specContent = fs.readFileSync(this.openapiPath, 'utf8');
      this.spec = yaml.load(specContent);
      console.log(`✅ Loaded OpenAPI spec v${this.spec.info.version}`);
      
      // Compile schemas
      this.compileSchemas();
    } catch (error) {
      console.error('❌ Failed to load OpenAPI spec:', error.message);
      throw error;
    }
  }

  compileSchemas() {
    // Add component schemas
    const components = this.spec.components?.schemas || {};
    for (const [name, schema] of Object.entries(components)) {
      this.ajv.addSchema(schema, `#/components/schemas/${name}`);
    }

    // Compile endpoint schemas
    for (const [path, pathItem] of Object.entries(this.spec.paths || {})) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) continue;
        
        const responses = operation.responses || {};
        for (const [statusCode, response] of Object.entries(responses)) {
          const schema = this.extractResponseSchema(response);
          if (schema) {
            const key = `${method.toUpperCase()} ${path} ${statusCode}`;
            try {
              const validator = this.ajv.compile(schema);
              this.schemas.set(key, validator);
            } catch (error) {
              console.warn(`⚠️  Failed to compile schema for ${key}:`, error.message);
            }
          }
        }
      }
    }
    
    console.log(`✅ Compiled ${this.schemas.size} response schemas`);
  }

  extractResponseSchema(response) {
    const content = response.content || {};
    const jsonContent = content['application/json'];
    
    if (jsonContent?.schema) {
      return this.resolveRefs(jsonContent.schema);
    }
    
    return null;
  }

  resolveRefs(schema) {
    if (schema.$ref) {
      const refPath = schema.$ref.split('/').slice(1);
      let resolved = this.spec;
      
      for (const part of refPath) {
        resolved = resolved[part];
        if (!resolved) {
          console.warn(`⚠️  Unable to resolve $ref: ${schema.$ref}`);
          return null;
        }
      }
      
      return this.resolveRefs(resolved);
    }
    
    // Recursively resolve nested schemas
    if (schema.type === 'object' && schema.properties) {
      const resolvedProps = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        resolvedProps[key] = this.resolveRefs(value);
      }
      return { ...schema, properties: resolvedProps };
    }
    
    if (schema.type === 'array' && schema.items) {
      return { ...schema, items: this.resolveRefs(schema.items) };
    }
    
    return schema;
  }

  findMatchingValidator(method, actualPath, statusCode) {
    // Try exact match first
    const exactKey = `${method} ${actualPath} ${statusCode}`;
    if (this.schemas.has(exactKey)) {
      return this.schemas.get(exactKey);
    }

    // Try pattern matching for parameterized paths
    for (const [key, validator] of this.schemas.entries()) {
      const [keyMethod, keyPath, keyStatus] = key.split(' ');
      
      if (keyMethod === method && keyStatus === String(statusCode)) {
        // Convert OpenAPI path to regex
        const pattern = keyPath.replace(/{[^}]+}/g, '[^/]+');
        const regex = new RegExp(`^${pattern}$`);
        
        if (regex.test(actualPath)) {
          return validator;
        }
      }
    }
    
    return null;
  }

  validateResponse(request, response) {
    const method = request.method;
    const path = new URL(request.url).pathname;
    const statusCode = response.code;
    
    // Skip non-JSON responses
    if (!response.json) {
      return { valid: true, skipped: true };
    }

    const validator = this.findMatchingValidator(method, path, statusCode);
    
    if (!validator) {
      return { 
        valid: true, 
        warning: `No schema found for ${method} ${path} ${statusCode}` 
      };
    }

    const valid = validator(response.json);
    
    if (!valid) {
      return {
        valid: false,
        errors: validator.errors.map(err => ({
          path: err.instancePath,
          message: err.message,
          params: err.params,
          schemaPath: err.schemaPath
        }))
      };
    }
    
    return { valid: true };
  }

  createNewmanReporter() {
    const self = this;
    
    return {
      item: function(err, args) {
        if (err) return;
        
        const request = args.item.request;
        const response = args.response;
        
        if (!response) return;
        
        // Validate response against OpenAPI schema
        const validation = self.validateResponse(request, response);
        
        // Store result
        self.validationResults.push({
          request: {
            method: request.method,
            url: request.url.toString(),
            headers: request.headers?.toObject()
          },
          response: {
            code: response.code,
            status: response.status
          },
          validation,
          timestamp: new Date().toISOString()
        });

        // Log validation failures
        if (!validation.valid && !validation.skipped) {
          console.error(`\n❌ Schema Validation Failed: ${request.method} ${request.url}`);
          console.error(`   Status: ${response.code} ${response.status}`);
          if (validation.errors) {
            validation.errors.forEach(err => {
              console.error(`   - ${err.path}: ${err.message}`);
            });
          }
        }
      },
      
      done: function(err, summary) {
        if (err) {
          console.error('Newman run failed:', err);
          return;
        }

        // Summary report
        console.log('\n📊 OpenAPI Contract Testing Summary');
        console.log('===================================');
        
        const totalValidations = self.validationResults.length;
        const failedValidations = self.validationResults.filter(r => !r.validation.valid && !r.validation.skipped).length;
        const skippedValidations = self.validationResults.filter(r => r.validation.skipped).length;
        const warnings = self.validationResults.filter(r => r.validation.warning).length;
        
        console.log(`Total Requests: ${totalValidations}`);
        console.log(`✅ Passed: ${totalValidations - failedValidations - skippedValidations}`);
        console.log(`❌ Failed: ${failedValidations}`);
        console.log(`⏭️  Skipped: ${skippedValidations}`);
        console.log(`⚠️  Warnings: ${warnings}`);
        
        // Write detailed report
        const reportPath = path.join(__dirname, '..', 'reports', 'openapi-validation-report.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify({
          summary: {
            total: totalValidations,
            passed: totalValidations - failedValidations - skippedValidations,
            failed: failedValidations,
            skipped: skippedValidations,
            warnings
          },
          details: self.validationResults,
          timestamp: new Date().toISOString()
        }, null, 2));
        
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        // Exit with error if validations failed
        if (failedValidations > 0) {
          process.exit(1);
        }
      }
    };
  }

  async runNewmanWithValidation(collectionPath, options = {}) {
    await this.loadOpenAPISpec();
    
    const newmanOptions = {
      collection: require(path.resolve(collectionPath)),
      environment: options.environment ? require(path.resolve(options.environment)) : undefined,
      reporters: ['cli'],
      customReporter: this.createNewmanReporter(),
      ...options
    };

    return new Promise((resolve, reject) => {
      newman.run(newmanOptions, (err, summary) => {
        if (err) {
          reject(err);
        } else {
          resolve(summary);
        }
      });
    });
  }
}

// CLI Usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node newman-openapi-validator.js <openapi-spec> <postman-collection> [environment]');
    process.exit(1);
  }

  const [openapiPath, collectionPath, environmentPath] = args;
  
  const validator = new NewmanOpenAPIValidator(openapiPath);
  
  validator.runNewmanWithValidation(collectionPath, {
    environment: environmentPath
  }).catch(error => {
    console.error('Validation run failed:', error);
    process.exit(1);
  });
}

export default NewmanOpenAPIValidator;