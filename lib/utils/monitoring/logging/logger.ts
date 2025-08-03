/**
 * Logger utility with namespace-based filtering and JSON output
 * Supports DEBUG environment variable for selective logging
 */

import {
  LOG_CONFIG,
  type LogNamespace,
} from "$lib/constants/loggingConstants.ts";

// Re-export LogNamespace for convenience
export type { LogNamespace };

export interface LogData {
  level: string;
  namespace: string;
  timestamp: string;
  [key: string]: any;
}

class Logger {
  private enabledNamespaces: Set<string> = new Set();
  private enableFileLogging = false;
  private logFilePath: string = LOG_CONFIG.DEFAULT_LOG_PATH;

  constructor() {
    this.updateEnabledNamespaces();
  }

  private updateEnabledNamespaces(): void {
    const debugEnv = globalThis.Deno?.env.get("DEBUG") || "";
    this.enabledNamespaces.clear();

    if (debugEnv === "*") {
      this.enabledNamespaces.add("*");
    } else if (debugEnv) {
      debugEnv.split(",").forEach((ns) => {
        this.enabledNamespaces.add(ns.trim());
      });
    }
  }

  private isNamespaceEnabled(namespace: string): boolean {
    if (this.enabledNamespaces.has("*")) return true;
    return this.enabledNamespaces.has(namespace);
  }

  private formatLogData(level: string, namespace: string, data: any): string {
    const logData: LogData = {
      level,
      namespace,
      timestamp: new Date().toISOString(),
      ...data,
    };

    // Handle BigInt serialization
    return JSON.stringify(logData, (_key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    });
  }

  private async writeToFile(logEntry: string): Promise<void> {
    if (!this.enableFileLogging || !globalThis.Deno) {
      return;
    }

    try {
      const logDir = this.logFilePath.substring(
        0,
        this.logFilePath.lastIndexOf("/"),
      );
      await Deno.mkdir(logDir, { recursive: true });
      await Deno.writeTextFile(this.logFilePath, logEntry + "\n", {
        append: true,
      });
    } catch (error) {
      // Silently fail file writing
    }
  }

  debug(namespace: LogNamespace, data: any): void {
    this.updateEnabledNamespaces();
    if (this.isNamespaceEnabled(namespace)) {
      const logEntry = this.formatLogData("debug", namespace, data);
      console.debug(logEntry);
      this.writeToFile(logEntry);
    }
  }

  info(namespace: LogNamespace, data: any): void {
    this.updateEnabledNamespaces();
    if (this.isNamespaceEnabled(namespace)) {
      const logEntry = this.formatLogData("info", namespace, data);
      console.info(logEntry);
      this.writeToFile(logEntry);
    }
  }

  warn(namespace: LogNamespace, data: any): void {
    // Warn always logs regardless of namespace
    const logEntry = this.formatLogData("warn", namespace, data);
    console.warn(logEntry);
    this.writeToFile(logEntry);
  }

  error(namespace: LogNamespace, data: any): void {
    // Error always logs regardless of namespace
    const logEntry = this.formatLogData("error", namespace, data);
    console.error(logEntry);
    this.writeToFile(logEntry);
  }

  setConfig(
    config: { enableFileLogging?: boolean; logFilePath?: string },
  ): void {
    if (config.enableFileLogging !== undefined) {
      this.enableFileLogging = config.enableFileLogging;
    }
    if (config.logFilePath !== undefined) {
      this.logFilePath = config.logFilePath;
    }
  }

  getConfig(): { enableFileLogging: boolean; logFilePath: string } {
    return {
      enableFileLogging: this.enableFileLogging,
      logFilePath: this.logFilePath,
    };
  }
}

// Export a singleton instance
export const logger = new Logger();

// Also export the class for testing purposes
export { Logger };
