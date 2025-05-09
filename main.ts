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
  import.meta.resolve = function(specifier: string, parent?: string): string {
    // Redirect broadcast.ts to broadcast.build.ts
    if (specifier === "$lib/utils/minting/broadcast.ts" || 
        specifier === "./broadcast.ts" ||
        specifier.endsWith("/broadcast.ts")) {
      console.log("[BUILD] Redirecting import of broadcast.ts to broadcast.build.ts");
      return originalResolve(specifier.replace(/broadcast\.ts$/, "broadcast.build.ts"), parent);
    }
    
    // Handle bitcoinjs-lib imports
    if (specifier === "bitcoinjs-lib") {
      console.log("[BUILD] Redirecting import of bitcoinjs-lib to stub implementation");
      return originalResolve("$server/services/stubs/bitcoinjs-lib.build.ts", parent || import.meta.url);
    }
    
    // Handle tiny-secp256k1 imports directly
    if (specifier === "tiny-secp256k1") {
      console.log("[BUILD] Redirecting import of tiny-secp256k1 to stub implementation");
      return originalResolve("$server/services/stubs/tiny-secp256k1.build.ts", parent || import.meta.url);
    }
    
    // Handle secp256k1 native module imports
    if (specifier === "node:module" || 
        specifier === "secp256k1" || 
        specifier.endsWith("secp256k1.node")) {
      console.log("[BUILD] Redirecting import of secp256k1 native module to stub implementation");
      return originalResolve("$server/services/stubs/tiny-secp256k1.build.ts", parent || import.meta.url);
    }
    
    return originalResolve(specifier, parent);
  };
  
  // Also set a global flag to indicate we're in build mode
  console.log("[BUILD] Running in build mode with stub implementations for crypto modules");
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
