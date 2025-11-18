# Rate Limiting Implementation Guide
## Application-Level Protection (No Cloudflare Pro Required)

---

## Implementation Status

✅ **Completed**:
1. Browser Integrity Check disabled
2. API cache bypass rules created
3. Rate limiting middleware created
4. Rate limiting strategy documented

⏸️ **Ready to Deploy**:
- Rate limiting middleware (requires code deployment)
- Testing and validation

---

## Why Application-Level?

**Cloudflare Rate Limiting** requires Pro plan ($20/month):
- ❌ Free plan error: `ratelimit.api.not_entitled.account`
- ✅ Solution: Implement in application code (FREE)

**Advantages of Application-Level**:
- ✅ Works on ALL Cloudflare plans (including Free)
- ✅ Full control over logic and thresholds
- ✅ Can differentiate by API key
- ✅ Integrates with existing Redis cache
- ✅ No additional monthly costs

**Trade-offs**:
- ⚠️ Requests still hit your origin server (not stopped at CDN edge)
- ⚠️ Uses server resources for rate limiting logic
- ✅ But: Very minimal overhead (~1-2ms per request)

---

## Step-by-Step Integration

### Step 1: Verify Middleware File ✅

File already created:
```
server/middleware/rateLimiter.ts
```

Features:
- ✅ Redis-backed rate limiting
- ✅ Per-IP tracking
- ✅ Configurable limits per endpoint
- ✅ Block duration support
- ✅ API key bypass
- ✅ Standard rate limit headers
- ✅ Graceful failure (fail open if Redis down)

---

### Step 2: Register Middleware in main.ts

**File**: `main.ts`

**Add Import**:
```typescript
import { rateLimitMiddleware } from "./server/middleware/rateLimiter.ts";
```

**Register Middleware**:
```typescript
await start(manifest, {
  plugins: [
    tailwind(tailwindConfig),
  ],
  port: 8000,
  middlewares: [
    rateLimitMiddleware, // Add this line - FIRST middleware (before others)
    // ... other middlewares
  ],
});
```

**Important**: Place `rateLimitMiddleware` FIRST in the middleware array so it runs before any expensive operations.

---

### Step 3: Update Environment Variables

**File**: `.env` (add these)

```bash
# Rate Limiting Configuration
RATE_LIMIT_DEBUG=false  # Set to true to see rate limit logs
PUBLIC_API_KEY=your_public_api_key_here  # Optional: For bypassing rate limits with API key
```

**Optional**: Generate a secure API key:
```bash
openssl rand -hex 32
```

---

### Step 4: Test Locally (REQUIRED Before Deploy)

**Start Development Server**:
```bash
deno task dev
```

**Run Rate Limit Test**:
```bash
./scripts/test-rate-limiting.sh
```

**Expected Output**:
```
Testing rate limiting on /api/v2/src20...
Expected: 429 after 60 requests in 1 minute

Request 1: HTTP 200
Request 2: HTTP 200
...
Request 60: HTTP 200
Request 61: HTTP 429 ← Should trigger here

✅ Rate limit triggered at request 61
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
Retry-After: 59
```

---

### Step 5: Deploy to Production

**Build**:
```bash
deno task build
```

**Deploy**:
```bash
deno task deploy
```

**Or use AWS deployment**:
```bash
./aws-deploy.sh
```

---

### Step 6: Monitor (First 24 Hours)

**Watch CloudWatch Logs for Rate Limit Hits**:
```bash
aws logs tail /ecs/stamps-app-prod-front-end --since 1h --format short | grep "RATE LIMITER"
```

**Expected Logs**:
```
[RATE LIMITER] IP 1.2.3.4 /api/v2/src20: 45/60 (15 remaining)
[RATE LIMITER EXCEEDED] IP 5.6.7.8 exceeded limit for /api/v2/src20: 61/60
[RATE LIMITER BLOCK] IP 5.6.7.8 blocked for 600s
```

**Check for False Positives**:
```bash
# Count unique IPs hitting rate limits
aws logs tail /ecs/stamps-app-prod-front-end --since 24h | \
  grep "RATE LIMITER EXCEEDED" | \
  grep -oE "[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}" | \
  sort | uniq -c | sort -rn
```

---

## Rate Limit Configuration

### Current Thresholds

