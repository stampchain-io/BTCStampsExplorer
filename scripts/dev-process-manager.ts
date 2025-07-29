#!/usr/bin/env -S deno run --allow-net --allow-run --allow-write --allow-read --allow-env

/**
 * Development Process Manager
 * Manages Deno dev server processes to prevent port conflicts and orphaned processes
 */

import { existsSync } from "@std/fs";
import { join } from "@std/path";

const PID_FILE = join(Deno.cwd(), ".deno-pids.json");
const BASE_PORT = 8000;
const BASE_DEBUG_PORT = 9229;

interface ProcessInfo {
  pid: number;
  port: number;
  debugPort: number;
  command: string;
  startTime: number;
  configName?: string;
}

interface PidFile {
  processes: ProcessInfo[];
}

class DevProcessManager {
  private pidData: PidFile = { processes: [] };

  constructor() {
    this.loadPidFile();
  }

  private loadPidFile() {
    if (existsSync(PID_FILE)) {
      try {
        const data = Deno.readTextFileSync(PID_FILE);
        this.pidData = JSON.parse(data);
      } catch {
        this.pidData = { processes: [] };
      }
    }
  }

  private savePidFile() {
    Deno.writeTextFileSync(PID_FILE, JSON.stringify(this.pidData, null, 2));
  }

  async isProcessRunning(pid: number): Promise<boolean> {
    try {
      // Check if process exists by sending signal 0
      Deno.kill(pid, "SIGCONT");
      return true;
    } catch {
      return false;
    }
  }

  async isPortInUse(port: number): Promise<boolean> {
    try {
      const listener = Deno.listen({ port });
      listener.close();
      return false;
    } catch {
      return true;
    }
  }

  async cleanupDeadProcesses() {
    const aliveProcesses: ProcessInfo[] = [];
    
    for (const proc of this.pidData.processes) {
      if (await this.isProcessRunning(proc.pid)) {
        aliveProcesses.push(proc);
      } else {
        console.log(`🧹 Removing dead process ${proc.pid} from tracking`);
      }
    }
    
    this.pidData.processes = aliveProcesses;
    this.savePidFile();
  }

  async findAvailablePort(basePort: number, increment: number = 10): Promise<number> {
    let port = basePort;
    let attempts = 0;
    
    while (attempts < 10) {
      if (!(await this.isPortInUse(port))) {
        return port;
      }
      port += increment;
      attempts++;
    }
    
    throw new Error(`No available ports found starting from ${basePort}`);
  }

  async killAllProcesses() {
    console.log("🔍 Killing all tracked Deno processes...");
    
    await this.cleanupDeadProcesses();
    
    for (const proc of this.pidData.processes) {
      try {
        console.log(`  Killing process ${proc.pid} (${proc.configName || proc.command})`);
        Deno.kill(proc.pid, "SIGTERM");
        
        // Give it time to exit gracefully
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force kill if still running
        if (await this.isProcessRunning(proc.pid)) {
          Deno.kill(proc.pid, "SIGKILL");
        }
      } catch (e) {
        console.log(`  ⚠️  Failed to kill ${proc.pid}: ${e.message}`);
      }
    }
    
    // Kill any untracked processes on common ports
    await this.killPortRange(BASE_PORT, BASE_PORT + 100, 10);
    await this.killPortRange(BASE_DEBUG_PORT, BASE_DEBUG_PORT + 10, 1);
    
    // Clear the PID file
    this.pidData.processes = [];
    this.savePidFile();
    
    console.log("✅ All processes cleaned up");
  }

  async killPortRange(startPort: number, endPort: number, increment: number) {
    for (let port = startPort; port <= endPort; port += increment) {
      await this.killProcessOnPort(port);
    }
  }

  async killProcessOnPort(port: number) {
    try {
      const cmd = new Deno.Command("lsof", {
        args: ["-ti", `:${port}`],
        stdout: "piped",
        stderr: "piped",
      });
      
      const { stdout } = await cmd.output();
      const output = new TextDecoder().decode(stdout).trim();
      
      if (output) {
        const pids = output.split("\n").map(p => parseInt(p)).filter(p => !isNaN(p));
        for (const pid of pids) {
          try {
            Deno.kill(pid, "SIGKILL");
            console.log(`  Killed process ${pid} on port ${port}`);
          } catch {
            // Process might already be dead
          }
        }
      }
    } catch {
      // lsof might not be available or no process on port
    }
  }

  async registerProcess(configName: string, command: string): Promise<{ port: number; debugPort: number }> {
    await this.cleanupDeadProcesses();
    
    // Find available ports
    const port = await this.findAvailablePort(BASE_PORT);
    const debugPort = await this.findAvailablePort(BASE_DEBUG_PORT, 1);
    
    const processInfo: ProcessInfo = {
      pid: Deno.pid,
      port,
      debugPort,
      command,
      startTime: Date.now(),
      configName,
    };
    
    this.pidData.processes.push(processInfo);
    this.savePidFile();
    
    console.log(`📝 Registered process ${Deno.pid} on port ${port} (debug: ${debugPort})`);
    
    return { port, debugPort };
  }

  async killByConfigName(configName: string) {
    await this.cleanupDeadProcesses();
    
    const processes = this.pidData.processes.filter(p => p.configName === configName);
    
    for (const proc of processes) {
      try {
        console.log(`Killing ${configName} process ${proc.pid}`);
        Deno.kill(proc.pid, "SIGTERM");
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (await this.isProcessRunning(proc.pid)) {
          Deno.kill(proc.pid, "SIGKILL");
        }
      } catch {
        // Process might already be dead
      }
    }
    
    this.pidData.processes = this.pidData.processes.filter(p => p.configName !== configName);
    this.savePidFile();
  }

  getStatus() {
    console.log("\n📊 Process Status:");
    console.log("─".repeat(60));
    
    if (this.pidData.processes.length === 0) {
      console.log("No tracked processes");
      return;
    }
    
    for (const proc of this.pidData.processes) {
      const runtime = Math.floor((Date.now() - proc.startTime) / 1000);
      console.log(`PID: ${proc.pid} | Port: ${proc.port} | Debug: ${proc.debugPort}`);
      console.log(`Config: ${proc.configName || "Unknown"} | Runtime: ${runtime}s`);
      console.log("─".repeat(60));
    }
  }
}

// CLI Commands
async function main() {
  const manager = new DevProcessManager();
  const [command, ...args] = Deno.args;
  
  switch (command) {
    case "kill-all":
      await manager.killAllProcesses();
      break;
      
    case "kill-config":
      if (args[0]) {
        await manager.killByConfigName(args[0]);
      } else {
        console.error("Please provide a config name");
      }
      break;
      
    case "register":
      if (args[0]) {
        const ports = await manager.registerProcess(args[0], args[1] || "unknown");
        console.log(JSON.stringify(ports));
      } else {
        console.error("Please provide a config name");
      }
      break;
      
    case "status":
      manager.getStatus();
      break;
      
    case "cleanup":
      await manager.cleanupDeadProcesses();
      console.log("✅ Cleaned up dead processes");
      break;
      
    default:
      console.log(`
Dev Process Manager

Commands:
  kill-all              Kill all tracked processes
  kill-config <name>    Kill processes for specific config
  register <name>       Register new process and get ports
  status               Show all tracked processes
  cleanup              Remove dead processes from tracking

Examples:
  ./dev-process-manager.ts kill-all
  ./dev-process-manager.ts register "Standard Dev"
  ./dev-process-manager.ts status
      `);
  }
}

if (import.meta.main) {
  await main();
}