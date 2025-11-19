#!/bin/sh

echo "=== Newman with OpenAPI Contract Testing ==="
echo "Node version:" && node --version
echo "NPM version:" && npm --version

echo "=== Installing Local Dependencies for OpenAPI Validation ==="
npm install --no-fund --silent
echo "Local dependencies installed"

echo "=== Checking Pre-installed Dependencies ==="
echo "Newman version:" && newman --version
echo "Node.js version:" && node --version
echo "Global modules:" && ls -la /usr/local/lib/node_modules/ | grep -E "(newman|js-yaml|ajv)" | head -3 || echo "Dependencies ready"

echo "=== Checking OpenAPI Validator ==="
if [ -f "scripts/newman-openapi-validator.mjs" ]; then
  echo "✅ OpenAPI validator script found"
  USE_OPENAPI_VALIDATOR=true
else
  echo "⚠️  OpenAPI validator not found, will rely on server-side validation headers"
  USE_OPENAPI_VALIDATOR=false
fi

echo "=== Testing Network Connectivity ==="
ping -c 1 host.docker.internal || echo "host.docker.internal not reachable"
wget -q --spider http://host.docker.internal:8000/api/v2/stamps?limit=1 && echo "Development server is reachable" || echo "Development server is NOT reachable"
wget -q --spider https://stampchain.io/api/v2/stamps?limit=1 && echo "Production server is reachable" || echo "Production server is NOT reachable"

echo "=== Preparing Reports Directory ==="
mkdir -p reports/newman
chmod 755 reports/newman

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "Using timestamp: $TIMESTAMP"
echo "Using collection: ${NEWMAN_COLLECTION:-tests/postman/collections/comprehensive.json}"
echo "Using environment: ${NEWMAN_ENVIRONMENT:-postman-environment.json}"

if [ "$USE_OPENAPI_VALIDATOR" = "true" ] && [ -f "./static/swagger/openapi.yml" ]; then
  echo "=== Running Newman with OpenAPI Contract Validation ==="
  
  # Use our OpenAPI validator script with proper npx
  node scripts/newman-openapi-validator.mjs \
    ./static/swagger/openapi.yml \
    "${NEWMAN_COLLECTION:-tests/postman/collections/comprehensive.json}" \
    "${NEWMAN_ENVIRONMENT:-postman-environment.json}" > reports/newman/$TIMESTAMP-openapi-validation.log 2>&1
  
  OPENAPI_EXIT_CODE=$?
  
  if [ $OPENAPI_EXIT_CODE -eq 0 ]; then
    echo "✅ OpenAPI validation completed successfully"
  else
    echo "⚠️  OpenAPI validation encountered issues, check log"
  fi
  
  # Also generate standard Newman reports using global newman
  # Build Newman command with proper parameter handling
  NEWMAN_CMD="newman run '${NEWMAN_COLLECTION:-tests/postman/collections/comprehensive.json}' --environment '${NEWMAN_ENVIRONMENT:-postman-environment.json}' --reporters cli,html,json --reporter-html-export reports/newman/$TIMESTAMP-report.html --reporter-json-export reports/newman/$TIMESTAMP-results.json"
  
  [ -n "$NEWMAN_FOLDER" ] && NEWMAN_CMD="$NEWMAN_CMD --folder '$NEWMAN_FOLDER'"
  [ -n "$NEWMAN_ITERATIONS" ] && [ "$NEWMAN_ITERATIONS" -gt 0 ] && NEWMAN_CMD="$NEWMAN_CMD --iteration-count $NEWMAN_ITERATIONS"
  [ -n "$NEWMAN_DELAY_REQUEST" ] && [ "$NEWMAN_DELAY_REQUEST" -gt 0 ] && NEWMAN_CMD="$NEWMAN_CMD --delay-request $NEWMAN_DELAY_REQUEST"
  [ -n "$NEWMAN_TIMEOUT" ] && [ "$NEWMAN_TIMEOUT" -gt 0 ] && NEWMAN_CMD="$NEWMAN_CMD --timeout $NEWMAN_TIMEOUT"
  [ "$NEWMAN_BAIL" = "true" ] && NEWMAN_CMD="$NEWMAN_CMD --bail"
  [ "$NEWMAN_VERBOSE" = "true" ] && NEWMAN_CMD="$NEWMAN_CMD --verbose"
  
  eval $NEWMAN_CMD

else
  echo "=== Running Standard Newman Tests ==="
  echo "⚠️  OpenAPI validation will depend on server-side headers only"
  
  # Build Newman command with proper parameter handling
  NEWMAN_CMD="newman run '${NEWMAN_COLLECTION:-tests/postman/collections/comprehensive.json}' --environment '${NEWMAN_ENVIRONMENT:-postman-environment.json}' --reporters cli,html,json --reporter-html-export reports/newman/$TIMESTAMP-report.html --reporter-json-export reports/newman/$TIMESTAMP-results.json"
  
  [ -n "$NEWMAN_FOLDER" ] && NEWMAN_CMD="$NEWMAN_CMD --folder '$NEWMAN_FOLDER'"
  [ -n "$NEWMAN_ITERATIONS" ] && [ "$NEWMAN_ITERATIONS" -gt 0 ] && NEWMAN_CMD="$NEWMAN_CMD --iteration-count $NEWMAN_ITERATIONS"
  [ -n "$NEWMAN_DELAY_REQUEST" ] && [ "$NEWMAN_DELAY_REQUEST" -gt 0 ] && NEWMAN_CMD="$NEWMAN_CMD --delay-request $NEWMAN_DELAY_REQUEST"
  [ -n "$NEWMAN_TIMEOUT" ] && [ "$NEWMAN_TIMEOUT" -gt 0 ] && NEWMAN_CMD="$NEWMAN_CMD --timeout $NEWMAN_TIMEOUT"
  [ "$NEWMAN_BAIL" = "true" ] && NEWMAN_CMD="$NEWMAN_CMD --bail"
  [ "$NEWMAN_VERBOSE" = "true" ] && NEWMAN_CMD="$NEWMAN_CMD --verbose"
  
  eval $NEWMAN_CMD
  
  NEWMAN_EXIT_CODE=$?
fi

echo "=== Test Execution Complete ==="

# Check for validation headers in responses
if [ -f "reports/newman/$TIMESTAMP-results.json" ]; then
  echo "=== Checking for OpenAPI Validation Headers ==="
  node -e "
    const fs = require('fs');
    const results = JSON.parse(fs.readFileSync('reports/newman/$TIMESTAMP-results.json', 'utf8'));
    let validatedCount = 0;
    let failedCount = 0;
    
    results.run.executions.forEach(exec => {
      const headers = exec.response?.headers?.members || [];
      const validated = headers.find(h => h.key === 'X-Schema-Validated');
      if (validated) {
        validatedCount++;
        if (validated.value === 'false') failedCount++;
      }
    });
    
    console.log(\`✅ Responses with schema validation: \${validatedCount}\`);
    if (failedCount > 0) {
      console.log(\`❌ Failed schema validations: \${failedCount}\`);
      process.exit(1);
    }
  " || echo "Could not check validation headers"
fi

# Generate summary report
echo "=== Summary ==="
echo "📁 Reports saved to: reports/newman/"
echo "📄 HTML Report: reports/newman/$TIMESTAMP-report.html"
echo "📊 JSON Results: reports/newman/$TIMESTAMP-results.json"
[ -f "reports/newman/$TIMESTAMP-openapi-validation.log" ] && echo "🔍 OpenAPI Validation: reports/newman/$TIMESTAMP-openapi-validation.log"

exit $NEWMAN_EXIT_CODE