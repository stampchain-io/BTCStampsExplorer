/**
 * @fileoverview useSortState Hook - World-class sort state management for Preact/Fresh
 * @description Provides comprehensive sort state management with URL sync, localStorage persistence,
 * performance metrics, and error handling using useReducer pattern
 */

import type {
  EnhancedSortConfig,
  SortKey,
  UseSortStateReturn,
  WalletSortKey,
} from "$lib/types/sorting.d.ts";
import { useCallback, useEffect, useMemo, useReducer } from "preact/hooks";

import {
  createInitialSortState,
  parseSortFromStorage,
  parseSortFromUrl,
  sortActions,
  sortStateReducer,
  validateSortKey,
} from "$lib/utils/data/sorting/sortStateReducer.ts";

// ===== CONSTANTS =====

const DEFAULT_CONFIG = {
  debounceMs: 300,
  maxHistorySize: 10,
  enableUrlSync: true,
  enablePersistence: true,
  storageKey: "sort-state",
} as const;

// ===== URL SYNC UTILITIES =====

/**
 * Get current URL search params
 */
function getCurrentUrlParams(): URLSearchParams {
  if (typeof globalThis.location === "undefined") {
    return new URLSearchParams();
  }
  return new URLSearchParams(globalThis.location.search);
}

/**
 * Update URL without page reload (Fresh.js compatible)
 */
function updateUrl(
  params: URLSearchParams,
  mode: "replace" | "push" = "replace",
): void {
  if (
    typeof globalThis.history === "undefined" ||
    typeof globalThis.location === "undefined"
  ) {
    return;
  }

  const newUrl = `${globalThis.location.pathname}?${params.toString()}`;

  if (mode === "replace") {
    globalThis.history.replaceState(null, "", newUrl);
  } else {
    globalThis.history.pushState(null, "", newUrl);
  }
}

// ===== DEBOUNCE UTILITY =====

/**
 * Debounce function for URL updates
 */
function useDebounce<T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number,
): (...args: T) => void {
  const timeoutRef = { current: null as any };

  return useCallback((...args: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay) as any;
  }, [callback, delay]);
}

// ===== MAIN HOOK =====

/**
 * World-class sort state management hook
 * @template T - Sort key type
 */
