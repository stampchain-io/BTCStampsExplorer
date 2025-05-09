# Redis ElastiCache Setup

This document outlines the setup for Redis ElastiCache integration with the BTC Stamps Explorer application.

## Configuration

The application uses AWS ElastiCache Redis for caching to improve performance and reduce database load. Configure the following environment variables:

```bash
# Redis/Cache settings
ELASTICACHE_ENDPOINT=your-elasticache-endpoint.region.cache.amazonaws.com
SKIP_REDIS_TLS=true
REDIS_TIMEOUT=15000
REDIS_DEBUG=false  # Set to true for verbose logging
REDIS_MAX_RETRIES=10
CACHE=true
```

## Implementation

Redis integration is implemented in `/server/database/databaseManager.ts` using the official Redis client for Deno. The implementation includes:

1. TCP connectivity tests before Redis connection
2. Fallback to in-memory caching when Redis is unavailable
3. Automatic reconnection with exponential backoff
4. Detailed logging for easier troubleshooting

## Docker Deployment

The Dockerfile is configured to:
1. Skip Redis during build to avoid dependency issues
2. Enable Redis at runtime with proper environment variables

## Troubleshooting

### Redis Connection Issues

If you experience Redis connection problems:

1. Verify security groups allow ECS tasks to connect to ElastiCache (port 6379)
2. Check that `ELASTICACHE_ENDPOINT` is correct
3. Set `REDIS_DEBUG=true` for detailed logging
4. Increase `REDIS_TIMEOUT` if you see connection timeouts
5. Set `SKIP_REDIS_TLS=true` since most ElastiCache instances don't require TLS

## Monitoring

The application logs Redis activity when `REDIS_DEBUG=true`:

- `[REDIS CONFIG]` - Configuration settings at startup
- `[REDIS CONNECTION]` - Connection attempts and status
- `[REDIS RETRY]` - Retry attempts for failed connections
- `[REDIS ERROR]` - Error conditions and failures
- `[REDIS CACHE STATUS]` - Periodic cache status updates