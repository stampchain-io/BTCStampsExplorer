# Debug Findings for Issue #616

## Issue Description
Tick-based balance API calls failing for specific ticks (e.g., 'luffy')
- Working URL: https://stampchain.io/api/v2/src20/balance/bc1qay74nc2djs2g5acqp72eyvlqp3ku7sj97jft8y
- Failing URL: https://stampchain.io/api/v2/src20/balance/bc1qay74nc2djs2g5acqp72eyvlqp3ku7sj97jft8y/luffy

## Code Flow Analysis

### 1. Route Layer ([address]/[tick].ts)
- Receives raw tick parameter
- Converts emoji using `convertEmojiToTick(String(tick))`
- Passes converted tick to controller

### 2. Controller Layer (src20Controller.ts)
- Receives tick parameter from route
- No additional transformation of tick parameter
- Passes directly to service layer

### 3. Service Layer (queryService.ts)
- No additional tick parameter transformation
- Passes directly to repository layer

### 4. Repository Layer (src20Repository.ts)
- Receives tick parameter directly
- Uses case-sensitive comparison in SQL query: `tick = ?`
- No case normalization before database query

## Potential Issues

1. Case Sensitivity:
   - Database query uses exact case matching
   - No case normalization in any layer
   - Could cause mismatches if database stores ticks in different case

2. Parameter Flow:
   - Tick parameter maintains its case through all layers
   - No unexpected transformations or conversions found
   - Emoji conversion happens only at route layer

## Recommendations

1. Add case-insensitive comparison in SQL query:
   ```sql
   LOWER(tick) = LOWER(?)
   ```

2. Add debug logging to track tick value through layers:
   - Route layer (after emoji conversion)
   - Repository layer (before database query)
   - Database query results

3. Verify database collation settings for tick column

## Next Steps

1. Modify SQL query to use case-insensitive comparison
2. Add comprehensive logging
3. Test with known failing ticks to verify fix
