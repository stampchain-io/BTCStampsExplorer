/**
 * Generate Postman test scripts for POST endpoints
 *
 * This script reads endpoint-schema-map.json, filters to POST requests,
 * and generates appropriate test scripts based on request body and expected outcomes.
 * Tests are designed to work with both real APIs (dev/prod) and mock APIs (CI).
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/generate-post-endpoint-tests.ts
 */

import { existsSync } from "https://deno.land/std@0.218.0/fs/mod.ts";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EndpointMetadata {
  postmanName: string;
  method: string;
  url: string;
  openapiPath: string;
  expectedStatus: number;
  hasExistingTests: boolean;
  responseType: string;
  requiredFields: string[];
  parameters?: string[];
}

interface EndpointSchemaMap {
  requests: EndpointMetadata[];
  summary: {
    totalRequests: number;
    requestsWithoutTests: number;
    requestsWithTests: number;
    openapiEndpoints: number;
  };
}

interface PostmanRequest {
  name: string;
  event?: Array<{
    listen: string;
    script: {
      exec: string[];
      type: string;
    };
  }>;
  request: {
    method: string;
    header: unknown[];
    body?: {
      mode: string;
      raw: string;
    };
    url: unknown;
  };
}

interface PostmanCollection {
  info: unknown;
  variable: unknown[];
  event: unknown[];
  item: Array<{
    name: string;
    item: PostmanRequest[];
  }>;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const SCHEMA_MAP_PATH = "./tests/postman/endpoint-schema-map.json";
const COLLECTION_PATH = "./tests/postman/collections/comprehensive.json";
const BACKUP_SUFFIX = ".backup";

// Known error-path test UTXOs from mock-external-apis.ts
const DETACH_NO_ASSETS_UTXO =
  "27000ab9c75570204adc1b3a5e7820c482d99033fbb3aafb844c3a3ce8b063db:0";
const DETACH_INSUFFICIENT_UTXO =
  "a5b51bd8e9f01ce59bfa7e4f7cbdd9b3a642a6068b21ab181cdd5a11cf0ff1dd:0";

// ─── Test Script Generators ────────────────────────────────────────────────────

/**
 * Generate success-path test script for POST endpoints
 * Tests that valid requests return 200 with PSBT/transaction data
 */
function generateSuccessPathTests(endpoint: EndpointMetadata): string[] {
  const tests: string[] = [
    `// POST Success Path Tests for ${endpoint.postmanName}`,
    "",
  ];

  // Status code test
  tests.push(
    `pm.test("Status code is exactly 200", function() {`,
    `    pm.response.to.have.status(200);`,
    `});`,
    "",
  );

  // Response contains transaction data (hex, psbtHex, or rawtransaction)
  tests.push(
    `pm.test("Response contains PSBT or transaction data", function() {`,
    `    const json = pm.response.json();`,
    `    // Different endpoints may return hex, psbtHex, or rawtransaction`,
    `    const hasHex = json.hasOwnProperty('hex') && typeof json.hex === 'string' && json.hex.length > 0;`,
    `    const hasPsbtHex = json.hasOwnProperty('psbtHex') && typeof json.psbtHex === 'string' && json.psbtHex.length > 0;`,
    `    const hasRawTx = json.hasOwnProperty('rawtransaction') && typeof json.rawtransaction === 'string' && json.rawtransaction.length > 0;`,
    `    pm.expect(hasHex || hasPsbtHex || hasRawTx, "Response must contain hex, psbtHex, or rawtransaction").to.be.true;`,
    `});`,
    "",
  );

  // inputsToSign array test
  tests.push(
    `pm.test("Response contains inputsToSign array", function() {`,
    `    const json = pm.response.json();`,
    `    pm.expect(json).to.have.property('inputsToSign').that.is.an('array');`,
    `    // inputsToSign may be empty for some operations, but must be an array`,
    `});`,
    "",
  );

  // Validate required fields if specified
  if (endpoint.requiredFields && endpoint.requiredFields.length > 0) {
    tests.push(
      `pm.test("Response contains all required fields", function() {`,
      `    const json = pm.response.json();`,
      `    const requiredFields = ${JSON.stringify(endpoint.requiredFields)};`,
      `    requiredFields.forEach(field => {`,
      `        pm.expect(json, \`Missing required field: \${field}\`).to.have.property(field);`,
      `    });`,
      `});`,
      "",
    );
  }

  // Transaction size estimate validation
  tests.push(
    `pm.test("Response includes transaction cost estimates", function() {`,
    `    const json = pm.response.json();`,
    `    // Different endpoints use different field names for fees`,
    `    const hasFeeEstimate = json.hasOwnProperty('est_miner_fee') || `,
    `                          json.hasOwnProperty('fee') ||`,
    `                          json.hasOwnProperty('est_tx_size');`,
    `    pm.expect(hasFeeEstimate, "Response should include fee/size estimates").to.be.true;`,
    `});`,
  );

  return tests;
}

/**
 * Generate error-path test script for POST endpoints
 * Tests that invalid requests return 400 with error message
 */
function generateErrorPathTests(endpoint: EndpointMetadata): string[] {
  const tests: string[] = [
    `// POST Error Path Tests for ${endpoint.postmanName}`,
    "",
  ];

  // Determine expected error message based on endpoint
  let errorExpectation = "error";
  if (endpoint.postmanName.includes("No Assets")) {
    errorExpectation = "no assets to detach";
  } else if (endpoint.postmanName.includes("Insufficient")) {
    errorExpectation = "insufficient";
  }

  // Status code test
  tests.push(
    `pm.test("Status code is 400 (expected for ${errorExpectation})", function () {`,
    `    pm.response.to.have.status(400);`,
    `});`,
    "",
  );

  // Error message test
  tests.push(
    `pm.test("Response contains error message", function () {`,
    `    const jsonData = pm.response.json();`,
    `    const errorMessage = jsonData.error || jsonData.message || '';`,
  );

  if (errorExpectation !== "error") {
    tests.push(
      `    pm.expect(errorMessage.toLowerCase(), "Error message should indicate ${errorExpectation}").to.include('${errorExpectation}');`,
    );
  } else {
    tests.push(
      `    pm.expect(errorMessage, "Error message should not be empty").to.have.length.greaterThan(0);`,
    );
  }

  tests.push(
    `});`,
    "",
  );

  // Error structure test
  tests.push(
    `pm.test("Response has proper error structure", function () {`,
    `    const jsonData = pm.response.json();`,
    `    pm.expect(jsonData).to.have.property('error');`,
    `});`,
  );

  return tests;
}

/**
 * Determine if an endpoint is an error-path test based on request body or name
 */
function isErrorPathTest(
  endpoint: EndpointMetadata,
  request: PostmanRequest,
): boolean {
  // Check if name explicitly indicates error path
  const nameIndicatesError = endpoint.postmanName.includes("No Assets") ||
    endpoint.postmanName.includes("Insufficient") ||
    endpoint.postmanName.includes("Invalid") ||
    endpoint.postmanName.includes("Error");

  if (nameIndicatesError) return true;

  // Check if request body contains known error-path UTXOs
  if (request.request.body?.raw) {
    const body = request.request.body.raw;
    if (
      body.includes(DETACH_NO_ASSETS_UTXO) ||
      body.includes(DETACH_INSUFFICIENT_UTXO)
    ) {
      return true;
    }
  }

  // Check if expected status is 400 (indicates error path)
  if (endpoint.expectedStatus === 400) {
    return true;
  }

  return false;
}

// ─── Main Logic ────────────────────────────────────────────────────────────────

async function main() {
  console.log("🧪 POST Endpoint Test Generator");
  console.log("================================\n");

  // 1. Read endpoint schema map
  console.log("📖 Reading endpoint schema map...");
  if (!existsSync(SCHEMA_MAP_PATH)) {
    console.error(`❌ Error: ${SCHEMA_MAP_PATH} not found`);
    Deno.exit(1);
  }

  const schemaMapText = await Deno.readTextFile(SCHEMA_MAP_PATH);
  const schemaMap: EndpointSchemaMap = JSON.parse(schemaMapText);

  // 2. Filter to POST requests without existing tests
  const postEndpoints = schemaMap.requests.filter(
    (req) => req.method === "POST" && !req.hasExistingTests,
  );

  console.log(
    `   Found ${postEndpoints.length} POST endpoints without tests:`,
  );
  postEndpoints.forEach((ep) => {
    console.log(`   - ${ep.postmanName}`);
  });
  console.log();

  if (postEndpoints.length === 0) {
    console.log("✅ All POST endpoints already have tests!");
    return;
  }

  // 3. Read Postman collection
  console.log("📖 Reading Postman collection...");
  if (!existsSync(COLLECTION_PATH)) {
    console.error(`❌ Error: ${COLLECTION_PATH} not found`);
    Deno.exit(1);
  }

  const collectionText = await Deno.readTextFile(COLLECTION_PATH);
  const collection: PostmanCollection = JSON.parse(collectionText);

  // 4. Create backup
  const backupPath = COLLECTION_PATH + BACKUP_SUFFIX;
  console.log(`💾 Creating backup at ${backupPath}...`);
  await Deno.writeTextFile(backupPath, collectionText);

  // 5. Generate and inject test scripts
  console.log("\n🔧 Generating test scripts...\n");
  let testsAdded = 0;

  for (const folder of collection.item) {
    if (folder.name === "POST Endpoints") {
      for (const request of folder.item) {
        // Find matching endpoint metadata
        const endpoint = postEndpoints.find(
          (ep) => ep.postmanName === request.name,
        );

        if (!endpoint) continue;

        // Determine if this is an error-path test
        const isError = isErrorPathTest(endpoint, request);

        // Generate appropriate test script
        const testScript = isError
          ? generateErrorPathTests(endpoint)
          : generateSuccessPathTests(endpoint);

        // Inject test script into request
        if (!request.event) {
          request.event = [];
        }

        // Remove existing test event if present
        request.event = request.event.filter((e) => e.listen !== "test");

        // Add new test event
        request.event.push({
          listen: "test",
          script: {
            exec: testScript,
            type: "text/javascript",
          },
        });

        testsAdded++;
        console.log(
          `   ✅ ${request.name} → ${isError ? "ERROR" : "SUCCESS"} path tests`,
        );
      }
    }
  }

  // 6. Write updated collection
  console.log(`\n💾 Writing updated collection...`);
  const updatedCollection = JSON.stringify(collection, null, 2);
  await Deno.writeTextFile(COLLECTION_PATH, updatedCollection);

  // 7. Summary
  console.log("\n📊 Summary");
  console.log("==========");
  console.log(`   Total POST endpoints: ${postEndpoints.length}`);
  console.log(`   Tests added: ${testsAdded}`);
  console.log(`   Backup created: ${backupPath}`);
  console.log(`   Collection updated: ${COLLECTION_PATH}`);

  console.log("\n✅ Test generation complete!");
  console.log("\n📝 Next steps:");
  console.log("   1. Review generated tests in comprehensive.json");
  console.log("   2. Run Newman locally: npm run test:api");
  console.log("   3. Verify tests pass with both real and mock APIs");
}

// ─── Run ───────────────────────────────────────────────────────────────────────

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    Deno.exit(1);
  }
}
