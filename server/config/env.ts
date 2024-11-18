// Check for build mode or SKIP_REDIS_CONNECTION before any imports
const isBuild = Deno.args.includes("build");
(globalThis as any).SKIP_REDIS_CONNECTION = isBuild || 
  Deno.env.get("DENO_ENV") === "development";

import { load } from "@std/dotenv";
await load({ export: true });

// Set DENO_ENV to 'development' if not already set
if (!Deno.env.get("DENO_ENV")) {
  Deno.env.set("DENO_ENV", "development");
}