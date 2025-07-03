# V2.3 Regression Test Summary - Latest Run

Generated: 2025-07-03 21:04:30 UTC  
Session ID: test_1751576665819_s0zdu1yg7

## Executive Summary

The enhanced regression test detected **50 total differences** across 4 endpoints, including 30 structure/type validation issues that indicate potential API serialization problems.

## Test Statistics

- **Total Requests**: 11 (including new pagination tests)
- **Endpoints Tested**: 5
- **Endpoints with Differences**: 4
- **Status Code Mismatches**: 1
- **Total Field Differences**: 50
- **Structure/Type Issues**: 30 ⚠️

## Critical Findings

### 1. Type Validation Issues ⚠️

The test revealed systematic type inconsistencies in both environments:

#### Stamps Endpoints
- **Issue**: `stamp_id` fields are returning as strings instead of numbers
- **Affected**: Both development AND production
- **Impact**: Type mismatches could cause client-side parsing errors
- **Example**: Expected `stamp_id: 1125723` (number), got `stamp: "1125723"` (string)

#### Collections Endpoints  
- **Issue**: `collection_id` and `name` fields failing type validation
- **Affected**: Both development AND production
- **Impact**: Suggests the collections response structure may be different than expected

### 2. V2.3 Field Changes (All Detected ✅)

#### `/api/v2/stamps` List Endpoint
- **Added in v2.3**:
  - ✅ `marketData` - Market data object
  - ✅ `cacheStatus` - Data freshness indicator
  - ✅ `dispenserInfo` - Dispenser statistics
  - ✅ `metadata` - Additional metadata
- **Removed in v2.3**:
  - ✅ `stamp_base64` - Removed for 50-70% size reduction

#### `/api/v2/stamps/{id}` Detail Endpoint
- **Removed fields** (undocumented):
  - ❓ `floorPrice`
  - ❓ `floorPriceUSD`
  - ❓ `marketCapUSD`
  - **Note**: These appear to have moved into the `marketData` object

### 3. Invalid Tick Validation
- **Development**: ✅ Returns 400 Bad Request (correct)
- **Production**: ❌ Returns 200 OK (needs fix)
- **Endpoint**: `/api/v2/src20/tick/TOOLONG`

### 4. Data Precision Differences
- **Field**: `floorPriceUSD`
- **Dev Value**: 75.8862
- **Prod Value**: 75.88413
- **Impact**: Minor precision difference, likely due to different calculation timing

### 5. Pagination Test Results
- **Structure**: ✅ Both environments have correct pagination metadata
- **Fields Present**: `page`, `limit`, `total`, `totalPages`
- **Type Validation**: ✅ All pagination fields are numbers

## Detailed Structure Issues

```
🔧 STRUCTURE/TYPE ISSUES (30 total):
- Dev: stamps[0-9].stamp_id should be number (10 issues)
- Prod: stamps[0-9].stamp_id should be number (10 issues)
- Dev: stamps[0].stamp_id should be number (detail endpoint)
- Prod: stamps[0].stamp_id should be number (detail endpoint)
- Dev: collections[0-1].collection_id should be number (2 issues)
- Dev: collections[0-1].name should be string (2 issues)
- Prod: collections[0-1].collection_id should be number (2 issues)
- Prod: collections[0-1].name should be string (2 issues)
```

## Recommendations

### Immediate Actions Required

1. **Fix Type Issues** 🚨
   - Investigate why `stamp_id` is being serialized as string
   - Check JSON serialization settings in both environments
   - Ensure consistent type handling across all endpoints

2. **Document Field Migrations** 📝
   - Update changelog to document `floorPrice*` field relocations
   - Confirm these fields are available in `marketData` object

3. **Fix Production Validation** 🐛
   - Invalid SRC20 tick should return 400, not 200
   - This is a breaking change that needs immediate attention

### Testing Enhancements Applied

✅ **Pagination validation** - Now testing critical endpoints  
✅ **Type validation** - Catching serialization issues  
✅ **Structure validation** - Ensuring response consistency  
✅ **Enhanced reporting** - Clear separation of issues  

## Test Execution Details

- **Duration**: 4.7 seconds
- **Data Received**: 128.63kB
- **Average Response Time**: 379ms
- **Response Time Range**: 11ms - 1458ms

## Next Steps

1. Review and fix type serialization issues (HIGH PRIORITY)
2. Update API documentation for field migrations
3. Deploy tick validation fix to production
4. Run follow-up tests after fixes are implemented