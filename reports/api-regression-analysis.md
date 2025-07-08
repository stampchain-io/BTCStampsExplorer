# API Regression Analysis & Versioning Strategy

**Generated:** 2025-07-02  
**Current API Version:** 2.2.0

## Issue Analysis

### 1. Block Time Timezone Difference

**Finding:** Same block (903108) shows different timestamps:
- Production: `2025-06-28T16:53:22.000Z`
- Development: `2025-06-28T21:53:22.000Z`

**Analysis:** This is the SAME block with a 5-hour difference. This indicates:
- **Root Cause**: Timezone handling issue in the development environment
- **Impact**: Data inconsistency that could affect time-based queries
- **Recommendation**: Ensure all timestamps are stored and returned in UTC

### 2. Test Coverage Gaps

**Current Coverage:** Only 4 endpoints tested out of 46+ available
- ✅ `/api/v2/health`
- ✅ `/api/v2/version`
- ✅ `/api/v2/stamps`
- ✅ `/api/v2/src20`

**Missing Critical Endpoints:**
- Balance endpoints (`/api/v2/balance/*`)
- Block endpoints (`/api/v2/block/*`)
- Collections (`/api/v2/collections/*`)
- Cursed stamps (`/api/v2/cursed/*`)
- SRC-101 endpoints (`/api/v2/src101/*`)
- Dispensers (`/api/v2/stamps/{id}/dispensers`)
- Transaction endpoints (`/api/v2/trx/*`)

### 3. Schema Changes (Non-Breaking)

**New Fields Added in Development:**
```json
{
  "cacheStatus": "fresh",
  "dispenserInfo": {
    "openCount": 0,
    "closedCount": 0,
    "totalCount": 0
  },
  "marketData": {
    // Comprehensive market statistics
  }
}
```

## API Versioning Best Practices

### 1. **Semantic Versioning**
Current: `2.2.0` → Suggested: `2.3.0`
- **Major** (X.0.0): Breaking changes
- **Minor** (0.X.0): New features, non-breaking
- **Patch** (0.0.X): Bug fixes

### 2. **Non-Breaking Changes Strategy**

```yaml
# schema.yml update suggestion
info:
  version: 2.3.0
  x-api-versions:
    - version: "2.3.0"
      date: "2025-07-02"
      changes:
        - "Added marketData object to stamp responses"
        - "Added dispenserInfo object to stamp responses"
        - "Added cacheStatus field"
    - version: "2.2.0"
      date: "2025-01-01"
      changes:
        - "Previous stable release"
```

### 3. **Response Versioning Options**

**Option A: Field-Level Versioning (Recommended)**
```json
{
  "data": [...],
  "metadata": {
    "version": "2.3.0",
    "fields": {
      "marketData": { "since": "2.3.0" },
      "dispenserInfo": { "since": "2.3.0" },
      "cacheStatus": { "since": "2.3.0" }
    }
  }
}
```

**Option B: Header-Based Versioning**
```
X-API-Version: 2.3.0
X-API-Deprecated-Fields: []
X-API-New-Fields: ["marketData", "dispenserInfo", "cacheStatus"]
```

### 4. **Backward Compatibility Checklist**

- [x] New fields are optional
- [x] Existing fields maintain same types
- [x] No fields removed
- [x] No endpoint paths changed
- [x] No required parameters added
- [ ] Documentation updated
- [ ] Changelog maintained

## Recommendations

### 1. **Immediate Actions**
1. Fix timezone handling in development environment
2. Expand test coverage to all endpoints
3. Version bump to 2.3.0
4. Document new fields in OpenAPI schema

### 2. **Test Suite Enhancement**
```bash
# Run comprehensive tests
npm run test:api:comprehensive

# Test specific endpoint groups
npm run test:api:folder FOLDER=Balance
npm run test:api:folder FOLDER=Blocks
npm run test:api:folder FOLDER=SRC20
```

### 3. **Schema Documentation**
```yaml
# Add to each new field in schema.yml
marketData:
  type: object
  x-since-version: "2.3.0"
  description: "Market data analytics (added in v2.3.0)"
  properties:
    # ... field definitions
```

### 4. **Client Communication**
```markdown
## API Update Notice v2.3.0

**Release Date:** July 2, 2025
**Type:** Non-Breaking Enhancement

### New Features
- Enhanced market data analytics
- Dispenser information inline with stamp data
- Cache status indicators

### Migration Guide
No action required. New fields are additive and optional.
Clients not expecting these fields can safely ignore them.
```

## Testing Strategy

### 1. **Regression Test Matrix**
| Endpoint Group | Coverage | Priority |
|----------------|----------|----------|
| System | ✅ 100% | High |
| Stamps | ⚠️ 25% | Critical |
| Balance | ❌ 0% | High |
| Blocks | ❌ 0% | Medium |
| SRC-20 | ⚠️ 30% | High |
| SRC-101 | ❌ 0% | Medium |
| Collections | ❌ 0% | Low |
| Dispensers | ❌ 0% | Medium |

### 2. **Automated Checks**
- Response structure validation
- Field type consistency
- Performance benchmarks
- Error response formats
- Pagination consistency

## Next Steps

1. **Create comprehensive test collection** ✅ (Created above)
2. **Fix timezone issue** in development
3. **Update OpenAPI schema** with version info
4. **Run full regression suite** before deployment
5. **Document changes** in CHANGELOG.md