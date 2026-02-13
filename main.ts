/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference types="npm:@types/node" />

// Fix for EventTarget memory leak warning
// Suppress MaxListenersExceededWarning for AbortSignal to prevent memory leak warnings
// This is safe because we properly clean up listeners in our HTTP client
if (typeof process !== "undefined" && process.emitWarning) {
  const originalEmitWarning = process.emitWarning;
  // @ts-ignore - Complex overloaded function signature, but we handle it safely
  process.emitWarning = function (
    warning: string | Error,
    type?: string,
    code?: string,
    ctor?: Function,
  ) {
    // Suppress MaxListenersExceededWarning for AbortSignal
    if (
      type === "MaxListenersExceededWarning" &&
      typeof warning === "string" &&
      warning.includes("AbortSignal")
    ) {
      return;
    }
    // @ts-ignore - Complex overloaded function signature, but we handle it safely
    return originalEmitWarning.call(this, warning, type, code, ctor);
  };
}

import config from "$/fresh.config.ts";
import manifest from "$/fresh.gen.ts";
import "$/globals.d.ts";
import build from "$fresh/dev.ts";
import { start } from "$fresh/server.ts";
import { serverConfig } from "$server/config/config.ts";
const DENO_ROLE = serverConfig.DENO_ROLE;
// Lazy import DB and background services only when not running in pure web mode
let dbManager:
  | typeof import("$server/database/databaseManager.ts").dbManager
  | undefined;
let BackgroundFeeService:
  | typeof import("$server/services/fee/backgroundFeeService.ts").BackgroundFeeService
  | undefined;
if (DENO_ROLE !== "web") {
  const dbModule = await import("$server/database/databaseManager.ts");
  dbManager = dbModule.dbManager;
  await import("$server/database/index.ts");
  const feeModule = await import(
    "$server/services/fee/backgroundFeeService.ts"
  );
  BackgroundFeeService = feeModule.BackgroundFeeService;
}

if (import.meta.main) {
  if (!Deno.args.includes("build") && DENO_ROLE !== "web") {
    try {
      console.log(`[MAIN] Attempting dbManager.initialize() at ${Date.now()}`);
      await dbManager!.initialize();
      console.log(`[MAIN] dbManager.initialize() completed at ${Date.now()}`);

      // Start background fee cache warming service
      BackgroundFeeService!.start();
      console.log(
        `[MAIN] Background fee service started`,
      );
    } catch (e) {
      if (e instanceof Error) {
        console.error(
          `[MAIN ERROR] Error during dbManager.initialize(): ${e.message}`,
          e.stack,
        );
      } else {
        console.error(
          `[MAIN ERROR] Error during dbManager.initialize(): Unknown error object`,
          e,
        );
      }
    }
  }

  if (Deno.args.includes("build")) {
    console.log(`[MAIN] Entering build block at ${Date.now()}`);
    await build(import.meta.url, "./main.ts", config);
    console.log(`[MAIN] Exiting build block at ${Date.now()}`);
    Deno.exit(0);
  } else {
    console.log(`[MAIN] Entering runtime block at ${Date.now()}`);
    if (!serverConfig.IS_DEVELOPMENT) {}
    await start(manifest, config);
    console.log(`[MAIN] Server started at ${Date.now()}`);
  }
}
