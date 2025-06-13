#!/bin/sh

echo "=== Newman Simple API Testing ==="
echo "Node version:" && node --version
echo "NPM version:" && npm --version

echo "=== Installing Newman ==="
npm install -g newman newman-reporter-html
echo "Newman version:" && newman --version

ping -c 1 host.docker.internal || echo "host.docker.internal not reachable"
wget -q --spider http://host.docker.internal:8000/api/v2/stamps?limit=1 && echo "Development server is reachable" || echo "Development server is NOT reachable"
wget -q --spider https://stampchain.io/api/v2/stamps?limit=1 && echo "Production server is reachable" || echo "Production server is NOT reachable"

mkdir -p reports/newman-simple
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "Using timestamp: $TIMESTAMP"

newman run postman-collection-simple.json \
  --environment postman-environment.json \
  --reporters cli,html,json \
  --reporter-html-export reports/newman-simple/$TIMESTAMP-report.html \
  --reporter-json-export reports/newman-simple/$TIMESTAMP-results.json \
  --timeout-request 30000 \
  --color auto \
  --disable-unicode

echo "Simple test complete. Reports in: reports/newman-simple/"
ls -la reports/newman-simple/ 