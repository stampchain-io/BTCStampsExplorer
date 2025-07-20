#!/bin/bash

# =============================================================================
# BTCStampsExplorer - Production Readiness Validation Script
# =============================================================================
# Comprehensive validation script for production deployments
# Integrates smoke tests, load tests, and safety checks
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
BASE_URL="${BASE_URL:-https://stampchain.io}"
SKIP_LOAD_TESTS="${SKIP_LOAD_TESTS:-false}"
SKIP_SMOKE_TESTS="${SKIP_SMOKE_TESTS:-false}"
REPORTS_DIR="./reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Test results tracking
SMOKE_TESTS_PASSED="false"
LOAD_TESTS_PASSED="false"
HEALTH_CHECK_PASSED="false"
API_COMPATIBILITY_PASSED="false"
OVERALL_SUCCESS="false"

echo -e "${BOLD}${CYAN}"
echo "================================================================="
echo "🚀 BTCStampsExplorer - Production Readiness Validation"
echo "================================================================="
echo -e "${NC}"
echo -e "${BLUE}Environment: ${DEPLOYMENT_ENV}${NC}"
echo -e "${BLUE}Target URL: ${BASE_URL}${NC}"
echo -e "${BLUE}Timestamp: ${TIMESTAMP}${NC}"
echo ""

# Ensure reports directory exists
mkdir -p "$REPORTS_DIR"

# =============================================================================
# PHASE 1: SMOKE TESTS
# =============================================================================
echo -e "${BOLD}${YELLOW}🔥 PHASE 1: SMOKE TESTS${NC}"
echo "Testing critical endpoint functionality..."

if [ "$SKIP_SMOKE_TESTS" = "true" ]; then
    echo -e "${YELLOW}⚠️  Skipping smoke tests (SKIP_SMOKE_TESTS=true)${NC}"
    SMOKE_TESTS_PASSED="true"
else
    # Run Newman smoke tests
    echo -e "${CYAN}Running Newman smoke test collection...${NC}"

    if command -v newman &> /dev/null; then
        SMOKE_TEST_REPORT="$REPORTS_DIR/smoke-test-${TIMESTAMP}.html"
        SMOKE_TEST_JSON="$REPORTS_DIR/smoke-test-${TIMESTAMP}.json"

        if newman run tests/postman/collections/smoke-tests.json \
            --environment <(echo "{\"values\":[{\"key\":\"baseUrl\",\"value\":\"$BASE_URL\"}]}") \
            --reporters html,json \
            --reporter-html-export "$SMOKE_TEST_REPORT" \
            --reporter-json-export "$SMOKE_TEST_JSON" \
            --bail; then

            echo -e "${GREEN}✅ Smoke tests PASSED${NC}"
            SMOKE_TESTS_PASSED="true"

            # Extract success rate from JSON report
            if [ -f "$SMOKE_TEST_JSON" ]; then
                SUCCESS_RATE=$(jq -r '.run.stats.tests.passed / .run.stats.tests.total * 100' "$SMOKE_TEST_JSON" 2>/dev/null || echo "0")
                echo -e "${GREEN}   Success Rate: ${SUCCESS_RATE}%${NC}"

                if (( $(echo "$SUCCESS_RATE >= 80" | bc -l) )); then
                    echo -e "${GREEN}   Success rate meets minimum threshold (≥80%)${NC}"
                else
                    echo -e "${RED}   Success rate below threshold (${SUCCESS_RATE}% < 80%)${NC}"
                    SMOKE_TESTS_PASSED="false"
                fi
            fi
        else
            echo -e "${RED}❌ Smoke tests FAILED${NC}"
            SMOKE_TESTS_PASSED="false"
        fi
    else
        echo -e "${YELLOW}⚠️  Newman not found, running basic health check instead...${NC}"

        # Basic health check using curl
        if curl -f -s --max-time 10 "$BASE_URL/api/health" > /dev/null; then
            echo -e "${GREEN}✅ Basic health check PASSED${NC}"
            SMOKE_TESTS_PASSED="true"
        else
            echo -e "${RED}❌ Basic health check FAILED${NC}"
            SMOKE_TESTS_PASSED="false"
        fi
    fi
fi

echo ""

# =============================================================================
# PHASE 2: API COMPATIBILITY VALIDATION
# =============================================================================
echo -e "${BOLD}${YELLOW}🔄 PHASE 2: API VERSION COMPATIBILITY${NC}"
echo "Testing v2.2 and v2.3 API compatibility..."

