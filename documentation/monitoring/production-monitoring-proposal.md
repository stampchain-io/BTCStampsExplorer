# Production Monitoring Implementation Proposal

## Overview

This document outlines a comprehensive production monitoring strategy for the BTC Stamps Explorer application, with a focus on database connection pool health, API performance, and system reliability.

## Current State

### What We Have
- **Manual Monitoring Script**: `scripts/monitor-connection-pool.sh` for on-demand connection pool monitoring
- **Emergency Reset Endpoint**: `/api/internal/reset-connection-pool` for critical interventions
- **Basic ECS Logs**: CloudWatch logs from ECS containers

### What We're Missing
- Automated continuous monitoring
- Proactive alerting
- Historical metrics and trends
- Performance baselines
- SLA tracking

## Proposed Monitoring Stack

### 1. Database Connection Pool Monitoring

#### CloudWatch Custom Metrics
```javascript
// In databaseManager.ts
async publishConnectionPoolMetrics() {
  const stats = this.getConnectionStats();
  const cloudwatch = new AWS.CloudWatch();
  
  await cloudwatch.putMetricData({
    Namespace: 'StampChain/Database',
    MetricData: [
      {
        MetricName: 'ConnectionPoolUtilization',
        Value: (stats.activeConnections / stats.maxPoolSize) * 100,
        Unit: 'Percent',
        Timestamp: new Date()
      },
      {
        MetricName: 'ActiveConnections',
        Value: stats.activeConnections,
        Unit: 'Count'
      }
    ]
  }).promise();
}
```

#### CloudWatch Alarms
- **High Utilization**: Alert when pool utilization > 80% for 5 minutes
- **Pool Exhaustion**: Critical alert when utilization = 100%
- **Connection Leaks**: Alert when active connections don't decrease after load drops

### 2. API Performance Monitoring

#### Response Time Metrics
```javascript
// Middleware to track API performance
export async function apiMetricsMiddleware(req: Request, ctx: MiddlewareHandlerContext) {
  const start = Date.now();
  
  try {
    const response = await ctx.next();
    const duration = Date.now() - start;
    
    // Publish to CloudWatch
    await publishApiMetric(req.url, response.status, duration);
    
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    await publishApiMetric(req.url, 500, duration);
    throw error;
  }
}
```

#### Key Metrics to Track
- Response time percentiles (p50, p95, p99)
- Error rates by endpoint
- Request volume
- Cache hit rates

### 3. Infrastructure Monitoring

#### ECS Service Metrics
- Task health and restart frequency
- CPU and memory utilization
- Network throughput

#### RDS Metrics
- Database connections
- Query performance
- Storage usage
- IOPS

### 4. Application Performance Monitoring (APM)

#### Option A: AWS X-Ray
```javascript
// Trace database queries
import * as AWSXRay from 'aws-xray-sdk-core';

const segment = AWSXRay.getSegment();
const subsegment = segment.addNewSubsegment('database-query');

try {
  const result = await this.executeQuery(query, params);
  subsegment.close();
  return result;
} catch (error) {
  subsegment.addError(error);
  subsegment.close();
  throw error;
}
```

#### Option B: DataDog or New Relic
- Full APM capabilities
- Custom dashboards
- Distributed tracing
- Log aggregation

### 5. Synthetic Monitoring

#### Health Check Endpoints
```typescript
// /api/health/deep
{
  "status": "healthy",
  "timestamp": "2024-01-29T14:00:00Z",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 45,
      "connectionPool": {
        "utilization": 0.24,
        "activeConnections": 12,
        "healthy": true
      }
    },
    "redis": {
      "status": "healthy",
      "responseTime": 2
    },
    "api": {
      "status": "healthy",
      "criticalEndpoints": {
        "/api/v2/stamps": "healthy",
        "/api/v2/src20": "healthy"
      }
    }
  }
}
```

#### CloudWatch Synthetics
```javascript
// Canary script to test critical user journeys
const synthetics = require('Synthetics');

const testStampQuery = async () => {
  const response = await synthetics.executeHttpStep(
    'Query Stamps API',
    'https://stampchain.io/api/v2/stamps?limit=10'
  );
  
  // Verify response
  if (!response.data || response.data.length === 0) {
    throw new Error('No stamps returned');
  }
};
```

### 6. Alerting Strategy