export function useSortState<T extends SortKey = WalletSortKey>(
  config: EnhancedSortConfig<T>,
): UseSortStateReturn<T> {
  // Merge with defaults
  const effectiveConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }), [config]);

  const { defaultSort, options } = effectiveConfig;
  const validOptions = useMemo(() => options.map((opt) => opt.value), [
    options,
  ]);

  // Initialize state from URL and localStorage
  const initialState = useMemo(() => {
    let initialSort = defaultSort;

    // Try URL first (higher priority)
    if (
      effectiveConfig.enableUrlSync &&
      typeof globalThis.location !== "undefined"
    ) {
      const urlParams = getCurrentUrlParams();
      const urlSort = urlParams.get(
        effectiveConfig.urlSyncConfig?.paramName || "sort",
      );
      if (urlSort) {
        const parsedSort = parseSortFromUrl(urlSort, validOptions, defaultSort);
        if (parsedSort) initialSort = parsedSort;
      }
    }

    // Fallback to localStorage if URL didn't provide valid sort
    if (initialSort === defaultSort && effectiveConfig.enablePersistence) {
      const storageKey = effectiveConfig.storageKey || "sort-state";
      const storedSort = parseSortFromStorage(
        storageKey,
        validOptions,
        defaultSort,
      );
      if (storedSort) initialSort = storedSort;
    }

    return createInitialSortState(initialSort, {
      enableUrlSync: effectiveConfig.enableUrlSync,
      enablePersistence: effectiveConfig.enablePersistence,
    });
  }, [defaultSort, validOptions, effectiveConfig]);

  // Reducer state
  const [state, dispatch] = useReducer(sortStateReducer<T>, initialState);

  // Debounced URL update
  const debouncedUrlUpdate = useDebounce((sortBy: T) => {
    if (!effectiveConfig.enableUrlSync) return;

    const params = getCurrentUrlParams();
    const paramName = effectiveConfig.urlSyncConfig?.paramName || "sort";

    params.set(paramName, String(sortBy));
    updateUrl(params, effectiveConfig.urlSyncConfig?.historyMode || "replace");
  }, effectiveConfig.debounceMs);

  // Debounced localStorage update
  const debouncedStorageUpdate = useCallback((sortBy: T) => {
    if (!effectiveConfig.enablePersistence) return;

    try {
      const storageKey = effectiveConfig.storageKey || "sort-state";
      const dataToStore = {
        sortBy,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.warn("Failed to save sort state to localStorage:", error);
      dispatch(sortActions.setError("Failed to save sort preferences"));
    }
  }, [effectiveConfig.enablePersistence, effectiveConfig.storageKey]);

  // Performance metrics tracking
  const trackSortPerformance = useCallback((_sortBy: T, startTime: number) => {
    const duration = Date.now() - startTime;
    const itemCount = effectiveConfig.performanceConfig?.maxCacheSize || 0;

    dispatch(sortActions.setMetrics({
      duration,
      itemCount,
      cacheHit: false, // Would be determined by actual sort implementation
      timestamp: new Date(),
    }));
  }, [effectiveConfig.performanceConfig]);

  // ===== PUBLIC API FUNCTIONS =====

  /**
   * Set sort with validation and side effects
   */
  const setSortBy = useCallback((sortBy: T) => {
    const startTime = Date.now();

    // Validate sort key
    const validatedSort = validateSortKey(String(sortBy), validOptions);
    if (!validatedSort) {
      dispatch(sortActions.setError(`Invalid sort key: ${String(sortBy)}`));
      return;
    }

    // Update state
    dispatch(sortActions.setSort(sortBy));

    // Trigger side effects
    debouncedUrlUpdate(sortBy);
    debouncedStorageUpdate(sortBy);

    // Track performance
    trackSortPerformance(sortBy, startTime);

    // Custom callback
    effectiveConfig.onSortChange?.(sortBy);
  }, [
    validOptions,
    debouncedUrlUpdate,
    debouncedStorageUpdate,
    trackSortPerformance,
    effectiveConfig.onSortChange,
  ]);

  /**
   * Toggle sort direction
   */
  const toggleDirection = useCallback(() => {
    const startTime = Date.now();

    dispatch(sortActions.toggleDirection());

    // We'll get the new sort from the state in the next render
    // Side effects will be handled by useEffect
    trackSortPerformance(state.sortBy, startTime);
  }, [state.sortBy, trackSortPerformance]);

  /**
   * Reset to default sort
   */
  const resetSort = useCallback(() => {
    const startTime = Date.now();

    dispatch(sortActions.resetSort(defaultSort));

    // Update side effects with default
    debouncedUrlUpdate(defaultSort);
    debouncedStorageUpdate(defaultSort);
    trackSortPerformance(defaultSort, startTime);

    effectiveConfig.onSortChange?.(defaultSort);
  }, [
    defaultSort,
    debouncedUrlUpdate,
    debouncedStorageUpdate,
    trackSortPerformance,
    effectiveConfig.onSortChange,
  ]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    dispatch(sortActions.clearError());
  }, []);

  /**
   * Initialize from URL
   */
  const initializeFromUrl = useCallback(() => {
    if (!effectiveConfig.enableUrlSync) return;

    const urlParams = getCurrentUrlParams();
    const paramName = effectiveConfig.urlSyncConfig?.paramName || "sort";
    const urlSort = urlParams.get(paramName);

    if (urlSort) {
      const parsedSort = parseSortFromUrl(urlSort, validOptions, defaultSort);
      if (parsedSort && parsedSort !== state.sortBy) {
        dispatch(sortActions.initializeFromUrl(parsedSort));
      }
    }
  }, [
    effectiveConfig.enableUrlSync,
    effectiveConfig.urlSyncConfig,
    validOptions,
    defaultSort,
    state.sortBy,
  ]);

  /**
   * Sync current sort to URL
   */
  const syncToUrl = useCallback(() => {
    if (!effectiveConfig.enableUrlSync) return;

    debouncedUrlUpdate(state.sortBy);
    dispatch(sortActions.syncToUrl(state.sortBy));
  }, [effectiveConfig.enableUrlSync, debouncedUrlUpdate, state.sortBy]);

  /**
   * Save current sort to storage
   */
  const saveToStorage = useCallback(() => {
    if (!effectiveConfig.enablePersistence) return;

    debouncedStorageUpdate(state.sortBy);
  }, [effectiveConfig.enablePersistence, debouncedStorageUpdate, state.sortBy]);

  /**
   * Restore sort from storage
   */
  const restoreFromStorage = useCallback(() => {
    if (!effectiveConfig.enablePersistence) return;

    const storageKey = effectiveConfig.storageKey || "sort-state";
    const storedSort = parseSortFromStorage(
      storageKey,
      validOptions,
      defaultSort,
    );

    if (storedSort && storedSort !== state.sortBy) {
      dispatch(sortActions.restoreFromStorage(storedSort));
    }
  }, [
    effectiveConfig.enablePersistence,
    effectiveConfig.storageKey,
    validOptions,
    defaultSort,
    state.sortBy,
  ]);

  /**
   * Clear cache (placeholder for future cache implementation)
   */
  const clearCache = useCallback(() => {
    // Future: implement cache clearing logic
    dispatch(sortActions.setMetrics({
      duration: 0,
      itemCount: 0,
      cacheHit: false,
      timestamp: new Date(),
    }));
  }, []);

  // Handle URL changes (browser back/forward)
  useEffect(() => {
    if (!effectiveConfig.enableUrlSync) return;

    const handlePopState = () => {
      initializeFromUrl();
    };

    globalThis.addEventListener?.("popstate", handlePopState);
    return () => globalThis.removeEventListener?.("popstate", handlePopState);
  }, [effectiveConfig.enableUrlSync, initializeFromUrl]);

  // Handle sort changes for side effects
  useEffect(() => {
    if (state.sortBy === initialState.sortBy) return; // Skip initial render

    debouncedUrlUpdate(state.sortBy);
    debouncedStorageUpdate(state.sortBy);
  }, [
    state.sortBy,
    initialState.sortBy,
    debouncedUrlUpdate,
    debouncedStorageUpdate,
  ]);

  // Compute performance metrics
  const metrics = useMemo(() => {
    if (!state.metrics) return undefined;

    return {
      sortTime: state.metrics.duration,
      itemCount: state.metrics.itemCount,
      cacheHits: state.cache.hits || 0,
      cacheMisses: state.cache.misses || 0,
      totalSorts: (state.sortHistory?.length || 0) + 1,
      averageSortDuration: state.metrics.duration, // Future: calculate actual average
    };
  }, [state.metrics, state.cache, state.sortHistory]);

  // ===== RETURN OBJECT =====

  const baseReturn = {
    // Basic interface compatibility
    sortState: state,
    sortBy: state.sortBy,
    setSortBy,
    toggleDirection,
    resetSort,
    isLoading: state.isLoading || false,
    error: (state.error as string) || null,
    clearError,

    // Enhanced interface
    dispatch,
    enhancedState: state,
    initializeFromUrl,
    syncToUrl,
    saveToStorage,
    restoreFromStorage,
    clearCache,
  };

  return metrics ? { ...baseReturn, metrics } : baseReturn;
}

