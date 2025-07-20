/**
 * Modern Preact hooks for BTC value calculations (v2.3+)
 *
 * Clean Preact hooks using only marketData structure.
 * No fallbacks to deprecated fields - forces v2.3 migration.
 */

import type { WalletStampWithValue } from "$lib/types/wallet.d.ts";
import {
  calculateStampBTCValue,
  calculateTotalBTCValue,
  formatBTCValue,
  getBestPrice,
} from "$lib/utils/btcCalculations.ts";
import { useMemo } from "preact/hooks";

/**
 * Modern hook for calculating stamp BTC value using marketData
 * @param stamp - Wallet stamp with modern marketData structure
 * @returns Memoized stamp value calculation
 */
export function useStampValue(stamp: WalletStampWithValue) {
  return useMemo(() => {
    const quantity = stamp.balance || 0;
    const marketData = stamp.marketData;

    // Use pre-calculated walletValueBTC if available (most efficient)
    if (marketData?.walletValueBTC && marketData.walletValueBTC > 0) {
      return {
        quantity,
        totalValue: marketData.walletValueBTC,
        unitPrice: marketData.lastPriceBTC,
        formattedValue: formatBTCValue(marketData.walletValueBTC),
        formattedUnitPrice: formatBTCValue(marketData.lastPriceBTC),
        hasValue: marketData.walletValueBTC > 0,
        dataSource: "preCalculated",
        isEfficient: true, // Using pre-calculated value
      };
    }

    // Otherwise calculate using quantity and market price
    const totalValue = calculateStampBTCValue(quantity, marketData);
    const unitPrice = getBestPrice(marketData);

    return {
      quantity,
      totalValue,
      unitPrice,
      formattedValue: formatBTCValue(totalValue),
      formattedUnitPrice: formatBTCValue(unitPrice),
      hasValue: totalValue !== null && totalValue > 0,
      dataSource: marketData ? "marketData" : null,
      isEfficient: false, // Had to calculate
    };
  }, [
    stamp.balance,
    stamp.marketData?.walletValueBTC,
    stamp.marketData?.lastPriceBTC,
    stamp.marketData?.floorPriceBTC,
    stamp.marketData?.recentSalePriceBTC,
  ]);
}

/**
 * Hook for individual stamp price information using modern marketData
 * @param stamp - Wallet stamp with marketData
 * @returns Memoized price information
 */
export function useStampPrice(stamp: WalletStampWithValue) {
  return useMemo(() => {
    const marketData = stamp.marketData;
    const price = getBestPrice(marketData);

    return {
      price,
      formatted: formatBTCValue(price),
      hasPrice: price !== null && price > 0,
      dataSource: marketData ? "marketData" : null,
      priceHierarchy: {
        floor: marketData?.floorPriceBTC || null,
        recent: marketData?.recentSalePriceBTC || null,
        calculated: marketData?.lastPriceBTC || null,
      },
    };
  }, [
    stamp.marketData?.lastPriceBTC,
    stamp.marketData?.floorPriceBTC,
    stamp.marketData?.recentSalePriceBTC,
  ]);
}

/**
 * Hook for portfolio-level calculations using modern marketData
 * @param stamps - Array of wallet stamps with marketData
 * @returns Memoized portfolio calculations
 */
export function usePortfolioValue(stamps: WalletStampWithValue[]) {
  return useMemo(() => {
    if (!stamps || stamps.length === 0) {
      return {
        totalValue: 0,
        totalStamps: 0,
        valuedStamps: 0,
        formattedTotal: formatBTCValue(0),
        hasValue: false,
        coverage: 0,
      };
    }

    // Use the modern calculateTotalBTCValue function
    const totalValue = calculateTotalBTCValue(stamps);

    // Calculate statistics
    let totalStamps = 0;
    let valuedStamps = 0;

    stamps.forEach((stamp) => {
      const quantity = stamp.balance || 0;
      totalStamps += quantity;

      // Count valued stamps (have marketData with price > 0)
      const hasValue = stamp.marketData?.lastPriceBTC &&
        stamp.marketData.lastPriceBTC > 0;
      if (hasValue) {
        valuedStamps += quantity;
      }
    });

    return {
      totalValue,
      totalStamps,
      valuedStamps,
      formattedTotal: formatBTCValue(totalValue),
      hasValue: totalValue > 0,
      coverage: totalStamps > 0 ? (valuedStamps / totalStamps) * 100 : 0,
    };
  }, [
    stamps.length,
    stamps.map((s) => s.balance || 0).join(","),
    stamps.map((s) => s.marketData?.walletValueBTC || 0).join(","),
    stamps.map((s) => s.marketData?.lastPriceBTC || 0).join(","),
  ]);
}

/**
 * Backward compatibility hooks for existing components
 * These maintain the old API while using modern implementations
 */

/**
 * Legacy hook for simple BTC value calculation
 * @deprecated Use calculateStampBTCValue from btcCalculations.ts directly
 */
export function useBTCValue(quantity: number, unitPrice?: number | null) {
  return useMemo(() => {
    const value = quantity && unitPrice && unitPrice > 0
      ? quantity * unitPrice
      : null;

    return {
      value,
      formatted: formatBTCValue(value),
      hasValue: value !== null && value > 0,
    };
  }, [quantity, unitPrice]);
}

/**
 * Legacy hook for total portfolio BTC value
 * @deprecated Use usePortfolioValue instead
 */
export function useTotalBTCValue(stamps: WalletStampWithValue[]) {
  return useMemo(() => {
    const total = calculateTotalBTCValue(stamps);

    return {
      total,
      formatted: formatBTCValue(total),
      hasValue: total !== null && total > 0,
    };
  }, [stamps]);
}

/**
 * Legacy hook for detailed portfolio value summary
 * @deprecated Consider using usePortfolioValue for simpler cases
 */
export function useValueSummary(stamps: WalletStampWithValue[]) {
  return useMemo(() => {
    const total = calculateTotalBTCValue(stamps);
    const totalStamps = stamps.length;
    const stampsWithValue = stamps.filter((stamp) => {
      const value = calculateStampBTCValue(
        stamp.balance || 0,
        stamp.marketData,
      );
      return value !== null && value > 0;
    });

    const valuedStamps = stampsWithValue.length;
    const valueCoverage = totalStamps > 0
      ? (valuedStamps / totalStamps) * 100
      : 0;

    // Count unique collections (by tick)
    const uniqueTicks = new Set(stamps.map((stamp) => stamp.tick));
    const totalCollections = uniqueTicks.size;

    return {
      formattedTotal: formatBTCValue(total),
      totalStamps,
      valuedStamps,
      stampsWithValue,
      totalCollections,
      hasValue: total !== null && total > 0,
      valueCoverage: Math.round(valueCoverage),
    };
  }, [stamps]);
}
