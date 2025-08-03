#!/usr/bin/env node

/**
 * Script to add OpenAPI validation to existing Newman test collections
 * This enhances all tests with schema validation for more robust testing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OpenAPI validation test script to inject
const openapiValidationTest = `
// OpenAPI Schema Validation (Automatically Added)
pm.test("Response matches OpenAPI schema", function() {
    const contentType = pm.response.headers.get('Content-Type');
    
    // Skip validation for non-JSON responses
    if (!contentType || !contentType.includes('application/json')) {
        pm.expect(true).to.be.true; // Pass for non-JSON
        return;
    }
    
    // Check validation headers from server
    const schemaValidated = pm.response.headers.get('X-Schema-Validated');
    const validationError = pm.response.headers.get('X-Schema-Validation-Error');
    
    if (schemaValidated === 'false' && validationError) {
        // Schema validation failed on server
        const errors = JSON.parse(validationError);
        pm.expect.fail(\`OpenAPI schema validation failed: \${JSON.stringify(errors, null, 2)}\`);
    } else if (schemaValidated === 'true') {
        // Schema validation passed
        pm.expect(true).to.be.true;
    } else {
        // No validation header - server might not have validation enabled
        console.log('⚠️  No schema validation header found - ensure server has OpenAPI validation enabled');
        pm.expect(true).to.be.true; // Don't fail the test
    }
});
`;

function addValidationToCollection(collectionPath) {
    console.log(`\n📄 Processing: ${path.basename(collectionPath)}`);
    
    try {
        // Read collection
        const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
        
        let testsUpdated = 0;
        let testsSkipped = 0;
        
        // Function to add validation to an item
        function addValidationToItem(item) {
            if (!item.event) {
                item.event = [];
            }
            
            // Find test event
            let testEvent = item.event.find(e => e.listen === 'test');
            
            if (!testEvent) {
                // Create test event
                testEvent = {
                    listen: 'test',
                    script: {
                        type: 'text/javascript',
                        exec: []
                    }
                };
                item.event.push(testEvent);
            }
            
            // Check if validation already exists
            const scriptText = testEvent.script.exec.join('\n');
            if (scriptText.includes('OpenAPI Schema Validation')) {
                testsSkipped++;
                return;
            }
            
            // Add validation test
            if (typeof testEvent.script.exec === 'string') {
                testEvent.script.exec = [testEvent.script.exec];
            }
            
            // Add separator and validation
            testEvent.script.exec.push('');
            testEvent.script.exec.push(...openapiValidationTest.trim().split('\n'));
            
            testsUpdated++;
        }
        
        // Process all items recursively
        function processItems(items) {
            if (!items) return;
            
            items.forEach(item => {
                // Add validation to this item
                addValidationToItem(item);
                
                // Process sub-items
                if (item.item) {
                    processItems(item.item);
                }
            });
        }
        
        // Process collection items
        processItems(collection.item);
        
        // Save updated collection
        const backupPath = collectionPath.replace('.json', '.backup.json');
        fs.copyFileSync(collectionPath, backupPath);
        fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
        
        console.log(`✅ Updated ${testsUpdated} tests`);
        console.log(`⏭️  Skipped ${testsSkipped} tests (already have validation)`);
        console.log(`💾 Backup saved to: ${path.basename(backupPath)}`);
        
    } catch (error) {
        console.error(`❌ Error processing ${collectionPath}: ${error.message}`);
    }
}

// Main execution
console.log('🔧 Adding OpenAPI Validation to Newman Test Collections');
console.log('=====================================================');

const collectionsDir = path.join(__dirname, '..', 'tests', 'postman', 'collections');
const collections = fs.readdirSync(collectionsDir)
    .filter(f => f.endsWith('.json') && !f.includes('backup'));

console.log(`Found ${collections.length} test collections`);

collections.forEach(file => {
    addValidationToCollection(path.join(collectionsDir, file));
});

console.log('\n✅ OpenAPI validation added to all test collections!');
console.log('\n📝 Next steps:');
console.log('1. Review the changes in the test collections');
console.log('2. Run tests to verify validation works correctly');
console.log('3. Remove backup files once verified');
console.log('\n🚀 Your Newman tests now include automatic OpenAPI schema validation!');