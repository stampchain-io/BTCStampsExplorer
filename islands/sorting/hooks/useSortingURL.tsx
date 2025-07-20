/**
 * @fileoverview useSortingURL - Custom hook for URL synchronization with sorting state
 * @description Provides URL parameter synchronization following BTCStampsExplorer patterns
 * with support for Fresh.js navigation and browser history management
 */

import type { SortKey } from "$lib/types/sorting.d.ts";
import { DEFAULT_SORT_CONFIG } from "$lib/utils/sortingConstants.ts";
import { useEffect, useRef, useState } from "preact/hooks";

// ===== TYPES =====

/**
 * Configuration for URL synchronization
 */
export interface URLSyncConfig {
  /** URL parameter name for sort (default: "sortBy") */
  paramName?: string;
  /** Default sort value to use when no URL param is present */
  defaultSort: SortKey;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Whether to replace or push state (default: true for replace) */
  replaceState?: boolean;
  /** Whether to reset page parameter when sort changes (default: true) */
  resetPage?: boolean;
  /** Page parameter name (default: "page") */
  pageParamName?: string;
  /** Whether to enable URL synchronization (default: true) */
  enabled?: boolean;
}

/**
 * Return type for useSortingURL hook
 */
export interface UseSortingURLReturn {
  /** Current sort value from URL */
  sortBy: SortKey;
  /** Function to update sort in URL */
  setSortBy: (sortBy: SortKey) => void;
  /** Whether URL sync is currently enabled */
  isEnabled: boolean;
  /** Function to get current URL with updated sort */
  getUpdatedURL: (sortBy: SortKey) => string;
  /** Function to navigate to URL with updated sort */
  navigateToSort: (sortBy: SortKey) => void;
}

// ===== HOOK =====

/**
 * Custom hook for URL synchronization with sorting state
 * Follows BTCStampsExplorer patterns for URL parameter handling
 */
export function useSortingURL(config: URLSyncConfig): UseSortingURLReturn {
  const {
    paramName = "sortBy",
    defaultSort,
    debounceMs = DEFAULT_SORT_CONFIG.DEBOUNCE_MS,
    replaceState = true,
    resetPage = true,
    pageParamName = "page",
    enabled = true,
  } = config;

  // ===== STATE =====

  const [sortBy, setSortByState] = useState<SortKey>(() => {
    if (typeof globalThis.location === "undefined") {
      return defaultSort;
    }

    // SSR-safe browser environment check
    if (typeof globalThis === "undefined" || !globalThis?.location) {
      return defaultSort; // Cannot access location during SSR
    }

    const params = new URLSearchParams(globalThis.location.search);
    const urlSort = params.get(paramName);
    return (urlSort as SortKey) || defaultSort;
  });

  // ===== REFS =====

  const debounceRef = useRef<number | null>(null);
  const isInitialMount = useRef(true);

  // ===== UTILITY FUNCTIONS =====

  /**
   * Get updated URL with new sort parameter
   */
  const getUpdatedURL = (newSortBy: SortKey): string => {
    // SSR-safe browser environment check
    if (typeof globalThis === "undefined" || !globalThis?.location) {
      return ""; // Cannot access location during SSR
    }

    const url = new URL(globalThis.location.href);
    const params = url.searchParams;

    // Set sort parameter
    if (newSortBy !== defaultSort) {
      params.set(paramName, newSortBy);
    } else {
      params.delete(paramName);
    }

    // Reset page if enabled
    if (resetPage) {
      params.delete(pageParamName);
    }

    return url.toString();
  };

  /**
   * Navigate to URL with updated sort
   */
  const navigateToSort = (newSortBy: SortKey) => {
    // SSR-safe browser environment check
    if (
      !enabled || typeof globalThis === "undefined" || !globalThis?.location
    ) {
      return; // Cannot navigate during SSR
    }

    const newUrl = getUpdatedURL(newSortBy);

    // Use Fresh.js navigation pattern
    const event = new CustomEvent("fresh-navigate", {
      detail: { url: newUrl },
    });
    globalThis.dispatchEvent(event);
  };

  /**
   * Update URL with debouncing
   */
  const updateURL = (newSortBy: SortKey) => {
    // SSR-safe browser environment check
    if (
      !enabled || typeof globalThis === "undefined" || !globalThis?.location
    ) {
      return; // Cannot update URL during SSR
    }

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout
    debounceRef.current = setTimeout(() => {
      const newUrl = getUpdatedURL(newSortBy);

      if (newUrl !== globalThis.location.href) {
        if (replaceState) {
          globalThis.history.replaceState({}, "", newUrl);
        } else {
          globalThis.history.pushState({}, "", newUrl);
        }
      }
    }, debounceMs);
  };

  // ===== EFFECTS =====

  /**
   * Initialize from URL on mount
   */
  useEffect(() => {
    // SSR-safe browser environment check
    if (typeof globalThis === "undefined" || !globalThis?.location) {
      return; // Cannot access location during SSR
    }

    const params = new URLSearchParams(globalThis.location.search);
    const urlSort = params.get(paramName);

    if (urlSort && urlSort !== sortBy) {
      setSortByState(urlSort as SortKey);
    }

    isInitialMount.current = false;
  }, []);

  /**
   * Update URL when sort changes (skip initial mount)
   */
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }

    updateURL(sortBy);
  }, [sortBy, enabled]);

  /**
   * Listen for browser navigation events
   */
  useEffect(() => {
    if (typeof globalThis.addEventListener === "undefined") {
      return;
    }

    const handlePopState = () => {
      // SSR-safe browser environment check
      if (typeof globalThis === "undefined" || !globalThis?.location) {
        return; // Cannot access location during SSR
      }

      const params = new URLSearchParams(globalThis.location.search);
      const urlSort = params.get(paramName);
      const newSort = (urlSort as SortKey) || defaultSort;

      if (newSort !== sortBy) {
        setSortByState(newSort);
      }
    };

    globalThis.addEventListener("popstate", handlePopState);

    return () => {
      globalThis.removeEventListener("popstate", handlePopState);
    };
  }, [paramName, defaultSort, sortBy]);

  /**
   * Cleanup debounce on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // ===== PUBLIC API =====

  const setSortBy = (newSortBy: SortKey) => {
    setSortByState(newSortBy);
  };

  return {
    sortBy,
    setSortBy,
    isEnabled: enabled,
    getUpdatedURL,
    navigateToSort,
  };
}

// ===== UTILITY HOOKS =====

/**
 * Hook for wallet-specific URL synchronization
 */
export function useWalletSortingURL(defaultSort: SortKey = "DESC") {
  return useSortingURL({
    paramName: "sortBy",
    defaultSort,
    debounceMs: 300,
    replaceState: true,
    resetPage: true,
    pageParamName: "page",
    enabled: true,
  });
}

/**
 * Hook for stamp page URL synchronization
 */
export function useStampSortingURL(defaultSort: SortKey = "DESC") {
  return useSortingURL({
    paramName: "sortBy",
    defaultSort,
    debounceMs: 300,
    replaceState: true,
    resetPage: true,
    pageParamName: "page",
    enabled: true,
  });
}

/**
 * Hook for collection page URL synchronization
 */
export function useCollectionSortingURL(defaultSort: SortKey = "DESC") {
  return useSortingURL({
    paramName: "sortBy",
    defaultSort,
    debounceMs: 300,
    replaceState: true,
    resetPage: true,
    pageParamName: "page",
    enabled: true,
  });
}
