import { useCallback } from "preact/hooks";
import {
  COLLECTION_FILTER_TYPES,
  SRC20_FILTER_TYPES,
  STAMP_FILTER_TYPES,
  WALLET_FILTER_TYPES,
} from "$globals";

type FilterTypes =
  | STAMP_FILTER_TYPES
  | SRC20_FILTER_TYPES
  | COLLECTION_FILTER_TYPES
  | WALLET_FILTER_TYPES;

interface URLUpdateParams {
  sortBy?: "ASC" | "DESC";
  filterBy?: FilterTypes[];
}

export function useURLUpdate() {
  const updateURL = useCallback((params: URLUpdateParams) => {
    if (typeof self === "undefined") return;

    const url = new URL(self.location.href);

    if (params.sortBy) url.searchParams.set("sortBy", params.sortBy);

    if (params.filterBy !== undefined) {
      params.filterBy.length > 0
        ? url.searchParams.set("filterBy", params.filterBy.join(","))
        : url.searchParams.delete("filterBy");
    }

    url.searchParams.set("page", "1");

    const event = new CustomEvent("fresh-navigate", {
      detail: { url: url.toString() },
    });
    self.dispatchEvent(event);
  }, []);

  return { updateURL };
}
