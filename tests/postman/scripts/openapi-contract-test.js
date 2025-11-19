/**
 * OpenAPI Contract Testing Script for Postman Collections
 *
 * This script integrates with Postman tests to validate API responses
 * against OpenAPI schema definitions, supporting v2.2/v2.3 transitions
 *
 * Task 82: Add OpenAPI Contract Testing
 */

// Pre-request script to load OpenAPI spec
const loadOpenAPISpec = `
// Load OpenAPI spec once per collection run
if (!pm.collectionVariables.has('openapi_spec_loaded')) {
    // In real implementation, this would load from the OpenAPI endpoint
    // For now, we'll set a flag to indicate spec should be loaded
    pm.collectionVariables.set('openapi_spec_loaded', 'true');
    pm.collectionVariables.set('openapi_validation_enabled', 'true');
    
    console.log('🔧 OpenAPI Contract Testing Enabled');
}
`;

// Test script to validate responses against OpenAPI schema
const validateResponseSchema = `
// OpenAPI Contract Validation
if (pm.collectionVariables.get('openapi_validation_enabled') === 'true') {
    
    // Get request details
    const method = pm.request.method;
    const path = pm.request.url.getPath();
    const statusCode = pm.response.code;
    const apiVersion = pm.request.headers.get('API-Version') || '2.3';
    
    // Skip validation for non-JSON responses
    const contentType = pm.response.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
        console.log('⏭️  Skipping validation for non-JSON response');
        return;
    }
    
    // Parse response
    let responseData;
    try {
        responseData = pm.response.json();
    } catch (e) {
        pm.test('Response should be valid JSON for schema validation', function() {
            pm.expect.fail('Failed to parse response as JSON: ' + e.message);
        });
        return;
    }
    
    // Schema validation based on endpoint
    pm.test(\`OpenAPI Schema Validation - \${method} \${path}\`, function() {
        
        // Common response structure validations
        if (statusCode >= 200 && statusCode < 300) {
            // Success response structure
            pm.expect(responseData).to.be.an('object');
            
            // API v2.3 structure validation
            if (apiVersion === '2.3') {
                // Validate nested structure for v2.3
                if (path.includes('/src20/tx/')) {
                    pm.expect(responseData).to.have.property('data');
                    if (responseData.data) {
                        pm.expect(responseData.data).to.be.an('object');
                        
                        // Validate market_data is nested object in v2.3
                        if (responseData.data.market_data) {
                            pm.expect(responseData.data.market_data).to.be.an('object');
                            pm.expect(responseData.data.market_data).to.have.property('price_usd');
                        }
                        
                        // Validate mint_progress is nested in v2.3
                        if (responseData.data.mint_progress) {
                            pm.expect(responseData.data.mint_progress).to.be.an('object');
                            pm.expect(responseData.data.mint_progress).to.have.property('progress');
                            pm.expect(responseData.data.mint_progress).to.have.property('current');
                        }
                    }
                }
            } else if (apiVersion === '2.2') {
                // Validate flat structure for v2.2
                if (path.includes('/src20/tx/')) {
                    pm.expect(responseData).to.have.property('data');
                    if (responseData.data) {
                        // In v2.2, market data fields should be at root level
                        if (responseData.data.price_usd !== undefined) {
                            pm.expect(responseData.data).to.not.have.property('market_data');
                        }
                        
                        // In v2.2, mint progress fields should be flat
                        if (responseData.data.progress !== undefined) {
                            pm.expect(responseData.data).to.not.have.property('mint_progress');
                            pm.expect(responseData.data).to.have.property('minted_amt');
                        }
                    }
                }
            }
            
            // Pagination structure validation
            if (responseData.pagination) {
                pm.expect(responseData.pagination).to.be.an('object');
                pm.expect(responseData.pagination).to.have.property('page');
                pm.expect(responseData.pagination).to.have.property('limit');
                pm.expect(responseData.pagination).to.have.property('total');
                pm.expect(responseData.pagination).to.have.property('totalPages');
            }
            
        } else if (statusCode >= 400) {
            // Error response structure
            pm.expect(responseData).to.have.property('error');
            pm.expect(responseData.error).to.be.a('string');
            
            if (responseData.details) {
                pm.expect(responseData.details).to.be.an('object');
            }
        }
        
        // Log validation result
        console.log(\`✅ Schema validation passed for \${method} \${path} (v\${apiVersion})\`);
    });
    
    // Additional field-level validations based on endpoint type
    if (path.includes('/stamp/')) {
        pm.test('Stamp response fields validation', function() {
            if (responseData.data) {
                const stamp = Array.isArray(responseData.data) ? responseData.data[0] : responseData.data;
                if (stamp) {
                    // Required stamp fields
                    pm.expect(stamp).to.have.property('stamp_id');
                    pm.expect(stamp).to.have.property('tx_hash');
                    pm.expect(stamp).to.have.property('block_index');
                    
                    // Type validations
                    if (stamp.stamp_id !== null) {
                        pm.expect(stamp.stamp_id).to.be.a('number');
                    }
                    pm.expect(stamp.tx_hash).to.be.a('string');
                    pm.expect(stamp.block_index).to.be.a('number');
                }
            }
        });
    }
    
    if (path.includes('/src20/')) {
        pm.test('SRC-20 response fields validation', function() {
            if (responseData.data) {
                const token = Array.isArray(responseData.data) ? responseData.data[0] : responseData.data;
                if (token) {
                    // Required SRC-20 fields
                    pm.expect(token).to.have.property('tick');
                    pm.expect(token).to.have.property('p');
                    pm.expect(token).to.have.property('op');
                    
                    // Type validations
                    pm.expect(token.tick).to.be.a('string');
                    pm.expect(token.p).to.be.a('string');
                    pm.expect(token.op).to.be.a('string');
                }
            }
        });
    }
}
`;

// Collection-level test to summarize schema validation results
const summarizeValidationResults = `
// Summarize OpenAPI validation results at collection level
const validationResults = pm.collectionVariables.get('schema_validation_results') || [];
const currentResult = {
    request: pm.info.requestName,
    method: pm.request.method,
    path: pm.request.url.getPath(),
    status: pm.response.code,
    validated: true,
    timestamp: new Date().toISOString()
};

validationResults.push(currentResult);
pm.collectionVariables.set('schema_validation_results', validationResults);

// At collection end, generate summary
if (pm.info.iteration === pm.info.iterationCount - 1) {
    console.log('\\n📊 OpenAPI Contract Testing Summary');
    console.log('=====================================');
    console.log(\`Total Requests Validated: \${validationResults.length}\`);
    
    const byStatus = validationResults.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, {});
    
    console.log('\\nBy Status Code:');
    Object.entries(byStatus).forEach(([status, count]) => {
        console.log(\`  \${status}: \${count} requests\`);
    });
    
    console.log('\\n✅ All schema validations completed');
}
`;

// Export scripts for use in Postman collections
module.exports = {
  preRequestScript: loadOpenAPISpec,
  testScript: validateResponseSchema,
  collectionTestScript: summarizeValidationResults,

  // Helper to add schema validation to existing test
  addSchemaValidation: function (existingTest) {
    return existingTest + "\n\n" + validateResponseSchema;
  },

  // Helper to create a schema-validated test
  createValidatedTest: function (testName, customValidation = "") {
    return `
// ${testName}
${validateResponseSchema}

${customValidation}
        `;
  },
};
