/**
 * Runtime type guards for collection types
 */

import type { CollectionRow, CollectionWithOptionalMarketData } from "$server/types/collection.d.ts";

/**
 * Type guard for CollectionRow
 */
export function isCollectionRow(value: any): value is CollectionRow {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.collection_id === 'string' &&
    typeof value.collection_name === 'string' &&
    Array.isArray(value.creators) &&
    Array.isArray(value.stamps) &&
    typeof value.stamp_count === 'number'
  );
}

/**
 * Type guard for CollectionWithOptionalMarketData
 */
export function isCollectionWithMarketData(
  value: any
): value is CollectionWithOptionalMarketData {
  return (
    isCollectionRow(value) &&
    'marketData' in value
  );
}