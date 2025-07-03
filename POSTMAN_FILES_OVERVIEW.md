# Complete Postman Files Overview

## Collection Files (5 files)
These are the actual test definitions:

1. **postman-collection-smoke.json** (3 tests)
   - Purpose: Quick health checks
   - Tests: Health, Version, Basic Stamps
   - Use: `deno task test:api:simple`

2. **postman-collection-advanced.json** (7 tests)
   - Purpose: Advanced testing with sophisticated comparison
   - Tests: Health, Version, Stamps (dev vs prod pairs + final report)
   - Use: `deno task test:api:advanced`

3. **postman-collection-enhanced.json** (9 tests)
   - Purpose: Enhanced testing with more endpoints
   - Tests: Health, Version, Stamps, SRC20 (dev vs prod pairs + report)
   - Use: `deno task test:api:enhanced` or `test:api:performance`

4. **postman-collection-comprehensive.json** (103+ tests)
   - Purpose: FULL regression testing - ALL endpoints
   - Tests: Every API endpoint comparing dev vs production
   - Use: `deno task test:api` (main regression test)

5. **postman-collection-pagination-validation.json** (48 tests)
   - Purpose: Pagination boundary and edge case testing
   - Tests: Pagination limits, offsets, edge cases
   - Use: Docker service directly

## Environment Files (2 files)
These provide variables for the tests:

1. **postman-environment.json**
   - Basic environment with dev/prod URLs
   - Used by: Simple tests

2. **postman-environment-comprehensive.json**
   - Extended environment with performance thresholds, test config
   - Used by: Comprehensive and other advanced tests

## Data Files (1 file)

1. **postman-data-pagination-tests.json**
   - Test data for pagination validation
   - Used by: Pagination tests

## Why Advanced/Enhanced Test So Few Endpoints?

- **Smoke** (3 tests): Just basic "is it alive?" checks
- **Advanced** (7 tests): Focuses on sophisticated comparison logic
- **Enhanced** (9 tests): Adds SRC20 to advanced, still focused
- **Comprehensive** (103+ tests): Tests EVERYTHING - all 46+ API endpoints with both dev and prod

The smaller collections are for:
- Quick validation (smoke)
- Testing the comparison/validation logic (advanced/enhanced)
- Specific features like pagination

The comprehensive collection is the full regression suite that validates every single endpoint against both environments.