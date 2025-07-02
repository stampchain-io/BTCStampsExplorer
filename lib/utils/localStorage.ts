import { FeeData } from "$lib/utils/feeSignal.ts";

// localStorage keys
const FEE_DATA_KEY = "btc_stamps_fee_data";
const FEE_DATA_VERSION = "1.0";

// Export the storage key for tests
export const FEE_STORAGE_KEY = FEE_DATA_KEY;

// Fee data storage interface
interface StoredFeeData {
  data: FeeData;
  version: string;
  savedAt: number;
}

/**
 * Save fee data to localStorage with versioning and timestamp
 */
export function saveFeeData(data: FeeData): boolean {
  try {
    if (typeof globalThis.localStorage === "undefined") {
      console.warn("[localStorage] localStorage not available");
      return false;
    }

    const storedData: StoredFeeData = {
      data: data,
      version: FEE_DATA_VERSION,
      savedAt: Date.now(),
    };

    globalThis.localStorage.setItem(FEE_DATA_KEY, JSON.stringify(storedData));
    console.log("[localStorage] Fee data saved successfully");
    return true;
  } catch (error) {
    console.error("[localStorage] Failed to save fee data:", error);
    return false;
  }
}

/**
 * Load fee data from localStorage with validation
 */
export function loadFeeData(): FeeData | null {
  try {
    if (typeof globalThis.localStorage === "undefined") {
      console.warn("[localStorage] localStorage not available");
      return null;
    }

    const stored = globalThis.localStorage.getItem(FEE_DATA_KEY);
    if (!stored) {
      return null;
    }

    const parsedData: StoredFeeData = JSON.parse(stored);

    // Validate version
    if (parsedData.version !== FEE_DATA_VERSION) {
      console.warn("[localStorage] Fee data version mismatch, clearing cache");
      clearFeeData();
      return null;
    }

    // Check if data is too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const age = Date.now() - parsedData.savedAt;
    if (age > maxAge) {
      console.warn("[localStorage] Fee data too old, clearing cache");
      clearFeeData();
      return null;
    }

    // Validate required fields
    if (
      !parsedData.data ||
      typeof parsedData.data.recommendedFee !== "number" ||
      parsedData.data.recommendedFee <= 0
    ) {
      console.warn("[localStorage] Invalid fee data structure, clearing cache");
      clearFeeData();
      return null;
    }

    console.log("[localStorage] Fee data loaded successfully");

    // Return the original data structure, preserving the original source
    return parsedData.data;
  } catch (error) {
    console.error("[localStorage] Failed to load fee data:", error);
    clearFeeData();
    return null;
  }
}

/**
 * Clear fee data from localStorage
 */
export function clearFeeData(): void {
  try {
    if (typeof globalThis.localStorage === "undefined") {
      return;
    }

    globalThis.localStorage.removeItem(FEE_DATA_KEY);
    console.log("[localStorage] Fee data cleared");
  } catch (error) {
    console.error("[localStorage] Failed to clear fee data:", error);
  }
}

/**
 * Check if fee data exists in localStorage
 */
export function hasFeeData(): boolean {
  try {
    if (typeof globalThis.localStorage === "undefined") {
      return false;
    }

    return globalThis.localStorage.getItem(FEE_DATA_KEY) !== null;
  } catch (error) {
    console.error("[localStorage] Failed to check fee data:", error);
    return false;
  }
}

/**
 * Get fee data age in milliseconds
 */
export function getFeeDataAge(): number | null {
  try {
    if (typeof globalThis.localStorage === "undefined") {
      return null;
    }

    const stored = globalThis.localStorage.getItem(FEE_DATA_KEY);
    if (!stored) {
      return null;
    }

    const parsedData: StoredFeeData = JSON.parse(stored);
    if (!parsedData.savedAt) {
      return null;
    }

    return Date.now() - parsedData.savedAt;
  } catch (error) {
    console.error("[localStorage] Failed to get fee data age:", error);
    return null;
  }
}

/**
 * Check if valid fee data exists in localStorage
 */
export function hasValidFeeData(): boolean {
  try {
    const data = loadFeeData();
    return data !== null;
  } catch (error) {
    console.error("[localStorage] Failed to check valid fee data:", error);
    return false;
  }
}

/**
 * Clean up expired storage items (for testing)
 */
export function cleanupExpiredStorage(keys: string[], maxAge: number): number {
  let cleanedCount = 0;

  try {
    if (typeof globalThis.localStorage === "undefined") {
      return 0;
    }

    for (const key of keys) {
      const item = globalThis.localStorage.getItem(key);
      if (!item) continue;

      try {
        const parsed = JSON.parse(item);
        if (parsed.savedAt && (Date.now() - parsed.savedAt) > maxAge) {
          globalThis.localStorage.removeItem(key);
          cleanedCount++;
        }
      } catch (_parseError) {
        // Invalid JSON, remove it
        globalThis.localStorage.removeItem(key);
        cleanedCount++;
      }
    }
  } catch (error) {
    console.error("[localStorage] Failed to cleanup expired storage:", error);
  }

  return cleanedCount;
}
