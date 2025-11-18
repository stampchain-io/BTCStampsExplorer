# Rate Limiting Strategy for BTCStampsExplorer
## Preventive Protection Against API Abuse

---

## Current Status

**DDoS Analysis Results:**
- ✅ NO active attacks detected
- ✅ NO abuse patterns visible
- ✅ Advanced DDoS protection already enabled
- ⚠️ NO rate limiting configured = vulnerable to future abuse

**Recommendation**: Implement PREVENTIVE rate limiting before abuse occurs

---

## Rate Limiting Strategy

### Tier 1: General API Protection (ALL Endpoints)

**Rule**: Broad protection against basic abuse
- **Endpoint**: `/api/*`
- **Limit**: 300 requests per minute per IP
- **Action**: Challenge (CAPTCHA) → 1 minute timeout
- **Rationale**:
  - 300 req/min = 5 req/sec (generous for normal use)
  - Allows legitimate high-volume consumers
  - Catches simple automated abuse

---

### Tier 2: Expensive Endpoints (Higher Load)

**Rule**: Protect database-intensive queries
- **Endpoints**:
  - `/api/v1/stamps*`
  - `/api/v2/stamps*`
  - `/api/v1/blocks*`
  - `/api/v2/blocks*`
- **Limit**: 120 requests per minute per IP
- **Action**: Block → 5 minutes
- **Rationale**:
  - These endpoints hit database hardest
  - 120 req/min = 2 req/sec (still generous)
  - Prevents database saturation

---

### Tier 3: SRC-20 Endpoints (Known Pain Point)

**Rule**: Extra protection for problematic endpoint
- **Endpoints**:
  - `/api/v1/src20*`
  - `/api/v2/src20*`
- **Limit**: 60 requests per minute per IP
- **Action**: Block → 10 minutes
- **Rationale**:
  - Historical timeout issues on this endpoint
  - 60 req/min = 1 req/sec
  - Prevents cache thrashing
  - Protects database from complex SRC-20 queries

---

### Tier 4: Health Check & Internal APIs (More Lenient)

**Rule**: Allow monitoring and internal services
- **Endpoints**:
  - `/api/health`
  - `/api/internal/*` (already has API key auth)
- **Limit**: 600 requests per minute per IP
- **Action**: Log only (no blocking)
- **Rationale**:
  - Health checks need high frequency
  - Internal APIs protected by API key
  - Monitoring tools may poll frequently

---

## Implementation Methods

### Method 1: Cloudflare Firewall Rules (FREE PLAN) ✅ RECOMMENDED

**Advantages**:
- ✅ Available on all plans (including Free)
- ✅ Powerful expression language
- ✅ Can combine with other conditions
- ✅ Free to configure

**Limitations**:
- ⚠️ Rate limiting via firewall rules may require Pro plan
- ⚠️ Limited to 5 active firewall rules on Free plan

**Implementation**: Use Cloudflare Firewall Rules with rate limiting expressions

---

### Method 2: Cloudflare Rate Limiting (PRO PLAN)

**Advantages**:
- ✅ Dedicated rate limiting feature
- ✅ More granular control
- ✅ Better analytics

**Limitations**:
- ❌ Requires Pro plan ($20/month)
- ❌ Not currently available on Free plan

---

### Method 3: Application-Level Rate Limiting (MIDDLEWARE)

**Advantages**:
- ✅ Complete control
- ✅ Can differentiate authenticated users
- ✅ Can use API keys for bypass
- ✅ Works on all Cloudflare plans

**Limitations**:
- ⚠️ Requires code deployment
- ⚠️ Uses server resources
- ⚠️ Doesn't stop requests before they hit origin

**Implementation**: Deno Fresh middleware with Redis-backed rate limiter

---

## Recommended Implementation

### Phase 1: Cloudflare Firewall Rules (IMMEDIATE) ✅

Create firewall rules for basic protection:

**Rule 1: General API Rate Limit**
```
Expression: (http.request.uri.path contains "/api/") and (rate(http.request.uri.path, 300, 60) > 300)
Action: Challenge
Duration: 1 minute
```

**Rule 2: SRC-20 Protection**
```
Expression: (http.request.uri.path contains "/api/v") and (http.request.uri.path contains "/src20") and (rate(http.request.uri.path, 60, 60) > 60)
Action: Block
Duration: 10 minutes
```

**Note**: If firewall-based rate limiting requires Pro plan, proceed to Phase 2

---

### Phase 2: Application-Level Middleware (FALLBACK)

Implement in BTCStampsExplorer Deno Fresh application:

**File**: `server/middleware/rateLimiter.ts`

