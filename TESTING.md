# BTCStampsExplorer Testing Guide

## Overview

BTCStampsExplorer has a comprehensive testing infrastructure designed to ensure data integrity, API reliability, and application stability. This guide covers all aspects of testing from local development to CI/CD integration.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Types and Levels](#test-types-and-levels)
3. [Local Development Testing](#local-development-testing)
4. [Unit Testing with MockDatabaseManager](#unit-testing-with-mockdatabasemanager)
5. [Integration Testing](#integration-testing)
6. [Newman API Testing](#newman-api-testing)
7. [CI/CD Testing](#cicd-testing)
8. [Test Data Management](#test-data-management)
9. [Adding New Tests](#adding-new-tests)
10. [Troubleshooting](#troubleshooting)

## Testing Philosophy

**Goals**:
- **Data Integrity**: Ensure Bitcoin Stamps data is accurately processed and served
- **API Reliability**: Verify all 46 API endpoints return correct data and status codes
- **Performance**: Validate response times meet SLA requirements (<500ms cached, <2s uncached)
- **Regression Prevention**: Catch breaking changes before they reach production

**Test Pyramid**:
```
       /\
      /  \     Newman API Tests (46 endpoints)
     /____\    ~92 comprehensive tests
    /      \
   /        \  Integration Tests (database + Redis)
  /__________\ ~10 tests
 /            \
/______________\ Unit Tests (154+ tests, 50+ with mocks)
                 Fast, isolated, predictable
```

## Test Types and Levels

### 1. Unit Tests (Fast, Isolated)

**Location**: `tests/unit/`

**What they test**:
- Repository classes (StampRepository, MarketDataRepository, SRC20Repository)
- Utility functions and helpers
- Data transformation logic
- Validation rules

**Key characteristics**:
- Use `MockDatabaseManager` for predictable data
- No external dependencies (no database, no Redis)
- Run in milliseconds
- Test data from `tests/fixtures/*.json`

**Run unit tests**:
```bash
# All unit tests
deno task test:unit

# With coverage
deno task test:unit:coverage

# Specific test file
cd tests && DENO_ENV=test SKIP_REDIS_CONNECTION=true deno test --allow-all unit/repositories/stampRepository.working.test.ts
```

### 2. Integration Tests (Database + Services)

**Location**: `tests/integration/`

**What they test**:
- DatabaseManager initialization and connection pooling
- Redis cache connectivity and fallback behavior
- Service availability detection
- Error handling for unavailable services

**Key characteristics**:
- Require MySQL + Redis services running
- Test actual database connectivity
- Verify graceful degradation when services unavailable
- CI-safe with conditional execution

**Run integration tests**:
```bash
# All integration tests (requires services)
deno task test:integration

# CI-safe version (with fallbacks)
deno task test:integration:ci
```

### 3. Newman API Tests (End-to-End)

**Location**: `tests/postman/collections/`

**What they test**:
- All 46 API endpoints
- Request/response validation
- Status codes and error handling
- Response time and performance
- Data consistency between dev and production

**Key characteristics**:
- Require running application server
- Test against real or seeded database
- Comprehensive coverage (100% of endpoints)
- Support dev vs production comparison

**Run Newman tests**:
```bash
# Against local dev server
deno task test:ci:newman-local

# Smoke tests (3 critical endpoints)
npm run test:api:smoke

# Comprehensive tests (46 endpoints)
npm run test:api:comprehensive

# Performance tests
npm run test:api:performance
```

## Local Development Testing

### Quick Start

**Run all tests locally**:
```bash
# 1. Unit tests (no setup required)
deno task test:unit

# 2. Start local dev environment
deno task test:dev:start

# Wait for services to start (check health)
curl http://localhost:8000/api/v2/health

# 3. Run Newman tests against local dev
deno task test:ci:newman-local

# 4. Stop services
deno task test:dev:stop
```

### Local Development Environment (docker-compose.dev.yml)

**Services included**:
- **MySQL 8.0**: Database with test schema and seed data
- **Redis 7**: Caching layer
- **Deno Application**: Fresh server on port 8000

**Starting the environment**:
```bash
# Start all services in detached mode
deno task test:dev:start

# View logs in real-time
deno task test:dev:logs

# Stop logs: Ctrl+C (services keep running)

# Restart services
deno task test:dev:restart

# Stop and remove all services
deno task test:dev:stop
```

**Environment configuration**:
The docker-compose.dev.yml automatically:
1. Creates MySQL database with user/password
2. Loads schema from `scripts/test-schema.sql` (on first run)
3. Seeds data from `scripts/test-seed-data.sql` (on first run)
4. Starts Redis with default configuration
5. Starts Deno app with environment variables configured

**Accessing services**:
```bash
# Application
curl http://localhost:8000/api/v2/health

# MySQL
mysql -h 127.0.0.1 -P 3306 -u btcstamps_dev -pbtcstamps_dev_pass btcstamps_test

# Redis
redis-cli -h 127.0.0.1 -p 6379 PING
```

**Troubleshooting the environment**:
```bash
# View service status
docker-compose -f docker-compose.dev.yml ps

# Check service logs
docker-compose -f docker-compose.dev.yml logs mysql
docker-compose -f docker-compose.dev.yml logs redis
docker-compose -f docker-compose.dev.yml logs deno-app

# Restart a specific service
docker-compose -f docker-compose.dev.yml restart deno-app

# Remove volumes (clean start)
docker-compose -f docker-compose.dev.yml down -v
```

## Unit Testing with MockDatabaseManager

### Overview

`MockDatabaseManager` (`tests/mocks/mockDatabaseManager.ts`) provides a fixture-based mock database for unit testing without MySQL dependency.

**Why use MockDatabaseManager?**
- ✅ Fast test execution (milliseconds)
- ✅ Predictable, repeatable test data
- ✅ No database setup required
- ✅ Works in any environment (CI, local, offline)
- ✅ Easy to add new test scenarios

**When NOT to use MockDatabaseManager**:
- ❌ Integration tests requiring real database
- ❌ Testing complex SQL queries or joins
- ❌ Performance testing database operations
- ❌ Testing database transaction behavior

### Using MockDatabaseManager

**Basic example**:
```typescript
import { assertEquals } from "@std/assert";
import { MockDatabaseManager } from "../mocks/mockDatabaseManager.ts";
import { StampRepository } from "$/server/repositories/stampRepository.ts";

Deno.test("StampRepository.getStampById returns correct stamp", async () => {
  // 1. Create mock database
  const mockDb = new MockDatabaseManager();

  // 2. Inject into repository
  const repo = new StampRepository(mockDb as unknown as DatabaseManager);

  // 3. Call repository method
  const stamp = await repo.getStampById("1");

  // 4. Assert results (data from tests/fixtures/stampData.json)
  assertEquals(stamp?.stamp_id, "1");
  assertEquals(stamp?.creator, "test_creator");
  assertEquals(stamp?.cpid, "A1234567890123456789");
});
```

### Fixture Files

Fixtures are located in `tests/fixtures/`:

**stampData.json**: Sample stamp records
```json
[
  {
    "stamp_id": "1",
    "cpid": "A1234567890123456789",
    "creator": "test_creator",
    "tx_hash": "abc123...",
    ...
  }
]
```

**marketData.json**: Market data samples
```json
[
  {
    "stamp_id": "1",
    "floor_price": 1000000,
    "last_sale_price": 1500000,
    ...
  }
]
```

**src20Data.json**: SRC-20 token data
```json
[
  {
    "tick": "STAMP",
    "max": "21000000",
    "lim": "1000",
    ...
  }
]
```

**collectionData.json**: Collection metadata
```json
[
  {
    "name": "Test Collection",
    "creator": "test_creator",
    "total_stamps": 100,
    ...
  }
]
```

### Supported Query Patterns

MockDatabaseManager recognizes common query patterns:

```typescript
// Stamp queries
await mockDb.query("SELECT * FROM stamps WHERE stamp_id = ?", [1]);
await mockDb.query("SELECT * FROM stamps WHERE creator = ?", ["test_creator"]);
await mockDb.query("SELECT * FROM stamps ORDER BY block_index DESC LIMIT 10");

// Market data queries
await mockDb.query("SELECT * FROM market_data WHERE stamp_id = ?", [1]);

// SRC-20 queries
await mockDb.query("SELECT * FROM src20_valid WHERE tick = ?", ["STAMP"]);

// Collection queries
await mockDb.query("SELECT * FROM collections WHERE creator = ?", ["test_creator"]);
```

### Adding New Query Pattern Support

**Step 1**: Identify the query pattern
```typescript
// Example: New query for stamp balance
const query = "SELECT * FROM stamp_balances WHERE address = ?";
```

**Step 2**: Add pattern matcher to MockDatabaseManager
```typescript
// In tests/mocks/mockDatabaseManager.ts, inside query() method

if (query.includes("SELECT * FROM stamp_balances")) {
  const address = params[0];
  return this.fixtures.stampBalances?.filter(
    (b: any) => b.address === address
  ) || [];
}
```

**Step 3**: Create fixture file
```bash
# tests/fixtures/stampBalances.json
[
  {
    "address": "bc1q...",
    "stamp_id": "1",
    "balance": 100
  }
]
```

**Step 4**: Load fixture in constructor
```typescript
// In MockDatabaseManager constructor
import stampBalancesFixtures from "../fixtures/stampBalances.json" with { type: "json" };

this.fixtures = {
  stamps: stampFixtures,
  stampBalances: stampBalancesFixtures, // Add here
  // ...
};
```

**Step 5**: Write tests
```typescript
Deno.test("BalanceRepository.getBalance returns correct balance", async () => {
  const mockDb = new MockDatabaseManager();
  const repo = new BalanceRepository(mockDb as unknown as DatabaseManager);

  const balance = await repo.getBalance("bc1q...", "1");

  assertEquals(balance, 100);
});
```

## Integration Testing

### Database Integration Tests

**Purpose**: Verify actual database connectivity and behavior.

**Location**: `tests/integration/databaseManager.integration.test.ts`

**What they test**:
- DatabaseManager singleton initialization
- Connection pool management
- Query execution
- Error handling
- Redis connection (when available)

**CI-safe testing**:
```typescript
// CI-safe test with fallback
Deno.test("DatabaseManager initializes successfully", async () => {
  try {
    const db = await DatabaseManager.getInstance();
    assert(db instanceof DatabaseManager);
  } catch (error) {
    // In CI without database, verify error handling
    assert(error.message.includes("database") || error.message.includes("connection"));
  }
});
```

**Running with services**:
```bash
# 1. Start services
deno task test:dev:start

# 2. Wait for services to be ready
sleep 10

# 3. Run integration tests
deno task test:integration

# 4. Stop services
deno task test:dev:stop
```

## Newman API Testing

### Overview

Newman (Postman CLI) tests provide comprehensive API endpoint coverage.

**Collections**:
- `comprehensive.json` - All 46 endpoints (92+ tests)
- `smoke-tests.json` - Critical 3 endpoints (health checks)
- `pagination-validation.json` - Pagination edge cases

### Running Newman Tests Locally

**Prerequisites**:
1. Local dev server running (port 8000)
2. Test database seeded with data
3. Newman installed globally

**Setup**:
```bash
# Install Newman globally
npm install -g newman newman-reporter-html newman-reporter-json

# Start local dev environment
deno task test:dev:start

# Wait for services (check health)
curl http://localhost:8000/api/v2/health
```

**Run tests**:
```bash
# Quick test with deno task
deno task test:ci:newman-local

# Or manually with Newman
newman run tests/postman/collections/comprehensive.json \
  --env-var dev_base_url=http://localhost:8000 \
  --reporters cli,html,json \
  --reporter-html-export reports/newman-local/report.html \
  --reporter-json-export reports/newman-local/report.json
```

**View results**:
```bash
# Open HTML report
open reports/newman-local/report.html

# Or check JSON
cat reports/newman-local/report.json | jq '.run.stats'
```

### Newman Test Structure

**Comprehensive collection** (`tests/postman/collections/comprehensive.json`):

Folders:
1. **Health Endpoints** (2 tests)
   - `/api/health`
   - `/api/v2/health`

2. **Stamp Endpoints** (20+ tests)
   - `/api/v1/stamps`
   - `/api/v1/stamps/:id`
   - `/api/v1/stamps/:id/balances`
   - Pagination, filtering, sorting

3. **SRC-20 Endpoints** (15+ tests)
   - `/api/v1/src20/ticks`
   - `/api/v1/src20/balances/:address`
   - `/api/v1/src20/tick/:tick`

4. **Block Endpoints** (10+ tests)
   - `/api/v1/blocks`
   - `/api/v1/blocks/:block`

5. **Collection Endpoints** (8+ tests)
   - `/api/v1/collections`
   - `/api/v1/collections/:creator`

6. **Tool Endpoints** (5+ tests)
   - Internal API endpoints (require auth in production)

**Test assertions**:
```javascript
// Status code validation
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Response structure
pm.test("Response has required fields", function () {
  const data = pm.response.json();
  pm.expect(data).to.have.property("success");
  pm.expect(data).to.have.property("data");
});

// Data validation
pm.test("Stamp has valid CPID format", function () {
  const stamp = pm.response.json().data;
  pm.expect(stamp.cpid).to.match(/^[A-Z][0-9A-Z]{19}$/);
});

// Performance validation
pm.test("Response time is acceptable", function () {
  pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

### Regression Testing

**Dev vs Production comparison**:
```bash
# Run against both environments
DEV_BASE_URL=http://localhost:8000 \
PROD_BASE_URL=https://stampchain.io \
docker-compose -f docker-compose.test.yml run --rm newman-comprehensive

# Analyze differences
node scripts/analyze-newman-regression.js

# View regression report
cat reports/newman-comprehensive/*-analysis.json
```

**Regression types detected**:
- **Breaking changes**: Status code changes, missing fields, type changes
- **Non-breaking changes**: New optional fields, formatting changes
- **Performance issues**: Response time degradation >20%
- **Performance improvements**: Response time improvement >20%

## CI/CD Testing

### GitHub Actions Workflows

**1. Unit Tests** (`.github/workflows/unit-tests.yml`)

**Triggers**: Push/PR to main/dev, changes to unit tests or lib/

**What it does**:
- Checks out code
- Installs Deno 2.4.2
- Verifies fixtures exist
- Runs `deno task test:unit:coverage`
- Uploads coverage to Codecov

**Expected results**:
- ✅ 154+ tests pass
- ✅ 50+ tests use MockDatabaseManager
- ✅ Coverage >80%

**2. Integration Tests** (`.github/workflows/integration-tests.yml`)

**Triggers**: Push/PR to main/dev, changes to integration tests or server/

**What it does**:
- Starts MySQL 8.0 service
- Starts Redis 7 service
- Loads test schema
- Runs `deno task test:integration:ci`
- Uploads coverage to Codecov

**Expected results**:
- ✅ DatabaseManager initializes
- ✅ Redis connection works (or falls back gracefully)
- ✅ Integration tests pass

**3. Newman Local Dev Tests** (`.github/workflows/newman-comprehensive-tests.yml`)

**Triggers**: Push/PR to main/dev, changes to postman collections or API code

**What it does**:
- Starts MySQL 8.0 service
- Starts Redis 7 service
- Loads test schema (`scripts/test-schema.sql`)
- Seeds test data (`scripts/test-seed-data.sql`)
- Starts local Deno dev server
- Waits for health check
- Runs Newman comprehensive tests
- Analyzes regression results
- Uploads test reports

**Expected results**:
- ✅ Dev server starts successfully
- ✅ Health check passes
- ✅ All 46 endpoints respond
- ✅ 92+ Newman assertions pass
- ✅ No breaking changes detected

### CI Environment Variables

**Unit tests**:
```bash
CI=true
DENO_ENV=test
SKIP_REDIS_CONNECTION=true
QUICKNODE_API_KEY=test-quicknode-key
ANTHROPIC_API_KEY=test-anthropic-key
PERPLEXITY_API_KEY=test-perplexity-key
```

**Integration tests**:
```bash
CI=true
DENO_ENV=test
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=testpassword
DB_NAME=stamps_test
REDIS_URL=redis://127.0.0.1:6379
SKIP_REDIS_CONNECTION=false
```

**Newman local dev tests**:
```bash
CI=true
DENO_ENV=development
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=test
DB_NAME=btcstamps_test
REDIS_URL=redis://127.0.0.1:6379
```

### Checking CI Status

**GitHub Actions UI**:
1. Go to repository on GitHub
2. Click "Actions" tab
3. View workflow runs
4. Check individual job logs

**Status badges** (add to README.md):
```markdown
![Unit Tests](https://github.com/stampchain-io/BTCStampsExplorer/workflows/Unit%20Tests%20with%20Fixtures/badge.svg)
![Integration Tests](https://github.com/stampchain-io/BTCStampsExplorer/workflows/Integration%20Tests/badge.svg)
![Newman Tests](https://github.com/stampchain-io/BTCStampsExplorer/workflows/Newman%20Comprehensive%20Tests/badge.svg)
```

## Test Data Management

### Test Schema (scripts/test-schema.sql)

**Purpose**: Define database structure for testing.

**Structure**:
```sql
-- Core tables
CREATE TABLE stamps (...);
CREATE TABLE blocks (...);
CREATE TABLE market_data (...);
CREATE TABLE src20_valid (...);
CREATE TABLE collections (...);

-- Indexes for performance
CREATE INDEX idx_stamp_id ON stamps(stamp_id);
CREATE INDEX idx_creator ON stamps(creator);
-- ...
```

**Updating schema**:
```bash
# 1. Edit schema file
vim scripts/test-schema.sql

# 2. Test locally
deno task test:dev:stop
deno task test:dev:start  # Reloads schema

# 3. Verify in CI
git add scripts/test-schema.sql
git commit -m "Update test schema"
git push  # CI will validate
```

### Test Seed Data (scripts/test-seed-data.sql)

**Purpose**: Provide realistic test data for Newman tests.

**Contents**:
```sql
-- Sample stamps
INSERT INTO stamps (stamp_id, cpid, creator, ...) VALUES
  ('1', 'A1234567890123456789', 'test_creator', ...),
  ('2', 'B9876543210987654321', 'test_creator', ...);

-- Sample market data
INSERT INTO market_data (stamp_id, floor_price, ...) VALUES
  ('1', 1000000, ...),
  ('2', 2000000, ...);

-- Sample SRC-20 tokens
INSERT INTO src20_valid (tick, max, lim, ...) VALUES
  ('STAMP', '21000000', '1000', ...);
```

**Updating seed data**:
```bash
# 1. Edit seed file
vim scripts/test-seed-data.sql

# 2. Reload data
deno task test:dev:stop
deno task test:dev:start

# 3. Verify Newman tests still pass
deno task test:ci:newman-local
```

### JSON Fixtures (tests/fixtures/*.json)

**Purpose**: Provide data for MockDatabaseManager in unit tests.

**Updating fixtures**:

```bash
# 1. Edit fixture file
vim tests/fixtures/stampData.json

# 2. Verify unit tests still pass
deno task test:unit

# 3. If test failures, update assertions
vim tests/unit/repositories/stampRepository.working.test.ts
```

**Best practices**:
- Keep fixtures small (5-10 records each)
- Use realistic data matching production schema
- Include edge cases (null values, empty strings, max lengths)
- Update fixtures when schema changes

## Adding New Tests

### Adding a Unit Test

**Step 1**: Choose location
```bash
tests/unit/
  ├── repositories/       # Repository class tests
  ├── utils/             # Utility function tests
  ├── services/          # Service class tests
  └── validation/        # Validation logic tests
```

**Step 2**: Create test file
```typescript
// tests/unit/repositories/newRepository.test.ts
import { assertEquals } from "@std/assert";
import { MockDatabaseManager } from "../../mocks/mockDatabaseManager.ts";
import { NewRepository } from "$/server/repositories/newRepository.ts";

Deno.test("NewRepository.getSomething returns data", async () => {
  const mockDb = new MockDatabaseManager();
  const repo = new NewRepository(mockDb as unknown as DatabaseManager);

  const result = await repo.getSomething("param");

  assertEquals(result?.id, "expected_id");
});
```

**Step 3**: Add fixture if needed
```json
// tests/fixtures/newData.json
[
  {
    "id": "expected_id",
    "name": "Test Data"
  }
]
```

**Step 4**: Update MockDatabaseManager
```typescript
// tests/mocks/mockDatabaseManager.ts

import newDataFixtures from "../fixtures/newData.json" with { type: "json" };

// In constructor
this.fixtures = {
  // ...
  newData: newDataFixtures,
};

// In query() method
if (query.includes("SELECT * FROM new_table")) {
  return this.fixtures.newData || [];
}
```

**Step 5**: Run test
```bash
deno task test:unit
```

### Adding an Integration Test

**Step 1**: Create test file
```typescript
// tests/integration/newService.integration.test.ts
import { assert } from "@std/assert";
import { DatabaseManager } from "$/server/database/DatabaseManager.ts";

Deno.test("NewService connects to database", async () => {
  const db = await DatabaseManager.getInstance();

  const result = await db.query("SELECT 1");

  assert(result.length > 0);
});
```

**Step 2**: Run with services
```bash
deno task test:dev:start
deno task test:integration
```

### Adding a Newman Test

**Step 1**: Open Postman
1. Import `tests/postman/collections/comprehensive.json`
2. Add new request to appropriate folder
3. Add test assertions

**Step 2**: Add tests
```javascript
pm.test("New endpoint returns 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response has expected structure", function () {
  const data = pm.response.json();
  pm.expect(data).to.have.property("success");
  pm.expect(data.success).to.eql(true);
});
```

**Step 3**: Export collection
1. File > Export
2. Collection v2.1
3. Save to `tests/postman/collections/comprehensive.json`

**Step 4**: Test locally
```bash
deno task test:ci:newman-local
```

## Troubleshooting

### Unit Tests Failing

**Problem**: MockDatabaseManager returns empty results
```
AssertionError: Values are not equal
  Expected: { stamp_id: "1", ... }
  Actual: undefined
```

**Solution**: Check query pattern matching
```typescript
// In tests/mocks/mockDatabaseManager.ts
console.log("Query:", query); // Debug query
console.log("Params:", params); // Debug params

// Verify query pattern matches
if (query.includes("SELECT * FROM stamps WHERE stamp_id = ?")) {
  // Pattern matches
}
```

**Problem**: Fixture file not found
```
error: Module not found "file:///tests/fixtures/newData.json"
```

**Solution**: Verify import path and file exists
```bash
ls tests/fixtures/newData.json
# If missing, create it

# Check import statement
import newData from "../fixtures/newData.json" with { type: "json" };
```

### Integration Tests Failing

**Problem**: Cannot connect to database
```
error: Connection refused (os error 111)
```

**Solution**: Start services
```bash
# Check if services running
docker-compose -f docker-compose.dev.yml ps

# If not running
deno task test:dev:start

# Wait for services to be healthy
sleep 10

# Check MySQL
mysql -h 127.0.0.1 -P 3306 -u btcstamps_dev -pbtcstamps_dev_pass btcstamps_test -e "SELECT 1"
```

**Problem**: Redis connection timeout
```
error: Redis connection timeout after 15000ms
```

**Solution**: Check Redis service
```bash
# Test Redis connection
redis-cli -h 127.0.0.1 -p 6379 PING

# If not responding, restart
docker-compose -f docker-compose.dev.yml restart redis
```

### Newman Tests Failing

**Problem**: Connection refused to localhost:8000
```
Error: connect ECONNREFUSED 127.0.0.1:8000
```

**Solution**: Start dev server
```bash
# Check if server running
curl http://localhost:8000/api/v2/health

# If not running
deno task test:dev:start

# Wait for health check
timeout 60 bash -c 'until curl -f http://localhost:8000/api/v2/health; do sleep 2; done'
```

**Problem**: Test assertions failing
```
AssertionError: expected 404 to equal 200
```

**Solution**: Check test data
```bash
# Verify seed data loaded
mysql -h 127.0.0.1 -P 3306 -u btcstamps_dev -pbtcstamps_dev_pass btcstamps_test \
  -e "SELECT COUNT(*) FROM stamps"

# If empty, reload seed data
mysql -h 127.0.0.1 -P 3306 -u btcstamps_dev -pbtcstamps_dev_pass btcstamps_test \
  < scripts/test-seed-data.sql
```

### CI Tests Failing

**Problem**: CI unit tests pass locally but fail in CI
```
error: Uncaught (in promise) TypeError: Cannot read property 'data' of undefined
```

**Solution**: Check environment variables
```typescript
// In test file, verify environment setup
Deno.test("Test with env check", async () => {
  assertEquals(Deno.env.get("DENO_ENV"), "test");
  assertEquals(Deno.env.get("SKIP_REDIS_CONNECTION"), "true");
  // ...
});
```

**Problem**: CI integration tests timeout
```
error: Test timeout after 30000ms
```

**Solution**: Check service health in workflow
```yaml
# In .github/workflows/integration-tests.yml
- name: Wait for MySQL
  run: |
    timeout 60 bash -c 'until mysqladmin ping -h 127.0.0.1 -u root -p$DB_PASSWORD; do
      sleep 2
    done'
```

**Problem**: Newman CI tests fail with 403
```
AssertionError: expected 403 to equal 200
```

**Solution**: Check endpoint permissions
```bash
# /api/internal/* endpoints require auth
# These are expected to return 403 in CI
# Update test to skip or expect 403
```

## Best Practices

### Writing Tests

**DO**:
- ✅ Use MockDatabaseManager for unit tests
- ✅ Test edge cases (null, empty, max length)
- ✅ Include meaningful assertions
- ✅ Keep tests focused and isolated
- ✅ Use descriptive test names

**DON'T**:
- ❌ Use real database in unit tests
- ❌ Test multiple things in one test
- ❌ Rely on test execution order
- ❌ Use hard-coded timeouts
- ❌ Skip error handling tests

### Maintaining Tests

**When to update tests**:
1. Schema changes → Update fixtures and seed data
2. New endpoints → Add Newman tests
3. New repositories → Add unit tests with mocks
4. Bug fixes → Add regression test

**Test maintenance checklist**:
- [ ] Update fixtures when schema changes
- [ ] Update MockDatabaseManager for new query patterns
- [ ] Update Newman collections when API changes
- [ ] Update test documentation
- [ ] Verify CI passes after updates

### Performance Considerations

**Unit tests**: Should run in <5 seconds total
**Integration tests**: Should run in <30 seconds total
**Newman tests**: Should run in <2 minutes total

**Optimization tips**:
- Use MockDatabaseManager instead of real DB
- Parallelize independent tests
- Minimize test data size
- Cache Deno dependencies in CI

## Resources

### Documentation
- [Deno Testing](https://docs.deno.com/runtime/manual/basics/testing/)
- [Newman CLI](https://github.com/postmanlabs/newman)
- [Postman Testing Guide](https://learning.postman.com/docs/writing-scripts/test-scripts/)

### Project Files
- [Unit Tests](tests/unit/)
- [Integration Tests](tests/integration/)
- [Newman Collections](tests/postman/collections/)
- [Test Fixtures](tests/fixtures/)
- [Mock Database](tests/mocks/mockDatabaseManager.ts)

### CI/CD
- [Unit Tests Workflow](.github/workflows/unit-tests.yml)
- [Integration Tests Workflow](.github/workflows/integration-tests.yml)
- [Newman Tests Workflow](.github/workflows/newman-comprehensive-tests.yml)

## Support

For testing questions or issues:
1. Check this guide
2. Review test examples in `tests/`
3. Check CI logs for failures
4. Consult CLAUDE.md for project-specific guidance

---

**Last Updated**: 2026-02-13
**Test Coverage**: 154+ unit tests, 10+ integration tests, 92+ Newman API tests
**Endpoint Coverage**: 46/46 endpoints (100%)
