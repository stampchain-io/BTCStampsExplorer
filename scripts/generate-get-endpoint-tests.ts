#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Generate Postman test scripts for untested GET endpoints
 *
 * This script:
 * 1. Reads endpoint-schema-map.json to find untested GET endpoints
 * 2. Generates appropriate test assertions based on responseType and requiredFields
 * 3. Injects test event scripts into comprehensive.json
 * 4. Creates a backup before modification
 *
 * Usage: deno run --allow-read --allow-write scripts/generate-get-endpoint-tests.ts
 */

interface EndpointMapping {
  postmanName: string;
  method: string;
  url: string;
  openapiPath: string;
  expectedStatus: number;
  hasExistingTests: boolean;
  responseType: 'simple' | 'paginated' | 'array';
  requiredFields: string[];
  dataItemFields?: string[];
  dataItemTypes?: Record<string, string>;
  parameters?: string[];
}

interface EndpointSchemaMap {
  requests: EndpointMapping[];
  summary: {
    totalRequests: number;
    requestsWithoutTests: number;
    requestsWithTests: number;
    openapiEndpoints: number;
  };
}

interface PostmanEvent {
  listen: string;
  script: {
    exec: string[];
    type?: string;
  };
}

interface PostmanRequest {
  name: string;
  request: unknown;
  event?: PostmanEvent[];
  response?: unknown[];
}

interface PostmanFolder {
  name: string;
  item: (PostmanRequest | PostmanFolder)[];
}

interface PostmanCollection {
  info: unknown;
  variable: unknown[];
  event: unknown[];
  item: PostmanFolder[];
}

/**
 * Generate test script lines based on endpoint characteristics
 */
function generateTestScript(endpoint: EndpointMapping): string[] {
  const testLines: string[] = [];

  // Status code test - exact match
  testLines.push(
    `pm.test("Status code is exactly ${endpoint.expectedStatus}", function() {`,
    `  pm.response.to.have.status(${endpoint.expectedStatus});`,
    `});`,
    ``
  );

  // Response is JSON test
  testLines.push(
    `pm.test("Response is JSON", function() {`,
    `  pm.response.to.be.json;`,
    `});`,
    ``
  );

  // Response type specific tests
  if (endpoint.responseType === 'paginated') {
    generatePaginatedTests(testLines, endpoint);
  } else if (endpoint.responseType === 'array') {
    generateArrayTests(testLines, endpoint);
  } else if (endpoint.responseType === 'simple') {
    generateSimpleTests(testLines, endpoint);
  }

  return testLines;
}

/**
 * Generate tests for paginated responses
 */
function generatePaginatedTests(testLines: string[], endpoint: EndpointMapping): void {
  testLines.push(
    `pm.test("Response has required pagination fields", function() {`,
    `  const json = pm.response.json();`,
    `  pm.expect(json).to.have.property('data').that.is.an('array');`,
    `  pm.expect(json).to.have.property('page').that.is.a('number');`,
    `  pm.expect(json).to.have.property('limit').that.is.a('number');`,
    `  pm.expect(json).to.have.property('totalPages').that.is.a('number');`
  );

  // Add any additional required fields
  if (endpoint.requiredFields && endpoint.requiredFields.length > 0) {
    for (const field of endpoint.requiredFields) {
      if (!['data', 'page', 'limit', 'totalPages'].includes(field)) {
        testLines.push(`  pm.expect(json).to.have.property('${field}');`);
      }
    }
  }

  testLines.push(`});`, ``);

  // Data items validation if we have field metadata
  if (endpoint.dataItemFields && endpoint.dataItemFields.length > 0) {
    testLines.push(
      `pm.test("Data items have required fields with correct types", function() {`,
      `  const json = pm.response.json();`,
      `  if (json.data && json.data.length > 0) {`,
      `    const item = json.data[0];`
    );

    for (const field of endpoint.dataItemFields) {
      const expectedType = endpoint.dataItemTypes?.[field];
      if (expectedType) {
        const jsType = mapSchemaTypeToJsType(expectedType);
        testLines.push(`    pm.expect(item).to.have.property('${field}').that.is.a('${jsType}');`);
      } else {
        testLines.push(`    pm.expect(item).to.have.property('${field}');`);
      }
    }

    testLines.push(`  }`, `});`, ``);
  }
}

/**
 * Generate tests for array responses
 */
function generateArrayTests(testLines: string[], endpoint: EndpointMapping): void {
  testLines.push(
    `pm.test("Response is an array", function() {`,
    `  const json = pm.response.json();`,
    `  pm.expect(json).to.be.an('array');`,
    `});`,
    ``
  );

  // If we have required fields, check them on the first item
  if (endpoint.requiredFields && endpoint.requiredFields.length > 0) {
    testLines.push(
      `pm.test("Array items have required fields", function() {`,
      `  const json = pm.response.json();`,
      `  if (json.length > 0) {`,
      `    const item = json[0];`
    );

    for (const field of endpoint.requiredFields) {
      testLines.push(`    pm.expect(item).to.have.property('${field}');`);
    }

    testLines.push(`  }`, `});`, ``);
  }
}

/**
 * Generate tests for simple object responses
 */
