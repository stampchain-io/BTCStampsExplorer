export function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Safe numeric conversion utility
 * @param value - Value to convert to number
 * @param fallback - Default value if conversion fails (default: 0)
 * @returns Safely converted number
 */
export function safeNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;

  const num = Number(value);

  // Check for valid number after conversion
  return isNaN(num) ? fallback : num;
}

/**
 * Convert numeric input to integer
 * @param value - Input to convert
 * @param fallback - Default value if conversion fails (default: 0)
 * @returns Safely converted integer
 */
export function safeInteger(value: unknown, fallback = 0): number {
  const numValue = safeNumber(value, fallback);
  return Math.floor(numValue);
}

/**
 * Convert numeric input to absolute value
 * @param value - Input to convert
 * @param fallback - Default value if conversion fails (default: 0)
 * @returns Safely converted absolute number
 */
export function safeAbsoluteNumber(value: unknown, fallback = 0): number {
  const numValue = safeNumber(value, fallback);
  return Math.abs(numValue);
}
