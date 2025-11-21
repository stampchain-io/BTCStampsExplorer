# Rate Limiter Testing Guide

## Quick Testing Commands

### 1. Start the Development Server
```bash
deno task dev
```

### 2. Test Health Check Exemption
Health checks should NOT be rate limited:
```bash
# Make 20 rapid requests - all should succeed
for i in {1..20}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/health; done
```
Expected: All 200 OK responses

### 3. Test Rate Limiting Enforcement
API endpoints SHOULD be rate limited:
```bash
# Make 200 rapid requests to stamps endpoint
for i in {1..200}; do
  curl -s -w "%{http_code} " http://localhost:8000/api/v2/stamps?limit=1
  if [ $((i % 20)) -eq 0 ]; then echo ""; fi
done
```
Expected: Should see 429 responses after ~180 requests

### 4. Test Rate Limit Headers
```bash
curl -i http://localhost:8000/api/v2/blocks | grep -i "X-RateLimit"
```
Expected headers:
- X-RateLimit-Limit: 240
- X-RateLimit-Remaining: 239
- X-RateLimit-Reset: [timestamp]

### 5. Test API Key Bypass
```bash
# Set your API key
export API_KEY="your-api-key-here"

# Make rapid requests with API key - should NOT be rate limited
for i in {1..250}; do
  curl -s -H "X-API-Key: $API_KEY" -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/v2/stamps?limit=1
done
```
Expected: All 200 OK responses (no 429)

### 6. Test Different Endpoint Tiers

#### SRC-20 (120 req/min = 2 req/sec)
```bash
for i in {1..130}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/v2/src20
done
```
Expected: 429 after ~120 requests

#### Stamps (180 req/min = 3 req/sec)
```bash
for i in {1..190}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/v2/stamps?limit=1
done
```
Expected: 429 after ~180 requests

#### Blocks (240 req/min = 4 req/sec)
```bash
for i in {1..250}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/v2/blocks?limit=1
done
```
Expected: 429 after ~240 requests

### 7. Test 429 Response Format
```bash
curl http://localhost:8000/api/v2/stamps?limit=1 # Repeat until rate limited
```
Expected response when rate limited:
```json
{
  "error": "Stamps API rate limit exceeded. Limit: 180 requests per minute.",
  "retryAfter": 30,
  "limit": 180,
  "window": 60,
  "blocked": true,
  "blockDuration": 300
}
```

### 8. Test IP Blocking
After rate limit exceeded, you should be blocked for the configured duration:
```bash
# After getting 429, try again immediately
curl -w "%{http_code}\n" http://localhost:8000/api/v2/stamps?limit=1
```
Expected: 429 with "You have been temporarily blocked" message

### 9. Monitor Redis Keys
```bash
# Connect to Redis
redis-cli

# View all rate limit keys
KEYS "ratelimit:*"

# Check specific IP rate limit
GET "ratelimit:/api/v2/stamps:127.0.0.1"

# Check if IP is blocked
GET "ratelimit:block:/api/v2/stamps:127.0.0.1"

# Clear rate limit for local testing
DEL "ratelimit:/api/v2/stamps:127.0.0.1"
DEL "ratelimit:block:/api/v2/stamps:127.0.0.1"
```

### 10. Enable Debug Logging
```bash
# Set environment variable
export RATE_LIMIT_DEBUG=true

# Restart dev server
deno task dev

# Watch logs for detailed rate limit information
```

## Automated Testing Script

Create a simple test script:

```bash
#!/bin/bash
# test-rate-limits.sh

BASE_URL="${BASE_URL:-http://localhost:8000}"

echo "Testing Rate Limiter Implementation"
echo "===================================="

# Test 1: Health check exemption
echo -e "\nTest 1: Health Check Exemption"
for i in {1..10}; do
  status=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/health)
  if [ "$status" -eq 429 ]; then
    echo "FAIL: Health check was rate limited"
    exit 1
  fi
done
echo "PASS: Health check is exempt"

# Test 2: Rate limiting enforcement
echo -e "\nTest 2: Rate Limiting Enforcement"
limited=false
for i in {1..200}; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v2/stamps?limit=1")
  if [ "$status" -eq 429 ]; then
    echo "PASS: Rate limiting enforced after $i requests"
    limited=true
    break
  fi
done

if [ "$limited" = false ]; then
  echo "WARNING: No rate limiting detected"
fi

echo -e "\n===================================="
echo "Testing Complete"
```

Make it executable:
```bash
chmod +x test-rate-limits.sh
./test-rate-limits.sh
```

## Troubleshooting

### Rate Limiter Not Working
1. Check Redis is running: `redis-cli ping` (should return PONG)
2. Check environment variables are set correctly
3. Enable debug logging: `export RATE_LIMIT_DEBUG=true`
4. Check logs for rate limiter errors

### False Positives
If you're getting rate limited too quickly:
1. Clear Redis keys: `redis-cli FLUSHDB` (careful in production!)
2. Restart development server
3. Check if multiple test runs are affecting counts

### No Rate Limiting
If no rate limiting is happening:
1. Verify middleware is wired correctly in `routes/api/_middleware.ts`
2. Check Redis connection in logs
3. Verify you're testing the right endpoints (`/api/v2/*`)

## Success Criteria

- Health checks are NOT rate limited
- Internal APIs are NOT rate limited
- API key bypass works
- Rate limits enforced at correct thresholds
- 429 responses include proper headers
- IP blocking works after violations
- Redis fail-open works (no errors if Redis down)
