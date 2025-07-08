# Test Data Management Strategy for Newman API Testing

## Overview

This document outlines the comprehensive test data management strategy for Newman API testing, building on existing fixtures and addressing the challenges of testing in different environments.

## Test Data Architecture

### 1. Fixture-Based Testing (Primary Strategy)

**Location**: `/tests/fixtures/`
- `marketDataFixtures.ts` - Existing market data fixtures
- `apiTestFixtures.ts` - Comprehensive API test fixtures (newly created)

**Advantages**:
- Consistent, predictable test data
- No dependency on external services
- Fast test execution
- CI/CD compatible

### 2. Environment-Specific Data Sources

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Local Dev     │     │    CI/CD         │     │   Production    │
│   (Fixtures)    │     │  (Fixtures +     │     │  (Read-only     │
│                 │     │   Mock DB)       │     │   Live Data)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Data Management by Environment

### Local Development
- **Primary Source**: Static fixtures in `apiTestFixtures.ts`
- **Database**: Not required (can test against fixtures)
- **Authentication**: Mock API keys or disabled auth

### CI/CD Pipeline
- **Primary Source**: Static fixtures
- **Database**: Mock database using existing `mockDatabaseManager`
- **Authentication**: Environment variable API keys
- **Note**: Cannot rely on live database due to CI constraints

### Production Testing (Manual Only)
- **Primary Source**: Live read-only data
- **Database**: Production (read-only access)
- **Authentication**: Valid API keys required

## Test Data Categories

### 1. Static Reference Data
```typescript
// Known valid IDs that exist in production
validStampIds: [1, 100, 1000, 1135630]
validAddresses: ['bc1qzxszplp8v7w0jc89dlrqyct9staqlhwxzy7lkq']
validBlocks: [779652, 802900, 850000]
```

### 2. Dynamic Test Data
```typescript
// Generated data for create/update operations
testStampData: {
  tick: 'TEST_' + Date.now(),
  toAddress: generateTestAddress(),
  // ...
}
```

### 3. Error Scenario Data
```typescript
// Invalid data for error testing
invalidData: {
  stampId: 999999999,
  address: 'invalid_address',
  negativeLimit: -1
}
```

## Implementation Details

### 1. Postman Environment Variables
```json
{
  "dev_base_url": "http://host.docker.internal:8000",
  "prod_base_url": "https://stampchain.io",
  "test_stamp_id": "{{$randomInt}}",
  "test_address": "bc1qzxszplp8v7w0jc89dlrqyct9staqlhwxzy7lkq",
  "api_key": "{{$processEnv API_KEY}}"
}
```

### 2. Pre-request Scripts
```javascript
// Set test data based on environment
if (pm.environment.get('env_type') === 'ci') {
  // Use fixture data
  pm.variables.set('stamp_id', 1135630);
} else {
  // Use dynamic data
  pm.variables.set('stamp_id', pm.environment.get('test_stamp_id'));
}
```

### 3. Data Cleanup Strategy
```javascript
// Post-request cleanup (only for non-production)
if (pm.environment.get('env_type') !== 'production') {
  // Clean up test data if created
  pm.sendRequest({
    url: pm.environment.get('base_url') + '/cleanup',
    method: 'POST',
    body: { testId: pm.variables.get('test_id') }
  });
}
```

## CI/CD Considerations

### Why Fixtures Are Required for CI

1. **No Database Access**: CI environment typically doesn't have access to a live database
2. **Isolation**: Tests must not affect production data
3. **Speed**: Fixture-based tests run much faster
4. **Reliability**: No external dependencies means fewer failures

### CI Test Data Flow
```
GitHub Action → Newman Container → API Server → Mock Repositories → Fixtures
```

### Limitations in CI
- Cannot test real database interactions
- Cannot verify actual blockchain data
- Limited to fixture-defined scenarios

## Best Practices

### 1. Fixture Design
- Keep fixtures minimal but representative
- Update fixtures when API changes
- Version fixtures with API versions
- Include edge cases and error scenarios

### 2. Test Isolation
- Each test should be independent
- No shared state between tests
- Clean up any created data
- Use unique identifiers for test data

### 3. Environment Handling
```javascript
// Good: Environment-aware testing
const baseUrl = pm.environment.get('base_url') || 'http://localhost:8000';

// Bad: Hardcoded URLs
const baseUrl = 'https://stampchain.io';
```

### 4. Data Validation
- Validate response structure, not exact values
- Use schema validation for response format
- Allow for environment-specific differences

## Migration Path

### Phase 1: Current State
- 4 endpoints tested with basic requests
- No structured test data
- Limited environment support

### Phase 2: Fixture Implementation (Current)
- Comprehensive fixtures created
- Environment configurations added
- Mock data for all endpoints

### Phase 3: Enhanced Testing
- Full Newman collection with fixtures
- CI/CD integration with mock data
- Automated regression detection

### Phase 4: Future Improvements
- Test data generation utilities
- Database seeding for integration tests
- Performance baseline fixtures

## Maintenance

### Regular Updates Required
1. **When API Changes**: Update fixtures to match new schemas
2. **New Endpoints**: Add corresponding test data
3. **Production Data**: Periodically refresh reference IDs
4. **CI Configuration**: Update environment variables

### Monitoring Test Data Health
- Track fixture usage in tests
- Identify stale test data
- Monitor test failure patterns
- Update data based on failures

## Conclusion

This test data strategy enables comprehensive API testing across all environments while acknowledging the constraints of CI/CD pipelines. By using fixtures as the primary data source, we ensure consistent, reliable testing without depending on external services or databases.