# Postman API Tests

This directory contains Postman collections for testing the BTC Stamps Explorer API.

## Directory Structure

```
postman/
├── collections/          # Test collections
├── environments/         # Environment configurations
└── data/                # Test data files
```

## Collections

### 1. comprehensive.json
**Purpose**: Full API endpoint coverage with comprehensive validation  
**Endpoints**: 103+ API endpoints  
**Use Case**: Daily regression testing, CI/CD pipeline  

```bash
# Run comprehensive tests
docker-compose -f docker-compose.test.yml run --rm newman
```

### 2. regression-v23.json
**Purpose**: Version comparison testing between v2.2 and v2.3  
**Features**: 
- Deep field comparison
- Type validation
- Pagination structure validation
- Breaking change detection

```bash
# Run regression tests
docker-compose -f docker-compose.test.yml run --rm \
  -e NEWMAN_COLLECTION=tests/postman/collections/regression-v23.json newman
```

### 3. pagination-validation.json
**Purpose**: Pagination boundary and edge case testing  
**Tests**:
- Zero/negative limits
- Page overflow scenarios
- Maximum limit enforcement
- SQL injection prevention

```bash
# Run pagination tests
docker-compose -f docker-compose.test.yml run --rm newman-pagination
```

### 4. smoke.json
**Purpose**: Quick health check of critical endpoints  
**Runtime**: < 30 seconds  
**Use Case**: Pre-deployment verification, uptime monitoring

```bash
# Run smoke tests
docker-compose -f docker-compose.test.yml run --rm \
  -e NEWMAN_COLLECTION=tests/postman/collections/smoke.json \
  -e NEWMAN_BAIL=true newman
```

## Environments

### default.json
Basic environment variables:
- `base_url`: API base URL
- `test_stamp_id`: Default stamp ID for testing
- `test_address`: Default Bitcoin address for testing

### comprehensive.json
Extended environment with additional test data:
- Multiple test addresses
- Various stamp IDs
- SRC-20 token examples
- Collection IDs

## Running Tests

### Using npm scripts
```bash
# Run all tests
npm run test:api

# Run specific collection
npm run test:api -- tests/postman/collections/smoke.json

# Run with specific environment
npm run test:api -- --environment tests/postman/environments/comprehensive.json
```

### Using Docker directly
```bash
# Basic run
docker-compose -f docker-compose.test.yml run --rm newman

# With custom collection
docker-compose -f docker-compose.test.yml run --rm \
  -e NEWMAN_COLLECTION=tests/postman/collections/smoke.json newman

# Against production
docker-compose -f docker-compose.test.yml run --rm \
  -e PROD_BASE_URL=https://stampchain.io \
  -e DEV_BASE_URL=https://staging.stampchain.io newman
```

## Test Reports

Reports are generated in `reports/newman/` with timestamps:
- HTML report: `{timestamp}-report.html`
- JSON results: `{timestamp}-results.json`

## Adding New Tests

1. Create collection in Postman app
2. Export as Collection v2.1
3. Place in `collections/` with descriptive name
4. Update this README
5. Add npm script if needed

## CI/CD Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run API Tests
  run: |
    docker-compose -f docker-compose.test.yml run --rm \
      -e NEWMAN_BAIL=true \
      -e NEWMAN_COLLECTION=tests/postman/collections/smoke.json \
      newman
```

## Maintenance

- Review and update test data quarterly
- Add new endpoints to comprehensive collection
- Update regression tests for new API versions
- Archive deprecated collections in `_archive/` folder