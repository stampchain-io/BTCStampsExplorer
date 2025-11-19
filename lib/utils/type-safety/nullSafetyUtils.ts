/**
 * Null Safety Utility Functions
 *
 * Provides type-safe methods for handling potentially undefined values
 * and performing safe operations on arrays and objects.
 */

/**
 * Type guard to check if a value is defined and not null
 * @param value Any value to check
 * @returns Boolean indicating if value is defined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safe first element getter for arrays with null safety
 * @param arr Potentially undefined array
 * @returns First element or null
 */
export function safeFirst<T>(arr: T[] | null | undefined): T | null {
  return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
}

/**
 * Safe array length getter with null safety
 * @param arr Potentially undefined array
 * @returns Array length or 0
 */
export function safeLength<T>(arr: T[] | null | undefined): number {
  return Array.isArray(arr) ? arr.length : 0;
}

/**
 * Get value from possibly undefined object with optional default
 * @param obj Potentially undefined object
 * @param key Key to access
 * @param defaultValue Optional default value if key doesn't exist
 * @returns Value or default
 */
export function safeGet<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue?: T[K],
): T[K] | undefined {
  return obj && typeof obj === "object" && key in obj ? obj[key] : defaultValue;
}

/**
 * Safely map an array, filtering out null/undefined values
 * @param arr Input array
 * @param mapper Mapping function
 * @returns Mapped array with non-null values
 */
export function safeMap<T, R>(
  arr: T[] | null | undefined,
  mapper: (item: T) => R | null | undefined,
): R[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(mapper).filter(isDefined);
}

/**
 * Ensure a value is not null or undefined, throw otherwise
 * @param value Value to check
 * @param errorMessage Optional custom error message
 * @returns Non-null value
 */
export function ensureExists<T>(
  value: T | null | undefined,
  errorMessage = "Value is null or undefined",
): T {
  if (value === null || value === undefined) {
    throw new Error(errorMessage);
  }
  return value;
}

/**
 * Null-safe object deep clone
 * @param obj Object to clone
 * @returns Deep cloned object or null
 */
export function safeClone<T>(obj: T | null | undefined): T | null {
  if (obj === null || obj === undefined) return null;
  return JSON.parse(JSON.stringify(obj));
}
