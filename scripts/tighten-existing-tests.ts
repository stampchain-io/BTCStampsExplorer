#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Test Tightening Script
 *
 * Purpose: Update test scripts to use exact status codes instead of ranges
 * where appropriate based on test data guarantees.
 *
 * Task: 7.5 - Tighten existing 33 test scripts to use exact status codes
 */

interface TighteningRule {
  requestName: string;
  action: 'tighten' | 'preserve';
  reason: string;
  oldPattern?: string;
  newPattern?: string;
  exactStatus?: number;
}

interface ChangeReport {
  requestsAnalyzed: number;
  requestsUpdated: number;
  requestsPreserved: number;
  changes: Array<{
    name: string;
    before: string;
    after: string;
    reason: string;
  }>;
  preserved: Array<{
    name: string;
    reason: string;
  }>;
}

const TIGHTENING_RULES: TighteningRule[] = [
  // Cursed endpoints - deprecated, should always return 410
  {
    requestName: 'Get Cursed List - Dev',
    action: 'tighten',
    exactStatus: 410,
    reason: 'Cursed endpoints are deprecated and always return 410 Gone',
  },
  {
    requestName: 'Get Cursed List - Prod',
    action: 'tighten',
    exactStatus: 410,
    reason: 'Cursed endpoints are deprecated and always return 410 Gone',
  },
  {
    requestName: 'Get Cursed by ID - Dev',
    action: 'tighten',
    exactStatus: 410,
    reason: 'Cursed endpoints are deprecated and always return 410 Gone',
  },
  {
    requestName: 'Get Cursed by ID - Prod',
    action: 'tighten',
    exactStatus: 410,
    reason: 'Cursed endpoints are deprecated and always return 410 Gone',
  },
  {
    requestName: 'Get Cursed by Block - Dev',
    action: 'tighten',
    exactStatus: 410,
    reason: 'Cursed endpoints are deprecated and always return 410 Gone',
  },
  {
    requestName: 'Get Cursed by Block - Prod',
    action: 'tighten',
    exactStatus: 410,
    reason: 'Cursed endpoints are deprecated and always return 410 Gone',
  },
  // Invalid input tests
  {
    requestName: 'Negative Limit - Dev',
    action: 'tighten',
    exactStatus: 400,
    reason: 'Negative limit is invalid input - should consistently return 400 Bad Request',
  },
  // Data-dependent tests - preserve ranges
  {
    requestName: 'Get SRC20 TX with Null Tick - Dev',
    action: 'preserve',
    reason: 'Test data may not guarantee tx exists - 404 is legitimate if tx not found',
  },
  {
    requestName: 'Get SRC20 TX with Null Tick - Prod',
    action: 'preserve',
    reason: 'Production data may not have the tx - 404 is legitimate if tx not found',
  },
  // Test endpoints - preserve ranges
  {
    requestName: 'Test Error Endpoint - Dev',
    action: 'preserve',
    reason: 'Error endpoint may intentionally return different error codes for testing',
  },
  {
    requestName: 'Test Error Endpoint - Prod',
    action: 'preserve',
    reason: 'Error endpoint may intentionally return different error codes for testing',
  },
];

async function loadComprehensiveCollection() {
  const collectionPath = new URL(
    '../tests/postman/collections/comprehensive.json',
    import.meta.url
  );
  const content = await Deno.readTextFile(collectionPath);
  return JSON.parse(content);
}

async function saveComprehensiveCollection(collection: any) {
  const collectionPath = new URL(
    '../tests/postman/collections/comprehensive.json',
    import.meta.url
  );
  const backupPath = new URL(
    '../tests/postman/collections/comprehensive.json.backup',
    import.meta.url
  );

  // Create backup
  const original = await Deno.readTextFile(collectionPath);
  await Deno.writeTextFile(backupPath, original);
  console.log(`📦 Backup created: ${backupPath.pathname}`);

  // Save updated collection
  await Deno.writeTextFile(
    collectionPath,
    JSON.stringify(collection, null, 2)
  );
  console.log(`💾 Updated collection saved: ${collectionPath.pathname}`);
}

