#!/bin/bash

# Script to run Newman pagination and validation tests
# This script is called by the GitHub Actions workflow

set -e

echo "Starting Newman Pagination & Validation Tests..."

# Check if running in CI
if [ "$CI" = "true" ]; then
    echo "Running in CI environment"
    BASE_URL=${BASE_URL:-"https://stampchain.io"}
else
    echo "Running in local environment"
    BASE_URL=${BASE_URL:-"http://localhost:8000"}
fi

# Create reports directory
REPORT_DIR="reports/newman-pagination-validation"
mkdir -p "$REPORT_DIR"

# Set timestamp for unique report names
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Install dependencies if not already installed (for Docker)
if ! command -v newman &> /dev/null; then
    echo "Installing Newman..."
    npm install -g newman newman-reporter-html newman-reporter-json --no-fund
fi

# Install jq and bc if not available (for Alpine Linux in Docker)
if ! command -v jq &> /dev/null || ! command -v bc &> /dev/null; then
    echo "Installing required tools..."
    apk add --no-cache jq bc 2>/dev/null || true
fi

# Check if environment file exists
ENV_FILE="postman-environment-comprehensive.json"
if [ ! -f "$ENV_FILE" ]; then
    echo "Warning: $ENV_FILE not found, using minimal environment"
    ENV_FILE=""
fi

# Run the pagination validation tests
echo "Running pagination boundary tests..."
newman run tests/postman/collections/pagination-validation.json \
    ${ENV_FILE:+--environment "$ENV_FILE"} \
    --env-var "base_url=$BASE_URL" \
    --env-var "current_env=${CURRENT_ENV:-prod}" \
    --iteration-data postman-data-pagination-tests.json \
    --reporters cli,json,html \
    --reporter-json-export "$REPORT_DIR/pagination-validation-${TIMESTAMP}.json" \
    --reporter-html-export "$REPORT_DIR/pagination-validation-${TIMESTAMP}.html" \
    --timeout-request 30000 \
    --delay-request ${NEWMAN_DELAY:-0} \
    --color on \
    ${NEWMAN_FOLDER:+--folder "$NEWMAN_FOLDER"} \
    ${NEWMAN_BAIL:+--bail} || EXIT_CODE=$?

# Analyze results
if [ -f "$REPORT_DIR/pagination-validation-${TIMESTAMP}.json" ]; then
    echo "Analyzing test results..."
    
    # Extract key metrics
    TOTAL_TESTS=$(jq -r '.run.stats.assertions.total // 0' "$REPORT_DIR/pagination-validation-${TIMESTAMP}.json")
    FAILED_TESTS=$(jq -r '.run.stats.assertions.failed // 0' "$REPORT_DIR/pagination-validation-${TIMESTAMP}.json")
    RESPONSE_TIME_AVG=$(jq -r '.run.timings.responseAverage // 0' "$REPORT_DIR/pagination-validation-${TIMESTAMP}.json")
    
    echo "Test Summary:"
    echo "- Total Tests: $TOTAL_TESTS"
    echo "- Failed Tests: $FAILED_TESTS"
    echo "- Average Response Time: ${RESPONSE_TIME_AVG}ms"
    
    # Create summary file for CI
    cat > "$REPORT_DIR/summary-${TIMESTAMP}.json" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "environment": "$BASE_URL",
  "total_tests": $TOTAL_TESTS,
  "failed_tests": $FAILED_TESTS,
  "success_rate": $([ "$TOTAL_TESTS" -gt 0 ] && echo "scale=2; ($TOTAL_TESTS - $FAILED_TESTS) * 100 / $TOTAL_TESTS" | bc || echo 0),
  "avg_response_time": $RESPONSE_TIME_AVG
}
EOF
fi

# Check for critical failures
if [ ${FAILED_TESTS:-0} -gt 0 ]; then
    echo "❌ Pagination validation tests failed with $FAILED_TESTS failures"
    
    # Extract failed test details
    if [ "$CI" = "true" ]; then
        echo "::error::Pagination validation tests failed"
        jq -r '.run.failures[] | "::error file=\(.source.name)::Test failed: \(.error.message)"' \
            "$REPORT_DIR/pagination-validation-${TIMESTAMP}.json" 2>/dev/null || true
    fi
    
    exit ${EXIT_CODE:-1}
else
    echo "✅ All pagination validation tests passed!"
fi

# Performance threshold check
if [ "${RESPONSE_TIME_AVG:-0}" != "0" ]; then
    if [ $(echo "$RESPONSE_TIME_AVG > 2000" | bc 2>/dev/null || echo 0) -eq 1 ]; then
        echo "⚠️  Warning: Average response time exceeds 2000ms threshold"
        if [ "$CI" = "true" ]; then
            echo "::warning::Performance degradation detected - average response time: ${RESPONSE_TIME_AVG}ms"
        fi
    fi
fi

exit 0