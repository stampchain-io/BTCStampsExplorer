# Database Connection Environment Variables

## Performance Optimization Variables

Add these environment variables to optimize database connection performance, especially when dealing with complex queries and remote database connections.

### Connection Pool Settings

```bash
# Maximum number of database connections in the pool
# Default: 20 (may need to increase for high-traffic or complex queries)
# Recommended: 50-100 for production with complex SRC-20 queries
DB_CONNECTION_LIMIT=50

# Connection acquire timeout in milliseconds
# Default: 60000 (60 seconds)
# Recommended: 30000-45000 for faster failure detection
DB_ACQUIRE_TIMEOUT=45000

# Connection idle timeout in milliseconds
# Default: 300000 (5 minutes)
# Recommended: 600000 (10 minutes) for stable connections
DB_IDLE_TIMEOUT=600000

# Connection lifetime timeout in milliseconds
# Default: 1800000 (30 minutes)
# Recommended: 3600000 (1 hour) for remote databases
DB_LIFETIME_TIMEOUT=3600000
```

### Query Performance Settings

```bash
# Query timeout in milliseconds (shorter than acquire timeout)
# Default: Not set
# Recommended: 30000 (30 seconds) to prevent long-running queries
DB_QUERY_TIMEOUT=30000

# Enable query retry on connection failures
# Default: true
# Recommended: true for remote database connections
DB_ENABLE_RETRY=true

# Maximum query retry attempts
# Default: 5
# Recommended: 3 for faster failure detection
DB_MAX_RETRIES=3
```

### Development Settings

```bash
# Skip database connection entirely (use mocks)
# Default: false
# Use: true for testing without database access
SKIP_DATABASE_CONNECTION=false

# Enable database query logging
# Default: false
# Use: true for debugging slow queries
DB_ENABLE_QUERY_LOGGING=true

# Log slow queries above this threshold (milliseconds)
# Default: 1000
# Recommended: 5000 for complex SRC-20 queries
DB_SLOW_QUERY_THRESHOLD=5000
```

## Production Environment Template

Add to `env-templates/production.json`:

```json
[
  {"name": "DB_CONNECTION_LIMIT", "value": "50"},
  {"name": "DB_ACQUIRE_TIMEOUT", "value": "45000"},
  {"name": "DB_QUERY_TIMEOUT", "value": "30000"},
  {"name": "DB_ENABLE_RETRY", "value": "true"},
  {"name": "DB_MAX_RETRIES", "value": "3"}
]
```

## Development Environment

Add to `.env` file for local development:

```bash
DB_CONNECTION_LIMIT=20
DB_ACQUIRE_TIMEOUT=30000
DB_QUERY_TIMEOUT=15000
DB_ENABLE_QUERY_LOGGING=true
DB_SLOW_QUERY_THRESHOLD=2000
```

## Implementation Notes

These variables should be read in `server/database/databaseManager.ts` and used to configure the connection pool settings. The current hardcoded values should be replaced with environment variable reads with fallbacks to current defaults.

## Related Files

- `server/database/databaseManager.ts` - Connection pool configuration
- `server/config/env.ts` - Environment variable definitions
- `env-templates/production.json` - Production environment template
