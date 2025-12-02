# Rate Limiting Architecture - BTCStampsExplorer

## Overview

BTCStampsExplorer uses distributed rate limiting to protect the API from abuse while allowing legitimate users full access to the platform.

## How User IP Tracking Works

### The Key: Cloudflare's CF-Connecting-IP Header

All requests to stampchain.io flow through Cloudflare, which automatically adds the `CF-Connecting-IP` header containing the **user's real IP address**. This is critical for proper rate limiting.

### Request Flow Diagram

```
User (IP: 1.2.3.4) → Cloudflare → ALB → ECS (IP: 10.0.0.x) → Rate Limiter

Headers at ECS:
  CF-Connecting-IP: 1.2.3.4  ← User's REAL IP (from Cloudflare)
  X-Forwarded-For: 1.2.3.4   ← Also available
  X-Real-IP: 1.2.3.4         ← Also available
```

### Rate Limiter IP Detection Logic

From `server/middleware/rateLimiter.ts:71-88`:

```typescript
function getClientIp(req: Request): string {
  // Priority 1: Cloudflare header (most reliable)
  const cfIp = req.headers.get("CF-Connecting-IP");
  if (cfIp) return cfIp;

  // Priority 2: X-Forwarded-For fallback
  const xForwarded = req.headers.get("X-Forwarded-For");
  if (xForwarded) {
    return xForwarded.split(",")[0].trim();
  }

  // Priority 3: X-Real-IP fallback
  const xRealIp = req.headers.get("X-Real-IP");
  if (xRealIp) return xRealIp;

  return "unknown";
}
```

## Application Architecture

### Why Multiple Users DON'T Share Rate Limits

**BTCStampsExplorer uses Fresh Framework's Islands Architecture:**

1. **Server-Side Rendering (SSR)**: Route handlers directly call services/database
   - No HTTP API calls = No rate limiting applied
   - Rendering happens server-side, HTML sent to browser

2. **Client-Side Islands**: Interactive components make API calls from browser
   - Request originates from **user's browser**
   - Goes through Cloudflare (adds CF-Connecting-IP header)
   - Rate limiter tracks **user's real IP**, not ECS IP

### Verification

```bash
# Confirmed: NO internal HTTP API calls in server-side code
grep -r "fetch.*localhost" routes/ lib/ server/ --include="*.ts*"
# Result: 0 matches ✅

grep -r "fetch.*stampchain.io/api" routes/ lib/ server/ --include="*.ts*"
# Result: 0 matches ✅
```

## Rate Limit Tiers

Configured in `server/middleware/rateLimiter.ts:35-65`:

| Endpoint Pattern | Limit (req/min) | Limit (req/sec) | Block Duration |
|-----------------|----------------|-----------------|----------------|
| `/api/v2/src20` | 120 | 2/sec | 5 minutes |
| `/api/v2/stamps` | 180 | 3/sec | 5 minutes |
| `/api/v2/blocks` | 240 | 4/sec | 3 minutes |
| `/api/v2` (general) | 300 | 5/sec | 1 minute |

## Exemptions

### 1. Health Checks (`/api/health`)
```typescript
if (pathname === "/api/health") {
  return ctx.next(); // No rate limiting
}
```
**Why**: ALB health checks need high frequency access

### 2. Internal APIs (`/api/internal/*`)
```typescript
if (pathname.startsWith("/api/internal/")) {
  return ctx.next(); // No rate limiting
}
```
**Why**: Protected by API key authentication, not public

### 3. API Key Bypass
```typescript
const apiKey = req.headers.get("X-API-Key");
if (apiKey && validApiKey && apiKey === validApiKey) {
  return ctx.next(); // No rate limiting
}
```
**Why**: Authenticated API key holders have unlimited access

## Redis Storage

Rate limits are tracked in Redis with the following key patterns:

```
ratelimit:{pathname}:{clientIp}        # Request counter
ratelimit:block:{pathname}:{clientIp}  # Block status
```

**Example**:
```
Key: ratelimit:/api/v2/stamps:1.2.3.4
Value: 5 (requests made)
TTL: 60000ms (resets after 1 minute)
```

## Response Headers

All API responses include rate limit information:

```
X-RateLimit-Limit: 180           # Max requests per window
X-RateLimit-Remaining: 175       # Requests remaining
X-RateLimit-Reset: 1763748664412 # Unix timestamp when limit resets
```

### When Rate Limit Exceeded (429 Response)

