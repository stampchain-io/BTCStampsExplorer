# Manual Data Validation Testing Guide

This guide demonstrates how to manually test that data content validation is working correctly by corrupting test data and verifying that tests catch the issues.

## Test Setup

The comprehensive collection has 101 requests with data validation (78.9% coverage).

## Manual Corruption Test Cases

### Test Case 1: Invalid tx_hash Format

**Objective**: Verify that tx_hash validation catches non-hexadecimal values

**Steps**:
1. Open Postman and import `tests/postman/collections/comprehensive.json`
2. Find request: "List Stamps - Dev"
3. In the test tab, temporarily modify the response by adding a pre-request script:

```javascript
// Add to Pre-request Script (temporary for testing)
pm.sendRequest(pm.request.url, function(err, response) {
  const data = response.json();
  if (data.data && data.data.length > 0) {
    // Corrupt tx_hash
    data.data[0].tx_hash = "invalid-hash-123";
  }
  pm.globals.set('corrupted_response', JSON.stringify(data));
});

// In Test Script, use:
const json = JSON.parse(pm.globals.get('corrupted_response'));
```

**Expected Result**:
```
FAIL: tx_hash should be 64-char hex
```

### Test Case 2: Invalid Page Number (Zero)

**Objective**: Verify pagination validation catches page = 0

**Steps**:
1. Find any paginated endpoint (e.g., "List Stamps - Dev")
2. Modify the test response to set `pagination.page = 0`
3. Run the test

**Expected Result**:
```
FAIL: page should be >= 1
```

### Test Case 3: Negative Limit

**Objective**: Verify limit validation catches negative values

**Steps**:
1. Find any paginated endpoint
2. Modify the test response to set `pagination.limit = -10`
3. Run the test

**Expected Result**:
```
FAIL: limit should be positive
```

### Test Case 4: Limit Exceeds Maximum

**Objective**: Verify limit validation catches values > 1000

**Steps**:
1. Find any paginated endpoint
2. Modify the test response to set `pagination.limit = 2000`
3. Run the test

**Expected Result**:
```
FAIL: limit should be <= 1000
```

### Test Case 5: Invalid Stamp Number (Zero)

**Objective**: Verify stamp number validation

**Steps**:
1. Find "List Stamps - Dev" request
2. Modify response to set `data[0].stamp = 0`
3. Run the test

**Expected Result**:
```
FAIL: stamp should be positive or negative (cursed)
```

### Test Case 6: Invalid SRC-20 Progress Percentage

**Objective**: Verify progress_percentage range validation

**Test 6a - Negative Progress**:
1. Find "List SRC20 - Dev" request
2. Modify response to set `data[0].progress_percentage = -5`
3. Run the test

**Expected Result**:
```
FAIL: progress should be >= 0
```

**Test 6b - Progress Over 100**:
1. Modify response to set `data[0].progress_percentage = 150`
2. Run the test

**Expected Result**:
```
FAIL: progress should be <= 100
```

### Test Case 7: Invalid SRC-20 Tick Length

**Objective**: Verify tick length validation

**Steps**:
1. Find "List SRC20 - Dev" request
2. Modify response to set `data[0].tick = "TOOLONG"`
3. Run the test

**Expected Result**:
```
FAIL: tick should be max 5 characters
```

### Test Case 8: Invalid Block Hash

**Objective**: Verify block_hash format validation

**Steps**:
1. Find "Get Block Info - Dev" request
2. Modify response to set `block_hash = "short-hash"`
3. Run the test

**Expected Result**:
```
FAIL: block_hash should be 64-char hex
```

### Test Case 9: Invalid Health Status

**Objective**: Verify health status enum validation

**Steps**:
1. Find "System Health" request
2. Modify response to set `status = "UNKNOWN"`
3. Run the test

**Expected Result**:
```
FAIL: status should be OK, ERROR, or DEGRADED
```

### Test Case 10: Invalid Collection UUID

