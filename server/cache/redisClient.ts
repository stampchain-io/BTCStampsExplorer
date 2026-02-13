/**
 * Redis Client Wrapper for Rate Limiting
 *
 * Provides a simple interface to Redis for rate limiting middleware.
 * Uses the same Redis connection pattern as DatabaseManager.
 *
 * Created: November 21, 2025
 */

// BROWSER GUARD: Only access Deno when available (server-side)
let connect: any;
if (typeof Deno !== "undefined" && Deno.args?.includes("build")) {
  // Build mode: create dummy implementations
  connect = () => Promise.resolve({
    ping: () => Promise.resolve("PONG"),
    set: () => Promise.resolve("OK"),
    setex: () => Promise.resolve("OK"),
    get: () => Promise.resolve(null),
    incr: () => Promise.resolve(1),
    pexpire: () => Promise.resolve(1),
    pttl: () => Promise.resolve(60000),
    del: () => Promise.resolve(1),
    keys: () => Promise.resolve([])
  });
} else if (typeof Deno !== "undefined") {
  // Runtime mode: use actual Redis client
  try {
    const redis = await import("redis");
    connect = redis.connect;
  } catch (e: unknown) {
    const error = e as Error;
    console.log("[REDIS CLIENT] Import error: " + error.message);
    // Fallback to dummy implementations
    connect = () => Promise.resolve({
      ping: () => Promise.resolve("PONG"),
      set: () => Promise.resolve("OK"),
      setex: () => Promise.resolve("OK"),
      get: () => Promise.resolve(null),
      incr: () => Promise.resolve(1),
      pexpire: () => Promise.resolve(1),
      pttl: () => Promise.resolve(60000),
      del: () => Promise.resolve(1),
      keys: () => Promise.resolve([])
    });
  }
} else {
  // Browser fallback: dummy implementations
  connect = () => Promise.resolve({
    ping: () => Promise.resolve("PONG"),
    set: () => Promise.resolve("OK"),
    setex: () => Promise.resolve("OK"),
    get: () => Promise.resolve(null),
    incr: () => Promise.resolve(1),
    pexpire: () => Promise.resolve(1),
    pttl: () => Promise.resolve(60000),
    del: () => Promise.resolve(1),
    keys: () => Promise.resolve([])
  });
}

let redisConnection: any | null = null;

/**
 * Get or create Redis connection for rate limiting
 * Singleton pattern to reuse connection across middleware calls
 */
export async function getRedisConnection(): Promise<any> {
  if (redisConnection) {
    return redisConnection;
  }

  // Check if we should skip Redis (test mode, etc.)
  if ((globalThis as any).SKIP_REDIS_CONNECTION) {
    console.log("[REDIS CLIENT] SKIP_REDIS_CONNECTION is true, using in-memory fallback");
    // Return in-memory fallback
    return {
      ping: () => Promise.resolve("PONG (memory)"),
      set: () => Promise.resolve("OK"),
      setex: () => Promise.resolve("OK"),
      get: () => Promise.resolve(null),
      incr: () => Promise.resolve(1),
      pexpire: () => Promise.resolve(1),
      pttl: () => Promise.resolve(60000),
      del: () => Promise.resolve(1),
      keys: () => Promise.resolve([])
    };
  }

  // Get Redis endpoint from environment
  const redisEndpoint = Deno.env.get("ELASTICACHE_ENDPOINT") || "localhost";
  const redisPort = 6379;
  const skipTLS = Deno.env.get("SKIP_REDIS_TLS") === "true";

  try {
    console.log(`[REDIS CLIENT] Connecting to ${redisEndpoint}:${redisPort} (TLS: ${!skipTLS})`);

    const connectionOptions: any = {
      hostname: redisEndpoint,
      port: redisPort,
    };

    // Only add TLS config if not skipping TLS
    if (!skipTLS) {
      connectionOptions.tls = true;
    }

    redisConnection = await connect(connectionOptions);

    // Test connection
    const pingResult = await redisConnection.ping();
    console.log(`[REDIS CLIENT] Connection successful: ${pingResult}`);

    return redisConnection;
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`[REDIS CLIENT] Connection failed: ${err.message}`);

    // Return in-memory fallback for fail-open behavior
    return {
      ping: () => Promise.resolve("PONG (memory)"),
      set: () => Promise.resolve("OK"),
      setex: () => Promise.resolve("OK"),
      get: () => Promise.resolve(null),
      incr: () => Promise.resolve(1),
      pexpire: () => Promise.resolve(1),
      pttl: () => Promise.resolve(60000),
      del: () => Promise.resolve(1),
      keys: () => Promise.resolve([])
    };
  }
}

/**
 * Close Redis connection (for cleanup)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisConnection) {
    try {
      if (typeof redisConnection.quit === 'function') {
        await redisConnection.quit();
      } else if (typeof redisConnection.close === 'function') {
        await redisConnection.close();
      }
      console.log("[REDIS CLIENT] Connection closed");
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`[REDIS CLIENT] Error closing connection: ${err.message}`);
    } finally {
      redisConnection = null;
    }
  }
}
