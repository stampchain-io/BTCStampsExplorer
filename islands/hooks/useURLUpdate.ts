import { useCallback } from "preact/hooks";
import { STAMP_TYPES } from "globals";
import {
  COLLECTION_FILTER_TYPES,
  SRC20_FILTER_TYPES,
  STAMP_FILTER_TYPES,
  WALLET_FILTER_TYPES,
} from "globals";

type FilterTypes =
  | STAMP_FILTER_TYPES
  | SRC20_FILTER_TYPES
  | COLLECTION_FILTER_TYPES
  | WALLET_FILTER_TYPES;

interface URLUpdateParams {
  sortBy?: "ASC" | "DESC";
  filterBy?: FilterTypes[];
  type?: STAMP_TYPES;
  selectedTab?: STAMP_TYPES;
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

    if (params.type) url.searchParams.set("type", params.type);
    if (params.selectedTab) url.searchParams.set("type", params.selectedTab);

    url.searchParams.set("page", "1");

    self.history.pushState({}, "", url.toString());
    self.dispatchEvent(
      new CustomEvent("urlChanged", { detail: url.toString() }),
    );
    self.location.href = url.toString();
  }, []);

  return { updateURL };
}
