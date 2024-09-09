import { FILTER_TYPES, SUBPROTOCOLS } from "globals";

export const filterOptions: Record<FILTER_TYPES, {
  suffixFilters: string[];
  ident: SUBPROTOCOLS[];
}> = {
  "Vector": {
    suffixFilters: ["svg", "html"],
    ident: ["STAMP", "SRC-721"],
  },
  "Pixel": {
    suffixFilters: ["gif", "jpg", "png", "webp"],
    ident: ["STAMP", "SRC-721"],
  },
  "Recursive": {
    suffixFilters: [],
    ident: ["STAMP", "SRC-721"],
  },
};
