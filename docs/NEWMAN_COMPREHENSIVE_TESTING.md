# Newman Comprehensive Testing Guide

## Overview

The comprehensive Newman testing suite provides full API regression testing coverage for all 46+ endpoints in the BTC Stamps Explorer API. This testing framework is designed to:

- Test 100% of API endpoints (up from 8.7% coverage)
- Compare dev vs production responses for regression detection
- Use fixture-based testing for CI/CD compatibility
- Provide detailed performance analysis
- Support selective testing by endpoint category

## Quick Start

### Run All Tests
```bash
npm run test:api:comprehensive
```

### Run with Verbose Output
```bash
npm run test:api:comprehensive:verbose
```

### Run Specific Endpoint Categories
```bash
# System endpoints only
npm run test:api:comprehensive:system

# Stamps endpoints only  
npm run test:api:comprehensive:stamps

# SRC-20 endpoints only
npm run test:api:comprehensive:src20

# Market data endpoints only
npm run test:api:comprehensive:market
```

### Run with Regression Analysis
```bash
npm run test:api:comprehensive:regression
```

## Test Structure

### Collection Organization

The `postman-collection-full-regression.json` contains 92+ tests organized into folders:

1. **System Health** (4 tests)
   - Health check endpoints
   - API versioning validation

2. **Stamps Endpoints** (48 tests)
   - Regular stamps (CPID, ID, hash queries)
   - Cursed stamps
   - Collections
   - File uploads and content

3. **SRC-20 Endpoints** (22 tests)
   - Token operations (deploy, mint, transfer)
   - Balance queries
   - Mint progress tracking
   - Tick validation (including 5-char limit)

4. **Market Data** (8 tests)
   - Stamp market data
   - SRC-20 market data
   - Dispenser information

5. **Block & Creator** (10 tests)
   - Block information
   - Creator queries
   - Transaction history

### Test Features

Each test includes:
- **Dual endpoint testing**: Compares dev and prod responses
- **Schema validation**: Ensures response structure consistency
- **Performance monitoring**: Tracks response times
- **Regression detection**: Identifies breaking vs non-breaking changes
- **Error handling**: Tests both success and error cases

## Environment Configuration

### Docker Environment Variables

The `docker-compose.test.yml` defines these configurable variables:

```yaml
DEV_BASE_URL: http://host.docker.internal:8000
PROD_BASE_URL: https://stampchain.io
NEWMAN_COLLECTION: postman-collection-full-regression.json
NEWMAN_ENVIRONMENT: postman-environment.json
NEWMAN_REPORTERS: cli,html,json
NEWMAN_ITERATIONS: 1
NEWMAN_DELAY_REQUEST: 0
NEWMAN_TIMEOUT: 30000
NEWMAN_VERBOSE: false
NEWMAN_BAIL: false
REPORT_PREFIX: newman-comprehensive
```

### Postman Environment

The `postman-environment-comprehensive.json` includes:

```json
{
  "dev_base_url": "http://host.docker.internal:8000",
  "prod_base_url": "https://stampchain.io",
  "test_data_source": "fixtures",
  "enable_regression_detection": "true",
  "allowed_field_additions": "marketData,dispenserInfo,cacheStatus",
  "performance_threshold_warning": "10",
  "performance_threshold_critical": "25"
}
```

## Fixture-Based Testing

### Why Fixtures?

The CI environment cannot access the real database, so we use comprehensive test fixtures that mirror production data:

- `/tests/fixtures/stampData.json` - Stamp test data
- `/tests/fixtures/marketData.json` - Market data fixtures  
- `/tests/fixtures/src20Data.json` - SRC-20 token data
- `/tests/fixtures/collectionData.json` - Collection fixtures
- `/tests/fixtures/apiTestFixtures.ts` - Consolidated fixture access

### Mock Database Manager

The `MockDatabaseManager` class provides:
- Query result mocking based on fixtures
- Query history tracking for verification
- Support for custom mock responses
- Proper handling of filters, limits, and pagination

## Regression Analysis

### Running Analysis

After tests complete, analyze results:

```bash
node scripts/analyze-newman-regression.js
```

### Analysis Categories

1. **Breaking Changes**
   - Missing required fields
   - Type mismatches
   - Status code changes
   - Schema violations

2. **Non-Breaking Changes** 
   - New optional fields (marketData, etc.)
   - Timezone differences
   - Ordering changes
   - Additional metadata

3. **Performance Analysis**
   - Response time comparisons
   - Critical issues (>25% slower)
   - Warnings (>10% slower)
   - Improvements detected

### Report Output

Analysis creates JSON report with:
- Timestamp and source file
- Categorized regressions
- Performance metrics
- Summary statistics

## CI/CD Integration

### GitHub Actions Workflow

```yaml
- name: Run Comprehensive API Tests
  run: |
    docker-compose -f docker-compose.test.yml up newman-comprehensive
    
- name: Analyze Regression Results
  if: always()
  run: |
    npm run test:api:report:regression
```

### Test Data Strategy

1. **Fixtures for CI**: Always use fixtures in CI environment
2. **Live Data Option**: Can test against real data locally
3. **Hybrid Mode**: Mix fixtures and live data for specific tests

## Troubleshooting

### Common Issues

1. **Network Connectivity**
   ```bash
   # Check if services are reachable
   docker-compose -f docker-compose.test.yml run --rm newman-comprehensive sh -c "ping -c 1 host.docker.internal"
   ```

2. **Missing Reports**
   ```bash
   # Ensure reports directory exists
   mkdir -p reports/newman-comprehensive
   ```

3. **Permission Issues**
   ```bash
   # Fix report directory permissions
   chmod -R 755 reports/
   ```

### Debug Mode

Enable verbose output and disable unicode:
```bash
NEWMAN_VERBOSE=true docker-compose -f docker-compose.test.yml up newman-comprehensive
```

## Best Practices

1. **Regular Testing**
   - Run comprehensive tests before major releases
   - Use targeted folder tests during development
   - Monitor performance trends over time

2. **Fixture Maintenance**
   - Keep fixtures updated with production data structure
   - Add new test cases as API evolves
   - Document fixture format changes

3. **Regression Handling**
   - Review all breaking changes before deployment
   - Document intentional API changes
   - Update allowed field additions as needed

4. **Performance Monitoring**
   - Track response time trends
   - Investigate critical performance issues
   - Optimize slow endpoints identified by tests

## Future Enhancements

- [ ] Automated fixture generation from production data
- [ ] GraphQL endpoint testing support
- [ ] WebSocket endpoint testing
- [ ] Load testing integration
- [ ] Automated regression report notifications