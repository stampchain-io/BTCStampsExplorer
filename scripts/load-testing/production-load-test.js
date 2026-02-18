import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { check, group } from "k6";
import http from "k6/http";
import { Counter, Rate, Trend } from "k6/metrics";

// =============================================================================
// stampchain.io - Production Load Testing Suite
// =============================================================================
// Comprehensive load testing for production readiness validation
// Tests both v2.2 and v2.3 API versions under various load conditions
// =============================================================================

// Environment configuration
const BASE_URL = __ENV.BASE_URL || "https://stampchain.io";
const TEST_ADDRESS = __ENV.TEST_ADDRESS ||
  "bc1qrfne7jw6fk6r8kl6dlm0ktt6rv4e5nqp5y4yny";

// Custom metrics
const errorRate = new Rate("error_rate");
const successRate = new Rate("success_rate");
const apiV22ResponseTime = new Trend("api_v2_2_response_time");
const apiV23ResponseTime = new Trend("api_v2_3_response_time");
const databaseQueryTime = new Trend("database_query_time");
const healthCheckTime = new Trend("health_check_time");
const criticalEndpointErrors = new Counter("critical_endpoint_errors");

// Load testing scenarios
export let options = {
  scenarios: {
    // Smoke test - basic functionality
    smoke_test: {
      executor: "constant-vus",
      vus: 1,
      duration: "30s",
      tags: { test_type: "smoke" },
    },

    // Load test - normal traffic simulation
    load_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 10 }, // Ramp up
        { duration: "3m", target: 10 }, // Stay steady
        { duration: "1m", target: 20 }, // Ramp up more
        { duration: "3m", target: 20 }, // Stay steady
        { duration: "1m", target: 0 }, // Ramp down
      ],
      tags: { test_type: "load" },
    },

    // Stress test - high traffic simulation
    stress_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 50 }, // Ramp up quickly
        { duration: "2m", target: 50 }, // High load
        { duration: "30s", target: 100 }, // Peak load
        { duration: "1m", target: 100 }, // Sustained peak
        { duration: "30s", target: 0 }, // Ramp down
      ],
      tags: { test_type: "stress" },
    },

    // Spike test - sudden traffic burst
    spike_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 5 }, // Normal load
        { duration: "10s", target: 50 }, // Sudden spike
        { duration: "30s", target: 50 }, // Sustained spike
        { duration: "10s", target: 5 }, // Back to normal
        { duration: "10s", target: 0 }, // Complete
      ],
      tags: { test_type: "spike" },
    },
  },

  // Performance thresholds
  thresholds: {
    // Overall error rate should be less than 1%
    "error_rate": ["rate<0.01"],

    // Success rate should be at least 99%
    "success_rate": ["rate>=0.99"],

    // API response times
    "api_v2_2_response_time": [
      "p(95)<2000", // 95% of requests under 2s
      "p(99)<5000", // 99% of requests under 5s
    ],
    "api_v2_3_response_time": [
      "p(95)<2000", // 95% of requests under 2s
      "p(99)<5000", // 99% of requests under 5s
    ],

    // Database query performance
    "database_query_time": [
      "p(95)<3000", // 95% under 3s
      "p(99)<8000", // 99% under 8s
    ],

    // Health check performance
    "health_check_time": [
      "p(95)<1000", // 95% under 1s
      "p(99)<2000", // 99% under 2s
    ],

    // HTTP request duration
    "http_req_duration": [
      "p(95)<3000",
      "p(99)<8000",
    ],

    // No critical endpoint errors allowed
    "critical_endpoint_errors": ["count<5"],
  },
};

