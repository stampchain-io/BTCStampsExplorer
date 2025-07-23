/**
 * Database Configuration Module
 * Provides environment-aware settings for database connection pooling
 *
 * Production uses sensible defaults optimized for co-located database
 * Development can override via environment variables for remote database
 */

export interface DatabaseConfig {
  // Connection Pool Settings
  maxConnections: number;
  minConnections: number;
  maxWaitingForConnection: number;
  connectionTimeout: number;
  acquireTimeout: number;
  validationTimeout: number;

  // Connection Options
  enableCompression: boolean;
  enableConnectionLogging: boolean;

  // Retry Strategy
  maxRetries: number;
  retryDelay: number;

  // Health Check
  healthCheckInterval: number;

  // Environment Info
  environment: 'development' | 'production' | 'test';
  isRemoteDatabase: boolean;
}

/**
 * Get database configuration based on environment
 * Production defaults are optimized for local/co-located database
 * Development can override for remote database scenarios
 */
export function getDatabaseConfig(): DatabaseConfig {
  const env = Deno.env.get('DENO_ENV') || 'production';
  const isProduction = env === 'production';

  // Check if we're connecting to a remote database (dev scenario)
  const dbHost = Deno.env.get('DB_HOST') || 'localhost';
  const isRemoteDatabase = !['localhost', '127.0.0.1'].includes(dbHost) && !isProduction;

  // Production defaults (optimized for co-located database)
  const defaultConfig: DatabaseConfig = {
    // Connection Pool - larger for production concurrency
    maxConnections: 30,
    minConnections: 10,
    maxWaitingForConnection: 100,
    connectionTimeout: 15000,      // 15s for local DB
    acquireTimeout: 5000,          // 5s wait time
    validationTimeout: 1000,       // 1s validation

    // Connection Options
    enableCompression: false,      // Not needed for local DB
    enableConnectionLogging: false,

    // Retry Strategy
    maxRetries: 3,
    retryDelay: 1000,

    // Health Check
    healthCheckInterval: 30000,    // 30s

    // Environment
    environment: 'production',
    isRemoteDatabase: false,
  };

  // Development overrides (can be customized via env vars)
  if (!isProduction || isRemoteDatabase) {
    return {
      // Smaller pool for remote DB to prevent overload
      maxConnections: parseInt(Deno.env.get('DB_MAX_CONNECTIONS') || '5', 10),
      minConnections: parseInt(Deno.env.get('DB_MIN_CONNECTIONS') || '2', 10),
      maxWaitingForConnection: parseInt(Deno.env.get('DB_MAX_WAITING') || '50', 10),

      // Longer timeouts for remote latency
      connectionTimeout: parseInt(Deno.env.get('DB_CONNECTION_TIMEOUT') || '60000', 10),
      acquireTimeout: parseInt(Deno.env.get('DB_ACQUIRE_TIMEOUT') || '10000', 10),
      validationTimeout: parseInt(Deno.env.get('DB_VALIDATION_TIMEOUT') || '5000', 10),

      // Enable compression for remote connections
      enableCompression: Deno.env.get('DB_ENABLE_COMPRESSION') === 'true' || isRemoteDatabase,
      enableConnectionLogging: Deno.env.get('DB_ENABLE_LOGGING') !== 'false',

      // More aggressive retries for network issues
      maxRetries: parseInt(Deno.env.get('DB_MAX_RETRIES') || '5', 10),
      retryDelay: parseInt(Deno.env.get('DB_RETRY_DELAY') || '2000', 10),

      // More frequent health checks
      healthCheckInterval: parseInt(Deno.env.get('DB_HEALTH_CHECK_INTERVAL') || '60000', 10),

      environment: env as 'development' | 'production' | 'test',
      isRemoteDatabase,
    };
  }

  // Production - use defaults (no env var overrides to prevent accidents)
  return defaultConfig;
}

/**
 * Log current database configuration
 */
export function logDatabaseConfig(config: DatabaseConfig): void {
  console.log('=== Database Configuration ===');
  console.log(`Environment: ${config.environment}`);
  console.log(`Remote Database: ${config.isRemoteDatabase}`);
  console.log(`Max Connections: ${config.maxConnections}`);
  console.log(`Min Connections: ${config.minConnections}`);
  console.log(`Connection Timeout: ${config.connectionTimeout}ms`);
  console.log(`Acquire Timeout: ${config.acquireTimeout}ms`);
  console.log(`Compression: ${config.enableCompression ? 'Enabled' : 'Disabled'}`);
  console.log(`Connection Logging: ${config.enableConnectionLogging ? 'Enabled' : 'Disabled'}`);
  console.log('=============================');
}

/**
 * Validate database configuration
 */
export function validateDatabaseConfig(config: DatabaseConfig): string[] {
  const errors: string[] = [];

  if (config.maxConnections < 1) {
    errors.push('maxConnections must be at least 1');
  }

  if (config.minConnections > config.maxConnections) {
    errors.push('minConnections cannot exceed maxConnections');
  }

  if (config.connectionTimeout < 1000) {
    errors.push('connectionTimeout must be at least 1000ms');
  }

  if (config.acquireTimeout < 100) {
    errors.push('acquireTimeout must be at least 100ms');
  }

  return errors;
}
