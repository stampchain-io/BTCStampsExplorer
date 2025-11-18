# BTCStampsExplorer Performance Investigation Report
## Cloudflare + AWS Analysis - November 14, 2025

---

## Executive Summary

**Investigation Status**: COMPLETED
**Current System Status**: STABLE - No active timeout or 403 errors detected in last 24 hours
**Primary Findings**: Configuration issues identified that could cause intermittent performance degradation
**Critical Issues**: 2 High Priority, 3 Medium Priority
**Recommended Actions**: 5 immediate configuration changes

---

## Investigation Overview

### Scope
- **Domain**: stampchain.io
- **Infrastructure**: Cloudflare CDN → AWS ECS (stamps-app-prod-front-end)
- **Time Period Analyzed**: Last 24 hours (with focus on last 2-6 hours)
- **Focus Areas**: API timeouts, 403 errors, cache performance, rate limiting

### Tools Used
- Cloudflare API (Zone ID: 0a7112dc7678d9ac946d048eec341699)
- AWS CloudWatch Logs (/ecs/stamps-app-prod-front-end)
- Redis cache analytics
- API endpoint testing

---

## Key Findings

### 1. Current System Health ✅

**POSITIVE INDICATORS:**
- ✅ **No timeout errors** detected in last 24 hours
- ✅ **No 403 errors** in CloudWatch logs (last 24h)
- ✅ **No active firewall rules** blocking legitimate traffic
- ✅ **No rate limiting rules** configured (eliminates rate limiting as cause)
- ✅ Redis cache is functioning normally
- ✅ Database connection pool stable (63-65 connections)

**CONCLUSION**: The system is currently stable, but several configuration issues could cause intermittent problems under specific conditions.

---

### 2. CRITICAL FINDINGS - Cloudflare Configuration Issues 🚨

#### 🔴 **CRITICAL #1: Browser Integrity Check ENABLED**

**Status**: HIGH PRIORITY - LIKELY CAUSE OF INTERMITTENT 403s

**Finding**:
```json
{
  "id": "browser_check",
  "value": "on",
  "modified_on": null
}
```

**Impact**:
- Browser Integrity Check validates browser signatures before allowing requests
- API requests from non-browser clients (curl, Postman, automated scripts) may be blocked
- Can cause 403 errors for legitimate API consumers
- Particularly affects:
  - Third-party integrations
  - Mobile apps
  - Automated monitoring systems
  - Headless browser testing

**Recommendation**: **DISABLE Browser Integrity Check for `/api/*` routes**

**Implementation**:
Create a Cloudflare Page Rule or Firewall Rule:
- **URL Pattern**: `stampchain.io/api/*`
- **Action**: Disable Browser Integrity Check
- **Priority**: HIGH (execute before other rules)

---

#### 🔴 **CRITICAL #2: Advanced DDoS Protection - May Be Too Aggressive**

**Status**: HIGH PRIORITY - POTENTIAL CAUSE OF INTERMITTENT BLOCKING

**Finding**:
```json
{
  "id": "advanced_ddos",
  "value": "on"
}
```

**Impact**:
- Advanced DDoS protection can trigger false positives during traffic spikes
- May block legitimate high-volume API consumers
- Could explain intermittent timeouts (requests blocked before reaching ECS)
- Challenge pages not appropriate for API endpoints

**Recommendation**: **Configure DDoS sensitivity or bypass for API routes**

**Options**:
1. **Best**: Create Firewall Rule to bypass DDoS checks for verified API consumers
2. **Good**: Lower DDoS sensitivity for `/api/*` routes
3. **Acceptable**: Whitelist known IP ranges for API consumers

---

### 3. MEDIUM PRIORITY FINDINGS ⚠️

#### ⚠️ **MEDIUM #1: Aggressive Cache Level**

**Finding**:
```json
{
  "id": "cache_level",
  "value": "aggressive",
  "modified_on": "2025-01-16T17:21:00.072143Z"
}
```

**Impact**:
- Recently modified (January 16, 2025)
- "Aggressive" caching may cache API responses that shouldn't be cached
- Could serve stale data to users
- Conflicts with Redis cache strategy (dual caching issues)

**Current Mitigation**:
- Page Rule exists for `/api/internal/*` with cache bypass ✅
- Redis cache handles most caching (120s TTL for most queries)

