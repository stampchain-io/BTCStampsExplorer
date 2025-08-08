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

// Try to establish the resolver as early as possible.
// The error happens before the original main.ts logs, so this might not catch it either,
// but it's an attempt to hook in earlier.
const earlyOriginalResolve = import.meta.resolve;
import.meta.resolve = function (specifier: string): string {
  const isBuildMode = Deno.args.includes("build"); // Cannot rely on globalThis yet if it's too early
  console.log(
    `[EARLY RESOLVER ENTRY] Specifier: "${specifier}", BuildMode: ${isBuildMode}, Timestamp: ${Date.now()}`,
  );

  if (
    specifier === "tiny-secp256k1" ||
    specifier === "secp256k1" ||
    specifier.endsWith("secp256k1.node") ||
    specifier.includes("secp256k1.node") // More aggressive check
  ) {
    console.log(
      `[EARLY RESOLVER ACTION] Crypto redirect for "${specifier}" to JS/WASM.`,
    );
    return earlyOriginalResolve("npm:tiny-secp256k1/lib/esm/index.js");
  }
  // No other rules, just default, to minimize interference if this runs super early.
  console.log(`[EARLY RESOLVER ACTION] Default resolve for "${specifier}"`);
  return earlyOriginalResolve(specifier);
};

import config from "$/fresh.config.ts";
import manifest from "$/fresh.gen.ts";
import "$/globals.d.ts";
import build from "$fresh/dev.ts";
import { start } from "$fresh/server.ts";
const DENO_ROLE = Deno.env.get("DENO_ROLE");
// Lazy import DB and background services only when not running in pure web mode
let dbManager: typeof import("$server/database/databaseManager.ts").dbManager | undefined;
let BackgroundFeeService: typeof import("$server/services/fee/backgroundFeeService.ts").BackgroundFeeService | undefined;
if (DENO_ROLE !== "web") {
  const dbModule = await import("$server/database/databaseManager.ts");
  dbManager = dbModule.dbManager;
  await import("$server/database/index.ts");
  const feeModule = await import("$server/services/fee/backgroundFeeService.ts");
  BackgroundFeeService = feeModule.BackgroundFeeService;
}

// Set DENO_BUILD_MODE globally, to be accessible within the resolver
(globalThis as any).DENO_BUILD_MODE = Deno.args.includes("build");

if ((globalThis as any).DENO_BUILD_MODE) {
  console.log(
    "[BUILD] Running in build mode. Applying specific import resolutions if applicable.",
  );
} else {
  (globalThis as any).DENO_BUILD_MODE = false; // Ensure it's explicitly false otherwise
  // console.log("[RUNTIME] Running in runtime mode.");
}

// Re-assign to ensure our more detailed resolver (if the early one was too simple or overwritten)
const laterOriginalResolve = import.meta.resolve; // This might now point to our early resolver
import.meta.resolve = function (specifier: string): string {
  const isBuildMode = (globalThis as any).DENO_BUILD_MODE;
  console.log(
    `[LATER RESOLVER ENTRY] Specifier: "${specifier}", BuildMode: ${isBuildMode}, Timestamp: ${Date.now()}`,
  );

  if (
    specifier === "tiny-secp256k1" ||
    specifier === "secp256k1" ||
    specifier.endsWith("secp256k1.node") ||
    specifier.includes("secp256k1.node") // More aggressive check
  ) {
    console.log(
      `[LATER RESOLVER ACTION] Crypto redirect for "${specifier}" to JS/WASM.`,
    );
    return laterOriginalResolve("npm:tiny-secp256k1/lib/esm/index.js");
  }

  if (isBuildMode) {
    if (
      specifier === "$lib/utils/minting/broadcast.ts" ||
      specifier === "./broadcast.ts" ||
      specifier.endsWith("/broadcast.ts")
    ) {
      console.log(
        `[LATER RESOLVER ACTION] Build stub for broadcast: "${specifier}"`,
      );
      return laterOriginalResolve(
        specifier.replace(/broadcast\\.ts$/, "broadcast.build.ts"),
      );
    }

    if (specifier === "bitcoinjs-lib") {
      console.log(
        `[LATER RESOLVER ACTION] Build stub for bitcoinjs-lib: "${specifier}"`,
      );
      return laterOriginalResolve(
        "$server/services/stubs/bitcoinjs-lib.build.ts",
      );
    }
  }
  console.log(`[LATER RESOLVER ACTION] Default resolve for "${specifier}"`);
  return laterOriginalResolve(specifier);
};

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

  if ((globalThis as any).DENO_BUILD_MODE) {
    console.log(`[MAIN] Entering build block at ${Date.now()}`);
    await build(import.meta.url, "./main.ts", config);
    console.log(`[MAIN] Exiting build block at ${Date.now()}`);
    Deno.exit(0);
  } else {
    console.log(`[MAIN] Entering runtime block at ${Date.now()}`);
    if (Deno.env.get("DENO_ENV") !== "development") {}
    await start(manifest, config);
    console.log(`[MAIN] Server started at ${Date.now()}`);
  }
}
