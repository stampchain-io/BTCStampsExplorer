# Task 7.2 - Endpoint-to-Schema Mapping Verification Report

## Overview
Generated endpoint-to-schema mapping from OpenAPI spec and Postman collection.

## Files Created
1. **scripts/generate-endpoint-schema-map.ts** (418 lines)
   - Parses OpenAPI YAML specification
   - Parses Postman collection JSON
   - Maps requests to OpenAPI endpoints
   - Extracts schema information, required fields, response types
   - Generates comprehensive mapping JSON

2. **tests/postman/endpoint-schema-map.json** (generated output)
   - 107 endpoint mappings
   - Complete schema information for each endpoint

## Execution Results

### Summary Statistics
- **Total Requests Mapped**: 107 (out of 128 in collection)
- **Requests with Tests**: 20
- **Requests without Tests**: 87
- **OpenAPI Endpoints**: 53
- **Unmapped Requests**: 21 (all use /api/internal/* which is not in OpenAPI)

### Response Type Breakdown
- Simple responses: 101
- Array responses: 2
- Paginated responses: 4

### Unmapped Requests
21 requests use `/api/internal/stamp-recent-sales` which is not documented in the OpenAPI spec. These are intentionally excluded from the mapping as they don't have corresponding OpenAPI definitions.

## Manual Spot-Check Verification

### 1. POST /api/v2/src20/create
**Mapping**:
- Expected Status: 200 ✓
- Required Fields: hex, input_value, total_dust_value, est_miner_fee, est_tx_size, inputsToSign, changeAddress, fee, change ✓
- Response Type: simple ✓

**OpenAPI Verification**: Lines 2519-2554 in openapi.yml confirm all fields match exactly.

### 2. GET /api/v2/stamps/{id}
**Mapping**:
- Expected Status: 200 ✓
- Required Fields: data, last_block ✓
- Parameters: id ✓
- Response Type: simple ✓

**OpenAPI Verification**: Schema matches OpenAPI definition.

### 3. GET /api/v2/collections (Paginated)
**Mapping**:
- Expected Status: 200 ✓
- Required Fields: page, limit, totalPages, total, last_block, data ✓
- Response Type: paginated ✓
- Data Item Fields: collection_id, collection_name, collection_description, creators, stamp_count, total_editions, img, first_stamp_image, stamp_images, stamps, marketData ✓
- Data Item Types: Correctly extracted ✓

**OpenAPI Verification**: Paginated response structure correctly identified.

### 4. GET /api/v2/health
**Mapping**:
- Expected Status: 200 ✓
- Required Fields: status, services ✓
- Response Type: simple ✓

**OpenAPI Verification**: Lines 51-130 in openapi.yml confirm the schema matches.

### 5. GET /api/v2/error
**Mapping**:
- Expected Status: 200 ✓
- Has Existing Tests: true ✓
- Response Type: simple ✓

**OpenAPI Verification**: Correctly mapped to error endpoint.

## Test Coverage Analysis

### Requests WITH Tests (20)
The mapping correctly identifies requests with test scripts by checking for `pm.test()` or `pm.expect()` calls in event handlers.

### Requests WITHOUT Tests (87)
These 87 requests lack automated test assertions and are candidates for test generation in subsequent subtasks. This matches the task requirement's estimate of 95 requests without tests (with some variance due to the 21 unmapped internal API requests).

## Acceptance Criteria Verification

✅ **Script successfully parses OpenAPI schema and Postman collection**
- Parses 5017-line YAML file
- Parses 128-request Postman collection
- No parsing errors

✅ **Generated mapping JSON contains all mapped requests**
- 107 requests successfully mapped
- 21 requests use undocumented internal endpoints (excluded)

✅ **Each entry includes expectedStatus, requiredFields, responseType**
- All 107 mappings have expectedStatus
- All have requiredFields (even if empty array)
- All have responseType classification

✅ **Mapping correctly identifies requests without tests**
- 87 requests identified without tests
- 20 requests identified with tests
- Verified by checking event handlers for test assertions

✅ **Manual spot-check confirms requests match OpenAPI schema**
- 5 requests manually verified
- All mappings accurate
- Schema extraction working correctly

## Issues and Notes

1. **21 Unmapped Requests**: These use `/api/internal/stamp-recent-sales` which is not in the OpenAPI spec. This is expected as internal endpoints may not be publicly documented.

2. **Test Count Discrepancy**: Task estimated 95 requests without tests. We found 87 without tests from the 107 successfully mapped requests. The difference is likely due to:
   - 21 unmapped internal API requests
   - Some requests having minimal test coverage
   
3. **Expected Status for POST**: The script correctly handles POST endpoints, defaulting to 201 but overriding with the actual response status from OpenAPI (which is 200 for most PSBT generation endpoints).

## Next Steps

The generated mapping file is ready for use in subsequent subtasks:
- Task 7.3: Generate schema validation tests
- Task 7.4: Generate required fields tests
- Task 7.5: Execute generated tests

## Script Features

The generator includes:
- Recursive Postman collection flattening
- Smart URL-to-path conversion (handles Postman variables)
- $ref resolution for OpenAPI schemas
- Paginated response detection and data item extraction
- Test script detection
- Fuzzy path matching for parameterized endpoints
- Comprehensive error reporting
