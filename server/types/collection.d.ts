import type { CacheStatus, CollectionMarketData } from "$types/marketData.d.ts";
import type { StampRow } from "$types/stamp.d.ts";
import type { ValidationResult } from "$types/errors.d.ts";
import type { PaginationQueryParams } from "$types/pagination.d.ts";

// Re-export types that are used by other modules
export type { StampRow };

/**
 * Base collection data structure matching database schema
 */
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
 * Alias for CollectionRow for backward compatibility
 */
export type Collection = CollectionRow;

/**
 * Extended collection with creator names
 */
export interface CollectionWithCreators extends CollectionRow {
  creator_names?: string[];
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

// ============================================================================
// Collection Processing Types
// ============================================================================

/**
 * Collection processor for data transformation and enrichment
 */
export interface CollectionProcessor {
  /**
   * Process raw collection data from database
   */
  processRawCollection(raw: any): CollectionRow;
  
  /**
   * Enrich collection with additional data
   */
  enrichCollection(collection: CollectionRow): Promise<CollectionWithOptionalMarketData>;
  
  /**
   * Process multiple collections in batch
   */
  processBatch(collections: CollectionRow[]): Promise<CollectionWithOptionalMarketData[]>;
  
  /**
   * Transform collection for API response
   */
  transformForApi(collection: CollectionWithOptionalMarketData): any;
}

/**
 * Collection processing options
 */
export interface CollectionProcessingOptions {
  includeMarketData?: boolean;
  includeStampImages?: boolean;
  enrichCreatorNames?: boolean;
  calculateMetrics?: boolean;
  maxStampImages?: number;
}

/**
 * Collection processing result
 */
export interface CollectionProcessingResult {
  processed: CollectionWithOptionalMarketData[];
  errors: CollectionProcessingError[];
  metrics: CollectionProcessingMetrics;
}

/**
 * Collection processing error
 */
export interface CollectionProcessingError {
  collectionId: string;
  error: Error;
  phase: 'parsing' | 'enrichment' | 'transformation';
}

/**
 * Collection processing metrics
 */
export interface CollectionProcessingMetrics {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  processingTimeMs: number;
  enrichmentTimeMs: number;
}

// ============================================================================
// Collection Aggregation Types
// ============================================================================

/**
 * Collection aggregator for metrics and statistics
 */
export interface CollectionAggregator {
  /**
   * Aggregate market data for collections
   */
  aggregateMarketData(collectionIds: string[]): Promise<CollectionMarketDataAggregation>;
  
  /**
   * Calculate collection metrics
   */
  calculateMetrics(collection: CollectionRow): CollectionMetrics;
  
  /**
   * Aggregate creator statistics
   */
  aggregateCreatorStats(creatorAddress: string): Promise<CreatorStatistics>;
  
  /**
   * Generate collection rankings
   */
  generateRankings(options: RankingOptions): Promise<CollectionRanking[]>;
}

/**
 * Collection market data aggregation
 */
export interface CollectionMarketDataAggregation {
  collectionId: string;
  floorPrice: {
    min: number | null;
    max: number | null;
    avg: number | null;
    median: number | null;
  };
  volume: {
    total24h: number;
    total7d: number;
    total30d: number;
  };
  holders: {
    unique: number;
    distribution: number[];
  };
  lastUpdated: Date;
}

/**
 * Collection metrics
 */
export interface CollectionMetrics {
  collectionId: string;
  stampCount: number;
  editionCount: number;
  uniqueCreators: number;
  averageEditionsPerStamp: number;
  distributionScore: number;
  activityScore: number;
  popularityScore: number;
}

/**
 * Creator statistics
 */
export interface CreatorStatistics {
  creatorAddress: string;
  totalCollections: number;
  totalStamps: number;
  totalEditions: number;
  averageCollectionSize: number;
  topCollections: CollectionSummary[];
  createdDateRange: {
    first: Date;
    last: Date;
  };
}

/**
 * Collection summary for statistics
 */
export interface CollectionSummary {
  collectionId: string;
  collectionName: string;
  stampCount: number;
  floorPrice: number | null;
}

/**
 * Ranking options
 */
export interface RankingOptions {
  metric: 'volume' | 'holders' | 'activity' | 'growth';
  period: '24h' | '7d' | '30d' | 'all';
  limit: number;
  includeMetadata?: boolean;
}

/**
 * Collection ranking
 */
export interface CollectionRanking {
  rank: number;
  collection: CollectionWithOptionalMarketData;
  score: number;
  change24h: number;
  metadata?: {
    previousRank: number;
    trend: 'up' | 'down' | 'stable';
  };
}

// ============================================================================
// Collection Index Types
// ============================================================================

/**
 * Collection index for fast lookups
 */
export interface CollectionIndex {
  /**
   * Index by collection ID
   */
  byId: Map<string, CollectionRow>;
  
  /**
   * Index by creator address
   */
  byCreator: Map<string, string[]>;
  
  /**
   * Index by stamp ID
   */
  byStamp: Map<number, string>;
  
