# OpenAPI Contract Testing with Newman

## Overview

The OpenAPI contract testing validates that API responses match the OpenAPI schema definitions. This helps catch schema mismatches that regular Newman tests might miss.

## Setup

### 1. Environment Variable

Add to your `.env` file:
```bash
OPENAPI_VALIDATION_ENABLED=true
```

### 2. Running Tests

#### Option A: Using the OpenAPI Validator Script (Recommended)

```bash
# Run comprehensive tests with OpenAPI validation
deno task test:api

# Run specific test collections
deno task test:api:simple
deno task test:api:advanced
deno task test:api:performance

# Or use the OpenAPI validator directly
node scripts/newman-openapi-validator.js \
  ./static/swagger/openapi.yml \
  ./tests/postman/collections/comprehensive.json \
  ./tests/postman/environments/default.json
```

#### Option B: Using Existing Newman Tests

The existing Newman tests will work as before. To add OpenAPI validation:

1. The server middleware checks `OPENAPI_VALIDATION_ENABLED`
2. When enabled, responses include validation headers:
   - `X-Schema-Validated: true/false`
   - `X-Schema-Validation-Error: {...}` (in development)

#### Option C: Adding Validation to Postman Tests

Import the validation scripts in your Postman collection:

```javascript
// In Collection Pre-request Script
const { preRequestScript } = require('./scripts/openapi-contract-test.js');
eval(preRequestScript);

// In Test Scripts
const { testScript } = require('./scripts/openapi-contract-test.js');
eval(testScript);
```

## How It Works

1. **Server-side Validation** (when `OPENAPI_VALIDATION_ENABLED=true`):
   - Middleware validates responses against OpenAPI schema
   - Adds validation headers to responses
   - Logs validation errors (doesn't break responses)

2. **Client-side Validation** (Newman script):
   - Loads OpenAPI spec
   - Validates each response against expected schema
   - Reports validation failures
   - Generates summary report

## Current Status

- ✅ Server middleware implemented
- ✅ Newman validation script created
- ✅ Unit tests for validator
- ✅ Environment variable added to `.env.sample`
- ⏳ Integration with existing Newman tests (optional)
- ⏳ CI/CD pipeline integration (future)

## Benefits

1. **Catches Schema Mismatches**: Detects when API responses don't match OpenAPI definitions
2. **Version Compatibility**: Validates v2.2/v2.3 schema transitions
3. **Early Detection**: Finds issues before they reach production
4. **Documentation Accuracy**: Ensures API docs match actual responses

## Troubleshooting

### Validation Not Running
- Check `OPENAPI_VALIDATION_ENABLED=true` is set
- Verify OpenAPI spec exists at `./static/swagger/openapi.yml`
- Check server logs for validation errors

### False Positives
- OpenAPI spec might be outdated
- Response might include extra fields not in schema
- Check if middleware transformations are applied

### Performance Impact
- Validation adds <10ms per request
- Schemas are pre-compiled on startup
- Can be disabled in production if needed