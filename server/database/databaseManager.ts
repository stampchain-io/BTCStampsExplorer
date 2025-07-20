import "$/server/config/env.ts";

import { bigIntReviver, bigIntSerializer } from "$/lib/utils/formatUtils.ts";
import { crypto } from "@std/crypto";
import {
  ConsoleHandler,
  FileHandler,
  getLogger,
  LogRecord,
  setup,
} from "@std/log";
import { Client } from "mysql/mod.ts";
// Conditionally import Redis based on build mode
let connect: any;
if (Deno.args.includes("build")) {
  console.log("[REDIS IMPORT] Skipping Redis import in build mode");
  // Create dummy implementations for build
  connect = () => Promise.resolve({
    ping: () => Promise.resolve("PONG (memory)"),
    set: () => Promise.resolve("OK"),
    get: () => Promise.resolve(null),
    keys: () => Promise.resolve([]),
    del: () => Promise.resolve(0)
  });
} else {
  // Use the Deno Redis client in non-build mode
  try {
    const redis = await import("redis");
    connect = redis.connect;
    // Note: The deno redis module doesn't export a Redis class, just the connect function
    console.log("[REDIS IMPORT] Successfully imported Redis client");
  } catch (e: unknown) {
    const error = e as Error;
    console.log("[REDIS IMPORT ERROR] " + error.message);
    // Fallback to dummy implementations
    connect = () => Promise.resolve({
      ping: () => Promise.resolve("PONG (memory)"),
      set: () => Promise.resolve("OK"),
      get: () => Promise.resolve(null),
      keys: () => Promise.resolve([]),
      del: () => Promise.resolve(0)
    });
    }
}

export interface DatabaseConfig {
  DB_HOST: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_MAX_RETRIES: number;
  ELASTICACHE_ENDPOINT: string;
  DENO_ENV: string;
  CACHE?: string;
  REDIS_LOG_LEVEL?: string;
}

function shouldInitializeRedis(): boolean {
  // Never initialize Redis during build
  if (Deno.args.includes("build")) {
    console.log("[REDIS] Build mode detected, skipping Redis initialization");
    return false;
  }

  // Otherwise check global flag
  const skip = !!(globalThis as any).SKIP_REDIS_CONNECTION;
  console.log(`[REDIS] shouldInitializeRedis check: SKIP_REDIS_CONNECTION=${skip}`);
  return !skip;
}

class DatabaseManager {
  #pool: Client[] = [];
  #activeConnections = 0; // Track active connections
  #redisClient: any | undefined; // Redis client type
  #isConnectingRedis = false;
  #redisRetryCount = 0;
  #redisAvailable = false;
  readonly #MAX_RETRIES: number;
  readonly #RETRY_INTERVAL = 500;
  readonly #MAX_POOL_SIZE = 10;
  #logger: ReturnType<typeof getLogger>;
  #redisAvailableAtStartup = false;
  #inMemoryCache: { [key: string]: { data: any; expiry: number } } = {};
  #lastCacheStatusLog: number = 0;
  #keepAliveInterval: number | undefined;
  readonly #KEEP_ALIVE_INTERVAL = 30000; // 30 seconds
  #cacheKeyRegistry: { [category: string]: Set<string> } = {}; // Add cache key registry

  constructor(private config: DatabaseConfig) {
    this.#MAX_RETRIES = this.config.DB_MAX_RETRIES || 5;
    this.#setupLogging();
    this.#logger = getLogger();
  }

  public async initialize(): Promise<void> {
    // Start MySQL keep-alive mechanism
    this.startKeepAlive();

    if (shouldInitializeRedis()) {
      await this.initializeRedisConnection();
      this.#redisAvailableAtStartup = this.#redisAvailable;
    } else {
      this.#logger.info("Skipping Redis initialization due to SKIP_REDIS_CONNECTION flag");
    }
  }

  #setupLogging(): void {
    const level = this.config.REDIS_LOG_LEVEL || "INFO";
    const isTest = this.config.DENO_ENV === "test";

    // Only include file handler if not in test mode
    const handlers: any = {
      console: new ConsoleHandler(level as any),
    };

    const handlerNames = ["console"];

    if (!isTest) {
      handlers.file = new FileHandler("WARN", {
        filename: "./db.log",
        formatter: (logRecord: LogRecord) =>
          `${logRecord.levelName} ${logRecord.msg}`,
      });
      handlerNames.push("file");
    }

    setup({
      handlers: handlers,
      loggers: {
        default: {
          level: level as any,
          handlers: handlerNames,
        },
      },
    });

