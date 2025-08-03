/**
 * UTXO Type Conversion Utilities
 *
 * Provides type-safe conversion functions between UTXO and BasicUTXO types
 * with proper handling for exactOptionalPropertyTypes: true compatibility.
 */

import type { BasicUTXO, UTXO } from "$types/base.d.ts";
import { handleUnknownError } from "$lib/utils/errorHandling.ts";

/**
 * Converts a UTXO to a BasicUTXO with proper type safety
 * @param utxo UTXO to convert
 * @returns BasicUTXO with validated fields
 * @throws {Error} If value is undefined or invalid
 */
export function convertToBasicUTXO(utxo: UTXO): BasicUTXO {
  if (utxo.value === undefined || utxo.value === null) {
    throw new Error(
      `UTXO ${utxo.txid}:${utxo.vout} has undefined or null value`,
    );
  }

  const basicUTXO: BasicUTXO = {
    txid: utxo.txid,
    vout: utxo.vout,
    value: utxo.value,
  };

  // Only include address if it's defined and not undefined
  if (utxo.address !== undefined && utxo.address !== null) {
    basicUTXO.address = utxo.address;
  }

  return basicUTXO;
}

/**
 * Converts an array of UTXOs to BasicUTXOs with optional error handling
 * @param utxos Array of UTXOs to convert
 * @param handleError Optional error handler for UTXOs with undefined values
 * @returns Array of BasicUTXOs
 */
export function convertUTXOsToBasic(
  utxos: UTXO[],
  handleError?: (utxo: UTXO) => void,
): BasicUTXO[] {
  const results: BasicUTXO[] = [];

  for (const utxo of utxos) {
    try {
      const basicUTXO = convertToBasicUTXO(utxo);
      results.push(basicUTXO);
    } catch (unknownError) {
      const error = handleUnknownError(unknownError, "UTXO conversion failed");
      if (handleError) {
        handleError(utxo);
      } else {
        console.warn(
          `Skipping UTXO with invalid value: ${utxo.txid}:${utxo.vout}`,
          error.message,
        );
      }
    }
  }

  return results;
}

/**
 * Type guard for BasicUTXO
 * @param utxo UTXO to check
 * @returns Boolean indicating if the UTXO can be converted to BasicUTXO
 */
export function isBasicUTXO(utxo: UTXO): utxo is UTXO & { value: number } {
  return utxo.value !== undefined &&
    utxo.value !== null &&
    typeof utxo.value === "number" &&
    !isNaN(utxo.value);
}

/**
 * Safely extract a required UTXO value with a default or error handling
 * @param utxo UTXO to extract value from
 * @param options Optional configuration for value extraction
 * @returns Extracted UTXO value
 */
export function safeUTXOValue(
  utxo: UTXO,
  options?: {
    defaultValue?: number;
    throwOnUndefined?: boolean;
  },
): number {
  if (utxo.value === undefined || utxo.value === null) {
    if (options?.throwOnUndefined !== false) {
      throw new Error(`UTXO ${utxo.txid}:${utxo.vout} has undefined value`);
    }

    if (options?.defaultValue !== undefined) {
      return options.defaultValue;
    }

    throw new Error(
      `UTXO ${utxo.txid}:${utxo.vout} has undefined value and no default provided`,
    );
  }

  return utxo.value;
}

/**
 * Convert a UTXO to a BasicUTXO (alias for convertToBasicUTXO)
 * Extracts only the basic required properties
 */
export function toBasicUTXO(utxo: UTXO): BasicUTXO {
  return convertToBasicUTXO(utxo);
}

/**
 * Safely convert a UTXO array to BasicUTXO array
 * Filters out any UTXOs with undefined/null value
 */
export function toBasicUTXOs(utxos: UTXO[]): BasicUTXO[] {
  return convertUTXOsToBasic(utxos);
}

/**
 * Creates a safe UTXO for estimation purposes with minimal required fields
 * @param value The value for the UTXO
 * @param txid Optional transaction ID (defaults to empty string)
 * @param vout Optional output index (defaults to 0)
 * @param script Optional script (can be undefined for estimation)
 * @returns A UTXO that can be used for fee estimation
 */
export function createEstimationUTXO(
  value: number,
  txid: string = "",
  vout: number = 0,
  script?: string,
): UTXO {
  const utxo: UTXO = {
    txid,
    vout,
    value,
  };

  // Only add script if it's defined
  if (script !== undefined) {
    utxo.script = script;
  }

  return utxo;
}

/**
 * Converts a BasicUTXO back to UTXO for compatibility
 * @param basicUTXO BasicUTXO to convert
 * @param script Optional script to add
 * @returns UTXO with optional fields properly typed
 */
export function basicUTXOToUTXO(basicUTXO: BasicUTXO, script?: string): UTXO {
  const utxo: UTXO = {
    txid: basicUTXO.txid,
    vout: basicUTXO.vout,
    value: basicUTXO.value,
  };

  // Only add script if it's defined
  if (script !== undefined) {
    utxo.script = script;
  }

  if (basicUTXO.address !== undefined) {
    utxo.address = basicUTXO.address;
  }

  return utxo;
}

/**
 * Filters UTXOs to only those that can be converted to BasicUTXO
 * @param utxos Array of UTXOs to filter
 * @returns Array of UTXOs that have valid values
 */
export function filterValidUTXOs(utxos: UTXO[]): UTXO[] {
  return utxos.filter(isBasicUTXO);
}
