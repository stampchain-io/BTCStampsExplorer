#!/usr/bin/env -S deno run --allow-net --allow-env

/**
 * Production Diagnostic Script
 *
 * Tests all critical endpoints and identifies production deployment issues
 *
 * Usage:
 *   deno run --allow-net --allow-env scripts/diagnoseProd.ts
 *   deno run --allow-net --allow-env scripts/diagnoseProd.ts --local
 */

interface EndpointTest {
  name: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  expectedStatus: number[];
  critical: boolean;
}

// Check if we should test local dev server
const isLocal = Deno.args.includes('--local') || Deno.args.includes('-l');
const BASE_URL = isLocal ? 'http://localhost:8000' : 'https://stampchain.io';

const tests: EndpointTest[] = [
  // Homepage - this is the failing one!
  {
    name: 'Homepage Route',
    url: `${BASE_URL}/`,
    method: 'GET',
    expectedStatus: [200],
    critical: true
  },

  // Working route for comparison
  {
    name: 'Stamp Route (Working)',
    url: `${BASE_URL}/stamp`,
    method: 'GET',
    expectedStatus: [200],
    critical: true
  },

  // Public API Endpoints
  {
    name: 'Stamps API',
    url: `${BASE_URL}/api/v2/stamps?limit=1`,
    method: 'GET',
    expectedStatus: [200],
    critical: true
  },
  {
    name: 'Individual Stamp',
    url: `${BASE_URL}/api/v2/stamps/1158626`,
    method: 'GET',
    expectedStatus: [200],
    critical: true
  },
  {
    name: 'SRC20 API',
    url: `${BASE_URL}/api/v2/src20?limit=1`,
    method: 'GET',
    expectedStatus: [200],
    critical: true
  },
  {
    name: 'SRC20 Trending API',
    url: `${BASE_URL}/api/v2/src20?op=DEPLOY&mintingStatus=minting&sortBy=TRENDING_MINTING_DESC&limit=5`,
    method: 'GET',
    expectedStatus: [200],
    critical: true
  },
  {
    name: 'Collections API',
    url: `${BASE_URL}/api/v2/collections?limit=1`,
    method: 'GET',
    expectedStatus: [200],
    critical: false
  },

  // Content Endpoints
  {
    name: 'Stamp Content',
    url: `${BASE_URL}/stamps/7f301c014e6cd7e701e7c52a562446bf810d01a8abe396c1c1c979e6e266b211.html`,
    method: 'GET',
    expectedStatus: [200],
    critical: true
  },

  // Frontend Routes
  {
    name: 'Explorer Page',
    url: `${BASE_URL}/explorer`,
    method: 'GET',
    expectedStatus: [200],
    critical: true
  },

  // Internal Endpoints (expect CSRF errors in prod but should respond locally)
  {
    name: 'Internal Fees',
    url: `${BASE_URL}/api/internal/fees`,
    method: 'GET',
    expectedStatus: isLocal ? [200] : [400, 403], // Local dev might not have CSRF
    critical: false
  },
  {
    name: 'Memory Monitoring',
    url: `${BASE_URL}/api/internal/monitoring?action=memory`,
    method: 'GET',
    expectedStatus: [200],
    critical: false
  },

  // Health Checks
  {
    name: 'Health Check',
    url: `${BASE_URL}/api/internal/monitoring?action=health`,
    method: 'GET',
    expectedStatus: [200],
    critical: false
  }
];

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

async function testEndpoint(test: EndpointTest): Promise<{
  success: boolean;
  status: number;
  responseTime: number;
  error?: string;
  details?: any;
}> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout for local

    const response = await fetch(test.url, {
      method: test.method,
      headers: {
        'User-Agent': 'BTCStampsExplorer-Diagnostic/1.0',
        ...test.headers
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    const success = test.expectedStatus.includes(response.status);

    let details: any = {};
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        details = await response.json();
      } else {
        const text = await response.text();
        details.contentLength = text.length;
        details.contentType = contentType;
        if (text.length < 500) { // Show more for debugging
          details.preview = text.substring(0, 500);
        }
        // Check for common error patterns
        if (text.includes('500') || text.includes('Internal Server Error')) {
          details.serverError = true;
        }
        if (text.includes('404') || text.includes('Not Found')) {
          details.notFound = true;
        }
        if (text.includes('Cannot GET')) {
          details.routeError = true;
        }
      }
    } catch (e) {
      details.parseError = String(e);
    }

    return {
      success,
      status: response.status,
      responseTime,
      details
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      status: 0,
      responseTime,
      error: String(error),
      details: { networkError: true }
    };
  }
}

