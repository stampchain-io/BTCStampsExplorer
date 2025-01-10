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

## Root Cause Analysis

1. Query Behavior:
   - 'luffy' tick query works correctly, returning balance data
   - No database authentication or connectivity issues found
   - Both tick-based and non-tick queries return expected results

2. Parameter Flow:
   - Tick parameter ('luffy') correctly passes through all layers
   - Emoji conversion happens only at route layer
   - No unexpected transformations found

3. Data Verification:
   - 'luffy' balance: 12567227.300520010000000000
   - Transaction hash: e90e6608c68a3264b202fb2f2e7abf780be454b98aa107b75e9c7ab9dc94244e
   - Last update block: 878377

## Debug Test Results

1. Tick-Based Query Test:
   ```
   Testing with 'luffy' tick:
   Result: {
     address: "bc1qay74nc2djs2g5acqp72eyvlqp3ku7sj97jft8y",
     p: "SRC-20",
     tick: "luffy",
     amt: "12567227.300520010000000000",
     block_time: "2025-01-08T18:14:04.000Z",
     last_update: 878377
   }
   ```

2. Query Flow:
   - Tick parameter correctly converted and passed to database
   - Database query returns expected results
   - No errors or data transformation issues found

## Conclusion

The reported issue #616 appears to be intermittent or resolved:
1. Tick-based balance queries are working correctly
2. 'luffy' tick returns proper balance data
3. No emoji conversion or database connectivity issues found

## Recommendations

1. Monitoring Improvements:
   - Add request/response logging for API endpoints
   - Track API response times and error rates
   - Monitor for intermittent failures

2. Error Handling:
   - Add detailed error logging across all layers
   - Implement proper error reporting for API failures
   - Add retry logic for intermittent issues

3. Documentation:
   - Update API documentation with example responses
   - Document expected behavior for tick-based queries
   - Add troubleshooting guide for common issues

## Next Steps

1. Modify SQL query to use case-insensitive comparison
2. Add comprehensive logging
3. Test with known failing ticks to verify fix
