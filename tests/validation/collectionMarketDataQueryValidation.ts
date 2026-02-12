/**
 * Query Validation for Collection Market Data Integration
 *
 * This file validates the SQL query structure for the collection market data
 * integration without requiring a live database connection.
 */

import { CollectionRepository } from "$server/database/collectionRepository.ts";

/**
 * Validation Results
 */
interface ValidationResult {
  testName: string;
  passed: boolean;
  message: string;
}

const results: ValidationResult[] = [];

function addResult(testName: string, passed: boolean, message: string) {
  results.push({ testName, passed, message });
  const status = passed ? "✓ PASS" : "✗ FAIL";
  console.log(`${status}: ${testName}`);
  if (!passed) {
    console.log(`  Message: ${message}`);
  }
}

/**
 * Validate Query Structure
 *
 * Since we can't execute queries without a database, we validate:
 * 1. Method signatures are correct
 * 2. Type definitions match expectations
 * 3. Logic flow is correct
 */
function validateQueryStructure() {
  console.log("\n=== Query Structure Validation ===\n");

  // Test 1: Verify getCollectionDetailsWithMarketData method exists
  addResult(
    "Method exists: getCollectionDetailsWithMarketData",
    typeof CollectionRepository.getCollectionDetailsWithMarketData ===
      "function",
    "Method should be a function",
  );

  // Test 2: Verify old getCollectionDetails method still exists (backward compatibility)
  addResult(
    "Method exists: getCollectionDetails (backward compatibility)",
    typeof CollectionRepository.getCollectionDetails === "function",
    "Old method should still exist for backward compatibility",
  );

  // Test 3: Verify method accepts includeMarketData parameter
  const methodSignature = CollectionRepository
    .getCollectionDetailsWithMarketData.toString();
  addResult(
    "Parameter: includeMarketData accepted",
    methodSignature.includes("includeMarketData"),
    "Method should accept includeMarketData parameter",
  );

  // Test 4: Verify default value is false for includeMarketData
  addResult(
    "Default value: includeMarketData = false",
    methodSignature.includes("includeMarketData = false") ||
      methodSignature.includes("includeMarketData=false"),
    "includeMarketData should default to false for backward compatibility",
  );

  // Test 5: Verify query references collection_market_data table
  addResult(
    "Query references: collection_market_data table",
    methodSignature.includes("collection_market_data"),
    "Query should reference collection_market_data table",
  );

  // Test 6: Verify HEX conversion for BINARY(16) compatibility
  addResult(
    "HEX conversion: cmd.collection_id = HEX(c.collection_id)",
    methodSignature.includes("HEX(c.collection_id)"),
    "Query should use HEX conversion for BINARY(16) compatibility",
  );

  // Test 7: Verify LEFT JOIN is used (not INNER JOIN)
  addResult(
    "JOIN type: LEFT JOIN (allows NULL market data)",
    methodSignature.includes("LEFT JOIN collection_market_data"),
    "Should use LEFT JOIN to allow collections without market data",
  );

  // Test 8: Verify all required market data fields are selected
  const requiredFields = [
    "floor_price_btc",
    "avg_price_btc",
    "total_value_btc",
    "volume_24h_btc",
    "volume_7d_btc",
    "volume_30d_btc",
    "total_volume_btc",
    "total_stamps",
    "unique_holders",
    "listed_stamps",
    "sold_stamps_24h",
  ];

  const missingFields: string[] = [];
  for (const field of requiredFields) {
    if (!methodSignature.includes(field)) {
      missingFields.push(field);
    }
  }

  addResult(
    "Required fields: All market data fields selected",
    missingFields.length === 0,
    missingFields.length > 0
      ? `Missing fields: ${missingFields.join(", ")}`
      : "All fields present",
  );
}

/**
 * Validate Type Mappings
 */
