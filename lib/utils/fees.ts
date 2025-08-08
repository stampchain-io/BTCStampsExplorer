// Isomorphic fee utilities for client and server usage
// Source migrated from $server/services/counterpartyApiService.ts

import { SATS_PER_KB_MULTIPLIER } from "$constants";

export interface NormalizedFeeRate {
  normalizedSatsPerVB: number;
  normalizedSatsPerKB: number;
}

/**
 * Normalize fee rate inputs to both sats/vB and sats/kB forms.
 *
 * - If satsPerVB provided, use it directly
 * - If satsPerKB provided, convert to satsPerVB using SATS_PER_KB_MULTIPLIER
 * - Throws on non-positive results
 */
export function normalizeFeeRate(params: {
  satsPerKB?: number;
  satsPerVB?: number;
}): NormalizedFeeRate {
  let normalizedSatsPerVB: number;

  if (params.satsPerVB !== undefined) {
    normalizedSatsPerVB = params.satsPerVB;
  } else if (params.satsPerKB !== undefined) {
    normalizedSatsPerVB =
      params.satsPerKB < SATS_PER_KB_MULTIPLIER
        ? params.satsPerKB
        : params.satsPerKB / SATS_PER_KB_MULTIPLIER;
  } else {
    throw new Error("Either satsPerKB or satsPerVB must be provided");
  }

  if (normalizedSatsPerVB <= 0) {
    throw new Error("Fee rate must be greater than 0");
  }

  return {
    normalizedSatsPerVB,
    normalizedSatsPerKB: normalizedSatsPerVB * SATS_PER_KB_MULTIPLIER,
  };
}