// ===== SPECIALIZED HOOKS =====

/**
 * Specialized hook for wallet sorting
 */
export function useWalletSortState(
  config: Omit<EnhancedSortConfig<WalletSortKey>, "options">,
) {
  const walletSortOptions = [
    {
      value: "DESC" as WalletSortKey,
      label: "Newest First",
      direction: "desc" as const,
    },
    {
      value: "ASC" as WalletSortKey,
      label: "Oldest First",
      direction: "asc" as const,
    },
    {
      value: "value_desc" as WalletSortKey,
      label: "Highest Value",
      direction: "desc" as const,
    },
    {
      value: "value_asc" as WalletSortKey,
      label: "Lowest Value",
      direction: "asc" as const,
    },
    {
      value: "quantity_desc" as WalletSortKey,
      label: "Most Owned",
      direction: "desc" as const,
    },
    {
      value: "quantity_asc" as WalletSortKey,
      label: "Least Owned",
      direction: "asc" as const,
    },
    {
      value: "stamp_desc" as WalletSortKey,
      label: "Highest Stamp #",
      direction: "desc" as const,
    },
    {
      value: "stamp_asc" as WalletSortKey,
      label: "Lowest Stamp #",
      direction: "asc" as const,
    },
  ] as const;

  const enhancedConfig: EnhancedSortConfig<WalletSortKey> = {
    ...config,
    options: walletSortOptions,
  };

  return useSortState<WalletSortKey>(enhancedConfig);
}
