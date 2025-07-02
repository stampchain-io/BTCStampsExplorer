/**
 * Validates if a value is a valid stamp number (positive or negative integer)
 * Stamp numbers can be negative (cursed stamps) or positive
 */
export function isStampNumber(value: unknown): boolean {
  if (typeof value === "number") return Number.isInteger(value);
  if (typeof value !== "string") return false;
  const num = Number(value);
  return !isNaN(num) && Number.isInteger(num);
}

/**
 * Validates if a string is a Bitcoin transaction hash
 */
export function isTxHash(value: unknown): boolean {
  return typeof value === "string" &&
    value.length === 64 &&
    /^[a-fA-F0-9]+$/.test(value);
}

/**
 * Validates if a string is a stamp hash
 */
export function isStampHash(value: unknown): boolean {
  return typeof value === "string" &&
    /^[a-zA-Z0-9]{12,20}$/.test(value) &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value);
}

/**
 * Validates if a string is a valid CPID (either numeric or alphabetic format)
 */
export function isCpid(value: unknown): boolean {
  if (typeof value !== "string") return false;

  // Handle A-prefixed numeric CPIDs
  if (value.startsWith("A")) {
    try {
      const numericPart = BigInt(value.slice(1));
      const min = BigInt(26n ** 12n + 1n);
      const max = BigInt(2n ** 64n - 1n);
      const isValid = numericPart >= min && numericPart <= max;
      return isValid;
    } catch {
      return false;
    }
  }

  // Handle alphabetic CPIDs
  return /^[B-Z][A-Z]{0,12}$/.test(value);
}

/**
 * Determines the type of identifier
 */
export function getIdentifierType(
  value: unknown,
): "stamp_number" | "tx_hash" | "stamp_hash" | "cpid" | "invalid" {
  if (isStampNumber(value)) return "stamp_number";
  if (isTxHash(value)) return "tx_hash";
  if (isStampHash(value)) return "stamp_hash";
  if (isCpid(value)) return "cpid";
  return "invalid";
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
