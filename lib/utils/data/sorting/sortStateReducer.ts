/**
 * @fileoverview Sort State Reducer - World-class state management for sorting functionality
 * @description Implements a robust reducer pattern for managing sort state with URL sync,
 * persistence, metrics, and error handling using Preact/Fresh architecture
 */

import type { EnhancedSortState } from "$lib/types/ui.d.ts";
import type {
  SortAction,
  SortError,
  SortKey,
  SortMetrics,
  WalletSortKey,
} from "$lib/types/sorting.d.ts";

// ===== UTILITY FUNCTIONS =====

/**
 * Extract direction from sort key
 */
function getSortDirection<T extends SortKey>(sortBy: T): "asc" | "desc" {
  const sortString = String(sortBy).toLowerCase();
  if (sortString.includes("_desc") || sortString === "desc") {
    return "desc";
  }
  return "asc";
}

/**
 * Create error object from various error types
 */
function createSortError(
  error: SortError | string | null,
  context?: string,
): SortError | null {
  if (!error) return null;

  if (typeof error === "string") {
    const errorObj: SortError = {
      type: "SORT_FUNCTION_ERROR",
      message: error,
      timestamp: new Date(),
      recoverable: true,
    };

    if (context) {
      (errorObj as any).context = context;
    }

    return errorObj;
  }

  return error;
}

/**
 * Update performance metrics
 */
function updateMetrics(
  currentMetrics: SortMetrics | undefined,
  newMetrics: Partial<SortMetrics>,
): SortMetrics {
  const baseMetrics: SortMetrics = currentMetrics || {
    duration: 0,
    itemCount: 0,
    cacheHit: false,
    timestamp: new Date(),
  };

  return {
    ...baseMetrics,
    ...newMetrics,
    timestamp: new Date(),
  };
}

/**
 * Add sort to history with deduplication and size limit
 */
function addToHistory<T extends SortKey>(
  history: ReadonlyArray<T> = [],
  sortBy: T,
  maxSize = 10,
): ReadonlyArray<T> {
  // Remove existing occurrence and add to front
  const filtered = history.filter((item) => item !== sortBy);
  const newHistory = [sortBy, ...filtered];

  // Limit size
  return newHistory.slice(0, maxSize);
}

// ===== INITIAL STATE FACTORY =====

/**
 * Create initial sort state
 */
export function createInitialSortState<T extends SortKey>(
  defaultSort: T,
  config?: {
    enableUrlSync?: boolean;
    enablePersistence?: boolean;
  },
): EnhancedSortState<T> {
  return {
    sortBy: defaultSort,
    direction: getSortDirection(defaultSort),
    isLoading: false,
    error: null,
    lastSorted: undefined,
    urlSyncEnabled: config?.enableUrlSync ?? true,
    persistenceEnabled: config?.enablePersistence ?? true,
    metrics: undefined,
    sortHistory: [],
    cache: {
      hits: 0,
      misses: 0,
      size: 0,
    },
  };
}

// ===== SORT STATE REDUCER =====

/**
 * World-class sort state reducer with comprehensive state management
 */
export function sortStateReducer<T extends SortKey>(
  state: EnhancedSortState<T>,
  action: SortAction<T>,
): EnhancedSortState<T> {
  const timestamp = new Date();

  switch (action.type) {
    case "SET_SORT": {
      const newSortBy = action.payload;
      const newDirection = getSortDirection(newSortBy);

      return {
        ...state,
        sortBy: newSortBy,
        direction: newDirection,
        lastSorted: timestamp,
        error: null, // Clear any existing errors
        sortHistory: addToHistory(state.sortHistory, newSortBy),
      };
    }

    case "TOGGLE_DIRECTION": {
      // Simply toggle the direction without changing sortBy
      const newDirection = state.direction === "desc" ? "asc" : "desc";

      return {
        ...state,
        direction: newDirection,
        lastSorted: timestamp,
        // Keep sortBy unchanged - only toggle direction
        sortHistory: addToHistory(state.sortHistory, state.sortBy),
      };
    }

    case "RESET_SORT": {
      const defaultSort = action.payload || state.sortBy;
      const direction = getSortDirection(defaultSort);

      return {
        ...state,
        sortBy: defaultSort,
        direction,
        isLoading: false,
        error: null,
        lastSorted: timestamp,
        sortHistory: addToHistory(state.sortHistory, defaultSort),
      };
    }

    case "SET_LOADING": {
      return {
        ...state,
        isLoading: action.payload,
      };
    }

    case "SET_ERROR": {
      const errorObj = createSortError(action.payload, "sortStateReducer");

      return {
        ...state,
        error: errorObj ? errorObj.message : null,
        isLoading: false,
      };
    }

    case "CLEAR_ERROR": {
      return {
        ...state,
        error: null,
      };
    }

    case "SET_METRICS": {
      const newMetrics = updateMetrics(state.metrics, action.payload);

      // Update cache stats if provided
      const cacheUpdate = action.payload.cacheHit !== undefined
        ? {
          hits: (state.cache?.hits ?? 0) + (action.payload.cacheHit ? 1 : 0),
          misses: (state.cache?.misses ?? 0) +
            (!action.payload.cacheHit ? 1 : 0),
          size: state.cache?.size ?? 0,
        }
        : state.cache;

      return {
        ...state,
        metrics: newMetrics,
        cache: cacheUpdate,
      };
    }

    case "INITIALIZE_FROM_URL": {
      const urlSortBy = action.payload;
      const direction = getSortDirection(urlSortBy);

      return {
        ...state,
        sortBy: urlSortBy,
        direction,
        lastSorted: timestamp,
        sortHistory: addToHistory(state.sortHistory, urlSortBy),
        error: null, // Clear any initialization errors
      };
    }

    case "SYNC_TO_URL": {
      // This action is primarily for triggering side effects
      // State change is minimal
      return {
        ...state,
        lastSorted: timestamp,
      };
    }

    case "RESTORE_FROM_STORAGE": {
      const storedSortBy = action.payload;
      const direction = getSortDirection(storedSortBy);

      return {
        ...state,
        sortBy: storedSortBy,
        direction,
        lastSorted: timestamp,
        sortHistory: addToHistory(state.sortHistory, storedSortBy),
      };
    }

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = action;
      console.warn("Unknown sort action:", _exhaustive);
      return state;
    }
  }
}

