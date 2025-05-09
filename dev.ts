#!/usr/bin/env -S deno run -A --watch=routes/
// Set SKIP_REDIS_CONNECTION before ANY imports
(globalThis as any).SKIP_REDIS_CONNECTION = true;

// Set development environment
Deno.env.set("DENO_ENV", "development");

import "preact/debug";
import dev from "$fresh/dev.ts";
import build from "$fresh/dev.ts";
import config from "$/fresh.config.ts";

if (Deno.args.includes("build")) {
  await build(import.meta.url, "./main.ts", config);
  Deno.exit(0);
} else {
  await dev(import.meta.url, "./main.ts", config);
}
