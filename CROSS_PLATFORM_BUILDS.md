# Cross-Platform Build Notes

This document provides guidance on cross-platform build issues and solutions for the BTC Stamps Explorer project.

## Redis Handling During Build

The application is configured to automatically skip Redis connections during build time to prevent build failures related to Redis dependencies. This is handled through environment variables in both the code and Dockerfile:

1. In `server/config/env.ts`, Redis connections are skipped when the build flag is detected
2. In the Dockerfile, Redis is disabled during build but enabled at runtime

## Environment Variable Configuration

For local development:
```bash
# Set in .env file
SKIP_REDIS=true  # Skip Redis for local development
CACHE=false      # Disable caching for development
```

For production:
```bash
SKIP_REDIS=false
SKIP_REDIS_TLS=true  # For AWS ElastiCache which doesn't use TLS
ELASTICACHE_ENDPOINT=your-elasticache-endpoint.region.cache.amazonaws.com
CACHE=true
REDIS_DEBUG=true  # For detailed Redis logs
```

## Docker Build

The Dockerfile includes:
1. Proper caching of dependencies
2. Environment configuration for build vs runtime
3. Security hardening with proper permissions

If you encounter Docker rate limiting issues, consider setting up Docker Hub authentication before building:
```bash
docker login
```
