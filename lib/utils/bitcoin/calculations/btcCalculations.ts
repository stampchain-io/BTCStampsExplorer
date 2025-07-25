/**
 * Modern BTC Value Calculation Utilities (v2.3+)
 *
 * Clean calculation functions using only marketData structure.
 * No fallbacks to deprecated fields - forces v2.3 migration.
 */

import type { StampMarketData } from "$lib/types/marketData.d.ts";
import type { WalletStampWithValue } from "$lib/types/wallet.d.ts";
import { formatBTC } from "$lib/utils/ui/formatting/formatUtils.ts";

/**
 * Calculate BTC value for a stamp using modern marketData
 * @param quantity - Number of stamps owned
 * @param marketData - Modern market data structure
 * @returns Object with raw and formatted BTC values
 */
export function calculateStampBTCValue(
  quantity: number,
  marketData: StampMarketData | null | undefined,
): number | null {
  if (
    !quantity || quantity <= 0 || !marketData?.lastPriceBTC ||
    marketData.lastPriceBTC <= 0
  ) {
    return null;
  }

  return quantity * marketData.lastPriceBTC;
}

/**
 * Get the best available price from modern marketData structure
 * @param marketData - Modern market data structure
 * @returns Best price in BTC or null
 */
export function getBestPrice(
  marketData: StampMarketData | null | undefined,
): number | null {
  if (!marketData) return null;

  // Use the pre-calculated lastPriceBTC (hierarchy: floor > recent > 0)
  return marketData.lastPriceBTC > 0 ? marketData.lastPriceBTC : null;
}

/**
 * Calculate total BTC value across multiple stamps using modern structure
 * @param stamps - Array of wallet stamps with marketData
 * @returns Total BTC value
 */
export function calculateTotalBTCValue(stamps: WalletStampWithValue[]): number {
  return stamps.reduce((total, stamp) => {
    // Use pre-calculated walletValueBTC if available (most efficient)
    if (
      stamp.marketData?.walletValueBTC && stamp.marketData.walletValueBTC > 0
    ) {
      return total + stamp.marketData.walletValueBTC;
    }

    // Otherwise calculate using quantity and market price
    const quantity = stamp.balance || 0;
    const stampValue = calculateStampBTCValue(quantity, stamp.marketData);
    return total + (stampValue || 0);
  }, 0);
}

/**
 * Format BTC value with proper precision
 * @param btcValue - Value in BTC
 * @returns Formatted string
 */
export function formatBTCValue(btcValue: number | null): string {
  if (btcValue === null || btcValue <= 0) {
    return "0.00000000 BTC";
  }
  return formatBTC(btcValue);
}

/**
 * Get value summary for a stamp using modern marketData
 * @param stamp - Wallet stamp with marketData
 * @returns Value summary object
 */
export function getValueSummary(stamp: WalletStampWithValue) {
  const quantity = stamp.balance || 0;
  const marketData = stamp.marketData;
  const totalValue = calculateStampBTCValue(quantity, marketData);
  const unitPrice = getBestPrice(marketData);

  return {
    quantity,
    unitPrice,
    totalValue,
    formattedUnitPrice: formatBTCValue(unitPrice),
    formattedTotalValue: formatBTCValue(totalValue),
    hasValue: totalValue !== null && totalValue > 0,
    dataSource: marketData ? "marketData" : null,
  };
}
