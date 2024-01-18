import { Client } from "$mysql/mod.ts";
import { handleQueryWithClient } from "$lib/database/index.ts";
import { conf } from "./config.ts";

interface CacheEntry {
  data: any;
  expiry: number | "never";
}

const cache: { [query: string]: CacheEntry } = {};

function generateCacheKey(key: string): string {
  return key;
}

function generateSQLCacheKey(query: string, params: any[]): string {
  return query + JSON.stringify(params);
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
  const entry = cache[cacheKey];

  if (entry && !isExpired(entry)) {
    return entry.data;
  } else {
    const data = await fetchFunction();
    const expiry = ttl === "never" ? "never" : Date.now() + ttl;
    cache[cacheKey] = { data, expiry };
    return data;
  }
}

export async function handleSqlQueryWithCache(
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
