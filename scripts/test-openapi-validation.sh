#!/bin/bash

# Test script for OpenAPI validation
# This script runs a simple test to verify OpenAPI validation is working

echo "🧪 Testing OpenAPI Contract Validation"
echo "====================================="

# Check if OpenAPI spec exists
if [ ! -f "./static/swagger/openapi.yml" ]; then
    echo "❌ OpenAPI spec not found at ./static/swagger/openapi.yml"
    exit 1
fi

echo "✅ OpenAPI spec found"

# Check if validation is disabled
if [ "$OPENAPI_VALIDATION_DISABLED" = "true" ]; then
    echo "⚠️  OpenAPI validation is DISABLED (remove OPENAPI_VALIDATION_DISABLED to enable)"
else
    echo "✅ OpenAPI validation is ENABLED (default)"
fi

# Run a simple Deno test of the validator
echo ""
echo "Running validator unit tests..."
OPENAPI_VALIDATION_ENABLED=true deno test tests/unit/openapiValidator.test.ts --allow-read --allow-env

# Check if Newman OpenAPI validator exists
if [ -f "./scripts/newman-openapi-validator.js" ]; then
    echo ""
    echo "✅ Newman OpenAPI validator script found"
    echo ""
    echo "To run Newman tests with OpenAPI validation:"
    echo "  node scripts/newman-openapi-validator.js \\"
    echo "    ./static/swagger/openapi.yml \\"
    echo "    ./tests/postman/collections/comprehensive.json \\"
    echo "    ./tests/postman/environments/default.json"
else
    echo "❌ Newman OpenAPI validator script not found"
fi

echo ""
echo "📝 OpenAPI validation is enabled by default!"
echo "  - API responses include X-Schema-Validated header"
echo "  - To disable (not recommended): Add OPENAPI_VALIDATION_DISABLED=true to .env"
echo "  - All Newman tests now validate against OpenAPI schema automatically"