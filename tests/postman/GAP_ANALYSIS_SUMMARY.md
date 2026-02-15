# Gap Analysis Summary: Test Variables vs Seed Data Alignment

**Generated:** 2026-02-15
**Task:** 13.1 - Audit test variables vs seed data alignment for all 128 Newman requests
**Collection:** `comprehensive.json`
**Seed Data:** `test-seed-data.sql`

---

## Executive Summary

**Overall Alignment: 88.3%** ✓

Out of 128 Newman test requests analyzed:
- **113 requests (88.3%)** have complete matching seed data
- **4 requests (3.1%)** are missing some seed data
- **11 requests (8.6%)** use no variables (configuration/health checks)

---

## Key Findings

### 1. Missing Test Variables

Two test variables are referenced in requests but **not defined** in `test-seed-data.sql`:

| Variable | Used By | Impact |
|----------|---------|--------|
| `test_number` | Block Count endpoints (2 requests) | Block count tests will fail |
| `test_ident` | Stamps by Ident endpoints (2 requests) | Ident lookup tests will fail |

**Recommendation:** Add these variables to the seed data header comments and ensure corresponding data exists.

---

### 2. Requests Accepting Multiple Status Codes (200/400)

**16 total requests** are designed to accept both success (200) and client error (400) responses:

#### SRC-101 Endpoints (10 requests)
These are GET requests in `src101/*` folders that validate response handling for both valid and invalid requests:

1. Get paginated valid SRC-101 transactions
2. Get paginated SRC-101 transactions
3. Get SRC-101 transaction by hash
4. Get SRC-101 deployment details
5. Get SRC-101 from owners table
6. Get total supply for SRC-101 token
7. Get tokenid of SRC-101 by address_btc
8. Get SRC-101 token information
9. Get SRC-101 balances by address
10. Get SRC-101 token by index

**Note:** All 10 of these have `NO_VARS` status - they use URL path parameters rather than Postman variables.

#### POST Endpoints (6 requests)
Write operations that validate both successful submissions and error handling:

1. Create SRC20 Token (Dev + Prod)
2. Attach Stamp (Dev + Prod)
3. Mint Stamp (Dev + Prod)

**Testing Note:** These endpoints require special attention during test execution as they're designed to test error conditions alongside success cases.

---

### 3. Seed Data Coverage

The `test-seed-data.sql` file contains:

| Data Type | Count | Example Values |
|-----------|-------|----------------|
| CPIDs | 68 | A888354448084788958, A1337420690000042069 |
| Block Indexes | 120 | 820000, 819993, 936477 |
| TX Hashes | 173 | e94be2793462692ca8fea3a54dd90ff4b... |
| Addresses | 176 | bc1qkqqre5xuqk60xtt93j297zgg7t6x0ul7gwjmv4 |
| Stamp Numbers | 69 | 1384305, 1942, ... |
| SRC-20 Ticks | 5 | stamp, kevin, pepe, bobo, sato |
| SRC-101 Ticks | 4 | btc, sats, bns, x |
| SRC-101 Token IDs | 18 | U0FUT1NISU5BS0FNT1RP, ... |
| Deploy Hashes | 2 | 77fb147b72a551cf1e2f0b37dccf9982a1c25623a... |

**Test Variable Mappings** (from SQL header):
```
test_block = 820000
test_stamp_id = 1384305
test_cpid = A888354448084788958
test_address = bc1qkqqre5xuqk60xtt93j297zgg7t6x0ul7gwjmv4
test_tx_hash = e94be2793462692ca8fea3a54dd90ff4b18735196a2bc426382c11959533c8ca
test_src20_tick = stamp
test_cursed_id = -1832
test_deploy_hash = 77fb147b72a551cf1e2f0b37dccf9982a1c25623a7fe8b4d5efaac566cf63fed
test_tokenid = U0FUT1NISU5BS0FNT1RP
test_index = 1942
test_tick = stamp
```

---

### 4. Request Breakdown

#### By HTTP Method
| Method | Count | Percentage |
|--------|-------|------------|
| GET | 117 | 91.4% |
| POST | 11 | 8.6% |

#### By Expected Status Code
| Status | Count | Description |
|--------|-------|-------------|
| 200 | 84 | Standard success responses |
| 200/400 | 16 | Dual-status validation tests |
| unknown | 27 | No status assertion in test script |
| Other | 1 | 201, 404, 500, etc. |

#### By Test Category (Folder)
| Category | Count | Notes |
|----------|-------|-------|
| Stamps Endpoints | 37 | Largest category |
| SRC-101 Endpoints | 16 | Production endpoints |
| SRC-20 Endpoints | 18 | Including edge cases |
| System Endpoints | 12 | Health, status, etc. |
| src101/* | 11 | Swagger-style paths |
| Block Endpoints | 4 | |
| Balance Endpoints | 4 | |
| Collections Endpoints | 4 | |
| Cursed Stamps Endpoints | 6 | |
| POST Endpoints | 10 | Write operations |
| Error Scenarios | 5 | Negative testing |
| Other | 1 | Comparison report |

---

## Pagination and Filtering

**28 requests (21.9%)** use pagination/filtering parameters such as:
- `?page=X&limit=Y`
- `?sort=field&order=asc|desc`
- `?offset=X`

These parameters are standard query parameters and don't require specific seed data alignment.

---

## Recommendations for Test Execution

### Immediate Actions Required

1. **Add missing test variables** to `test-seed-data.sql`:
   ```sql
   --   test_number = 100  -- or appropriate value
   --   test_ident = STAMP  -- or appropriate value
   ```

2. **Verify seed data** for the two missing variables exists in the database:
   - Block count data for `test_number`
   - Stamp with `ident` field matching `test_ident`

### Future Improvements

1. **Consider test variable validation script**: Automatically verify all `{{test_*}}` variables in collection have matching definitions in seed data.

2. **Document 200/400 pattern**: Add note in test collection description explaining why 16 tests accept dual status codes.

3. **Status code coverage**: 27 requests have no status code assertions - consider adding them for better test validation.

---

## Files Generated

1. **gap-analysis.csv** - Detailed spreadsheet with all 128 requests and their alignment status
2. **gap-analysis.json** - Machine-readable report with summary statistics and full details
3. **GAP_ANALYSIS_SUMMARY.md** - This executive summary document

---

## Validation Complete ✓

This audit confirms that **88.3% of Newman requests** have complete seed data alignment. The 4 requests with missing data are isolated to 2 variables that need to be added to the seed data file.

The 10 SRC-101 GET endpoints accepting 200/400 are working as designed and don't represent gaps - they're intentionally testing both success and error response handling.
