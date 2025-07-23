#!/bin/bash

# ========================================
# API Performance Test - SRC-20 Endpoints
# Tests the performance of API endpoints that use the optimized database queries
# ========================================

echo "🚀 Testing SRC-20 API Performance After Database Optimization..."
echo "=================================================="

# Function to test endpoint with timing
test_endpoint() {
    local url=$1
    local description=$2
    local expected_time=$3

    echo "📊 Testing: $description"
    echo "   URL: $url"

    # Measure response time
    start_time=$(date +%s%N)
    response=$(curl -s -w "\n%{http_code}\n%{time_total}" "$url" 2>/dev/null)
    end_time=$(date +%s%N)

    # Extract HTTP code and curl timing
    http_code=$(echo "$response" | tail -n2 | head -n1)
    curl_time=$(echo "$response" | tail -n1)

    # Calculate duration in milliseconds
    duration_ms=$(( (end_time - start_time) / 1000000 ))
    curl_time_ms=$(echo "$curl_time * 1000" | bc)

    echo "   HTTP Code: $http_code"
    echo "   Response Time: ${curl_time_ms}ms"

    # Performance analysis
    if (( $(echo "$curl_time < 0.5" | bc -l) )); then
        echo "   Status: ✅ EXCELLENT - Under 500ms"
    elif (( $(echo "$curl_time < 2.0" | bc -l) )); then
        echo "   Status: ⚠️ GOOD - Under 2s"
    else
        echo "   Status: ❌ SLOW - Over 2s"
    fi

    echo ""
}

# Test critical SRC-20 endpoints that use the optimized queries
echo "Testing endpoints that were affected by the slow database queries..."
echo ""

# Test 1: SRC-20 overview (excludes fully minted by default)
test_endpoint "https://stampchain.io/api/v2/src20" "SRC-20 Token Overview" 2.0

# Test 2: SRC-20 minting page data
test_endpoint "https://stampchain.io/api/v2/src20?sortBy=RECENT_DESC&limit=20" "Recent SRC-20 Tokens" 2.0

# Test 3: SRC-20 with explicit excludeFullyMinted (this was the slow query)
test_endpoint "https://stampchain.io/api/v2/src20?excludeFullyMinted=true&limit=10" "Mintable Tokens Only" 2.0

# Test 4: Internal trending endpoint
test_endpoint "https://stampchain.io/api/internal/src20/trending" "Trending SRC-20 Data" 3.0

echo "=================================================="
echo "📋 SUMMARY:"
echo ""
echo "✅ If all endpoints respond under 2s, the optimization is working!"
echo "⚠️  If still slow, the application code changes may not be deployed yet"
echo "📊 Remember: Database indexes are deployed, but app code changes are pending"
echo ""
echo "🎯 Expected improvement after full deployment:"
echo "   • Database queries: 1630+ seconds → <200ms"
echo "   • API responses: Much faster, especially for minting-related data"
echo "   • No more connection timeouts"
echo ""

# Test if we can detect any obvious improvements
echo "💡 QUICK CHECK:"
echo "   If the 'excludeFullyMinted=true' endpoint responds quickly,"
echo "   it means the database optimization is already helping!"
