### Internal Endpoints Migration Plan

- Security enforcement (production):
  - Primary: Cloudflare Access headers (CF-Access-Client-Id / CF-Access-Client-Secret)
  - Secondary: X-Internal-Secret injected by Cloudflare Worker
  - Dev fallback: X-API-Key

- Headers to forward: Host, CF-Connecting-IP, X-Forwarded-For, X-Real-IP, X-Request-Id

- Move to API (requires DB/Redis/background services):
  - /api/internal/monitoring
  - /api/internal/background-fee-status
  - /api/internal/reset-connection-pool
  - /api/internal/purge-creator-cache
  - /api/internal/btc-price-status
  - /api/internal/stamp-recent-sales

- Keep in web (no DB/Redis or pure UI helpers) or proxy to API:
  - /api/internal/csrfToken
  - /api/internal/debug-headers
  - /api/internal/utxoquery (if not DB-dependent)

- Rollout steps:
  1) Implement middleware in API for internal security headers
  2) Migrate DB-backed internal endpoints to API, update routes
  3) Configure Cloudflare routes and secrets
  4) Remove DB/Redis init from web by setting DENO_ROLE=web post-cutover
  5) Keep proxy rules in web for any remaining internal paths

### Inventory Summary (from documentation/internal-endpoints-inventory.json)

- Move to API (Phase B):
  - /api/internal/monitoring (db, redis)
  - /api/internal/background-fee-status (redis)
  - /api/internal/reset-connection-pool (db)
  - /api/internal/purge-creator-cache (redis)
  - /api/internal/btc-price-status (db, redis)
  - /api/internal/stamp-recent-sales (db)
  - /api/internal/fees (external fee svc)
  - /api/internal/creatorName (db)
  - /api/internal/src20Background (db, redis)
  - /api/internal/test-reset-circuit-breakers ()
  - /api/internal/bitcoinNotifications (db, redis)
  - /api/internal/mara-health (external)
  - /api/internal/mara-fee-rate (external)
  - /api/internal/mara-submit (external)
  - /api/internal/fee-security (db, external)
  - /api/internal/btcPrice (db, redis)

- Keep in Web or Proxy (Phase C):
  - /api/internal/utxoquery (quicknode)
  - /api/internal/csrfToken ()
  - /api/internal/debug-headers ()
  - /api/internal/carousel (ui-only)

### CI Boundary Check

- Add a simple boundary script to fail if client islands import server modules:

```sh
#!/usr/bin/env bash
set -euo pipefail
if grep -R "from '\$server/" islands/ >/dev/null 2>&1; then
  echo "Boundary violation: islands importing $server/*" >&2
  grep -R "from '\$server/" islands/
  exit 1
fi
exit 0
```

- Wire into CI (pre-commit or pipeline) and/or a deno task:
```json
{
  "tasks": {
    "check:boundary": "bash ./scripts/check-boundary.sh"
  }
}
```

- Enforce as part of checks before deploy.


