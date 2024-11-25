export enum RouteType {
  // No cache (real-time data)
  DYNAMIC = 'dynamic',
  STAMP_DISPENSER = 'stamp_dispenser',
  STAMP_DISPENSE = 'stamp_dispense',
  STAMP_SEND = 'stamp_send',

  // Short cache (frequently changing data)
  BALANCE = 'balance',
  DISPENSER = 'dispenser',
  TRANSACTION = 'transaction',
  STAMP_DETAIL = 'stamp_detail',    // Individual stamp details

  // Medium cache (moderately changing data)
  STAMP = 'stamp',
  STAMP_METADATA = 'stamp_metadata',

  // Long cache (stable data)
  STAMP_LIST = 'stamp_list',        // List of all stamps
  COLLECTION = 'collection',
  HISTORICAL = 'historical',
  PROTOCOL = 'protocol',
  STATIC = 'static',
}

export interface CacheConfig {
  duration: number;              // Cache duration in seconds
  staleWhileRevalidate: number;  // Allow serving stale content while fetching fresh
  staleIfError: number;          // Use stale content if backend errors
}

export function getCacheConfig(routeType: RouteType): CacheConfig {
  switch (routeType) {
    // No cache - real-time data
    case RouteType.STAMP_DISPENSER:
    case RouteType.STAMP_DISPENSE:
    case RouteType.STAMP_SEND:
    case RouteType.DYNAMIC:
      return {
        duration: 0,
        staleWhileRevalidate: 0,
        staleIfError: 0,
      };

    // Frequently changing data - very short cache
    case RouteType.BALANCE:
    case RouteType.DISPENSER:
      return {
        duration: 30,            // 30 seconds
        staleWhileRevalidate: 30,
        staleIfError: 60,
      };

    // Transaction data - short cache
    case RouteType.TRANSACTION:
      return {
        duration: 60,            // 1 minute
        staleWhileRevalidate: 30,
        staleIfError: 300,
      };

    // Individual stamp details - short cache
    case RouteType.STAMP_DETAIL:
      return {
        duration: 3600,          // 1 hour
        staleWhileRevalidate: 300,
        staleIfError: 7200,
      };

    // Stamp data - medium cache
    case RouteType.STAMP:
    case RouteType.STAMP_METADATA:
      return {
        duration: 300,           // 5 minutes
        staleWhileRevalidate: 60,
        staleIfError: 3600,
      };

    // Stamp list and other stable data - long cache
    case RouteType.STAMP_LIST:
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
  }
} 