// Test setup
export function setup() {
  console.log("🚀 Starting stampchain.io Load Testing Suite...");
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Test Address: ${TEST_ADDRESS}`);

  // Warm-up request
  const warmupResponse = http.get(`${BASE_URL}/api/health`);
  if (warmupResponse.status !== 200) {
    console.error("❌ Warmup failed - server not responding");
    throw new Error("Server warmup failed");
  }

  console.log("✅ Server warmup successful");
  return { baseUrl: BASE_URL, testAddress: TEST_ADDRESS };
}

// Main test function
export default function (data) {
  const testType = __ENV.K6_TEST_TYPE || "all";

  // Health Check Tests
  if (testType === "all" || testType === "health") {
    group("Health Check Tests", function () {
      testHealthEndpoints();
    });
  }

  // API Version Tests
  if (testType === "all" || testType === "api") {
    group("API Version Tests", function () {
      testApiVersions();
    });
  }

  // Database Performance Tests
  if (testType === "all" || testType === "database") {
    group("Database Performance Tests", function () {
      testDatabasePerformance();
    });
  }

  // Critical Endpoint Tests
  if (testType === "all" || testType === "critical") {
    group("Critical Endpoint Tests", function () {
      testCriticalEndpoints();
    });
  }
}

function testHealthEndpoints() {
  // Health check endpoint
  const healthStart = Date.now();
  const healthResponse = http.get(`${BASE_URL}/api/health`);
  const healthDuration = Date.now() - healthStart;

  const healthSuccess = check(healthResponse, {
    "Health endpoint returns 200": (r) => r.status === 200,
    "Health response time < 2000ms": (r) => r.timings.duration < 2000,
    "Health response has status": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty("status");
      } catch (e) {
        return false;
      }
    },
  });

  healthCheckTime.add(healthDuration);

  if (healthSuccess) {
    successRate.add(1);
  } else {
    errorRate.add(1);
    criticalEndpointErrors.add(1);
  }

  // Internal monitoring endpoint (may be protected)
  const monitoringResponse = http.get(`${BASE_URL}/api/internal/monitoring`);
  check(monitoringResponse, {
    "Monitoring endpoint responds": (r) => [200, 401, 403].includes(r.status),
    "Monitoring response time < 3000ms": (r) => r.timings.duration < 3000,
  });
}

function testApiVersions() {
  const endpoints = [
    `/api/v2/src20/balance/${TEST_ADDRESS}`,
    "/api/v2/src20?limit=10",
  ];

  endpoints.forEach((endpoint) => {
    // Test v2.2
    const v22Start = Date.now();
    const v22Response = http.get(`${BASE_URL}${endpoint}`, {
      headers: { "X-API-Version": "2.2" },
    });
    const v22Duration = Date.now() - v22Start;

    const v22Success = check(v22Response, {
      [`v2.2 ${endpoint} returns 200`]: (r) => r.status === 200,
      [`v2.2 ${endpoint} response time < 3000ms`]: (r) =>
        r.timings.duration < 3000,
      [`v2.2 ${endpoint} NO market_data field`]: (r) => {
        try {
          const body = JSON.parse(r.body);
          if (body.data && Array.isArray(body.data) && body.data.length > 0) {
            return !body.data[0].hasOwnProperty("market_data");
          }
          return true;
        } catch (e) {
          return false;
        }
      },
    });

    apiV22ResponseTime.add(v22Duration);

    // Test v2.3
    const v23Start = Date.now();
    const v23Response = http.get(`${BASE_URL}${endpoint}`, {
      headers: { "X-API-Version": "2.3" },
    });
    const v23Duration = Date.now() - v23Start;

    const v23Success = check(v23Response, {
      [`v2.3 ${endpoint} returns 200`]: (r) => r.status === 200,
      [`v2.3 ${endpoint} response time < 3000ms`]: (r) =>
        r.timings.duration < 3000,
      [`v2.3 ${endpoint} HAS market_data field`]: (r) => {
        try {
          const body = JSON.parse(r.body);
          if (body.data && Array.isArray(body.data) && body.data.length > 0) {
            return body.data[0].hasOwnProperty("market_data");
          }
          return true;
        } catch (e) {
          return false;
        }
      },
    });

    apiV23ResponseTime.add(v23Duration);

    // Update metrics
    if (v22Success && v23Success) {
      successRate.add(1);
    } else {
      errorRate.add(1);
      if (!v22Success || !v23Success) {
        criticalEndpointErrors.add(1);
      }
    }
  });
}

function testDatabasePerformance() {
  // Test database-heavy endpoints
  const dbEndpoints = [
    "/api/v2/src20?limit=50",
    "/api/v2/stamps?limit=50",
    `/api/v2/src20/balance/${TEST_ADDRESS}?limit=20`,
  ];

  dbEndpoints.forEach((endpoint) => {
    const dbStart = Date.now();
    const dbResponse = http.get(`${BASE_URL}${endpoint}`);
    const dbDuration = Date.now() - dbStart;

    const dbSuccess = check(dbResponse, {
      [`DB ${endpoint} returns 200`]: (r) => r.status === 200,
      [`DB ${endpoint} response time < 5000ms`]: (r) =>
        r.timings.duration < 5000,
      [`DB ${endpoint} returns data`]: (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.hasOwnProperty("data") && Array.isArray(body.data);
        } catch (e) {
          return false;
        }
      },
    });

    databaseQueryTime.add(dbDuration);

    if (dbSuccess) {
      successRate.add(1);
    } else {
      errorRate.add(1);
    }
  });
}

function testCriticalEndpoints() {
  const criticalEndpoints = [
    "/api/v2/src20",
    "/api/v2/stamps",
    "/api/health",
  ];

  criticalEndpoints.forEach((endpoint) => {
    const response = http.get(`${BASE_URL}${endpoint}`);

    const success = check(response, {
      [`Critical ${endpoint} returns 200`]: (r) => r.status === 200,
      [`Critical ${endpoint} response time < 4000ms`]: (r) =>
        r.timings.duration < 4000,
    });

    if (success) {
      successRate.add(1);
    } else {
      errorRate.add(1);
      criticalEndpointErrors.add(1);
    }
  });
}

// Generate comprehensive test report
export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return {
    // HTML report
    [`reports/load-test-${timestamp}.html`]: htmlReport(data),

    // JSON data for further processing
    [`reports/load-test-${timestamp}.json`]: JSON.stringify(data, null, 2),

    // Console summary
    "stdout": textSummary(data, { indent: " ", enableColors: true }) + "\n\n" +
      generateCustomSummary(data),
  };
}

function generateCustomSummary(data) {
  const summary = [
    "\n🚀 stampchain.io Load Test Results Summary\n",
    "================================================\n",
  ];

  // Overall metrics
  const httpReqDuration = data.metrics.http_req_duration;
  const errorRate = data.metrics.error_rate;
  const successRate = data.metrics.success_rate;

  summary.push(`📊 Performance Metrics:`);
  summary.push(
    `   Average Response Time: ${httpReqDuration?.values?.avg?.toFixed(2)}ms`,
  );
  summary.push(
    `   95th Percentile: ${httpReqDuration?.values?.["p(95)"]?.toFixed(2)}ms`,
  );
  summary.push(
    `   99th Percentile: ${httpReqDuration?.values?.["p(99)"]?.toFixed(2)}ms`,
  );
  summary.push(
    `   Max Response Time: ${httpReqDuration?.values?.max?.toFixed(2)}ms\n`,
  );

  summary.push(`✅ Success Metrics:`);
  summary.push(
    `   Success Rate: ${((successRate?.values?.rate || 0) * 100).toFixed(2)}%`,
  );
  summary.push(
    `   Error Rate: ${((errorRate?.values?.rate || 0) * 100).toFixed(2)}%`,
  );
  summary.push(
    `   Total Requests: ${data.metrics.http_reqs?.values?.count || 0}\n`,
  );

  // API version performance
  const v22ResponseTime = data.metrics.api_v2_2_response_time;
  const v23ResponseTime = data.metrics.api_v2_3_response_time;

  if (v22ResponseTime && v23ResponseTime) {
    summary.push(`🔄 API Version Performance:`);
    summary.push(
      `   v2.2 Average: ${v22ResponseTime.values.avg?.toFixed(2)}ms`,
    );
    summary.push(
      `   v2.3 Average: ${v23ResponseTime.values.avg?.toFixed(2)}ms`,
    );
    summary.push(
      `   v2.2 P95: ${v22ResponseTime.values["p(95)"]?.toFixed(2)}ms`,
    );
    summary.push(
      `   v2.3 P95: ${v23ResponseTime.values["p(95)"]?.toFixed(2)}ms\n`,
    );
  }

  // Pass/fail status
  const thresholds = data.root_group.thresholds || {};
  const failedThresholds = Object.keys(thresholds).filter((t) =>
    thresholds[t].ok === false
  );

  if (failedThresholds.length === 0) {
    summary.push(`🎉 LOAD TEST PASSED - All thresholds met!`);
  } else {
    summary.push(
      `❌ LOAD TEST FAILED - ${failedThresholds.length} threshold(s) failed:`,
    );
    failedThresholds.forEach((threshold) => {
      summary.push(`   - ${threshold}`);
    });
  }

  return summary.join("\n");
}

// Teardown function
export function teardown(data) {
  console.log("🏁 Load testing completed");

  // Check if we need to fail the test based on critical metrics
  const criticalErrors = data.criticalEndpointErrors || 0;
  if (criticalErrors > 5) {
    console.error(
      `❌ CRITICAL: ${criticalErrors} critical endpoint errors detected`,
    );
    throw new Error("Too many critical endpoint errors");
  }

  console.log("✅ Load test teardown completed successfully");
}
