#!/bin/bash

# Script to check API endpoint test coverage
# Compares routes defined in code vs OpenAPI spec vs tests

echo "🔍 API Endpoint Coverage Analysis"
echo "================================="

# Extract API routes from source code
echo ""
echo "📁 Extracting routes from source code..."
ROUTES_IN_CODE=$(find routes/api -name "*.ts" -o -name "*.tsx" | \
  xargs grep -h "export.*handler\|export.*GET\|export.*POST\|export.*PUT\|export.*DELETE" | \
  grep -v "export type" | \
  wc -l | tr -d ' ')

# Extract paths from OpenAPI spec
echo "📄 Extracting paths from OpenAPI spec..."
PATHS_IN_SPEC=$(grep -E "^\s+/api" static/swagger/openapi.yml | wc -l | tr -d ' ')

# Extract tested endpoints from Newman collections
echo "🧪 Extracting tested endpoints from Newman collections..."
TESTED_ENDPOINTS=$(find tests/postman/collections -name "*.json" | \
  xargs grep -h '"method":\|"path":\|"url":' | \
  grep -B1 -A1 "GET\|POST\|PUT\|DELETE" | \
  grep -E "/api/v[0-9]" | \
  sort -u | \
  wc -l | tr -d ' ')

# Calculate coverage
echo ""
echo "📊 Coverage Summary:"
echo "==================="
echo "Routes in code:        $ROUTES_IN_CODE"
echo "Paths in OpenAPI spec: $PATHS_IN_SPEC"
echo "Tested endpoints:      $TESTED_ENDPOINTS"

# Check for missing endpoints in OpenAPI
echo ""
echo "🔎 Checking for gaps..."

# List all API route files
echo ""
echo "API Route Files:"
find routes/api -name "*.ts" -o -name "*.tsx" | grep -v "_middleware" | sort

# Simple coverage percentage (tested/spec)
if [ $PATHS_IN_SPEC -gt 0 ]; then
  COVERAGE=$((TESTED_ENDPOINTS * 100 / PATHS_IN_SPEC))
  echo ""
  echo "📈 Test Coverage: $COVERAGE%"
  
  if [ $COVERAGE -lt 80 ]; then
    echo "⚠️  Warning: Test coverage is below 80%"
  else
    echo "✅ Good test coverage!"
  fi
fi

# Check for error response schemas
echo ""
echo "🔍 Checking error response schemas..."
ERROR_SCHEMAS=$(grep -c "ErrorResponse\|error.*Response\|400:\|404:\|500:" static/swagger/openapi.yml)
echo "Error response definitions found: $ERROR_SCHEMAS"

if [ $ERROR_SCHEMAS -lt 5 ]; then
  echo "⚠️  Warning: Few error response schemas defined"
  echo "   Consider adding standard error responses (400, 404, 500)"
fi

echo ""
echo "💡 Recommendations:"
echo "1. Ensure all routes have OpenAPI definitions"
echo "2. Add error response schemas for standard HTTP errors"
echo "3. Create tests for any untested endpoints"
echo "4. Run: node scripts/add-openapi-validation-to-newman.js"