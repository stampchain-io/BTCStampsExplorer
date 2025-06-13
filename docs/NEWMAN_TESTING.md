# Newman Enhanced API Testing System

This document describes the sophisticated Newman-based API testing system that replaces the broken Dredd setup. The system provides dual endpoint comparison, advanced reporting, performance monitoring, and flexible configuration options.

## Overview

The Newman testing system offers:
- **Dual Endpoint Comparison**: Simultaneous testing of development and production endpoints
- **Advanced Response Comparison**: Deep object comparison with difference detection
- **Performance Monitoring**: Response time analysis with configurable thresholds
- **Comprehensive Reporting**: HTML, JSON, and Markdown reports with visualizations
- **Flexible Configuration**: Environment variables for all testing parameters
- **Multiple Test Collections**: Simple, advanced, and performance-focused collections
- **Docker Integration**: Fully containerized testing environment

## Quick Start

### Basic Testing
```bash
# Run enhanced collection with dual endpoint comparison
npm run test:api

# Run simple collection (basic endpoints only)
npm run test:api:simple

# Run advanced collection with verbose output
npm run test:api:advanced

# Run performance testing with multiple iterations
npm run test:api:performance
```

### Using Deno Tasks
```bash
# Same functionality using Deno
deno task test:api
deno task test:api:simple
deno task test:api:advanced
deno task test:api:performance
```

## Available Test Collections

### 1. Enhanced Collection (`postman-collection-enhanced.json`)
- **Purpose**: Comprehensive dual endpoint testing
- **Features**: Pre-request scripts, test scripts, response comparison
- **Endpoints**: All 46+ API endpoints
- **Comparison**: Development vs Production
- **Performance**: Response time tracking and analysis

### 2. Simple Collection (`postman-collection-simple.json`)
- **Purpose**: Basic endpoint validation
- **Features**: Simple request/response validation
- **Endpoints**: Core API endpoints
- **Use Case**: Quick smoke testing

### 3. Advanced Collection (`postman-collection-advanced.json`)
- **Purpose**: Complex scenarios and edge cases
- **Features**: Advanced test scripts, error handling
- **Endpoints**: All endpoints with complex validation
- **Use Case**: Comprehensive regression testing

## Docker Services

### Primary Services

#### `newman` (Default)
- **Collection**: `postman-collection-enhanced.json`
- **Reporters**: `cli,html,json,enhanced`
- **Mode**: Sequential execution
- **Use**: `npm run test:api`

#### `newman-simple`
- **Collection**: `postman-collection-simple.json`
- **Reporters**: `cli,html,json`
- **Mode**: Sequential execution
- **Use**: `npm run test:api:simple`

#### `newman-advanced`
- **Collection**: `postman-collection-advanced.json`
- **Reporters**: `cli,html,json,enhanced`
- **Mode**: Sequential with verbose output
- **Use**: `npm run test:api:advanced`

#### `newman-parallel`
- **Collection**: `postman-collection-enhanced.json`
- **Reporters**: `cli,html,json,enhanced`
- **Mode**: Parallel execution (2 iterations)
- **Use**: `npm run test:api:parallel`

#### `newman-performance`
- **Collection**: `postman-collection-enhanced.json`
- **Reporters**: `cli,html,json,enhanced`
- **Mode**: Performance testing (3 iterations, 100ms delay)
- **Monitoring**: Enhanced performance thresholds
- **Use**: `npm run test:api:performance`

## Environment Variables

### Core Configuration
```bash
# Collection and environment
NEWMAN_COLLECTION=postman-collection-enhanced.json
NEWMAN_ENVIRONMENT=postman-environment.json

# Reporters
NEWMAN_REPORTERS=cli,html,json,enhanced
REPORT_PREFIX=newman

# Execution settings
NEWMAN_PARALLEL=false
NEWMAN_TIMEOUT=30000
NEWMAN_DELAY_REQUEST=0
NEWMAN_ITERATIONS=1
NEWMAN_VERBOSE=false
NEWMAN_BAIL=false
```

### Endpoint Configuration
```bash
# Development server
DEV_BASE_URL=http://host.docker.internal:8000

# Production server
PROD_BASE_URL=https://stampchain.io
```

### Performance Monitoring
```bash
# Enable monitoring
ENABLE_PERFORMANCE_MONITORING=true

# Thresholds (percentage)
PERFORMANCE_THRESHOLD_WARNING=10
PERFORMANCE_THRESHOLD_CRITICAL=25
```

## Advanced Usage

### Custom Test Scenarios

#### Test Specific Folder
```bash
# Test only authentication endpoints
NEWMAN_FOLDER="Authentication" npm run test:api

# Test only SRC20 endpoints
NEWMAN_FOLDER="SRC20" npm run test:api
```

#### Custom Timeout and Iterations
```bash
# Longer timeout for slow endpoints
NEWMAN_TIMEOUT=60000 npm run test:api

# Multiple iterations for reliability testing
NEWMAN_ITERATIONS=5 npm run test:api
```

