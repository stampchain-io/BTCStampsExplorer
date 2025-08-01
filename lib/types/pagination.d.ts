import type { InfiniteScrollState, PaginationState } from "$types/ui.d.ts";
/**
 * Comprehensive Pagination Type Definitions
 *
 * Complete implementation including offset-based, cursor-based, and infinite scroll patterns
 * with full Relay specification compliance and React integration support.
 */

// ============================================================================
// BASIC OFFSET-BASED PAGINATION
// ============================================================================

export interface PaginationQueryParams {
  page: number;
  limit: number;
}

export interface OffsetPaginationParams {
  limit: number;
  offset: number;
  page?: number;
  pageSize?: number;
}

export interface OffsetPageInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
  pageSize: number;
  itemsPerPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OffsetPaginatedResponse<T> extends PaginatedResponse<T> {
  pageInfo: OffsetPageInfo;
  metadata?: PaginationMetadata;
}

// ============================================================================
// CURSOR-BASED PAGINATION (Relay Specification)
// ============================================================================

export interface CursorPaginationParams {
  first?: number;
  last?: number;
  before?: string;
  after?: string;
}

export interface CursorPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface Edge<T> {
  node: T;
  cursor: string;
}

export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: CursorPageInfo;
  totalCount?: number;
}

export interface CursorPaginatedResponse<T> {
  connection: Connection<T>;
  metadata?: PaginationMetadata;
}

// ============================================================================
// GENERIC PAGINATION WRAPPER TYPES
// ============================================================================

export type PaginatedResult<T> =
  | OffsetPaginatedResponse<T>
  | CursorPaginatedResponse<T>;

export interface PaginationMetadata {
  sortBy?: string;
  sortDirection?: SortDirection;
  filters?: FilterOptions<any>;
  searchQuery?: string;
  timestamp?: number;
}

export enum SortDirection {
  ASC = "asc",
  DESC = "desc",
}

export interface FilterOptions<T> {
  field: keyof T;
  value: any;
  operator?: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "like";
}

// ============================================================================
// PAGINATION STATE MANAGEMENT
// ============================================================================

// ============================================================================
// INFINITE SCROLL TYPES
// ============================================================================

export interface InfiniteScrollConfig {
  initialBatchSize: number;
  batchSize: number;
  threshold: number;
  enableVirtualScrolling?: boolean;
  maxItems?: number;
}

export interface InfiniteScrollData<T> {
  items: T[];
  totalCount?: number;
  cursor?: string;
  hasMore: boolean;
}

export enum LoadingState {
  IDLE = "idle",
  LOADING = "loading",
  SUCCESS = "success",
  ERROR = "error",
  LOADING_MORE = "loading_more",
}

export interface PaginationCache<T> {
  data: Map<string, T[]>;
  cursors: Map<string, string>;
  totalCounts: Map<string, number>;
  lastAccessed: Map<string, number>;
}

// ============================================================================
// REACT INTEGRATION TYPES
// ============================================================================

export interface ScrollPaginationHook<T> {
  items: T[];
  hasMore: boolean;
  isLoading: boolean;
  error?: string;
  loadMore: () => void;
  reset: () => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type PaginationDirection = "forward" | "backward";

export interface PaginationBoundary {
  minPage: number;
  maxPage: number;
  minPageSize: number;
  maxPageSize: number;
}

export type PaginationType = "offset" | "cursor" | "infinite";

export interface PaginationConfig {
  type: PaginationType;
  defaultPageSize: number;
  maxPageSize: number;
  enableCaching?: boolean;
  cacheTimeout?: number;
}

// ============================================================================
// PAGINATION COMPONENT PROPS
// ============================================================================

export interface PaginationProps {
  page: number;
  totalPages: number;
  prefix?: string;
  onPageChange?: (page: number) => void;
}
