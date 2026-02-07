#!/usr/bin/env bash
#
# Pre-warm the Redis preview cache by requesting each stamp's preview endpoint.
# Rendered PNGs are cached in Redis with "never" TTL (immutable blockchain data).
#
# Usage:
#   bash scripts/prewarm-preview-cache.sh [BASE_URL] [DELAY_SECONDS]
#
# Examples:
#   bash scripts/prewarm-preview-cache.sh https://stampchain.io 3
#   bash scripts/prewarm-preview-cache.sh http://localhost:8000 0.5
#
set -euo pipefail

BASE_URL="${1:-http://localhost:8000}"
DELAY="${2:-3}"
PAGE_SIZE=50
PAGE=1
TOTAL_OK=0
TOTAL_FAIL=0
TOTAL_SKIP=0

echo "=== Preview Cache Pre-Warmer ==="
echo "Base URL: ${BASE_URL}"
echo "Delay between requests: ${DELAY}s"
echo ""

while true; do
  # Fetch a page of stamps
  RESPONSE=$(curl -s "${BASE_URL}/api/v2/stamps?limit=${PAGE_SIZE}&page=${PAGE}")

  # Extract stamp identifiers - look for stamp numbers
  STAMPS=$(echo "${RESPONSE}" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    stamps = data.get('data', [])
    if not stamps:
        sys.exit(0)
    for s in stamps:
        stamp_num = s.get('stamp')
        if stamp_num is not None:
            print(stamp_num)
except Exception as e:
    print(f'Error parsing response: {e}', file=sys.stderr)
    sys.exit(1)
" 2>/dev/null)

  # If no stamps returned, we've exhausted all pages
  if [ -z "${STAMPS}" ]; then
    echo ""
    echo "No more stamps on page ${PAGE}. Done."
    break
  fi

  STAMP_COUNT=$(echo "${STAMPS}" | wc -l)
  echo "Page ${PAGE}: processing ${STAMP_COUNT} stamps..."

  while IFS= read -r STAMP_ID; do
    [ -z "${STAMP_ID}" ] && continue

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
      "${BASE_URL}/api/v2/stamp/${STAMP_ID}/preview")

    if [ "${HTTP_CODE}" = "200" ]; then
      TOTAL_OK=$((TOTAL_OK + 1))
      echo "  [OK]   stamp ${STAMP_ID} -> ${HTTP_CODE}"
    elif [ "${HTTP_CODE}" = "302" ]; then
      TOTAL_SKIP=$((TOTAL_SKIP + 1))
      echo "  [SKIP] stamp ${STAMP_ID} -> ${HTTP_CODE} (redirect/fallback)"
    else
      TOTAL_FAIL=$((TOTAL_FAIL + 1))
      echo "  [FAIL] stamp ${STAMP_ID} -> ${HTTP_CODE}"
    fi

    sleep "${DELAY}"
  done <<< "${STAMPS}"

  PAGE=$((PAGE + 1))
done

echo ""
echo "=== Pre-Warm Complete ==="
echo "Cached (200): ${TOTAL_OK}"
echo "Skipped (302): ${TOTAL_SKIP}"
echo "Failed: ${TOTAL_FAIL}"
echo "Total processed: $((TOTAL_OK + TOTAL_SKIP + TOTAL_FAIL))"
