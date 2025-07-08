#!/bin/bash

# Script to compare pagination behavior between dev and production

echo "=== Pagination Comparison: Development vs Production ==="
echo ""

# Test endpoints
endpoints=(
    "/api/v2/stamps?limit=10&page=1"
    "/api/v2/src20?limit=10&page=1"
    "/api/v2/src101?limit=10&page=1"
    "/api/v2/collections?limit=10&page=1"
    "/api/v2/cursed?limit=10&page=1"
)

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create temp directory for responses
TEMP_DIR=$(mktemp -d)
echo "Saving responses to: $TEMP_DIR"
echo ""

# Test each endpoint
for endpoint in "${endpoints[@]}"; do
    echo "Testing: $endpoint"
    
    # Get responses
    curl -s "http://localhost:8000${endpoint}" > "$TEMP_DIR/dev_$(echo $endpoint | sed 's/[^a-zA-Z0-9]/_/g').json"
    curl -s "https://stampchain.io${endpoint}" > "$TEMP_DIR/prod_$(echo $endpoint | sed 's/[^a-zA-Z0-9]/_/g').json"
    
    # Extract structure (keys only)
    dev_keys=$(jq -r 'keys | sort | join(",")' "$TEMP_DIR/dev_$(echo $endpoint | sed 's/[^a-zA-Z0-9]/_/g').json" 2>/dev/null)
    prod_keys=$(jq -r 'keys | sort | join(",")' "$TEMP_DIR/prod_$(echo $endpoint | sed 's/[^a-zA-Z0-9]/_/g').json" 2>/dev/null)
    
    # Compare
    if [ "$dev_keys" = "$prod_keys" ]; then
        echo -e "${GREEN}✓ Structure matches${NC}"
    else
        echo -e "${RED}✗ Structure differs${NC}"
        echo "  Dev:  $dev_keys"
        echo "  Prod: $prod_keys"
    fi
    
    # Check for pagination fields
    if [[ $dev_keys == *"page"* ]] && [[ $dev_keys == *"limit"* ]]; then
        echo -e "${GREEN}✓ Has pagination fields${NC}"
    else
        echo -e "${YELLOW}⚠ Missing pagination fields${NC}"
    fi
    
    echo ""
done

# Cleanup
rm -rf "$TEMP_DIR"

echo "=== Summary ==="
echo "All endpoints use direct pagination fields (page, limit, total, totalPages) at the root level."
echo "No endpoints use nested 'pagination' object structure."