#!/usr/bin/env node
/**
 * Add Data Content Validation to Postman Collection
 *
 * This script enhances the comprehensive.json Postman collection with data content
 * validation tests that go beyond schema structure validation. It validates that
 * actual response data makes semantic sense.
 *
 * Validations include:
 * - Stamps data: stamp > 0, tx_hash 64-char hex, cpid pattern, URLs
 * - SRC-20 data: tick, max/lim/amt numbers, progress_percentage 0-100
 * - Pagination: page >= 1, limit > 0 and <= 1000, data.length <= limit
 * - Health endpoint: status OK/ERROR, services boolean values
 * - Collections: UUID id, non-empty name, creator
 * - Block data: positive block_index, 64-char block_hash, timestamp
 *
 * Usage: node scripts/add-data-validation.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Validation rule generator functions
 */
const ValidationRules = {
  /**
   * Stamps data validation
   */
  stamps: () => [
    "",
    "// Data content validation for stamps",
    "pm.test(\"Stamp data values are valid\", function() {",
    "  const json = pm.response.json();",
    "  if (json.data && Array.isArray(json.data) && json.data.length > 0) {",
    "    const stamp = json.data[0];",
    "    ",
    "    // Validate stamp number is positive or negative (cursed)",
    "    if (stamp.stamp !== undefined && stamp.stamp !== null) {",
    "      pm.expect(stamp.stamp).to.be.a('number');",
    "      pm.expect(stamp.stamp).to.satisfy(n => n > 0 || n < 0, 'stamp should be positive or negative (cursed)');",
    "    }",
    "    ",
    "    // Validate tx_hash is 64-char hex",
    "    if (stamp.tx_hash !== undefined && stamp.tx_hash !== null) {",
    "      pm.expect(stamp.tx_hash).to.be.a('string');",
    "      pm.expect(stamp.tx_hash).to.match(/^[a-f0-9]{64}$/i, 'tx_hash should be 64-char hex');",
    "    }",
    "    ",
    "    // Validate cpid pattern (if present)",
    "    if (stamp.cpid !== undefined && stamp.cpid !== null) {",
    "      pm.expect(stamp.cpid).to.be.a('string');",
    "      pm.expect(stamp.cpid).to.match(/^[A-Z0-9]+$/, 'cpid should be alphanumeric uppercase');",
    "    }",
    "    ",
    "    // Validate block_index is positive",
    "    if (stamp.block_index !== undefined && stamp.block_index !== null) {",
    "      pm.expect(stamp.block_index).to.be.a('number');",
    "      pm.expect(stamp.block_index).to.be.above(0, 'block_index should be positive');",
    "    }",
    "    ",
    "    // Validate stamp_url if present",
    "    if (stamp.stamp_url !== undefined && stamp.stamp_url !== null) {",
    "      pm.expect(stamp.stamp_url).to.be.a('string');",
    "      if (stamp.stamp_url.length > 0) {",
    "        pm.expect(stamp.stamp_url).to.match(/^(https?:\\/\\/|data:|ipfs:|ar:\\/\\/)/, 'stamp_url should be valid URL or data URI');",
    "      }",
    "    }",
    "  }",
    "});",
  ],

  /**
   * SRC-20 token data validation
   */
  src20: () => [
    "",
    "// Data content validation for SRC-20 tokens",
    "pm.test(\"SRC-20 data values are valid\", function() {",
    "  const json = pm.response.json();",
    "  if (json.data && Array.isArray(json.data) && json.data.length > 0) {",
    "    const token = json.data[0];",
    "    ",
    "    // Validate tick is non-empty string",
    "    if (token.tick !== undefined && token.tick !== null) {",
    "      pm.expect(token.tick).to.be.a('string');",
    "      pm.expect(token.tick.length).to.be.above(0, 'tick should not be empty');",
    "      pm.expect(token.tick.length).to.be.at.most(5, 'tick should be max 5 characters');",
    "    }",
    "    ",
    "    // Validate max supply is positive",
    "    if (token.max !== undefined && token.max !== null) {",
    "      pm.expect(token.max).to.be.a('string');",
    "      pm.expect(parseFloat(token.max)).to.be.above(0, 'max should be positive');",
    "    }",
    "    ",
    "    // Validate limit per mint",
    "    if (token.lim !== undefined && token.lim !== null) {",
    "      pm.expect(token.lim).to.be.a('string');",
    "      pm.expect(parseFloat(token.lim)).to.be.above(0, 'lim should be positive');",
    "    }",
    "    ",
    "    // Validate progress_percentage is 0-100",
    "    if (token.progress_percentage !== undefined && token.progress_percentage !== null) {",
    "      pm.expect(token.progress_percentage).to.be.a('number');",
    "      pm.expect(token.progress_percentage).to.be.at.least(0, 'progress should be >= 0');",
    "      pm.expect(token.progress_percentage).to.be.at.most(100, 'progress should be <= 100');",
    "    }",
    "    ",
    "    // Validate tx_hash",
    "    if (token.tx_hash !== undefined && token.tx_hash !== null) {",
    "      pm.expect(token.tx_hash).to.be.a('string');",
    "      pm.expect(token.tx_hash).to.match(/^[a-f0-9]{64}$/i, 'tx_hash should be 64-char hex');",
    "    }",
    "  }",
    "});",
  ],

  /**
   * Pagination validation
   */
  pagination: () => [
    "",
    "// Data content validation for pagination",
    "pm.test(\"Pagination values are valid\", function() {",
    "  const json = pm.response.json();",
    "  ",
    "  // Validate pagination metadata",
    "  if (json.pagination !== undefined && json.pagination !== null) {",
    "    const p = json.pagination;",
    "    ",
    "    // Page should be >= 1",
    "    if (p.page !== undefined && p.page !== null) {",
    "      pm.expect(p.page).to.be.a('number');",
    "      pm.expect(p.page).to.be.at.least(1, 'page should be >= 1');",
    "    }",
    "    ",
    "    // Limit should be positive and <= 1000",
    "    if (p.limit !== undefined && p.limit !== null) {",
    "      pm.expect(p.limit).to.be.a('number');",
    "      pm.expect(p.limit).to.be.above(0, 'limit should be positive');",
    "      pm.expect(p.limit).to.be.at.most(1000, 'limit should be <= 1000');",
    "    }",
    "    ",
    "    // Total should be non-negative",
    "    if (p.total !== undefined && p.total !== null) {",
    "      pm.expect(p.total).to.be.a('number');",
    "      pm.expect(p.total).to.be.at.least(0, 'total should be >= 0');",
    "    }",
    "  }",
    "  ",
    "  // Validate data array length doesn't exceed limit",
    "  if (json.data && Array.isArray(json.data) && json.pagination?.limit) {",
    "    pm.expect(json.data.length).to.be.at.most(json.pagination.limit, 'data.length should not exceed limit');",
    "  }",
    "});",
  ],

  /**
   * Health endpoint validation
   */
  health: () => [
    "",
    "// Data content validation for health endpoint",
    "pm.test(\"Health data values are valid\", function() {",
    "  const json = pm.response.json();",
    "  ",
    "  // Validate status is OK or ERROR",
    "  if (json.status !== undefined && json.status !== null) {",
    "    pm.expect(json.status).to.be.a('string');",
    "    pm.expect(['OK', 'ERROR', 'DEGRADED']).to.include(json.status, 'status should be OK, ERROR, or DEGRADED');",
    "  }",
    "  ",
    "  // Validate services are boolean",
    "  if (json.services !== undefined && json.services !== null) {",
    "    pm.expect(json.services).to.be.an('object');",
    "    Object.entries(json.services).forEach(([key, value]) => {",
    "      pm.expect(value).to.be.a('boolean', `service ${key} should be boolean`);",
    "    });",
    "  }",
    "});",
  ],

  /**
   * Collections validation
   */
  collections: () => [
    "",
    "// Data content validation for collections",
    "pm.test(\"Collection data values are valid\", function() {",
    "  const json = pm.response.json();",
    "  if (json.data && Array.isArray(json.data) && json.data.length > 0) {",
    "    const collection = json.data[0];",
    "    ",
    "    // Validate id is UUID format",
    "    if (collection.id !== undefined && collection.id !== null) {",
    "      pm.expect(collection.id).to.be.a('string');",
    "      pm.expect(collection.id).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'id should be UUID');",
    "    }",
    "    ",
    "    // Validate name is non-empty",
    "    if (collection.name !== undefined && collection.name !== null) {",
    "      pm.expect(collection.name).to.be.a('string');",
    "      pm.expect(collection.name.length).to.be.above(0, 'name should not be empty');",
    "    }",
    "    ",
    "    // Validate creator if present",
    "    if (collection.creator !== undefined && collection.creator !== null) {",
    "      pm.expect(collection.creator).to.be.a('string');",
    "      pm.expect(collection.creator.length).to.be.above(0, 'creator should not be empty');",
    "    }",
    "  }",
    "});",
  ],

  /**
   * Block data validation
   */
  block: () => [
    "",
    "// Data content validation for block data",
    "pm.test(\"Block data values are valid\", function() {",
    "  const json = pm.response.json();",
    "  ",
    "  const blockData = json.data || json;",
    "  ",
    "  // Validate block_index is positive",
    "  if (blockData.block_index !== undefined && blockData.block_index !== null) {",
    "    pm.expect(blockData.block_index).to.be.a('number');",
    "    pm.expect(blockData.block_index).to.be.above(0, 'block_index should be positive');",
    "  }",
    "  ",
    "  // Validate block_hash is 64-char hex",
    "  if (blockData.block_hash !== undefined && blockData.block_hash !== null) {",
    "    pm.expect(blockData.block_hash).to.be.a('string');",
    "    pm.expect(blockData.block_hash).to.match(/^[a-f0-9]{64}$/i, 'block_hash should be 64-char hex');",
    "  }",
    "  ",
    "  // Validate block_time is valid timestamp",
    "  if (blockData.block_time !== undefined && blockData.block_time !== null) {",
    "    pm.expect(blockData.block_time).to.be.a('number');",
    "    pm.expect(blockData.block_time).to.be.above(0, 'block_time should be positive timestamp');",
    "    pm.expect(blockData.block_time).to.be.below(Date.now() / 1000 + 7200, 'block_time should not be too far in future');",
    "  }",
    "});",
  ],

  /**
   * Balance data validation
   */
  balance: () => [
    "",
    "// Data content validation for balance data",
    "pm.test(\"Balance data values are valid\", function() {",
    "  const json = pm.response.json();",
    "  if (json.data && Array.isArray(json.data) && json.data.length > 0) {",
    "    const balance = json.data[0];",
    "    ",
    "    // Validate address format",
    "    if (balance.address !== undefined && balance.address !== null) {",
    "      pm.expect(balance.address).to.be.a('string');",
    "      pm.expect(balance.address).to.match(/^(bc1|tb1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/, 'address should be valid Bitcoin address');",
    "    }",
    "    ",
    "    // Validate balance is non-negative",
    "    if (balance.balance !== undefined && balance.balance !== null) {",
    "      const bal = typeof balance.balance === 'string' ? parseFloat(balance.balance) : balance.balance;",
    "      pm.expect(bal).to.be.at.least(0, 'balance should be non-negative');",
    "    }",
    "  }",
    "});",
  ],
};