    this.#logger = getLogger();
  }

  getClient(): Promise<Client> {
    if (this.#pool.length > 0) {
      const client = this.#pool.pop() as Client;
      this.#activeConnections++; // Track connection taken from pool
      return Promise.resolve(client);
    }

    if (this.#pool.length < this.#MAX_POOL_SIZE) {
      this.#activeConnections++; // Track new connection being created
      return this.createConnection();
    }

    return Promise.reject(new Error("No available connections in the pool"));
  }

  releaseClient(client: Client): void {
    this.#pool.push(client);
    this.#activeConnections--; // Track connection returned to pool
  }

  async closeClient(client: Client): Promise<void> {
    await client.close();
    const index = this.#pool.indexOf(client);
    if (index > -1) {
      this.#pool.splice(index, 1);
      this.#activeConnections--; // Track connection being closed
    }
  }

  /**
   * Get current connection pool statistics for monitoring
   */
  getConnectionStats(): {
    activeConnections: number;
    poolSize: number;
    maxPoolSize: number;
    totalConnections: number;
  } {
    return {
      activeConnections: this.#activeConnections,
      poolSize: this.#pool.length,
      maxPoolSize: this.#MAX_POOL_SIZE,
      totalConnections: this.#activeConnections + this.#pool.length,
    };
  }

  async closeAllClients(): Promise<void> {
    // Stop keep-alive interval
    if (this.#keepAliveInterval) {
      clearInterval(this.#keepAliveInterval);
      this.#keepAliveInterval = undefined;
    }

    // Close Redis connection
    if (this.#redisClient) {
      try {
        // Check if Redis client has a close/quit method
        if (typeof this.#redisClient.quit === 'function') {
          await this.#redisClient.quit();
        } else if (typeof this.#redisClient.close === 'function') {
          await this.#redisClient.close();
        }
        console.log('[REDIS CLEANUP] Redis connection closed');
      } catch (error) {
        console.log(`[REDIS CLEANUP ERROR] ${error instanceof Error ? error.message : error}`);
      } finally {
        this.#redisClient = undefined;
        this.#redisAvailable = false;
      }
    }

    await Promise.all(this.#pool.map((client) => this.closeClient(client)));
  }

  async executeQuery<T>(query: string, params: unknown[]): Promise<T> {
    for (let attempt = 1; attempt <= this.#MAX_RETRIES; attempt++) {
      let client: Client | null = null;
      try {
        client = await this.getClient();

        // Test connection before executing query
        try {
          await client.execute("SELECT 1", []);
        } catch (_pingError) {
          this.#logger.warn("Connection ping failed, removing from pool");
          if (client) {
            await this.closeClient(client);
            client = null;
          }
          // Get a new connection
          client = await this.getClient();
        }

        const result = await client.execute(query, params);
        this.releaseClient(client);
        return result as T;
      } catch (error) {
        // Check if it's a connection timeout error
        if (error instanceof Error &&
            (error.message.includes("disconnected by the server") ||
             error.message.includes("wait_timeout") ||
             error.message.includes("interactive_timeout") ||
             error.message.includes("connection") ||
             error.message.includes("PROTOCOL_CONNECTION_LOST") ||
             error.message.includes("ECONNRESET") ||
             error.message.includes("ETIMEDOUT"))) {
          this.#logger.warn(
            `Connection error detected on attempt ${attempt}: ${error.message}`,
          );
          // Remove the bad connection from the pool
          if (client) {
            await this.closeClient(client);
            client = null;
          }
        } else {
          // For non-connection errors, return to pool
          if (client) {
            this.releaseClient(client);
          }
        }

        // Only log as error on final attempt
        if (attempt === this.#MAX_RETRIES) {
          this.#logger.error(
            `Error executing query on attempt ${attempt}:`,
            error,
          );
        } else {
          this.#logger.warn(
            `Query failed on attempt ${attempt}, retrying...`,
            error instanceof Error ? error.message : String(error),
          );
        }

        if (attempt === this.#MAX_RETRIES) {
          throw error;
        }
      }
      // Exponential backoff for retries
      const backoffTime = this.#RETRY_INTERVAL * Math.pow(1.5, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
    }
    throw new Error("Max retries reached");
  }

  async executeQueryWithCache<T = any>(
    query: string,
    params: unknown[],
    cacheDuration: number | "never",
  ): Promise<T> {
    if (
      this.config.DENO_ENV === "development" ||
      this.config.CACHE?.toLowerCase() === "false"
    ) {
      return await this.executeQuery<T>(query, params);
    }

    const cacheKey = this.generateCacheKey(query, params);
    return this.handleCache<T>(
      cacheKey,
      () => this.executeQuery<T>(query, params),
      cacheDuration,
    );
  }

  private async createConnection(): Promise<Client> {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME } = this.config;
    const charset = 'utf8mb4';

    // Use longer timeouts in development mode for external database
    const isDevelopment = this.config.DENO_ENV === "development";
    const queryTimeout = isDevelopment ? 180000 : 60000; // 3 minutes in dev, 1 minute in prod

    const client = new Client();

    // Add connection timeout to prevent hanging
    const connectWithTimeout = () => {
      const connectionPromise = client.connect({
        hostname: DB_HOST,
        port: DB_PORT,
        username: DB_USER,
        db: DB_NAME,
        password: DB_PASSWORD,
        charset: charset,
        // Additional connection options to prevent timeouts
        idleTimeout: 0, // Disable idle timeout
        timeout: queryTimeout,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Database connection timeout after 10 seconds to ${DB_HOST}:${DB_PORT}`)), 10000);
      });

      return Promise.race([connectionPromise, timeoutPromise]);
    };

    await connectWithTimeout();

    // Set session timezone to UTC to ensure consistent timestamp handling
    try {
      await client.execute("SET time_zone = '+00:00'", []);
      this.#logger.debug("Set MySQL session timezone to UTC");
    } catch (error) {
      this.#logger.warn("Failed to set session timezone", error);
    }

    return client;
  }

  private startKeepAlive(): void {
    // Clear any existing interval
    if (this.#keepAliveInterval) {
      clearInterval(this.#keepAliveInterval);
    }

    // Set up keep-alive interval to ping connections
    this.#keepAliveInterval = setInterval(async () => {
      try {
        // Get a snapshot of current pool size
        const poolSize = this.#pool.length;

        if (poolSize > 0) {
          this.#logger.debug(`Running keep-alive on ${poolSize} connections`);

          // Test each connection in the pool
          const connectionsToRemove: Client[] = [];

          for (const client of this.#pool) {
            try {
              // Execute a simple query to keep connection alive
              await client.execute("SELECT 1", []);
            } catch (error) {
              this.#logger.warn("Keep-alive failed for connection, marking for removal", error);
              connectionsToRemove.push(client);
            }
          }

          // Remove bad connections
          for (const badClient of connectionsToRemove) {
            await this.closeClient(badClient);
          }

          // Log pool health
          const remainingConnections = this.#pool.length;
          if (connectionsToRemove.length > 0) {
            this.#logger.info(
              `Keep-alive removed ${connectionsToRemove.length} bad connections, ${remainingConnections} remaining`
            );
          }
        }
      } catch (error) {
        this.#logger.error("Error in keep-alive routine:", error);
      }
    }, this.#KEEP_ALIVE_INTERVAL);

    this.#logger.info("MySQL keep-alive mechanism started");
  }

  private async initializeRedisConnection(): Promise<void> {
    console.log(`[REDIS INIT] SKIP_REDIS_CONNECTION=${(globalThis as any).SKIP_REDIS_CONNECTION}, ELASTICACHE_ENDPOINT=${this.config.ELASTICACHE_ENDPOINT}`);
    console.log(`[REDIS INIT] CACHE=${this.config.CACHE}, DENO_ENV=${this.config.DENO_ENV}`);

    if ((globalThis as any).SKIP_REDIS_CONNECTION) {
      const skipMsg = "Skipping Redis connection for build process";
      this.#logger.info(skipMsg);
      console.log(`[REDIS INIT] ${skipMsg}`);
      return;
    }

    const initMsg = `Initializing Redis connection to ${this.config.ELASTICACHE_ENDPOINT}...`;
    this.#logger.info(initMsg);
    console.log(`[REDIS INIT] ${initMsg}`);

    try {
      await this.connectToRedis();
      const successMsg = "Redis connection successful - cache system ready";
      this.#logger.info(successMsg);
      console.log(`[REDIS INIT SUCCESS] ${successMsg}`);
      console.log(`[REDIS INIT] redisAvailable=${this.#redisAvailable}, redisClient initialized=${!!this.#redisClient}`);
    } catch (error) {
      let errorMsg = "";
      if (error instanceof Error) {
        errorMsg = error.name === "AbortError"
          ? "Redis connection timed out"
          : `Failed to connect to Redis at startup: ${error.name} - ${error.message}`;
      } else {
        errorMsg = "Failed to connect to Redis at startup: Unknown error";
      }

      this.#logger.error(errorMsg);
      console.log(`[REDIS INIT ERROR] ${errorMsg}`);

      if (error instanceof Error && error.stack) {
        console.log(`[REDIS INIT ERROR] Stack trace: ${error.stack}`);
      }

      const fallbackMsg = "Continuing with in-memory cache. Redis not available.";
      this.#logger.info(fallbackMsg);
      console.log(`[REDIS INIT] ${fallbackMsg}`);
    }
  }

  private async connectToRedis(): Promise<void> {
    // Safely obtain and parse environment variables with defaults
    const REDIS_CONNECTION_TIMEOUT = parseInt(Deno.env.get("REDIS_TIMEOUT") || "15000");
    // Note: REDIS_DEBUG not used in this function - only used in cache operations
    const SKIP_REDIS_TLS = Deno.env.get("SKIP_REDIS_TLS") === "true"; // Only skip if explicitly set to true
    // Note: REDIS_MAX_RETRIES not used in this function - class uses this.#MAX_RETRIES from DB_MAX_RETRIES

    // Early console log to ensure we can see Redis connection attempts in logs
    console.log(`[REDIS CONFIG] ELASTICACHE_ENDPOINT=${this.config.ELASTICACHE_ENDPOINT}, SKIP_REDIS_TLS=${SKIP_REDIS_TLS}, TIMEOUT=${REDIS_CONNECTION_TIMEOUT}ms`);
    console.log(`[REDIS CONFIG] USING OFFICIAL JSR REDIS CLIENT (@db/redis)`);
    console.log(`[REDIS CONFIG] DENO_ENV=${this.config.DENO_ENV}, CACHE=${this.config.CACHE}`);

    try {
      // Log at the highest visibility level for production debugging
      console.log(`[REDIS CONNECTION] Attempting Redis connection to ${this.config.ELASTICACHE_ENDPOINT}:6379`);
      console.log(`[REDIS CONNECTION] TLS=${!SKIP_REDIS_TLS}, TIMEOUT=${REDIS_CONNECTION_TIMEOUT}ms`);

      if (!this.config.ELASTICACHE_ENDPOINT) {
        const errMsg = "ELASTICACHE_ENDPOINT is empty or not set";
        console.log(`[REDIS ERROR] ${errMsg}`);
        throw new Error(errMsg);
      }

      // Try TCP connection first to verify connectivity
      try {
        console.log(`[REDIS CONNECTION] Testing TCP connectivity...`);
        const tcpStart = Date.now();
        const conn = await Deno.connect({
          hostname: this.config.ELASTICACHE_ENDPOINT,
          port: 6379,
        });
        console.log(`[REDIS CONNECTION] TCP connection successful (${Date.now() - tcpStart}ms)`);
        conn.close();
      } catch (tcpError) {
        console.error(`[REDIS CONNECTION] TCP CONNECTION FAILED: ${tcpError instanceof Error ? tcpError.message : String(tcpError)}`);
        throw new Error(`TCP connection failed: ${tcpError instanceof Error ? tcpError.message : String(tcpError)}`);
      }

      // JSR Redis client connection options
      const connectionOptions = {
        hostname: this.config.ELASTICACHE_ENDPOINT,
        port: 6379,
        tls: !SKIP_REDIS_TLS,
        connectTimeout: REDIS_CONNECTION_TIMEOUT,
        retryStrategy: (times: number) => {
          // Exponential backoff with max 3 seconds
          const delay = Math.min(Math.pow(2, times) * 50, 3000);
          console.log(`[REDIS RETRY] Retry attempt #${times}, delay: ${delay}ms`);
          return delay;
        },
        reconnectOnError: (err: Error) => {
          // Only reconnect on specific network-related errors
          const shouldReconnect =
            err.message.includes('ECONNRESET') ||
            err.message.includes('connection') ||
            err.message.includes('network') ||
            err.message.includes('timeout');
          console.log(`[REDIS RECONNECT] Error: ${err.message}, Should reconnect: ${shouldReconnect}`);
          return shouldReconnect;
        }
      };

      console.log(`[REDIS CONNECTION] Options: ${JSON.stringify(connectionOptions)}`);

      const connectionStart = Date.now();
      // Connect with the JSR Redis client
      this.#redisClient = await connect(connectionOptions);
      console.log(`[REDIS CONNECTION] Connection established (${Date.now() - connectionStart}ms)`);

      // Test connection by setting a test key
      console.log(`[REDIS CONNECTION] Testing with PING command...`);
      const pingStart = Date.now();
      const pingResult = await this.#redisClient.ping();
      console.log(`[REDIS CONNECTION] PING returned "${pingResult}" (${Date.now() - pingStart}ms)`);

      console.log(`[REDIS CONNECTION] Setting test key...`);
      const setStart = Date.now();
      await this.#redisClient.set("redis_connection_test", "success", { ex: 10 });
      console.log(`[REDIS CONNECTION] SET operation successful (${Date.now() - setStart}ms)`);

      console.log(`[REDIS CONNECTION] Getting test key...`);
      const getStart = Date.now();
      const value = await this.#redisClient.get("redis_connection_test");
      console.log(`[REDIS CONNECTION] GET returned "${value}" (${Date.now() - getStart}ms)`);

      if (value !== "success") {
        throw new Error(`Test key verification failed: expected "success" but got "${value}"`);
      }

      console.log(`[REDIS CONNECTION SUCCESS] ✅ Connected to Redis successfully with verified read/write`);
      this.#logger.info("✅ Connected to Redis successfully with verified read/write");
      this.#redisAvailable = true;
      this.#redisRetryCount = 0;
    } catch (error) {
      let errorMessage = "Unknown Redis connection error";
      if (error instanceof Error) {
        errorMessage = `Redis connection error: ${error.name} - ${error.message}`;
        console.log(`[REDIS CONNECTION ERROR] ${errorMessage}`);
        this.#logger.error(errorMessage);

        if (error.stack) {
          console.log(`[REDIS CONNECTION ERROR] Stack trace: ${error.stack}`);
        }
      } else {
        console.log(`[REDIS CONNECTION ERROR] Non-Error object:`, error);
      }

      throw new Error(errorMessage);
    }
  }

  async #connectToRedisInBackground(): Promise<void> {
    if (this.#isConnectingRedis) {
      console.log(`[REDIS RECONNECT] Already attempting to reconnect, skipping duplicate request`);
      return;
    }

    this.#isConnectingRedis = true;
    console.log(`[REDIS RECONNECT] Starting background reconnection attempt #${this.#redisRetryCount + 1}/${this.#MAX_RETRIES}`);

    try {
      // Cleanup old failed connection first
      if (this.#redisClient) {
        try {
          if (typeof this.#redisClient.quit === 'function') {
            await this.#redisClient.quit();
          } else if (typeof this.#redisClient.close === 'function') {
            await this.#redisClient.close();
          }
        } catch {
          // Ignore errors from already-failed connections
        }
        this.#redisClient = undefined;
      }

      console.log(`[REDIS RECONNECT] Attempting to reconnect to Redis at ${this.config.ELASTICACHE_ENDPOINT}:6379`);
      await this.connectToRedis();
      console.log(`[REDIS RECONNECT SUCCESS] ✅ Successfully reconnected to Redis`);
      // Reset retry counter on success
      this.#redisRetryCount = 0;
    } catch (error) {
      const errorMsg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      this.#logger.error(`Failed to reconnect to Redis: ${errorMsg}`);
      console.log(`[REDIS RECONNECT ERROR] Failed attempt #${this.#redisRetryCount + 1}: ${errorMsg}`);

      if (this.#redisRetryCount < this.#MAX_RETRIES) {
        this.#redisRetryCount++;
        const backoffTime = this.#RETRY_INTERVAL * Math.pow(1.5, this.#redisRetryCount - 1); // Exponential backoff
        console.log(`[REDIS RECONNECT] Will retry in ${backoffTime}ms (attempt ${this.#redisRetryCount + 1}/${this.#MAX_RETRIES})`);

        setTimeout(
          () => this.#connectToRedisInBackground(),
          backoffTime,
        );
      } else {
        const giveUpMsg = `Max retries (${this.#MAX_RETRIES}) reached, giving up on Redis connection until next trigger.`;
        this.#logger.error(giveUpMsg);
        console.log(`[REDIS RECONNECT FAILED] ${giveUpMsg}`);
        console.log(`[REDIS RECONNECT FAILED] Will continue with in-memory cache only`);
      }
    } finally {
      this.#isConnectingRedis = false;
    }
  }

  private generateCacheKey(query: string, params: unknown[]): string {
    const input = `${query}:${JSON.stringify(params)}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = crypto.subtle.digestSync("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const cacheKey = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Register cache key by category based on query content
    this.registerCacheKey(cacheKey, query);

    return cacheKey;
  }

  private registerCacheKey(cacheKey: string, query: string): void {
    const queryUpper = query.toUpperCase();

    // Determine category based on query content
    let category: string | null = null;

    // Enhanced balance query detection - check for balance-related table names and patterns
    if (queryUpper.includes('SRC20_BALANCE') ||
        queryUpper.includes('BALANCES') ||
        queryUpper.includes('FROM BALANCES') ||
        queryUpper.includes('JOIN BALANCES') ||
        queryUpper.includes('BALANCE_TABLE') ||
        queryUpper.includes('amt') && queryUpper.includes('tick') && queryUpper.includes('address')) {
      if (queryUpper.includes('SRC20')) {
        category = 'src20_balance';
      } else {
        category = 'balance';
      }
    } else if (queryUpper.includes('SRC101_OWNERS') || queryUpper.includes('src101')) {
      category = 'src101_balance';
    } else if (queryUpper.includes('STAMP_') && queryUpper.includes('BALANCE')) {
      category = 'stamp_balance';
    } else if (queryUpper.includes('STAMP_MARKET_DATA') || queryUpper.includes('SRC20_MARKET_DATA')) {
      category = 'market_data';
    } else if (queryUpper.includes('STAMP_') || queryUpper.includes('stamps')) {
      category = 'stamp';
    } else if (queryUpper.includes('BLOCK_') || queryUpper.includes('block')) {
      category = 'block';
    } else if (queryUpper.includes('TRANSACTION') || queryUpper.includes('tx_')) {
      category = 'transaction';
    }

    if (category) {
      if (!this.#cacheKeyRegistry[category]) {
        this.#cacheKeyRegistry[category] = new Set();
      }
      this.#cacheKeyRegistry[category].add(cacheKey);
      console.log(`[CACHE REGISTRY] Registered key ${cacheKey.substring(0, 12)}... in category: ${category}`);
    } else {
      console.log(`[CACHE REGISTRY] No category found for query: ${query.substring(0, 50)}...`);
    }
  }

  public async handleCache<T = any>(
    key: string,
    fetchData: () => Promise<T>,
    cacheDuration: number | "never",
  ): Promise<T> {
    // Log cache status periodically (once per 5 minutes in dev, 1 minute in prod) to track Redis availability
    const now = Date.now();
    const logInterval = this.config.DENO_ENV === "production" ? 60000 : 300000; // 5 minutes in dev, 1 minute in prod
    if (!this.#lastCacheStatusLog || now - this.#lastCacheStatusLog > logInterval) {
      this.#lastCacheStatusLog = now;
      const status = `Cache status: Redis ${this.#redisAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}, fallback=${!this.#redisAvailable}, endpoint=${this.config.ELASTICACHE_ENDPOINT}`;
      this.#logger.info(status);
      console.log(`[REDIS CACHE STATUS] ${status}`);

      // Add detailed Redis client status information
      console.log(`[REDIS CACHE STATUS] Redis client initialized: ${!!this.#redisClient}`);

      // Log cache statistics
      const inMemoryKeys = Object.keys(this.#inMemoryCache).length;
      console.log(`[REDIS CACHE STATUS] In-memory cache entries: ${inMemoryKeys}`);

      // Test connectivity with simple ping if redis is supposed to be available
      if (this.#redisClient && this.#redisAvailable) {
        this.#redisClient.ping()
          .then((result: string) => console.log(`[REDIS CACHE STATUS] PING test: ${result}`))
          .catch((err: unknown) => console.log(`[REDIS CACHE STATUS] PING test failed: ${err instanceof Error ? err.message : err}`));
      }
    }

    const REDIS_DEBUG = Deno.env.get("REDIS_DEBUG") === "true";

    if (!this.#redisAvailable) {
      if (this.#redisAvailableAtStartup) {
        const reconnectMsg = "Redis was available at startup but is now unavailable. Attempting reconnection...";
        this.#logger.info(reconnectMsg);
        console.log(`[REDIS RECONNECT] ${reconnectMsg}`);
        this.#connectToRedisInBackground();
      }

      const fallbackMsg = `Using in-memory cache fallback for key: ${key.substring(0, 10)}... (type: ${typeof fetchData}, cacheDuration: ${cacheDuration})`;
      this.#logger.debug(fallbackMsg);
      // Only log fallback messages in production or when explicitly debugging
      if (REDIS_DEBUG && this.config.DENO_ENV === "production") {
        console.log(`[REDIS FALLBACK] ${fallbackMsg}`);
      }

      return this.handleInMemoryCache(key, fetchData, cacheDuration);
    }

    if (REDIS_DEBUG) {
      console.log(`[REDIS CACHE] Attempting to get data for key: ${key}`);
    }

    try {
      const cachedData = await this.getCachedData(key);
      if (cachedData) {
        if (REDIS_DEBUG) {
          console.log(`[REDIS CACHE HIT] Found data for key: ${key}`);
        }
        return cachedData as T;
      }

      if (REDIS_DEBUG) {
        console.log(`[REDIS CACHE MISS] No data found for key: ${key}, fetching fresh data`);
      }

      const data = await fetchData();

      if (REDIS_DEBUG) {
        console.log(`[REDIS CACHE SET] Setting data for key: ${key}, expiry: ${cacheDuration}`);
      }

      await this.setCachedData(key, data, cacheDuration);
      return data;
    } catch (error) {
      console.log(`[REDIS CACHE ERROR] Error in handleCache for key ${key}: ${error}`);
      // Fall back to in-memory cache on error
      return this.handleInMemoryCache(key, fetchData, cacheDuration);
    }
  }

  private async getCachedData(key: string): Promise<unknown | null> {
    const REDIS_DEBUG = Deno.env.get("REDIS_DEBUG") === "true";

    if (this.#redisClient) {
      try {
        const startTime = Date.now();
        const data = await this.#redisClient.get(key);
        const duration = Date.now() - startTime;

        if (REDIS_DEBUG && this.config.DENO_ENV === "production") {
          console.log(`[REDIS GET] Key: ${key.substring(0, 10)}... - ${data ? 'HIT' : 'MISS'} (${duration}ms)`);
        }

        if (duration > 500) {
          // Log slow Redis operations
          console.log(`[REDIS SLOW] Slow Redis GET operation detected: ${duration}ms for key ${key.substring(0, 10)}...`);
        }

        if (data) {
          try {
            const parsedData = JSON.parse(data, bigIntReviver);
            return parsedData;
          } catch (parseError) {
            console.log(`[REDIS PARSE ERROR] Failed to parse data for key ${key.substring(0, 10)}...: ${parseError instanceof Error ? parseError.message : parseError}`);
            return null;
          }
        }
        return null;
      } catch (error) {
        const errorMsg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        this.#logger.error(`Failed to read from Redis cache: ${errorMsg}`);
        console.log(`[REDIS ERROR] Failed to get key ${key.substring(0, 10)}...: ${errorMsg}`);

        // Check if connection was lost
        if (error instanceof Error &&
            (error.message.includes("connection") ||
             error.message.includes("network") ||
             error.message.includes("ECONNRESET") ||
             error.message.includes("closed"))) {
          console.log(`[REDIS CONNECTION ISSUE] Possible connection loss detected: ${error.message}`);
          this.#redisAvailable = false;

          if (this.#redisAvailableAtStartup) {
            console.log(`[REDIS RECONNECT] Scheduling reconnection attempt in background...`);
            this.#connectToRedisInBackground();
          }
        }
      }
    } else if (REDIS_DEBUG) {
      console.log(`[REDIS CLIENT MISSING] Redis client unavailable for key: ${key.substring(0, 10)}...`);
    }

    return this.getInMemoryCachedData(key);
  }

  private async setCachedData(
    key: string,
    data: unknown,
    expiry: number | "never",
  ): Promise<void> {
    const REDIS_DEBUG = Deno.env.get("REDIS_DEBUG") === "true";

    // Always set in-memory cache as fallback regardless of Redis status
    this.setInMemoryCachedData(key, data, expiry);

    if (this.#redisClient) {
      try {
        // If expiry is 0 (or less), it implies "no cache" or "real-time data".
        // Setting with { ex: 0 } is problematic for Redis.
        // We will skip the Redis set operation for such cases.
        if (typeof expiry === 'number' && expiry <= 0) {
          if (REDIS_DEBUG) {
            console.log(`[REDIS SET SKIPPED] Key: ${key.substring(0, 10)}... due to non-positive expiry: ${expiry}`);
          }
          return; // Do not set in Redis if expiry is 0 or less and is a number
        }

        // Serialize the data
        let value: string;
        try {
          value = JSON.stringify(data, bigIntSerializer);

          // Log data size for performance monitoring
          const byteSize = new TextEncoder().encode(value).length;
          if (byteSize > 100 * 1024) { // 100KB or larger
            console.log(`[REDIS LARGE DATA] Large value detected for key ${key.substring(0, 10)}...: ${byteSize / 1024} KB`);
          }

          if (REDIS_DEBUG) {
            // Changed log message to be more explicit about what's being attempted
            console.log(`[REDIS SET ATTEMPT] Key: ${key.substring(0, 10)}..., Value Size: ${byteSize} bytes, Expiry Opts: ${expiry === "never" ? "none" : `{ ex: ${expiry} }`}`);
          }
        } catch (serializeError) {
          console.log(`[REDIS SERIALIZE ERROR] Failed to serialize data for key ${key.substring(0, 10)}...: ${serializeError instanceof Error ? serializeError.message : serializeError}`);
          return; // Skip Redis set but keep in-memory cache
        }

        // Measure Redis operation time
        const startTime = Date.now();

        if (expiry === "never") {
          await this.#redisClient.set(key, value);
        } else {
          // At this point, expiry is a positive number
          await this.#redisClient.set(key, value, { ex: expiry });
        }

        const duration = Date.now() - startTime;
        if (duration > 500) {
          // Log slow operations
          console.log(`[REDIS SLOW] Slow Redis SET operation detected: ${duration}ms for key ${key.substring(0, 10)}...`);
        } else if (REDIS_DEBUG) {
          console.log(`[REDIS SET SUCCESS] Key: ${key.substring(0, 10)}... completed in ${duration}ms`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        this.#logger.error(`Failed to write to Redis cache: ${errorMsg}`);
        console.log(`[REDIS ERROR ON SET] Failed for key ${key.substring(0, 10)}...: ${errorMsg}`);

        // Detailed error inspection
        if (error instanceof Error && error.stack) {
          console.log(`[REDIS ERROR STACK] ${error.stack}`);
        }

        // Check if connection was lost
        if (error instanceof Error &&
            (error.message.includes("connection") ||
             error.message.includes("network") ||
             error.message.includes("ECONNRESET") ||
             error.message.includes("closed"))) {
          console.log(`[REDIS CONNECTION ISSUE DURING SET] Possible connection loss detected: ${error.message}`);
          this.#redisAvailable = false;

          if (this.#redisAvailableAtStartup) {
            console.log(`[REDIS RECONNECT DURING SET] Scheduling reconnection attempt in background...`);
            this.#connectToRedisInBackground();
          }
        }
      }
    } else if (REDIS_DEBUG) {
      console.log(`[REDIS CLIENT MISSING FOR SET] Redis client unavailable for setting key: ${key.substring(0, 10)}...`);
    }
  }

  private async handleInMemoryCache<T>(
    key: string,
    fetchData: () => Promise<T>,
    cacheDuration: number | "never",
  ): Promise<T> {
    const cachedData = this.getInMemoryCachedData(key);
    if (cachedData) {
      return cachedData as T;
    }

    const data = await fetchData();
    this.setInMemoryCachedData(key, data, cacheDuration);
    return data;
  }

  private getInMemoryCachedData(key: string): unknown | null {
    const item = this.#inMemoryCache[key];
    if (item && item.expiry > Date.now()) {
      return item.data;
    }
    delete this.#inMemoryCache[key];
    return null;
  }

  private setInMemoryCachedData(
    key: string,
    data: unknown,
    expiry: number | "never",
  ): void {
    const expiryTime = expiry === "never" ? Infinity : Date.now() + expiry;
    this.#inMemoryCache[key] = { data, expiry: expiryTime };
  }

  public async invalidateCacheByPattern(pattern: string): Promise<void> {
    // Handle registry-based invalidation for known patterns
    const categoryMap: { [key: string]: string[] } = {
      'balance_*': ['balance', 'src20_balance', 'src101_balance', 'stamp_balance'],
      'src20_balance_*': ['src20_balance'],
      'src101_balance_*': ['src101_balance'],
      'stamp_balance_*': ['stamp_balance'],
      'market_data_*': ['market_data'],
      'stamp_*': ['stamp'],
      'block_*': ['block'],
      'transaction_*': ['transaction'],
      'btc_price*': [] // Keep original pattern matching for this
    };

    const categories = categoryMap[pattern];
    if (categories) {
      // Invalidate by categories
      for (const category of categories) {
        await this.invalidateCacheByCategory(category);
      }
    }

    // Also try original pattern matching for backwards compatibility
    if (this.#redisClient) {
      try {
        const keys = await this.#redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.#redisClient.del(...keys);
          console.log(`Cache invalidated ${keys.length} keys for pattern: ${pattern}`);
        }
      } catch (error) {
        console.error("Failed to invalidate Redis cache by pattern:", error);
        if (this.#redisAvailableAtStartup) {
          this.#connectToRedisInBackground();
        }
        this.#redisAvailable = false;
      }
    }
    this.invalidateInMemoryCacheByPattern(pattern);
  }

  private async invalidateCacheByCategory(category: string): Promise<void> {
    const cacheKeys = this.#cacheKeyRegistry[category];
    if (!cacheKeys || cacheKeys.size === 0) {
      return;
    }

    console.log(`Invalidating ${cacheKeys.size} cache keys for category: ${category}`);

    // Redis invalidation
    if (this.#redisClient) {
      try {
        const keysArray = Array.from(cacheKeys);
        if (keysArray.length > 0) {
          await this.#redisClient.del(...keysArray);
        }
      } catch (error) {
        console.error(`Failed to invalidate Redis cache for category ${category}:`, error);
      }
    }

    // In-memory cache invalidation
    for (const key of cacheKeys) {
      delete this.#inMemoryCache[key];
    }

    // Clear the registry for this category
    this.#cacheKeyRegistry[category].clear();
  }

  /**
   * Get cache registry statistics (for debugging/monitoring)
   */
  public async getCacheRegistryStats(): Promise<{ [category: string]: number }> {
    const stats: { [category: string]: number } = {};
    for (const [category, keys] of Object.entries(this.#cacheKeyRegistry)) {
      stats[category] = keys.size;
    }
    return stats;
  }

  /**
   * Force clear all balance-related caches (for debugging/testing)
   */
  public async forceInvalidateAllBalanceCaches(): Promise<void> {
    console.log("[CACHE DEBUG] Force invalidating all balance caches...");

    // Clear all explicit balance-related categories
    const explicitBalanceCategories = ['balance', 'src20_balance', 'src101_balance', 'stamp_balance'];

    for (const category of explicitBalanceCategories) {
      await this.invalidateCacheByCategory(category);
    }

    // Clear categories that balance queries might be miscategorized into
    const additionalCategories = ['stamp', 'market_data', 'block'];

    for (const category of additionalCategories) {
      await this.invalidateCacheByCategory(category);
    }

    // Also clear by patterns for any missed keys (backward compatibility)
    await this.invalidateCacheByPattern('balance_*');
    await this.invalidateCacheByPattern('src20_balance_*');
    await this.invalidateCacheByPattern('src101_balance_*');
    await this.invalidateCacheByPattern('stamp_balance_*');

    console.log("[CACHE DEBUG] All balance caches cleared (comprehensive method)");
  }

  /**
   * Debug method to check what's cached
   */
  public debugCacheStatus(): void {
    console.log("[CACHE DEBUG] Registry stats:", this.getCacheRegistryStats());
    console.log("[CACHE DEBUG] In-memory cache keys:", Object.keys(this.#inMemoryCache).length);
    console.log("[CACHE DEBUG] Redis available:", this.#redisAvailable);
  }

  private invalidateInMemoryCacheByPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key in this.#inMemoryCache) {
      if (regex.test(key)) {
        delete this.#inMemoryCache[key];
      }
    }
  }
}

const dbConfig: DatabaseConfig = {
  DB_HOST: Deno.env.get("DB_HOST") || "",
  DB_USER: Deno.env.get("DB_USER") || "",
  DB_PASSWORD: Deno.env.get("DB_PASSWORD") || "",
  DB_PORT: Number(Deno.env.get("DB_PORT")) || 3306,
  DB_NAME: Deno.env.get("DB_NAME") || "",
  DB_MAX_RETRIES: Number(Deno.env.get("DB_MAX_RETRIES")) || 5,
  ELASTICACHE_ENDPOINT: Deno.env.get("ELASTICACHE_ENDPOINT") || "",
  DENO_ENV: Deno.env.get("DENO_ENV") || "development",
  CACHE: Deno.env.get("CACHE") || "true",
  REDIS_LOG_LEVEL: Deno.env.get("REDIS_LOG_LEVEL") || "DEBUG",
};

// Log the ElastiCache configuration at startup for troubleshooting
console.log("=== CACHE CONFIGURATION ===");
console.log(`ELASTICACHE_ENDPOINT: ${dbConfig.ELASTICACHE_ENDPOINT || 'Not set'}`);
console.log(`DENO_ENV: ${dbConfig.DENO_ENV}`);
console.log(`CACHE enabled: ${dbConfig.CACHE}`);
console.log(`REDIS_LOG_LEVEL: ${dbConfig.REDIS_LOG_LEVEL}`);
console.log(`SKIP_REDIS_CONNECTION: ${(globalThis as any).SKIP_REDIS_CONNECTION ? 'true' : 'false'}`);
console.log("===========================");

// Only create singleton if not in test mode to prevent resource leaks during testing
export const dbManager = Deno.env.get("DENO_ENV") === "test"
  ? (globalThis as any).__mockDbManager || undefined as any as DatabaseManager  // Use mock if available in test mode
  : new DatabaseManager(dbConfig);

// Export the class for testing and other uses
export { DatabaseManager };