function generateSimpleTests(testLines: string[], endpoint: EndpointMapping): void {
  if (endpoint.requiredFields && endpoint.requiredFields.length > 0) {
    testLines.push(
      `pm.test("Response has required fields", function() {`,
      `  const json = pm.response.json();`
    );

    for (const field of endpoint.requiredFields) {
      testLines.push(`  pm.expect(json).to.have.property('${field}');`);
    }

    testLines.push(`});`, ``);
  } else {
    // If no required fields specified, just validate it's an object
    testLines.push(
      `pm.test("Response is a valid object", function() {`,
      `  const json = pm.response.json();`,
      `  pm.expect(json).to.be.an('object');`,
      `});`,
      ``
    );
  }
}

/**
 * Map OpenAPI schema types to JavaScript types for Chai assertions
 */
function mapSchemaTypeToJsType(schemaType: string): string {
  const typeMap: Record<string, string> = {
    'string': 'string',
    'integer': 'number',
    'number': 'number',
    'boolean': 'boolean',
    'array': 'array',
    'object': 'object',
    'unknown': 'undefined' // Will use generic property check
  };

  return typeMap[schemaType] || 'undefined';
}

/**
 * Find a request in the Postman collection by name
 */
function findRequestInCollection(
  collection: PostmanCollection,
  requestName: string
): PostmanRequest | null {
  for (const folder of collection.item) {
    const request = findRequestInFolder(folder, requestName);
    if (request) {
      return request;
    }
  }
  return null;
}

/**
 * Recursively search for a request in a folder
 */
function findRequestInFolder(
  folder: PostmanFolder | PostmanRequest,
  requestName: string
): PostmanRequest | null {
  // Check if this is a request (has a 'request' property that's not an array)
  if ('request' in folder && !Array.isArray(folder.item)) {
    if (folder.name === requestName) {
      return folder as PostmanRequest;
    }
    return null;
  }

  // This is a folder, search its items
  if ('item' in folder && Array.isArray(folder.item)) {
    for (const item of folder.item) {
      const found = findRequestInFolder(item, requestName);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting test script generation for untested GET endpoints\n');

  // Read endpoint schema mapping
  const schemaMapPath = './tests/postman/endpoint-schema-map.json';
  console.log(`📖 Reading endpoint schema map from: ${schemaMapPath}`);

  const schemaMapText = await Deno.readTextFile(schemaMapPath);
  const schemaMap: EndpointSchemaMap = JSON.parse(schemaMapText);

  // Filter to GET requests without existing tests
  const untestedGetEndpoints = schemaMap.requests.filter(
    req => req.method === 'GET' && req.hasExistingTests === false
  );

  console.log(`Found ${untestedGetEndpoints.length} GET endpoints without tests\n`);

  // Read comprehensive.json
  const collectionPath = './tests/postman/collections/comprehensive.json';
  console.log(`📖 Reading Postman collection from: ${collectionPath}`);

  const collectionText = await Deno.readTextFile(collectionPath);
  const collection: PostmanCollection = JSON.parse(collectionText);

  // Create backup
  const backupPath = `${collectionPath}.backup`;
  console.log(`💾 Creating backup at: ${backupPath}\n`);
  await Deno.writeTextFile(backupPath, collectionText);

  // Generate and inject tests
  let testsAdded = 0;
  let testsSkipped = 0;

  console.log('🔧 Generating and injecting test scripts:\n');

  for (const endpoint of untestedGetEndpoints) {
    // Find the request in the collection
    const request = findRequestInCollection(collection, endpoint.postmanName);

    if (!request) {
      console.log(`⚠️  Warning: Could not find request "${endpoint.postmanName}" in collection`);
      testsSkipped++;
      continue;
    }

    // Generate test script
    const testScript = generateTestScript(endpoint);

    // Create event object
    const testEvent: PostmanEvent = {
      listen: 'test',
      script: {
        exec: testScript,
        type: 'text/javascript'
      }
    };

    // Add event to request
    if (!request.event) {
      request.event = [];
    }

    // Only add if no test event exists
    const hasTestEvent = request.event.some(e => e.listen === 'test');
    if (!hasTestEvent) {
      request.event.push(testEvent);
      testsAdded++;
      console.log(`✅ Added tests to: ${endpoint.postmanName}`);
    } else {
      testsSkipped++;
      console.log(`⏭️  Skipped (has tests): ${endpoint.postmanName}`);
    }
  }

  // Write updated collection
  console.log(`\n💾 Writing updated collection to: ${collectionPath}`);
  const updatedJson = JSON.stringify(collection, null, 2);
  await Deno.writeTextFile(collectionPath, updatedJson);

  // Validate JSON is still valid
  console.log(`✅ Validating updated JSON...`);
  try {
    JSON.parse(updatedJson);
    console.log(`✅ JSON validation passed\n`);
  } catch (error) {
    console.error(`❌ JSON validation failed:`, error);
    console.log(`🔄 Restoring backup...`);
    await Deno.copyFile(backupPath, collectionPath);
    Deno.exit(1);
  }

  // Summary
  console.log('📊 Summary:');
  console.log(`   Tests added:   ${testsAdded}`);
  console.log(`   Tests skipped: ${testsSkipped}`);
  console.log(`   Total processed: ${untestedGetEndpoints.length}`);
  console.log(`\n✨ Test generation complete!`);

  // Next steps
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Review the changes in ${collectionPath}`);
  console.log(`   2. Run Newman to validate: deno task test:api`);
  console.log(`   3. Check for any test failures and adjust as needed`);
  console.log(`   4. Backup is available at: ${backupPath}`);
}

// Run main function
if (import.meta.main) {
  main().catch(error => {
    console.error('❌ Error:', error);
    Deno.exit(1);
  });
}
