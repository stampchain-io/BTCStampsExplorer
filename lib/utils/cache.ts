import { Client } from "$mysql/mod.ts";
import { handleQueryWithClient } from "$lib/database/index.ts";
import { conf } from "./config.ts";
import { connect } from "https://deno.land/x/redis/mod.ts";
import * as crypto from "crypto";

interface CacheEntry {
  data: any;
  expiry: number | "never";
}

const cache: { [query: string]: CacheEntry } = {};

let redisClient;
let isConnecting = false;

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
  } catch (error) {
    console.error(
      "Failed to connect to Redis, falling back to in-memory cache. Error: ",
      error,
    );
    setTimeout(() => {
      console.log("Retrying connection to Redis...");
      connectToRedisInBackground();
    }, 10000); // Retry after 10 seconds
  } finally {
    isConnecting = false;
  }
}

function generateCacheKey(key: string): string {
  return key;
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

export async function handleCache(
  key: string,
  fetchFunction: () => Promise<any>,
  ttl: number | "never",
) {
  const cacheKey = generateCacheKey(key);
  let entry;

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
    const data = await fetchFunction();
    const expiry = ttl === "never" ? "never" : Date.now() + ttl;

    if (expiry !== "never" && typeof expiry !== "number") {
      throw new Error("Invalid expiry value");
    }

    const newEntry: CacheEntry = { data, expiry };

    if (redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(newEntry));
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
    () => handleQueryWithClient(client, query, params),
    ttl,
  );
}
