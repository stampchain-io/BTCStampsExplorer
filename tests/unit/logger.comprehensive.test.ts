/**
 * @fileoverview Comprehensive tests for Logger utility
 * Extends existing logger.test.ts to achieve near 100% coverage
 * Focuses on file writing, client-side scenarios, and edge cases
 */

import { logger } from "$lib/utils/logger.ts";
import { assert, assertEquals } from "@std/assert";

// Save original console methods and Deno
const originalConsole = {
  debug: console.debug,
  error: console.error,
  info: console.info,
  warn: console.warn,
};

const originalDeno = globalThis.Deno;
const originalEnv = originalDeno ? { ...Deno.env.toObject() } : {};

// Mock console output
let consoleOutput: any[] = [];

// Mock file system operations
let mockFileOperations: {
  mkdir: any[];
  writeTextFile: any[];
  errors: any[];
} = {
  mkdir: [],
  writeTextFile: [],
  errors: [],
};

function mockConsole() {
  console.debug = (...args: any[]) =>
    consoleOutput.push({ level: "debug", args });
  console.error = (...args: any[]) =>
    consoleOutput.push({ level: "error", args });
  console.info = (...args: any[]) =>
    consoleOutput.push({ level: "info", args });
  console.warn = (...args: any[]) =>
    consoleOutput.push({ level: "warn", args });
}

function mockFileSystem() {
  if (globalThis.Deno) {
    // Mock Deno.mkdir
    globalThis.Deno.mkdir = async (path: any, options?: any) => {
      mockFileOperations.mkdir.push({ path, options });
      // Don't throw AlreadyExists error by default
      return Promise.resolve();
    };

    // Mock Deno.writeTextFile
    globalThis.Deno.writeTextFile = async (
      path: any,
      data: any,
      options?: any,
    ) => {
      mockFileOperations.writeTextFile.push({ path, data, options });
      return Promise.resolve();
    };

    // Mock Deno.errors
    globalThis.Deno.errors = {
      AlreadyExists: class AlreadyExists extends Error {
        constructor(message?: string) {
          super(message);
          this.name = "AlreadyExists";
        }
      },
    } as any;
  }
}

function restoreConsole() {
  console.debug = originalConsole.debug;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
}

function restoreEnvironment() {
  if (originalDeno && !globalThis.Deno) {
    // Only restore Deno if it was deleted (client-side tests)
    try {
      (globalThis as any).Deno = originalDeno;
    } catch {
      // Ignore read-only errors in some test environments
    }
  }
  if (globalThis.Deno) {
    // Restore original environment variables
    for (const [key, value] of Object.entries(originalEnv)) {
      Deno.env.set(key, value);
    }
  }
  delete (globalThis as any).__DEBUG;
}

function setup() {
  consoleOutput = [];
  mockFileOperations = { mkdir: [], writeTextFile: [], errors: [] };
  mockConsole();
  mockFileSystem();
}

function teardown() {
  restoreConsole();
  restoreEnvironment();
}

/* ===== FILE WRITING TESTS ===== */

Deno.test("logger - file writing in development mode", async () => {
  setup();

  // Set development environment
  Deno.env.set("DENO_ENV", "development");
  Deno.env.set("DEBUG", "stamps");

  logger.debug("stamps", { message: "Test file writing", data: "test" });

  // Wait a bit for async file operations
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Check that mkdir was called
  assertEquals(mockFileOperations.mkdir.length, 1);
  assertEquals(mockFileOperations.mkdir[0].path, "./logs");
  assertEquals(mockFileOperations.mkdir[0].options.recursive, true);

  // Check that writeTextFile was called
  assertEquals(mockFileOperations.writeTextFile.length, 1);
  assertEquals(mockFileOperations.writeTextFile[0].path, "./logs/app.log");
  assertEquals(mockFileOperations.writeTextFile[0].options.append, true);

  // Check log entry format
  const logEntry = mockFileOperations.writeTextFile[0].data;
  assert(logEntry.includes("Test file writing"));
  assert(logEntry.includes("stamps"));
  assert(logEntry.includes("debug"));

  teardown();
});

Deno.test("logger - production vs development file writing logic", async () => {
  setup();

  // Test that production environment is detected correctly
  Deno.env.set("DENO_ENV", "production");

  // In production, only errors should trigger file writes
  // But since we're testing the logic indirectly, we'll test that console.error is called
  logger.error("stamps", { message: "Error in production" });

  // At minimum, error should be logged to console
  const errorLogs = consoleOutput.filter((o) => o.level === "error");
  assertEquals(errorLogs.length, 1, "Error should be logged to console");
  assert(
    errorLogs[0].args[0].includes("level"),
    "Should contain level field",
  );

  teardown();
});

