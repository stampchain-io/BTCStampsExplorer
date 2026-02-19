# Data Validation Quick Reference Card

## Summary
- **Total Requests**: 128
- **Validated Requests**: 101 (78.9%)
- **Validation Types**: 7 categories
- **Fields Validated**: 25+ unique types

## Running Tests

```bash
# Verify validation coverage
node scripts/verify-data-validation.mjs

# Run all tests
npm run test:api:comprehensive

# Run specific groups
npm run test:api:comprehensive:stamps
npm run test:api:comprehensive:src20
npm run test:api:comprehensive:system

# Run with options
npm run test:api:comprehensive:verbose  # Detailed output
npm run test:api:comprehensive:bail     # Stop on first failure
```

## Validation Coverage by Type

| Type | Requests | Key Validations |
|------|----------|-----------------|
| Pagination | 98 | page >= 1, limit <= 1000, data.length check |
| Stamps | 34 | stamp != 0, tx_hash hex, cpid pattern |
| SRC-20 | 26 | tick length, progress 0-100, max/lim positive |
| Balance | 14 | address format, non-negative balance |
| Block | 12 | block_index > 0, hash hex, timestamp valid |
| Collections | 4 | UUID format, non-empty name |
| Health | 3 | status enum, services boolean |

## Field Validation Regex Patterns

```javascript
// Transaction Hash (64-char hex)
/^[a-f0-9]{64}$/i

// CPID (alphanumeric uppercase)
/^[A-Z0-9]+$/

// UUID
/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Bitcoin Address
/^(bc1|tb1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/

// URL/Data URI
/^(https?:\/\/|data:|ipfs:|ar:\/\/)/
```

## Common Validation Patterns

### Check if field exists and is valid
```javascript
if (field !== undefined && field !== null) {
  pm.expect(field).to.be.a('string');
  pm.expect(field).to.match(/pattern/);
}
```

### Validate numeric range
```javascript
pm.expect(value).to.be.at.least(0);
pm.expect(value).to.be.at.most(100);
pm.expect(value).to.be.above(0);
```

### Validate enum values
```javascript
pm.expect(['OK', 'ERROR', 'DEGRADED']).to.include(status);
```

### Custom validator
```javascript
pm.expect(value).to.satisfy(
  n => n > 0 || n < 0,
  'should be positive or negative'
);
```

## Example Test Structure

```javascript
pm.test("Data values are valid", function() {
  const json = pm.response.json();

  // 1. Check data exists
  if (json.data && Array.isArray(json.data) && json.data.length > 0) {
    const item = json.data[0];

    // 2. Validate each field conditionally
    if (item.field !== undefined && item.field !== null) {
      pm.expect(item.field).to.be.a('string');
      pm.expect(item.field).to.match(/pattern/);
    }
  }
});
```

## Files Location

```
stampchain.io/
├── scripts/
│   ├── add-data-validation.ts          # TypeScript version
│   ├── add-data-validation.mjs         # Node.js version
│   └── verify-data-validation.mjs      # Coverage checker
├── tests/postman/
│   ├── collections/
│   │   └── comprehensive.json          # Enhanced collection
│   ├── DATA_VALIDATION_GUIDE.md        # Full documentation
│   ├── MANUAL_VALIDATION_TEST.md       # Testing procedures
│   ├── VALIDATION_EXAMPLES.md          # Code examples
│   └── VALIDATION_QUICK_REF.md         # This file
└── TASK_7.6_IMPLEMENTATION_SUMMARY.md  # Implementation report
```

## Quick Validation Checks

### Stamps Endpoint
- ✅ stamp is number != 0
- ✅ tx_hash is 64-char hex
- ✅ cpid matches pattern
- ✅ block_index > 0
- ✅ stamp_url is valid

### SRC-20 Endpoint
- ✅ tick 1-5 chars
- ✅ max/lim positive
- ✅ progress 0-100
- ✅ tx_hash 64-char hex

### Paginated Response
- ✅ page >= 1
- ✅ limit 1-1000
- ✅ total >= 0
- ✅ data.length <= limit

### Block Endpoint
- ✅ block_index > 0
- ✅ block_hash 64-char hex
- ✅ block_time valid timestamp

### Health Endpoint
- ✅ status in enum
- ✅ services all boolean

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Test fails on null field | Add `field !== null` check |
| Test fails on missing optional | Use conditional validation |
| Regex doesn't match | Check pattern, add `/i` for case-insensitive |
| Number comparison fails | Ensure type conversion if stored as string |
| Array validation fails | Check `Array.isArray()` and length |

## Documentation

- **Full Guide**: `tests/postman/DATA_VALIDATION_GUIDE.md`
- **Examples**: `tests/postman/VALIDATION_EXAMPLES.md`
- **Manual Tests**: `tests/postman/MANUAL_VALIDATION_TEST.md`
- **Implementation**: `TASK_7.6_IMPLEMENTATION_SUMMARY.md`
