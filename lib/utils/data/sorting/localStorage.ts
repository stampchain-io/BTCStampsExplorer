/**
 * @fileoverview localStorage Persistence - Robust storage for sort state with error handling
 * @description Provides enterprise-grade localStorage persistence with error handling, quota management,
 * data migration, and browser compatibility for Fresh/Preact applications
 */

import type { SortKey, SortMetrics } from "$lib/types/sorting.d.ts";

// ===== TYPES =====

/**
 * Storage data structure with versioning and metadata
 */
interface StorageData<T extends SortKey = SortKey> {
  version: number;
  timestamp: string;
  sortBy: T;
  direction: "asc" | "desc";
  metrics?: SortMetrics;
  metadata?: {
    userAgent?: string;
    url?: string;
    sessionId?: string;
  };
}

/**
 * Storage operation result
 */
interface StorageResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fallback?: boolean;
}

/**
 * Storage configuration
 */
interface StorageConfig {
  version: number;
  prefix: string;
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum data size in characters
  enableCompression?: boolean;
  enableFallback?: boolean; // Use sessionStorage as fallback
}

// ===== CONSTANTS =====

const DEFAULT_CONFIG: Required<StorageConfig> = {
  version: 1,
  prefix: "btc-stamps-sort",
  ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
  maxSize: 10 * 1024, // 10KB
  enableCompression: false, // Future feature
  enableFallback: true,
};

const STORAGE_KEYS = {
  SORT_STATE: "sort-state",
  METRICS: "metrics",
  CONFIG: "config",
  MIGRATION: "migration",
} as const;

// ===== BROWSER COMPATIBILITY =====

/**
 * Check if localStorage is available and functional
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = "__localStorage_test__";
    if (typeof localStorage === "undefined") return false;

    localStorage.setItem(test, "test");
    localStorage.removeItem(test);
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Check if sessionStorage is available and functional
 */
function isSessionStorageAvailable(): boolean {
  try {
    const test = "__sessionStorage_test__";
    if (typeof sessionStorage === "undefined") return false;

    sessionStorage.setItem(test, "test");
    sessionStorage.removeItem(test);
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Get available storage mechanism
 */
function getAvailableStorage(): "localStorage" | "sessionStorage" | null {
  if (isLocalStorageAvailable()) return "localStorage";
  if (isSessionStorageAvailable()) return "sessionStorage";
  return null;
}

// ===== ERROR HANDLING =====

/**
 * Storage error types
 */
type StorageErrorType =
  | "QUOTA_EXCEEDED"
  | "ACCESS_DENIED"
  | "PARSE_ERROR"
  | "VALIDATION_ERROR"
  | "NOT_AVAILABLE"
  | "TTL_EXPIRED"
  | "SIZE_EXCEEDED";

/**
 * Create storage error
 */
function createStorageError(
  type: StorageErrorType,
  message: string,
  originalError?: Error,
): Error {
  const error = new Error(`[StorageError:${type}] ${message}`);
  error.name = `StorageError`;
  (error as any).type = type;
  (error as any).originalError = originalError;
  return error;
}

/**
 * Handle quota exceeded error
 */
function handleQuotaExceeded(config: StorageConfig): void {
  console.warn("localStorage quota exceeded, attempting cleanup");

  try {
    // Clean up expired entries
    cleanupExpiredEntries(config);

    // Clean up old metrics data
    cleanupOldMetrics(config);
  } catch (error) {
    console.warn("Failed to cleanup localStorage:", error);
  }
}

// ===== DATA VALIDATION =====

/**
 * Validate storage data structure
 */
function validateStorageData<T extends SortKey>(
  data: any,
  validSortOptions: readonly T[],
): data is StorageData<T> {
  if (!data || typeof data !== "object") return false;

  // Check required fields
  if (typeof data.version !== "number") return false;
  if (typeof data.timestamp !== "string") return false;
  if (typeof data.sortBy !== "string") return false;
  if (
    typeof data.direction !== "string" ||
    !["asc", "desc"].includes(data.direction)
  ) return false;

  // Validate sort key
  if (!validSortOptions.includes(data.sortBy as T)) return false;

  return true;
}

/**
 * Check if data has expired
 */
function isDataExpired(timestamp: string, ttl: number): boolean {
  const dataTime = new Date(timestamp).getTime();
  const currentTime = Date.now();
  return (currentTime - dataTime) > ttl;
}

/**
 * Check data size
 */
function checkDataSize(data: string, maxSize: number): boolean {
  return data.length <= maxSize;
}

// ===== STORAGE OPERATIONS =====

/**
 * Generate storage key with prefix
 */
function getStorageKey(config: StorageConfig, key: string): string {
  return `${config.prefix}:${key}`;
}

/**
 * Get storage mechanism
 */
function getStorage(enableFallback: boolean): Storage | null {
  const storageType = getAvailableStorage();

  if (!storageType) return null;

  if (storageType === "localStorage") {
    return localStorage;
  } else if (enableFallback && storageType === "sessionStorage") {
    return sessionStorage;
  }

  return null;
}

/**
 * Safe JSON parse with error handling
 */
function safeJsonParse<T = any>(json: string): StorageResult<T> {
  try {
    const data = JSON.parse(json);
    return { success: true, data };
  } catch (_error) {
    return {
      success: false,
      error: "Failed to parse JSON data",
    };
  }
}

/**
 * Safe JSON stringify with error handling
 */
function safeJsonStringify<T>(data: T): StorageResult<string> {
  try {
    const json = JSON.stringify(data);
    return { success: true, data: json };
  } catch (_error) {
    return {
      success: false,
      error: "Failed to stringify data",
    };
  }
}

// ===== CLEANUP OPERATIONS =====

/**
 * Clean up expired entries
 */
function cleanupExpiredEntries(config: StorageConfig): void {
  const storage = getStorage(config.enableFallback ?? false);
  if (!storage) return;

  const keysToRemove: string[] = [];
  const prefix = `${config.prefix}:`;

  try {
    // Scan all keys with our prefix
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(prefix)) {
        try {
          const data = storage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (
              parsed.timestamp &&
              isDataExpired(parsed.timestamp, config.ttl ?? 0)
            ) {
              keysToRemove.push(key);
            }
          }
        } catch (_error) {
          // Remove malformed entries
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => storage.removeItem(key));
  } catch (error) {
    console.warn("Failed to cleanup expired entries:", error);
  }
}

/**
 * Clean up old metrics data
 */
function cleanupOldMetrics(config: StorageConfig): void {
  const storage = getStorage(config.enableFallback ?? false);
  if (!storage) return;

  const metricsKey = getStorageKey(config, STORAGE_KEYS.METRICS);
  storage.removeItem(metricsKey);
}

/**
 * Get storage usage information
 */
function getStorageUsage(config: StorageConfig): {
  used: number;
  keys: number;
  ourKeys: number;
} {
  const storage = getStorage(config.enableFallback ?? false);
  if (!storage) return { used: 0, keys: 0, ourKeys: 0 };

  let totalSize = 0;
  let ourKeys = 0;
  const prefix = `${config.prefix}:`;

  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key) {
      const data = storage.getItem(key);
      if (data) {
        totalSize += key.length + data.length;
        if (key.startsWith(prefix)) {
          ourKeys++;
        }
      }
    }
  }

  return {
    used: totalSize,
    keys: storage.length,
    ourKeys,
  };
}

