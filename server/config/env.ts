// Check for build mode or SKIP_REDIS_CONNECTION before any imports
const isBuild = Deno.args.includes("build");
const envMode = Deno.env.get("DENO_ENV");
const skipRedisForDev = envMode === "development";
const isTest = envMode === "test";

// Skip Redis for build, test, or dev mode (unless forced)
(globalThis as any).SKIP_REDIS_CONNECTION = isBuild || isTest ||
  (skipRedisForDev && Deno.env.get("FORCE_REDIS_CONNECTION") !== "true");

import { load } from "@std/dotenv";
await load({ export: true });

// Set DENO_ENV to 'development' if not already set
if (!Deno.env.get("DENO_ENV")) {
  Deno.env.set("DENO_ENV", "development");
}

// Only log Redis settings in non-test environments
if (!isTest) {
  const redisSettingsMessage = `
*************************************************************************
                    REDIS CONNECTION SETTINGS
*************************************************************************
DENO_ENV:                 ${Deno.env.get("DENO_ENV") || "not set"}
ELASTICACHE_ENDPOINT:     ${Deno.env.get("ELASTICACHE_ENDPOINT") || "not set"}
Build mode:               ${isBuild ? "yes" : "no"}
Skip Redis for dev:       ${skipRedisForDev ? "yes" : "no"}
Force Redis connection:   ${Deno.env.get("FORCE_REDIS_CONNECTION") === "true" ? "yes" : "no"}
SKIP_REDIS_CONNECTION:    ${(globalThis as any).SKIP_REDIS_CONNECTION ? "yes" : "no"}
*************************************************************************
`;

  console.log(redisSettingsMessage);
  // Also output to stderr for better AWS CloudWatch visibility
  console.error(redisSettingsMessage);
}