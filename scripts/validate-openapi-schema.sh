#!/bin/bash

# OpenAPI Schema Validation Script
# Validates the OpenAPI specification file for correctness
# Does NOT require a running server

set -e

echo "🔍 OpenAPI Schema Validation"
echo "============================"
echo ""

# Check if OpenAPI file exists
OPENAPI_FILE="./schema.yml"
if [ ! -f "$OPENAPI_FILE" ]; then
    echo "❌ Error: OpenAPI file not found at $OPENAPI_FILE"
    exit 1
fi

echo "📄 Validating: $OPENAPI_FILE"
echo ""

# Use npx to run @redocly/cli without installation
echo "Running OpenAPI linter..."
npx @redocly/cli@latest lint "$OPENAPI_FILE" --config .redocly.yaml --format stylish || LINT_EXIT_CODE=$?

if [ ${LINT_EXIT_CODE:-0} -eq 0 ]; then
    echo ""
    echo "✅ OpenAPI schema is valid!"
else
    echo ""
    echo "❌ OpenAPI schema validation failed with errors"
    exit ${LINT_EXIT_CODE}
fi