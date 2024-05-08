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

export async function connectToRedis() {
  try {
    redisClient = await connect({
      hostname: "stamp-4-redis-ycbgmb.serverless.use1.cache.amazonaws.com",
      port: 6379,
      tls: true,
    });
  } catch (error) {
    console.error(
      "Failed to connect to Redis, falling back to in-memory cache.",
    );
  }
}

function generateCacheKey(key: string): string {
  return key;
}

function generateHash(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// function generateSQLCacheKey(query: string, params: any[]): string {
//   return query + JSON.stringify(params);
// }

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
    const redisData = await redisClient.get(cacheKey);
    if (redisData) {
      entry = JSON.parse(redisData.toString());
    }
  } else {
    entry = cache[cacheKey];
  }

  if (entry && !isExpired(entry)) {
    return entry.data;
  } else {
    const data = await fetchFunction();
    let expiry = ttl === "never" ? "never" : Date.now() + ttl;

    // Ensure that expiry is either a number or "never"
    if (expiry !== "never" && typeof expiry !== "number") {
      throw new Error("Invalid expiry value");
    }

    const newEntry: CacheEntry = { data, expiry };

    if (redisClient) {
      await redisClient.set(cacheKey, JSON.stringify(newEntry));
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
  if (conf.ENV === "development" || conf.CACHE === "false") {
    return handleQueryWithClient(client, query, params);
  }
  const cacheKey = generateSQLCacheKey(query, params);
  return handleCache(
    cacheKey,
    () => handleQueryWithClient(client, query, params),
    ttl,
  );
}
