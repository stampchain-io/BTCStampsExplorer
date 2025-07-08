# Postman Collection Inventory

## Collections to Keep for Production ✅

### 1. **postman-collection-comprehensive.json** (220KB)
- **Purpose**: Full API endpoint coverage
- **Tests**: 103+ endpoints with response validation
- **Status**: Production-ready, actively used

### 2. **postman-collection-regression-v23.json** (33KB)
- **Purpose**: v2.3 regression testing with deep comparison
- **Tests**: Field comparison, pagination, type validation
- **Status**: Production-ready, fixed and validated

### 3. **postman-collection-pagination-validation.json** (80KB)
- **Purpose**: Pagination boundary and edge case testing
- **Tests**: Limit validation, page overflow, SQL injection tests
- **Status**: Production-ready

### 4. **postman-collection-smoke.json** (4KB)
- **Purpose**: Quick health check of critical endpoints
- **Tests**: Basic connectivity and response validation
- **Status**: Production-ready

## Collections to Archive/Remove ❌

### 1. **postman-collection-advanced.json** (21KB)
- **Reason**: Functionality merged into comprehensive collection

### 2. **postman-collection-enhanced.json** (23KB)
- **Reason**: Superseded by comprehensive collection

### 3. **postman-collection-comprehensive-enhanced.json** (19KB)
- **Reason**: Experimental version, features merged into main comprehensive

## Environment Files to Keep ✅

### 1. **postman-environment.json**
- Basic environment variables for all tests

### 2. **postman-environment-comprehensive.json**
- Extended environment with additional test variables

## Data Files to Keep ✅

### 1. **postman-data-pagination-tests.json**
- Test data for pagination validation

## Proposed Organization

```
tests/
├── postman/
│   ├── collections/
│   │   ├── comprehensive.json
│   │   ├── regression-v23.json
│   │   ├── pagination-validation.json
│   │   └── smoke.json
│   ├── environments/
│   │   ├── default.json
│   │   └── comprehensive.json
│   └── data/
│       └── pagination-tests.json
└── README.md
```

## Migration Plan

1. Keep only production-ready collections
2. Simplify naming (remove "postman-collection-" prefix)
3. Update all references in docker-compose and scripts
4. Archive old/experimental collections in a separate folder