# Cloudflare Performance Quick Fixes
## TL;DR - Do These 3 Things NOW

---

## 🚨 CRITICAL FINDINGS

**Your system is stable NOW, but these configuration issues will cause intermittent problems:**

1. **Browser Integrity Check: ON** → Blocks non-browser API requests (curl, Postman, bots)
2. **Aggressive Cache Level** → Cloudflare caching API responses (should use Redis only)
3. **DDoS Protection Too Sensitive** → May block legitimate traffic spikes

---

## ⚡ IMMEDIATE FIXES (15 minutes total)

### Fix #1: Disable Browser Integrity Check for APIs (5 min)

**Problem**: API consumers getting 403 errors
**Solution**: Disable for `/api/*` routes

**Via Cloudflare Dashboard**:
1. Go to: Security → Settings → Browser Integrity Check
2. Turn it **OFF** globally, OR
3. Create Page Rule: `stampchain.io/api/*` → Browser Integrity Check: OFF

**Via Script**:
```bash
cd /Users/Shared/repos/StampchainWorkspace/BTCStampsExplorer/scripts
./cloudflare-performance-fixes.sh
```

---

### Fix #2: Bypass Cloudflare Cache for APIs (5 min)

**Problem**: Stale API data being served
**Solution**: Let Redis handle all API caching

**Via Cloudflare Dashboard**:
1. Go to: Rules → Page Rules
2. Create Rule: `stampchain.io/api/v1/*` → Cache Level: Bypass
3. Create Rule: `stampchain.io/api/v2/*` → Cache Level: Bypass

**Note**: `/api/internal/*` already has cache bypass ✅

---

### ~~Fix #3: Rocket Loader~~ (OPTIONAL - Skip This)

**Update**: Rocket Loader is fine! Keep it enabled.

**Why?**
- ✅ Only affects frontend HTML pages (improves website performance)
- ✅ Does NOT affect API endpoints at all (they return JSON, not HTML)
- ✅ Your API timeout issues are unrelated to Rocket Loader
- ⚠️ Disabling it may hurt your website performance

**Recommendation**: **LEAVE ROCKET LOADER ON**

**Exception**: Only disable if you see JavaScript errors or islands hydration issues

---

## 🧪 TEST YOUR CHANGES (5 min)

```bash
cd /Users/Shared/repos/StampchainWorkspace/BTCStampsExplorer/scripts
./test-api-cloudflare.sh
```

**What to check**:
- ✅ No 403 errors from non-browser User-Agents
- ✅ `CF-Cache-Status: BYPASS` in response headers
- ✅ Response times < 2 seconds

---

## 📊 MONITORING (Ongoing)

**Watch These Metrics**:
```bash
# CloudWatch logs for errors
aws logs tail /ecs/stamps-app-prod-front-end --since 2h --format short | grep -i "error\|403\|timeout"

# Cache hit ratio
aws logs tail /ecs/stamps-app-prod-front-end --since 6h --format short | \
  grep -E "REDIS CACHE (HIT|MISS)" | \
  awk '{if ($0 ~ /HIT/) hits++; else misses++} END {printf "Hit Ratio: %.2f%%\n", (hits/(hits+misses))*100}'
```

---

## 📋 CURRENT CONFIGURATION

### ✅ GOOD Settings (Keep These)
- ✅ No Rate Limiting rules
- ✅ No Firewall rules blocking traffic
- ✅ `/api/internal/*` cache bypass active
- ✅ HTTPS enforcement working
- ✅ Redis cache performing well

### 🔴 BAD Settings (Fix These)
- 🔴 Browser Integrity Check: **ON** (blocks non-browser API consumers)
- 🔴 Cache Level: **Aggressive** (conflicts with Redis for APIs)
- ⚠️ Advanced DDoS: **ON** (may need sensitivity adjustment)

### ✅ OK Settings (Can Leave As-Is)
- ✅ Rocket Loader: **ON** (helps frontend, doesn't affect API)

---

## 🎯 SUCCESS CRITERIA

**After fixes, you should see**:
- Zero 403 errors from legitimate API consumers
- All API responses have `CF-Cache-Status: BYPASS`
- Response times improved or stable
- No timeout errors in CloudWatch logs

---

## 🆘 IF SOMETHING BREAKS

**Rollback via Dashboard**:
1. Security → Settings → Browser Integrity Check: **ON**
2. Delete the new Page Rules you created
3. Speed → Optimization → Rocket Loader: **ON** (if needed)

**Rollback via API**:
```bash
# Re-enable Browser Integrity Check
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/0a7112dc7678d9ac946d048eec341699/settings/browser_check" \
  -H "X-Auth-Email: cloudflare@frogclub.io" \
  -H "X-Auth-Key: f4e88cd4d540864a239d06db03ecadf71b2a6" \
  -d '{"value":"on"}'
```

---

## 📚 FULL DOCUMENTATION

See: `PERFORMANCE_INVESTIGATION_CLOUDFLARE_AWS.md` for:
- Complete analysis of all settings
- Root cause analysis
- Long-term architectural recommendations
- Detailed monitoring strategies

---

## ⏱️ TIMELINE

**Right Now** (5 min):
- Read this document

**Today** (10 min):
- Implement the 2 critical fixes (Browser Check + Cache Bypass)
- Skip Rocket Loader (leave it enabled)
- Run test script
- Verify fixes in Cloudflare dashboard

**This Week**:
- Monitor CloudWatch logs daily
- Check for any 403/timeout errors
- Validate API consumers are working

**This Month**:
- Review long-term recommendations
- Consider separating API to `api.stampchain.io`
- Set up enhanced monitoring (Grafana/Prometheus)

---

**Generated**: November 14, 2025
**Status**: ✅ Ready to implement
**Risk Level**: LOW (changes are easily reversible)
**Expected Impact**: Eliminate intermittent 403 errors and improve API performance

**Questions?** Review the full report or check Cloudflare dashboard analytics.
