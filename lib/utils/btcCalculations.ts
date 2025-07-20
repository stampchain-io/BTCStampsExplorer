/**
 * BTC Value Calculation Utilities
 *
 * Provides simple calculation functions for stamp BTC values using existing
 * formatting utilities and stamp data structures.
 */

import type { WalletStampWithValue } from "$lib/types/wallet.d.ts";
import { formatBTC } from "$lib/utils/formatUtils.ts";

/**
 * Calculate BTC value for a single stamp
 * @param quantity - Number of stamps owned
 * @param unitPrice - Price per stamp in BTC
 * @returns BTC value or null if invalid inputs
 */
export function calculateStampBTCValue(
  quantity: number,
  unitPrice: number | "priceless" | null | undefined,
): number | null {
  if (!quantity || quantity <= 0 || !unitPrice || unitPrice === "priceless") {
    return null;
  }

  // Type guard: at this point, unitPrice is guaranteed to be a number
  if (typeof unitPrice !== "number" || unitPrice <= 0) {
    return null;
  }

  return quantity * unitPrice;
}

/**
 * Calculate total BTC value for multiple stamps using v2.3 market data or legacy fallback
 * @param stamps - Array of wallet stamps with value data and optional marketData
 * @returns Total BTC value
 */
export function calculateTotalBTCValue(stamps: WalletStampWithValue[]): number {
  if (!stamps || stamps.length === 0) {
    return 0;
  }

  return stamps.reduce((total, stamp) => {
    const quantity = stamp.balance || 0;

    // v2.3 API: Use pre-calculated walletValueBTC if available (most efficient)
    if (
      stamp.marketData?.walletValueBTC && stamp.marketData.walletValueBTC > 0
    ) {
      return total + stamp.marketData.walletValueBTC;
    }

    // Otherwise use getBestStampPrice for individual calculation
    const unitPrice = getBestStampPrice(stamp) || 0;
    const stampValue = calculateStampBTCValue(quantity, unitPrice);
    return total + (stampValue || 0);
  }, 0);
}

/**
 * Get the best available price for a stamp using v2.3 market data or legacy fallback
 * @param stamp - Wallet stamp data with optional marketData
 * @returns Best available price in BTC or null
 */
export function getBestStampPrice(stamp: WalletStampWithValue): number | null {
  // v2.3 API: Use pre-calculated lastPriceBTC from marketData (preferred)
  if (stamp.marketData?.lastPriceBTC && stamp.marketData.lastPriceBTC > 0) {
    return stamp.marketData.lastPriceBTC;
  }

  // Legacy fallback for older data structures or v2.2 compatibility
  // Priority: unitPrice > recentSalePrice > floorPrice
  // @deprecated - Remove once all data migrated to v2.3 marketData structure

  if (stamp.unitPrice && stamp.unitPrice > 0) {
    return stamp.unitPrice;
  }

  if (
    stamp.recentSalePrice &&
    stamp.recentSalePrice !== "priceless" &&
    typeof stamp.recentSalePrice === "number" &&
    stamp.recentSalePrice > 0
  ) {
    return stamp.recentSalePrice;
  }

  if (
    stamp.floorPrice &&
    stamp.floorPrice !== "priceless" &&
    typeof stamp.floorPrice === "number" &&
    stamp.floorPrice > 0
  ) {
    return stamp.floorPrice;
  }

  return null;
}

/**
 * Format BTC value for display with appropriate precision
 * @param btcValue - BTC value to format
 * @param options - Formatting options
 * @returns Formatted BTC string
 */
export function formatBTCValue(
  btcValue: number | null,
  options: {
    includeSymbol?: boolean;
    fallback?: string;
  } = {},
): string {
  const { includeSymbol = true, fallback = "0" } = options;

  if (btcValue === null || btcValue === undefined) {
    return fallback;
  }

  return formatBTC(btcValue, { includeSymbol });
}

/**
 * Calculate and format total portfolio value
 * @param stamps - Array of wallet stamps
 * @returns Formatted total BTC value
 */
export function calculateFormattedTotalValue(
  stamps: WalletStampWithValue[],
): string {
  const totalBTC = calculateTotalBTCValue(stamps);
  return formatBTCValue(totalBTC);
}

/**
 * Get value summary for a collection of stamps
 * @param stamps - Array of wallet stamps
 * @returns Value summary with totals and counts
 */
export function getValueSummary(stamps: WalletStampWithValue[]) {
  const totalBTC = calculateTotalBTCValue(stamps);
  const stampsWithValue = stamps.filter((stamp) => {
    const price = getBestStampPrice(stamp);
    return price && price > 0;
  });

  const totalStamps = stamps.reduce(
    (sum, stamp) => sum + (stamp.balance || 0),
    0,
  );
  const valuedStamps = stampsWithValue.reduce(
    (sum, stamp) => sum + (stamp.balance || 0),
    0,
  );

  return {
    totalBTC,
    totalStamps,
    valuedStamps,
    stampsWithValue: stampsWithValue.length,
    totalCollections: stamps.length,
    formattedTotal: formatBTCValue(totalBTC),
    hasValue: totalBTC > 0,
    valueCoverage: totalStamps > 0 ? (valuedStamps / totalStamps) * 100 : 0,
  };
}
