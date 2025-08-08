#!/usr/bin/env bash
set -euo pipefail

if grep -R "from '\$server/" islands/ >/dev/null 2>&1; then
  echo "Boundary violation: islands importing $server/*" >&2
  grep -R "from '\$server/" islands/
  exit 1
fi

exit 0