#### Alert Routing
```yaml
alerts:
  critical:
    - connection_pool_exhausted
    - api_error_rate_high
    - database_unreachable
    channels: [pagerduty, slack-critical]
    
  warning:
    - connection_pool_high_utilization
    - response_time_degraded
    - cache_hit_rate_low
    channels: [slack-ops, email]
    
  info:
    - deployment_started
    - scaling_event
    channels: [slack-deployments]
```

#### Escalation Policy
1. **Level 1**: Automated remediation (e.g., connection pool reset)
2. **Level 2**: On-call engineer notification
3. **Level 3**: Engineering team escalation

### 7. Dashboards

#### Operations Dashboard
- Real-time connection pool status
- API response times and error rates
- Active user sessions
- Cache performance

#### Business Dashboard
- Transaction volume
- User activity patterns
- Popular stamps/tokens
- Service availability SLA

### 8. Log Aggregation

#### Structured Logging
```javascript
logger.info('api_request', {
  endpoint: '/api/v2/stamps',
  method: 'GET',
  userId: req.user?.id,
  responseTime: duration,
  statusCode: response.status,
  cacheHit: fromCache,
  connectionPoolStats: dbManager.getConnectionStats()
});
```

#### Log Analysis
- Error pattern detection
- Performance regression identification
- Security anomaly detection

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Implement CloudWatch custom metrics for connection pool
- [ ] Create basic health check endpoint
- [ ] Set up critical alerts for pool exhaustion

### Phase 2: API Monitoring (Week 3-4)
- [ ] Add response time tracking middleware
- [ ] Implement error rate monitoring
- [ ] Create API performance dashboard

### Phase 3: Synthetic Monitoring (Week 5-6)
- [ ] Deploy CloudWatch Synthetics canaries
- [ ] Implement deep health checks
- [ ] Set up journey-based monitoring

### Phase 4: APM Integration (Week 7-8)
- [ ] Evaluate and select APM solution
- [ ] Implement distributed tracing
- [ ] Create custom dashboards

### Phase 5: Automation (Week 9-10)
- [ ] Implement auto-remediation for common issues
- [ ] Create runbooks for alerts
- [ ] Set up escalation policies

## Cost Estimates

### AWS CloudWatch
- Custom Metrics: ~$0.30 per metric per month
- Alarms: ~$0.10 per alarm per month
- Logs: ~$0.50 per GB ingested
- Synthetics: ~$0.0012 per canary run

### APM Solutions (monthly)
- DataDog: ~$15-31 per host
- New Relic: ~$25-99 per host
- AWS X-Ray: ~$5 per million traces

### Estimated Monthly Cost
- Small scale (current): ~$50-100/month
- Medium scale: ~$200-400/month
- Large scale: ~$500-1000/month

## Success Metrics

### Technical KPIs
- Mean Time to Detection (MTTD) < 5 minutes
- Mean Time to Resolution (MTTR) < 30 minutes
- False positive rate < 5%
- Alert response rate > 95%

### Business KPIs
- Service availability > 99.9%
- API response time p95 < 500ms
- Zero unplanned downtime from connection pool issues

## Security Considerations

### Metrics Access
- Use IAM roles for CloudWatch access
- Encrypt sensitive metrics
- Audit metric access

### Alert Security
- Secure webhook endpoints
- Rotate alert tokens regularly
- Use encrypted channels for critical alerts

## Maintenance Requirements

### Weekly
- Review alert thresholds
- Check dashboard accuracy
- Validate synthetic tests

### Monthly
- Analyze trends and patterns
- Update runbooks
- Optimize alert rules

### Quarterly
- Review monitoring strategy
- Update cost allocations
- Plan capacity based on trends

## Tools and Resources

### Monitoring Tools
- AWS CloudWatch
- Grafana (for custom dashboards)
- PagerDuty (for incident management)

### Documentation
- [AWS CloudWatch Best Practices](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Best_Practice_Recommended_Alarms_AWS_Services.html)
- [SRE Monitoring Principles](https://sre.google/sre-book/monitoring-distributed-systems/)
- [DataDog Database Monitoring](https://docs.datadoghq.com/database_monitoring/)

## Next Steps

1. **Stakeholder Approval**: Present proposal to team
2. **Budget Allocation**: Confirm monitoring budget
3. **Tool Selection**: Evaluate APM options
4. **Implementation Sprint**: Begin Phase 1

---

*This proposal addresses the current gap in production monitoring and provides a roadmap for implementing comprehensive observability for the BTC Stamps Explorer application.*