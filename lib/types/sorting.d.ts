/**
 * @fileoverview Comprehensive TypeScript interfaces for the world-class sorting infrastructure
 * @description Provides type definitions for shared sorting components, hooks, and utilities
 * that can be used across different page types (wallet, stamp, etc.) while maintaining type safety
 */

import type {
  EnhancedSortState,
  SortingComponentProps,
  SortState,
} from "$types/ui.d.ts";

// Re-export imported types that are used by other modules
export type {
  EnhancedSortState,
  SortingComponentProps,
  SortState,
};

// ===== CORE SORTING TYPES =====

/**
 * Sort direction enum for type safety
 */
export type SortDirection = "asc" | "desc";

/**
 * Base sort keys that are common across all page types
 */
export type BaseSortKey = "ASC" | "DESC";

/**
 * Wallet-specific sort keys for enhanced balance endpoint
 */
export type WalletSortKey =
  | BaseSortKey
  | "value_desc"
  | "value_asc"
  | "quantity_desc"
  | "quantity_asc"
  | "stamp_desc"
  | "stamp_asc"
  | "recent_desc"
  | "recent_asc";

/**
 * Stamp page sort keys for regular stamp browsing
 */
export type StampSortKey =
  | BaseSortKey
  | "block_index_desc"
  | "block_index_asc"
  | "stamp_number_desc"
  | "stamp_number_asc"
  | "supply_desc"
  | "supply_asc";

/**
 * Union type for all possible sort keys
 */
export type SortKey = WalletSortKey | StampSortKey;

// ===== SORT OPTION INTERFACES =====

/**
 * Base interface for a sort option
 * @template T - The sort key type (WalletSortKey, StampSortKey, etc.)
 */
export interface SortOption<T extends SortKey = SortKey> {
  /** Unique identifier for the sort option */
  readonly value: T;
  /** Human-readable label for the sort option */
  readonly label: string;
  /** Optional description for tooltips or accessibility */
  readonly description?: string;
  /** Whether this option is disabled */
  readonly disabled?: boolean;
  /** Optional icon name for UI display */
  readonly icon?: string;
  /** Sort direction (derived from value but explicit for clarity) */
  readonly direction: SortDirection;
  /** Category for grouping options in UI */
  readonly category?: string;
}

/**
 * Wallet-specific sort option
 */
export interface WalletSortOption extends SortOption<WalletSortKey> {
  /** Whether this sort option requires market data */
  readonly requiresMarketData?: boolean;
  /** Whether this sort option requires UTXO data */
  readonly requiresUTXOData?: boolean;
}

/**
 * Stamp-specific sort option
 */
export interface StampSortOption extends SortOption<StampSortKey> {
  /** Whether this sort option requires database sorting */
  readonly requiresDbSort?: boolean;
  /** Whether this sort option supports client-side sorting */
  readonly supportsClientSort?: boolean;
}

// ===== SORT STATE INTERFACES =====

/**
 * Current sort state
 * @template T - The sort key type
 */

/**
 * Sort configuration for different page types
 * @template T - The sort key type
 */
export interface SortConfig<T extends SortKey = SortKey> {
  /** Available sort options for this page type */
  readonly options: ReadonlyArray<SortOption<T>>;
  /** Default sort option */
  readonly defaultSort: T;
  /** Whether to enable URL synchronization */
  readonly enableUrlSync?: boolean;
  /** Debounce delay for URL updates (ms) */
  readonly debounceMs?: number;
  /** Whether to show loading states */
  readonly showLoading?: boolean;
  /** Custom sort function for client-side sorting */
  readonly customSortFn?: <TData>(data: TData[], sortBy: T) => TData[];
}

// ===== COMPONENT PROP INTERFACES =====

/**
 * Props for the base sorting component
 * @template T - The sort key type
 */

/**
 * Props for wallet-specific sorting component
 */

/**
 * Props for stamp-specific sorting component
 */

// ===== HOOK INTERFACES =====

/**
 * Return type for the useSorting hook
 * @template T - The sort key type
 */
export interface UseSortingReturn<T extends SortKey = SortKey> {
  /** Current sort state */
  readonly sortState: SortState<T>;
  /** Current sort value for backward compatibility */
  readonly sortBy: T;
  /** Function to update sort */
  readonly setSortBy: (sortBy: T) => void;
  /** Function to toggle sort direction */
  readonly toggleDirection: () => void;
  /** Function to reset to default sort */
  readonly resetSort: () => void;
  /** Whether sorting is in progress */
  readonly isLoading: boolean;
  /** Any error that occurred */
  readonly error: string | null;
  /** Function to clear errors */
  readonly clearError: () => void;
  /** Performance metrics */
  readonly metrics?: {
    sortTime: number;
    itemCount: number;
    cacheHits: number;
    cacheMisses: number;
    totalSorts: number;
    averageSortDuration: number;
  };
}

