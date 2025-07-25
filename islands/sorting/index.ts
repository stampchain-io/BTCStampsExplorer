/**
 * @fileoverview Sorting System Index
 * @description Centralized exports for the world-class sorting infrastructure
 */

// ===== CORE SORTING =====
export {
  SortingProvider,
  useSorting,
  useSortingConfig,
  useSortingMetrics,
} from "./SortingProvider.tsx";

export { SortingComponent } from "./SortingComponent.tsx";

// ===== STYLED COMPONENTS =====
export {
  CompleteSortingInterface,
  StyledSortingButtons,
  StyledSortingDropdown,
  StyledSortingError,
  StyledSortingLabel,
} from "./SortingStyles.tsx";

// ===== URL SYNCHRONIZATION =====
export {
  useCollectionSortingURL,
  useSortingURL,
  useStampSortingURL,
  useWalletSortingURL,
} from "./hooks/useSortingURL.tsx";

export {
  CollectionSortingProvider,
  SortingProviderWithURL,
  StampSortingProvider,
  useSortingURLUtils,
  useURLAwareSorting,
  WalletSortingProvider,
} from "./SortingProviderWithURL.tsx";

// ===== TYPES =====
export type {
  SortConfig,
  SortDirection,
  SortingComponentProps,
  SortKey,
  SortMetrics,
  SortOption,
  SortState,
  StampSortOption,
  UseSortingConfig,
  UseSortingReturn,
  WalletSortOption,
} from "$lib/types/sorting.d.ts";

export type {
  URLSyncConfig,
  UseSortingURLReturn,
} from "./hooks/useSortingURL.tsx";

export type {
  SortingProviderWithURLConfig,
} from "./SortingProviderWithURL.tsx";

// ===== CONSTANTS =====
export {
  DEFAULT_SORT_CONFIG,
  SORT_DIRECTIONS,
  SORT_LABELS,
} from "$lib/utils/data/sorting/sortingConstants.ts";
