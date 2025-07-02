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
  | "system"
  | "ui"
  | "src20"
  | "stamp-create"
  | "src20-transfer"
  | "src20-deploy"
  | "src20-mint"
  | "quicknode-service"
  | "common-utxo-service"
  | "transaction-utxo-service"
  | "psbt-service"
  | "api-utxo-query"
  | "api-src20-create"
  | "src101-psbt-service"
  | "src20-operation-service"
  | "src101-operation-service"
  | "api-src101-create";

declare global {
  interface Window {
    __DEBUG?: {
      namespaces: string;
      enabled: boolean;
    };
  }
}

declare global {
  interface globalThis {
    __DEBUG?: {
      namespaces: string;
      enabled: boolean;
    };
  }
}

function isServer(): boolean {
  return typeof Deno !== "undefined";
}

function initializeClientDebug() {
  if (!isServer()) {
    const existingNamespaces = (globalThis as any).__DEBUG?.namespaces;

    (globalThis as any).__DEBUG = {
      namespaces: existingNamespaces || "stamps,ui,debug,all",
      enabled: (globalThis as any).__DEBUG?.enabled ?? true,
    };
  }
}

function shouldLog(namespace: LogNamespace): boolean {
  if (!isServer()) {
    if (!(globalThis as any).__DEBUG?.enabled) return false;

    const namespaces = ((globalThis as any).__DEBUG.namespaces || "")
      .split(",")
      .map((n: string) => n.trim().toLowerCase());

    return namespaces.includes("all") ||
      namespaces.includes(namespace.toLowerCase());
  }

  const debug = Deno.env.get("DEBUG") || "";
  if (!debug) return false;

  const namespaces = debug.split(",").map((n) => n.trim().toLowerCase());
  return namespaces.includes("all") ||
    namespaces.includes(namespace.toLowerCase());
}

const LOG_DIR = "./logs";
const LOG_FILE = `${LOG_DIR}/app.log`;

async function writeToFile(data: string) {
  if (!isServer()) return;

  const isDevelopment = Deno.env.get("DENO_ENV") === "development";

  try {
    // In production, only write errors to file
    if (!isDevelopment && !data.includes('"level":"error"')) {
      return;
    }

    // Ensure log directory exists
    try {
      await Deno.mkdir(LOG_DIR, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw error;
      }
    }

    // Write log with timestamp
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} ${data}\n`;
    await Deno.writeTextFile(LOG_FILE, logEntry, { append: true });
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

const bigIntReplacer = (_key: string, value: any) =>
  typeof value === "bigint" ? value.toString() : value;

export const logger = {
  debug: (namespace: LogNamespace, msg: LogMessage) => {
    initializeClientDebug();
    const logData = formatLog("debug", namespace, msg);

    if (!isServer()) {
      if (shouldLog(namespace)) {
        console.debug(logData);
      }
      return;
    }

    const formatted = JSON.stringify(logData, bigIntReplacer, 2);

    // Always write to file on server if namespace is enabled
    if (shouldLog(namespace)) {
      console.debug(formatted);
      writeToFile(formatted);
    }
  },

  error: (namespace: LogNamespace, msg: LogMessage) => {
    initializeClientDebug();
    const logData = formatLog("error", namespace, msg);

    if (!isServer()) {
      console.error(logData);
      return;
    }

    const formatted = JSON.stringify(logData, bigIntReplacer, 2);
    console.error(formatted);
    writeToFile(formatted);
  },

  info: (namespace: LogNamespace, msg: LogMessage) => {
    initializeClientDebug();
    const logData = formatLog("info", namespace, msg);

    if (!isServer()) {
      if (shouldLog(namespace)) {
        console.info(logData);
      }
      return;
    }

    const formatted = JSON.stringify(logData, bigIntReplacer, 2);
    if (shouldLog(namespace)) {
      console.info(formatted);
    }
    writeToFile(formatted);
  },

  warn: (namespace: LogNamespace, msg: LogMessage) => {
    initializeClientDebug();
    const logData = formatLog("warn", namespace, msg);

    if (!isServer()) {
      console.warn(logData);
      return;
    }

    const formatted = JSON.stringify(logData, bigIntReplacer, 2);
    console.warn(formatted);
    writeToFile(formatted);
  },
};
