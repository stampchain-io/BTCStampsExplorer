/**
 * Service Constants for BTC Stamps Explorer
 * Runtime constants for service behaviors and caching
 */

/**
 * Route type constants for caching behavior
 * Migrated from cacheService.ts
 */
export enum RouteType {
  // No cache (real-time data)
  DYNAMIC = "dynamic",
  INTERNAL = "internal", // Internal admin endpoints
  STAMP_DISPENSER = "stamp_dispenser",
  STAMP_DISPENSE = "stamp_dispense",
  STAMP_SEND = "stamp_send",

  // Short cache (frequently changing data)
  BALANCE = "balance",
  DISPENSER = "dispenser",
  TRANSACTION = "transaction",
  STAMP_DETAIL = "stamp_detail", // Individual stamp details

  // Block-synchronized cache (invalidated on new blocks)
  BLOCKCHAIN_DATA = "blockchain_data", // Data that changes with each block

  // Medium cache (moderately changing data)
  STAMP = "stamp",
  STAMP_METADATA = "stamp_metadata",

  // Long cache (stable data)
  STAMP_LIST = "stamp_list", // List of all stamps
  COLLECTION = "collection",
  HISTORICAL = "historical",
  PROTOCOL = "protocol",
  STATIC = "static",
  PRICE = "price",
}

/**
 * Protocol compliance level constants for tool endpoints
 * Indicates the degree of adherence to protocol standards
 */
export enum ToolProtocolComplianceLevel {
  /** Full compliance with all protocol specifications */
  FULL_COMPLIANCE = "full",
  /** Mostly compliant with minor deviations */
  PARTIAL_COMPLIANCE = "partial",
  /** Significant deviations from protocol standards */
  NON_COMPLIANT = "non-compliant",
  /** Unknown or unverified compliance status */
  UNKNOWN = "unknown",
}

/**
 * Circuit breaker state constants
 * For service reliability and fault tolerance
 */
export enum CircuitState {
  CLOSED = "CLOSED", // Normal operation - requests allowed
  OPEN = "OPEN", // Circuit is open - requests blocked
  HALF_OPEN = "HALF_OPEN", // Testing if service has recovered
  PERMANENTLY_OPEN = "PERMANENTLY_OPEN", // Circuit permanently disabled
}