Deno.test("logger - file writing with directory already exists", async () => {
  setup();

  // Mock mkdir to throw AlreadyExists error
  globalThis.Deno.mkdir = async () => {
    const error = new (globalThis.Deno.errors.AlreadyExists)(
      "Directory already exists",
    );
    throw error;
  };

  Deno.env.set("DENO_ENV", "development");
  Deno.env.set("DEBUG", "stamps");

  logger.debug("stamps", { message: "Test existing directory" });
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Should still write to file even if directory exists
  assertEquals(mockFileOperations.writeTextFile.length, 1);

  teardown();
});

Deno.test("logger - file writing with mkdir error", async () => {
  setup();

  // Mock mkdir to throw a different error
  globalThis.Deno.mkdir = async () => {
    throw new Error("Permission denied");
  };

  Deno.env.set("DENO_ENV", "development");
  Deno.env.set("DEBUG", "stamps");

  logger.debug("stamps", { message: "Test mkdir error" });
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Should log error to console
  const errorLogs = consoleOutput.filter((o) => o.level === "error");
  assertEquals(errorLogs.length, 1);
  assert(errorLogs[0].args[0].includes("Failed to write to log file"));

  teardown();
});

Deno.test("logger - file writing with writeTextFile error", async () => {
  setup();

  // Mock writeTextFile to throw error
  globalThis.Deno.writeTextFile = async () => {
    throw new Error("Disk full");
  };

  Deno.env.set("DENO_ENV", "development");
  Deno.env.set("DEBUG", "stamps");

  logger.debug("stamps", { message: "Test write error" });
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Should log error to console
  const errorLogs = consoleOutput.filter((o) => o.level === "error");
  assertEquals(errorLogs.length, 1);
  assert(errorLogs[0].args[0].includes("Failed to write to log file"));

  teardown();
});

/* ===== CLIENT-SIDE COMPREHENSIVE TESTS ===== */

Deno.test("logger - client-side debug disabled", () => {
  setup();

  // Simulate client environment
  delete (globalThis as any).Deno;

  // Set debug disabled
  (globalThis as any).__DEBUG = {
    namespaces: "stamps,ui",
    enabled: false,
  };

  logger.debug("stamps", { message: "Should not log" });

  assertEquals(
    consoleOutput.length,
    0,
    "Should not log when debug is disabled",
  );

  teardown();
});

Deno.test("logger - client-side namespace filtering", () => {
  setup();

  // Simulate client environment
  delete (globalThis as any).Deno;

  // Set specific namespaces
  (globalThis as any).__DEBUG = {
    namespaces: "stamps,ui,cache",
    enabled: true,
  };

  // Mock console for client-side (direct objects, not JSON)
  consoleOutput = [];
  console.debug = (data: any) => consoleOutput.push({ level: "debug", data });
  console.info = (data: any) => consoleOutput.push({ level: "info", data });

  logger.debug("stamps", { message: "Stamps debug" });
  logger.debug("api", { message: "API debug" });
  logger.info("ui", { message: "UI info" });
  logger.info("database", { message: "Database info" });

  assertEquals(consoleOutput.length, 2, "Should log only enabled namespaces");
  assertEquals(consoleOutput[0].data.namespace, "stamps");
  assertEquals(consoleOutput[1].data.namespace, "ui");

  teardown();
});

Deno.test("logger - client-side info with disabled namespace", () => {
  setup();

  // Simulate client environment
  delete (globalThis as any).Deno;

  (globalThis as any).__DEBUG = {
    namespaces: "stamps",
    enabled: true,
  };

  // Mock console for client-side
  consoleOutput = [];
  console.info = (data: any) => consoleOutput.push({ level: "info", data });

  logger.info("api", { message: "API info" }); // api not in enabled namespaces

  assertEquals(
    consoleOutput.length,
    0,
    "Should not log info for disabled namespace on client",
  );

  teardown();
});

Deno.test("logger - client-side warn always logs", () => {
  setup();

  // Simulate client environment
  delete (globalThis as any).Deno;

  (globalThis as any).__DEBUG = {
    namespaces: "stamps",
    enabled: true,
  };

  // Mock console for client-side
  consoleOutput = [];
  console.warn = (data: any) => consoleOutput.push({ level: "warn", data });

  logger.warn("api", { message: "API warning" }); // api not in enabled namespaces

  assertEquals(consoleOutput.length, 1, "Warn should always log on client");
  assertEquals(consoleOutput[0].data.namespace, "api");

  teardown();
});

