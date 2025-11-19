/**
 * Array Safety Utilities for JSX Rendering
 * Provides safe patterns for array operations and conditional rendering
 */

import { isNonEmptyArray } from "$lib/utils/typeGuards.ts";

/**
 * Safely render array items with conditional JSX guards
 * @template T
 * @param array The array to render
 * @param renderItem Function to render each item
 * @param fallback Optional fallback component when array is empty
 * @returns JSX elements or fallback
 */
export function safeArrayRender<T>(
  array: T[] | undefined | null,
  renderItem: (item: T, index: number) => any,
  fallback?: any,
): any {
  if (!isNonEmptyArray(array)) {
    return fallback || null;
  }

  return array.map((item, index) => renderItem(item, index));
}

/**
 * Safe array access with at() method fallback for older environments
 * @template T
 * @param array The array to access
 * @param index The index to retrieve (supports negative indexing)
 * @returns The item at index or undefined
 */
export function safeArrayAt<T>(
  array: T[] | undefined | null,
  index: number,
): T | undefined {
  if (!array || array.length === 0) return undefined;

  // Use native at() method if available (supports negative indexing)
  if (typeof array.at === "function") {
    return array.at(index);
  }

  // Fallback for negative indexing
  if (index < 0) {
    const positiveIndex = array.length + index;
    return positiveIndex >= 0 ? array[positiveIndex] : undefined;
  }

  return index < array.length ? array[index] : undefined;
}

/**
 * Create safe conditional JSX renderer with data guards
 * @param condition The condition to check
 * @param render Function that returns JSX when condition is true
 * @param fallback Optional fallback JSX when condition is false
 * @returns JSX element or null
 */
export function conditionalRender(
  condition: boolean | unknown,
  render: () => any,
  fallback?: any,
): any {
  return condition ? render() : (fallback || null);
}

/**
 * Safe pagination slice with bounds checking
 * @template T
 * @param array The array to slice
 * @param page Current page (1-indexed)
 * @param pageSize Number of items per page
 * @returns Safely sliced array
 */
export function safePaginationSlice<T>(
  array: T[] | undefined | null,
  page: number,
  pageSize: number,
): T[] {
  if (!isNonEmptyArray(array)) return [];

  const startIndex = Math.max(0, (page - 1) * pageSize);
  const endIndex = Math.min(array.length, startIndex + pageSize);

  return array.slice(startIndex, endIndex);
}

/**
 * Safe array join with separator and null handling
 * @param array Array of items to join
 * @param separator String to join with
 * @param mapper Optional function to transform items before joining
 * @returns Joined string or empty string
 */
export function safeArrayJoin<T>(
  array: T[] | undefined | null,
  separator: string = ", ",
  mapper?: (item: T) => string,
): string {
  if (!isNonEmptyArray(array)) return "";

  if (mapper) {
    return array.map(mapper).filter((item) =>
      item !== null && item !== undefined && item !== ""
    ).join(separator);
  } else {
    return array.filter((item) =>
      item !== null && item !== undefined && item !== ""
    ).map(String).join(separator);
  }
}

/**
 * Safe array filtering with type narrowing
 * @template T
 * @param array The array to filter
 * @param predicate Filter function
 * @returns Safely filtered array
 */
export function safeArrayFilter<T>(
  array: T[] | undefined | null,
  predicate: (item: T, index: number) => boolean,
): T[] {
  if (!isNonEmptyArray(array)) return [];

  try {
    return array.filter(predicate);
  } catch (error) {
    console.warn("Error in safeArrayFilter:", error);
    return [];
  }
}

/**
 * Safe array find with optional fallback
 * @template T
 * @param array The array to search
 * @param predicate Find function
 * @param fallback Optional fallback value
 * @returns Found item or fallback
 */
export function safeArrayFind<T>(
  array: T[] | undefined | null,
  predicate: (item: T, index: number) => boolean,
  fallback?: T,
): T | undefined {
  if (!isNonEmptyArray(array)) return fallback;

  try {
    return array.find(predicate) ?? fallback;
  } catch (error) {
    console.warn("Error in safeArrayFind:", error);
    return fallback;
  }
}

/**
 * Safe event handler wrapper for array operations
 * @param handler The event handler function
 * @returns Wrapped handler with error boundaries
 */
export function safeEventHandler<T extends Event>(
  handler: (event: T) => void,
): (event: T) => void {
  return (event: T) => {
    try {
      // Check if event and event.currentTarget exist
      if (!event?.currentTarget) {
        console.warn("Event or currentTarget is null/undefined");
        return;
      }

      handler(event);
    } catch (error) {
      console.error("Error in event handler:", error);
    }
  };
}

/**
 * Create safe array state updater for React/Preact
 * @template T
 * @param setter State setter function
 * @returns Safe array updater function
 */
export function createSafeArrayUpdater<T>(
  setter: (value: T[] | ((prev: T[]) => T[])) => void,
): (updater: ((prev: T[]) => T[]) | T[]) => void {
  return (updater) => {
    try {
      if (typeof updater === "function") {
        setter(updater);
      } else if (Array.isArray(updater)) {
        setter(updater);
      } else {
        console.warn("Invalid updater type, expected function or array");
      }
    } catch (error) {
      console.error("Error in array updater:", error);
      setter([]);
    }
  };
}

/**
 * Type guard for checking if value is safe for array operations
 * @param value Value to check
 * @returns True if value is a safe array
 */
export function isSafeArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length >= 0;
}

/**
 * Safe array chunk for pagination or grid layouts
 * @template T
 * @param array Array to chunk
 * @param chunkSize Size of each chunk
 * @returns Array of chunks
 */
export function safeArrayChunk<T>(
  array: T[] | undefined | null,
  chunkSize: number,
): T[][] {
  if (!isNonEmptyArray(array) || chunkSize <= 0) return [];

  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
