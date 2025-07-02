# API Comparison Report: Development vs Production

**Generated:** 2025-07-02 10:18 UTC  
**Dev Server:** http://localhost:8000  
**Production Server:** https://stampchain.io

## Summary

The Newman tests compare local development API responses against production API responses to identify any regressions or differences before deployment.

## Test Results Overview

- **Total Endpoints Tested:** 4
- **All Endpoints Responded:** ✅ Success (200 OK)
- **Performance Analysis:** Development server shows higher latency due to local processing

## Key Differences Found

### 1. `/api/v2/stamps` Endpoint

#### Response Size Difference
- **Development:** 3,658 bytes
- **Production:** 2,870 bytes
- **Difference:** +788 bytes (27% larger in dev)

#### New Fields in Development
The development server includes additional fields not present in production:

1. **`cacheStatus`**: "fresh" - Indicates cache state
2. **`dispenserInfo`**: Object containing dispenser counts
   - `openCount`: 0
   - `closedCount`: 0
   - `totalCount`: 0
3. **`marketData`**: Comprehensive market data object with:
   - Price information (BTC/USD)
   - Holder statistics
   - Volume metrics (24h, 7d, 30d)
   - Dispenser counts
   - Data quality metrics
   - Last update timestamps

#### Field Value Differences
- **`block_time`**: 
  - Production: "2025-06-28T16:53:22.000Z"
  - Development: "2025-06-28T21:53:22.000Z"
  - **Difference:** 5-hour timezone offset

#### Metadata Differences
- **`btcPrice`**: 
  - Production: 108,392
  - Development: 108,385.29
- **`source`**: 
  - Production: "coingecko"
  - Development: "binance"

### 2. Performance Comparison

| Endpoint | Development | Production | Difference |
|----------|-------------|------------|------------|
| `/api/v2/health` | 1,516ms | 247ms | +1,269ms |
| `/api/v2/version` | 36ms | 80ms | -44ms |
| `/api/v2/stamps?limit=1` | 962ms | 96ms | +866ms |
| `/api/v2/src20?limit=1` | 5,965ms | 105ms | +5,860ms |

### 3. Other Endpoints

- **`/api/v2/health`**: Identical structure, same response
- **`/api/v2/version`**: Identical responses
- **`/api/v2/src20`**: Similar pattern to stamps endpoint

## Report Locations

Newman generates detailed reports in the following locations:

### HTML Reports (Interactive)
- **Latest:** `/reports/newman/20250702_151647-report.html`
- **Previous:** `/reports/newman/20250702_151418-report.html`

### JSON Reports (Raw Data)
- **Latest:** `/reports/newman/20250702_151647-results.json`
- **Previous:** `/reports/newman/20250702_151418-results.json`

### Enhanced Reports
- **Markdown:** `/reports/enhanced-api-test-report.md`
- **JSON Analysis:** `/reports/enhanced-api-test-analysis.json`

## Recommendations

1. **Review New Fields**: Ensure the new `marketData` and `dispenserInfo` fields are intentional additions
2. **Fix Timezone Issue**: The 5-hour difference in `block_time` suggests a timezone handling issue
3. **Performance Optimization**: Development server shows significantly higher latency, especially for `/api/v2/src20`
4. **Data Source Consistency**: Consider using the same price data source (binance vs coingecko)

## How to View Reports

1. **HTML Reports**: Open in browser for interactive viewing
   ```bash
   open PROJECT_ROOT/reports/newman/20250702_151647-report.html
   ```

2. **JSON Analysis**: Use for programmatic analysis
   ```bash
   jq . PROJECT_ROOT/reports/newman/20250702_151647-results.json
   ```

3. **Enhanced Reports**: Human-readable markdown format
   ```bash
   open PROJECT_ROOT/reports/enhanced-api-test-report.md
   ```