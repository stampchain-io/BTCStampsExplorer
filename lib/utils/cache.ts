import { Client } from "$mysql/mod.ts";
import { handleQueryWithClient } from "$lib/database/index.ts";
import { CreatePayload, handleQuery } from "utils/xcp.ts";
import { conf } from "./config.ts";
import { connect, Redis } from "https://deno.land/x/redis/mod.ts";
import * as crypto from "crypto";
import { XCPParams } from "globals";

interface CacheEntry {
  data: any;
  expiry: number | "never";
}

const cache: { [query: string]: CacheEntry } = {};
const ongoingFetches = new Map<string, Promise<any>>();

let redisClient: Redis | undefined;
let isConnecting = false;
let retryCount = 0;
const MAX_RETRIES = 10;

export function clearCache() {
  ongoingFetches.clear();
  if (redisClient) {
    redisClient.flushall();
  }
}

export function clearCacheKey(key: string) {
  delete cache[key];
  ongoingFetches.delete(key);
  if (redisClient) {
    redisClient.del(key);
  }
}

export async function connectToRedisInBackground() {
  if (!conf.ELASTICACHE_ENDPOINT) {
    console.log(
      "ELASTICACHE_ENDPOINT is not defined, skipping connection attempt...",
    );
    return;
  }

  if (isConnecting) {
    console.log("Connection attempt already in progress, skipping...");
    return;
  }

  console.log("Attempting to connect to Redis...");
  isConnecting = true;

  try {
    const client = await connect({
      hostname: conf.ELASTICACHE_ENDPOINT,
      port: 6379,
      tls: true,
    });
    redisClient = client;
    console.log("Connected to Redis successfully");
    retryCount = 0;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.error(
        "Failed to connect to Redis, falling back to in-memory cache. Error: ",
        error,
      );
      retryCount++;
      setTimeout(() => {
        console.log("Retrying connection to Redis...");
        connectToRedisInBackground();
      }, 10000);
    } else {
      console.error("Max retries reached, giving up on Redis connection.");
      redisClient = undefined;
      clearCache();
    }
  } finally {
    isConnecting = false;
  }
}

function generateCacheKey(key: string): string {
  return generateHash(key);
}

function generateHash(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function generateSQLCacheKey(query: string, params: any[]): string {
  const key = query + JSON.stringify(params);
  return generateHash(key);
}

function isExpired(entry: CacheEntry): boolean {
  if (entry.expiry === "never") {
    return false;
  }
  return Date.now() > entry.expiry;
}

function replacer(_key, value) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}

export async function handleCache(
  key: string,
  fetchFunction: () => Promise<any>,
  ttl: number | "never",
) {
  const cacheKey = generateCacheKey(key);
  let entry;

  if (!redisClient && !isConnecting) {
    connectToRedisInBackground();
  }

  if (redisClient) {
    try {
      const redisData = await redisClient.get(cacheKey);
      if (redisData) {
        entry = JSON.parse(redisData.toString());
      }
    } catch (error) {
      console.error("Redis command failed, attempting to reconnect...", error);
      if (!isConnecting) {
        connectToRedisInBackground();
      }
      entry = cache[cacheKey];
    }
  } else {
    entry = cache[cacheKey];
  }

  if (entry && !isExpired(entry)) {
    return entry.data;
  } else {
    delete cache[cacheKey];
    if (redisClient) {
      redisClient.del(cacheKey);
    }
    if (ongoingFetches.has(cacheKey)) {
      return await ongoingFetches.get(cacheKey);
    }

    const fetchPromise = fetchFunction().then(async (data) => {
      ongoingFetches.delete(cacheKey);
      const expiry = ttl === "never" ? "never" : Date.now() + ttl;

      if (expiry !== "never" && typeof expiry !== "number") {
        throw new Error("Invalid expiry value");
      }

      const newEntry: CacheEntry = { data, expiry };

      if (redisClient) {
        try {
          await redisClient.set(cacheKey, JSON.stringify(newEntry, replacer));
        } catch (error) {
          console.error("Failed to write to Redis cache. Error: ", error);
          if (!isConnecting) {
            connectToRedisInBackground();
          }
          cache[cacheKey] = newEntry;
        }
      } else {
        cache[cacheKey] = newEntry;
      }

      return data;
    }).catch((error) => {
      console.error(
        `Failed to fetch data for key "${cacheKey}". Error: `,
        error,
      );
      ongoingFetches.delete(cacheKey);
      clearCache();
      throw error;
    });

    ongoingFetches.set(cacheKey, fetchPromise);

    return await fetchPromise;
  }
}

export function handleSqlQueryWithCache(
  client: Client,
  query: string,
  params: any[],
  ttl: number | "never",
) {
  if (conf.ENV === "development" || conf.CACHE?.toLowerCase() === "false") {
    return handleQueryWithClient(client, query, params);
  }
  const cacheKey = generateSQLCacheKey(query, params);
  return handleCache(
    cacheKey,
    async () => {
      try {
        return await handleQueryWithClient(client, query, params);
      } catch (error) {
        console.error("Error executing SQL query:", error);
        clearCache();
        throw error;
      }
    },
    ttl,
  );
}

export function handleApiRequestWithCache(
  method: string,
  params: XCPParams,
  ttl: number | "never",
) {
  if (conf.ENV === "development" || conf.CACHE?.toLowerCase() === "false") {
    return handleQuery(CreatePayload(method, params));
  }
  const cacheKey = generateApiCacheKey(method, params);
  return handleCache(
    cacheKey,
    async () => {
      try {
        return await handleQuery(CreatePayload(method, params));
      } catch (error) {
        console.error("Error making API request:", error);
        clearCache();
        throw error;
      }
    },
    ttl,
  );
}

function generateApiCacheKey(method: string, params: any) {
  const paramsString = JSON.stringify(params);
  return `${method}:${paramsString}`;
}
