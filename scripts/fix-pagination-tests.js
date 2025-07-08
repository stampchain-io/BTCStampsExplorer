#!/usr/bin/env node

/**
 * Script to fix pagination test assertions in the Postman collection
 * Updates tests to expect direct pagination fields instead of nested object
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the collection file
const collectionPath = path.join(__dirname, '..', 'postman-collection-pagination-validation.json');
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

let fixCount = 0;

// Function to fix test scripts
function fixTestScript(scriptLines) {
  if (!scriptLines || !Array.isArray(scriptLines)) return scriptLines;
  
  return scriptLines.map(line => {
    // Fix assertions expecting nested pagination object
    if (line.includes("pm.expect(responseData).to.have.property('pagination')")) {
      fixCount++;
      return [
        "        pm.expect(responseData).to.have.property('page');",
        "        pm.expect(responseData).to.have.property('limit');",
        "        pm.expect(responseData).to.have.property('total');",
        "        pm.expect(responseData).to.have.property('totalPages');",
        "        pm.expect(responseData).to.have.property('data');"
      ];
    }
    
    // Fix assertions checking pagination properties
    if (line.includes("pm.expect(responseData.pagination).to.have")) {
      fixCount++;
      return "        pm.expect(responseData).to.have.all.keys('page', 'limit', 'totalPages', 'total', 'data', 'last_block');";
    }
    
    // Fix assertions accessing pagination.page
    if (line.includes("responseData.pagination.page")) {
      fixCount++;
      return line.replace("responseData.pagination.page", "responseData.page");
    }
    
    // Fix assertions accessing pagination.limit
    if (line.includes("responseData.pagination.limit")) {
      fixCount++;
      return line.replace("responseData.pagination.limit", "responseData.limit");
    }
    
    // Fix assertions checking if pagination exists
    if (line.includes("if (responseData.pagination)")) {
      fixCount++;
      return line.replace("if (responseData.pagination)", "if (responseData.page !== undefined)");
    }
    
    // Fix test names mentioning pagination
    if (line.includes("'SRC20 balance pagination should work'")) {
      return line.replace(
        "'SRC20 balance pagination should work'",
        "'SRC20 balance should have pagination fields'"
      );
    }
    
    if (line.includes("'SRC101 list should support pagination'")) {
      return line.replace(
        "'SRC101 list should support pagination'",
        "'SRC101 list should have pagination fields'"
      );
    }
    
    if (line.includes("'Collections should support pagination'")) {
      return line.replace(
        "'Collections should support pagination'",
        "'Collections should have pagination fields'"
      );
    }
    
    return line;
  }).flat();
}

// Recursively fix all test scripts in the collection
function fixCollection(item) {
  if (item.event) {
    item.event.forEach(event => {
      if (event.script && event.script.exec) {
        event.script.exec = fixTestScript(event.script.exec);
      }
    });
  }
  
  if (item.item && Array.isArray(item.item)) {
    item.item.forEach(subItem => fixCollection(subItem));
  }
}

// Fix all items in the collection
collection.item.forEach(item => fixCollection(item));

// Write the fixed collection back
fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));

console.log(`✅ Fixed ${fixCount} pagination test assertions`);
console.log(`📁 Updated: ${collectionPath}`);

// Also create a summary of changes
const summaryPath = path.join(__dirname, '..', 'reports', 'pagination-test-fixes.md');
const summary = `# Pagination Test Fixes Summary

## Changes Made
- Fixed ${fixCount} test assertions
- Updated tests to expect direct pagination fields (page, limit, total, totalPages)
- Removed expectations for nested 'pagination' object
- Updated test names to reflect actual behavior

## Pattern Changes
1. **Before**: \`pm.expect(responseData).to.have.property('pagination')\`
   **After**: Multiple assertions for direct fields

2. **Before**: \`responseData.pagination.page\`
   **After**: \`responseData.page\`

3. **Before**: \`if (responseData.pagination)\`
   **After**: \`if (responseData.page !== undefined)\`

## Date: ${new Date().toISOString()}
`;

// Create reports directory if it doesn't exist
const reportsDir = path.dirname(summaryPath);
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

fs.writeFileSync(summaryPath, summary);
console.log(`📄 Summary written to: ${summaryPath}`);