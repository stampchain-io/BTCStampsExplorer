# Monitoring and Observability

## Current Monitoring Capabilities

### Available Tools

1. **Connection Pool Monitor** (`scripts/monitor-connection-pool.sh`)
   - Manual script for real-time connection pool monitoring
   - Polls `/api/internal/reset-connection-pool` endpoint
   - Shows: Active connections, pool size, utilization, health status
   - Usage: `./scripts/monitor-connection-pool.sh`

2. **ECS CloudWatch Logs**
   - Container logs available in CloudWatch
   - Log group: `/ecs/stamps-app-prod-front-end`
   - Includes application errors and warnings

3. **Emergency Endpoints**
   - GET `/api/internal/reset-connection-pool` - Check pool status
   - POST `/api/internal/reset-connection-pool` - Reset connection pool (requires token)

### Current Gaps

- No automated alerting for critical issues
- No historical metrics or trending
- Limited visibility into API performance
- No proactive monitoring or anomaly detection

## Quick Monitoring Commands

### Check Connection Pool Status
```bash
# One-time check
curl -s https://stampchain.io/api/internal/reset-connection-pool | jq '.'

# Continuous monitoring
./scripts/monitor-connection-pool.sh
```

### View Recent Errors
```bash
# Last 10 minutes of errors
aws logs tail /ecs/stamps-app-prod-front-end --since 10m --filter-pattern "ERROR"

# Connection pool specific issues
aws logs tail /ecs/stamps-app-prod-front-end --since 30m | grep -i "connection pool"
```

### Check Service Health
```bash
# ECS service status
aws ecs describe-services --cluster stamps-app-prod --services stamps-app-service \
  --query 'services[0].deployments'

# API endpoint test
curl -w "\nResponse time: %{time_total}s\n" https://stampchain.io/api/v2/stamps?limit=1
```

## Future Monitoring Enhancement

A comprehensive production monitoring solution has been proposed. See:
- 📄 [Production Monitoring Proposal](./production-monitoring-proposal.md)

### Proposed Features
- ✅ Automated CloudWatch metrics and alarms
- ✅ API performance tracking
- ✅ Synthetic monitoring for critical user journeys
- ✅ APM integration (DataDog/New Relic/X-Ray)
- ✅ Automated incident response
- ✅ SLA tracking and reporting

### Quick Wins (Can implement now)
1. Add CloudWatch alarms for connection pool > 80%
2. Create a simple health check endpoint
3. Set up basic email alerts for critical errors

## Related Documentation

- [Security Configuration](../env-templates/security-configuration.md) - CONNECTION_POOL_RESET_TOKEN setup
- [Database Pool Configuration](../env-templates/database-pool-configuration.md) - Pool sizing guidelines
- [Production Monitoring Proposal](./production-monitoring-proposal.md) - Full monitoring implementation plan