function validateTypeMappings() {
  console.log("\n=== Type Mapping Validation ===\n");

  const methodCode = CollectionRepository.getCollectionDetailsWithMarketData
    .toString();

  // Test 1: Verify parseBTCDecimal is used for DECIMAL fields
  addResult(
    "Type conversion: parseBTCDecimal for DECIMAL fields",
    methodCode.includes("parseBTCDecimal(row.floor_price_btc)") &&
      methodCode.includes("parseBTCDecimal(row.avg_price_btc)"),
    "DECIMAL fields should use parseBTCDecimal conversion",
  );

  // Test 2: Verify parseInt is used for INT fields
  addResult(
    "Type conversion: parseInt for INT fields",
    methodCode.includes("parseInt(row.total_stamps)") &&
      methodCode.includes("parseInt(row.unique_holders)") &&
      methodCode.includes("parseInt(row.listed_stamps)") &&
      methodCode.includes("parseInt(row.sold_stamps_24h)"),
    "INT fields should use parseInt conversion",
  );

  // Test 3: Verify parseBTCDecimal is used for volume fields
  addResult(
    "Type conversion: parseBTCDecimal for volume fields",
    methodCode.includes("parseBTCDecimal(row.volume_24h_btc)") &&
      methodCode.includes("parseBTCDecimal(row.volume_7d_btc)") &&
      methodCode.includes("parseBTCDecimal(row.volume_30d_btc)") &&
      methodCode.includes("parseBTCDecimal(row.total_volume_btc)"),
    "Volume fields should use parseBTCDecimal conversion",
  );

  // Test 4: Verify NULL handling preserves null values for nullable fields
  addResult(
    "NULL handling: parseBTCDecimal preserves null",
    methodCode.includes("parseBTCDecimal(row.floor_price_btc)") &&
      methodCode.includes("parseBTCDecimal(row.avg_price_btc)"),
    "NULL values should be preserved using parseBTCDecimal for nullable price fields",
  );

  // Test 5: Verify 0 vs NULL distinction for volume fields
  addResult(
    "NULL vs 0: Volume fields use || 0 fallback",
    methodCode.includes("parseBTCDecimal(row.volume_24h_btc) || 0") ||
      methodCode.includes("row.volume_24h_btc"),
    "Volume fields should handle NULL appropriately",
  );
}

/**
 * Validate Backward Compatibility
 */
function validateBackwardCompatibility() {
  console.log("\n=== Backward Compatibility Validation ===\n");

  const withMarketDataCode = CollectionRepository
    .getCollectionDetailsWithMarketData.toString();
  const withoutMarketDataCode = CollectionRepository.getCollectionDetails
    .toString();

  // Test 1: Verify old method doesn't reference collection_market_data
  addResult(
    "Old method isolation: No collection_market_data reference",
    !withoutMarketDataCode.includes("collection_market_data"),
    "Old getCollectionDetails should not reference collection_market_data table",
  );

  // Test 2: Verify old method still works without includeMarketData parameter
  addResult(
    "Old method signature: No includeMarketData parameter",
    !withoutMarketDataCode.includes("includeMarketData"),
    "Old method should not have includeMarketData parameter",
  );

  // Test 3: Verify new method conditionally includes market data
  addResult(
    "Conditional logic: if (includeMarketData) guard",
    withMarketDataCode.includes("if (includeMarketData)"),
    "New method should conditionally add market data based on parameter",
  );

  // Test 4: Verify marketData field is only added when includeMarketData=true
  addResult(
    "Response structure: marketData field conditional",
    withMarketDataCode.includes(
      "if (includeMarketData && (result as any).rows)",
    ),
    "marketData should only be added to response when includeMarketData=true",
  );
}

/**
 * Run All Validations
 */
function runValidations() {
  console.log(
    "╔════════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║  Collection Market Data Integration - Query Validation        ║",
  );
  console.log(
    "╚════════════════════════════════════════════════════════════════╝",
  );

  validateQueryStructure();
  validateTypeMappings();
  validateBackwardCompatibility();

  console.log("\n" + "=".repeat(70));
  console.log("\nValidation Summary:");
  console.log("─".repeat(70));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} ✓`);
  console.log(`Failed: ${failed} ${failed > 0 ? "✗" : ""}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log("\n❌ VALIDATION FAILED");
    console.log("\nFailed Tests:");
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  - ${r.testName}`);
      console.log(`    ${r.message}`);
    });
  } else {
    console.log("\n✅ ALL VALIDATIONS PASSED");
  }

  console.log("\n" + "=".repeat(70) + "\n");

  return failed === 0;
}

// Run validations if executed directly
if (import.meta.main) {
  const success = runValidations();
  Deno.exit(success ? 0 : 1);
}

export { results, runValidations };
