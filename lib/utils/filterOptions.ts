import { STAMP_FILTER_TYPES, SUBPROTOCOLS } from "globals";

export const filterOptions: Record<STAMP_FILTER_TYPES, {
  suffixFilters: string[];
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