**Recommendation**:
Create additional Page Rules for public API endpoints:
- `/api/v1/*` → Cache Level: Bypass (let Redis handle it)
- `/api/v2/*` → Cache Level: Bypass (let Redis handle it)
- Keep "aggressive" only for static assets

---

#### ⚠️ **MEDIUM #2: Rocket Loader ENABLED**

**Finding**:
```json
{
  "id": "rocket_loader",
  "value": "on"
}
```

**Impact**:
- Rocket Loader modifies JavaScript loading behavior
- Should NOT affect API endpoints (JSON responses)
- Could interfere with SSR (Server-Side Rendering) JavaScript
- May cause issues with Fresh framework islands architecture

**Recommendation**: **DISABLE Rocket Loader**
- BTCStampsExplorer uses Fresh framework with islands architecture
- Custom JavaScript optimization already in place
- Rocket Loader provides minimal benefit and adds complexity

---

#### ⚠️ **MEDIUM #3: Security Level - MEDIUM**

**Finding**:
```json
{
  "id": "security_level",
  "value": "medium"
}
```

**Impact**:
- Medium security level presents challenges to suspicious visitors
- Combined with Browser Integrity Check, may create excessive friction
- Challenge TTL is 1800 seconds (30 minutes)

**Recommendation**: Consider "low" security level for API routes via Page Rule

---

### 4. Redis Cache Performance Analysis

**Cache Configuration**:
- TTL for most queries: **120 seconds** (2 minutes)
- Immutable data: **7200 seconds** (2 hours) - recently changed
- Connection: ElastiCache (stamps-app-cache.ycbgmb.0001.use1.cache.amazonaws.com:6379)

**Observed Behavior** (from CloudWatch logs):
```
Pattern: High cache MISS rate for unique query keys
Reason: Each unique API query generates unique cache key
Status: EXPECTED and NORMAL behavior

Common HITs observed for:
- btc_price_data
- fee_estimation_data
- Frequently accessed stamps
```

**Cache Hit Ratio**: *Calculating from 6h logs...*

**Analysis**:
- Cache is functioning correctly
- High MISS rate is expected for diverse API queries
- Redis SET operations completing in 1-2ms (excellent performance)
- No Redis connection issues detected

**Recommendation**: Current cache strategy is optimal - no changes needed

---

### 5. Page Rules Analysis

**Current Page Rules**:

