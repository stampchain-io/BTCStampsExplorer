interface LogMessage {
  message: string;
  [key: string]: unknown;
}

type LogLevel = "debug" | "error" | "info" | "warn";
export type LogNamespace =
  | "stamps"
  | "content"
  | "api"
  | "database"
  | "cache"
  | "auth"
  | "system";

declare global {
  interface Window {
    __DEBUG?: {
      namespaces: string;
      enabled: boolean;
    };
  }
}

interface GlobalWithDebug {
  __DEBUG?: {
    namespaces: string;
    enabled: boolean;
  };
}

function isServer(): boolean {
  return typeof Deno !== "undefined";
}

function shouldLog(namespace: LogNamespace): boolean {
  // Client-side context
  if (!isServer()) {
    const globalWithDebug = globalThis as GlobalWithDebug;
    if (!globalWithDebug.__DEBUG?.enabled) return false;

    const namespaces = globalWithDebug.__DEBUG.namespaces.split(",")
      .map((n) => n.trim().toLowerCase());

    return namespaces.includes("all") ||
      namespaces.includes(namespace.toLowerCase());
  }

  // Server-side context
  const debug = Deno.env.get("DEBUG") || "";
  if (!debug) return false;

  const namespaces = debug.split(",").map((n) => n.trim().toLowerCase());
  return namespaces.includes("all") ||
    namespaces.includes(namespace.toLowerCase());
}

const LOG_FILE = "app.log";

async function writeToFile(data: string) {
  if (!isServer()) return;

  // Only write to file in development
  if (Deno.env.get("DENO_ENV") !== "development") {
    return;
  }

  try {
    await Deno.writeTextFile(LOG_FILE, data + "\n", { append: true });
  } catch (error) {
    console.error("Failed to write to log file:", error);
  }
}

function formatLog(level: LogLevel, namespace: LogNamespace, msg: LogMessage) {
  return {
    timestamp: new Date().toISOString(),
    level,
    namespace,
    ...msg,
  };
}

const isDevelopment = () =>
  isServer() && Deno.env.get("DENO_ENV") === "development";

export const logger = {
  debug: async (namespace: LogNamespace, msg: LogMessage) => {
    const logData = formatLog("debug", namespace, msg);
    const formatted = JSON.stringify(logData, null, 2);

    // In development, always log to file regardless of DEBUG setting
    if (isDevelopment()) {
      await writeToFile(formatted);
      // Also log to console for immediate feedback
      console.debug(formatted);
      return;
    }

    // In production, respect DEBUG setting
    if (shouldLog(namespace)) {
      console.debug(formatted);
    }
  },

  error: async (namespace: LogNamespace, msg: LogMessage) => {
    const logData = formatLog("error", namespace, msg);
    const formatted = JSON.stringify(logData, null, 2);

    console.error(formatted);
    await writeToFile(formatted);
  },

  info: async (namespace: LogNamespace, msg: LogMessage) => {
    const logData = formatLog("info", namespace, msg);
    const formatted = JSON.stringify(logData, null, 2);

    if (shouldLog(namespace)) {
      console.info(formatted);
    }
    await writeToFile(formatted);
  },

  warn: async (namespace: LogNamespace, msg: LogMessage) => {
    const logData = formatLog("warn", namespace, msg);
    const formatted = JSON.stringify(logData, null, 2);

    console.warn(formatted);
    await writeToFile(formatted);
  },
};
