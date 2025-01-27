import {
  STAMP_FILTER_TYPES,
  STAMP_SUFFIX_FILTERS,
  SUBPROTOCOLS,
} from "$globals";

export const filterOptions = {
  "vector": {
    suffixFilters: ["svg" as const, "html" as const],
    ident: ["STAMP" as const],
  },
  "pixel": {
    suffixFilters: [
      "gif" as const,
      "jpg" as const,
      "png" as const,
      "webp" as const,
      "bmp" as const,
      "jpeg" as const,
    ],
    ident: ["STAMP" as const, "SRC-721" as const],
  },
  "recursive": {
    suffixFilters: ["svg" as const, "html" as const],
    ident: ["SRC-721" as const],
  },
};
