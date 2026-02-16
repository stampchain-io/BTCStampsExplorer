# Database Connection Pool Configuration

This document describes the new environment-aware database connection pool configuration options available in stampchain.io.

## Overview

The database connection pool now automatically optimizes its configuration based on the environment:
- **Production**: Optimized for co-located database (larger pool, shorter timeouts)
- **Development**: Optimized for remote database (smaller pool, longer timeouts, compression enabled)

## Configuration Options

Add these to your `.env` file only if you need to override the smart defaults:

```bash
# Database Connection Pool Configuration (Optional - uses smart defaults)
# These settings are automatically optimized based on environment:
# - Production: Optimized for co-located database (larger pool, shorter timeouts)
# - Development: Optimized for remote database (smaller pool, longer timeouts)
#
# Only set these if you need to override the defaults:
DB_MAX_CONNECTIONS=5          # Max connections in pool (prod default: 30, dev default: 5)
DB_MIN_CONNECTIONS=2          # Min connections to maintain (prod default: 10, dev default: 2)
DB_MAX_WAITING=50             # Max waiting requests (prod default: 100, dev default: 50)
DB_CONNECTION_TIMEOUT=60000   # Connection timeout in ms (prod default: 15000, dev default: 60000)
DB_ACQUIRE_TIMEOUT=10000      # Acquire timeout in ms (prod default: 5000, dev default: 10000)
DB_VALIDATION_TIMEOUT=5000    # Validation timeout in ms (prod default: 1000, dev default: 5000)
DB_ENABLE_COMPRESSION=true    # Enable compression for remote connections (auto-enabled for remote DBs)
DB_ENABLE_LOGGING=true        # Enable connection logging (prod default: false, dev default: true)
DB_MAX_RETRIES=5              # Max retry attempts (prod default: 3, dev default: 5)
DB_RETRY_DELAY=2000           # Retry delay in ms (prod default: 1000, dev default: 2000)
DB_HEALTH_CHECK_INTERVAL=60000 # Health check interval in ms (prod default: 30000, dev default: 60000)
```

## Default Values

### Production (DENO_ENV=production)
- `DB_MAX_CONNECTIONS`: 30
- `DB_MIN_CONNECTIONS`: 10
- `DB_MAX_WAITING`: 100
- `DB_CONNECTION_TIMEOUT`: 15000 (15 seconds)
- `DB_ACQUIRE_TIMEOUT`: 5000 (5 seconds)
- `DB_VALIDATION_TIMEOUT`: 1000 (1 second)
- `DB_ENABLE_COMPRESSION`: false
- `DB_ENABLE_LOGGING`: false
- `DB_MAX_RETRIES`: 3
- `DB_RETRY_DELAY`: 1000 (1 second)
- `DB_HEALTH_CHECK_INTERVAL`: 30000 (30 seconds)

### Development (DENO_ENV=development or remote database)
- `DB_MAX_CONNECTIONS`: 5
- `DB_MIN_CONNECTIONS`: 2
- `DB_MAX_WAITING`: 50
- `DB_CONNECTION_TIMEOUT`: 60000 (60 seconds)
- `DB_ACQUIRE_TIMEOUT`: 10000 (10 seconds)
- `DB_VALIDATION_TIMEOUT`: 5000 (5 seconds)
- `DB_ENABLE_COMPRESSION`: true (for remote connections)
- `DB_ENABLE_LOGGING`: true
- `DB_MAX_RETRIES`: 5
- `DB_RETRY_DELAY`: 2000 (2 seconds)
- `DB_HEALTH_CHECK_INTERVAL`: 60000 (60 seconds)

## Features

1. **Connection Pool Pre-warming**: The pool pre-warms with minimum connections on startup
2. **Environment Detection**: Automatically detects if connecting to a remote database
3. **Compression**: Automatically enables compression for remote database connections
4. **Connection Logging**: Logs connection establishment times in development
5. **Validation Timeout**: Prevents hanging on connection validation
6. **Health Checks**: Regular keep-alive pings to maintain connection health

## Deployment Notes

When deploying with `deploy-prod.sh` or `deploy-local-changes.sh`:
- Production deployments will use the production defaults (no need to set these variables)
- Only set these variables in `.env.prod` if you need to override the defaults
- The deployment scripts will automatically pass any set variables to ECS

## Example Development Override

For a development environment with specific needs:

```bash
# Override for development with very slow remote database
DB_MAX_CONNECTIONS=3
DB_CONNECTION_TIMEOUT=120000  # 2 minutes
DB_ACQUIRE_TIMEOUT=30000      # 30 seconds
```

## Monitoring

The database manager logs the active configuration on startup:

```
=== Database Configuration ===
Environment: development
Remote Database: true
Max Connections: 5
Min Connections: 2
Connection Timeout: 60000ms
Acquire Timeout: 10000ms
Compression: Enabled
Connection Logging: Enabled
=============================
```
