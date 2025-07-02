/**
 * Market Data Utility Functions
 *
 * Provides utilities for parsing and handling market data from the cache tables,
 * including DECIMAL to number conversions, JSON parsing, and cache status determination.
 */

import type {
  CacheStatus,
  ExchangeSources,
  VolumeSources,
} from "$lib/types/marketData.d.ts";

/**
 * Converts a DECIMAL string value from the database to a number.
 * Returns null if the input is null, undefined, or cannot be parsed.
 *
 * @param value - DECIMAL value as string from database
 * @returns Parsed number or null
 *
 * @example
 * parseBTCDecimal('0.00123456') // returns 0.00123456
 * parseBTCDecimal(null) // returns null
 * parseBTCDecimal('invalid') // returns null
 */
export function parseBTCDecimal(
  value: string | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = parseFloat(value);

  // Check for NaN or invalid conversions
  if (isNaN(parsed)) {
    console.warn(`Failed to parse BTC decimal value: ${value}`);
    return null;
  }

  return parsed;
}

/**
 * Parses volume sources JSON string into a typed object.
 * Returns an empty object if parsing fails or input is invalid.
 *
 * @param json - JSON string containing volume sources
 * @returns Record of source to volume mappings
 *
 * @example
 * parseVolumeSources('{"counterparty": 0.5, "exchange_a": 1.2}')
 * // returns { counterparty: 0.5, exchange_a: 1.2 }
 */
export function parseVolumeSources(
  json: string | null | undefined,
): VolumeSources {
  if (!json) {
    return {};
  }

  try {
    const parsed = JSON.parse(json);

    // Validate that parsed result is an object
    if (
      typeof parsed !== "object" || parsed === null || Array.isArray(parsed)
    ) {
      console.warn("Volume sources JSON is not a valid object");
      return {};
    }

    // Validate that all values are numbers
    const volumeSources: VolumeSources = {};
    for (const [source, volume] of Object.entries(parsed)) {
      if (typeof volume === "number" && !isNaN(volume)) {
        volumeSources[source] = volume;
      } else {
        console.warn(`Invalid volume value for source ${source}: ${volume}`);
      }
    }

    return volumeSources;
  } catch (error) {
    console.error("Failed to parse volume sources JSON:", error);
    return {};
  }
}

/**
 * Parses exchange sources JSON string into a string array.
 * Returns an empty array if parsing fails or input is invalid.
 *
 * @param json - JSON string containing exchange sources
 * @returns Array of exchange source names
 *
 * @example
 * parseExchangeSources('["openstamp", "kucoin", "stampscan"]')
 * // returns ['openstamp', 'kucoin', 'stampscan']
 */
export function parseExchangeSources(
  json: string | null | undefined,
): ExchangeSources {
  if (!json) {
    return [];
  }

  try {
    const parsed = JSON.parse(json);

    // Validate that parsed result is an array
    if (!Array.isArray(parsed)) {
      console.warn("Exchange sources JSON is not an array");
      return [];
    }

    // Filter to ensure all elements are strings
    return parsed.filter((item) => typeof item === "string");
  } catch (error) {
    console.error("Failed to parse exchange sources JSON:", error);
    return [];
  }
}

/**
 * Determines the cache status based on the age of the cached data.
 *
 * @param cacheAgeMinutes - Age of the cache in minutes
 * @returns Cache status: 'fresh', 'stale', or 'expired'
 *
 * Cache status thresholds:
 * - fresh: <= 30 minutes
 * - stale: 31-60 minutes
 * - expired: > 60 minutes
 *
 * @example
 * getCacheStatus(15) // returns 'fresh'
 * getCacheStatus(45) // returns 'stale'
 * getCacheStatus(120) // returns 'expired'
 */
export function getCacheStatus(
  cacheAgeMinutes: number | null | undefined,
): CacheStatus {
  // Handle invalid input
  if (
    cacheAgeMinutes === null || cacheAgeMinutes === undefined ||
    cacheAgeMinutes < 0
  ) {
    return "expired";
  }

  if (cacheAgeMinutes <= 30) {
    return "fresh";
  } else if (cacheAgeMinutes <= 60) {
    return "stale";
  } else {
    return "expired";
  }
}

/**
 * Formats a BTC amount to a fixed number of decimal places.
 * Useful for consistent display of BTC values.
 *
 * @param btc - BTC amount as number
 * @param decimals - Number of decimal places (default: 8)
 * @returns Formatted BTC string or null
 */
export function formatBTCAmount(
  btc: number | null,
  decimals: number = 8,
): string | null {
  if (btc === null || isNaN(btc)) {
    return null;
  }

  return btc.toFixed(decimals);
}

/**
 * Calculates USD value from BTC amount and current BTC price.
 *
 * @param btcAmount - Amount in BTC
 * @param btcPriceUSD - Current BTC price in USD
 * @returns USD value or null
 */
export function calculateUSDValue(
  btcAmount: number | null,
  btcPriceUSD: number,
): number | null {
  if (btcAmount === null || btcPriceUSD <= 0) {
    return null;
  }

  return btcAmount * btcPriceUSD;
}

/**
 * Validates and normalizes a confidence score to be within 0-10 range.
 *
 * @param score - Confidence score
 * @returns Normalized score between 0 and 10
 */
export function normalizeConfidenceScore(score: number): number {
  if (score < 0) return 0;
  if (score > 10) return 10;
  return score;
}

/**
 * Validates and normalizes a distribution score to be within 0-100 range.
 *
 * @param score - Distribution score
 * @returns Normalized score between 0 and 100
 */
export function normalizeDistributionScore(score: number): number {
  if (score < 0) return 0;
  if (score > 100) return 100;
  return score;
}

/**
 * Determines the quality of market data based on various factors.
 *
 * @param dataQualityScore - Data quality score (0-10)
 * @param cacheAgeMinutes - Age of cached data in minutes
 * @param sourceCount - Number of data sources
 * @returns Quality assessment: 'high', 'medium', or 'low'
 */
export function assessDataQuality(
  dataQualityScore: number,
  cacheAgeMinutes: number,
  sourceCount: number = 1,
): "high" | "medium" | "low" {
  const normalizedScore = normalizeConfidenceScore(dataQualityScore);
  const cacheStatus = getCacheStatus(cacheAgeMinutes);

  // High quality: fresh cache, high score, multiple sources
  if (cacheStatus === "fresh" && normalizedScore >= 7 && sourceCount > 1) {
    return "high";
  }

  // Low quality: expired cache or very low score
  if (cacheStatus === "expired" || normalizedScore < 3) {
    return "low";
  }

  // Medium quality: everything else
  return "medium";
}
