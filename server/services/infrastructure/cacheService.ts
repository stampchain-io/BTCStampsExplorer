// Import RouteType from constants
import { RouteType } from "$constants";

// Re-export for external use
export { RouteType };

export interface CacheConfig {
  duration: number;              // Cache duration in seconds
  staleWhileRevalidate: number;  // Allow serving stale content while fetching fresh
  staleIfError: number;          // Use stale content if backend errors
  ttl?: number;                  // Time to live in seconds (alternative to duration)
}

export function getCacheConfig(routeType: RouteType): CacheConfig {
  switch (routeType) {
    // No cache - real-time data
    case RouteType.STAMP_DISPENSER:
    case RouteType.STAMP_DISPENSE:
    case RouteType.STAMP_SEND:
    case RouteType.DYNAMIC:
    case RouteType.INTERNAL:
      return {
        duration: 0,
        staleWhileRevalidate: 0,
        staleIfError: 0,
      };

    // Balance data - invalidated on new blocks
    case RouteType.BALANCE:
      return {
        duration: 86400,         // 24 hours (but invalidated on blocks)
        staleWhileRevalidate: 60,
        staleIfError: 1200,      // 20 minutes if backend errors
      };

    // Dispenser data - invalidated on new blocks
    case RouteType.DISPENSER:
      return {
        duration: 86400,         // 24 hours (but invalidated on blocks)
        staleWhileRevalidate: 60,
        staleIfError: 1200,      // 20 minutes if backend errors
      };

    // Transaction data - invalidated on new blocks
    case RouteType.TRANSACTION:
      return {
        duration: 86400,         // 24 hours (but invalidated on blocks)
        staleWhileRevalidate: 60,
        staleIfError: 1200,      // 20 minutes if backend errors
      };

    // Blockchain-synchronized data - invalidated on new blocks
    case RouteType.BLOCKCHAIN_DATA:
      return {
        duration: 86400,         // 24 hours (but invalidated on blocks)
        staleWhileRevalidate: 60,
        staleIfError: 600,
      };

    // Individual stamp details - invalidated on new blocks
    case RouteType.STAMP_DETAIL:
      return {
        duration: 86400,         // 24 hours (but invalidated on blocks)
        staleWhileRevalidate: 60,
        staleIfError: 1200,      // 20 minutes if backend errors
      };

    // Stamp data - invalidated on new blocks
    case RouteType.STAMP:
    case RouteType.STAMP_METADATA:
      return {
        duration: 86400,         // 24 hours (but invalidated on blocks)
        staleWhileRevalidate: 60,
        staleIfError: 3600,
      };

    // Stamp list - invalidated on new blocks (new stamps appear immediately)
    case RouteType.STAMP_LIST:
      return {
        duration: 86400,         // 24 hours (but invalidated on blocks)
        staleWhileRevalidate: 3600,
        staleIfError: 7200,
      };

    // Collection and other stable data - long cache
    case RouteType.COLLECTION:
    case RouteType.HISTORICAL:
    case RouteType.PROTOCOL:
      return {
        duration: 86400,         // 24 hours
        staleWhileRevalidate: 3600,
        staleIfError: 7200,
      };

    // Static content - very long cache
    case RouteType.STATIC:
      return {
        duration: 86400,         // 24 hours
        staleWhileRevalidate: 3600,
        staleIfError: 7200,
      };

    // Price data - short cache
    case RouteType.PRICE:
      return {
        duration: 60,            // 1 minute
        staleWhileRevalidate: 300,
        staleIfError: 600,
      };

    // Default case for any unhandled route types
    default:
      return {
        duration: 300,           // 5 minutes default
        staleWhileRevalidate: 60,
        staleIfError: 600,
      };
  }
}
