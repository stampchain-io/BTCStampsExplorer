#!/usr/bin/env -S deno run --allow-run --allow-net --allow-read --allow-env

/**
 * Dev Server Manager - Prevents multiple Deno servers from running
 * Usage: deno run --allow-all scripts/dev-server-manager.ts
 */

import { parse } from "https://deno.land/std@0.224.0/flags/mod.ts";

const args = parse(Deno.args, {
  boolean: ["debug", "frontend-only", "no-watch"],
  string: ["port"],
  default: {
    debug: false,
    "frontend-only": false,
    "no-watch": false,
    port: "8000",
  },
});

async function killExistingServers() {
  console.log("🔍 Checking for existing Deno servers...");

  try {
    // Kill any existing Deno dev servers
    if (Deno.build.os === "windows") {
      await new Deno.Command("taskkill", {
        args: ["/F", "/IM", "deno.exe"],
        stdout: "null",
        stderr: "null",
      }).output();
    } else {
      // Kill processes running dev.ts
      await new Deno.Command("pkill", {
        args: ["-f", "deno.*dev.ts"],
        stdout: "null",
        stderr: "null",
      }).output();

      // Also kill processes on port 8000
      await new Deno.Command("lsof", {
        args: ["-ti", `:${args.port}`],
        stdout: "piped",
        stderr: "null",
      }).output().then(async (result) => {
        const pids = new TextDecoder().decode(result.stdout).trim().split("\n");
        for (const pid of pids) {
          if (pid) {
            await new Deno.Command("kill", {
              args: ["-9", pid],
              stdout: "null",
              stderr: "null",
            }).output();
          }
        }
      }).catch(() => {
        // Ignore errors if no process found
      });
    }

    // Wait a bit for processes to die
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("✅ Cleaned up existing servers");
  } catch (error) {
    console.log("⚠️  No existing servers found or unable to kill them");
  }
}

async function startDevServer() {
  const denoArgs = [
    "run",
    "--allow-all",
  ];

  if (args.debug) {
    denoArgs.push("--inspect");
  }

  if (!args["no-watch"]) {
    if (args["frontend-only"]) {
      denoArgs.push(
        "--watch=routes/,islands/,components/,static/",
        "--watch-exclude=server/,lib/utils/,_fresh/,node_modules/"
      );
    } else {
      denoArgs.push(
        "--watch=routes/,islands/,components/,lib/,server/",
        "--watch-exclude=_fresh/,node_modules/,coverage/,tmp/,dist/,fresh.gen.ts"
      );
    }
    denoArgs.push(
      "--no-clear-screen",
      "--watch-debounce=1000" // 1 second debounce
    );
  }

  denoArgs.push("dev.ts", "--host");

  console.log("🚀 Starting Deno dev server...");
  console.log(`📝 Command: deno ${denoArgs.join(" ")}`);

  const process = new Deno.Command("deno", {
    args: denoArgs,
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  const child = process.spawn();

  // Handle graceful shutdown
  const signals = ["SIGINT", "SIGTERM"] as const;
  for (const signal of signals) {
    Deno.addSignalListener(signal, async () => {
      console.log(`\n🛑 Received ${signal}, shutting down...`);
      child.kill(signal);
      await killExistingServers();
      Deno.exit(0);
    });
  }

  return child;
}

// Main execution
if (import.meta.main) {
  await killExistingServers();
  const child = await startDevServer();
  const status = await child.status;

  if (!status.success) {
    console.error("❌ Server exited with error");
    Deno.exit(1);
  }
}
