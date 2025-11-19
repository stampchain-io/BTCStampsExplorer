#!/bin/sh

echo "=== Newman Pagination Validation Testing ==="

# Install Newman
echo "Installing Newman..."
npm install -g newman newman-reporter-html newman-reporter-json --no-fund

# Create reports directory
mkdir -p reports/newman-pagination-validation

# Run tests
echo "Running pagination validation tests..."
newman run tests/postman/collections/pagination-validation.json \
  --env-var "base_url=${BASE_URL:-https://stampchain.io}" \
  --iteration-data postman-data-pagination-tests.json \
  --reporters cli,html,json \
  --reporter-json-export "reports/newman-pagination-validation/results.json" \
  --reporter-html-export "reports/newman-pagination-validation/report.html" \
  --timeout-request 30000 \
  --color on

echo "=== Testing Complete ==="
ls -la reports/newman-pagination-validation/