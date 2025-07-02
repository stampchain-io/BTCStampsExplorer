import type { CollectionMarketData, CacheStatus } from "../../lib/types/marketData.d.ts";

export interface CollectionRow {
  collection_id: string;
  collection_name: string;
  collection_description: string;
  creators: string[];
  stamp_count: number;
  total_editions: number;
  stamps: number[];
  img: string;
}

/**
 * Extended collection interface that includes optional market data
 * Used when collections are fetched with aggregated market data from the cache
 */
export interface CollectionWithOptionalMarketData extends CollectionRow {
  // Optional market data fields
  marketData?: CollectionMarketData | null;
  marketDataMessage?: string;
  cacheStatus?: CacheStatus;
  cacheAgeMinutes?: number;
  
  // Convenience fields for quick access
  floorPriceRange?: {
    min: number | null;
    max: number | null;
    avg: number | null;
  } | null;
  totalVolume24h?: number | null;
  totalUniqueHolders?: number | null;
}

export interface CollectionQueryParams {
  limit?: number;
  page?: number;
  creator?: string;
  sortBy?: string;
  minStampCount?: number;
  includeMarketData?: boolean; // New optional parameter
}

export interface PaginatedCollectionResponseBody {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
  last_block: number;
  data: CollectionRow[];
}

/**
 * Extended paginated response that can include market data
 */
export interface PaginatedCollectionWithMarketDataResponseBody extends PaginatedCollectionResponseBody {
  data: CollectionWithOptionalMarketData[];
  marketDataSummary?: {
    collectionsWithData: number;
    collectionsWithoutData: number;
    cacheStatus: CacheStatus;
  };
} 