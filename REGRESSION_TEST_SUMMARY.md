# V2.3 Regression Test Summary

Generated: 2025-07-03

## Executive Summary

The regression test successfully detected 19 differences between development (v2.3) and production (v2.2) environments across 3 endpoints. All expected v2.3 changes were detected, but some undocumented field removals require review.

## Test Results

### ✅ Expected Changes Detected

#### 1. `/api/v2/stamps` List Endpoint
- **Added fields (v2.3):**
  - ✅ `marketData` - New market data object
  - ✅ `cacheStatus` - Data freshness indicator
  - ✅ `dispenserInfo` - Dispenser statistics
  - ✅ `metadata` - Additional metadata field
- **Removed fields (v2.3):**
  - ✅ `stamp_base64` - Removed from list responses for performance (50-70% size reduction)

#### 2. Invalid Tick Validation (`/api/v2/src20/tick/TOOLONG`)
- ✅ Dev: Returns 400 Bad Request (correct behavior)
- ✅ Prod: Returns 200 OK (incorrect - needs fixing in production)

### ⚠️ Undocumented Changes Requiring Review

#### `/api/v2/stamps/{id}` Detail Endpoint
The following fields were found in production but NOT in development:
- ❓ `floorPrice`
- ❓ `floorPriceUSD` 
- ❓ `marketCapUSD`

**REVIEW NEEDED:** These field removals are not documented in the v2.3 changelog. Consider:
1. If these fields are being replaced by the new `marketData` object, this should be explicitly documented as a breaking change
2. If v2.2 is selected via API version header, should these fields be retained for backward compatibility?
3. The changelog should be updated to include:
   ```
   removed: [
     "floorPrice, floorPriceUSD, marketCapUSD fields moved into marketData object in stamp detail endpoints"
   ]
   ```

## Recommendations

1. **Update Changelog**: Add the field removal/migration information to the v2.3 changelog in `/routes/api/v2/versions.ts`

2. **Version Compatibility**: Verify that when API version 2.2 is requested:
   - The old fields (`floorPrice`, `floorPriceUSD`, `marketCapUSD`) are returned
   - The new `marketData` object is NOT included
   - This maintains true backward compatibility

3. **Production Fix**: The invalid tick validation behavior needs to be fixed in production to return 400 for invalid tick lengths

4. **Migration Guide**: Consider creating a migration guide that explicitly maps old fields to new locations:
   ```
   v2.2 → v2.3 Field Mapping:
   - stamp.floorPrice → stamp.marketData.floorPrice
   - stamp.floorPriceUSD → stamp.marketData.floorPriceUSD
   - stamp.marketCapUSD → stamp.marketData.marketCapUSD
   ```

## Test Configuration

- **Test Collection**: `postman-collection-regression-v23.json`
- **Endpoints Tested**: 5
- **Total Differences Found**: 19
- **Status Code Mismatches**: 1

## Next Steps

1. Review and approve/reject the undocumented field changes
2. Update the changelog if changes are intended
3. Test backward compatibility when using API version headers
4. Fix the invalid tick validation in production