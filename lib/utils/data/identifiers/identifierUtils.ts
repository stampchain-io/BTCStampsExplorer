import {
  isCpid as isCpidTypeGuard,
  isStampHash as isStampHashTypeGuard,
  isStampNumber as isStampNumberTypeGuard,
  isTxHash as isTxHashTypeGuard,
} from "$lib/utils/typeGuards.ts";

/**
 * Validates if a value is a valid stamp number (positive or negative integer)
 * Stamp numbers can be negative (cursed stamps) or positive
 * @deprecated Use isStampNumber from lib/utils/typeGuards.ts instead
 */
export function isStampNumber(value: unknown): boolean {
  console.warn(
    "DEPRECATION WARNING: isStampNumber from identifierUtils is deprecated. " +
      "Please import from lib/utils/typeGuards.ts instead.",
  );
  return isStampNumberTypeGuard(value);
}

/**
 * Validates if a string is a Bitcoin transaction hash
 * @deprecated Use isTxHash from lib/utils/typeGuards.ts instead
 */
export function isTxHash(value: unknown): boolean {
  console.warn(
    "DEPRECATION WARNING: isTxHash from identifierUtils is deprecated. " +
      "Please import from lib/utils/typeGuards.ts instead.",
  );
  return typeof value === "string" && isTxHashTypeGuard(value);
}

/**
 * Validates if a string is a stamp hash
 * @deprecated Use isStampHash from lib/utils/typeGuards.ts instead
 */
export function isStampHash(value: unknown): boolean {
  console.warn(
    "DEPRECATION WARNING: isStampHash from identifierUtils is deprecated. " +
      "Please import from lib/utils/typeGuards.ts instead.",
  );
  return isStampHashTypeGuard(value);
}

/**
 * Validates if a string is a valid CPID (either numeric or alphabetic format)
 * @deprecated Use isCpid from lib/utils/typeGuards.ts instead
 */
export function isCpid(value: unknown): boolean {
  console.warn(
    "DEPRECATION WARNING: isCpid from identifierUtils is deprecated. " +
      "Please import from lib/utils/typeGuards.ts instead.",
  );
  return isCpidTypeGuard(value);
}

/**
 * Determines the type of identifier
 */
export function getIdentifierType(
  value: unknown,
): "stamp_number" | "tx_hash" | "stamp_hash" | "cpid" | "invalid" {
  if (isStampNumberTypeGuard(value)) return "stamp_number";
  if (typeof value === "string" && isTxHashTypeGuard(value)) return "tx_hash";
  if (isStampHashTypeGuard(value)) return "stamp_hash";
  if (isCpidTypeGuard(value)) return "cpid";
  return "invalid";
}

/**
 * Validates if a string is a valid SRC20 tick format
 * SRC20 ticks can be 1-5 characters, alphanumeric, symbols, and Unicode/emoji characters
 */
/**
 * @deprecated Use isValidSrc20Tick from lib/utils/typeGuards.ts instead
 */
export function isValidSrc20Tick(value: unknown): boolean {
  console.warn(
    "DEPRECATION WARNING: isValidSrc20Tick from identifierUtils is deprecated. " +
      "Please import from lib/utils/typeGuards.ts instead.",
  );

  if (typeof value !== "string") return false;

  // Check length in terms of Unicode code points (not UTF-16 code units)
  const length = [...value].length;
  if (length < 1 || length > 5) {
    return false;
  }

  // Allow alphanumeric, common symbols, and any Unicode characters (including emojis)
  // This regex allows any Unicode character except control characters
  return /^[\p{L}\p{N}\p{S}\p{P}\p{Sm}\p{Sc}\p{Sk}\p{So}!@#$%^&*()_+\-=\[\]{}|;':",./<>?]+$/u
    .test(value);
}

export async function calculateTransactionSize(
  txHash: string,
): Promise<number> {
  const API_URL = `https://blockstream.info/api/tx/${txHash}`;

  try {
    // Fetch transaction details from Blockstream API
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch transaction details: ${response.statusText}`,
      );
    }

    const txData = await response.json();

    // Extract inputs and outputs
    const inputs = txData.vin.length; // Number of inputs
    const outputs = txData.vout.length; // Number of outputs

    // Calculate the base transaction size
    const inputSize = inputs * 148; // Each input is approx. 148 bytes
    const outputSize = outputs * 34; // Each output is approx. 34 bytes
    const overhead = 10; // Transaction overhead (version, locktime, etc.)

    // Total size
    const totalSize = inputSize + outputSize + overhead;

    return totalSize;
  } catch (error) {
    console.error("Error calculating transaction size:", error);
    throw error;
  }
}
