# Daily Regression Testing

## Overview

The daily regression testing system automatically monitors the API for unexpected changes, performance degradations, and endpoint availability issues. It runs comprehensive Newman tests against the production API daily and creates GitHub issues when critical regressions are detected.

## Workflow Files

### Primary Workflow: `daily-regression-tests.yml`

**Schedule:**
- Daily at 2:00 AM UTC (catches regressions early)
- Weekly summary on Sundays at 6:00 AM UTC
- Manual trigger available via workflow_dispatch

**Features:**
- ✅ Weekend scheduling (configurable skip option)
- ✅ Comprehensive regression analysis
- ✅ Historical trend tracking
- ✅ Automatic GitHub issue creation for critical issues
- ✅ Performance benchmarking
- ✅ Report archival and cleanup
- ✅ Weekly summary generation

### Supporting Workflow: `newman-comprehensive-tests.yml`

**Purpose:** Provides the core Newman testing infrastructure
**Triggers:** PRs, pushes, and scheduled runs
**Integration:** Used by daily regression tests for actual test execution

## Test Configuration

### Production Testing
- **Target API:** https://stampchain.io
- **Coverage:** 46/46 endpoints (100%)
- **Test Count:** 92+ individual tests
- **Iterations:** 2 per run (for stability)

### Performance Baselines
- **Max Response Time:** 2000ms average
- **Max Failure Rate:** 5%
- **Critical Threshold:** 50% performance degradation
- **Warning Threshold:** 25% performance degradation

## Expected Changes Management

### Configuration File: `scripts/validate-expected-changes.js`

Defines what changes are expected between dev and production:

```javascript
const EXPECTED_CHANGES = {
  allowedFieldAdditions: [
    "marketData",
    "dispenserInfo", 
    "cacheStatus",
    "createdAt",
    "updatedAt"
  ],
  
  statusCodeChanges: {
    "/api/v2/stamps/invalid": {
      old: 200,
      new: 404,
      description: "Fixed to return 404 for invalid stamp IDs"
    }
  },
  
  missingEndpoints: [
    "/api/v2/stamps/{id}/dispensers",
    "/api/v2/stamps/{id}/dispenses"
  ]
};
```

### When to Update Expected Changes

1. **New API Features:** Add new field names to `allowedFieldAdditions`
2. **Endpoint Changes:** Update `endpointChanges` with descriptions
3. **Status Code Fixes:** Document in `statusCodeChanges`
4. **Missing Endpoints:** List in `missingEndpoints` until implemented

## Notification System

### Critical Issues (Creates GitHub Issues)
- Unexpected API changes
- Endpoint unavailability  
- Severe performance degradation (>50%)
- Test failure rate >5%

### Warning Issues (Logged Only)
- Minor test failures
- Performance concerns (25-50% degradation)
- New optional fields not in expected list

### Issue Management
- **Auto-created:** Issues are automatically created for critical regressions
- **Labels:** `regression`, `automated`, `critical`
- **Updates:** Existing issues are updated if already open for the day
- **Resolution:** Close issues manually after investigation

## Report Structure

### Daily Reports (`reports/daily-regression/`)

Each run creates a timestamped directory:
```
reports/daily-regression/
├── 20250102_020015/           # Timestamp format: YYYYMMDD_HHMMSS
│   ├── test-results.json      # Raw Newman results
│   ├── test-report.html       # HTML report
│   ├── regression-analysis.json
│   └── daily_summary.md
├── expected-changes-validation.json
└── trends-analysis.json       # Weekly runs only
```

### Weekly Reports
- **Generated:** Every Sunday
- **Content:** 7-day trend analysis
- **Metrics:** Failure rates, response times, regression counts
- **Retention:** 365 days

## Local Testing

### Run Daily Regression Locally
```bash
# Full daily regression suite
npm run test:api:daily:analyze

# Just the tests (without analysis)
npm run test:api:daily:regression

# Manual validation of expected changes
npm run test:api:validate:expected
```

