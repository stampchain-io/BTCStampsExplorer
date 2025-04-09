// Check for build mode or SKIP_REDIS_CONNECTION before any imports
const isBuild = Deno.args.includes("build");

// Force skip Redis for build process
if (isBuild) {
  (globalThis as any).SKIP_REDIS_CONNECTION = true;
  console.log(`[STARTUP CONFIG] BUILD MODE DETECTED - Skipping Redis connection`);
} else {
  const denoEnv = Deno.env.get("DENO_ENV");
  const cacheEnabled = Deno.env.get("CACHE")?.toLowerCase() === "true";
  const redisEndpoint = Deno.env.get("ELASTICACHE_ENDPOINT");

  // Skip Redis connection in the following cases:
  // 1. In development mode with cache disabled
  // 2. When ELASTICACHE_ENDPOINT is not set
  // 3. When SKIP_REDIS is explicitly set to true
  const skipRedisEnv = Deno.env.get("SKIP_REDIS")?.toLowerCase() === "true";
  const hasRedisEndpoint = !!redisEndpoint && redisEndpoint.trim() !== "";

  (globalThis as any).SKIP_REDIS_CONNECTION = 
    (denoEnv === "development" && !cacheEnabled) ||
    !hasRedisEndpoint ||
    skipRedisEnv;

  // Log this critical configuration at startup
  console.log(`[STARTUP CONFIG] DENO_ENV=${denoEnv}, CACHE=${Deno.env.get("CACHE")}, ELASTICACHE_ENDPOINT=${hasRedisEndpoint ? redisEndpoint : "NOT_SET"}`);
  console.log(`[STARTUP CONFIG] SKIP_REDIS=${skipRedisEnv}, SKIP_REDIS_CONNECTION=${(globalThis as any).SKIP_REDIS_CONNECTION}`);
}

import { load } from "@std/dotenv";
await load({ export: true });

// Set DENO_ENV to 'development' if not already set
if (!Deno.env.get("DENO_ENV")) {
  Deno.env.set("DENO_ENV", "development");
}