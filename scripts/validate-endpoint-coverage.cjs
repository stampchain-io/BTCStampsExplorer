#!/usr/bin/env node

/**
 * validate-endpoint-coverage.cjs
 * 
 * Validates that all API endpoints defined in OpenAPI schema
 * are actually tested in the comprehensive Newman collection.
 * 
 * This ensures no endpoints are missing from regression testing.
 */

const fs = require('fs');
const yaml = require('js-yaml');

class EndpointCoverageValidator {
  constructor() {
    this.schema = this.loadOpenAPISchema();
    this.collection = this.loadNewmanCollection();
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalEndpoints: 0,
        testedEndpoints: 0,
        untestedEndpoints: 0,
        coveragePercentage: 0
      },
      endpoints: {
        tested: [],
        untested: []
      }
    };
  }

  loadOpenAPISchema() {
    try {
      const schemaContent = fs.readFileSync('schema.yml', 'utf8');
      return yaml.load(schemaContent);
    } catch (error) {
      console.error('❌ Error loading OpenAPI schema:', error.message);
      process.exit(1);
    }
  }

  loadNewmanCollection() {
    try {
      const collectionContent = fs.readFileSync('postman-collection-full-regression.json', 'utf8');
      return JSON.parse(collectionContent);
    } catch (error) {
      console.error('❌ Error loading Newman collection:', error.message);
      process.exit(1);
    }
  }

  extractSchemaEndpoints() {
    const endpoints = [];
    
    if (!this.schema.paths) {
      console.error('❌ No paths found in OpenAPI schema');
      return endpoints;
    }

    for (const path in this.schema.paths) {
      const pathObject = this.schema.paths[path];
      
      for (const method in pathObject) {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
          endpoints.push({
            path: path,
            method: method.toUpperCase(),
            operationId: pathObject[method].operationId || null,
            summary: pathObject[method].summary || '',
            tags: pathObject[method].tags || []
          });
        }
      }
    }

    return endpoints;
  }

  extractNewmanEndpoints() {
    const endpoints = [];
    
    const extractFromItems = (items, parentPath = '') => {
      if (!items) return;
      
      for (const item of items) {
        if (item.request && item.request.url) {
          const url = item.request.url;
          let path = '';
          
          if (typeof url === 'object' && url.path) {
            path = '/' + url.path.join('/');
          } else if (typeof url === 'string') {
            try {
              const urlObj = new URL(url);
              path = urlObj.pathname;
            } catch (e) {
              // If URL parsing fails, try to extract path manually
              path = url.replace(/^https?:\/\/[^\/]+/, '');
            }
          }
          
          // Normalize path
          path = path.replace(/{{[^}]+}}/g, match => {
            // Convert Newman variables to OpenAPI parameter format
            const param = match.replace(/[{}]/g, '');
            return `:${param}`;
          });
          
          const method = item.request.method || 'GET';
          
          endpoints.push({
            path: path,
            method: method.toUpperCase(),
            name: item.name || 'Unnamed test',
            folder: parentPath
          });
        }
        
        // Recursively check nested items
        if (item.item) {
          const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
          extractFromItems(item.item, currentPath);
        }
      }
    };
    
    extractFromItems(this.collection.item);
    return endpoints;
  }

  compareEndpoints() {
    const schemaEndpoints = this.extractSchemaEndpoints();
    const newmanEndpoints = this.extractNewmanEndpoints();
    
    console.log(`📊 Schema defines ${schemaEndpoints.length} endpoints`);
    console.log(`📊 Newman collection tests ${newmanEndpoints.length} endpoints`);
    
    this.results.summary.totalEndpoints = schemaEndpoints.length;
    
    for (const schemaEndpoint of schemaEndpoints) {
      const found = newmanEndpoints.find(newmanEndpoint => 
        this.pathsMatch(schemaEndpoint.path, newmanEndpoint.path) &&
        schemaEndpoint.method === newmanEndpoint.method
      );
      
      if (found) {
        this.results.endpoints.tested.push({
          ...schemaEndpoint,
          testName: found.name,
          testFolder: found.folder
        });
      } else {
        this.results.endpoints.untested.push(schemaEndpoint);
      }
    }
    
    this.results.summary.testedEndpoints = this.results.endpoints.tested.length;
    this.results.summary.untestedEndpoints = this.results.endpoints.untested.length;
    this.results.summary.coveragePercentage = Math.round(
      (this.results.summary.testedEndpoints / this.results.summary.totalEndpoints) * 100
    );
  }

  pathsMatch(schemaPath, newmanPath) {
    // Normalize paths for comparison
    const normalizePath = (path) => {
      return path
        .replace(/^\/api/, '') // Remove /api prefix if present
        .replace(/\{([^}]+)\}/g, ':$1') // Convert {param} to :param
        .replace(/\/+/g, '/') // Remove duplicate slashes
        .replace(/\/$/, ''); // Remove trailing slash
    };
    
    const normalizedSchema = normalizePath(schemaPath);
    const normalizedNewman = normalizePath(newmanPath);
    
    return normalizedSchema === normalizedNewman;
  }

  generateReport() {
    console.log('\n📋 Endpoint Coverage Analysis');
    console.log('===============================');
    console.log(`Coverage: ${this.results.summary.coveragePercentage}% (${this.results.summary.testedEndpoints}/${this.results.summary.totalEndpoints})`);
    
    if (this.results.endpoints.untested.length > 0) {
      console.log(`\n❌ ${this.results.endpoints.untested.length} Untested Endpoints:`);
      this.results.endpoints.untested.forEach((endpoint, index) => {
        console.log(`   ${index + 1}. ${endpoint.method} ${endpoint.path}`);
        if (endpoint.summary) {
          console.log(`      ${endpoint.summary}`);
        }
      });
    } else {
      console.log('\n✅ All endpoints are tested!');
    }
    
    // Save detailed report
    const reportPath = 'reports/endpoint-coverage-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Detailed report saved: ${reportPath}`);
    
    return this.results.summary.coveragePercentage;
  }

  run() {
    console.log('🔍 Validating endpoint coverage...');
    
    this.compareEndpoints();
    const coverage = this.generateReport();
    
    // Exit with error if coverage is below threshold
    const threshold = 95; // 95% coverage required
    if (coverage < threshold) {
      console.log(`\n⚠️  Coverage ${coverage}% is below threshold ${threshold}%`);
      process.exit(1);
    } else {
      console.log(`\n✅ Coverage ${coverage}% meets threshold ${threshold}%`);
    }
  }
}

function main() {
  const validator = new EndpointCoverageValidator();
  validator.run();
}

if (require.main === module) {
  main();
}

module.exports = { EndpointCoverageValidator, main }; 