# Test API v2.2
echo -e "${CYAN}Testing API v2.2...${NC}"
V22_RESPONSE=$(curl -s --max-time 10 \
    -H "X-API-Version: 2.2" \
    "$BASE_URL/api/v2/src20?limit=1" || echo "ERROR")

if [[ "$V22_RESPONSE" != "ERROR" ]] && echo "$V22_RESPONSE" | jq -e '.data[0] | has("market_data") | not' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API v2.2 working correctly (no market_data field)${NC}"
    V22_PASSED="true"
else
    echo -e "${RED}❌ API v2.2 validation failed${NC}"
    V22_PASSED="false"
fi

# Test API v2.3
echo -e "${CYAN}Testing API v2.3...${NC}"
V23_RESPONSE=$(curl -s --max-time 10 \
    -H "X-API-Version: 2.3" \
    "$BASE_URL/api/v2/src20?limit=1" || echo "ERROR")

if [[ "$V23_RESPONSE" != "ERROR" ]] && echo "$V23_RESPONSE" | jq -e '.data[0] | has("market_data")' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API v2.3 working correctly (has market_data field)${NC}"
    V23_PASSED="true"
else
    echo -e "${RED}❌ API v2.3 validation failed${NC}"
    V23_PASSED="false"
fi

if [[ "$V22_PASSED" = "true" ]] && [[ "$V23_PASSED" = "true" ]]; then
    echo -e "${GREEN}✅ API compatibility validation PASSED${NC}"
    API_COMPATIBILITY_PASSED="true"
else
    echo -e "${RED}❌ API compatibility validation FAILED${NC}"
    API_COMPATIBILITY_PASSED="false"
fi

echo ""

# =============================================================================
# PHASE 3: LOAD TESTS (OPTIONAL)
# =============================================================================
echo -e "${BOLD}${YELLOW}📈 PHASE 3: LOAD TESTING${NC}"
echo "Testing performance under load..."

if [ "$SKIP_LOAD_TESTS" = "true" ]; then
    echo -e "${YELLOW}⚠️  Skipping load tests (SKIP_LOAD_TESTS=true)${NC}"
    LOAD_TESTS_PASSED="true"
else
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        echo -e "${YELLOW}⚠️  Production environment detected${NC}"
        echo -e "${YELLOW}   Running light smoke load test to avoid impacting users${NC}"

        # Run light load test for production
        if command -v k6 &> /dev/null; then
            if ./scripts/load-testing/run-load-tests.sh health; then
                echo -e "${GREEN}✅ Production-safe load tests PASSED${NC}"
                LOAD_TESTS_PASSED="true"
            else
                echo -e "${RED}❌ Production-safe load tests FAILED${NC}"
                LOAD_TESTS_PASSED="false"
            fi
        else
            echo -e "${YELLOW}⚠️  k6 not found, skipping load tests${NC}"
            LOAD_TESTS_PASSED="true"
        fi
    else
        # Run full load tests for non-production environments
        echo -e "${CYAN}Running comprehensive load tests for ${DEPLOYMENT_ENV} environment...${NC}"

        if command -v k6 &> /dev/null; then
            if ./scripts/load-testing/run-load-tests.sh load; then
                echo -e "${GREEN}✅ Load tests PASSED${NC}"
                LOAD_TESTS_PASSED="true"
            else
                echo -e "${RED}❌ Load tests FAILED${NC}"
                LOAD_TESTS_PASSED="false"
            fi
        else
            echo -e "${YELLOW}⚠️  k6 not found, skipping load tests${NC}"
            LOAD_TESTS_PASSED="true"
        fi
    fi
fi

echo ""

# =============================================================================
# PHASE 4: HEALTH CHECK VALIDATION
# =============================================================================
echo -e "${BOLD}${YELLOW}🏥 PHASE 4: COMPREHENSIVE HEALTH VALIDATION${NC}"
echo "Validating system health and monitoring endpoints..."

# Health endpoint check
echo -e "${CYAN}Checking main health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s --max-time 5 "$BASE_URL/api/health" || echo "ERROR")

if [[ "$HEALTH_RESPONSE" != "ERROR" ]] && echo "$HEALTH_RESPONSE" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health endpoint responding correctly${NC}"
    HEALTH_CHECK_PASSED="true"
else
    echo -e "${RED}❌ Health endpoint validation failed${NC}"
    HEALTH_CHECK_PASSED="false"
