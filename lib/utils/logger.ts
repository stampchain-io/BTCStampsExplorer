interface LogMessage {
  message: string;
  [key: string]: unknown;
}

type LogLevel = "debug" | "error" | "info" | "warn";
type LogNamespace = "stamps" | "images" | "ui" | "db" | "all";

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

function shouldLog(namespace: LogNamespace): boolean {
  // Check if we're in browser context
  if (typeof window !== "undefined") {
    const global = (window as unknown) as GlobalWithDebug;
    if (!global.__DEBUG?.enabled) return false;
    const namespaces = global.__DEBUG.namespaces.split(",");
    return namespaces.includes("all") || namespaces.includes(namespace);
  }

  // Server-side context
  const debug = Deno.env.get("DEBUG") || "";
  if (!debug) return false;

  const namespaces = debug.split(",");
  return namespaces.includes("all") || namespaces.includes(namespace);
}

function formatLog(level: LogLevel, namespace: LogNamespace, msg: LogMessage) {
  return {
    timestamp: new Date().toISOString(),
    level,
    namespace,
    ...msg,
  };
}

export const logger = {
  debug: (namespace: LogNamespace, msg: LogMessage) => {
    if (shouldLog(namespace)) {
      console.debug(
        JSON.stringify(formatLog("debug", namespace, msg), null, 2),
      );
    }
  },

  error: (namespace: LogNamespace, msg: LogMessage) => {
    console.error(JSON.stringify(formatLog("error", namespace, msg), null, 2));
  },

  info: (namespace: LogNamespace, msg: LogMessage) => {
    if (shouldLog(namespace)) {
      console.info(JSON.stringify(formatLog("info", namespace, msg), null, 2));
    }
  },

  warn: (namespace: LogNamespace, msg: LogMessage) => {
    console.warn(JSON.stringify(formatLog("warn", namespace, msg), null, 2));
  },
};