### Test Specific Endpoints
```bash
# Test only stamp endpoints
NEWMAN_FOLDER="Stamps Endpoints" npm run test:api:daily:regression

# Test only SRC-20 endpoints  
NEWMAN_FOLDER="SRC-20 Endpoints" npm run test:api:daily:regression

# Test with verbose output
NEWMAN_VERBOSE=true npm run test:api:daily:regression
```

## Troubleshooting

### Common Issues

#### 1. False Positive Regressions
**Symptoms:** Issues created for expected changes
**Solution:** Update `scripts/validate-expected-changes.js` to include the new expected changes

#### 2. High Failure Rate
**Symptoms:** Many tests failing consistently
**Investigation:**
- Check production API health
- Review recent deployments
- Verify endpoint URLs haven't changed
- Check for rate limiting

#### 3. Performance Degradation
**Symptoms:** Response times exceeding thresholds
**Investigation:**
- Compare with historical trends
- Check production server resources
- Verify network connectivity
- Review database performance

#### 4. Missing Test Reports
**Symptoms:** Workflow completes but no reports generated
**Investigation:**
- Check Docker container logs
- Verify Newman collection file exists
- Check environment configuration
- Review workflow permissions

### Debugging Commands

```bash
# Check workflow status
gh run list --workflow=daily-regression-tests.yml

# View specific run details
gh run view <run-id>

# Download reports from workflow
gh run download <run-id>

# Test Newman collection locally
docker-compose -f docker-compose.test.yml run --rm newman-comprehensive

# Validate collection file
newman run postman-collection-full-regression.json --dry-run
```

## Maintenance

### Weekly Tasks
- ✅ Automated: Review open regression issues
- ✅ Automated: Check trends analysis
- ✅ Automated: Clean up old reports
- 🔲 Manual: Update expected changes if needed

### Monthly Tasks
- Review performance baselines
- Update critical thresholds if needed
- Archive old workflow runs
- Review notification settings

### Configuration Updates

#### Adding New Endpoints
1. Update Postman collection with new tests
2. Re-export as `postman-collection-full-regression.json`
3. Update endpoint count in workflow files
4. Add to expected changes if needed

#### Changing Notification Settings
Edit `scripts/newman-ci-config.json`:
```json
{
  "notifications": {
    "enabled": true,
    "severity": {
      "critical": {
        "unexpectedChanges": ">= 1",
        "testFailures": ">= 5"
      }
    }
  }
}
```

#### Holiday Schedule
Add dates to skip in `scripts/newman-ci-config.json`:
```json
{
  "holidays": {
    "skipDays": [
      "2024-12-25",
      "2024-12-31", 
      "2025-01-01"
    ]
  }
}
```

## Integration with Development Workflow

### PR Testing
- Newman comprehensive tests run on all PRs
- Results posted as PR comments
- Blocking on critical regressions

### Deployment Pipeline
- Daily regression validates production deployments
- Alerts on unexpected changes post-deployment
- Historical tracking for rollback decisions

### Monitoring Integration
- GitHub Issues for incident tracking
- Artifact retention for debugging
- Performance trends for capacity planning

## Best Practices

### Expected Changes Management
1. **Pre-deployment:** Update expected changes configuration
2. **Feature flags:** Use to gradually roll out changes  
3. **Documentation:** Always document why changes are expected
4. **Review:** Regularly review and clean up old expected changes

### Issue Response
1. **Critical issues:** Investigate within 4 hours
2. **Warning issues:** Review within 24 hours
3. **False positives:** Update configuration immediately
4. **Pattern recognition:** Look for trends across multiple days

### Performance Monitoring
1. **Baseline updates:** Review monthly
2. **Threshold tuning:** Adjust based on actual system behavior
3. **Trend analysis:** Use for capacity planning
4. **Correlation:** Link performance to deployment events

---

*This documentation is automatically updated when the daily regression testing configuration changes.*