```json
{
  "error": "SRC-20 API rate limit exceeded. Limit: 120 requests per minute.",
  "retryAfter": 45,
  "limit": 120,
  "window": 60,
  "blocked": true,
  "blockDuration": 300
}
```

Headers:
```
Status: 429 Too Many Requests
Retry-After: 45  # Seconds until can retry
X-RateLimit-Remaining: 0
```

## Testing Rate Limits

### Test User IP Tracking:
```bash
# From your browser (gets your real IP):
curl -I https://stampchain.io/api/v2/stamps?limit=1

# Check headers:
x-ratelimit-limit: 180
x-ratelimit-remaining: 179
```

### Test Rapid Requests:
```bash
for i in {1..5}; do
  curl -I "https://stampchain.io/api/v2/src20/deployments?limit=1" | grep x-ratelimit
done
```

Expected output shows decrementing remaining count:
```
x-ratelimit-remaining: 119
x-ratelimit-remaining: 118
x-ratelimit-remaining: 117
x-ratelimit-remaining: 116
x-ratelimit-remaining: 115
```

## Monitoring

### Check Rate Limit Status in Redis

```bash
# List all rate limit keys
redis-cli KEYS "ratelimit:*"

# Check specific IP's status
redis-cli GET "ratelimit:/api/v2/stamps:1.2.3.4"
redis-cli TTL "ratelimit:/api/v2/stamps:1.2.3.4"

# Check if IP is blocked
redis-cli GET "ratelimit:block:/api/v2/src20:1.2.3.4"
```

### CloudWatch Logs

```bash
# Check for rate limit exceeded events
aws logs tail /ecs/stamps-app-prod-front-end --since 1h \
  --filter-pattern "RATE LIMITER EXCEEDED"

# Check for blocked IPs
aws logs tail /ecs/stamps-app-prod-front-end --since 1h \
  --filter-pattern "RATE LIMITER BLOCK"
```

## Best Practices for Developers

### ✅ DO:
1. **Use services directly** in server-side routes (no HTTP API calls)
2. **Make API calls from islands** (client-side) when interactivity needed
3. **Check rate limit headers** when implementing API clients
4. **Use API keys** for automated tools and scripts

### ❌ DON'T:
1. **Make HTTP API calls from server-side routes** (bypasses Cloudflare)
2. **Hardcode API endpoints** as `localhost` or `127.0.0.1`
3. **Remove Cloudflare** from request path (breaks IP detection)
4. **Implement client-side API call loops** without rate limit awareness

## Troubleshooting

### Issue: Users reporting "Too many requests" errors

**Check**:
1. Are they behind a corporate proxy/VPN? (Multiple users may share IP)
2. Are they using automated scripts without API key?
3. Is there a DDoS attack in progress?

**Solution**:
- Provide them an API key for unlimited access
- Adjust rate limits if legitimate high-traffic pattern detected

### Issue: All users getting rate limited together

**This means Cloudflare IP detection is broken!**

**Check**:
1. Is Cloudflare active and routing traffic?
2. Is `CF-Connecting-IP` header being stripped?
3. Are requests bypassing Cloudflare somehow?

**Solution**:
- Verify Cloudflare proxy status (orange cloud icon)
- Check ALB isn't directly exposed to internet
- Test with `curl -I https://stampchain.io/api/health`

## Security Considerations

### Rate Limit Bypass Prevention

1. **API Key Security**: Store in environment variables, never in code
2. **Redis Security**: Network-isolated, no public access
3. **Cloudflare**: Required for accurate IP detection
4. **Fail-Open Behavior**: If Redis fails, requests allowed (prevents outage)

### Why Fail-Open?

From `server/middleware/rateLimiter.ts:254-260`:
```typescript
} catch (error) {
  console.error("[RATE LIMITER ERROR]", error);
  // Fail open - allow request if Redis fails
  return ctx.next();
}
```

**Better to have no rate limiting temporarily than block all legitimate users during Redis outage.**

## Future Enhancements

Potential improvements to consider:

1. **Distributed Rate Limiting**: Redis Cluster for high availability
2. **Dynamic Limits**: Adjust based on system load
3. **User Tiers**: Different limits for authenticated vs anonymous users
4. **IP Allowlist**: Whitelist known good actors
5. **Geo-based Limits**: Different limits by country/region
6. **Bot Detection**: Integrate with Cloudflare Bot Management

---

**Last Updated**: November 21, 2025
**Status**: ✅ Production Deployed and Working
**Monitoring**: CloudWatch + Redis