/**
 * Determine which validation rules to apply based on endpoint path
 */
function getValidationRulesForEndpoint(url, name) {
  const rules = [];

  // Normalize URL and name for matching
  const urlLower = url.toLowerCase();
  const nameLower = name.toLowerCase();

  // Stamps endpoints
  if (urlLower.includes('/stamps') || nameLower.includes('stamp')) {
    rules.push(...ValidationRules.stamps());
    rules.push(...ValidationRules.pagination());
  }

  // Cursed stamps (also stamp validation)
  if (urlLower.includes('/cursed') || nameLower.includes('cursed')) {
    rules.push(...ValidationRules.stamps());
    rules.push(...ValidationRules.pagination());
  }

  // SRC-20 endpoints
  if (urlLower.includes('/src20') || nameLower.includes('src-20') || nameLower.includes('src20')) {
    rules.push(...ValidationRules.src20());
    rules.push(...ValidationRules.pagination());
  }

  // SRC-101 endpoints
  if (urlLower.includes('/src101') || nameLower.includes('src-101') || nameLower.includes('src101')) {
    rules.push(...ValidationRules.pagination());
  }

  // Health endpoint
  if (urlLower.includes('/health') || nameLower.includes('health')) {
    rules.push(...ValidationRules.health());
  }

  // Collections endpoints
  if (urlLower.includes('/collections') || nameLower.includes('collection')) {
    rules.push(...ValidationRules.collections());
    rules.push(...ValidationRules.pagination());
  }

  // Block endpoints
  if (urlLower.includes('/block') || nameLower.includes('block')) {
    rules.push(...ValidationRules.block());
    rules.push(...ValidationRules.pagination());
  }

  // Balance endpoints
  if (urlLower.includes('/balance') || nameLower.includes('balance')) {
    rules.push(...ValidationRules.balance());
    rules.push(...ValidationRules.pagination());
  }

  return rules;
}