function findRequest(collection: any, name: string): any {
  function search(item: any): any {
    if (item.item) {
      for (const child of item.item) {
        const result = search(child);
        if (result) return result;
      }
    } else if (item.request && item.name === name) {
      return item;
    }
    return null;
  }
  return search(collection);
}

function updateTestScript(request: any, exactStatus: number): string {
  const testEvent = request.event?.find((e: any) => e.listen === 'test');
  if (!testEvent) {
    throw new Error(`No test event found for request: ${request.name}`);
  }

  const originalScript = testEvent.script.exec.join('\n');

  // For Cursed endpoints with complex test structure, simplify to just check 410
  if (request.name.includes('Cursed') && exactStatus === 410) {
    const simplified = `// Cursed endpoints are deprecated and return HTTP 410 (Gone)
pm.test('Cursed endpoint returns 410 Gone', () => {
    pm.response.to.have.status(410);
});

pm.test('Response time is acceptable', () => {
    pm.expect(pm.response.responseTime).to.be.below(parseInt(pm.variables.get('test_timeout') || '10000'));
});

pm.test('Response has valid JSON', () => {
    pm.response.to.be.json;
});`;
    testEvent.script.exec = simplified.split('\n');
    return originalScript;
  }

  // For simple oneOf replacements
  const updated = originalScript.replace(
    /pm\.expect\(pm\.response\.code\)\.to\.be\.oneOf\(\[[^\]]+\]\)/gi,
    `pm.response.to.have.status(${exactStatus})`
  );

  testEvent.script.exec = updated.split('\n');
  return originalScript;
}

async function main() {
  console.log('🔧 Tightening test assertions...\n');

  const collection = await loadComprehensiveCollection();
  const report: ChangeReport = {
    requestsAnalyzed: TIGHTENING_RULES.length,
    requestsUpdated: 0,
    requestsPreserved: 0,
    changes: [],
    preserved: [],
  };

  // Process each rule
  for (const rule of TIGHTENING_RULES) {
    const request = findRequest(collection, rule.requestName);

    if (!request) {
      console.log(`⚠️  Request not found: ${rule.requestName}`);
      continue;
    }

    if (rule.action === 'preserve') {
      console.log(`✋ PRESERVING: ${rule.requestName}`);
      console.log(`   Reason: ${rule.reason}\n`);
      report.requestsPreserved++;
      report.preserved.push({
        name: rule.requestName,
        reason: rule.reason,
      });
      continue;
    }

    if (rule.action === 'tighten' && rule.exactStatus) {
      console.log(`🔨 TIGHTENING: ${rule.requestName}`);
      console.log(`   New status: ${rule.exactStatus}`);
      console.log(`   Reason: ${rule.reason}`);

      try {
        const originalScript = updateTestScript(request, rule.exactStatus);
        const testEvent = request.event.find((e: any) => e.listen === 'test');
        const newScript = testEvent.script.exec.join('\n');

        console.log(`   ✓ Updated test script\n`);

        report.requestsUpdated++;
        report.changes.push({
          name: rule.requestName,
          before: originalScript.substring(0, 150) + '...',
          after: newScript.substring(0, 150) + '...',
          reason: rule.reason,
        });
      } catch (error) {
        console.error(`   ✗ Error updating: ${error.message}\n`);
      }
    }
  }

  // Save updated collection
  if (report.requestsUpdated > 0) {
    await saveComprehensiveCollection(collection);
  } else {
    console.log('ℹ️  No changes made - skipping save');
  }

  // Save report
  const reportPath = new URL(
    '../tests/postman/test-tightening-report.json',
    import.meta.url
  );
  await Deno.writeTextFile(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n📊 Summary:');
  console.log(`   Requests analyzed: ${report.requestsAnalyzed}`);
  console.log(`   Requests updated: ${report.requestsUpdated}`);
  console.log(`   Requests preserved: ${report.requestsPreserved}`);
  console.log(`\n✅ Report saved to: ${reportPath.pathname}`);

  if (report.requestsUpdated > 0) {
    console.log('\n⚠️  IMPORTANT: Run Newman tests to verify changes:');
    console.log('   cd tests/postman && ./scripts/run-newman-comprehensive.sh');
  }

  console.log('\n✨ Test tightening complete!');
}

if (import.meta.main) {
  main();
}
