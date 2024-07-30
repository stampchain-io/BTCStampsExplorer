/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "./globals.ts";

import "$std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";
import { conf } from "utils/config.ts";
// Import for dbManager initialization
import "$lib/database/db.ts";

// import twindPlugin from "$fresh/plugins/twind.ts";
// import twindConfig from "./twind.config.ts";

async function startApp() {
  if (conf.CACHE?.toLowerCase() === "true") {
    console.log(
      "Database manager initialized (includes Redis connection if configured)",
    );
    // The dbManager is already initialized when imported, which starts the Redis connection if configured
  }
  // Start your server
  await start(manifest, config);
}

startApp().catch((error) => {
  console.error("Failed to start application:", error);
  Deno.exit(1);
});
