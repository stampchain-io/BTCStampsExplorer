#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Analysis Script: Existing Test Scripts Analyzer
 *
 * Purpose: Identify and categorize test scripts in the comprehensive collection
 * to determine which use exact status assertions vs. ranges (oneOf).
 *
 * Task: 7.5 - Tighten existing 33 test scripts to use exact status codes
 */

interface EndpointMapping {
  postmanName: string;
  method: string;
  url: string;
  expectedStatus: number;
  hasExistingTests: boolean;
  responseType?: string;
}

interface PostmanRequest {
  name: string;
  request: {
    method: string;
    url: string | { raw: string };
  };
  event?: Array<{
    listen: string;
    script: {
      exec: string[];
    };
  }>;
}

interface TestAnalysis {
  requestName: string;
  method: string;
  url: string;
  hasTest: boolean;
  testType: 'exact' | 'range' | 'none';
  statusPattern?: string;
  testScript?: string;
}

async function loadEndpointMap(): Promise<EndpointMapping[]> {
  const mapPath = new URL(
    '../tests/postman/endpoint-schema-map.json',
    import.meta.url
  );
  const content = await Deno.readTextFile(mapPath);
  const data = JSON.parse(content);
  return data.requests;
}

async function loadComprehensiveCollection() {
  const collectionPath = new URL(
    '../tests/postman/collections/comprehensive.json',
    import.meta.url
  );
  const content = await Deno.readTextFile(collectionPath);
  return JSON.parse(content);
}

function extractStatusPattern(testScript: string): {
  type: 'exact' | 'range' | 'none';
  pattern?: string;
} {
  const lines = testScript.toLowerCase();

  // Check for exact status assertion patterns
  const exactPatterns = [
    /pm\.response\.to\.have\.status\((\d+)\)/,
    /pm\.expect\(pm\.response\.code\)\.to\.equal\((\d+)\)/,
    /pm\.expect\(pm\.response\.code\)\.to\.eql\((\d+)\)/,
  ];

  for (const pattern of exactPatterns) {
    const match = lines.match(pattern);
    if (match) {
      return { type: 'exact', pattern: match[0] };
    }
  }

  // Check for range assertion patterns (oneOf)
  const rangePatterns = [
    /pm\.expect\(pm\.response\.code\)\.to\.be\.oneof\(\[([^\]]+)\]\)/,
    /pm\.response\.to\.be\.oneof\(\[([^\]]+)\]\)/,
  ];

  for (const pattern of rangePatterns) {
    const match = lines.match(pattern);
    if (match) {
      return { type: 'range', pattern: match[0] };
    }
  }

  return { type: 'none' };
}

function analyzeRequest(request: PostmanRequest): TestAnalysis {
  const url = typeof request.request.url === 'string'
    ? request.request.url
    : request.request.url.raw;

  const testEvent = request.event?.find(e => e.listen === 'test');

  if (!testEvent) {
    return {
      requestName: request.name,
      method: request.request.method,
      url,
      hasTest: false,
      testType: 'none',
    };
  }

  const testScript = testEvent.script.exec.join('\n');
  const statusInfo = extractStatusPattern(testScript);

  return {
    requestName: request.name,
    method: request.request.method,
    url,
    hasTest: true,
    testType: statusInfo.type,
    statusPattern: statusInfo.pattern,
    testScript,
  };
}

function flattenRequests(item: any): PostmanRequest[] {
  const requests: PostmanRequest[] = [];

  if (item.item) {
    // It's a folder
    for (const child of item.item) {
      requests.push(...flattenRequests(child));
    }
  } else if (item.request) {
    // It's a request
    requests.push(item);
  }

  return requests;
}

async function main() {
  console.log('🔍 Analyzing existing test scripts...\n');

  // Load endpoint mapping
  const endpoints = await loadEndpointMap();
  const withTests = endpoints.filter(e => e.hasExistingTests);
  console.log(`📊 Endpoints with hasExistingTests=true: ${withTests.length}`);

  // Load comprehensive collection
  const collection = await loadComprehensiveCollection();
  const allRequests = flattenRequests(collection);
  console.log(`📦 Total requests in collection: ${allRequests.length}\n`);

  // Analyze all requests
  const analyses: TestAnalysis[] = allRequests.map(analyzeRequest);

  // Filter to those with tests
  const withTestScripts = analyses.filter(a => a.hasTest);
  console.log(`✅ Requests with test scripts: ${withTestScripts.length}`);

  // Categorize by test type
  const exactTests = withTestScripts.filter(a => a.testType === 'exact');
  const rangeTests = withTestScripts.filter(a => a.testType === 'range');
  const unknownTests = withTestScripts.filter(a => a.testType === 'none');

  console.log(`  - Exact assertions: ${exactTests.length}`);
  console.log(`  - Range assertions (oneOf): ${rangeTests.length}`);
  console.log(`  - Unknown pattern: ${unknownTests.length}\n`);

  // Generate detailed report
  const report = {
    summary: {
      totalRequests: allRequests.length,
      requestsWithTests: withTestScripts.length,
      exactAssertions: exactTests.length,
      rangeAssertions: rangeTests.length,
      unknownPattern: unknownTests.length,
    },
    exactTests: exactTests.map(t => ({
      name: t.requestName,
      method: t.method,
      url: t.url,
      pattern: t.statusPattern,
    })),
    rangeTests: rangeTests.map(t => ({
      name: t.requestName,
      method: t.method,
      url: t.url,
      pattern: t.statusPattern,
      scriptPreview: t.testScript?.substring(0, 200) + '...',
    })),
    unknownTests: unknownTests.map(t => ({
      name: t.requestName,
      method: t.method,
      url: t.url,
      scriptPreview: t.testScript?.substring(0, 200) + '...',
    })),
  };

  // Write report
  const reportPath = new URL(
    '../tests/postman/test-analysis-report.json',
    import.meta.url
  );
  await Deno.writeTextFile(reportPath, JSON.stringify(report, null, 2));

  console.log('📄 Report Details:');
  console.log('\nRange Assertions (Need Review):');
  rangeTests.forEach((test, idx) => {
    console.log(`${idx + 1}. ${test.requestName}`);
    console.log(`   ${test.method} ${test.url}`);
    console.log(`   Pattern: ${test.statusPattern}\n`);
  });

  if (unknownTests.length > 0) {
    console.log('\nUnknown Test Patterns (Manual Review Required):');
    unknownTests.forEach((test, idx) => {
      console.log(`${idx + 1}. ${test.requestName}`);
      console.log(`   ${test.method} ${test.url}\n`);
    });
  }

  console.log(`\n✅ Analysis complete! Report saved to: ${reportPath.pathname}`);
  console.log(`\nNext steps:`);
  console.log(`1. Review ${rangeTests.length} requests with range assertions`);
  console.log(`2. Determine which should use exact status codes`);
  console.log(`3. Run tighten-existing-tests.ts to apply changes`);
}

if (import.meta.main) {
  main();
}
