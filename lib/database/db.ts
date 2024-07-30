import { Client } from "$mysql/mod.ts";
import { conf } from "utils/config.ts";
import { connect, Redis } from "https://deno.land/x/redis/mod.ts";
import * as crypto from "crypto";

const MAX_RETRIES = parseInt(conf.DB_MAX_RETRIES) || 5;
const RETRY_INTERVAL = 500;
const MAX_POOL_SIZE = 10;

class DatabaseManager {
  private pool: Client[] = [];
  private redisClient: Redis | undefined;
  private isConnectingRedis = false;
  private redisRetryCount = 0;

  constructor() {
    this.connectToRedisInBackground();
  }

  getClient(): Promise<Client> {
    if (this.pool.length > 0) {
      return Promise.resolve(this.pool.pop() as Client);
    }

    if (this.pool.length < MAX_POOL_SIZE) {
      return this.createConnection();
    }

    throw new Error("No available connections in the pool");
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
    for (const client of this.pool) {
      await this.closeClient(client);
    }
  }

  async executeQuery<T>(query: string, params: any[]): Promise<T> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const client = await this.getClient();
        const result = await client.execute(query, params);
        this.releaseClient(client);
        return result as T;
      } catch (error) {
        console.error(
          `ERROR: Error executing query on attempt ${attempt}:`,
          error,
        );
        if (attempt === MAX_RETRIES) {
          throw error;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
    }
    throw new Error("Max retries reached");
  }

  async executeQueryWithCache<T>(
    query: string,
    params: any[],
    cacheDuration: number | "never",
  ): Promise<T> {
    if (conf.ENV === "development" || conf.CACHE?.toLowerCase() === "false") {
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
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME } = conf;
    const client = await new Client().connect({
      hostname: DB_HOST,
      port: Number(DB_PORT),
      username: DB_USER,
      db: DB_NAME,
      password: DB_PASSWORD,
    });
    return client;
  }

  private async connectToRedisInBackground(): Promise<void> {
    if (!conf.ELASTICACHE_ENDPOINT || this.isConnectingRedis) {
      return;
    }

    this.isConnectingRedis = true;
    try {
      this.redisClient = await connect({
        hostname: conf.ELASTICACHE_ENDPOINT,
        port: 6379,
        tls: true,
      });
      console.log("Connected to Redis successfully");
      this.redisRetryCount = 0;
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      if (this.redisRetryCount < MAX_RETRIES) {
        this.redisRetryCount++;
        setTimeout(() => this.connectToRedisInBackground(), 10000);
      } else {
        console.error("Max retries reached, giving up on Redis connection.");
        this.redisClient = undefined;
      }
    } finally {
      this.isConnectingRedis = false;
    }
  }

  private generateCacheKey(query: string, params: any[]): string {
    const input = `${query}:${JSON.stringify(params)}`;
    return crypto.createHash("sha256").update(input).digest("hex").toString();
  }
  public async handleCache<T>(
    key: string,
    fetchData: () => Promise<T>,
    cacheDuration: number | "never",
  ): Promise<T> {
    const cachedData = await this.getCachedData(key);
    if (cachedData) {
      return cachedData as T;
    }

    const data = await fetchData();
    await this.setCachedData(key, data, cacheDuration);
    return data;
  }

  private async getCachedData(key: string): Promise<any | null> {
    if (this.redisClient) {
      try {
        const data = await this.redisClient.get(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error("Failed to read from Redis cache:", error);
        this.connectToRedisInBackground();
      }
    }
    return null;
  }

  private async setCachedData(
    key: string,
    data: any,
    expiry: number | "never",
  ): Promise<void> {
    if (this.redisClient) {
      try {
        if (expiry === "never") {
          await this.redisClient.set(key, JSON.stringify(data));
        } else {
          await this.redisClient.set(key, JSON.stringify(data), { ex: expiry });
        }
      } catch (error) {
        console.error("Failed to write to Redis cache:", error);
        this.connectToRedisInBackground();
      }
    }
  }
}

export const dbManager = new DatabaseManager();