/**
 * Configuration for the useSorting hook
 * @template T - The sort key type
 */
export interface UseSortingConfig<T extends SortKey = SortKey> {
  /** Default sort key */
  readonly defaultSort: T;
  /** Whether to enable URL synchronization */
  readonly enableUrlSync?: boolean;
  /** Debounce delay for URL updates (ms) */
  readonly debounceMs?: number;
  /** Custom sort function */
  readonly customSortFn?: <TData>(data: TData[], sortBy: T) => TData[];
  /** Callback when sort changes */
  readonly onSortChange?: (sortBy: T) => void;
  /** Whether to persist sort in localStorage */
  readonly persistSort?: boolean;
  /** localStorage key for persistence */
  readonly persistKey?: string;
}

// ===== UTILITY INTERFACES =====

/**
 * Sort transformation function type
 * @template TInput - Input data type
 * @template TOutput - Output data type
 * @template TSortKey - Sort key type
 */
export type SortTransformFn<TInput, TOutput, TSortKey extends SortKey> = (
  data: TInput[],
  sortBy: TSortKey,
) => TOutput[];

/**
 * Sort validator function type
 * @template T - Sort key type
 */
export type SortValidatorFn<T extends SortKey> = (sortBy: string) => T | null;

/**
 * URL parameter sync configuration
 */
export interface UrlSyncConfig {
  /** URL parameter name for sort */
  readonly paramName?: string;
  /** Whether to replace or push to history */
  readonly historyMode?: "replace" | "push";
  /** Whether to sync on mount */
  readonly syncOnMount?: boolean;
  /** Custom URL encoder */
  readonly encoder?: (value: string) => string;
  /** Custom URL decoder */
  readonly decoder?: (value: string) => string;
}

// ===== PERFORMANCE INTERFACES =====

/**
 * Performance optimization configuration
 */
export interface SortPerformanceConfig {
  /** Whether to enable memoization */
  readonly enableMemoization?: boolean;
  /** Whether to enable virtualization for large datasets */
  readonly enableVirtualization?: boolean;
  /** Threshold for enabling virtualization */
  readonly virtualizationThreshold?: number;
  /** Whether to enable caching */
  readonly enableCaching?: boolean;
  /** Cache TTL in milliseconds */
  readonly cacheTtl?: number;
  /** Maximum cache size */
  readonly maxCacheSize?: number;
}

/**
 * Sort performance metrics
 */
export interface SortMetrics {
  /** Sort operation duration in milliseconds */
  readonly duration: number;
  /** Number of items sorted */
  readonly itemCount: number;
  /** Whether cache was hit */
  readonly cacheHit: boolean;
  /** Memory usage in bytes */
  readonly memoryUsage?: number;
  /** Timestamp of the operation */
  readonly timestamp: Date;
}

// ===== ERROR INTERFACES =====

/**
 * Sort error types
 */
export type SortErrorType =
  | "INVALID_SORT_KEY"
  | "SORT_FUNCTION_ERROR"
  | "URL_SYNC_ERROR"
  | "CACHE_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT_ERROR";

/**
 * Sort error interface
 */
export interface SortError {
  /** Error type */
  readonly type: SortErrorType;
  /** Error message */
  readonly message: string;
  /** Original error object */
  readonly originalError?: Error;
  /** Context where error occurred */
  readonly context?: string;
  /** Timestamp when error occurred */
  readonly timestamp: Date;
  /** Whether error is recoverable */
  readonly recoverable: boolean;
}

// ===== CONSTANTS =====

/**
 * Default sort configuration values
 */
export interface DefaultSortConfig {
  readonly DEBOUNCE_MS: number;
  readonly CACHE_TTL: number; // milliseconds
  readonly MAX_CACHE_SIZE: number;
  readonly VIRTUALIZATION_THRESHOLD: number;
  readonly URL_PARAM_NAME: string;
}

/**
 * Sort direction constants
 */
export interface SortDirections {
  readonly ASC: "asc";
  readonly DESC: "desc";
}

// ===== STATE MANAGEMENT ACTIONS =====

/**
 * Action types for sort state reducer
 */
export type SortActionType =
  | "SET_SORT"
  | "TOGGLE_DIRECTION"
  | "RESET_SORT"
  | "SET_LOADING"
  | "SET_ERROR"
  | "CLEAR_ERROR"
  | "SET_METRICS"
  | "INITIALIZE_FROM_URL"
  | "SYNC_TO_URL"
  | "RESTORE_FROM_STORAGE";

/**
 * Base action interface
 */
export interface BaseSortAction {
  readonly type: SortActionType;
  readonly timestamp?: Date;
}

/**
 * Set sort action
 */
export interface SetSortAction<T extends SortKey = SortKey>
  extends BaseSortAction {
  readonly type: "SET_SORT";
  readonly payload: T;
}

/**
 * Toggle direction action
 */
export interface ToggleDirectionAction extends BaseSortAction {
  readonly type: "TOGGLE_DIRECTION";
}

