# API Test Suite Summary

## Core Test Commands

### 1. **Smoke Tests** (`test:api:simple`)
- **Collection**: `postman-collection-smoke.json`
- **Purpose**: Quick basic health checks
- **Tests**: 3 endpoints (health, version, basic stamps)
- **Status**: ✅ Working

### 2. **Comprehensive Regression** (`test:api`)
- **Collection**: `postman-collection-comprehensive.json`
- **Purpose**: Full dev vs production comparison
- **Tests**: 103+ endpoints with dual environment testing
- **Status**: ✅ Fixed (was having syntax errors)

### 3. **Advanced Tests** (`test:api:advanced`)
- **Collection**: `postman-collection-advanced.json`
- **Purpose**: Advanced endpoint testing
- **Tests**: 7 endpoints with detailed validations
- **Status**: ✅ Working

### 4. **Enhanced Tests** (`test:api:enhanced`)
- **Collection**: `postman-collection-enhanced.json`
- **Purpose**: Enhanced dual endpoint testing
- **Tests**: 9 endpoints with enhanced validations
- **Status**: ✅ Working

### 5. **Performance Tests** (`test:api:performance`)
- **Collection**: `postman-collection-enhanced.json` (with delays)
- **Purpose**: Performance testing with request delays
- **Status**: ✅ Working

### 6. **Pagination Tests** (no direct task, use docker)
- **Collection**: `postman-collection-pagination-validation.json`
- **Purpose**: Pagination boundary and validation testing
- **Tests**: 48 pagination-specific tests
- **Status**: ✅ Working

## Utility Commands

- `test:api:verbose` - Run with verbose output
- `test:api:bail` - Stop on first failure
- `test:api:iterations` - Run multiple iterations
- `test:api:timeout` - Custom timeout
- `test:api:dev-only` - Test only development
- `test:api:prod-only` - Test only production
- `test:api:folder` - Run specific folder
- `test:api:all` - Run simple + advanced + performance

## Quick Test Commands

```bash
# Quick smoke test
deno task test:api:simple

# Full regression test
deno task test:api

# Test with bail on first failure
deno task test:api:bail

# Performance test
deno task test:api:performance

# Run all main tests
deno task test:api:all
```

## Files Cleaned Up

- `postman-collection-full-regression.json` (duplicate of comprehensive)
- `postman-collection-regression.json` (old version)
- `postman-collection-api-versioning.json` (unused)
- Various backup and temporary files

## Final Collection Files (5 total)

1. `postman-collection-smoke.json` - Basic smoke tests
2. `postman-collection-comprehensive.json` - Full regression testing
3. `postman-collection-advanced.json` - Advanced endpoint tests
4. `postman-collection-enhanced.json` - Enhanced dual endpoint tests
5. `postman-collection-pagination-validation.json` - Pagination tests