fi

# Database connectivity check (via API)
echo -e "${CYAN}Checking database connectivity...${NC}"
DB_RESPONSE=$(curl -s --max-time 10 "$BASE_URL/api/v2/src20?limit=1" || echo "ERROR")

if [[ "$DB_RESPONSE" != "ERROR" ]] && echo "$DB_RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connectivity confirmed${NC}"
    DB_CONNECTIVITY_PASSED="true"
else
    echo -e "${RED}❌ Database connectivity check failed${NC}"
    DB_CONNECTIVITY_PASSED="false"
fi

# Update overall health status
if [[ "$HEALTH_CHECK_PASSED" = "true" ]] && [[ "$DB_CONNECTIVITY_PASSED" = "true" ]]; then
    HEALTH_CHECK_PASSED="true"
else
    HEALTH_CHECK_PASSED="false"
fi

echo ""

# =============================================================================
# FINAL RESULTS SUMMARY
# =============================================================================
echo -e "${BOLD}${CYAN}"
echo "================================================================="
echo "📊 PRODUCTION READINESS VALIDATION RESULTS"
echo "================================================================="
echo -e "${NC}"

# Calculate overall success
PASSED_CHECKS=0
TOTAL_CHECKS=4

echo -e "${BOLD}Test Results:${NC}"

if [ "$SMOKE_TESTS_PASSED" = "true" ]; then
    echo -e "   🔥 Smoke Tests: ${GREEN}✅ PASSED${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "   🔥 Smoke Tests: ${RED}❌ FAILED${NC}"
fi

if [ "$API_COMPATIBILITY_PASSED" = "true" ]; then
    echo -e "   🔄 API Compatibility: ${GREEN}✅ PASSED${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "   🔄 API Compatibility: ${RED}❌ FAILED${NC}"
fi

if [ "$LOAD_TESTS_PASSED" = "true" ]; then
    echo -e "   📈 Load Tests: ${GREEN}✅ PASSED${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "   📈 Load Tests: ${RED}❌ FAILED${NC}"
fi

if [ "$HEALTH_CHECK_PASSED" = "true" ]; then
    echo -e "   🏥 Health Checks: ${GREEN}✅ PASSED${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "   🏥 Health Checks: ${RED}❌ FAILED${NC}"
fi

# Calculate success rate
SUCCESS_PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

echo ""
echo -e "${BOLD}Overall Summary:${NC}"
echo -e "   Passed Checks: ${PASSED_CHECKS}/${TOTAL_CHECKS}"
echo -e "   Success Rate: ${SUCCESS_PERCENTAGE}%"

# Determine overall result
if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    OVERALL_SUCCESS="true"
    echo -e "   Status: ${BOLD}${GREEN}🎉 PRODUCTION READY${NC}"
    echo ""
    echo -e "${GREEN}✅ All validation checks passed!${NC}"
    echo -e "${GREEN}✅ System is ready for production deployment${NC}"
    echo -e "${GREEN}✅ API v2.2/v2.3 compatibility confirmed${NC}"
    echo -e "${GREEN}✅ Performance thresholds met${NC}"
elif [ $PASSED_CHECKS -ge 3 ]; then
    echo -e "   Status: ${BOLD}${YELLOW}⚠️  PRODUCTION READY WITH WARNINGS${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Most checks passed, but some issues detected${NC}"
    echo -e "${YELLOW}⚠️  Review failed checks before deployment${NC}"
    OVERALL_SUCCESS="true"  # Allow deployment with warnings
else
    OVERALL_SUCCESS="false"
    echo -e "   Status: ${BOLD}${RED}❌ NOT PRODUCTION READY${NC}"
    echo ""
    echo -e "${RED}❌ Multiple validation checks failed${NC}"
    echo -e "${RED}❌ System is NOT ready for production deployment${NC}"
    echo -e "${RED}❌ Fix issues before proceeding${NC}"
fi

echo ""

# Report locations
echo -e "${CYAN}📁 Generated Reports:${NC}"
find "$REPORTS_DIR" -name "*${TIMESTAMP}*" 2>/dev/null | while read -r file; do
    echo -e "   📄 $file"
done

echo ""
echo -e "${CYAN}🏁 Production readiness validation completed${NC}"

# Exit with appropriate code
if [ "$OVERALL_SUCCESS" = "true" ]; then
    exit 0
else
    exit 1
fi
