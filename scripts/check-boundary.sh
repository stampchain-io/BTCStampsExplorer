#!/usr/bin/env bash
set -euo pipefail

if grep -R "from '\$server/" islands/ >/dev/null 2>&1; then
  echo "Boundary violation: islands importing $server/*" >&2
  grep -R "from '\$server/" islands/
  exit 1
fi

if grep -rnE "^\s*import\s+.*from\s+[\"'].*dataPlaceholderDev\.ts[\"']" \
  routes/ islands/ components/ server/ lib/ >/dev/null 2>&1; then
  echo "Boundary violation: static import of dev-only dataPlaceholderDev.ts (use dynamic import inside DATA_PLACEHOLDER_DEV check)" >&2
  grep -rnE "^\s*import\s+.*from\s+[\"'].*dataPlaceholderDev\.ts[\"']" \
    routes/ islands/ components/ server/ lib/
  exit 1
fi

exit 0


