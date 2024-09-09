import { FILTER_TYPES, SUBPROTOCOLS } from "globals";

export const filterOptions: Record<FILTER_TYPES, {
  suffixFilters: string[];
  ident: SUBPROTOCOLS[];
}> = {
  "vector": {
    suffixFilters: ["svg", "html"],
    ident: ["STAMP", "SRC-721"],
  },
  "pixel": {
    suffixFilters: ["gif", "jpg", "png", "webp"],
    ident: ["STAMP", "SRC-721"],
  },
  "recursive": {
    suffixFilters: [],
    ident: ["STAMP", "SRC-721"],
  },
};
