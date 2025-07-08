#!/bin/bash

# run-newman-comprehensive.sh
# Runs comprehensive Newman tests with full regression collection

set -e

echo "=== Newman Comprehensive API Testing ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

echo "=== Installing Newman ==="
npm install -g newman newman-reporter-html
echo "Newman version: $(newman --version)"

# Test connectivity
echo "=== Testing Connectivity ==="
ping -c 1 host.docker.internal || echo "host.docker.internal not reachable"
wget -q --spider "${DEV_BASE_URL}/api/v2/stamps?limit=1" && echo "Development server is reachable" || echo "Development server is NOT reachable"
wget -q --spider "${PROD_BASE_URL}/api/v2/stamps?limit=1" && echo "Production server is reachable" || echo "Production server is NOT reachable"

# Create reports directory
REPORT_DIR="reports/${REPORT_PREFIX}"
mkdir -p "${REPORT_DIR}"

echo "=== Running Comprehensive Newman Tests ==="
echo "Collection: ${NEWMAN_COLLECTION}"
echo "Environment: ${NEWMAN_ENVIRONMENT}"
echo "Folder: ${NEWMAN_FOLDER}"
echo "Reports: ${REPORT_DIR}"

# Build Newman command
NEWMAN_CMD="newman run ${NEWMAN_COLLECTION}"
NEWMAN_CMD="${NEWMAN_CMD} --environment ${NEWMAN_ENVIRONMENT}"
NEWMAN_CMD="${NEWMAN_CMD} --reporters ${NEWMAN_REPORTERS}"
NEWMAN_CMD="${NEWMAN_CMD} --reporter-html-export ${REPORT_DIR}/test-report.html"
NEWMAN_CMD="${NEWMAN_CMD} --reporter-json-export ${REPORT_DIR}/test-results.json"
NEWMAN_CMD="${NEWMAN_CMD} --timeout-request ${NEWMAN_TIMEOUT}"
NEWMAN_CMD="${NEWMAN_CMD} --iteration-count ${NEWMAN_ITERATIONS}"
NEWMAN_CMD="${NEWMAN_CMD} --delay-request ${NEWMAN_DELAY_REQUEST}"
NEWMAN_CMD="${NEWMAN_CMD} --color auto"
NEWMAN_CMD="${NEWMAN_CMD} --disable-unicode"

# Add optional parameters
if [ "${NEWMAN_VERBOSE}" = "true" ]; then
  NEWMAN_CMD="${NEWMAN_CMD} --verbose"
fi

if [ "${NEWMAN_BAIL}" = "true" ]; then
  NEWMAN_CMD="${NEWMAN_CMD} --bail"
fi

if [ -n "${NEWMAN_FOLDER}" ]; then
  NEWMAN_CMD="${NEWMAN_CMD} --folder '${NEWMAN_FOLDER}'"
fi

echo "Running command: $NEWMAN_CMD"
eval $NEWMAN_CMD

echo "=== Test Complete ==="
echo "Reports saved in: ${REPORT_DIR}/"
ls -la "${REPORT_DIR}/" 