#### Development vs Production Testing
```bash
# Test development server only
PROD_BASE_URL=http://host.docker.internal:8000 npm run test:api

# Test production server only
DEV_BASE_URL=https://stampchain.io npm run test:api
```

#### Verbose Output and Debugging
```bash
# Enable verbose output
NEWMAN_VERBOSE=true npm run test:api

# Stop on first failure
NEWMAN_BAIL=true npm run test:api
```

### Performance Testing
```bash
# Strict performance monitoring
PERFORMANCE_THRESHOLD_WARNING=5 \
PERFORMANCE_THRESHOLD_CRITICAL=15 \
npm run test:api:performance

# Load testing with multiple iterations
NEWMAN_ITERATIONS=10 \
NEWMAN_DELAY_REQUEST=50 \
npm run test:api:performance
```

## Report Generation

### Automatic Reports
All test runs generate reports in the `reports/` directory:

- **HTML Reports**: Interactive reports with charts and visualizations
- **JSON Reports**: Raw test data for programmatic analysis
- **Enhanced Reports**: Custom analysis with performance metrics

### Report Structure
```
reports/
├── newman/
│   ├── 20240101_120000-sequential-report.html
│   ├── 20240101_120000-sequential-results.json
│   └── 20240101_120000-sequential-enhanced.json
├── newman-simple/
├── newman-advanced/
├── newman-parallel/
└── newman-performance/
```

### Enhanced Analysis
The system automatically generates enhanced analysis reports when the `scripts/generate-enhanced-reports.cjs` script is available:

- **Performance Trends**: Response time analysis over multiple runs
- **Endpoint Health**: Success rates and error patterns
- **Comparison Results**: Detailed differences between development and production
- **Recommendations**: Actionable insights for API improvements

## Troubleshooting

### Common Issues

#### Connection Problems
```bash
# Check Docker network connectivity
docker-compose -f docker-compose.test.yml run --rm newman sh -c "ping -c 1 host.docker.internal"

# Test endpoint accessibility
docker-compose -f docker-compose.test.yml run --rm newman sh -c "wget -q --spider http://host.docker.internal:8000/api/v2/stamps?limit=1"
```

#### Custom Reporter Issues
```bash
# Verify custom reporter is available
docker-compose -f docker-compose.test.yml run --rm newman sh -c "ls -la newman-reporter-enhanced.js"

# Test without custom reporter
NEWMAN_REPORTERS=cli,html,json npm run test:api
```

#### Performance Issues
```bash
# Increase timeout for slow endpoints
NEWMAN_TIMEOUT=120000 npm run test:api

# Reduce parallel load
NEWMAN_ITERATIONS=1 NEWMAN_DELAY_REQUEST=1000 npm run test:api
```

### Debug Mode
```bash
# Enable all debugging
NEWMAN_VERBOSE=true \
NODE_ENV=development \
npm run test:api
```

## Migration from Dredd

The Newman system replaces the broken Dredd setup with enhanced capabilities:

### Improvements Over Dredd
- **Working Docker Integration**: No more HTTP request failures
- **Dual Endpoint Comparison**: Compare development vs production
- **Better Error Handling**: Detailed error reporting and analysis
- **Performance Monitoring**: Response time tracking and alerts
- **Flexible Configuration**: Environment variable control
- **Enhanced Reporting**: Multiple report formats with visualizations

### Compatibility
- **API Coverage**: Tests all 46+ endpoints previously covered by Dredd
- **Schema Validation**: Maintains OpenAPI schema validation
- **CI/CD Integration**: Drop-in replacement for existing pipelines

## Best Practices

### Regular Testing
```bash
# Daily regression testing
npm run test:api:all

# Pre-deployment validation
npm run test:api:performance

# Development testing
npm run test:api:simple
```

### Performance Monitoring
```bash
# Establish baselines
NEWMAN_ITERATIONS=3 npm run test:api:performance

# Monitor for regressions
PERFORMANCE_THRESHOLD_WARNING=5 npm run test:api
```

### Report Management
```bash
# Clean old reports
npm run test:api:clean

# Archive important reports
cp reports/newman-performance/* reports/archive/
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run API Tests
  run: npm run test:api:all

- name: Upload Test Reports
  uses: actions/upload-artifact@v3
  with:
    name: newman-reports
    path: reports/
```

### Docker Compose in CI
```bash
# CI-friendly testing
docker-compose -f docker-compose.test.yml run --rm newman-simple
```

## Support and Maintenance

### Updating Collections
1. Modify Postman collections using Postman app
2. Export updated collections to project root
3. Test with `npm run test:api:simple` first
4. Run full test suite with `npm run test:api:all`

### Adding New Endpoints
1. Add endpoint to appropriate Postman collection
2. Include pre-request and test scripts for dual comparison
3. Update documentation
4. Test thoroughly with `npm run test:api:verbose`

### Performance Tuning
1. Monitor reports for slow endpoints
2. Adjust timeouts and thresholds as needed
3. Use performance testing to establish baselines
4. Implement caching or optimization based on results

For additional support, refer to the Newman documentation or create an issue in the project repository. 