**Objective**: Verify UUID format validation

**Steps**:
1. Find "List Collections - Dev" request
2. Modify response to set `data[0].id = "not-a-uuid"`
3. Run the test

**Expected Result**:
```
FAIL: id should be UUID
```

## Automated Corruption Testing Script

For automated testing, you can use this Node.js script:

```javascript
// scripts/test-validation-corruption.mjs
import { readFileSync, writeFileSync } from 'fs';

const collection = JSON.parse(readFileSync('tests/postman/collections/comprehensive.json', 'utf8'));

// Find stamps endpoint
const stampsFolder = collection.item.find(i => i.name === 'Stamps Endpoints');
const listStampsRequest = stampsFolder.item.find(i => i.name === 'List Stamps - Dev');

// Add corruption test
const corruptionTest = {
  listen: 'prerequest',
  script: {
    exec: [
      '// Corruption test - this will make validation fail',
      'pm.environment.set("test_corrupt_data", "true");',
    ],
    type: 'text/javascript',
  },
};

// Add to events
if (!listStampsRequest.event) {
  listStampsRequest.event = [];
}
listStampsRequest.event.push(corruptionTest);

// Save modified collection
writeFileSync('tests/postman/collections/comprehensive-corrupted.json', JSON.stringify(collection, null, 2));

console.log('Created corrupted test collection');
```

## Running Validation Tests via CLI

### Test All Validations
```bash
npm run test:api:comprehensive
```

### Test Specific Endpoint Groups
```bash
# Test stamps endpoints
npm run test:api:comprehensive:stamps

# Test SRC-20 endpoints
npm run test:api:comprehensive:src20

# Test system/health endpoints
npm run test:api:comprehensive:system
```

### Run with Bail on First Failure
```bash
npm run test:api:comprehensive:bail
```

## Interpreting Results

### Successful Validation Pass
```
✓ Status code is exactly 200
✓ Response is JSON
✓ Stamp data values are valid
✓ Pagination values are valid
```

### Validation Failure (Corrupted Data)
```
✓ Status code is exactly 200
✓ Response is JSON
✗ Stamp data values are valid
  AssertionError: tx_hash should be 64-char hex
    expected 'invalid-hash-123' to match /^[a-f0-9]{64}$/i
✓ Pagination values are valid
```

## Coverage Summary

Based on verification script results:

- **Total Requests**: 128
- **Requests with Validation**: 101
- **Coverage**: 78.9%

### Validation Types Distribution:
- Pagination: 98 requests
- Stamps: 34 requests
- SRC-20: 26 requests
- Balance: 14 requests
- Block: 12 requests
- Collections: 4 requests
- Health: 3 requests

## Best Practices

1. **Always test with real API responses first** to ensure validations work with actual data
2. **Use environment variables** to toggle between normal and corruption testing
3. **Document expected failures** when running corruption tests
4. **Run comprehensive tests regularly** to catch API changes that break validations
5. **Update validations** when API schema changes

## Continuous Integration

Add validation testing to CI/CD pipeline:

```yaml
# .github/workflows/api-validation-tests.yml
name: API Data Validation Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run API validation tests
        run: npm run test:api:comprehensive
      - name: Verify validation coverage
        run: node scripts/verify-data-validation.mjs
```

## Troubleshooting

### Validation Not Running
- Check that the endpoint has test events defined
- Verify the validation script is in the test event
- Ensure data structure matches expected format

### False Positives
- Check for nullable fields that might be `null` in some responses
- Verify conditional checks are in place (`if (field !== undefined && field !== null)`)
- Review field type expectations (string vs number)

### False Negatives (Missing Failures)
- Verify validation regex patterns are correct
- Check numeric range boundaries
- Ensure error messages are descriptive

## Next Steps

1. Run full test suite: `npm run test:api:comprehensive`
2. Review test results in `reports/newman/`
3. Fix any validation failures
4. Add new validations for new endpoints
5. Update this guide with new test cases
