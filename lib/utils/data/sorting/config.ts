/**
 * @fileoverview Sorting Configuration
 * @description Configuration objects for different sorting contexts
 */

import type { WalletSortOption } from "$lib/types/sorting.d.ts";

/**
 * Wallet sorting configuration
 */
export const walletSortingConfig = {
  defaultSort: "stamp_desc",
  enableAdvancedSorting: true,
  cacheSize: 100,
  debounceMs: 300,
  availableOptions: [
    {
      value: "stamp_desc",
      label: "Stamp # (High to Low)",
      direction: "desc",
    },
    {
      value: "stamp_asc",
      label: "Stamp # (Low to High)",
      direction: "asc",
    },
    {
      value: "value_desc",
      label: "Value (High to Low)",
      direction: "desc",
      requiresMarketData: true,
    },
    {
      value: "value_asc",
      label: "Value (Low to High)",
      direction: "asc",
      requiresMarketData: true,
    },
  ] as WalletSortOption[],
};
