/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

if (!Deno.env.get("ENV")) {
  Deno.env.set("ENV", "production");
}

import { loadSync } from "@std/dotenv";

const currentDir = Deno.cwd();
const envFilePath = Deno.env.get("ENV") === "development"
  ? `${currentDir}/.env.development.local`
  : `${currentDir}/.env`;

// Debugging
console.log("Loading environment variables from:", envFilePath);

loadSync({
  envPath: envFilePath,
  export: true,
});

import "$/globals.d.ts";
import { start } from "$fresh/server.ts";
import manifest from "$/fresh.gen.ts";
import { Manifest } from "$fresh/server.ts";
import config from "$/fresh.config.ts";

import "$server/database/db.ts";

await start(manifest as unknown as Manifest, config);
