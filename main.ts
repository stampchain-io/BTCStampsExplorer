/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "$std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";

// Import connectToRedis from the appropriate module
import { connectToRedis } from "./lib/utils/cache.ts";

async function startApp() {
  // Connect to Redis
  await connectToRedis();

  // Start your server
  await start(manifest, config);
}

startApp().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
