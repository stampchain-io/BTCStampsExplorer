# Internal API Security Documentation

## Overview

Internal API endpoints are protected using two different security guards based on their intended use:

### 1. InternalApiFrontendGuard
**For:** Endpoints that need to be accessible from the frontend (browser)
**Accepts:** 
- Browser requests from stampchain.io domain (via origin/referer headers)
- API requests with valid `X-API-Key: {INTERNAL_API_KEY}` header

**Used by:**
- `/api/internal/fees`
- `/api/internal/btcPrice`
- `/api/internal/mara-fee-rate`
- `/api/internal/mara-health`
- `/api/internal/stamp-recent-sales`
- And other frontend-facing endpoints

### 2. InternalRouteGuard
**For:** Admin/backend endpoints that should never be called from browsers
**Accepts:** 
- ONLY requests with valid `X-API-Key: {INTERNAL_API_KEY}` header

**Used by:**
- `/api/internal/purge-creator-cache`
- `/api/internal/monitoring`
- `/api/internal/mara-submit`
- `/api/internal/reset-connection-pool`
- And other admin endpoints

## Environment Variables

Required in production:
```bash
INTERNAL_API_KEY=your-secret-api-key
APP_DOMAIN=stampchain.io
ALLOWED_DOMAINS=stampchain.io,www.stampchain.io
```

## Testing

Use the provided scripts to test security:

```bash
# Test endpoint security
./scripts/test-internal-api-security.sh

# List all endpoints and their security
./scripts/list-internal-api-security.sh
```

## CloudFlare Compatibility

Both guards handle CloudFlare's proxy behavior:
- Check standard headers (Origin, Referer)
- Fall back to X-Forwarded-Host when behind CloudFlare
- API key authentication works regardless of proxy

## Adding New Endpoints

### Frontend-accessible endpoint:
```typescript
import { InternalApiFrontendGuard } from "$server/services/security/internalApiFrontendGuard.ts";

export const handler: Handlers = {
  async GET(req) {
    const originError = InternalApiFrontendGuard.requireInternalAccess(req);
    if (originError) return originError;
    
    // Your endpoint logic here
  }
};
```

### Backend-only endpoint:
```typescript
import { InternalRouteGuard } from "$server/services/security/internalRouteGuard.ts";

export const handler: Handlers = {
  async GET(req) {
    const accessError = InternalRouteGuard.requireAPIKey(req);
    if (accessError) return accessError;
    
    // Your endpoint logic here
  }
};
```