| Endpoint | Limit | Window | Action | Block Duration |
|----------|-------|--------|--------|----------------|
| `/api/v*/src20*` | 60 req/min | 60s | 429 | 10 minutes |
| `/api/v*/stamps*` | 120 req/min | 60s | 429 | 5 minutes |
| `/api/v*/blocks*` | 120 req/min | 60s | 429 | 5 minutes |
| `/api/v1/*` | 300 req/min | 60s | 429 | 1 minute |
| `/api/v2/*` | 300 req/min | 60s | 429 | 1 minute |
| `/api/internal/*` | Unlimited | - | - | Skipped (API key protected) |
| `/api/health` | Unlimited | - | - | Skipped (monitoring) |

### Adjusting Thresholds

**File**: `server/middleware/rateLimiter.ts`

**Find Configuration**:
```typescript
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  "/api/v2/src20": {
    windowMs: 60000,    // Change window (milliseconds)
    max: 60,            // Change limit (requests)
    message: "...",     // Customize message
    blockDuration: 600, // Change block time (seconds)
  },
  // ... other configs
};
```

**After changing**: Redeploy application

---

## API Key Bypass (For High-Volume Users)

### Generating API Keys

```bash
# Generate secure API key
openssl rand -hex 32

# Add to .env
echo "PUBLIC_API_KEY=generated_key_here" >> .env
```

### Using API Keys

**Client Usage**:
```bash
curl -H "X-API-Key: your_api_key_here" \
  https://stampchain.io/api/v2/src20?limit=100
```

**Behavior**:
- ✅ Bypasses rate limiting completely
- ✅ No request counting
- ✅ Logged for monitoring

**Distributing Keys**:
1. Create unique key per trusted partner
2. Document key in partner agreement
3. Monitor usage via logs
4. Rotate keys periodically

---

## Testing Rate Limits

### Manual Testing

**Test 1: Normal Usage (Should Pass)**
```bash
# Should return 200
curl https://stampchain.io/api/v2/stamps?limit=10
```

**Test 2: Rapid Requests (Should Hit Limit)**
```bash
# Run 70 requests quickly
for i in {1..70}; do
  curl -s https://stampchain.io/api/v2/src20?limit=5
  sleep 0.8
done
```

**Test 3: API Key Bypass (Should Always Pass)**
```bash
# Should return 200 even after rate limit
for i in {1..100}; do
  curl -H "X-API-Key: your_key" https://stampchain.io/api/v2/src20?limit=5
done
```

---

### Automated Testing Script

**File**: `scripts/test-rate-limiting.sh` (create this)

```bash
#!/bin/bash

API_BASE="https://stampchain.io/api"
ENDPOINT="/v2/src20?limit=5"

echo "=== Rate Limiting Test ==="
echo "Endpoint: ${API_BASE}${ENDPOINT}"
echo "Expected: 429 after 60 requests"
echo ""

LIMIT_HIT=false

for i in {1..70}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE}${ENDPOINT}")

  if [ "$STATUS" == "429" ]; then
    echo "Request $i: HTTP 429 ✅ RATE LIMIT TRIGGERED"
    LIMIT_HIT=true

    # Get full response with headers
    echo ""
    curl -v "${API_BASE}${ENDPOINT}" 2>&1 | grep -E "HTTP|X-RateLimit|Retry-After"
    break
  elif [ $((i % 10)) -eq 0 ]; then
    # Show progress every 10 requests
    echo "Request $i: HTTP $STATUS"
  fi

  sleep 0.8  # ~75 requests per minute (should hit limit)
done

echo ""
if [ "$LIMIT_HIT" = true ]; then
  echo "✅ SUCCESS: Rate limiting working correctly"
else
  echo "❌ FAILURE: Rate limit never triggered (check configuration)"
fi
```

**Make executable**:
```bash
chmod +x scripts/test-rate-limiting.sh
```

---

## Troubleshooting

### Issue: Rate Limiting Not Working

**Check 1**: Middleware registered?
```bash
grep "rateLimitMiddleware" main.ts
```

**Check 2**: Redis connection working?
```bash
# Check logs for Redis errors
deno task dev | grep REDIS
```

**Check 3**: Rate limit debug enabled?
```bash
echo "RATE_LIMIT_DEBUG=true" >> .env
deno task dev
# Make requests, should see logs
```

---

### Issue: Too Many False Positives

