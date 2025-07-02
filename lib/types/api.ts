/**
 * API Response Types for Market Data Cache Integration
 *
 * This file contains TypeScript interfaces for API responses that include
 * market data from the cache with proper status indicators and error handling.
 */

import type {
  CacheStatus,
  CollectionMarketData,
  SRC20MarketData,
  SRC20Row,
  StampMarketData,
  StampRow,
} from "./marketData.d.ts";
import type { CollectionRow } from "../../server/types/collection.d.ts";
import type { PaginatedResponse } from "./pagination.d.ts";

/**
 * Cache information included in API responses
 */
export interface MarketDataCacheInfo {
  status: CacheStatus;
  ageMinutes: number;
  nextUpdateIn?: number;
}

/**
 * Base response interface for entities with market data
 */
export interface WithMarketDataResponse<T, M> {
  data: T;
  marketData: M | null;
  marketDataMessage?: string;
  cacheInfo?: MarketDataCacheInfo;
}

/**
 * Stamp API response with market data
 */
export interface StampWithMarketDataResponse
  extends WithMarketDataResponse<StampRow, StampMarketData> {
  // Additional stamp-specific fields can be added here
}

/**
 * SRC-20 API response with market data
 */
export interface SRC20WithMarketDataResponse
  extends WithMarketDataResponse<SRC20Row, SRC20MarketData> {
  // Additional SRC-20-specific fields can be added here
}

/**
 * Collection API response with market data
 */
export interface CollectionWithMarketDataResponse
  extends WithMarketDataResponse<CollectionRow, CollectionMarketData> {
  stamps?: StampWithMarketDataResponse[];
}

/**
 * Paginated response with market data
 */
export interface PaginatedMarketDataResponse<T> extends PaginatedResponse<T> {
  cacheInfo?: MarketDataCacheInfo;
  marketDataAvailable: number; // Count of items with market data
  marketDataUnavailable: number; // Count of items without market data
}

/**
 * Batch market data response for multiple assets
 */
export interface BatchMarketDataResponse<T> {
  items: T[];
  summary: {
    totalItems: number;
    withMarketData: number;
    withoutMarketData: number;
    cacheStatus: CacheStatus;
    lastUpdated: Date;
  };
}

/**
 * Market data error response
 */
export interface MarketDataErrorResponse {
  error: string;
  code: string;
  assetId?: string;
  assetType?: "stamp" | "src20" | "collection";
  details?: {
    source?: string;
    lastAttempt?: Date;
    nextRetry?: Date;
  };
}

/**
 * Health check response including market data cache status
 */
export interface MarketDataHealthResponse {
  cacheHealth: {
    stamp: {
      totalCached: number;
      fresh: number;
      stale: number;
      expired: number;
      lastUpdate: Date | null;
    };
    src20: {
      totalCached: number;
      fresh: number;
      stale: number;
      expired: number;
      lastUpdate: Date | null;
    };
    collection: {
      totalCached: number;
      fresh: number;
      stale: number;
      expired: number;
      lastUpdate: Date | null;
    };
  };
  sources: {
    name: string;
    status: "online" | "offline" | "degraded";
    lastSuccessfulFetch: Date | null;
    averageResponseTime: number;
  }[];
}

/**
 * Type guards for market data responses
 */
export function hasMarketData<T, M>(
  response: WithMarketDataResponse<T, M>,
): response is WithMarketDataResponse<T, M> & { marketData: M } {
  return response.marketData !== null;
}

export function isFreshCache(cacheInfo?: MarketDataCacheInfo): boolean {
  return cacheInfo?.status === "fresh";
}

export function isStaleCache(cacheInfo?: MarketDataCacheInfo): boolean {
  return cacheInfo?.status === "stale";
}

export function isExpiredCache(cacheInfo?: MarketDataCacheInfo): boolean {
  return cacheInfo?.status === "expired";
}

/**
 * Helper to create a market data message for null cases
 */
export function createMarketDataMessage(
  assetType: "stamp" | "src20" | "collection",
  reason?: "no_dispensers" | "no_trades" | "insufficient_data" | "error",
): string {
  const messages = {
    stamp: {
      no_dispensers:
        "No market data available - no dispensers found for this stamp",
      no_trades: "No market data available - no recent trading activity",
      insufficient_data: "Market data unavailable - insufficient data points",
      error: "Market data temporarily unavailable",
    },
    src20: {
      no_dispensers: "No market data available - token not listed on exchanges",
      no_trades: "No market data available - no recent trading activity",
      insufficient_data:
        "Market data unavailable - insufficient liquidity data",
      error: "Market data temporarily unavailable",
    },
    collection: {
      no_dispensers:
        "No market data available - no stamps in collection have dispensers",
      no_trades: "No market data available - no recent collection activity",
      insufficient_data:
        "Market data unavailable - collection data is incomplete",
      error: "Market data temporarily unavailable",
    },
  };

  return messages[assetType][reason || "error"];
}

/**
 * Standard API response wrapper with market data support
 */
export interface ApiResponseWithMarketData<T> {
  success: boolean;
  data: T;
  lastBlock: number;
  timestamp: Date;
  cacheInfo?: MarketDataCacheInfo;
}

/**
 * Error response with market data context
 */
export interface ApiErrorWithMarketContext {
  error: string;
  status: number;
  code: string;
  marketDataContext?: {
    assetId: string;
    assetType: "stamp" | "src20" | "collection";
    lastKnownData?: Date;
    suggestion?: string;
  };
}
