import "$/server/config/env.ts";

import { Client } from "$mysql/mod.ts";
import { connect, Redis } from "redis";
import * as crypto from "crypto";
import {
  ConsoleHandler,
  FileHandler,
  getLogger,
  LogRecord,
  setup,
} from "@std/log";
import {
  deadline,
} from "@std/async";

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
}

class DatabaseManager {
  private pool: Client[] = [];
  private redisClient: Redis | undefined;
  private isConnectingRedis = false;
  private redisRetryCount = 0;
  private redisAvailable = false;
  private readonly MAX_RETRIES: number;
  private readonly RETRY_INTERVAL = 500;
  private readonly MAX_POOL_SIZE = 10;
  private logger: ReturnType<typeof getLogger>;
  private redisAvailableAtStartup = false;
  private inMemoryCache: { [key: string]: { data: any; expiry: number } } = {};

  constructor(private config: DatabaseConfig) {
    this.MAX_RETRIES = this.config.DB_MAX_RETRIES || 5;
    this.setupLogging();
    this.logger = getLogger();
  }

  public async initialize(): Promise<void> {
    await this.initializeRedisConnection();
    this.redisAvailableAtStartup = this.redisAvailable;
  }

  private setupLogging(): void {
    setup({
      handlers: {
        console: new ConsoleHandler("DEBUG"),
        file: new FileHandler("WARN", {
          filename: "./db.log",
          formatter: (logRecord: LogRecord) =>
            `${logRecord.levelName} ${logRecord.msg}`,
        }),
      },
      loggers: {
        default: {
          level: "DEBUG",
          handlers: ["console", "file"],
        },
      },
    });

    this.logger = getLogger();
  }

  getClient(): Promise<Client> {
    if (this.pool.length > 0) {
      return Promise.resolve(this.pool.pop() as Client);
    }

    if (this.pool.length < this.MAX_POOL_SIZE) {
      return this.createConnection();
    }

    return Promise.reject(new Error("No available connections in the pool"));
  }

  releaseClient(client: Client): void {
    this.pool.push(client);
  }

  async closeClient(client: Client): Promise<void> {
    await client.close();
    const index = this.pool.indexOf(client);
    if (index > -1) {
      this.pool.splice(index, 1);
    }
  }

  async closeAllClients(): Promise<void> {
    await Promise.all(this.pool.map((client) => this.closeClient(client)));
  }

  async executeQuery<T>(query: string, params: unknown[]): Promise<T> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const client = await this.getClient();
        const result = await client.execute(query, params);
        this.releaseClient(client);
        return result as T;
      } catch (error) {
        this.logger.error(
          `Error executing query on attempt ${attempt}:`,
          error,
        );
        if (attempt === this.MAX_RETRIES) {
          throw error;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, this.RETRY_INTERVAL));
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
    if (globalThis.SKIP_REDIS_CONNECTION) {
      this.logger.info("Skipping Redis connection for build process");
      return;
    }

    this.logger.info("Initializing Redis connection...");
    try {
      await this.connectToRedis();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        this.logger.error("Redis connection timed out:", error);
      } else {
        this.logger.error("Failed to connect to Redis at startup:", error);
      }
      this.logger.info("Continuing without Redis.");
    }
  }

  private async connectToRedis(): Promise<void> {
    const REDIS_CONNECTION_TIMEOUT = 5000; // 5 seconds timeout

    try {
      this.redisClient = await deadline(
        connect({
          hostname: this.config.ELASTICACHE_ENDPOINT,
          port: 6379,
          tls: true,
        }),
        REDIS_CONNECTION_TIMEOUT,
      );
      this.logger.info("Connected to Redis successfully");
      this.redisAvailable = true;
      this.redisRetryCount = 0;
    } catch (error) {
      if (error instanceof DeadlineError) {
        throw new Error("Redis connection timed out");
      }
      throw error;
    }
  }

  private async connectToRedisInBackground(): Promise<void> {
    if (this.isConnectingRedis) return;

    this.isConnectingRedis = true;
    try {
      await this.connectToRedis();
    } catch (error) {
      this.logger.error("Failed to connect to Redis:", error);
      if (this.redisRetryCount < this.MAX_RETRIES) {
        this.redisRetryCount++;
        setTimeout(
          () => this.connectToRedisInBackground(),
          this.RETRY_INTERVAL,
        );
      } else {
        this.logger.error(
          "Max retries reached, giving up on Redis connection.",
        );
      }
    } finally {
      this.isConnectingRedis = false;
    }
  }

  private generateCacheKey(query: string, params: unknown[]): string {
    const input = `${query}:${JSON.stringify(params)}`;
    return crypto.createHash("sha256").update(input).digest("hex").toString();
  }

  public async handleCache<T>(
    key: string,
    fetchData: () => Promise<T>,
    cacheDuration: number | "never",
  ): Promise<T> {
    if (!this.redisAvailable) {
      if (this.redisAvailableAtStartup) {
        this.connectToRedisInBackground();
      }
      return this.handleInMemoryCache(key, fetchData, cacheDuration);
    }
    const cachedData = await this.getCachedData(key);
    if (cachedData) {
      return cachedData as T;
    }

    const data = await fetchData();
    await this.setCachedData(key, data, cacheDuration);
    return data;
  }

  private async getCachedData(key: string): Promise<unknown | null> {
    if (this.redisClient) {
      try {
        const data = await this.redisClient.get(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        this.logger.error("Failed to read from Redis cache:", error);
        if (this.redisAvailableAtStartup) {
          this.connectToRedisInBackground();
        }
        this.redisAvailable = false;
      }
    }
    return this.getInMemoryCachedData(key);
  }

  private async setCachedData(
    key: string,
    data: unknown,
    expiry: number | "never",
  ): Promise<void> {
    if (this.redisClient) {
      try {
        const value = JSON.stringify(data);
        if (expiry === "never") {
          await this.redisClient.set(key, value);
        } else {
          await this.redisClient.set(key, value, { ex: expiry });
        }
      } catch (error) {
        this.logger.error("Failed to write to Redis cache:", error);
        if (this.redisAvailableAtStartup) {
          this.connectToRedisInBackground();
        }
        this.redisAvailable = false;
      }
    }
    this.setInMemoryCachedData(key, data, expiry);
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
    const item = this.inMemoryCache[key];
    if (item && item.expiry > Date.now()) {
      return item.data;
    }
    delete this.inMemoryCache[key];
    return null;
  }

  private setInMemoryCachedData(
    key: string,
    data: unknown,
    expiry: number | "never",
  ): void {
    const expiryTime = expiry === "never" ? Infinity : Date.now() + expiry;
    this.inMemoryCache[key] = { data, expiry: expiryTime };
  }

  public async invalidateCacheByPattern(pattern: string): Promise<void> {
    if (this.redisClient) {
      try {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
          this.logger.info(`Cache invalidated for pattern: ${pattern}`);
        }
      } catch (error) {
        this.logger.error(
          "Failed to invalidate Redis cache by pattern:",
          error,
        );
        if (this.redisAvailableAtStartup) {
          this.connectToRedisInBackground();
        }
        this.redisAvailable = false;
      }
    }
    this.invalidateInMemoryCacheByPattern(pattern);
  }

  private invalidateInMemoryCacheByPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key in this.inMemoryCache) {
      if (regex.test(key)) {
        delete this.inMemoryCache[key];
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
};

export const dbManager = new DatabaseManager(dbConfig);
await dbManager.initialize();