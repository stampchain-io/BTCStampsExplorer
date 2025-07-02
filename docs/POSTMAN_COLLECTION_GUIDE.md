# Postman Collection Guide for BTC Stamps Explorer API

## Overview

This guide documents the comprehensive Postman collection for testing all 46 API endpoints with regression detection capabilities.

## Collection Files

### 1. `postman-collection-full-regression.json` (Primary)
- **Coverage**: All 46 endpoints with dev/prod comparison
- **Tests**: 92+ requests (each endpoint tested against both environments)
- **Purpose**: Full regression testing and API comparison

### 2. `postman-collection-enhanced.json` (Legacy)
- **Coverage**: 4 endpoints only
- **Purpose**: Basic testing (being replaced)

### 3. `postman-environment.json`
- **Variables**: Environment-specific configurations
- **Environments**: Development, Production, CI/CD

## Test Structure

### Endpoint Organization
```
├── System Endpoints (4 tests)
│   ├── Health Check (Dev/Prod)
│   └── Version (Dev/Prod)
├── Stamps Endpoints (18 tests)
│   ├── List Stamps
│   ├── Get by ID
│   ├── Dispensers
│   ├── Dispenses
│   ├── Holders
│   ├── Sends
│   ├── By Block
│   └── By Ident
├── Balance Endpoints (4 tests)
│   ├── Address Balance
│   └── Stamps Balance
├── Block Endpoints (4 tests)
│   ├── Block Info
│   └── Block Count
├── Collections Endpoints (4 tests)
│   ├── List Collections
│   └── By Creator
├── Cursed Stamps (6 tests)
│   ├── List Cursed
│   ├── By ID
│   └── By Block
├── SRC-20 Endpoints (30 tests)
│   ├── List SRC20
│   ├── Ticks
│   ├── By Tick
│   ├── Deploy Info
│   ├── Balances
│   ├── By Block
│   └── Transactions
├── Error Scenarios (6+ tests)
│   ├── Invalid IDs
│   ├── Invalid Addresses
│   ├── Invalid Parameters
│   └── Tick Length Validation
└── Comparison Report (1 test)
```

## Key Test Variables

### Valid Test Data
- `test_stamp_id`: "1135630" (known valid stamp)
- `test_cpid`: "A4399874976698242000"
- `test_address`: "bc1qzxszplp8v7w0jc89dlrqyct9staqlhwxzy7lkq"
- `test_block`: "903108"
- `test_tx_hash`: "106c17f61644e3f9952513e42911ffe78316a4b02d2a288fab8622bcfba3f064"
- `test_src20_tick`: "STAMP" (5 chars - max valid length)
- `test_cursed_id`: "-1"

### Invalid Test Data
- `test_src20_tick_invalid`: "TOOLONG" (7 chars - exceeds 5 char limit)
- Invalid stamp ID: 999999999
- Invalid address: "invalid_address"
- Negative limit: -1

## Test Features

### 1. Dual Endpoint Testing
Each endpoint is tested against both development and production to detect:
- Response structure differences
- New/removed fields
- Performance regressions
- Status code changes

### 2. Common Validations
All tests include:
```javascript
- Status code validation
- Response time checks (<10s timeout)
- JSON structure validation
- Response size tracking
```

### 3. Error Scenario Testing
- Invalid parameters (400 responses)
- Not found resources (404 responses)
- Validation errors (tick length, address format)

### 4. Comparison Reporting
Final test generates a comprehensive report showing:
- Total endpoints tested
- Matching vs different responses
- Performance comparisons
- Schema differences

## Running the Tests

### Local Development
```bash
# Using Newman CLI
newman run postman-collection-full-regression.json \
  -e postman-environment.json \
  --env-var "dev_base_url=http://localhost:8000" \
  --env-var "prod_base_url=https://stampchain.io"

# Using Docker (recommended)
npm run test:api:comprehensive
```

### CI/CD Pipeline
```bash
# Will use fixtures and mock data
docker-compose -f docker-compose.test.yml run --rm newman-comprehensive
```

### Postman App
1. Import `postman-collection-full-regression.json`
2. Import `postman-environment.json`
3. Select appropriate environment
4. Run collection with runner

## Test Data Strategy

### For CI/CD (No Database)
- Uses fixtures from `apiTestFixtures.ts`
- Mock responses for all endpoints
- No external dependencies

### For Local Development
- Can use live local database
- Or fixtures for consistency
- Configurable via environment

### For Production Testing
- Read-only operations only
- Uses known valid IDs
- No data mutations

## Interpreting Results

### Success Criteria
- All status codes match expected values
- Response times < 10 seconds
- JSON structure validations pass
- Dev/Prod comparison shows minimal differences

### Acceptable Differences
- `block_time`: Timezone differences (known issue)
- `last_updated`: Timestamp variations
- `marketData`: New fields in development
- `dispenserInfo`: New fields in development
- `cacheStatus`: New field in development

### Failure Investigation
1. Check specific test assertions
2. Compare dev vs prod responses
3. Review response time metrics
4. Check for new/missing fields

## Maintenance

### Adding New Endpoints
1. Add to appropriate section in collection
2. Create both Dev and Prod versions
3. Include standard validations
4. Add test data to fixtures if needed

### Updating Test Data
1. Update variables in collection
2. Update `apiTestFixtures.ts`
3. Document changes in this guide

### Version Updates
- Collection version: Update when structure changes
- API version: Track in test assertions
- Schema changes: Document acceptable differences

## Best Practices

1. **Always test both environments** - Dev and Prod comparison is crucial
2. **Use valid test data** - Based on actual production data
3. **Include error scenarios** - Test failure paths
4. **Document exceptions** - Known differences between environments
5. **Keep fixtures updated** - Sync with API changes

## Troubleshooting

### Common Issues

1. **Connection refused**
   - Check if dev server is running
   - Verify Docker network settings
   - Check environment URLs

2. **Test data not found**
   - Update test IDs with current data
   - Check if data exists in environment
   - Use fixtures for consistency

3. **Schema validation failures**
   - Check for new fields
   - Update response validations
   - Document as acceptable difference

4. **Performance timeouts**
   - Increase timeout settings
   - Check server load
   - Consider pagination limits

## Next Steps

1. Integrate with CI/CD pipeline
2. Set up automated daily runs
3. Create performance baselines
4. Add more error scenarios
5. Implement contract testing