**Symptom**: Legitimate users getting blocked

**Solutions**:
1. **Increase Thresholds**:
   ```typescript
   max: 120, // Was 60
   ```

2. **Reduce Block Duration**:
   ```typescript
   blockDuration: 60, // Was 600
   ```

3. **Issue API Keys** to high-volume users

---

### Issue: Rate Limits Too Lenient

**Symptom**: Abuse still occurring

**Solutions**:
1. **Decrease Thresholds**:
   ```typescript
   max: 30, // Was 60
   ```

2. **Increase Block Duration**:
   ```typescript
   blockDuration: 1800, // 30 minutes
   ```

3. **Add IP Blocklist** for known abusers:
   ```typescript
   // In middleware, add:
   const blockedIps = ["1.2.3.4", "5.6.7.8"];
   if (blockedIps.includes(clientIp)) {
     return new Response("Blocked", { status: 403 });
   }
   ```

---

### Issue: Redis Connection Failing

**Symptom**: All requests allowed (fail-open behavior)

**Check Redis**:
```bash
# Test Redis connection
redis-cli -h stamps-app-cache.ycbgmb.0001.use1.cache.amazonaws.com ping
```

**Fallback**: Rate limiting fails gracefully
- If Redis is down, requests proceed normally
- No rate limiting applied (better than blocking everyone)
- Fix Redis, rate limiting resumes automatically

---

## Monitoring Queries

### Daily Rate Limit Report

```bash
#!/bin/bash
# File: scripts/rate-limit-report.sh

echo "=== Rate Limit Report (Last 24 Hours) ==="
echo ""

# Total rate limit hits
TOTAL=$(aws logs tail /ecs/stamps-app-prod-front-end --since 24h | \
  grep "RATE LIMITER EXCEEDED" | wc -l)
echo "Total Rate Limit Hits: $TOTAL"

# Top blocked IPs
echo ""
echo "Top Blocked IPs:"
aws logs tail /ecs/stamps-app-prod-front-end --since 24h | \
  grep "RATE LIMITER EXCEEDED" | \
  grep -oE "[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}" | \
  sort | uniq -c | sort -rn | head -10

# Top blocked endpoints
echo ""
echo "Most Rate-Limited Endpoints:"
aws logs tail /ecs/stamps-app-prod-front-end --since 24h | \
  grep "RATE LIMITER EXCEEDED" | \
  grep -oE "/api/[^[:space:]]+" | \
  sort | uniq -c | sort -rn | head -10

echo ""
echo "=== End Report ==="
```

---

## Rollback Procedure

### If Rate Limiting Causes Issues

**Emergency Rollback** (disable rate limiting):

**Option 1**: Environment Variable
```bash
# Add to .env
DISABLE_RATE_LIMITING=true
```

**Update middleware**:
```typescript
export async function rateLimitMiddleware(req: Request, ctx: FreshContext) {
  // Emergency disable
  if (Deno.env.get("DISABLE_RATE_LIMITING") === "true") {
    return ctx.next();
  }
  // ... rest of middleware
}
```

**Option 2**: Remove from main.ts
```typescript
// Comment out middleware registration
middlewares: [
  // rateLimitMiddleware,  ← Comment this out
],
```

**Option 3**: Revert Git Commit
```bash
git revert HEAD
git push
```

---

## Success Criteria

### After 7 Days, Check:

**Protection** ✅:
- [ ] Zero successful DDoS or abuse attacks
- [ ] Blocked at least some malicious traffic
- [ ] Database saturation prevented

**False Positives** ✅:
- [ ] < 1% false positive rate
- [ ] Zero complaints from legitimate users
- [ ] API documentation updated with rate limits

**Performance** ✅:
- [ ] < 2ms overhead per request
- [ ] No increase in server load
- [ ] Response times unchanged

---

## Next Steps

1. ✅ Middleware created and ready
2. ⏸️ **Next**: Integrate into main.ts
3. ⏸️ Test locally with test script
4. ⏸️ Deploy to production
5. ⏸️ Monitor for 7 days
6. ⏸️ Adjust thresholds based on data
7. ⏸️ Document limits in API docs

---

**Status**: Ready for deployment
**Risk**: LOW (fail-open, easily reversible)
**Effort**: 30 minutes integration + testing
**Benefit**: Preventive protection against abuse

**Ready to deploy when you are!**
