/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "$/globals.ts";
import { Manifest } from "$fresh/server.ts";

import "$std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "$/fresh.gen.ts";
import config from "$/fresh.config.ts";
// Import for dbManager initialization
import "$lib/database/db.ts";

// import twindPlugin from "$fresh/plugins/twind.ts";
// import twindConfig from "./twind.config.ts";

async function startApp() {
  await start(manifest as unknown as Manifest, config);
}

startApp().catch((error) => {
  console.error("Failed to start application:", error);
  Deno.exit(1);
});
