/**
 * Market Data Helpers - v2.3 Type-Safe Utilities
 *
 * Provides consistent, type-safe access to SRC20 market data without type casting.
 * Eliminates patterns like: (src20 as any).volume24, src20.floor_unit_price, etc.
 *
 * Usage Examples:
 *   ❌ OLD: (src20 as any).volume24
 *   ✅ NEW: getVolume24h(src20)
 *
 *   ❌ OLD: src20.floor_unit_price ?? 0
 *   ✅ NEW: getFloorPrice(src20)
 */

import type {
  EnrichedSRC20Row,
  SRC20Balance,
  SRC20MarketDataV3,
  SRC20Token,
} from "$types/src20.d.ts";

/**
 * Union type for all SRC20 interfaces that can have market data
 */
export type SRC20WithMarketData = SRC20Token | SRC20Balance | EnrichedSRC20Row;

/**
 * Type Guards - Safe market data presence checking
 */
export function hasMarketData(
  token: SRC20WithMarketData,
): token is SRC20WithMarketData & { market_data: SRC20MarketDataV3 } {
  return token.market_data !== null && token.market_data !== undefined;
}

export function hasValidPrice(token: SRC20WithMarketData): boolean {
  return hasMarketData(token) &&
    (token.market_data.floorPriceBTC !== null ||
      token.market_data.recentSalePriceBTC !== null ||
      token.market_data.lastPriceBTC > 0);
}

export function hasVolumeData(token: SRC20WithMarketData): boolean {
  return hasMarketData(token) && token.market_data.volume24hBTC > 0;
}

export function hasMarketCapData(token: SRC20WithMarketData): boolean {
  return hasMarketData(token) && token.market_data.marketCapBTC > 0;
}

/**
 * Price Accessor Functions
 * Replaces: src20.floor_unit_price, (src20 as any).floor_unit_price
 */
export function getFloorPrice(token: SRC20WithMarketData): number {
  return hasMarketData(token) ? (token.market_data.floorPriceBTC ?? 0) : 0;
}

export function getRecentSalePrice(token: SRC20WithMarketData): number {
  return hasMarketData(token) ? (token.market_data.recentSalePriceBTC ?? 0) : 0;
}

export function getBestPrice(token: SRC20WithMarketData): number {
  return hasMarketData(token) ? token.market_data.lastPriceBTC : 0;
}

/**
 * Market Cap Accessor Functions
 * Replaces: (src20 as any).market_cap, src20.mcap
 */
export function getMarketCapBTC(token: SRC20WithMarketData): number {
  return hasMarketData(token) ? token.market_data.marketCapBTC : 0;
}

export function getMarketCapUSD(token: SRC20WithMarketData): number {
  return hasMarketData(token) ? token.market_data.marketCapUSD : 0;
}

/**
 * Volume Accessor Functions
 * Replaces: (src20 as any).volume24, src20.volume24h
 */
export function getVolume24h(token: SRC20WithMarketData): number {
  return hasMarketData(token) ? token.market_data.volume24hBTC : 0;
}

export function getVolume7d(token: SRC20WithMarketData): number {
  return hasMarketData(token) ? token.market_data.volume7dBTC : 0;
}

export function getVolume30d(token: SRC20WithMarketData): number {
  return hasMarketData(token) ? token.market_data.volume30dBTC : 0;
}

/**
 * Price Change Accessor Functions
 * Replaces: (marketInfo as any)?.change24, src20.change24h
 */
export function getPriceChange24h(token: SRC20WithMarketData): number | null {
  return hasMarketData(token) ? token.market_data.change24h : null;
}

export function getPriceChange7d(token: SRC20WithMarketData): number | null {
  return hasMarketData(token) ? token.market_data.change7d : null;
}

export function getPriceChange30d(token: SRC20WithMarketData): number | null {
  return hasMarketData(token) ? token.market_data.change30d : null;
}

