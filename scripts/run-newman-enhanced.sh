#!/bin/sh

echo "=== Newman Enhanced API Testing System ==="
echo "Node version:" && node --version
echo "NPM version:" && npm --version

echo "=== Installing Newman and Dependencies ==="
npm install -g newman --no-fund
npm install -g newman-reporter-html --no-fund
echo "Newman version:" && newman --version

echo "=== Installing OpenAPI Schema Validator Dependencies ==="
# Check if schema validator exists
if [ -f "scripts/newman-schema-validator.mjs" ]; then
  echo "✅ OpenAPI schema validator found"
else
  echo "⚠️  OpenAPI schema validator not found, skipping schema validation"
fi

echo "=== Testing Network Connectivity ==="
ping -c 1 host.docker.internal || echo "host.docker.internal not reachable"
wget -q --spider http://host.docker.internal:8000/api/v2/stamps?limit=1 && echo "Development server is reachable" || echo "Development server is NOT reachable"
wget -q --spider https://stampchain.io/api/v2/stamps?limit=1 && echo "Production server is reachable" || echo "Production server is NOT reachable"

echo "=== Preparing Reports Directory ==="
mkdir -p reports/newman
chmod 755 reports/newman

echo "=== Running Newman API Tests ==="
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "Using timestamp: $TIMESTAMP"
echo "Using collection: ${NEWMAN_COLLECTION:-tests/postman/collections/comprehensive.json}"

newman run "${NEWMAN_COLLECTION:-tests/postman/collections/comprehensive.json}" \
  --environment "${NEWMAN_ENVIRONMENT:-postman-environment.json}" \
  --reporters cli,html,json \
  --reporter-html-export reports/newman/$TIMESTAMP-report.html \
  --reporter-json-export reports/newman/$TIMESTAMP-results.json

echo "=== Newman Test Execution Complete ==="

echo "=== Running OpenAPI Schema Validation ==="
if [ -f "scripts/newman-schema-validator.mjs" ] && [ -f "schema.yml" ]; then
  echo "🔍 Validating API responses against OpenAPI schema..."
  # Parse Newman JSON results and validate against schema
  node scripts/newman-schema-validator.mjs schema.yml reports/newman/$TIMESTAMP-results.json > reports/newman/$TIMESTAMP-schema-validation.log 2>&1
  
  if [ $? -eq 0 ]; then
    echo "✅ OpenAPI schema validation completed"
    echo "📋 Schema validation log: reports/newman/$TIMESTAMP-schema-validation.log"
  else
    echo "⚠️  OpenAPI schema validation encountered issues"
    echo "📋 Check log: reports/newman/$TIMESTAMP-schema-validation.log"
  fi
else
  echo "⚠️  Skipping OpenAPI schema validation (missing validator or schema.yml)"
fi

echo "=== All Tests Complete ==="
echo "Reports generated in: reports/newman/"
ls -la reports/newman/
echo "=== Newman Testing Complete ===" 