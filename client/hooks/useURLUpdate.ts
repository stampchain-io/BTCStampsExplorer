import type { StampFilterType } from "$constants";
import type { SRC20_FILTER_TYPES } from "$types/src20.d.ts";
import type {
  COLLECTION_FILTER_TYPES,
  LISTING_FILTER_TYPES,
  WALLET_FILTER_TYPES,
} from "$types/wallet.d.ts";
import { useCallback } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { SSRSafeUrlBuilder } from "$components/navigation/SSRSafeUrlBuilder.tsx";

type FilterTypes =
  | StampFilterType
  | SRC20_FILTER_TYPES
  | COLLECTION_FILTER_TYPES
  | WALLET_FILTER_TYPES
  | LISTING_FILTER_TYPES;

interface URLUpdateParams {
  sortBy?: "ASC" | "DESC";
  filterBy?: FilterTypes[];
}

export function useURLUpdate() {
  const updateURL = useCallback((params: URLUpdateParams) => {
    if (!IS_BROWSER || !globalThis.location) return;

    const urlBuilder = SSRSafeUrlBuilder.fromCurrent();

    if (params.sortBy) urlBuilder.setParam("sortBy", params.sortBy);

    if (params.filterBy !== undefined) {
      params.filterBy.length > 0
        ? urlBuilder.setParam("filterBy", params.filterBy.join(","))
        : urlBuilder.deleteParam("filterBy");
    }

    urlBuilder.setParam("page", "1");

    const event = new CustomEvent("fresh-navigate", {
      detail: { url: urlBuilder.toString() },
    });
    globalThis.dispatchEvent(event);
  }, []);

  return { updateURL };
}
