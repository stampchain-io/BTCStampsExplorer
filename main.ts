/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "$/globals.d.ts";
import { start } from "$fresh/server.ts";
import build from "$fresh/dev.ts";
import manifest from "$/fresh.gen.ts";
import config from "$/fresh.config.ts";

import "$server/database/databaseManager.ts";

if (import.meta.main) {
  if (Deno.args.includes("build")) {
    console.log("Running build...");
    globalThis.SKIP_REDIS_CONNECTION = true;
    await build(import.meta.url, "./main.ts", config);
    console.log("Build completed.");
    Deno.exit(0);
  } else {
    console.log("Starting server...");
    await start(manifest, config);
  }
}
