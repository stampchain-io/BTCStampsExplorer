export enum RouteType {
  // No cache (real-time data)
  DYNAMIC = 'dynamic',
  INTERNAL = 'internal',           // Internal admin endpoints
  STAMP_DISPENSER = 'stamp_dispenser',
  STAMP_DISPENSE = 'stamp_dispense',
  STAMP_SEND = 'stamp_send',

  // Short cache (frequently changing data)
  BALANCE = 'balance',
  DISPENSER = 'dispenser',
  TRANSACTION = 'transaction',
  STAMP_DETAIL = 'stamp_detail',    // Individual stamp details

  // Block-synchronized cache (invalidated on new blocks)
  BLOCKCHAIN_DATA = 'blockchain_data',  // Data that changes with each block

  // Medium cache (moderately changing data)
  STAMP = 'stamp',
  STAMP_METADATA = 'stamp_metadata',

  // Long cache (stable data)
  STAMP_LIST = 'stamp_list',        // List of all stamps
  COLLECTION = 'collection',
  HISTORICAL = 'historical',
  PROTOCOL = 'protocol',
  STATIC = 'static',
  PRICE = 'price',
}

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
  }
}
