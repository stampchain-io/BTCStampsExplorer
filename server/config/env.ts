// Check for build mode or SKIP_REDIS_CONNECTION before any imports
const isBuild = Deno.args.includes("build");
const skipRedisForDev = Deno.env.get("DENO_ENV") === "development";

// Force Redis in production unless explicitly disabled
(globalThis as any).SKIP_REDIS_CONNECTION = isBuild || 
  (skipRedisForDev && Deno.env.get("FORCE_REDIS_CONNECTION") !== "true");

import { load } from "@std/dotenv";
await load({ export: true });

// Set DENO_ENV to 'development' if not already set
if (!Deno.env.get("DENO_ENV")) {
  Deno.env.set("DENO_ENV", "development");
}

// Log Redis connection settings for debugging - using console.error to ensure visibility in CloudWatch logs
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