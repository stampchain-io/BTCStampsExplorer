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

// Special handling for build-specific modules
// This makes the build process use the stub implementations
// but the runtime will use the real implementations
if (Deno.args.includes("build")) {
  globalThis.DENO_BUILD_MODE = true;

  // Override import.meta.resolve to handle certain modules differently during build
  const originalResolve = import.meta.resolve;
  import.meta.resolve = function (specifier: string): string {
    // Redirect broadcast.ts to broadcast.build.ts
    if (
      specifier === "$lib/utils/minting/broadcast.ts" ||
      specifier === "./broadcast.ts" ||
      specifier.endsWith("/broadcast.ts")
    ) {
      console.log(
        "[BUILD] Redirecting import of broadcast.ts to broadcast.build.ts",
      );
      return originalResolve(
        specifier.replace(/broadcast\.ts$/, "broadcast.build.ts"),
      );
    }

    // Handle bitcoinjs-lib imports
    if (specifier === "bitcoinjs-lib") {
      console.log(
        "[BUILD] Redirecting import of bitcoinjs-lib to stub implementation",
      );
      return originalResolve(
        "$server/services/stubs/bitcoinjs-lib.build.ts",
      );
    }

    // Handle tiny-secp256k1 and secp256k1 imports
    if (
      specifier === "node:module" ||
      specifier === "tiny-secp256k1" ||
      specifier === "secp256k1" ||
      specifier.endsWith("secp256k1.node")
    ) {
      if (Deno.args.includes("build")) {
        console.log("[BUILD] Redirecting crypto module to stub implementation");
        return originalResolve(
          "$server/services/stubs/tiny-secp256k1.build.ts",
        );
      } else {
        console.log("[DEV] Redirecting crypto module to WASM fallback");
        return originalResolve(
          "tiny-secp256k1/lib/esm/index.js",
        );
      }
    }

    return originalResolve(specifier);
  };

  // Also set a global flag to indicate we're in build mode
  console.log(
    "[BUILD] Running in build mode with stub implementations for crypto modules",
  );
} else {
  globalThis.DENO_BUILD_MODE = false;
}

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
