/**
 * @fileoverview Sorting constants and default values
 * @description Provides constant values for the sorting infrastructure
 */

import type {
  DefaultSortConfig,
  SortDirections,
} from "$lib/types/sorting.d.ts";

/**
 * Default sort configuration values
 */
export const DEFAULT_SORT_CONFIG: DefaultSortConfig = {
  DEBOUNCE_MS: 300,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_SIZE: 100,
  VIRTUALIZATION_THRESHOLD: 1000,
  URL_PARAM_NAME: "sortBy",
} as const;

/**
 * Sort direction constants
 */
export const SORT_DIRECTIONS: SortDirections = {
  ASC: "asc",
  DESC: "desc",
} as const;

/**
 * Common sort option labels for consistent UI
 */
export const SORT_LABELS = {
  // Wallet-specific labels
  VALUE_DESC: "Value (High to Low)",
  VALUE_ASC: "Value (Low to High)",
  QUANTITY_DESC: "Quantity (High to Low)",
  QUANTITY_ASC: "Quantity (Low to High)",
  STAMP_DESC: "Stamp # (High to Low)",
  STAMP_ASC: "Stamp # (Low to High)",
  RECENT_DESC: "Recent Activity (Newest)",
  RECENT_ASC: "Recent Activity (Oldest)",

  // Stamp-specific labels
  BLOCK_INDEX_DESC: "Block Index (Newest)",
  BLOCK_INDEX_ASC: "Block Index (Oldest)",
  STAMP_NUMBER_DESC: "Stamp Number (High to Low)",
  STAMP_NUMBER_ASC: "Stamp Number (Low to High)",
  SUPPLY_DESC: "Supply (High to Low)",
  SUPPLY_ASC: "Supply (Low to High)",

  // Common labels
  ASC: "Ascending",
  DESC: "Descending",
} as const;

/**
 * Sort option categories for grouping in UI
 */
export const SORT_CATEGORIES = {
  VALUE: "Value",
  QUANTITY: "Quantity",
  STAMP: "Stamp",
  ACTIVITY: "Activity",
  BLOCK: "Block",
  SUPPLY: "Supply",
  BASIC: "Basic",
} as const;

/**
 * Sort option icons for UI display
 */
export const SORT_ICONS = {
  VALUE_DESC: "arrow-down",
  VALUE_ASC: "arrow-up",
  QUANTITY_DESC: "arrow-down",
  QUANTITY_ASC: "arrow-up",
  STAMP_DESC: "arrow-down",
  STAMP_ASC: "arrow-up",
  RECENT_DESC: "clock",
  RECENT_ASC: "clock",
  ASC: "arrow-up",
  DESC: "arrow-down",
} as const;