/**
 * Reset sort action
 */
export interface ResetSortAction<T extends SortKey = SortKey>
  extends BaseSortAction {
  readonly type: "RESET_SORT";
  readonly payload?: T; // Optional default sort
}

/**
 * Set loading action
 */
export interface SetLoadingAction extends BaseSortAction {
  readonly type: "SET_LOADING";
  readonly payload: boolean;
}

/**
 * Set error action
 */
export interface SetErrorAction extends BaseSortAction {
  readonly type: "SET_ERROR";
  readonly payload: SortError | string | null;
}

/**
 * Clear error action
 */
export interface ClearErrorAction extends BaseSortAction {
  readonly type: "CLEAR_ERROR";
}

/**
 * Set metrics action
 */
export interface SetMetricsAction extends BaseSortAction {
  readonly type: "SET_METRICS";
  readonly payload: Partial<SortMetrics>;
}

/**
 * Initialize from URL action
 */
export interface InitializeFromUrlAction<T extends SortKey = SortKey>
  extends BaseSortAction {
  readonly type: "INITIALIZE_FROM_URL";
  readonly payload: T;
}

/**
 * Sync to URL action
 */
export interface SyncToUrlAction<T extends SortKey = SortKey>
  extends BaseSortAction {
  readonly type: "SYNC_TO_URL";
  readonly payload: T;
}

/**
 * Restore from storage action
 */
export interface RestoreFromStorageAction<T extends SortKey = SortKey>
  extends BaseSortAction {
  readonly type: "RESTORE_FROM_STORAGE";
  readonly payload: T;
}

/**
 * Union of all sort actions
 */
export type SortAction<T extends SortKey = SortKey> =
  | SetSortAction<T>
  | ToggleDirectionAction
  | ResetSortAction<T>
  | SetLoadingAction
  | SetErrorAction
  | ClearErrorAction
  | SetMetricsAction
  | InitializeFromUrlAction<T>
  | SyncToUrlAction<T>
  | RestoreFromStorageAction<T>;

// ===== ENHANCED STATE INTERFACES =====

/**
 * Enhanced sort state with persistence and URL sync
 */

/**
 * Sort reducer function type
 */
export type SortReducer<T extends SortKey = SortKey> = (
  state: EnhancedSortState<T>,
  action: SortAction<T>,
) => EnhancedSortState<T>;

/**
 * Enhanced configuration for sort state management
 */
export interface EnhancedSortConfig<T extends SortKey = SortKey>
  extends SortConfig<T> {
  /** Whether to enable URL synchronization */
  readonly enableUrlSync?: boolean;
  /** Whether to enable localStorage persistence */
  readonly enablePersistence?: boolean;
  /** URL sync configuration */
  readonly urlSyncConfig?: UrlSyncConfig;
  /** Performance configuration */
  readonly performanceConfig?: SortPerformanceConfig;
  /** Maximum history size */
  readonly maxHistorySize?: number;
  /** Storage key for localStorage */
  readonly storageKey?: string;
  /** Callback when sort changes */
  readonly onSortChange?: (sortBy: T) => void;
}

/**
 * Enhanced return type for useSortState hook with reducer
 */
export interface UseSortStateReturn<T extends SortKey = SortKey>
  extends UseSortingReturn<T> {
  /** Dispatch function for actions */
  readonly dispatch: (action: SortAction<T>) => void;
  /** Enhanced sort state */
  readonly enhancedState: EnhancedSortState<T>;
  /** Function to initialize from URL */
  readonly initializeFromUrl: () => void;
  /** Function to sync to URL */
  readonly syncToUrl: () => void;
  /** Function to save to storage */
  readonly saveToStorage: () => void;
  /** Function to restore from storage */
  readonly restoreFromStorage: () => void;
  /** Function to clear cache */
  readonly clearCache: () => void;
}

// ============================================================================
// DOMAIN-SPECIFIC SORTING PROPS
// ============================================================================

/**
 * WalletSortingProps - Props for wallet-specific sorting components
 */
export interface WalletSortingProps {
  children?: import("preact").ComponentChildren;
  className?: string;
  testId?: string;
  "aria-label"?: string;
  /** Whether market data is available */
  readonly hasMarketData?: boolean;
  /** Whether UTXO data is available */
  readonly hasUTXOData?: boolean;
  /** Callback when market data is required but unavailable */
  readonly onMarketDataRequired?: () => void;
}

/**
 * StampSortingProps - Props for stamp-specific sorting components
 */
export interface StampSortingProps {
  children?: import("preact").ComponentChildren;
  className?: string;
  testId?: string;
  "aria-label"?: string;
  /** Whether to prefer database sorting */
  readonly preferDbSort?: boolean;
  /** Total number of items being sorted */
  readonly totalItems?: number;
  /** Whether large dataset optimizations are enabled */
  readonly optimizeForLargeDataset?: boolean;
}
