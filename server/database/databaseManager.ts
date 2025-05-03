import "$/server/config/env.ts";

import { Client } from "mysql/mod.ts";
// Conditionally import Redis based on build mode
let connect, Redis;
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
  Redis = class DummyRedis {};
} else {
  // Use the Deno Redis client in non-build mode
  try {
    const redis = await import("redis");
    connect = redis.connect;
    Redis = redis.Redis;
    console.log("[REDIS IMPORT] Successfully imported Redis client");
  } catch (e) {
    console.log("[REDIS IMPORT ERROR] " + e.message);
    // Fallback to dummy implementations
    connect = () => Promise.resolve({
      ping: () => Promise.resolve("PONG (memory)"),
      set: () => Promise.resolve("OK"),
      get: () => Promise.resolve(null),
      keys: () => Promise.resolve([]),
      del: () => Promise.resolve(0)
    });
    Redis = class DummyRedis {};
  }
}
import { crypto } from "@std/crypto";
import {
  ConsoleHandler,
  FileHandler,
  getLogger,
  LogRecord,
  setup,
} from "@std/log";

interface DatabaseConfig {
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

async function shouldInitializeRedis(): Promise<boolean> {
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
  #redisClient: Redis | undefined;
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

  constructor(private config: DatabaseConfig) {
    this.#MAX_RETRIES = this.config.DB_MAX_RETRIES || 5;
    this.#setupLogging();
    this.#logger = getLogger();
  }

  public async initialize(): Promise<void> {
    if (await shouldInitializeRedis()) {
      await this.initializeRedisConnection();
      this.#redisAvailableAtStartup = this.#redisAvailable;
    } else {
      this.#logger.info("Skipping Redis initialization due to SKIP_REDIS_CONNECTION flag");
    }
  }

  private #setupLogging(): void {
    setup({
      handlers: {
        console: new ConsoleHandler(level),
        file: new FileHandler("WARN", {
          filename: "./db.log",
          formatter: (logRecord: LogRecord) =>
            `${logRecord.levelName} ${logRecord.msg}`,
        }),
      },
      loggers: {
        default: {
          level: level,
          handlers: ["console", "file"],
        },
      },
    });

    this.#logger = getLogger();
  }

