#!/bin/bash
# Rate Limiting Test Script for BTCStampsExplorer
# Tests that rate limiting is working correctly

set -e

# Configuration
API_BASE="${1:-https://stampchain.io/api}"
TEST_ENDPOINT="/v2/src20?limit=5"
EXPECTED_LIMIT=60  # SRC-20 limit is 60 req/min

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Rate Limiting Test${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "API Base: $API_BASE"
echo "Test Endpoint: $TEST_ENDPOINT"
echo "Expected Limit: $EXPECTED_LIMIT requests/minute"
echo "Expected Behavior: HTTP 429 after $EXPECTED_LIMIT requests"
echo ""

# Test 1: Normal request (should pass)
echo -e "${YELLOW}Test 1: Normal Request (Should Pass)${NC}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE}${TEST_ENDPOINT}")
if [ "$STATUS" == "200" ]; then
    echo -e "${GREEN}✅ PASS: Normal request returned 200${NC}"
else
    echo -e "${RED}❌ FAIL: Expected 200, got $STATUS${NC}"
fi
echo ""

# Test 2: Rapid requests (should hit rate limit)
echo -e "${YELLOW}Test 2: Rapid Requests (Should Hit Rate Limit)${NC}"
echo "Sending requests rapidly..."
echo ""

LIMIT_HIT=false
HIT_AT=0

for i in $(seq 1 $((EXPECTED_LIMIT + 10))); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE}${TEST_ENDPOINT}" 2>/dev/null)

    if [ "$STATUS" == "429" ]; then
        echo -e "${GREEN}Request $i: HTTP 429 ← Rate limit triggered${NC}"
        LIMIT_HIT=true
        HIT_AT=$i

        # Get full response with headers
        echo ""
        echo "Full Response:"
        RESPONSE=$(curl -s -v "${API_BASE}${TEST_ENDPOINT}" 2>&1)
        echo "$RESPONSE" | grep -E "HTTP|X-RateLimit|Retry-After|Content-Type" || true
        echo ""

        # Parse JSON response
        JSON=$(echo "$RESPONSE" | tail -1)
        echo "Response Body:"
        echo "$JSON" | jq '.' 2>/dev/null || echo "$JSON"

        break
    elif [ $((i % 10)) -eq 0 ]; then
        # Progress indicator every 10 requests
        echo "Request $i: HTTP $STATUS"
    fi

    # Sleep to stay within 1 minute window
    sleep 0.8
done

echo ""
if [ "$LIMIT_HIT" = true ]; then
    echo -e "${GREEN}✅ SUCCESS: Rate limiting working correctly${NC}"
    echo "   Limit triggered at request $HIT_AT (expected: ~$EXPECTED_LIMIT)"

    # Check if triggered at reasonable point
    if [ $HIT_AT -ge $EXPECTED_LIMIT ] && [ $HIT_AT -le $((EXPECTED_LIMIT + 5)) ]; then
        echo -e "${GREEN}   ✅ Triggered at expected threshold${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Triggered at $HIT_AT (expected $EXPECTED_LIMIT)${NC}"
    fi
else
    echo -e "${RED}❌ FAILURE: Rate limit never triggered${NC}"
    echo "   Sent $((EXPECTED_LIMIT + 10)) requests without hitting limit"
    echo "   Check:"
    echo "   1. Is middleware registered in main.ts?"
    echo "   2. Is Redis connection working?"
    echo "   3. Is rate limiting enabled?"
fi
echo ""

# Test 3: Wait and retry (should reset)
if [ "$LIMIT_HIT" = true ]; then
    echo -e "${YELLOW}Test 3: Rate Limit Reset (Optional - requires 1 minute wait)${NC}"
    echo "Would you like to test rate limit reset? (requires waiting 60 seconds)"
    read -p "Test reset? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Waiting for rate limit window to reset..."
        for i in {60..1}; do
            echo -ne "  Waiting: ${i}s remaining\r"
            sleep 1
        done
        echo ""

        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE}${TEST_ENDPOINT}")
        if [ "$STATUS" == "200" ]; then
            echo -e "${GREEN}✅ PASS: Rate limit reset after window expired${NC}"
        else
            echo -e "${RED}❌ FAIL: Expected 200 after reset, got $STATUS${NC}"
        fi
    else
        echo "Skipping reset test"
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Test Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Tests Run: 2-3"
echo "Results:"
echo "  - Normal Request: $([ "$STATUS" == "200" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "  - Rate Limit Trigger: $([ "$LIMIT_HIT" = true ] && echo "✅ PASS" || echo "❌ FAIL")"
echo ""

if [ "$LIMIT_HIT" = true ]; then
    echo -e "${GREEN}✅ Rate limiting is working correctly!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Monitor CloudWatch logs for rate limit hits"
    echo "2. Adjust thresholds if needed (see RATE_LIMITING_IMPLEMENTATION.md)"
    echo "3. Document rate limits in API documentation"
else
    echo -e "${RED}⚠️  Rate limiting may not be configured correctly${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check middleware is registered: grep rateLimitMiddleware main.ts"
    echo "2. Check Redis connection: grep REDIS logs"
    echo "3. Enable debug mode: export RATE_LIMIT_DEBUG=true"
    echo "4. Review RATE_LIMITING_IMPLEMENTATION.md for setup steps"
fi
echo ""
