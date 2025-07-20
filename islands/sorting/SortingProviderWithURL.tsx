/**
 * @fileoverview SortingProviderWithURL - URL-aware sorting provider
 * @description Combines SortingProvider with URL synchronization for seamless
 * integration with Fresh.js routing and browser history
 */

import type {
  SortKey,
  SortState,
  UseSortingConfig,
  UseSortingReturn,
} from "$lib/types/sorting.d.ts";
import { createContext } from "preact";
import { useContext, useEffect, useMemo } from "preact/hooks";
import { SortingProvider, useSorting } from "./SortingProvider.tsx";
import type { URLSyncConfig } from "./hooks/useSortingURL.tsx";
import { useSortingURL } from "./hooks/useSortingURL.tsx";

// ===== TYPES =====

/**
 * Configuration for URL-aware sorting provider
 */
export interface SortingProviderWithURLConfig extends UseSortingConfig {
  /** URL synchronization configuration */
  urlConfig?: Partial<URLSyncConfig>;
}

/**
 * Props for SortingProviderWithURL
 */
interface SortingProviderWithURLProps {
  /** Child components */
  children: preact.ComponentChildren;
  /** Sorting configuration with URL sync */
  config: SortingProviderWithURLConfig;
  /** Optional initial sort state */
  initialState?: Partial<SortState<SortKey>>;
  /** Optional test ID for testing */
  testId?: string;
}

/**
 * Context value for URL-aware sorting
 */
interface URLAwareSortingContextValue extends UseSortingReturn {
  /** URL synchronization utilities */
  url: {
    /** Get URL with updated sort */
    getUpdatedURL: (sortBy: SortKey) => string;
    /** Navigate to URL with updated sort */
    navigateToSort: (sortBy: SortKey) => void;
    /** Whether URL sync is enabled */
    isEnabled: boolean;
  };
}

// ===== CONTEXT =====

const URLAwareSortingContext = createContext<
  URLAwareSortingContextValue | null
>(null);

// ===== INTERNAL COMPONENT =====

/**
 * Internal component that bridges SortingProvider with URL synchronization
 */
function SortingURLBridge({
  urlConfig,
  children,
}: {
  urlConfig: URLSyncConfig;
  children: preact.ComponentChildren;
}) {
  const sorting = useSorting();
  const urlSync = useSortingURL(urlConfig);

  // ===== SYNCHRONIZATION =====

  // Sync URL state to sorting state
  useEffect(() => {
    if (urlSync.sortBy !== sorting.sortState.sortBy) {
      sorting.setSortBy(urlSync.sortBy);
    }
  }, [urlSync.sortBy]);

  // Sync sorting state to URL state
  useEffect(() => {
    if (sorting.sortState.sortBy !== urlSync.sortBy) {
      urlSync.setSortBy(sorting.sortState.sortBy);
    }
  }, [sorting.sortState.sortBy]);

  // ===== CONTEXT VALUE =====

  const contextValue: URLAwareSortingContextValue = useMemo(() => ({
    ...sorting,
    url: {
      getUpdatedURL: urlSync.getUpdatedURL,
      navigateToSort: urlSync.navigateToSort,
      isEnabled: urlSync.isEnabled,
    },
  }), [sorting, urlSync]);

  return (
    <URLAwareSortingContext.Provider value={contextValue}>
      {children}
    </URLAwareSortingContext.Provider>
  );
}

// ===== MAIN COMPONENT =====

/**
 * SortingProviderWithURL - Combines sorting state management with URL synchronization
 */
export function SortingProviderWithURL({
  children,
  config,
  initialState,
  testId,
}: SortingProviderWithURLProps) {
  const { urlConfig, ...sortingConfig } = config;

  // Prepare URL sync configuration
  const urlSyncConfig: URLSyncConfig = {
    defaultSort: sortingConfig.defaultSort,
    paramName: "sortBy",
    debounceMs: 300,
    replaceState: true,
    resetPage: true,
    pageParamName: "page",
    enabled: true,
    ...urlConfig,
  };

  // Prepare initial state with URL integration
  const enhancedInitialState = useMemo(() => {
    // Get sort from URL if available with SSR protection
    if (typeof globalThis === "undefined" || !globalThis?.location) {
      return initialState; // Cannot access location during SSR
    }

    const params = new URLSearchParams(globalThis.location.search);
    const urlSort = params.get(urlSyncConfig.paramName || "sortBy");

    if (urlSort) {
      return {
        ...initialState,
        sortBy: urlSort as SortKey,
      };
    }

    return initialState;
  }, [initialState, urlSyncConfig.paramName]);

  const sortingProps = {
    config: sortingConfig,
    children: (
      <SortingURLBridge urlConfig={urlSyncConfig}>
        {children}
      </SortingURLBridge>
    ),
    ...(enhancedInitialState && { initialState: enhancedInitialState }),
    ...(testId && { testId }),
  };

  return <SortingProvider {...sortingProps} />;
}

// ===== HOOKS =====

/**
 * Hook to access URL-aware sorting context
 */
export function useURLAwareSorting(): URLAwareSortingContextValue {
  const context = useContext(URLAwareSortingContext);

  if (!context) {
    throw new Error(
      "useURLAwareSorting must be used within a SortingProviderWithURL",
    );
  }

  return context;
}

/**
 * Hook to access URL synchronization utilities
 */
export function useSortingURLUtils() {
  const context = useURLAwareSorting();
  return context.url;
}

// ===== CONVENIENCE PROVIDERS =====

/**
 * Props for convenience providers
 */
interface ConvenienceProviderProps {
  /** Child components */
  children: preact.ComponentChildren;
  /** Default sort value */
  defaultSort?: SortKey;
  /** Optional test ID */
  testId?: string;
}

/**
 * Wallet-specific sorting provider with URL sync
 */
export function WalletSortingProvider({
  children,
  defaultSort = "DESC",
  testId,
}: ConvenienceProviderProps) {
  const config: SortingProviderWithURLConfig = {
    defaultSort,
    enableUrlSync: true,
    urlConfig: {
      paramName: "sortBy",
      resetPage: true,
      pageParamName: "page",
    },
  };

  const providerProps = {
    config,
    children,
    ...(testId && { testId }),
  };

  return <SortingProviderWithURL {...providerProps} />;
}

/**
 * Stamp page sorting provider with URL sync
 */
export function StampSortingProvider({
  children,
  defaultSort = "DESC",
  testId,
}: ConvenienceProviderProps) {
  const config: SortingProviderWithURLConfig = {
    defaultSort,
    enableUrlSync: true,
    urlConfig: {
      paramName: "sortBy",
      resetPage: true,
      pageParamName: "page",
    },
  };

  const providerProps = {
    config,
    children,
    ...(testId && { testId }),
  };

  return <SortingProviderWithURL {...providerProps} />;
}

/**
 * Collection page sorting provider with URL sync
 */
export function CollectionSortingProvider({
  children,
  defaultSort = "DESC",
  testId,
}: ConvenienceProviderProps) {
  const config: SortingProviderWithURLConfig = {
    defaultSort,
    enableUrlSync: true,
    urlConfig: {
      paramName: "sortBy",
      resetPage: true,
      pageParamName: "page",
    },
  };

  const providerProps = {
    config,
    children,
    ...(testId && { testId }),
  };

  return <SortingProviderWithURL {...providerProps} />;
}
