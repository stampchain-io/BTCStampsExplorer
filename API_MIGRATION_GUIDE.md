# API Migration Guide: v2.2 to v2.3

## Overview
This guide helps developers migrate from API v2.2 to v2.3, detailing all breaking changes and providing migration strategies.

## Breaking Changes

### Field Relocations in Stamp Details

The following fields have been moved from the root stamp object into the new `marketData` object:

#### `/api/v2/stamps/{id}` Field Mapping

| v2.2 Field | v2.3 Location | Example |
|------------|---------------|---------|
| `stamp.floorPrice` | `stamp.marketData.floorPrice` | 0.05 BTC → marketData.floorPrice: 0.05 |
| `stamp.floorPriceUSD` | `stamp.marketData.floorPriceUSD` | 2500.00 → marketData.floorPriceUSD: 2500.00 |
| `stamp.marketCapUSD` | `stamp.marketData.marketCapUSD` | 1000000 → marketData.marketCapUSD: 1000000 |

#### Migration Example

**v2.2 Response:**
```json
{
  "data": {
    "stamp": {
      "stamp_id": 1,
      "floorPrice": 0.05,
      "floorPriceUSD": 2500.00,
      "marketCapUSD": 1000000,
      // other fields...
    }
  }
}
```

**v2.3 Response:**
```json
{
  "data": {
    "stamp": {
      "stamp_id": 1,
      "marketData": {
        "floorPrice": 0.05,
        "floorPriceUSD": 2500.00,
        "marketCapUSD": 1000000,
        "volume24h": 150000,
        "priceChange24h": 5.2
      },
      // other fields...
    }
  }
}
```

## New Features in v2.3

### Added Fields

1. **marketData** - Comprehensive market information object
2. **dispenserInfo** - Stamp dispenser statistics
3. **cacheStatus** - Data freshness indicators
4. **holderCount** - Total number of holders
5. **uniqueHolderCount** - Number of unique holders
6. **dataQualityScore** - Data reliability metric

### Performance Optimizations

- `stamp_base64` field removed from list endpoints (50-70% response size reduction)
- `stamp_base64` still available in individual stamp detail endpoints

## Backward Compatibility

### Using API Version Headers

To maintain v2.2 compatibility while the migration is in progress:

```bash
# Request v2.2 format (maintains old field structure)
curl -H "API-Version: 2.2" https://stampchain.io/api/v2/stamps/1

# Request v2.3 format (new structure)
curl -H "API-Version: 2.3" https://stampchain.io/api/v2/stamps/1
```

### Recommended Migration Strategy

1. **Phase 1**: Add version header to existing code
   ```javascript
   fetch('/api/v2/stamps/1', {
     headers: { 'API-Version': '2.2' }
   });
   ```

2. **Phase 2**: Update code to handle new structure
   ```javascript
   // Old code
   const floorPrice = stamp.floorPrice;
   
   // New code with fallback
   const floorPrice = stamp.marketData?.floorPrice || stamp.floorPrice;
   ```

3. **Phase 3**: Remove fallbacks and use v2.3
   ```javascript
   const floorPrice = stamp.marketData.floorPrice;
   ```

## Timeline

- **2025-01-15**: v2.3 released
- **2025-06-15**: Deprecation warnings added to v2.2
- **2025-12-01**: v2.2 end of life

## Support

For migration assistance, contact support@stampchain.io