async function runDiagnostics(): Promise<void> {
  const target = isLocal ? '🔧 LOCAL DEV SERVER' : '🌐 PRODUCTION';
  console.log(colorize(`\n🔬 BTCStampsExplorer Diagnostics - ${target}`, 'bold'));
  console.log(colorize(`Target: ${BASE_URL}`, 'dim'));
  console.log(colorize(`Time: ${new Date().toISOString()}`, 'dim'));
  console.log('─'.repeat(80));

  const results = [];
  let criticalFailures = 0;
  let totalFailures = 0;

  for (const test of tests) {
    console.log(colorize(`\n🧪 Testing: ${test.name}`, 'cyan'));
    console.log(colorize(`   URL: ${test.url}`, 'dim'));

    const result = await testEndpoint(test);
    results.push({ test, result });

    if (result.success) {
      console.log(colorize(`   ✅ PASS`, 'green') + ` (${result.status}) - ${result.responseTime}ms`);
      if (result.details && Object.keys(result.details).length > 0) {
        if (result.details.data && Array.isArray(result.details.data)) {
          console.log(colorize(`   📊 Data: ${result.details.data.length} records`, 'dim'));
        }
        if (result.details.contentLength) {
          console.log(colorize(`   📄 Content: ${result.details.contentLength} bytes`, 'dim'));
        }
        if (result.details.error && result.details.error.includes('CSRF')) {
          console.log(colorize(`   🔒 CSRF Protection Active (Expected)`, 'yellow'));
        }
      }
    } else {
      const statusIcon = test.critical ? '🚨 CRITICAL FAIL' : '⚠️  FAIL';
      const statusColor = test.critical ? 'red' : 'yellow';
      console.log(colorize(`   ${statusIcon}`, statusColor) + ` (${result.status}) - ${result.responseTime}ms`);

      if (result.error) {
        console.log(colorize(`   Error: ${result.error}`, 'red'));
      }

      if (result.details?.error) {
        console.log(colorize(`   Details: ${result.details.error}`, 'red'));
      }

      // Show response preview for debugging
      if (result.details?.preview) {
        console.log(colorize(`   Preview: ${result.details.preview}`, 'yellow'));
      }

      // Specific error indicators
      if (result.details?.serverError) {
        console.log(colorize(`   🔥 500 Internal Server Error detected`, 'red'));
      }
      if (result.details?.notFound) {
        console.log(colorize(`   🚫 404 Not Found detected`, 'yellow'));
      }
      if (result.details?.routeError) {
        console.log(colorize(`   🛣️  Route not found (Cannot GET)`, 'yellow'));
      }

      if (test.critical) {
        criticalFailures++;
      }
      totalFailures++;
    }
  }

  // Summary
  console.log(colorize('\n📋 DIAGNOSTIC SUMMARY', 'bold'));
  console.log('─'.repeat(50));

  const passCount = tests.length - totalFailures;
  const passPercentage = ((passCount / tests.length) * 100).toFixed(1);

  console.log(`Total Tests: ${colorize(tests.length.toString(), 'cyan')}`);
  console.log(`Passed: ${colorize(passCount.toString(), 'green')}`);
  console.log(`Failed: ${colorize(totalFailures.toString(), totalFailures > 0 ? 'red' : 'green')}`);
  console.log(`Critical Failures: ${colorize(criticalFailures.toString(), criticalFailures > 0 ? 'red' : 'green')}`);
  console.log(`Success Rate: ${colorize(`${passPercentage}%`, passPercentage === '100.0' ? 'green' : 'yellow')}`);

  // Recommendations
  console.log(colorize('\n💡 RECOMMENDATIONS', 'bold'));
  console.log('─'.repeat(50));

  if (isLocal) {
    console.log(colorize('🔧 LOCAL DEV SERVER ANALYSIS:', 'cyan'));

    if (criticalFailures === 0) {
      console.log(colorize('✅ No critical failures in local dev server', 'green'));
    } else {
      console.log(colorize('🚨 LOCAL DEV ISSUES DETECTED:', 'red'));

      // Find the specific failed tests
      const failedTests = results.filter(r => !r.result.success && r.test.critical);
      for (const failed of failedTests) {
        console.log(colorize(`• ${failed.test.name}: Status ${failed.result.status}`, 'red'));
        if (failed.result.details?.routeError) {
          console.log(colorize(`  → Route not registered in Fresh routes`, 'yellow'));
        }
        if (failed.result.details?.serverError) {
          console.log(colorize(`  → Check server console for error stack trace`, 'yellow'));
        }
      }

      console.log(colorize('\n🔧 Local Dev Fixes:', 'yellow'));
      console.log('1. Check routes/ directory for missing route files');
      console.log('2. Look at the dev server console for error messages');
      console.log('3. Check fresh.gen.ts is properly generated');
      console.log('4. Restart dev server: deno task dev');
    }
  } else {
    // Original production logic
    if (criticalFailures === 0) {
      console.log(colorize('✅ No critical failures detected', 'green'));
      console.log('✅ Database connectivity is working');
      console.log('✅ Public API endpoints are functional');

      if (totalFailures > 0) {
        console.log(colorize('\n🔧 Non-critical issues found:', 'yellow'));
        console.log('• CSRF token handling for internal endpoints');
        console.log('• Check frontend CSRF token integration');
        console.log('• Review error handling in client-side code');
      }
    } else {
      console.log(colorize('🚨 CRITICAL ISSUES DETECTED:', 'red'));
      console.log('• Check ECS logs immediately');
      console.log('• Verify database connectivity');
      console.log('• Check application startup logs');
    }
  }

  console.log(colorize(`\n📚 Next Steps for ${isLocal ? 'LOCAL DEV' : 'PRODUCTION'}:`, 'cyan'));
  if (isLocal) {
    console.log('1. Check dev server console output for errors');
    console.log('2. Verify routes/index.tsx exists and is valid');
    console.log('3. Check if fresh.gen.ts includes the homepage route');
    console.log('4. Try: rm -rf _fresh && deno task dev');
  } else {
    console.log('1. Check ECS CloudWatch logs: aws logs tail /ecs/your-log-group --follow');
    console.log('2. Verify CSRF token implementation in frontend');
    console.log('3. Check browser developer tools for detailed errors');
    console.log('4. Monitor memory usage: deno task monitor:production');
  }

  console.log(colorize('\n✅ Diagnostics complete', 'green'));

  // Exit with error code if critical failures
  if (criticalFailures > 0) {
    Deno.exit(1);
  }
}

// Run diagnostics
try {
  await runDiagnostics();
} catch (error) {
  console.error(colorize(`\n💥 Diagnostic error: ${error.message}`, 'red'));
  Deno.exit(1);
}
