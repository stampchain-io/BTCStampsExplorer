# Running New Test Scripts - Task 7.6

This guide explains how to run the newly added test scripts for the 6 Recent Sales Prod requests and 5 new negative test requests.

## Prerequisites

- Node.js and npm installed
- Newman CLI installed (`npm install -g newman`)
- Development server running on port 8000 (for Dev tests)
- Production server accessible at https://stampchain.io (for Prod tests)

## Quick Start

### Run All Tests

```bash
cd /home/StampchainWorkspace/stampchain.io

# Using the comprehensive test script
./scripts/run-newman-comprehensive.sh
```

### Run Only Error Scenarios (5 New Negative Tests)

```bash
newman run tests/postman/collections/comprehensive.json \
  --folder "Error Scenarios" \
  --environment tests/postman/environments/comprehensive.json \
  --reporters cli,html \
  --reporter-html-export reports/error-scenarios.html
```

### Run Only Recent Sales Requests

```bash
newman run tests/postman/collections/comprehensive.json \
  --folder "Stamps Endpoints" \
  --environment tests/postman/environments/comprehensive.json \
  --reporters cli,html \
  --reporter-html-export reports/recent-sales.html
```

### Run Specific Test by Name

```bash
# Example: Run one of the newly tested Prod requests
newman run tests/postman/collections/comprehensive.json \
  --folder "Stamps Endpoints" \
  --environment tests/postman/environments/comprehensive.json \
  --global-var "target_request=Get Recent Sales - Prod (Custom day_range)"
```

## Validation Before Running Tests

Validate the collection structure without running tests:

```bash
# Validate JSON structure
python3 -m json.tool tests/postman/collections/comprehensive.json > /dev/null

# Validate test coverage
python3 scripts/validate_test_coverage.py
```

## New Tests Added

### Part 1: Recent Sales Prod Requests (6 tests)

These tests now have the same test scripts as their Dev equivalents:

1. **Get Recent Sales - Prod (Custom day_range)**
   ```bash
   # Tests:
   # - Status code is 200
   # - day_range parameter is respected
   # - Response has valid structure
   ```

2. **Get Recent Sales - Prod (full_details=true)**
   ```bash
   # Tests:
   # - Status code is 200
   # - full_details parameter is respected
   # - Detailed fields are present
   ```

3. **Get Recent Sales - Prod (Pagination)**
   ```bash
   # Tests:
   # - Status code is 200
   # - Pagination metadata is present and valid
   ```

4. **Get Recent Sales - Prod (Boundary day_range)**
   ```bash
   # Tests:
   # - Status code is 200
   # - Boundary values are handled correctly
   ```

5. **Get Recent Sales - Prod (Large day_range)**
   ```bash
   # Tests:
   # - Status code is 200
   # - Large day_range values are handled
   ```

6. **Get Recent Sales - Prod (Combined Parameters)**
   ```bash
   # Tests:
   # - Status code is 200
   # - Multiple parameters work together correctly
   ```

### Part 2: Error Scenarios (5 new negative tests)

1. **Invalid Block Number - Dev**
   - Endpoint: `GET /api/v2/block/999999999`
   - Expected: HTTP 404
   - Tests error response structure

2. **Invalid SRC-101 Token ID - Dev**
   - Endpoint: `GET /api/v2/src101/token/999999999`
   - Expected: HTTP 404
   - Tests error response structure

3. **Invalid Pagination Limit - Dev**
   - Endpoint: `GET /api/v2/stamps?limit=99999`
   - Expected: HTTP 400
   - Tests excessive pagination limit rejection

4. **Invalid CPID Format - Dev**
   - Endpoint: `GET /api/v2/stamps/cpid/invalid!@#$`
   - Expected: HTTP 400
   - Tests invalid character rejection

5. **Invalid SRC-20 Holder Address - Dev**
   - Endpoint: `GET /api/v2/src20/tick/{{test_src20_tick}}/holders?address=invalid_address_format`
   - Expected: HTTP 400
   - Tests invalid address format rejection

## Expected Results

### Successful Test Run

When all tests pass, you should see:

```
┌─────────────────────────┬──────────────────┬──────────────────┐
│                         │         executed │           failed │
├─────────────────────────┼──────────────────┼──────────────────┤
│              iterations │                1 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│                requests │              122 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│            test-scripts │              122 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│      prerequest-scripts │                0 │                0 │
├─────────────────────────┼──────────────────┼──────────────────┤
│              assertions │              XXX │                0 │
├─────────────────────────┴──────────────────┴──────────────────┤
│ total run duration: XXXXms                                    │
└───────────────────────────────────────────────────────────────┘
```

### Error Scenarios Expected Results

The Error Scenarios folder should show:

- 10 total requests executed
- All assertions passed
- No failed tests
- Mix of 400 and 404 status codes validated

## Troubleshooting

### Server Not Running

If tests fail with connection errors:

```bash
# Check dev server
curl http://localhost:8000/api/v2/stamps?limit=1

# Start dev server if needed
deno task dev
```

### Collection Validation Errors

If the collection has issues:

```bash
# Re-validate collection structure
python3 scripts/validate_test_coverage.py

# Check for JSON syntax errors
python3 -m json.tool tests/postman/collections/comprehensive.json > /dev/null
```

### Test Failures

If specific tests fail:

1. Check server logs for errors
2. Verify endpoint is accessible manually with curl
3. Review test assertions in the collection
4. Check environment variables in `comprehensive.json` environment file

## CI/CD Integration

To integrate these tests into CI/CD:

```yaml
# Example GitHub Actions step
- name: Run API Tests
  run: |
    npm install -g newman
    newman run tests/postman/collections/comprehensive.json \
      --environment tests/postman/environments/comprehensive.json \
      --reporters cli,json \
      --reporter-json-export test-results.json
```

## Reports

Test reports are saved in:

- `reports/newman-comprehensive/` - Full test run reports
- `reports/error-scenarios.html` - Error scenarios specific report
- `reports/recent-sales.html` - Recent sales specific report

## Maintenance

When adding new endpoints:

1. Create Dev and Prod variants if applicable
2. Add test scripts to both variants
3. Run validation script to ensure 100% coverage
4. Add corresponding negative tests to Error Scenarios if appropriate

```bash
# After adding new tests, always validate
python3 scripts/validate_test_coverage.py
```

## Summary

- **Total Requests**: 122
- **Test Coverage**: 100% (122/122)
- **Error Scenarios**: 10 tests
- **Recent Sales Tests**: 21 tests (12 Dev + 9 Prod)
- **Newly Added Test Scripts**: 11 (6 Prod + 5 Error Scenarios)
