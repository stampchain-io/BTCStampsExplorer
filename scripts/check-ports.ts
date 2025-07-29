#!/usr/bin/env -S deno run --allow-net --allow-run

/**
 * Check if common development ports are available
 */

async function isPortAvailable(port: number): Promise<boolean> {
  try {
    const listener = Deno.listen({ port });
    listener.close();
    return true;
  } catch {
    return false;
  }
}

async function findProcessOnPort(port: number): Promise<string | null> {
  try {
    const cmd = new Deno.Command("lsof", {
      args: ["-i", `:${port}`, "-P", "-n"],
      stdout: "piped",
      stderr: "piped",
    });
    
    const { stdout } = await cmd.output();
    const output = new TextDecoder().decode(stdout);
    const lines = output.split("\n").filter(line => line.includes("LISTEN"));
    
    if (lines.length > 0) {
      // Extract process name from lsof output
      const parts = lines[0].split(/\s+/);
      return parts[0] || "Unknown";
    }
    return null;
  } catch {
    return null;
  }
}

async function checkPorts() {
  console.log("🔍 Checking development ports...\n");
  
  const ports = [
    { port: 8000, name: "Fresh Dev Server" },
    { port: 8010, name: "Fresh Dev Server (incremented)" },
    { port: 8020, name: "Fresh Dev Server (incremented)" },
    { port: 9229, name: "Deno Inspector" },
    { port: 9230, name: "Deno Inspector (alt)" },
  ];
  
  let hasConflicts = false;
  
  for (const { port, name } of ports) {
    const available = await isPortAvailable(port);
    
    if (!available) {
      hasConflicts = true;
      const process = await findProcessOnPort(port);
      console.log(`❌ Port ${port} (${name}) is in use by: ${process || "Unknown"}`);
    } else {
      console.log(`✅ Port ${port} (${name}) is available`);
    }
  }
  
  if (hasConflicts) {
    console.log("\n⚠️  Some ports are in use. Run 'deno task kill' to clean up.");
    Deno.exit(1);
  } else {
    console.log("\n✅ All ports are available!");
  }
}

if (import.meta.main) {
  await checkPorts();
}