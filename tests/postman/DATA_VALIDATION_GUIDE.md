# Data Content Validation Guide

## Overview

This document describes the data content validation tests added to the comprehensive Postman collection (`tests/postman/collections/comprehensive.json`). These validations go beyond schema structure validation to ensure that actual response data makes semantic sense.

## Validation Coverage

All 128 requests in the comprehensive collection now include appropriate data content validation based on their endpoint type.

## Validation Types

### 1. Stamps Data Validation

**Endpoints**: `/api/v2/stamps/*`, `/api/v2/cursed/*`

**Validations**:
- `stamp` - Must be a number, either positive (blessed) or negative (cursed)
- `tx_hash` - Must be a 64-character hexadecimal string
- `cpid` - Must match pattern `^[A-Z0-9]+$` (alphanumeric uppercase)
- `block_index` - Must be a positive number
- `stamp_url` - Must be a valid URL or data URI (http://, https://, data:, ipfs:, ar://)

**Example**:
```javascript
pm.test("Stamp data values are valid", function() {
  const json = pm.response.json();
  if (json.data && Array.isArray(json.data) && json.data.length > 0) {
    const stamp = json.data[0];

    if (stamp.stamp !== undefined && stamp.stamp !== null) {
      pm.expect(stamp.stamp).to.be.a('number');
      pm.expect(stamp.stamp).to.satisfy(n => n > 0 || n < 0);
    }

    if (stamp.tx_hash !== undefined && stamp.tx_hash !== null) {
      pm.expect(stamp.tx_hash).to.match(/^[a-f0-9]{64}$/i);
    }
  }
});
```

### 2. SRC-20 Token Validation

**Endpoints**: `/api/v2/src20/*`

**Validations**:
- `tick` - Non-empty string, max 5 characters
- `max` - Positive number (max supply)
- `lim` - Positive number (limit per mint)
- `progress_percentage` - Number between 0 and 100 inclusive
- `tx_hash` - 64-character hexadecimal string

**Example**:
```javascript
pm.test("SRC-20 data values are valid", function() {
  const json = pm.response.json();
  if (json.data && Array.isArray(json.data) && json.data.length > 0) {
    const token = json.data[0];

    if (token.tick !== undefined && token.tick !== null) {
      pm.expect(token.tick).to.be.a('string');
      pm.expect(token.tick.length).to.be.above(0);
      pm.expect(token.tick.length).to.be.at.most(5);
    }

    if (token.progress_percentage !== undefined) {
      pm.expect(token.progress_percentage).to.be.at.least(0);
      pm.expect(token.progress_percentage).to.be.at.most(100);
    }
  }
});
```

### 3. Pagination Validation

**Endpoints**: All paginated list endpoints

**Validations**:
- `pagination.page` - Must be >= 1
- `pagination.limit` - Must be > 0 and <= 1000
- `pagination.total` - Must be >= 0
- `data.length` - Must not exceed `pagination.limit`

**Example**:
```javascript
pm.test("Pagination values are valid", function() {
  const json = pm.response.json();

  if (json.pagination !== undefined && json.pagination !== null) {
    const p = json.pagination;

    if (p.page !== undefined) {
      pm.expect(p.page).to.be.at.least(1);
    }

    if (p.limit !== undefined) {
      pm.expect(p.limit).to.be.above(0);
      pm.expect(p.limit).to.be.at.most(1000);
    }
  }

  if (json.data && Array.isArray(json.data) && json.pagination?.limit) {
    pm.expect(json.data.length).to.be.at.most(json.pagination.limit);
  }
});
```

### 4. Health Endpoint Validation

**Endpoints**: `/api/v2/health`

**Validations**:
- `status` - Must be one of: 'OK', 'ERROR', 'DEGRADED'
- `services` - All values must be boolean

**Example**:
```javascript
pm.test("Health data values are valid", function() {
  const json = pm.response.json();

  if (json.status !== undefined) {
    pm.expect(['OK', 'ERROR', 'DEGRADED']).to.include(json.status);
  }

  if (json.services !== undefined) {
    Object.entries(json.services).forEach(([key, value]) => {
      pm.expect(value).to.be.a('boolean');
    });
  }
});
```

### 5. Collections Validation

**Endpoints**: `/api/v2/collections/*`

**Validations**:
- `id` - Must be a valid UUID format
- `name` - Must be a non-empty string
- `creator` - Must be a non-empty string (if present)

**Example**:
```javascript
pm.test("Collection data values are valid", function() {
  const json = pm.response.json();
  if (json.data && Array.isArray(json.data) && json.data.length > 0) {
    const collection = json.data[0];

    if (collection.id !== undefined) {
      pm.expect(collection.id).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    }

    if (collection.name !== undefined) {
      pm.expect(collection.name.length).to.be.above(0);
    }
  }
});
```

### 6. Block Data Validation

**Endpoints**: `/api/v2/block/*`

**Validations**:
- `block_index` - Must be a positive number
- `block_hash` - Must be a 64-character hexadecimal string
- `block_time` - Must be a positive timestamp, not too far in the future (< 2 hours)

**Example**:
```javascript
pm.test("Block data values are valid", function() {
  const json = pm.response.json();
  const blockData = json.data || json;

  if (blockData.block_index !== undefined) {
    pm.expect(blockData.block_index).to.be.above(0);
  }

  if (blockData.block_hash !== undefined) {
    pm.expect(blockData.block_hash).to.match(/^[a-f0-9]{64}$/i);
  }

  if (blockData.block_time !== undefined) {
    pm.expect(blockData.block_time).to.be.above(0);
    pm.expect(blockData.block_time).to.be.below(Date.now() / 1000 + 7200);
  }
});
```

### 7. Balance Data Validation

**Endpoints**: `/api/v2/balance/*`

**Validations**:
- `address` - Must be a valid Bitcoin address format (bc1, tb1, or legacy)
- `balance` - Must be non-negative

**Example**:
```javascript
pm.test("Balance data values are valid", function() {
  const json = pm.response.json();
  if (json.data && Array.isArray(json.data) && json.data.length > 0) {
    const balance = json.data[0];

    if (balance.address !== undefined) {
      pm.expect(balance.address).to.match(/^(bc1|tb1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/);
    }

    if (balance.balance !== undefined) {
      const bal = typeof balance.balance === 'string' ? parseFloat(balance.balance) : balance.balance;
      pm.expect(bal).to.be.at.least(0);
    }
  }
});
```

## Handling Nullable Fields

All validations use conditional checks to handle nullable and optional fields:

```javascript
if (field !== undefined && field !== null) {
  // Validation logic
}
```

This approach:
- Does not fail tests for missing optional fields
- Validates only when data is present
- Follows defensive programming practices

## Running Tests

### Run All Tests
```bash
npm run test:api:comprehensive
```

### Run Specific Folder
```bash
# Test only stamps endpoints
npm run test:api:comprehensive:stamps

# Test only SRC-20 endpoints
npm run test:api:comprehensive:src20

# Test only system/health endpoints
npm run test:api:comprehensive:system
```

### Run with Verbose Output
```bash
npm run test:api:comprehensive:verbose
```

### Run and Bail on First Failure
```bash
npm run test:api:comprehensive:bail
```

## Manual Validation Testing

To verify that the validation tests work correctly, you can manually corrupt test data:

### Test Invalid tx_hash
1. Find a request with tx_hash in response
2. Manually modify the response in the test environment
3. Change tx_hash to: `"invalid-hash-123"`
4. Expected: Test should fail with "tx_hash should be 64-char hex"

### Test Invalid Pagination
1. Find a paginated endpoint
2. Set pagination.page to 0
3. Expected: Test should fail with "page should be >= 1"

### Test Invalid Stamp Number
1. Find a stamps endpoint
2. Set stamp to 0
3. Expected: Test should fail with "stamp should be positive or negative (cursed)"

## Test Script Structure

Each validation test follows this pattern:

1. **Test Name**: Descriptive name indicating what is being validated
2. **Data Check**: Verify data exists before validation
3. **Conditional Validation**: Only validate fields that are present
4. **Clear Error Messages**: Each assertion includes a descriptive message

## Maintenance

When adding new endpoints:

1. Run `node scripts/add-data-validation.mjs` to automatically add appropriate validations
2. Or manually add validation based on the endpoint type and data structure
3. Follow the patterns shown in this guide for consistency

## Validation Statistics

- **Total Requests**: 128
- **Validation Types**: 7 categories
- **Coverage**: 100% of endpoints have appropriate validation
- **Fields Validated**: 25+ different field types across all endpoints

## Next Steps

1. Run tests regularly in CI/CD pipeline
2. Monitor for validation failures indicating data issues
3. Update validations when API schema changes
4. Add new validation rules as needed for new endpoints
