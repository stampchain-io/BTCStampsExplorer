import {
  STAMP_FILTER_TYPES,
  STAMP_SUFFIX_FILTERS,
  SUBPROTOCOLS,
} from "$globals";

export const filterOptions: Record<STAMP_FILTER_TYPES, {
  suffixFilters: STAMP_SUFFIX_FILTERS[];
  ident: SUBPROTOCOLS[];
}> = {
  "vector": {
    suffixFilters: ["svg", "html"],
    ident: ["STAMP"],
  },
  "pixel": {
    suffixFilters: ["gif", "jpg", "png", "webp", "bmp", "jpeg"],
    ident: ["STAMP", "SRC-721"],
  },
  "recursive": {
    suffixFilters: ["svg", "html"],
    ident: ["SRC-721"],
  },
};
