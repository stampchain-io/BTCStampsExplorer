/**
 * Sorting Adapters
 *
 * This module provides page-specific sorting adapters that integrate with the
 * world-class sorting infrastructure. Each adapter handles the unique requirements
 * of different page types while maintaining consistency and performance.
 */

export { useStampSortingAdapter } from "./StampSortingAdapter.tsx";
export { useWalletSortingAdapter } from "./WalletSortingAdapter.tsx";

export type {
  WalletSortingAdapterProps,
  WalletSortingAdapterReturn,
} from "./WalletSortingAdapter.tsx";

export type {
  StampSortingAdapterProps,
  StampSortingAdapterReturn,
} from "./StampSortingAdapter.tsx";
