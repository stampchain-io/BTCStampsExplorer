/**
 * @fileoverview SortingProvider - Context provider for sorting state management
 * @description Provides centralized sorting state management using React Context
 * with support for URL synchronization, localStorage persistence, and performance optimization
 */

import type {
  SortKey,
  SortState,
  UseSortingConfig,
  UseSortingReturn,
} from "$lib/types/sorting.d.ts";
import { DEFAULT_SORT_CONFIG } from "$lib/utils/sortingConstants.ts";
import { createContext } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";

// ===== CONTEXT DEFINITION =====

/**
 * Sorting context interface
 */
interface SortingContextValue extends UseSortingReturn {
  /** Configuration used by the provider */
  config: UseSortingConfig;
  /** Performance metrics */
  metrics?: {
    sortTime: number;
    itemCount: number;
    cacheHits: number;
    cacheMisses: number;
    totalSorts: number;
    averageSortDuration: number;
  };
}

/**
 * Sorting context - provides sorting state and methods to child components
 */
const SortingContext = createContext<SortingContextValue | null>(null);

// ===== PROVIDER COMPONENT =====

/**
 * Props for SortingProvider
 */
interface SortingProviderProps {
  /** Child components */
  children: preact.ComponentChildren;
  /** Sorting configuration */
  config: UseSortingConfig;
  /** Optional initial sort state */
  initialState?: Partial<SortState>;
  /** Optional test ID for testing */
  testId?: string;
}

/**
 * SortingProvider - Provides sorting state management to child components
 */
export function SortingProvider({
  children,
  config,
  initialState,
  testId,
}: SortingProviderProps) {
  // ===== STATE MANAGEMENT =====

  const [sortState, setSortState] = useState<SortState>(() => {
    // Initialize from localStorage if persistence is enabled
    if (config.persistSort && config.persistKey) {
      try {
        const saved = localStorage.getItem(config.persistKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            sortBy: parsed.sortBy || config.defaultSort,
            direction: parsed.direction || "desc",
            isLoading: false,
            error: null,
            lastSorted: parsed.lastSorted
              ? new Date(parsed.lastSorted)
              : undefined,
            ...initialState,
          };
        }
      } catch (error) {
        console.warn("Failed to load sort state from localStorage:", error);
      }
    }

    // Default initialization
    return {
      sortBy: initialState?.sortBy || config.defaultSort,
      direction: initialState?.direction || "desc",
      isLoading: initialState?.isLoading || false,
      error: initialState?.error || null,
      lastSorted: initialState?.lastSorted,
    };
  });

  const [metrics, setMetrics] = useState({
    sortTime: 0,
    itemCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalSorts: 0,
    averageSortDuration: 0,
  });

  // ===== URL SYNCHRONIZATION =====

  useEffect(() => {
    if (!config.enableUrlSync) return;

    // Update URL when sort changes
    const url = new URL(globalThis.location.href);
    const paramName = "sortBy";

    if (sortState.sortBy !== config.defaultSort) {
      url.searchParams.set(paramName, sortState.sortBy);
    } else {
      url.searchParams.delete(paramName);
    }

    // Use debounced URL update
    const timeoutId = setTimeout(() => {
      const newUrl = url.toString();
      if (newUrl !== globalThis.location.href) {
        globalThis.history.replaceState({}, "", newUrl);
      }
    }, config.debounceMs || DEFAULT_SORT_CONFIG.DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [
    sortState.sortBy,
    config.enableUrlSync,
    config.defaultSort,
    config.debounceMs,
  ]);

  // ===== PERSISTENCE =====

  useEffect(() => {
    if (!config.persistSort || !config.persistKey) return;

    try {
      const stateToSave = {
        sortBy: sortState.sortBy,
        direction: sortState.direction,
        lastSorted: sortState.lastSorted?.toISOString(),
      };
      localStorage.setItem(config.persistKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn("Failed to save sort state to localStorage:", error);
    }
  }, [
    sortState.sortBy,
    sortState.direction,
    config.persistSort,
    config.persistKey,
  ]);

  // ===== SORTING METHODS =====

  const setSortBy = (sortBy: SortKey) => {
    const startTime = performance.now();

    setSortState((prev) => ({
      ...prev,
      sortBy,
      direction: sortBy.includes("_desc")
        ? "desc"
        : sortBy.includes("_asc")
        ? "asc"
        : prev.direction,
      isLoading: true,
      error: null,
      lastSorted: new Date(),
    }));

    // Simulate async sorting operation
    setTimeout(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      setMetrics((prev) => ({
        ...prev,
        sortTime: duration,
        totalSorts: prev.totalSorts + 1,
        averageSortDuration:
          (prev.averageSortDuration * prev.totalSorts + duration) /
          (prev.totalSorts + 1),
      }));

      setSortState((prev) => ({
        ...prev,
        isLoading: false,
      }));

      // Call config callback if provided
      if (config.onSortChange) {
        config.onSortChange(sortBy);
      }
    }, 0);
  };

  const toggleDirection = () => {
    const newDirection = sortState.direction === "asc" ? "desc" : "asc";
    const newSortBy = sortState.sortBy.replace(
      /_asc|_desc$/,
      `_${newDirection}`,
    ) as SortKey;
    setSortBy(newSortBy);
  };

  const resetSort = () => {
    setSortBy(config.defaultSort);
  };

  const clearError = () => {
    setSortState((prev) => ({
      ...prev,
      error: null,
    }));
  };

  // ===== CONTEXT VALUE =====

  const contextValue: SortingContextValue = {
    sortState,
    sortBy: sortState.sortBy,
    setSortBy,
    toggleDirection,
    resetSort,
    isLoading: sortState.isLoading || false,
    error: sortState.error || null,
    clearError,
    config,
    metrics,
  };

  // ===== RENDER =====

  return (
    <SortingContext.Provider value={contextValue}>
      <div data-testid={testId} className="sorting-provider">
        {children}
      </div>
    </SortingContext.Provider>
  );
}

// ===== HOOKS =====

/**
 * useSorting hook - Access sorting state and methods from context
 * @returns Sorting state and methods
 */
export function useSorting(): UseSortingReturn {
  const context = useContext(SortingContext);

  if (!context) {
    throw new Error("useSorting must be used within a SortingProvider");
  }

  return context;
}

/**
 * useSortingConfig hook - Access sorting configuration from context
 * @returns Sorting configuration
 */
export function useSortingConfig(): UseSortingConfig {
  const context = useContext(SortingContext);

  if (!context) {
    throw new Error("useSortingConfig must be used within a SortingProvider");
  }

  return context.config;
}

/**
 * useSortingMetrics hook - Access sorting performance metrics
 * @returns Performance metrics
 */
export function useSortingMetrics() {
  const context = useContext(SortingContext);

  if (!context) {
    throw new Error("useSortingMetrics must be used within a SortingProvider");
  }

  return context.metrics;
}
