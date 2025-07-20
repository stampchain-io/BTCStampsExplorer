/**
 * Preact hooks for BTC value calculations
 *
 * Provides hooks for managing BTC value calculations with memoization
 * and state management using Preact's hook system.
 */

import type { WalletStampWithValue } from "$lib/types/wallet.d.ts";
import {
  calculateStampBTCValue,
  calculateTotalBTCValue,
  formatBTCValue,
  getBestStampPrice,
  getValueSummary,
} from "$lib/utils/btcCalculations.ts";
import { useMemo } from "preact/hooks";

/**
 * Hook for calculating BTC value of a single stamp
 * @param quantity - Number of stamps owned
 * @param unitPrice - Price per stamp in BTC
 * @returns Memoized BTC value calculation
 */
export function useBTCValue(
  quantity: number,
  unitPrice: number | null | undefined,
) {
  return useMemo(() => {
    const value = calculateStampBTCValue(quantity, unitPrice);
    return {
      value,
      formatted: formatBTCValue(value),
      hasValue: value !== null && value > 0,
    };
  }, [quantity, unitPrice]);
}

/**
 * Hook for calculating total BTC value of multiple stamps
 * @param stamps - Array of wallet stamps with value data
 * @returns Memoized total BTC value calculation
 */
export function useTotalBTCValue(stamps: WalletStampWithValue[]) {
  return useMemo(() => {
    const totalBTC = calculateTotalBTCValue(stamps);
    return {
      total: totalBTC,
      formatted: formatBTCValue(totalBTC),
      hasValue: totalBTC > 0,
    };
  }, [stamps]);
}

/**
 * Hook for getting the best available price for a stamp using v2.3 market data or legacy fallback
 * @param stamp - Wallet stamp data with optional marketData
 * @returns Memoized best price calculation with improved source tracking
 */
export function useBestStampPrice(stamp: WalletStampWithValue) {
  return useMemo(() => {
    const price = getBestStampPrice(stamp);
    let source = null;

    // v2.3 API: Track if using marketData.lastPriceBTC (preferred)
    if (
      stamp.marketData?.lastPriceBTC && price === stamp.marketData.lastPriceBTC
    ) {
      source = "market"; // New source type for v2.3 calculated price
    } // Legacy source tracking for backward compatibility
    else if (price === stamp.unitPrice) {
      source = "unit";
    } else if (price === stamp.recentSalePrice) {
      source = "recent";
    } else if (price === stamp.floorPrice) {
      source = "floor";
    }

    return {
      price,
      formatted: formatBTCValue(price),
      hasPrice: price !== null && price > 0,
      source,
    };
  }, [
    stamp.unitPrice,
    stamp.recentSalePrice,
    stamp.floorPrice,
    stamp.marketData?.lastPriceBTC,
  ]);
}

/**
 * Hook for comprehensive value summary of a stamp collection
 * @param stamps - Array of wallet stamps
 * @returns Memoized value summary with statistics
 */
export function useValueSummary(stamps: WalletStampWithValue[]) {
  return useMemo(() => {
    return getValueSummary(stamps);
  }, [stamps]);
}

/**
 * Hook for calculating individual stamp display values using v2.3 market data or legacy fallback
 * @param stamp - Individual stamp data with optional marketData
 * @returns Memoized stamp value calculations with v2.3 optimizations
 */
export function useStampValue(stamp: WalletStampWithValue) {
  return useMemo(() => {
    const quantity = stamp.balance || 0;

    // v2.3 API: Use pre-calculated walletValueBTC if available (most efficient)
    let totalValue = null;
    if (
      stamp.marketData?.walletValueBTC && stamp.marketData.walletValueBTC > 0
    ) {
      totalValue = stamp.marketData.walletValueBTC;
    } else {
      // Fallback to calculation using getBestStampPrice
      const bestPrice = getBestStampPrice(stamp);
      totalValue = calculateStampBTCValue(quantity, bestPrice);
    }

    const bestPrice = getBestStampPrice(stamp);

    // Enhanced price source tracking for v2.3 and legacy
    let priceSource = null;
    if (
      stamp.marketData?.lastPriceBTC &&
      bestPrice === stamp.marketData.lastPriceBTC
    ) {
      priceSource = "market"; // v2.3 calculated price
    } else if (bestPrice === stamp.unitPrice) {
      priceSource = "unit";
    } else if (bestPrice === stamp.recentSalePrice) {
      priceSource = "recent";
    } else if (bestPrice === stamp.floorPrice) {
      priceSource = "floor";
    }

    return {
      quantity,
      totalValue,
      formattedValue: formatBTCValue(totalValue),
      formattedTotalValue: formatBTCValue(totalValue),
      formattedUnitPrice: formatBTCValue(bestPrice),
      hasValue: totalValue !== null && totalValue > 0,
      priceSource,
    };
  }, [
    stamp.balance,
    stamp.unitPrice,
    stamp.recentSalePrice,
    stamp.floorPrice,
    stamp.marketData?.lastPriceBTC,
    stamp.marketData?.walletValueBTC,
  ]);
}