  getClient(): Promise<Client> {
    if (this.#pool.length > 0) {
      return Promise.resolve(this.#pool.pop() as Client);
    }

    if (this.#pool.length < this.#MAX_POOL_SIZE) {
      return this.createConnection();
    }

    return Promise.reject(new Error("No available connections in the pool"));
  }

  releaseClient(client: Client): void {
    this.#pool.push(client);
  }

  async closeClient(client: Client): Promise<void> {
    await client.close();
    const index = this.#pool.indexOf(client);
    if (index > -1) {
      this.#pool.splice(index, 1);
    }
  }

  async closeAllClients(): Promise<void> {
    await Promise.all(this.#pool.map((client) => this.closeClient(client)));
  }

  async executeQuery<T>(query: string, params: unknown[]): Promise<T> {
    for (let attempt = 1; attempt <= this.#MAX_RETRIES; attempt++) {
      try {
        const client = await this.getClient();
        const result = await client.execute(query, params);
        this.releaseClient(client);
        return result as T;
      } catch (error) {
        this.#logger.error(
          `Error executing query on attempt ${attempt}:`,
          error,
        );
        if (attempt === this.#MAX_RETRIES) {
          throw error;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, this.#RETRY_INTERVAL));
    }
    throw new Error("Max retries reached");
  }

  async executeQueryWithCache<T>(
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

  private createConnection(): Promise<Client> {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME } = this.config;
    const charset= 'utf8mb4'
    return new Client().connect({
      hostname: DB_HOST,
      port: DB_PORT,
      username: DB_USER,
      db: DB_NAME,
      password: DB_PASSWORD,
      charset: charset,
    });
  }

  private async initializeRedisConnection(): Promise<void> {
    console.log(`[REDIS INIT] SKIP_REDIS_CONNECTION=${globalThis.SKIP_REDIS_CONNECTION}, ELASTICACHE_ENDPOINT=${this.config.ELASTICACHE_ENDPOINT}`);
    console.log(`[REDIS INIT] CACHE=${this.config.CACHE}, DENO_ENV=${this.config.DENO_ENV}`);
    
    if (globalThis.SKIP_REDIS_CONNECTION) {
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
    const REDIS_DEBUG = Deno.env.get("REDIS_DEBUG") === "true";
    const SKIP_REDIS_TLS = Deno.env.get("SKIP_REDIS_TLS") === "true"; // Only skip if explicitly set to true
    const REDIS_MAX_RETRIES = parseInt(Deno.env.get("REDIS_MAX_RETRIES") || "10");
    
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
        retryStrategy: (times) => {
          // Exponential backoff with max 3 seconds
          const delay = Math.min(Math.pow(2, times) * 50, 3000);
          console.log(`[REDIS RETRY] Retry attempt #${times}, delay: ${delay}ms`);
          return delay;
        },
        reconnectOnError: (err) => {
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
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  public async handleCache<T>(
    key: string,
    fetchData: () => Promise<T>,
    cacheDuration: number | "never",
  ): Promise<T> {
    // Log cache status periodically (once per minute) to track Redis availability
    const now = Date.now();
    if (!this.#lastCacheStatusLog || now - this.#lastCacheStatusLog > 60000) {
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
          .then(result => console.log(`[REDIS CACHE STATUS] PING test: ${result}`))
          .catch(err => console.log(`[REDIS CACHE STATUS] PING test failed: ${err instanceof Error ? err.message : err}`));
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
      if (REDIS_DEBUG) {
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
        
        if (REDIS_DEBUG) {
          console.log(`[REDIS GET] Key: ${key.substring(0, 10)}... - ${data ? 'HIT' : 'MISS'} (${duration}ms)`);
        }
        
        if (duration > 500) {
          // Log slow Redis operations
          console.log(`[REDIS SLOW] Slow Redis GET operation detected: ${duration}ms for key ${key.substring(0, 10)}...`);
        }
        
        if (data) {
          try {
            const parsedData = JSON.parse(data);
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
        // Serialize the data
        let value: string;
        try {
          value = JSON.stringify(data);
          
          // Log data size for performance monitoring
          const byteSize = new TextEncoder().encode(value).length;
          if (byteSize > 100 * 1024) { // 100KB or larger
            console.log(`[REDIS LARGE DATA] Large value detected for key ${key.substring(0, 10)}...: ${byteSize / 1024} KB`);
          }
          
          if (REDIS_DEBUG) {
            console.log(`[REDIS SET] Key: ${key.substring(0, 10)}..., Size: ${byteSize} bytes, Expiry: ${expiry}`);
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
          await this.#redisClient.set(key, value, { ex: expiry });
        }
        
        const duration = Date.now() - startTime;
        if (duration > 500) {
          // Log slow operations
          console.log(`[REDIS SLOW] Slow Redis SET operation detected: ${duration}ms for key ${key.substring(0, 10)}...`);
        } else if (REDIS_DEBUG) {
          console.log(`[REDIS SET] Completed in ${duration}ms`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        this.#logger.error(`Failed to write to Redis cache: ${errorMsg}`);
        console.log(`[REDIS ERROR] Failed to set key ${key.substring(0, 10)}...: ${errorMsg}`);
        
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
          console.log(`[REDIS CONNECTION ISSUE] Possible connection loss detected: ${error.message}`);
          this.#redisAvailable = false;
          
          if (this.#redisAvailableAtStartup) {
            console.log(`[REDIS RECONNECT] Scheduling reconnection attempt in background...`);
            this.#connectToRedisInBackground();
          }
        }
      }
    } else if (REDIS_DEBUG) {
      console.log(`[REDIS CLIENT MISSING] Redis client unavailable for setting key: ${key.substring(0, 10)}...`);
    }
  }

  private handleInMemoryCache<T>(
    key: string,
    fetchData: () => Promise<T>,
    cacheDuration: number | "never",
  ): Promise<T> {
    const cachedData = this.getInMemoryCachedData(key);
    if (cachedData) {
      return Promise.resolve(cachedData as T);
    }

    return fetchData().then((data) => {
      this.setInMemoryCachedData(key, data, cacheDuration);
      return data;
    });
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
    if (this.#redisClient) {
      try {
        const keys = await this.#redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.#redisClient.del(...keys);
          this.#logger.info(`Cache invalidated for pattern: ${pattern}`);
        }
      } catch (error) {
        this.#logger.error(
          "Failed to invalidate Redis cache by pattern:",
          error,
        );
        if (this.#redisAvailableAtStartup) {
          this.#connectToRedisInBackground();
        }
        this.#redisAvailable = false;
      }
    }
    this.invalidateInMemoryCacheByPattern(pattern);
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

export const dbManager = new DatabaseManager(dbConfig);