```typescript
import { FreshContext } from "$fresh/server.ts";
import { Redis } from "redis";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
}

const rateLimitConfigs: Record<string, RateLimitConfig> = {
  "/api/v1/src20": { windowMs: 60000, max: 60, message: "SRC-20 rate limit exceeded" },
  "/api/v2/src20": { windowMs: 60000, max: 60, message: "SRC-20 rate limit exceeded" },
  "/api/v1/stamps": { windowMs: 60000, max: 120 },
  "/api/v2/stamps": { windowMs: 60000, max: 120 },
  "/api/v1": { windowMs: 60000, max: 300 },
  "/api/v2": { windowMs: 60000, max: 300 },
};

export async function rateLimitMiddleware(
  req: Request,
  ctx: FreshContext
) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Skip rate limiting for internal APIs (protected by API key)
  if (pathname.startsWith("/api/internal/")) {
    return ctx.next();
  }

  // Find matching config
  const config = Object.entries(rateLimitConfigs)
    .find(([path]) => pathname.startsWith(path))?.[1];

  if (!config) {
    return ctx.next();
  }

  // Get client IP
  const clientIp = req.headers.get("CF-Connecting-IP") ||
                   req.headers.get("X-Forwarded-For") ||
                   "unknown";

  // Redis key for rate limiting
  const key = `ratelimit:${pathname}:${clientIp}`;

  try {
    const redis = await getRedisConnection();
    const current = await redis.incr(key);

    // Set expiry on first request
    if (current === 1) {
      await redis.pexpire(key, config.windowMs);
    }

    // Check if limit exceeded
    if (current > config.max) {
      const ttl = await redis.pttl(key);
      return new Response(
        JSON.stringify({
          error: config.message || "Rate limit exceeded",
          retryAfter: Math.ceil(ttl / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(ttl / 1000)),
            "X-RateLimit-Limit": String(config.max),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Date.now() + ttl),
          },
        }
      );
    }

    // Add rate limit headers
    const remaining = config.max - current;
    const headers = new Headers();
    headers.set("X-RateLimit-Limit", String(config.max));
    headers.set("X-RateLimit-Remaining", String(remaining));

    const response = await ctx.next();

    // Add headers to response
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error("[RATE LIMITER ERROR]", error);
    // Fail open - allow request if Redis fails
    return ctx.next();
  }
}
```

**Register in**: `main.ts`

```typescript
import { rateLimitMiddleware } from "./server/middleware/rateLimiter.ts";

await start(manifest, {
  plugins: [
    // ... existing plugins
  ],
  port: 8000,
  middlewares: [
    rateLimitMiddleware, // Add this
    // ... existing middlewares
  ],
});
```

---

## Rate Limit Response Headers

**Standard Headers** (following RFC 6585):
- `X-RateLimit-Limit`: Maximum requests allowed in window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds until client should retry

**Example Response**:
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699999999
Retry-After: 45

{
  "error": "SRC-20 rate limit exceeded",
  "retryAfter": 45
}
```

---

## Monitoring & Alerting

### CloudWatch Metrics to Track

```bash
# Count rate limit hits
aws logs tail /ecs/stamps-app-prod-front-end --since 1h | grep "429" | wc -l

# Identify top rate-limited IPs
aws logs tail /ecs/stamps-app-prod-front-end --since 24h | \
  grep "429" | \
  grep -oE "[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}" | \
  sort | uniq -c | sort -rn | head -10

# Rate limit effectiveness
aws logs tail /ecs/stamps-app-prod-front-end --since 1h | \
  grep -E "(429|RATE LIMIT)" | \
  awk '{print $1}' | \
  uniq -c
```

### Cloudflare Analytics

**Metrics to Monitor**:
- Total requests vs blocked/challenged
- Top blocked IPs and countries
- Challenge solve rate
- Bandwidth saved by rate limiting

**Access**:
- Dashboard → Analytics → Security

---

## Allowlist for Legitimate High-Volume Users

### API Key Bypass

**Implementation**: Check for valid API key before rate limiting

```typescript
export async function rateLimitMiddleware(req: Request, ctx: FreshContext) {
  // Check for API key bypass
  const apiKey = req.headers.get("X-API-Key");
  const validApiKey = Deno.env.get("PUBLIC_API_KEY");

  if (apiKey && apiKey === validApiKey) {
    // Bypass rate limiting for valid API key holders
    return ctx.next();
  }

  // ... rest of rate limiting logic
}
```

### IP Allowlist

**Cloudflare Firewall Rule**:
```
Expression: (ip.src in {TRUSTED_IP_1 TRUSTED_IP_2})
Action: Allow
Priority: 1 (execute first)
```

---

## Testing Rate Limits

### Test Script

```bash
#!/bin/bash
# File: scripts/test-rate-limiting.sh

API_BASE="https://stampchain.io/api"
ENDPOINT="/v2/src20?limit=10"

echo "Testing rate limiting on ${ENDPOINT}"
echo "Expected: 429 after 60 requests in 1 minute"
echo ""