  /**
   * Index by name (normalized)
   */
  byName: Map<string, string>;
  
  /**
   * Build indices from collections
   */
  build(collections: CollectionRow[]): void;
  
  /**
   * Update index with new collection
   */
  update(collection: CollectionRow): void;
  
  /**
   * Remove collection from index
   */
  remove(collectionId: string): void;
  
  /**
   * Search collections
   */
  search(query: CollectionSearchQuery): CollectionRow[];
}

/**
 * Collection search query
 */
export interface CollectionSearchQuery {
  text?: string;
  creator?: string;
  stampIds?: number[];
  minStampCount?: number;
  maxStampCount?: number;
  sortBy?: CollectionSortField;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Collection sort field
 */
export type CollectionSortField = 
  | 'name'
  | 'stampCount'
  | 'editionCount'
  | 'createdDate'
  | 'floorPrice'
  | 'volume24h'
  | 'holderCount';

// ============================================================================
// Collection Validation Types
// ============================================================================

/**
 * Collection validator
 */
export interface CollectionValidator {
  /**
   * Validate collection data
   */
  validate(collection: Partial<CollectionRow>): ValidationResult<CollectionRow>;
  
  /**
   * Validate collection ID format
   */
  validateId(id: string): boolean;
  
  /**
   * Validate collection name
   */
  validateName(name: string): ValidationResult<string>;
  
  /**
   * Validate stamp array
   */
  validateStamps(stamps: number[]): ValidationResult<number[]>;
  
  /**
   * Validate creator addresses
   */
  validateCreators(creators: string[]): ValidationResult<string[]>;
}

/**
 * Collection validation rules
 */
export interface CollectionValidationRules {
  idPattern: RegExp;
  nameMinLength: number;
  nameMaxLength: number;
  descriptionMaxLength: number;
  minStampCount: number;
  maxStampCount: number;
  maxCreators: number;
}

/**
 * Collection validation error
 */
export interface CollectionValidationError {
  field: keyof CollectionRow;
  code: CollectionValidationErrorCode;
  message: string;
  value?: any;
}

/**
 * Collection validation error codes
 */
export enum CollectionValidationErrorCode {
  INVALID_ID = 'INVALID_ID',
  INVALID_NAME = 'INVALID_NAME',
  NAME_TOO_SHORT = 'NAME_TOO_SHORT',
  NAME_TOO_LONG = 'NAME_TOO_LONG',
  DESCRIPTION_TOO_LONG = 'DESCRIPTION_TOO_LONG',
  INVALID_STAMP_COUNT = 'INVALID_STAMP_COUNT',
  INVALID_STAMP_IDS = 'INVALID_STAMP_IDS',
  DUPLICATE_STAMPS = 'DUPLICATE_STAMPS',
  INVALID_CREATORS = 'INVALID_CREATORS',
  TOO_MANY_CREATORS = 'TOO_MANY_CREATORS',
  INVALID_IMAGE_URL = 'INVALID_IMAGE_URL',
}

// ============================================================================
// Collection Service Types
// ============================================================================

/**
 * Collection service configuration
 */
export interface CollectionServiceConfig {
  cacheEnabled: boolean;
  cacheTTL: number;
  enrichmentEnabled: boolean;
  marketDataEnabled: boolean;
  batchSize: number;
  maxConcurrentRequests: number;
}

/**
 * Collection service options
 */
export interface CollectionServiceOptions extends CollectionQueryParams {
  includeDeleted?: boolean;
  forceRefresh?: boolean;
  timeout?: number;
}

/**
 * Collection creation parameters
 */
export interface CollectionCreateParams {
  collection_name: string;
  collection_description: string;
  creators: string[];
  stamps: number[];
  img?: string;
}

/**
 * Collection update parameters
 */
export interface CollectionUpdateParams {
  collection_name?: string;
  collection_description?: string;
  stamps?: number[];
  img?: string;
}

/**
 * Collection service result
 */
export interface CollectionServiceResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  metadata?: {
    cached: boolean;
    processingTimeMs: number;
    source: 'cache' | 'database' | 'computed';
  };
}

// ============================================================================
// Collection Cache Types
// ============================================================================

/**
 * Collection cache entry
 */
export interface CollectionCacheEntry {
  collection: CollectionWithOptionalMarketData;
  cachedAt: Date;
  expiresAt: Date;
  hits: number;
  source: 'database' | 'computed' | 'external';
}

/**
 * Collection cache statistics
 */
export interface CollectionCacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  averageAge: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
  totalHits: number;
  totalMisses: number;
}

/**
 * Collection cache options
 */
export interface CollectionCacheOptions {
  maxSize: number;
  ttl: number;
  evictionPolicy: 'lru' | 'lfu' | 'ttl';
  preload?: string[];
  warmupOnStart?: boolean;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for CollectionRow
 */
export declare function isCollectionRow(value: any): value is CollectionRow;

/**
 * Type guard for CollectionWithOptionalMarketData
 */
export declare function isCollectionWithMarketData(
  value: any
): value is CollectionWithOptionalMarketData;