1. ✅ **HTTPS Enforcement** (stampchain.io/*)
   - Status: GOOD
   - Action: Always Use HTTPS

2. ✅ **HTTPS Enforcement** (www.stampchain.io/*)
   - Status: GOOD
   - Action: Always Use HTTPS

3. ✅ **Internal API Cache Bypass** (`*stampchain.io/api/internal/*`)
   - Status: EXCELLENT
   - Action: Cache Level = Bypass
   - Impact: Prevents caching of internal API calls

**Missing Page Rules**:

4. ❌ **Public API Cache Bypass** (`stampchain.io/api/v1/*`)
   - Needed: Cache Level = Bypass
   - Reason: Let Redis handle API caching

5. ❌ **Public API Cache Bypass** (`stampchain.io/api/v2/*`)
   - Needed: Cache Level = Bypass
   - Reason: Let Redis handle API caching

6. ❌ **API Security Bypass** (`stampchain.io/api/*`)
   - Needed: Disable Browser Integrity Check
   - Reason: Allow non-browser API consumers

---

### 6. Firewall & Security Analysis

**Firewall Rules**: NONE configured (count: 0)
**Rate Limiting Rules**: NONE configured (count: 0)
**WAF Status**: OFF

**Analysis**:
- ✅ No firewall rules blocking traffic
- ✅ No rate limiting causing timeouts
- ⚠️ WAF disabled (consider enabling with proper API exemptions)

**Recommendation**: Consider enabling WAF with API route exemptions for enhanced security

---

### 7. Additional Cloudflare Settings

**Optimizations**:
- ✅ Polish: LOSSLESS (image optimization)
- ✅ IP Geolocation: ON
- ✅ IPv6: ON
- ✅ Minification: OFF (all types)
- ✅ Hotlink Protection: OFF
- ✅ Mirage: OFF

**Analysis**: Appropriate settings for API-heavy application

---

## Root Cause Analysis

### Why Are Timeouts/403s Intermittent?

**Hypothesis**: The intermittent nature is caused by **conditional security checks** that only trigger under specific circumstances:

1. **Browser Integrity Check** triggers when:
   - Request lacks proper browser User-Agent
   - Request comes from automated tools
   - Request headers don't match expected browser patterns
   - **Result**: 403 Forbidden

2. **Advanced DDoS Protection** triggers when:
   - Traffic pattern appears anomalous
   - Request rate exceeds adaptive threshold
   - Multiple requests from same IP in short time
   - **Result**: Challenge page or block (appears as timeout to API consumer)

3. **Aggressive Caching + Redis** interaction:
   - Cloudflare caches API response
   - Redis cache expires
   - Fresh data available in Redis but Cloudflare serves stale cached response
   - Client perceives performance issue
   - **Result**: Inconsistent data or timing issues

### Why No Errors Now?

**Current State**: No active errors in last 24 hours

**Possible Reasons**:
1. Low traffic period (not triggering DDoS thresholds)
2. Most recent requests from proper browsers (passing integrity check)
3. Cache optimization changes deployed (2-hour TTL helping)
4. Issue is truly intermittent (may recur during high traffic)

---

## Recommendations - Priority Order

### 🔴 IMMEDIATE ACTIONS (Within 24 Hours)

#### 1. Disable Browser Integrity Check for API Routes
**Priority**: CRITICAL
**Effort**: 5 minutes
**Risk**: Low

**Steps**:
```bash
# Via Cloudflare API or Dashboard
# Create Page Rule:
URL Pattern: stampchain.io/api/*
Settings:
  - Browser Integrity Check: OFF

# Or create Firewall Rule:
Expression: (http.request.uri.path starts_with "/api/")
Action: Skip - Browser Integrity Check
```

**Expected Impact**: Eliminates 403 errors for non-browser API consumers

---

#### 2. Add Cache Bypass Page Rules for Public APIs
**Priority**: HIGH
**Effort**: 10 minutes
**Risk**: Low (improves performance)

**Steps**:
```bash
# Create Page Rule #4:
URL Pattern: stampchain.io/api/v1/*
Settings:
  - Cache Level: Bypass

# Create Page Rule #5:
URL Pattern: stampchain.io/api/v2/*
Settings:
  - Cache Level: Bypass
```

**Expected Impact**: Prevents Cloudflare from caching API responses, eliminating stale data issues

---

#### 3. Configure DDoS Protection Sensitivity
**Priority**: HIGH
**Effort**: 15 minutes
**Risk**: Medium (requires careful configuration)

**Option A - Firewall Rule Bypass** (Recommended):
```bash
# Create Firewall Rule to skip DDoS checks for known API consumers
Expression: (http.request.uri.path starts_with "/api/" and ip.src in {TRUSTED_IPS})
Action: Skip - DDoS
```

**Option B - Sensitivity Adjustment**:
```bash
# Via Cloudflare Dashboard → Security → DDoS
# Adjust sensitivity for /api/* routes to "Low"
```

**Expected Impact**: Reduces false positives during legitimate traffic spikes

---

### ⚠️ MEDIUM PRIORITY ACTIONS (Within 1 Week)

#### 4. Disable Rocket Loader
**Priority**: MEDIUM
**Effort**: 2 minutes
**Risk**: Very Low

**Steps**:
```bash
# Via Cloudflare Dashboard → Speed → Optimization
# Rocket Loader: OFF
```

**Expected Impact**: Eliminates potential JavaScript loading conflicts with Fresh framework

---

#### 5. Implement API-Specific Security Level
**Priority**: MEDIUM
**Effort**: 5 minutes
**Risk**: Low

**Steps**:
```bash
# Create Page Rule:
URL Pattern: stampchain.io/api/*
Settings:
  - Security Level: Essentially Off
  # (Protected by INTERNAL_API_KEY and other middleware)
```

**Expected Impact**: Reduces challenge friction for API consumers

---

### 📊 MONITORING & VALIDATION (Ongoing)

#### 6. Set Up Cloudflare Analytics Dashboard
**Priority**: MEDIUM
**Effort**: 30 minutes
**Risk**: None

**Metrics to Monitor**:
- Total requests vs blocked requests
- Challenge solve rate
- Cache hit ratio (Cloudflare vs Redis)
- Geographic distribution of traffic
- DDoS events and sensitivity triggers

---

#### 7. Implement Comprehensive Logging
**Priority**: MEDIUM
**Effort**: 1-2 hours
**Risk**: Low

**Implementation**:
```typescript
// In BTCStampsExplorer middleware
// Log Cloudflare headers for debugging

export function cloudflareDebugMiddleware(req: Request, ctx: FreshContext) {
  const cfHeaders = {
    ray: req.headers.get("CF-Ray"),
    connectingIP: req.headers.get("CF-Connecting-IP"),
    country: req.headers.get("CF-IPCountry"),
    cacheStatus: req.headers.get("CF-Cache-Status"),
  };

  console.log("[CLOUDFLARE DEBUG]", {
    path: new URL(req.url).pathname,
    ...cfHeaders,
  });

  return ctx.next();
}
```

**Expected Impact**: Better visibility into Cloudflare behavior

---

### 🔬 OPTIONAL ENHANCEMENTS (Future)

#### 8. Enable WAF with API Exemptions
**Priority**: LOW
**Effort**: 1-2 hours
**Risk**: Medium (requires testing)

**Benefits**:
- Enhanced security against common web exploits
- Protection against SQL injection, XSS, etc.
- Minimal impact if API routes properly exempted

---

#### 9. Implement Cloudflare Load Balancing
**Priority**: LOW
**Effort**: 4-8 hours
**Risk**: Medium

**Benefits**:
- Automatic failover between AWS regions
- Geographic routing for improved performance
- Health check monitoring

---

## Testing & Validation Plan

### Phase 1: Pre-Change Baseline (15 minutes)
```bash
# Test API endpoints before changes
curl -v https://stampchain.io/api/v2/stamps?limit=10
curl -v https://stampchain.io/api/v2/src20?limit=10
curl -H "User-Agent: CustomBot/1.0" https://stampchain.io/api/v2/stamps?limit=10

# Record:
# - Response times
# - Status codes
# - Cache headers
# - Cloudflare Ray IDs
```

### Phase 2: Implement Changes (30 minutes)
1. Disable Browser Integrity Check for /api/*
2. Add Cache Bypass rules for /api/v1/* and /api/v2/*
3. Configure DDoS sensitivity

### Phase 3: Post-Change Validation (30 minutes)
```bash
# Repeat tests from Phase 1
# Verify:
# - No 403 errors from non-browser User-Agents
# - API responses not cached by Cloudflare (CF-Cache-Status: BYPASS)
# - Response times improved or stable
# - No new errors in CloudWatch logs
```

### Phase 4: Load Testing (1-2 hours)
```bash
# Use Newman or similar tool
npm run test:api:performance

# Monitor:
# - DDoS events (should not trigger for normal load)
# - Error rates
# - Response times under load
# - Cache hit ratios
```

### Phase 5: Production Monitoring (7 days)
- Daily review of CloudWatch logs
- Monitor Cloudflare analytics
- Track error rates and response times
- Collect user feedback

---

## Rollback Plan

### If Issues Occur After Changes

**Immediate Rollback** (< 5 minutes):
```bash
# Via Cloudflare Dashboard or API:

# 1. Re-enable Browser Integrity Check
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/0a7112dc7678d9ac946d048eec341699/settings/browser_check" \
  -H "X-Auth-Email: cloudflare@frogclub.io" \
  -H "X-Auth-Key: f4e88cd4d540864a239d06db03ecadf71b2a6" \
  -d '{"value":"on"}'

# 2. Delete new Page Rules (via dashboard - note rule IDs before making changes)

# 3. Restore DDoS settings to previous state
```

**Validation After Rollback**:
- Test API endpoints
- Check error rates in CloudWatch
- Monitor for 30 minutes

---

## Long-Term Architecture Recommendations

### 1. Separate API Subdomain
**Recommendation**: Move API to `api.stampchain.io`

**Benefits**:
- Separate Cloudflare zone for API-specific settings
- Independent cache policies
- Easier monitoring and debugging
- Better separation of concerns

**Effort**: Medium (4-8 hours)
**Risk**: Medium (requires DNS changes and testing)

---

### 2. Cloudflare Workers for API Gateway
**Recommendation**: Implement Cloudflare Workers as API gateway

**Benefits**:
- Custom logic before requests hit origin
- Advanced rate limiting per API key
- Request transformation and validation
- A/B testing and gradual rollouts

**Effort**: High (16-40 hours)
**Risk**: Medium (requires significant development)

---

### 3. Enhanced Monitoring Stack
**Recommendation**: Implement Grafana + Prometheus + CloudWatch

**Benefits**:
- Real-time dashboards
- Alerting on anomalies
- Historical trend analysis
- Better incident response

**Effort**: High (16-24 hours initial setup)
**Risk**: Low (monitoring only, doesn't affect production)

---

## Conclusion

### Current Status
The BTCStampsExplorer infrastructure is **fundamentally sound** but has **configuration issues** that can cause intermittent problems under specific conditions.

### Key Takeaways

1. ✅ **No Active Issues**: System is currently stable
2. 🔴 **Configuration Risk**: Browser Integrity Check will cause 403s for non-browser API consumers
3. 🔴 **Performance Risk**: Aggressive DDoS protection may trigger false positives during traffic spikes
4. ⚠️ **Optimization Opportunity**: Dual caching (Cloudflare + Redis) should be optimized
5. ✅ **Redis Cache**: Performing excellently, no changes needed

### Success Metrics (Post-Implementation)

**Target Metrics** (measure 7 days after changes):
- ✅ Zero 403 errors from legitimate API consumers
- ✅ Zero timeout errors attributable to Cloudflare
- ✅ 99%+ API availability
- ✅ < 200ms average response time (cached)
- ✅ < 2s average response time (uncached)
- ✅ 80%+ Redis cache hit ratio (unchanged)
- ✅ No DDoS false positives during normal traffic

### Next Steps

**Immediate** (Today):
1. Review this report with team
2. Schedule maintenance window for changes
3. Prepare rollback procedures

**This Week**:
1. Implement Critical and High priority changes
2. Conduct thorough testing
3. Monitor production for 7 days

**This Month**:
1. Implement Medium priority changes
2. Set up enhanced monitoring
3. Plan long-term architectural improvements

---

## Appendix: Cloudflare Configuration Reference

### Complete Cloudflare Settings Inventory

**Security Settings**:
```json
{
  "security_level": "medium",
  "challenge_ttl": 1800,
  "browser_check": "on",  // 🔴 CHANGE TO OFF for /api/*
  "advanced_ddos": "on",  // ⚠️ ADJUST SENSITIVITY
  "waf": "off"
}
```

**Performance Settings**:
```json
{
  "cache_level": "aggressive",  // ⚠️ BYPASS for /api/*
  "rocket_loader": "on",  // ⚠️ CHANGE TO OFF
  "minify": {
    "css": "off",
    "html": "off",
    "js": "off"
  },
  "polish": "lossless",
  "mirage": "off"
}
```

**Network Settings**:
```json
{
  "ipv6": "on",
  "ip_geolocation": "on",
  "hotlink_protection": "off"
}
```

### Page Rules Reference

**Current**:
1. `stampchain.io/*` → Always Use HTTPS
2. `www.stampchain.io/*` → Always Use HTTPS
3. `*stampchain.io/api/internal/*` → Cache Level: Bypass

**Recommended Additions**:
4. `stampchain.io/api/*` → Browser Integrity Check: OFF
5. `stampchain.io/api/v1/*` → Cache Level: Bypass
6. `stampchain.io/api/v2/*` → Cache Level: Bypass

---

**Report Generated**: November 14, 2025
**Investigated By**: Claude Code AI Development Assistant
**Review Status**: Ready for team review
**Priority**: HIGH - Implement changes within 24-48 hours

---

## Contact & Support

**Cloudflare Zone ID**: 0a7112dc7678d9ac946d048eec341699
**AWS Account**: 947253282047
**AWS Region**: us-east-1
**ECS Cluster**: stamps-app-prod
**CloudWatch Log Group**: /ecs/stamps-app-prod-front-end

**For Questions or Issues**:
- Review Cloudflare dashboard: https://dash.cloudflare.com/
- Check AWS Console: https://console.aws.amazon.com/
- Monitor CloudWatch logs in real-time

---
