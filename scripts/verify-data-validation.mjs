#!/usr/bin/env node
/**
 * Verify Data Content Validation in Postman Collection
 *
 * This script verifies that data content validation tests have been
 * successfully added to the comprehensive Postman collection.
 *
 * Usage: node scripts/verify-data-validation.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Validation keywords to search for
 */
const VALIDATION_KEYWORDS = {
  stamps: 'Stamp data values are valid',
  src20: 'SRC-20 data values are valid',
  pagination: 'Pagination values are valid',
  health: 'Health data values are valid',
  collections: 'Collection data values are valid',
  block: 'Block data values are valid',
  balance: 'Balance data values are valid',
};

/**
 * Count validations in a request
 */
function countValidations(item) {
  if (!item.event) return {};

  const testEvent = item.event.find(e => e.listen === 'test');
  if (!testEvent) return {};

  const testScript = testEvent.script.exec.join('\n');

  const validations = {};
  for (const [type, keyword] of Object.entries(VALIDATION_KEYWORDS)) {
    if (testScript.includes(keyword)) {
      validations[type] = true;
    }
  }

  return validations;
}

/**
 * Recursively process items
 */
function processItems(items, stats, depth = 0) {
  for (const item of items) {
    if (item.item) {
      // Folder
      processItems(item.item, stats, depth + 1);
    } else if (item.request) {
      // Individual request
      stats.totalRequests++;

      const validations = countValidations(item);
      const validationCount = Object.keys(validations).length;

      if (validationCount > 0) {
        stats.requestsWithValidation++;

        for (const type of Object.keys(validations)) {
          stats.validationTypes[type] = (stats.validationTypes[type] || 0) + 1;
        }

        if (validationCount > stats.maxValidationsPerRequest) {
          stats.maxValidationsPerRequest = validationCount;
          stats.mostValidatedRequest = item.name;
        }
      }

      // Track endpoints by category
      const url = typeof item.request.url === 'string'
        ? item.request.url
        : (item.request.url?.raw || '');

      if (url.includes('/stamps')) {
        stats.endpointCategories.stamps++;
      } else if (url.includes('/src20')) {
        stats.endpointCategories.src20++;
      } else if (url.includes('/src101')) {
        stats.endpointCategories.src101++;
      } else if (url.includes('/block')) {
        stats.endpointCategories.block++;
      } else if (url.includes('/balance')) {
        stats.endpointCategories.balance++;
      } else if (url.includes('/collections')) {
        stats.endpointCategories.collections++;
      } else if (url.includes('/health')) {
        stats.endpointCategories.health++;
      }
    }
  }
}

/**
 * Main function
 */
function main() {
  const collectionPath = join(__dirname, '..', 'tests', 'postman', 'collections', 'comprehensive.json');

  console.log('📊 Verifying Data Content Validation in Postman Collection\n');

  const collectionText = readFileSync(collectionPath, 'utf8');
  const collection = JSON.parse(collectionText);

  const stats = {
    totalRequests: 0,
    requestsWithValidation: 0,
    validationTypes: {},
    maxValidationsPerRequest: 0,
    mostValidatedRequest: '',
    endpointCategories: {
      stamps: 0,
      src20: 0,
      src101: 0,
      block: 0,
      balance: 0,
      collections: 0,
      health: 0,
    },
  };

  processItems(collection.item, stats);

  // Print summary
  console.log(`Collection: ${collection.info.name}`);
  console.log(`Version: ${collection.info.version}\n`);

  console.log('📈 Validation Coverage:');
  console.log(`  Total Requests: ${stats.totalRequests}`);
  console.log(`  Requests with Validation: ${stats.requestsWithValidation}`);
  console.log(`  Coverage: ${((stats.requestsWithValidation / stats.totalRequests) * 100).toFixed(1)}%\n`);

  console.log('🔍 Validation Types Applied:');
  for (const [type, count] of Object.entries(stats.validationTypes)) {
    console.log(`  ${type.padEnd(15)} ${count.toString().padStart(3)} requests`);
  }
  console.log();

  console.log('📁 Endpoint Categories:');
  for (const [category, count] of Object.entries(stats.endpointCategories)) {
    if (count > 0) {
      console.log(`  ${category.padEnd(15)} ${count.toString().padStart(3)} requests`);
    }
  }
  console.log();

  console.log('🏆 Most Validated Request:');
  console.log(`  ${stats.mostValidatedRequest}`);
  console.log(`  ${stats.maxValidationsPerRequest} validation types applied\n`);

  // Success criteria
  const success = stats.requestsWithValidation >= 100 &&
                  Object.keys(stats.validationTypes).length >= 5;

  if (success) {
    console.log('✅ Validation verification PASSED');
    console.log('   All required validations have been added successfully.\n');
    return 0;
  } else {
    console.log('❌ Validation verification FAILED');
    console.log('   Some validations may be missing.\n');
    return 1;
  }
}

const exitCode = main();
process.exit(exitCode);
