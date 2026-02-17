# Redis Cache TTL Migration Notes

## Summary

This document records the completion of the Redis cache TTL migration (Task 16) and
infrastructure recommendations for post-deploy operations.

All `"never"` TTL values in `handleCache` / `setCachedData` call sites have been replaced
with explicit numeric durations. The `"never"` literal is retained in the codebase only as
a valid type (`number | "never"`) and in internal conditional logic inside `setCachedData`
itself — no live call site passes `"never"` as a TTL argument.

## Verification Status

Grep as of 2026-02-17 confirms zero remaining `"never"` TTL usages at call sites:

```
grep -rn '"never"' stampchain.io/routes/ stampchain.io/server/ \
  | grep -v 'number | "never"' \
  | grep -v '// ' \
  | grep -v 'Infinity'
```

Only matches remaining are the two implementation lines inside `databaseManager.ts`
that handle the `"never"` sentinel as a conditional branch — this is correct.

## TTL Values Applied

| Data type                | TTL value   | Seconds  |
|--------------------------|-------------|----------|
| Block / blockchain data  | 2 h         | 7 200    |
| SRC-20 / stamp data      | 1 h         | 3 600    |
| Preview images           | 7 days      | 604 800  |
| Static / rarely changing | 24 h        | 86 400   |
| Real-time / prices       | 5 min       | 300      |

## Infrastructure Recommendations

### 1. ElastiCache Eviction Policy

Change the Redis eviction policy from `volatile-lru` to `allkeys-lru` via the AWS
ElastiCache parameter group.

**Why**: `volatile-lru` only evicts keys that have a TTL set. Any key stored without a
TTL (e.g. a future regression where `"never"` is accidentally passed) will never be
evicted and will accumulate until memory is exhausted. `allkeys-lru` allows Redis to
evict ANY key under memory pressure, providing a safety net regardless of whether a key
has an expiry.

**How**:
1. Open the AWS ElastiCache console.
2. Navigate to Parameter Groups and create a new group (or modify the existing one if
   it is not shared with other clusters).
3. Set `maxmemory-policy` to `allkeys-lru`.
4. Apply the parameter group to the Redis cluster and initiate a cluster reboot.

### 2. Post-Deploy Monitoring

Watch the CloudWatch metric `DatabaseMemoryUsagePercentage` for the ElastiCache cluster.

**Expected behavior**: Memory usage should drop below 90% within 24 hours as TTL-expired
keys are evicted. Block-data keys (2 h TTL) will clear first; preview-image keys
(7-day TTL) will take longer but represent the largest memory savings.

**Alarm recommendation**: Set a CloudWatch alarm at 85% to alert before memory reaches
the critical threshold that causes connection failures.

### 3. Emergency Memory Relief

If memory remains at 100% after deploying the TTL fix and before the eviction cycle
completes, use the following procedure as a last resort:

```
redis-cli FLUSHDB
```

This clears **all** keys from the current database and causes a cache cold start — all
requests will hit the database until the cache warms up. Use only when the service is
otherwise unusable due to memory exhaustion.

Do **not** run `FLUSHALL` (which affects all databases); `FLUSHDB` scopes the clear to
the application database only.

### 4. Future Optimization: Move Preview Images to S3 + CloudFront

Preview images are currently stored as full base64-encoded PNG blobs in Redis
(600 KB – 2 MB per key). This is the dominant source of Redis memory consumption.

**Recommended architecture**:
1. On first render, generate the PNG and upload it to an S3 bucket.
2. Store only the S3 object key (a short string, e.g. `preview/stamp_12345.png`) in Redis
   instead of the full image data.
3. Serve previews through a CloudFront distribution backed by the S3 bucket with
   appropriate cache-control headers.

**Impact**: This reduces the per-preview Redis footprint from ~600 KB – 2 MB to ~30 bytes,
a reduction of 99%+. The 7-day TTL on the short key is inexpensive. CloudFront handles
edge caching and eliminates repeated S3 reads.

## Validating Key Expiry After Deploy

After deploying, confirm that preview keys and block-data keys have positive TTLs:

```bash
# Scan a sample of preview keys
SCAN 0 MATCH preview:* COUNT 100

# For each returned key, verify TTL is positive (not -1)
TTL <key-name>
```

A return value of `-1` means the key has no expiry set (permanent). A positive integer
confirms the key will expire. A return value of `-2` means the key does not exist.

All keys written after the TTL migration is deployed should return positive TTL values.
Keys written before the deploy (with the old `"never"` TTL) will show `-1` until they
are manually removed or Redis is flushed.

To clean up only pre-migration permanent keys without a full flush:

```bash
# Find keys with no TTL in the preview namespace
redis-cli --scan --pattern 'preview:*' | while read key; do
  ttl=$(redis-cli TTL "$key")
  if [ "$ttl" = "-1" ]; then
    redis-cli DEL "$key"
  fi
done
```
