import { assert, assertEquals } from "@std/assert";
import { logger } from "$lib/utils/logger.ts";

// Save original console methods and Deno
const originalConsole = {
  debug: console.debug,
  error: console.error,
  info: console.info,
  warn: console.warn,
};

const originalDeno = globalThis.Deno;

// Mock console output
let consoleOutput: any[] = [];

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

function restoreConsole() {
  console.debug = originalConsole.debug;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
}

// Test setup and teardown
function setup() {
  consoleOutput = [];
  mockConsole();
}

function teardown() {
  restoreConsole();
  // Restore Deno if it was modified
  if (!globalThis.Deno && originalDeno) {
    globalThis.Deno = originalDeno;
  }
}

Deno.test("logger - debug logs when namespace is enabled", () => {
  setup();

  // Set DEBUG env to enable stamps namespace
  const originalDebug = Deno.env.get("DEBUG");
  Deno.env.set("DEBUG", "stamps");

  logger.debug("stamps", { message: "Test debug message", extra: "data" });

  // Check console output
  assertEquals(consoleOutput.length, 1, "Should have one console output");
  const output = consoleOutput[0];
  assertEquals(output.level, "debug", "Should be debug level");

  // Parse the logged JSON
  const logData = JSON.parse(output.args[0]);
  assertEquals(logData.level, "debug", "Log level should be debug");
  assertEquals(logData.namespace, "stamps", "Namespace should be stamps");
  assertEquals(logData.message, "Test debug message", "Message should match");
  assertEquals(logData.extra, "data", "Extra data should be included");
  assert(logData.timestamp, "Should have timestamp");

  // Restore DEBUG env
  if (originalDebug) {
    Deno.env.set("DEBUG", originalDebug);
  } else {
    Deno.env.delete("DEBUG");
  }

  teardown();
});

Deno.test("logger - debug does not log when namespace is disabled", () => {
  setup();

  // Set DEBUG env to different namespace
  const originalDebug = Deno.env.get("DEBUG");
  Deno.env.set("DEBUG", "api");

  logger.debug("stamps", { message: "Should not appear" });

  // Should not log
  assertEquals(consoleOutput.length, 0, "Should have no console output");

  // Restore DEBUG env
  if (originalDebug) {
    Deno.env.set("DEBUG", originalDebug);
  } else {
    Deno.env.delete("DEBUG");
  }

  teardown();
});

Deno.test("logger - error always logs", () => {
  setup();

  logger.error("api", { message: "Error occurred", code: "ERR_001" });

  assertEquals(consoleOutput.length, 1, "Should have one console output");
  const output = consoleOutput[0];
  assertEquals(output.level, "error", "Should be error level");

  const logData = JSON.parse(output.args[0]);
  assertEquals(logData.level, "error", "Log level should be error");
  assertEquals(logData.namespace, "api", "Namespace should be api");
  assertEquals(logData.message, "Error occurred", "Message should match");
  assertEquals(logData.code, "ERR_001", "Error code should be included");

  teardown();
});

Deno.test("logger - info logs when namespace is enabled", () => {
  setup();

  const originalDebug = Deno.env.get("DEBUG");
  Deno.env.set("DEBUG", "all");

  logger.info("database", { message: "Database connected", host: "localhost" });

  assertEquals(consoleOutput.length, 1, "Should have one console output");
  const logData = JSON.parse(consoleOutput[0].args[0]);
  assertEquals(logData.level, "info", "Log level should be info");
  assertEquals(logData.namespace, "database", "Namespace should be database");
  assertEquals(logData.host, "localhost", "Host should be included");

  if (originalDebug) {
    Deno.env.set("DEBUG", originalDebug);
  } else {
    Deno.env.delete("DEBUG");
  }

  teardown();
});

Deno.test("logger - warn always logs", () => {
  setup();

  logger.warn("cache", { message: "Cache miss", key: "user:123" });

  assertEquals(consoleOutput.length, 1, "Should have one console output");
  const logData = JSON.parse(consoleOutput[0].args[0]);
  assertEquals(logData.level, "warn", "Log level should be warn");
  assertEquals(logData.namespace, "cache", "Namespace should be cache");
  assertEquals(logData.key, "user:123", "Key should be included");

  teardown();
});

Deno.test("logger - handles bigint values", () => {
  setup();

  logger.error("src20", {
    message: "BigInt test",
    amount: BigInt("1000000000000000000"),
    regular: 123,
  });

  const logData = JSON.parse(consoleOutput[0].args[0]);
  assertEquals(
    logData.amount,
    "1000000000000000000",
    "BigInt should be converted to string",
  );
  assertEquals(
    logData.regular,
    123,
    "Regular numbers should remain as numbers",
  );

  teardown();
});

Deno.test("logger - multiple namespaces in DEBUG", () => {
  setup();

  const originalDebug = Deno.env.get("DEBUG");
  Deno.env.set("DEBUG", "stamps,api,cache");

  logger.debug("stamps", { message: "Stamps log" });
  logger.debug("api", { message: "API log" });
  logger.debug("database", { message: "Database log" });
  logger.debug("cache", { message: "Cache log" });

  assertEquals(consoleOutput.length, 3, "Should log stamps, api, and cache");

  const namespaces = consoleOutput.map((o) => JSON.parse(o.args[0]).namespace);
  assert(namespaces.includes("stamps"), "Should include stamps");
  assert(namespaces.includes("api"), "Should include api");
  assert(namespaces.includes("cache"), "Should include cache");
  assert(!namespaces.includes("database"), "Should not include database");

  if (originalDebug) {
    Deno.env.set("DEBUG", originalDebug);
  } else {
    Deno.env.delete("DEBUG");
  }

  teardown();
});

Deno.test("logger - client-side behavior simulation", () => {
  setup();

  // Temporarily remove Deno to simulate client environment
  // @ts-ignore - Intentionally modifying global
  delete globalThis.Deno;

  // Set up client debug
  (globalThis as any).__DEBUG = {
    namespaces: "ui,stamps",
    enabled: true,
  };

  // Mock console should capture direct objects (not JSON strings)
  consoleOutput = [];
  console.debug = (data: any) => consoleOutput.push({ level: "debug", data });
  console.error = (data: any) => consoleOutput.push({ level: "error", data });

  logger.debug("ui", { message: "UI debug" });
  logger.debug("api", { message: "API debug" });
  logger.error("ui", { message: "UI error" });

  assertEquals(consoleOutput.length, 2, "Should log ui debug and error");
  assertEquals(
    consoleOutput[0].data.namespace,
    "ui",
    "First should be ui debug",
  );
  assertEquals(
    consoleOutput[1].data.namespace,
    "ui",
    "Second should be ui error",
  );

  // Restore Deno
  globalThis.Deno = originalDeno;
  delete (globalThis as any).__DEBUG;

  teardown();
});