// ===== ACTION CREATORS =====

/**
 * Action creators for type-safe dispatching
 */
export const sortActions = {
  /**
   * Set sort action creator
   */
  setSort: <T extends SortKey>(sortBy: T): SortAction<T> => ({
    type: "SET_SORT",
    payload: sortBy,
    timestamp: new Date(),
  }),

  /**
   * Toggle direction action creator
   */
  toggleDirection: <T extends SortKey>(): SortAction<T> => ({
    type: "TOGGLE_DIRECTION",
    timestamp: new Date(),
  }),

  /**
   * Reset sort action creator
   */
  resetSort: <T extends SortKey>(defaultSort?: T): SortAction<T> => {
    const action: SortAction<T> = {
      type: "RESET_SORT",
      timestamp: new Date(),
    };

    if (defaultSort !== undefined) {
      (action as any).payload = defaultSort;
    }

    return action;
  },

  /**
   * Set loading action creator
   */
  setLoading: <T extends SortKey>(isLoading: boolean): SortAction<T> => ({
    type: "SET_LOADING",
    payload: isLoading,
    timestamp: new Date(),
  }),

  /**
   * Set error action creator
   */
  setError: <T extends SortKey>(
    error: SortError | string | null,
  ): SortAction<T> => ({
    type: "SET_ERROR",
    payload: error,
    timestamp: new Date(),
  }),

  /**
   * Clear error action creator
   */
  clearError: <T extends SortKey>(): SortAction<T> => ({
    type: "CLEAR_ERROR",
    timestamp: new Date(),
  }),

  /**
   * Set metrics action creator
   */
  setMetrics: <T extends SortKey>(
    metrics: Partial<SortMetrics>,
  ): SortAction<T> => ({
    type: "SET_METRICS",
    payload: metrics,
    timestamp: new Date(),
  }),

  /**
   * Initialize from URL action creator
   */
  initializeFromUrl: <T extends SortKey>(sortBy: T): SortAction<T> => ({
    type: "INITIALIZE_FROM_URL",
    payload: sortBy,
    timestamp: new Date(),
  }),

  /**
   * Sync to URL action creator
   */
  syncToUrl: <T extends SortKey>(sortBy: T): SortAction<T> => ({
    type: "SYNC_TO_URL",
    payload: sortBy,
    timestamp: new Date(),
  }),

  /**
   * Restore from storage action creator
   */
  restoreFromStorage: <T extends SortKey>(sortBy: T): SortAction<T> => ({
    type: "RESTORE_FROM_STORAGE",
    payload: sortBy,
    timestamp: new Date(),
  }),
};

// ===== VALIDATION UTILITIES =====

/**
 * Validate sort key against available options
 */
export function validateSortKey<T extends SortKey>(
  sortBy: string,
  validOptions: readonly T[],
): T | null {
  return validOptions.includes(sortBy as T) ? (sortBy as T) : null;
}

/**
 * Parse sort key from URL parameter with validation
 */
export function parseSortFromUrl<T extends SortKey>(
  urlParam: string | null,
  validOptions: readonly T[],
  defaultSort: T,
): T {
  if (!urlParam) return defaultSort;

  const validated = validateSortKey(urlParam, validOptions);
  return validated || defaultSort;
}

/**
 * Parse sort key from localStorage with validation
 */
export function parseSortFromStorage<T extends SortKey>(
  storageKey: string,
  validOptions: readonly T[],
  defaultSort: T,
): T {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return defaultSort;

    const parsed = JSON.parse(stored);
    const sortBy = typeof parsed === "object" ? parsed.sortBy : parsed;

    const validated = validateSortKey(sortBy, validOptions);
    return validated || defaultSort;
  } catch (error) {
    console.warn(
      `Failed to parse sort from localStorage[${storageKey}]:`,
      error,
    );
    return defaultSort;
  }
}

// ===== TYPE GUARDS =====

/**
 * Type guard for wallet sort keys
 */
export function isWalletSortKey(sortBy: string): sortBy is WalletSortKey {
  const walletSortKeys: readonly WalletSortKey[] = [
    "ASC",
    "DESC",
    "value_desc",
    "value_asc",
    "quantity_desc",
    "quantity_asc",
    "stamp_desc",
    "stamp_asc",
    "recent_desc",
    "recent_asc",
  ] as const;

  return walletSortKeys.includes(sortBy as WalletSortKey);
}
