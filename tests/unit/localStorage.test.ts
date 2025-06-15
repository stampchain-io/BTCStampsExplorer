import { assertEquals } from "@std/assert";
import {
  cleanupExpiredStorage,
  clearFeeData,
  FEE_STORAGE_KEY,
  getFeeDataAge,
  hasFeeData,
  hasValidFeeData,
  loadFeeData,
  saveFeeData,
} from "$lib/utils/localStorage.ts";
import { FeeData } from "$lib/utils/feeSignal.ts";

// Mock localStorage
const mockStorage = new Map<string, string>();
const originalLocalStorage = globalThis.localStorage;

function setupLocalStorageMock() {
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => mockStorage.get(key) || null,
      setItem: (key: string, value: string) => mockStorage.set(key, value),
      removeItem: (key: string) => mockStorage.delete(key),
      clear: () => mockStorage.clear(),
    },
    writable: true,
    configurable: true,
  });
}

function teardownLocalStorageMock() {
  mockStorage.clear();
  if (originalLocalStorage) {
    Object.defineProperty(globalThis, "localStorage", {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  }
}

// Mock console to suppress output
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};

function suppressConsole() {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

function restoreConsole() {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
}

Deno.test("saveFeeData - saves valid fee data", () => {
  setupLocalStorageMock();
  suppressConsole();

  const feeData: FeeData = {
    recommendedFee: 50,
    btcPrice: 50000,
    source: "mempool",
    timestamp: Date.now(),
  };

  const result = saveFeeData(feeData);
  assertEquals(result, true);

  const stored = mockStorage.get(FEE_STORAGE_KEY);
  assertEquals(stored !== undefined, true);

  const parsed = JSON.parse(stored!);
  assertEquals(parsed.data.recommendedFee, 50);
  assertEquals(parsed.data.source, "mempool");
  assertEquals(parsed.version, "1.0");

  restoreConsole();
  teardownLocalStorageMock();
});

Deno.test("saveFeeData - handles localStorage not available", () => {
  // Remove localStorage temporarily
  const temp = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    value: undefined,
    writable: true,
    configurable: true,
  });
  suppressConsole();

  const feeData: FeeData = {
    recommendedFee: 50,
    btcPrice: 50000,
    source: "mempool",
    timestamp: Date.now(),
  };

  const result = saveFeeData(feeData);
  assertEquals(result, false);

  restoreConsole();
  Object.defineProperty(globalThis, "localStorage", {
    value: temp,
    writable: true,
    configurable: true,
  });
});

Deno.test("loadFeeData - loads valid fee data", () => {
  setupLocalStorageMock();
  suppressConsole();

  const feeData: FeeData = {
    recommendedFee: 75,
    btcPrice: 50000,
    source: "quicknode",
    timestamp: Date.now(),
  };

  const storedData = {
    data: feeData,
    version: "1.0",
    savedAt: Date.now(),
  };

  mockStorage.set(FEE_STORAGE_KEY, JSON.stringify(storedData));

  const loaded = loadFeeData();
  assertEquals(loaded?.recommendedFee, 75);
  assertEquals(loaded?.source, "quicknode");

  restoreConsole();
  teardownLocalStorageMock();
});

Deno.test("loadFeeData - returns null for expired data", () => {
  setupLocalStorageMock();
  suppressConsole();

  const feeData: FeeData = {
    recommendedFee: 75,
    btcPrice: 50000,
    source: "mempool",
    timestamp: Date.now(),
  };

  const storedData = {
    data: feeData,
    version: "1.0",
    savedAt: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
  };

  mockStorage.set(FEE_STORAGE_KEY, JSON.stringify(storedData));

  const loaded = loadFeeData();
  assertEquals(loaded, null);
  assertEquals(mockStorage.has(FEE_STORAGE_KEY), false); // Should be cleared

  restoreConsole();
  teardownLocalStorageMock();
});

Deno.test("loadFeeData - returns null for wrong version", () => {
  setupLocalStorageMock();
  suppressConsole();

  const storedData = {
    data: {
      recommendedFee: 75,
      btcPrice: 50000,
      source: "mempool",
      timestamp: Date.now(),
    },
    version: "0.9", // Wrong version
    savedAt: Date.now(),
  };

  mockStorage.set(FEE_STORAGE_KEY, JSON.stringify(storedData));

  const loaded = loadFeeData();
  assertEquals(loaded, null);
  assertEquals(mockStorage.has(FEE_STORAGE_KEY), false); // Should be cleared

  restoreConsole();
  teardownLocalStorageMock();
});

Deno.test("clearFeeData - removes fee data", () => {
  setupLocalStorageMock();
  suppressConsole();

  mockStorage.set(FEE_STORAGE_KEY, "test-data");
  assertEquals(mockStorage.has(FEE_STORAGE_KEY), true);

  clearFeeData();
  assertEquals(mockStorage.has(FEE_STORAGE_KEY), false);

  restoreConsole();
  teardownLocalStorageMock();
});

Deno.test("hasFeeData - checks if fee data exists", () => {
  setupLocalStorageMock();
  suppressConsole();

  assertEquals(hasFeeData(), false);

  mockStorage.set(FEE_STORAGE_KEY, "test-data");
  assertEquals(hasFeeData(), true);

  mockStorage.delete(FEE_STORAGE_KEY);
  assertEquals(hasFeeData(), false);

  restoreConsole();
  teardownLocalStorageMock();
});

Deno.test("getFeeDataAge - returns age of stored data", () => {
  setupLocalStorageMock();
  suppressConsole();

  const savedAt = Date.now() - 5000; // 5 seconds ago
  const storedData = {
    data: {
      recommendedFee: 75,
      btcPrice: 50000,
      source: "mempool",
      timestamp: Date.now(),
    },
    version: "1.0",
    savedAt: savedAt,
  };

  mockStorage.set(FEE_STORAGE_KEY, JSON.stringify(storedData));

  const age = getFeeDataAge();
  assertEquals(age !== null, true);
  assertEquals(age! >= 5000, true);
  assertEquals(age! < 6000, true); // Should be close to 5 seconds

  restoreConsole();
  teardownLocalStorageMock();
});

Deno.test("hasValidFeeData - checks for valid fee data", () => {
  setupLocalStorageMock();
  suppressConsole();

  assertEquals(hasValidFeeData(), false);

  const feeData: FeeData = {
    recommendedFee: 50,
    btcPrice: 50000,
    source: "mempool",
    timestamp: Date.now(),
  };

  saveFeeData(feeData);
  assertEquals(hasValidFeeData(), true);

  // Clear and check again
  clearFeeData();
  assertEquals(hasValidFeeData(), false);

  restoreConsole();
  teardownLocalStorageMock();
});

Deno.test("cleanupExpiredStorage - removes expired items", () => {
  setupLocalStorageMock();
  suppressConsole();

  // Add some test items
  const oldItem = {
    savedAt: Date.now() - 1000000, // Old
  };
  const newItem = {
    savedAt: Date.now(), // New
  };

  mockStorage.set("test-old", JSON.stringify(oldItem));
  mockStorage.set("test-new", JSON.stringify(newItem));
  mockStorage.set("test-invalid", "not-json");

  const cleaned = cleanupExpiredStorage(
    ["test-old", "test-new", "test-invalid", "test-missing"],
    500000, // Max age: 500 seconds
  );

  assertEquals(cleaned, 2); // Old item and invalid JSON
  assertEquals(mockStorage.has("test-old"), false);
  assertEquals(mockStorage.has("test-new"), true);
  assertEquals(mockStorage.has("test-invalid"), false);

  restoreConsole();
  teardownLocalStorageMock();
});