for i in {1..70}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE}${ENDPOINT}")
  echo "Request $i: HTTP $STATUS"

  if [ "$STATUS" == "429" ]; then
    echo ""
    echo "✅ Rate limit triggered at request $i"
    curl -v "${API_BASE}${ENDPOINT}" 2>&1 | grep -i "retry-after\|ratelimit"
    break
  fi

  # Small delay to stay within 1 minute window
  sleep 0.8
done
```

---

## Recommended Limits by Cloudflare Plan

### Free Plan
- **General API**: 100 req/min per IP
- **SRC-20**: 30 req/min per IP
- **Method**: Application-level middleware (no plan limits)

### Pro Plan ($20/month)
- **General API**: 300 req/min per IP
- **SRC-20**: 60 req/min per IP
- **Expensive Endpoints**: 120 req/min per IP
- **Method**: Cloudflare Rate Limiting API

### Business Plan ($200/month)
- **General API**: 600 req/min per IP
- **SRC-20**: 120 req/min per IP
- **Authenticated**: 1200 req/min per API key
- **Method**: Advanced rate limiting with custom rules

---

## Gradual Rollout Plan

### Week 1: Logging Only
- Implement middleware with logging
- Monitor how many requests WOULD be blocked
- Identify legitimate high-volume users
- Adjust thresholds based on data

### Week 2: Challenge Mode
- Enable challenges (CAPTCHA) instead of blocks
- Monitor challenge solve rate
- Allowlist legitimate bots that can't solve CAPTCHAs

### Week 3: Block Mode
- Enable blocking for confirmed abusers
- Monitor false positive rate
- Fine-tune thresholds

### Week 4: Optimization
- Analyze effectiveness
- Adjust limits based on attack patterns
- Document and communicate limits to API consumers

---

## Communication Strategy

### API Documentation Updates

**Add Rate Limit Section**:

```markdown
## Rate Limits

To ensure fair usage and system stability, the following rate limits apply:

| Endpoint | Limit | Window | Action |
|----------|-------|--------|--------|
| `/api/v1/*` | 300 requests | 1 minute | Challenge |
| `/api/v2/*` | 300 requests | 1 minute | Challenge |
| `/api/*/src20` | 60 requests | 1 minute | Block (10 min) |
| `/api/*/stamps` | 120 requests | 1 minute | Block (5 min) |
| `/api/health` | Unlimited | - | Logging only |

**Response Headers**:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Timestamp when limit resets
- `Retry-After`: Seconds to wait before retrying

**Need higher limits?** Contact us for API key access.
```

---

## Success Metrics

### After 30 Days, Measure:

**Protection**:
- ✅ Zero successful DDoS attacks
- ✅ < 1% false positive rate
- ✅ Blocked malicious traffic volume

**Performance**:
- ✅ Maintained < 2s API response times
- ✅ No increase in server load
- ✅ Database saturation prevented

**User Experience**:
- ✅ Zero complaints from legitimate users
- ✅ Clear error messages with retry guidance
- ✅ API documentation updated and clear

---

## Emergency Procedures

### If Legitimate Traffic Blocked

**Immediate Actions**:
1. Identify blocked IP from CloudWatch logs
2. Add to allowlist temporarily
3. Issue API key for long-term access
4. Adjust threshold if needed

### If Under Active Attack

**Escalation**:
1. Lower thresholds temporarily (60 → 30 req/min)
2. Enable Cloudflare "Under Attack" mode
3. Enable stricter security level
4. Analyze attack pattern and add specific blocks

---

## Cost-Benefit Analysis

### Costs
- Development: 4-8 hours (middleware implementation)
- Testing: 2-4 hours
- Monitoring: 1 hour/week ongoing
- Cloudflare Pro (if needed): $20/month

### Benefits
- ✅ Prevented database saturation
- ✅ Protected from API abuse
- ✅ Improved uptime and reliability
- ✅ Better user experience for legitimate users
- ✅ Reduced infrastructure costs (less waste)

**ROI**: Prevents one major outage = $1000s saved

---

## Implementation Checklist

- [x] Analyze DDoS evidence (completed - no attacks found)
- [x] Design rate limiting strategy (completed - this document)
- [ ] Implement Cloudflare firewall rules (if available on plan)
- [ ] **OR** Implement application middleware (fallback)
- [ ] Add rate limit headers to responses
- [ ] Create test script and validate limits
- [ ] Update API documentation
- [ ] Monitor for 7 days in logging mode
- [ ] Enable challenge/block mode
- [ ] Set up alerting for high rate limit hits
- [ ] Create allowlist for known good actors
- [ ] Provide API keys for high-volume users

---

**Status**: Ready for implementation
**Priority**: HIGH (preventive protection)
**Risk**: LOW (easily adjustable/reversible)
**Effort**: 4-8 hours total

**Next Step**: Determine if Cloudflare firewall rate limiting is available on current plan, otherwise proceed with middleware implementation.
