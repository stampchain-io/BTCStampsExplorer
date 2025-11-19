#!/bin/bash
# BTCStampsExplorer - API Testing Script
# Tests API endpoints through Cloudflare to validate configuration changes
# Generated: November 14, 2025

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

API_BASE="https://stampchain.io/api"
RESULTS_DIR="test-results"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESULTS_FILE="${RESULTS_DIR}/api-test-${TIMESTAMP}.log"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}API Cloudflare Configuration Testing${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Testing API endpoints through Cloudflare"
echo "Results will be saved to: $RESULTS_FILE"
echo ""

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local user_agent=$2
    local description=$3

    echo -e "${YELLOW}Testing: $description${NC}"
    echo "Endpoint: $endpoint"
    echo "User-Agent: $user_agent"

    # Make request and capture response
    RESPONSE=$(curl -s -w "\n%{http_code}\n%{time_total}\n" \
        -H "User-Agent: $user_agent" \
        -H "Accept: application/json" \
        "$endpoint" 2>&1)

    # Parse response
    HTTP_CODE=$(echo "$RESPONSE" | tail -2 | head -1)
    TIME_TOTAL=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | head -n -2)

    # Get Cloudflare headers
    CF_HEADERS=$(curl -s -I \
        -H "User-Agent: $user_agent" \
        -H "Accept: application/json" \
        "$endpoint" | grep -i "^CF-")

    # Analyze results
    echo "Status: $HTTP_CODE"
    echo "Response Time: ${TIME_TOTAL}s"
    echo "Cloudflare Headers:"
    echo "$CF_HEADERS"

    # Log to file
    {
        echo "======================================"
        echo "Test: $description"
        echo "Endpoint: $endpoint"
        echo "User-Agent: $user_agent"
        echo "Timestamp: $(date)"
        echo "--------------------------------------"
        echo "HTTP Status: $HTTP_CODE"
        echo "Response Time: ${TIME_TOTAL}s"
        echo "Cloudflare Headers:"
        echo "$CF_HEADERS"
        echo "Response Body (first 500 chars):"
        echo "$BODY" | head -c 500
        echo ""
        echo ""
    } >> "$RESULTS_FILE"

    # Evaluate
    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✓ PASS${NC}"

        # Check if cached by Cloudflare
        CF_CACHE=$(echo "$CF_HEADERS" | grep -i "CF-Cache-Status" | cut -d: -f2 | tr -d ' \r')
        if [ "$CF_CACHE" == "BYPASS" ] || [ "$CF_CACHE" == "DYNAMIC" ]; then
            echo -e "${GREEN}✓ Cache correctly bypassed/dynamic${NC}"
        elif [ "$CF_CACHE" == "HIT" ]; then
            echo -e "${YELLOW}⚠️  Cached by Cloudflare (may be unwanted for API)${NC}"
        fi
    elif [ "$HTTP_CODE" == "403" ]; then
        echo -e "${RED}✗ FAIL - 403 Forbidden (Browser Integrity Check issue?)${NC}"
    elif [ "$HTTP_CODE" == "429" ]; then
        echo -e "${RED}✗ FAIL - 429 Rate Limited${NC}"
    else
        echo -e "${RED}✗ FAIL - Status $HTTP_CODE${NC}"
    fi

    echo ""
}

# Test Cases

echo -e "${GREEN}Test Set 1: Browser User-Agent${NC}"
echo "Testing with standard browser User-Agent (should always pass)"
echo ""

test_endpoint \
    "${API_BASE}/v2/stamps?limit=5" \
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
    "V2 Stamps API - Browser"

test_endpoint \
    "${API_BASE}/v2/src20?limit=5" \
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
    "V2 SRC20 API - Browser"

echo -e "${GREEN}Test Set 2: Non-Browser User-Agent${NC}"
echo "Testing with bot/script User-Agent (should FAIL if Browser Integrity Check is ON)"
echo ""

test_endpoint \
    "${API_BASE}/v2/stamps?limit=5" \
    "StampchainBot/1.0" \
    "V2 Stamps API - Custom Bot"

test_endpoint \
    "${API_BASE}/v2/src20?limit=5" \
    "curl/7.88.0" \
    "V2 SRC20 API - curl"

echo -e "${GREEN}Test Set 3: API Key Authentication${NC}"
echo "Testing with API key (if configured)"
echo ""

if [ -f "../.env" ]; then
    source "../.env"
    if [ ! -z "$INTERNAL_API_KEY" ]; then
        test_endpoint \
            "${API_BASE}/internal/health" \
            "StampchainBot/1.0" \
            "Internal API - With API Key"
    fi
fi

echo -e "${GREEN}Test Set 4: Different Endpoints${NC}"
echo "Testing various API endpoints"
echo ""

test_endpoint \
    "${API_BASE}/health" \
    "Mozilla/5.0 (compatible; HealthCheck/1.0)" \
    "Health Check Endpoint"

test_endpoint \
    "${API_BASE}/v1/stamps/1" \
    "PostmanRuntime/7.36.0" \
    "V1 Single Stamp - Postman"

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Test Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Total tests run: $(grep -c "^Test:" "$RESULTS_FILE" || echo "0")"
echo "Passed (200): $(grep -c "HTTP Status: 200" "$RESULTS_FILE" || echo "0")"
echo "Failed (403): $(grep -c "HTTP Status: 403" "$RESULTS_FILE" || echo "0")"
echo "Failed (other): $(grep -cE "HTTP Status: (4[0-9]{2}|5[0-9]{2})" "$RESULTS_FILE" | grep -v "200\|403" || echo "0")"
echo ""
echo "Detailed results saved to: $RESULTS_FILE"
echo ""

# Analysis
FAIL_COUNT=$(grep -c "HTTP Status: 403" "$RESULTS_FILE" || echo "0")
if [ "$FAIL_COUNT" -gt 0 ]; then
    echo -e "${RED}⚠️  WARNING: Found $FAIL_COUNT 403 errors${NC}"
    echo "This indicates Browser Integrity Check is still blocking non-browser requests"
    echo "Action required: Disable Browser Integrity Check for /api/* routes"
    echo ""
fi

CACHED_COUNT=$(grep -c "CF-Cache-Status: HIT" "$RESULTS_FILE" || echo "0")
if [ "$CACHED_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  WARNING: Found $CACHED_COUNT cached API responses${NC}"
    echo "API responses should not be cached by Cloudflare (use Redis instead)"
    echo "Action required: Add Page Rules to bypass Cloudflare cache for /api/*"
    echo ""
fi

echo -e "${GREEN}Testing complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review detailed results in $RESULTS_FILE"
echo "2. If 403 errors found, run: ./cloudflare-performance-fixes.sh"
echo "3. If responses cached, create Page Rules to bypass cache for /api/*"
echo "4. Re-run this test after making changes to validate fixes"
echo ""