/**
 * Formatted Display Functions
 * Common formatting patterns for UI components
 */
export function formatPrice(
  token: SRC20WithMarketData,
  fallback: string = "—",
): string {
  const price = getBestPrice(token);
  return price > 0 ? `${price.toFixed(8)} BTC` : fallback;
}

export function formatMarketCap(
  token: SRC20WithMarketData,
  currency: "BTC" | "USD" = "BTC",
  fallback: string = "—",
): string {
  const cap = currency === "BTC"
    ? getMarketCapBTC(token)
    : getMarketCapUSD(token);
  return cap > 0 ? `${cap.toLocaleString()} ${currency}` : fallback;
}

export function formatVolume(
  token: SRC20WithMarketData,
  fallback: string = "—",
): string {
  const volume = getVolume24h(token);
  return volume > 0 ? `${volume.toLocaleString()} BTC` : fallback;
}

export function formatPriceChange(
  token: SRC20WithMarketData,
  fallback: string = "—",
): string {
  const change = getPriceChange24h(token);
  if (change === null) return fallback;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Utility Functions for Common UI Patterns
 */
export function isPositiveChange(token: SRC20WithMarketData): boolean {
  const change = getPriceChange24h(token);
  return change !== null && change >= 0;
}

export function getDataQualityScore(token: SRC20WithMarketData): number {
  return hasMarketData(token) ? token.market_data.dataQualityScore : 0;
}

export function isDataFresh(
  token: SRC20WithMarketData,
  maxAgeHours: number = 1,
): boolean {
  if (!hasMarketData(token)) return false;
  const lastUpdated = new Date(token.market_data.lastUpdated);
  const now = new Date();
  const ageHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
  return ageHours <= maxAgeHours;
}

/**
 * Migration Helpers - For Legacy Component Updates
 * These help migrate existing components gradually
 */
export function getLegacyFieldValue(token: any, legacyField: string): any {
  // Helper for migrating components that still use root-level fields
  console.warn(
    `[MarketDataHelpers] Component accessing legacy field: ${legacyField}. Please migrate to use market data helpers.`,
  );

  switch (legacyField) {
    case "floor_unit_price":
      return getFloorPrice(token as SRC20WithMarketData);
    case "market_cap":
    case "mcap":
      return getMarketCapBTC(token as SRC20WithMarketData);
    case "volume24":
    case "volume24h":
      return getVolume24h(token as SRC20WithMarketData);
    case "change24":
    case "change24h":
      return getPriceChange24h(token as SRC20WithMarketData);
    default:
      console.error(`[MarketDataHelpers] Unknown legacy field: ${legacyField}`);
      return null;
  }
}

/**
 * Bulk Processing Helpers
 * For components that process lists of tokens
 */
export function filterTokensWithMarketData(
  tokens: SRC20WithMarketData[],
): SRC20WithMarketData[] {
  return tokens.filter(hasMarketData);
}

export function sortByMarketCap(
  tokens: SRC20WithMarketData[],
  descending: boolean = true,
): SRC20WithMarketData[] {
  return [...tokens].sort((a, b) => {
    const capA = getMarketCapBTC(a);
    const capB = getMarketCapBTC(b);
    return descending ? capB - capA : capA - capB;
  });
}

export function sortByVolume(
  tokens: SRC20WithMarketData[],
  descending: boolean = true,
): SRC20WithMarketData[] {
  return [...tokens].sort((a, b) => {
    const volA = getVolume24h(a);
    const volB = getVolume24h(b);
    return descending ? volB - volA : volA - volB;
  });
}

export function sortByPriceChange(
  tokens: SRC20WithMarketData[],
  descending: boolean = true,
): SRC20WithMarketData[] {
  return [...tokens].sort((a, b) => {
    const changeA = getPriceChange24h(a) ?? -Infinity;
    const changeB = getPriceChange24h(b) ?? -Infinity;
    return descending ? changeB - changeA : changeA - changeB;
  });
}
