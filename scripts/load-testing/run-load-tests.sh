#!/bin/bash

# =============================================================================
# BTCStampsExplorer - Load Testing Runner Script
# =============================================================================
# Wrapper script to run k6 load tests for production readiness validation
# Handles k6 installation, environment setup, and test execution
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-https://stampchain.io}"
TEST_ADDRESS="${TEST_ADDRESS:-bc1qrfne7jw6fk6r8kl6dlm0ktt6rv4e5nqp5y4yny}"
REPORTS_DIR="./reports"
LOAD_TEST_SCRIPT="./scripts/load-testing/production-load-test.js"

# Ensure reports directory exists
mkdir -p "$REPORTS_DIR"

echo -e "${CYAN}🚀 BTCStampsExplorer Load Testing Suite${NC}"
echo -e "${CYAN}======================================${NC}"
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${YELLOW}⚠️  k6 not found. Installing k6...${NC}"

    # Detect OS and install k6
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install k6
        else
            echo -e "${RED}❌ Homebrew not found. Please install k6 manually: https://k6.io/docs/getting-started/installation/${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Unsupported OS. Please install k6 manually: https://k6.io/docs/getting-started/installation/${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ k6 installed successfully${NC}"
fi

# Show current configuration
echo -e "${BLUE}📋 Test Configuration:${NC}"
echo -e "   Base URL: ${BASE_URL}"
echo -e "   Test Address: ${TEST_ADDRESS}"
echo -e "   Reports Directory: ${REPORTS_DIR}"
echo -e "   Load Test Script: ${LOAD_TEST_SCRIPT}"
echo ""

# Parse command line arguments
TEST_TYPE="${1:-smoke}"
SCENARIO="${2:-smoke_test}"

case "$TEST_TYPE" in
    "smoke")
        echo -e "${GREEN}🔥 Running SMOKE tests (basic functionality)${NC}"
        k6 run \
            --env BASE_URL="$BASE_URL" \
            --env TEST_ADDRESS="$TEST_ADDRESS" \
            --env K6_TEST_TYPE="all" \
            --scenarios smoke_test \
            "$LOAD_TEST_SCRIPT"
        ;;

    "load")
        echo -e "${YELLOW}📈 Running LOAD tests (normal traffic simulation)${NC}"
        k6 run \
            --env BASE_URL="$BASE_URL" \
            --env TEST_ADDRESS="$TEST_ADDRESS" \
            --env K6_TEST_TYPE="all" \
            --scenarios load_test \
            "$LOAD_TEST_SCRIPT"
        ;;

    "stress")
        echo -e "${RED}🔥 Running STRESS tests (high traffic simulation)${NC}"
        echo -e "${YELLOW}⚠️  This test may impact production performance!${NC}"
        read -p "Continue with stress testing? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            k6 run \
                --env BASE_URL="$BASE_URL" \
                --env TEST_ADDRESS="$TEST_ADDRESS" \
                --env K6_TEST_TYPE="all" \
                --scenarios stress_test \
                "$LOAD_TEST_SCRIPT"
        else
            echo -e "${BLUE}❌ Stress testing cancelled${NC}"
            exit 0
        fi
        ;;

    "spike")
        echo -e "${RED}⚡ Running SPIKE tests (sudden traffic burst)${NC}"
        echo -e "${YELLOW}⚠️  This test may impact production performance!${NC}"
        read -p "Continue with spike testing? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            k6 run \
                --env BASE_URL="$BASE_URL" \
                --env TEST_ADDRESS="$TEST_ADDRESS" \
                --env K6_TEST_TYPE="all" \
                --scenarios spike_test \
                "$LOAD_TEST_SCRIPT"
        else
            echo -e "${BLUE}❌ Spike testing cancelled${NC}"
            exit 0
        fi
        ;;

    "all")
        echo -e "${CYAN}🎯 Running ALL test scenarios${NC}"
        echo -e "${YELLOW}⚠️  This comprehensive test suite may take 15-20 minutes!${NC}"
        read -p "Continue with full test suite? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            k6 run \
                --env BASE_URL="$BASE_URL" \
                --env TEST_ADDRESS="$TEST_ADDRESS" \
                --env K6_TEST_TYPE="all" \
                "$LOAD_TEST_SCRIPT"
        else
            echo -e "${BLUE}❌ Full test suite cancelled${NC}"
            exit 0
        fi
        ;;

    "health")
        echo -e "${GREEN}🏥 Running HEALTH CHECK tests only${NC}"
        k6 run \
            --env BASE_URL="$BASE_URL" \
            --env TEST_ADDRESS="$TEST_ADDRESS" \
            --env K6_TEST_TYPE="health" \
            --scenarios smoke_test \
            "$LOAD_TEST_SCRIPT"
        ;;

    "api")
        echo -e "${BLUE}🔄 Running API VERSION tests only${NC}"
        k6 run \
            --env BASE_URL="$BASE_URL" \
            --env TEST_ADDRESS="$TEST_ADDRESS" \
            --env K6_TEST_TYPE="api" \
            --scenarios load_test \
            "$LOAD_TEST_SCRIPT"
        ;;

    *)
        echo -e "${RED}❌ Unknown test type: $TEST_TYPE${NC}"
        echo ""
        echo -e "${CYAN}Usage: $0 <test_type>${NC}"
        echo -e "${CYAN}Available test types:${NC}"
        echo -e "   smoke    - Basic functionality tests (30 seconds)"
        echo -e "   load     - Normal traffic simulation (9 minutes)"
        echo -e "   stress   - High traffic simulation (4 minutes)"
        echo -e "   spike    - Sudden traffic burst (1 minute)"
        echo -e "   all      - Run all scenarios (15-20 minutes)"
        echo -e "   health   - Health check tests only (30 seconds)"
        echo -e "   api      - API version tests only (9 minutes)"
        echo ""
        echo -e "${CYAN}Environment Variables:${NC}"
        echo -e "   BASE_URL      - Target URL (default: https://stampchain.io)"
        echo -e "   TEST_ADDRESS  - Bitcoin address for testing (default: provided)"
        echo ""
        echo -e "${CYAN}Examples:${NC}"
        echo -e "   $0 smoke                              # Quick smoke test"
        echo -e "   BASE_URL=http://localhost:8000 $0 load  # Load test against local dev"
        echo -e "   $0 health                             # Health checks only"
        exit 1
        ;;
esac

# Check test results
TEST_EXIT_CODE=$?

echo ""
echo -e "${CYAN}📊 Test Results Summary:${NC}"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Load tests PASSED - Production ready!${NC}"
    echo -e "${GREEN}   All performance thresholds met${NC}"
    echo -e "${GREEN}   Error rates within acceptable limits${NC}"
    echo -e "${GREEN}   API v2.2/v2.3 compatibility confirmed${NC}"
else
    echo -e "${RED}❌ Load tests FAILED - Performance issues detected${NC}"
    echo -e "${RED}   Some thresholds were not met${NC}"
    echo -e "${RED}   Review the detailed test output above${NC}"
    echo -e "${RED}   Check reports in ${REPORTS_DIR}/ directory${NC}"
fi

# List generated reports
echo ""
echo -e "${CYAN}📁 Generated Reports:${NC}"
find "$REPORTS_DIR" -name "load-test-*.html" -o -name "load-test-*.json" | sort -r | head -5 | while read -r file; do
    echo -e "   📄 $file"
done

echo ""
echo -e "${CYAN}🏁 Load testing completed${NC}"
exit $TEST_EXIT_CODE
