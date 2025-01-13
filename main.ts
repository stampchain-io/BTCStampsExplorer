/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference types="npm:@types/node" />

import "$/globals.d.ts";
import { start } from "$fresh/server.ts";
import build from "$fresh/dev.ts";
import manifest from "$/fresh.gen.ts";
import config from "$/fresh.config.ts";
import "$server/database/index.ts";

if (import.meta.main) {
  if (Deno.args.includes("build")) {
    await build(import.meta.url, "./main.ts", config);
    Deno.exit(0);
  } else {
    if (Deno.env.get("DENO_ENV") !== "development") {
      (globalThis as any).SKIP_REDIS_CONNECTION = false;
      await import("$server/database/databaseManager.ts");
    }
    await start(manifest, config);
  }
}
