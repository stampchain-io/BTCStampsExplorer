# secp256k1.node Build Issue Investigation

This document tracks findings related to the `module "/app/build/secp256k1.node" not found` error observed in ECS logs.

## Analysis of Build Files:

1.  **`Dockerfile`:**
    *   Base Image: `denoland/deno:alpine-2.3.1`. Alpine Linux is minimal.
    *   Installed tools: Only `bash` is explicitly added via `apk add`. No common native module build tools (like `make`, `g++`, `python`) are installed.
    *   Build Command: `RUN deno run --allow-all main.ts build --lock-write`
    *   Cache Command: `RUN DENO_DIR=/app/.deno NPM_CONFIG_CACHE=/app/.npm deno cache --reload main.ts`
    *   **Observation**: No explicit `npm install` or similar step that would typically compile native Node.js addons. The method for `secp256k1.node` to be generated or obtained and placed into `/app/build/` is not apparent from the Dockerfile's direct commands.

2.  **`main.ts` (Runtime & Build-time Logic for Crypto Modules):**
    *   **Build Mode (`Deno.args.includes("build")` is true):**
        ```typescript
        // When `deno run main.ts build` is executed (e.g., in Dockerfile)
        if (
          specifier === "node:module" ||
          specifier === "tiny-secp256k1" ||
          specifier === "secp256k1" ||
          specifier.endsWith("secp256k1.node")
        ) {
          console.log("[BUILD] Redirecting crypto module to stub implementation");
          return originalResolve(
            "$server/services/stubs/tiny-secp256k1.build.ts", // Uses a stub
          );
        }
        ```
    *   **Runtime Mode (`Deno.args.includes("build")` is false):**
        ```typescript
        // When `deno run main.ts` is executed (e.g., CMD in Dockerfile)
        else { // Not in build mode
          console.log("[DEV] Redirecting crypto module to WASM fallback");
          return originalResolve(
            "tiny-secp256k1/lib/esm/index.js", // Uses JS/WASM version
          );
        }
        ```
    *   **Contradiction**: The runtime logic in `main.ts` aims to use a JS/WASM version of `tiny-secp256k1` (from `node_modules`, implicitly). However, the application error log shows `module "/app/build/secp256k1.node" not found`.
    *   **Hypothesis**: Another part of the application (not covered by `main.ts`'s `import.meta.resolve` override) or a sub-dependency is attempting to dynamically load `secp256k1.node` from the specific path `/app/build/secp256k1.node`. This path is non-standard for typical Deno/NPM module resolution.

3.  **`buildspec.yml`:**
    *   Focuses on ECR login, Docker image tagging, and pushing.
    *   Does not perform pre-compilation or direct manipulation of application code/dependencies outside the `docker build` context.

## Summary of `secp256k1.node` Issue:

*   The Dockerfile lacks steps to install C/C++ build toolchains or to explicitly build native Node.js addons like `secp256k1.node`.
*   `main.ts` attempts to use a JS/WASM fallback for `tiny-secp256k1` at runtime via `import.meta.resolve`.
*   Despite this, an error `module "/app/build/secp256k1.node" not found` occurs at runtime, indicating a component is trying to load this native module from a hardcoded/unexpected path, or via a mechanism not intercepted by the ES module resolver.
*   The file `/app/build/secp256k1.node` is not being generated or placed into that location by any visible build step.

## Potential Causes:

1.  **Missing Build Step**: A dedicated step to compile/obtain `secp256k1.node` and place it in `/app/build/` is absent (and likely undesired if aiming for JS/WASM).
2.  **Incorrect Runtime Path Expectation**: A component within the application or a dependency has an incorrect/hardcoded path expectation for the native module, or uses a non-ESM loading mechanism (e.g., dynamic `require`).
3.  **Behavior of `tiny-secp256k1` (or another dependency)**: The JS/WASM version (`tiny-secp256k1/lib/esm/index.js`) or one of its own dependencies might itself attempt to dynamically `require()` or load an optional native `.node` file from a predefined or OS-dependent path, not fully accounting for Deno's runtime characteristics or the specific non-standard path `/app/build/`.

## Recommendations:

1.  **Identify the Loader**: Trace which specific part of the code or which dependency is making the call to load `"/app/build/secp256k1.node"`. This might involve more detailed debugging, or searching through dependency code.
2.  **Choose a Resolution Strategy**:
    *   **Strategy A (Use Native Module)**: If the native `.node` file is strictly required for performance or functionality:
        *   Modify `Dockerfile`: Add necessary build tools (`apk add make g++ python ...`).
        *   Add steps to correctly install/compile `tiny-secp256k1` (or `secp256k1`) such that the `.node` file is produced.
        *   Ensure the compiled `.node` file is copied to the expected `/app/build/secp256k1.node` path. *(This seems unlikely given the /app/build path and Deno focus)*.
    *   **Strategy B (Use JS/WASM Fallback Consistently - Preferred for Deno)**:
        *   Ensure that *all* parts of the application and all dependencies correctly and exclusively use the JS/WASM version of `tiny-secp256k1` (e.g., `npm:tiny-secp256k1/lib/esm/index.js`).
        *   Eliminate or correct the code path that attempts to load from `/app/build/secp256k1.node`. This might involve configuring the problematic dependency, adjusting how it's imported/used, or patching it if necessary.

## Update (Post `main.ts` resolver changes):
*   The `import.meta.resolve` override in `main.ts` was updated to redirect all `tiny-secp256k1`, `secp256k1`, and `*.secp256k1.node` specifiers to `npm:tiny-secp256k1/lib/esm/index.js`.
*   Despite these changes, the error `module "/app/build/secp256k1.node" not found` persists during application startup (logged May 16, 2025 at 10:19 UTC-5).
*   This indicates that the mechanism trying to load this specific path is not being intercepted by the ES Module `import.meta.resolve` hook. Further investigation is needed to find the source of this direct load attempt. It could be a dynamic `require` within a dependency, an FFI call, or a custom loader. The specific path `/app/build/` remains a key puzzle piece. 