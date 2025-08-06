#!/bin/bash

# API Schema Validation Script
# Validates API responses against OpenAPI specification
# Can be run locally or in CI

set -e

echo "🔍 API Schema Validation"
echo "========================"

# Check if server is running
if ! curl -s http://localhost:8000/api/v2/health > /dev/null 2>&1; then
    echo "⚠️  Warning: Local server not running at http://localhost:8000"
    echo "Please start the server with: deno task dev"
    echo "Or in another terminal: docker-compose up web"
    exit 1
fi

echo "✅ Server is running"

# Check if the validator script exists
if [ ! -f "scripts/newman-openapi-validator.js" ]; then
    echo "❌ Error: newman-openapi-validator.js not found"
    exit 1
fi

# Check if required dependencies exist in node_modules
MISSING_DEPS=""
if [ ! -d "node_modules/js-yaml" ]; then
    MISSING_DEPS="$MISSING_DEPS js-yaml"
fi
if [ ! -d "node_modules/ajv" ]; then
    MISSING_DEPS="$MISSING_DEPS ajv"
fi
if [ ! -d "node_modules/ajv-formats" ]; then
    MISSING_DEPS="$MISSING_DEPS ajv-formats"
fi

if [ -n "$MISSING_DEPS" ]; then
    echo "Installing required dependencies:$MISSING_DEPS"
    npm install --no-save $MISSING_DEPS
fi

# Check if Newman is available
if command -v newman &> /dev/null; then
    echo "✅ Using global Newman installation"
elif [ -f "node_modules/.bin/newman" ]; then
    echo "✅ Using local Newman installation"
else
    echo "Installing Newman..."
    npm install --no-save newman newman-reporter-html
fi

# Run the schema validation using Newman with the OpenAPI validator
echo ""
echo "Running OpenAPI schema validation..."
echo "------------------------------------"

# Run validation
node scripts/newman-openapi-validator.js \
    ./static/swagger/openapi.yml \
    ./tests/postman/collections/comprehensive.json \
    ./tests/postman/environments/comprehensive.json

VALIDATION_EXIT_CODE=$?

# Check results
if [ $VALIDATION_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Schema validation completed successfully!"
    echo "Check reports/openapi-validation-*.json for detailed results"
else
    echo ""
    echo "❌ Schema validation found issues!"
    echo "Check reports/openapi-validation-*.json for details"
fi

exit $VALIDATION_EXIT_CODE