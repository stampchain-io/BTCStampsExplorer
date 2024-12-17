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

interface URLParams {
  [key: string]: string | undefined;
}

export function useURLUpdate() {
  const updateURL = useCallback((params: URLParams) => {
    if (typeof self === "undefined") return;

    const url = new URL(self.location.href);

    // Update URL parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });

    // Use Fresh's navigation instead of direct location update
    self.history.pushState({}, "", url.toString());
    // Trigger a partial update using PopStateEvent
    self.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  return { updateURL };
}