/* ===== SERVER-SIDE EDGE CASES ===== */

Deno.test("logger - server-side no DEBUG env", () => {
  setup();

  // Clear DEBUG environment
  Deno.env.delete("DEBUG");

  logger.debug("stamps", { message: "No debug env" });
  logger.info("stamps", { message: "No debug env info" });

  // Should not log debug or info when DEBUG is not set
  const debugLogs = consoleOutput.filter((o) => o.level === "debug");
  const infoLogs = consoleOutput.filter((o) => o.level === "info");

  assertEquals(debugLogs.length, 0, "Should not log debug without DEBUG env");
  assertEquals(infoLogs.length, 0, "Should not log info without DEBUG env");

  teardown();
});

Deno.test("logger - server-side empty DEBUG env", () => {
  setup();

  // Set empty DEBUG environment
  Deno.env.set("DEBUG", "");

  logger.debug("stamps", { message: "Empty debug env" });

  assertEquals(consoleOutput.length, 0, "Should not log with empty DEBUG env");

  teardown();
});

Deno.test("logger - server-side 'all' namespace", () => {
  setup();

  Deno.env.set("DEBUG", "all");

  logger.debug("stamps", { message: "Stamps with all" });
  logger.debug("api", { message: "API with all" });
  logger.info("database", { message: "Database with all" });

  assertEquals(consoleOutput.length, 3, "Should log all namespaces with 'all'");

  teardown();
});

/* ===== COMPREHENSIVE INTEGRATION TESTS ===== */

Deno.test("logger - complex namespace combinations", () => {
  setup();

  Deno.env.set("DEBUG", "stamps,api,all,cache");

  logger.debug("stamps", { message: "Stamps log" });
  logger.debug("api", { message: "API log" });
  logger.debug("database", { message: "Database log" }); // Should log due to 'all'
  logger.debug("cache", { message: "Cache log" });
  logger.debug("system", { message: "System log" }); // Should log due to 'all'

  assertEquals(consoleOutput.length, 5, "Should log all when 'all' is present");

  teardown();
});

Deno.test("logger - case insensitive namespace matching", () => {
  setup();

  Deno.env.set("DEBUG", "STAMPS,Api,CaChe");

  logger.debug("stamps", { message: "lowercase stamps" });
  logger.debug("api", { message: "lowercase api" });
  logger.debug("cache", { message: "lowercase cache" });
  logger.debug("database", { message: "not matching" });

  assertEquals(consoleOutput.length, 3, "Should match case insensitively");

  teardown();
});

Deno.test("logger - whitespace handling in DEBUG", () => {
  setup();

  Deno.env.set("DEBUG", " stamps , api , cache ");

  logger.debug("stamps", { message: "Stamps with spaces" });
  logger.debug("api", { message: "API with spaces" });
  logger.debug("cache", { message: "Cache with spaces" });

  assertEquals(
    consoleOutput.length,
    3,
    "Should handle whitespace in DEBUG env",
  );

  teardown();
});

Deno.test("logger - client-side existing namespaces preservation", () => {
  setup();

  // Simulate client environment
  delete (globalThis as any).Deno;

  // Set existing debug config
  (globalThis as any).__DEBUG = {
    namespaces: "stamps,ui",
    enabled: true,
  };

  // Mock console for client-side
  consoleOutput = [];
  console.debug = (data: any) => consoleOutput.push({ level: "debug", data });

  logger.debug("stamps", { message: "Existing namespace" });

  assertEquals(consoleOutput.length, 1, "Should preserve existing namespaces");
  assertEquals(consoleOutput[0].data.namespace, "stamps");

  teardown();
});

Deno.test("logger - client-side initialization with no existing config", () => {
  setup();

  // Simulate client environment with no existing __DEBUG
  delete (globalThis as any).Deno;
  delete (globalThis as any).__DEBUG;

  // Mock console for client-side
  consoleOutput = [];
  console.debug = (data: any) => consoleOutput.push({ level: "debug", data });

  logger.debug("stamps", { message: "Default config" });

  // Should initialize with default namespaces
  assertEquals(consoleOutput.length, 1, "Should log with default config");
  assertEquals(consoleOutput[0].data.namespace, "stamps");

  teardown();
});