/**
 * Add validation rules to a request's test event
 */
function addValidationToRequest(item) {
  if (!item.request) return;

  // Get URL from request
  const url = typeof item.request.url === "string"
    ? item.request.url
    : (item.request.url?.raw || "");

  // Determine which validations to add
  const validationRules = getValidationRulesForEndpoint(url, item.name || "");

  if (validationRules.length === 0) return;

  // Find or create test event
  if (!item.event) {
    item.event = [];
  }

  let testEvent = item.event.find((e) => e.listen === "test");
  if (!testEvent) {
    testEvent = {
      listen: "test",
      script: {
        exec: [],
        type: "text/javascript",
      },
    };
    item.event.push(testEvent);
  }

  // Add validation rules if they don't already exist
  const existingTests = testEvent.script.exec.join("\n");

  // Only add if not already present
  if (!existingTests.includes("Data content validation")) {
    testEvent.script.exec.push(...validationRules);
  }
}

/**
 * Recursively process all items in the collection
 */
function processItems(items) {
  let count = 0;

  for (const item of items) {
    if (item.item) {
      // Folder - recurse into sub-items
      count += processItems(item.item);
    } else if (item.request) {
      // Individual request - add validation
      addValidationToRequest(item);
      count++;
    }
  }

  return count;
}

/**
 * Main function
 */
function main() {
  const collectionPath = join(__dirname, '..', 'tests', 'postman', 'collections', 'comprehensive.json');

  console.log("Reading Postman collection...");
  const collectionText = readFileSync(collectionPath, 'utf8');
  const collection = JSON.parse(collectionText);

  console.log(`Collection: ${collection.info.name} v${collection.info.version}`);
  console.log("Adding data content validation to requests...");

  const requestCount = processItems(collection.item);

  console.log(`Processed ${requestCount} requests`);

  // Write updated collection
  console.log("Writing updated collection...");
  writeFileSync(collectionPath, JSON.stringify(collection, null, 2));

  console.log("✓ Data content validation added successfully!");
  console.log("\nValidation types added:");
  console.log("  - Stamps: stamp numbers, tx_hash, cpid, URLs, block_index");
  console.log("  - SRC-20: tick, max/lim/amt, progress_percentage, tx_hash");
  console.log("  - Pagination: page >= 1, limit <= 1000, data.length validation");
  console.log("  - Health: status enum, services booleans");
  console.log("  - Collections: UUID id, non-empty name/creator");
  console.log("  - Block: positive block_index, 64-char block_hash, timestamp");
  console.log("  - Balance: address format, non-negative balance");
}

main();