// ===== MAIN STORAGE CLASS =====

/**
 * Enterprise-grade localStorage manager for sort state
 */
export class SortStorage<T extends SortKey = SortKey> {
  private config: Required<StorageConfig>;
  private validSortOptions: readonly T[];

  constructor(
    validSortOptions: readonly T[],
    config: Partial<StorageConfig> = {},
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.validSortOptions = validSortOptions;

    // Perform initial cleanup on instantiation
    try {
      const result = this.cleanup();
      if (!result.success) {
        console.warn("Initial storage cleanup failed:", result.error);
      }
    } catch (error) {
      console.warn("Initial storage cleanup failed:", error);
    }
  }

  /**
   * Save sort state to localStorage
   */
  async save(
    sortBy: T,
    direction: "asc" | "desc",
    metrics?: SortMetrics,
  ): Promise<StorageResult<void>> {
    try {
      const storage = getStorage(this.config.enableFallback);
      if (!storage) {
        throw createStorageError(
          "NOT_AVAILABLE",
          "No storage mechanism available",
        );
      }

      const storageData: StorageData<T> = {
        version: this.config.version,
        timestamp: new Date().toISOString(),
        sortBy,
        direction,
        ...(metrics && { metrics }),
      };

      // Add metadata if available
      if (typeof navigator !== "undefined" || typeof location !== "undefined") {
        const metadata: {
          userAgent?: string;
          url?: string;
          sessionId?: string;
        } = {
          sessionId: this.generateSessionId(),
        };

        if (typeof navigator !== "undefined" && navigator.userAgent) {
          metadata.userAgent = navigator.userAgent;
        }
        if (typeof location !== "undefined" && location.href) {
          metadata.url = location.href;
        }

        (storageData as any).metadata = metadata;
      }

      const stringifyResult = safeJsonStringify(storageData);
      if (!stringifyResult.success || !stringifyResult.data) {
        throw createStorageError(
          "PARSE_ERROR",
          stringifyResult.error || "Stringify failed",
        );
      }

      // Check data size
      if (!checkDataSize(stringifyResult.data, this.config.maxSize)) {
        throw createStorageError(
          "SIZE_EXCEEDED",
          `Data size exceeds limit: ${stringifyResult.data.length} > ${this.config.maxSize}`,
        );
      }

      const key = getStorageKey(this.config, STORAGE_KEYS.SORT_STATE);
      storage.setItem(key, stringifyResult.data);

      return { success: true };
    } catch (error) {
      if (
        error instanceof DOMException && error.name === "QuotaExceededError"
      ) {
        handleQuotaExceeded(this.config);

        // Retry once after cleanup
        try {
          return await this.save(sortBy, direction, metrics);
        } catch (_retryError) {
          return {
            success: false,
            error: "Storage quota exceeded and cleanup failed",
          };
        }
      }

      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Load sort state from localStorage
   */
  load(
    defaultSort: T,
  ): StorageResult<{ sortBy: T; direction: "asc" | "desc" }> {
    try {
      const storage = getStorage(this.config.enableFallback);
      if (!storage) {
        return {
          success: true,
          data: { sortBy: defaultSort, direction: "desc" },
          fallback: true,
        };
      }

      const key = getStorageKey(this.config, STORAGE_KEYS.SORT_STATE);
      const data = storage.getItem(key);

      if (!data) {
        return {
          success: true,
          data: { sortBy: defaultSort, direction: "desc" },
          fallback: true,
        };
      }

      const parseResult = safeJsonParse<StorageData<T>>(data);
      if (!parseResult.success || !parseResult.data) {
        // Clean up corrupted data
        storage.removeItem(key);
        return {
          success: true,
          data: { sortBy: defaultSort, direction: "desc" },
          fallback: true,
        };
      }

      const storageData = parseResult.data;

      // Validate data structure
      if (!validateStorageData(storageData, this.validSortOptions)) {
        storage.removeItem(key);
        return {
          success: true,
          data: { sortBy: defaultSort, direction: "desc" },
          fallback: true,
        };
      }

      // Check if data has expired
      if (isDataExpired(storageData.timestamp, this.config.ttl)) {
        storage.removeItem(key);
        return {
          success: true,
          data: { sortBy: defaultSort, direction: "desc" },
          fallback: true,
        };
      }

      return {
        success: true,
        data: {
          sortBy: storageData.sortBy,
          direction: storageData.direction,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      return {
        success: false,
        error: errorMessage,
        fallback: true,
      };
    }
  }

  /**
   * Clear stored sort state
   */
  clear(): StorageResult<void> {
    try {
      const storage = getStorage(this.config.enableFallback);
      if (!storage) {
        return { success: true }; // Nothing to clear
      }

      const key = getStorageKey(this.config, STORAGE_KEYS.SORT_STATE);
      storage.removeItem(key);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Perform storage cleanup
   */
  cleanup(): StorageResult<void> {
    try {
      cleanupExpiredEntries(this.config);
      cleanupOldMetrics(this.config);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get storage statistics
   */
  getStats(): {
    available: boolean;
    storageType: "localStorage" | "sessionStorage" | null;
    usage: { used: number; keys: number; ourKeys: number };
    config: Required<StorageConfig>;
  } {
    const storageType = getAvailableStorage();
    const usage = getStorageUsage(this.config);

    return {
      available: storageType !== null,
      storageType,
      usage,
      config: this.config,
    };
  }

  /**
   * Generate session ID for tracking
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a storage instance with wallet-specific configuration
 */
export function createWalletSortStorage() {
  const validOptions = [
    "DESC",
    "ASC",
    "value_desc",
    "value_asc",
    "quantity_desc",
    "quantity_asc",
    "stamp_desc",
    "stamp_asc",
    "recent_desc",
    "recent_asc",
  ] as const;

  return new SortStorage(validOptions, {
    prefix: "btc-stamps-wallet-sort",
    version: 1,
  });
}

/**
 * Create a storage instance with stamp-specific configuration
 */
export function createStampSortStorage() {
  const validOptions = [
    "DESC",
    "ASC",
    "block_index_desc",
    "block_index_asc",
    "stamp_number_desc",
    "stamp_number_asc",
    "supply_desc",
    "supply_asc",
  ] as const;

  return new SortStorage(validOptions, {
    prefix: "btc-stamps-stamp-sort",
    version: 1,
  });
}

/**
 * Global storage health check
 */
export function checkStorageHealth(): {
  localStorage: boolean;
  sessionStorage: boolean;
  recommended: "localStorage" | "sessionStorage" | "none";
  warnings: string[];
} {
  const warnings: string[] = [];
  const localStorageAvailable = isLocalStorageAvailable();
  const sessionStorageAvailable = isSessionStorageAvailable();

  if (!localStorageAvailable && !sessionStorageAvailable) {
    warnings.push(
      "No storage mechanisms available - sort preferences will not persist",
    );
  } else if (!localStorageAvailable) {
    warnings.push(
      "localStorage not available - using sessionStorage (preferences lost on tab close)",
    );
  }

  return {
    localStorage: localStorageAvailable,
    sessionStorage: sessionStorageAvailable,
    recommended: localStorageAvailable
      ? "localStorage"
      : sessionStorageAvailable
      ? "sessionStorage"
      : "none",
    warnings,
  };
}
