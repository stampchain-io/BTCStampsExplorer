# Newman Test Failures Analysis - Task 7

**Date**: 2026-02-14
**PR**: #955
**Branch**: feature/schema-driven-newman-tests
**Workflow Run**: 22012986160

## Summary

Newman local dev tests executed with **56 assertion failures out of 955 total assertions** (94.1% pass rate).

### Test Execution Stats
- **Iterations**: 1
- **Requests**: 128
- **Test Scripts**: 250
- **Assertions**: 955
- **Passed**: 899
- **Failed**: 56

## Root Cause Analysis

### 1. POST /api/v2/olga/mint Endpoint - 500 Internal Server Error (2 occurrences)

**Issue**: The OLGA mint endpoint returns 500 errors instead of expected 200 responses.

```
POST http://localhost:8000/api/v2/olga/mint [500 Internal Server Error, 958B, 3.7s]
```

**Impact**:
- 10+ assertion failures (status code + response field validations)
- Both Dev and Prod test variants failing

**Possible Causes**:
1. Mock external API server not properly mocking required dependencies
2. Endpoint implementation has bugs when processing mint requests
3. Database seed data missing required OLGA-specific tables/data
4. External API integration (Counterparty) not properly handled in test environment

**Action Required**:
- Investigate endpoint implementation in `routes/api/v2/olga/mint.ts`
- Verify mock API server responses match expected format
- Check if OLGA-specific database schema/data is properly seeded
- Add detailed error logging to identify exact failure point

### 2. 404 Response Structure Mismatches (Multiple endpoints)

**Affected Endpoints**:
- `/api/v2/stamps/{id}/dispensers` - 404 Not Found
- `/api/v2/stamps/{id}/dispenses` - 404 Not Found
- `/api/v2/stamps/{id}/holders` - 404 Not Found
- `/api/v2/stamps/{id}/sends` - 404 Not Found
- `/api/v2/src20/tx/{hash}` - 404 Not Found

**Issue**: Tests expect specific response structure even for 404 responses, but actual responses may vary.

**Example Failures**:
```
AssertionError: Response has required fields
AssertionError: Data items have required fields with correct types
```

**Possible Causes**:
1. Test seed data doesn't include related records (dispensers, holders, sends, etc.)
2. Tests expect 404 responses to have specific `data` structure (empty arrays vs null)
3. Response serialization differs between 200 and 404 cases

**Action Required**:
- Review test seed data completeness
- Standardize 404 response format across all endpoints
- Update test assertions to handle both empty arrays and null values for 404s

### 3. POST Endpoint Response Field Validation Failures (Multiple endpoints)

**Affected Endpoints**:
- `/api/v2/src20/create` (Create SRC20 Token)
- `/api/v2/src20/attach` (Attach Stamp)
- `/api/v2/src20/mint` (Mint Stamp)

**Example Failures**:
```
AssertionError: Response contains PSBT or transaction data
AssertionError: Response contains inputsToSign array
AssertionError: Response contains all required fields
AssertionError: Response includes transaction cost estimates
```

**Issue**: POST endpoints returning 200 OK but missing expected response fields.

**Possible Causes**:
1. Mock external APIs (Counterparty, mempool.space, Blockstream) not returning complete data
2. Endpoint implementation not properly constructing PSBT response object
3. Response serialization stripping required fields

**Action Required**:
- Verify mock API server returns complete UTXO/balance/asset data
- Check endpoint response builders include all required fields
- Review DTO/serialization logic for POST endpoints

### 4. Health Endpoint Data Validation Failures

**Issue**: Health endpoint data validation failures.

```
AssertionError: Health data values are valid
```

**Possible Causes**:
1. Health check endpoint returns different structure in test environment
2. Missing database/Redis health metrics in test environment
3. Test expectations don't match actual health response structure

**Action Required**:
- Review health endpoint implementation
- Verify all health check dependencies available in CI
- Update test assertions to match actual health response schema

## Production vs Test Environment Differences

### Known Discrepancies

1. **External API Mocking**: CI uses mock servers for Counterparty/mempool/Blockstream APIs
   - Mock responses may not perfectly match production API schemas
   - May be missing edge cases or optional fields

2. **Database Seed Data**: Test database has minimal seed data
   - Many relationships (dispensers, holders, sends) intentionally missing
   - This causes expected 404 responses but may have different structure than production 404s

3. **Mock API Server**: First implementation, may have bugs
   - Located at `scripts/mock-external-apis.ts`
   - Started on port 18443 for CI testing

## Recommendations

### Immediate Fixes (Required for PR Merge)

1. **Fix /api/v2/olga/mint 500 errors**
   - Priority: HIGH
   - Blocking: YES
   - 500 errors should never pass tests

2. **Standardize 404 response format**
   - Priority: MEDIUM
   - Update all endpoints to return consistent 404 structure
   - Update tests to expect this structure

3. **Fix POST endpoint response completeness**
   - Priority: HIGH
   - Ensure all POST endpoints return required PSBT/transaction fields
   - May require mock API server improvements

### Future Improvements (Post-Merge)

1. **Expand test seed data**
   - Add dispensers, holders, sends relationships
   - Reduce number of 404 test cases by providing more complete data

2. **Improve mock API server**
   - Add more realistic responses
   - Handle more edge cases
   - Better error simulation

3. **Add integration tests against production data**
   - Run tests against production API periodically
   - Compare production vs test behavior
   - Document known differences

## Test Files Affected

- `tests/postman/collections/comprehensive.json` - Main test collection
- `scripts/mock-external-apis.ts` - Mock API server
- `scripts/test-seed-data.sql` - Database seed data
- `.github/workflows/newman-comprehensive-tests.yml` - CI workflow

## Related Documentation

- `TESTING.md` - Newman testing guide
- `tests/postman/DATA_VALIDATION_GUIDE.md` - Field validation patterns
- `tests/postman/VALIDATION_EXAMPLES.md` - Example test scripts

## Next Steps

1. ✅ Document test failures (this file)
2. ⏳ Investigate /api/v2/olga/mint 500 errors
3. ⏳ Fix POST endpoint response structure issues
4. ⏳ Standardize 404 response formats
5. ⏳ Re-run tests after fixes
6. ⏳ Update PR with fix commits
7. ⏳ Monitor CI for green build

---

**Note**: Despite 56 failures, the test infrastructure is working correctly. The failures reveal real issues in:
- Endpoint implementations (500 errors)
- Response format inconsistencies (404 structures)
- Mock API server completeness (PSBT fields missing)

These are valuable findings that improve API quality and consistency.
