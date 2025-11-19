#!/usr/bin/env node

/**
 * merge-src101-tests.js
 * 
 * Extracts SRC-101 test folder from postman-collection.json 
 * and merges it into tests/postman/collections/comprehensive.json
 */

const fs = require('fs');
const path = require('path');

function main() {
  try {
    console.log('🔍 Loading Newman collections...');
    
    // Load source collection (contains SRC-101 tests)
    const sourceCollection = JSON.parse(
      fs.readFileSync('postman-collection.json', 'utf8')
    );
    
    // Load target collection (comprehensive regression)
    const targetCollection = JSON.parse(
      fs.readFileSync('tests/postman/collections/comprehensive.json', 'utf8')
    );
    
    console.log(`📊 Source collection has ${sourceCollection.item.length} folders`);
    console.log(`📊 Target collection has ${targetCollection.item.length} folders`);
    
    // Find SRC-101 folder in source collection (nested in api/v2)
    let src101Folder = null;
    
    // Check if it's at top level
    src101Folder = sourceCollection.item.find(
      item => item.name && item.name.toLowerCase() === 'src101'
    );
    
    // If not found, check nested structure (api/v2/src101)
    if (!src101Folder) {
      const apiFolder = sourceCollection.item.find(item => item.name === 'api');
      if (apiFolder && apiFolder.item) {
        const v2Folder = apiFolder.item.find(item => item.name === 'v2');
        if (v2Folder && v2Folder.item) {
          src101Folder = v2Folder.item.find(
            item => item.name && item.name.toLowerCase() === 'src101'
          );
        }
      }
    }
    
    if (!src101Folder) {
      console.error('❌ SRC-101 folder not found in source collection');
      console.log('📋 Available folders:');
      console.log('Top level:', sourceCollection.item.map(i => i.name));
      const apiFolder = sourceCollection.item.find(item => item.name === 'api');
      if (apiFolder?.item) {
        const v2Folder = apiFolder.item.find(item => item.name === 'v2');
        if (v2Folder?.item) {
          console.log('api/v2 level:', v2Folder.item.map(i => i.name));
        }
      }
      process.exit(1);
    }
    
    console.log(`✅ Found SRC-101 folder with ${src101Folder.item?.length || 0} tests`);
    
    // List all SRC-101 test names
    if (src101Folder.item) {
      console.log('📋 SRC-101 tests to merge:');
      src101Folder.item.forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.name}`);
      });
    }
    
    // Check if SRC-101 already exists in target
    const existingSrc101Index = targetCollection.item.findIndex(
      item => item.name && item.name.toLowerCase() === 'src101'
    );
    
    if (existingSrc101Index !== -1) {
      console.log('⚠️  SRC-101 folder already exists in target, replacing...');
      targetCollection.item[existingSrc101Index] = src101Folder;
    } else {
      console.log('➕ Adding SRC-101 folder to target collection...');
      targetCollection.item.push(src101Folder);
    }
    
    // Sort items alphabetically for consistency
    targetCollection.item.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    // Create backup
    const backupName = `tests/postman/collections/comprehensive.backup-${Date.now()}.json`;
    fs.writeFileSync(backupName, JSON.stringify(targetCollection, null, 2));
    console.log(`💾 Created backup: ${backupName}`);
    
    // Write updated collection
    fs.writeFileSync(
      'tests/postman/collections/comprehensive.json', 
      JSON.stringify(targetCollection, null, 2)
    );
    
    console.log('✅ Successfully merged SRC-101 tests into comprehensive collection!');
    console.log(`📊 Final collection has ${targetCollection.item.length} folders`);
    
    // Validation
    console.log('\n🔍 Validation:');
    const finalSrc101 = targetCollection.item.find(
      item => item.name && item.name.toLowerCase() === 'src101'
    );
    
    if (finalSrc101) {
      console.log(`✅ SRC-101 folder confirmed with ${finalSrc101.item?.length || 0} tests`);
    } else {
      console.log('❌ SRC-101 folder not found after merge!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main }; 