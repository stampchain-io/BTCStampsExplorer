#!/bin/sh

echo "=== Newman Enhanced API Testing System ==="
echo "Node version:" && node --version
echo "NPM version:" && npm --version

echo "=== Installing Newman ==="
npm install -g newman
npm install -g newman-reporter-html
echo "Newman version:" && newman --version

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

newman run postman-collection-enhanced.json \
  --environment postman-environment.json \
  --reporters cli,html,json \
  --reporter-html-export reports/newman/$TIMESTAMP-report.html \
  --reporter-json-export reports/newman/$TIMESTAMP-results.json

echo "=== Test Execution Complete ==="
echo "Reports generated in: reports/newman/"
ls -la reports/newman/
echo "=== Newman Testing Complete ===" 