#!/usr/bin/env -S deno run -A --watch=static/,routes/
import "preact/debug";
import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";

import "$std/dotenv/load.ts";

const isBuildMode = Deno.args.includes("build");

if (isBuildMode) {
  globalThis.SKIP_REDIS_CONNECTION = true;
}

await dev(import.meta.url, "./main.ts", config);

if (isBuildMode) {
  Deno.exit(0);
}
