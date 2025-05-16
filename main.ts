/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference types="npm:@types/node" />

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

import "$/globals.d.ts";
import { start } from "$fresh/server.ts";
import build from "$fresh/dev.ts";
import manifest from "$/fresh.gen.ts";
import config from "$/fresh.config.ts";
import "$server/database/index.ts"; // Ensures dbManager instance is created via its module execution
import { dbManager } from "$server/database/databaseManager.ts"; // Explicit import for direct use

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
  if (!Deno.args.includes("build")) {
    try {
      console.log(`[MAIN] Attempting dbManager.initialize() at ${Date.now()}`);
      await dbManager.initialize();
      console.log(`[MAIN] dbManager.initialize() completed at ${Date.now()}`);
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
