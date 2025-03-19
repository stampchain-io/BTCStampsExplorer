import {
  STAMP_EDITIONS,
  STAMP_FILETYPES,
  STAMP_MARKET,
  STAMP_RARITY,
} from "$globals";

export type StampFilters = {
  market: STAMP_MARKET[];
  marketMin: string;
  marketMax: string;
  fileType: STAMP_FILETYPES[];
  editions: STAMP_EDITIONS[];
  rarity: {
    preset: STAMP_RARITY | null;
    min: string;
    max: string;
  };
  [key: string]: any; // Keep index signature for flexibility
};

export const defaultFilters: StampFilters = {
  market: [],
  marketMin: "",
  marketMax: "",
  fileType: [],
  editions: [],
  rarity: {
    preset: null,
    min: "",
    max: "",
  },
};

export function filtersToQueryParams(
  search: string,
  filters: StampFilters,
) {
  console.log(
    "Converting filters to query params:",
    JSON.stringify(filters, null, 2),
  );

  const queryParams = new URLSearchParams(search);

  // MARKET
  if (filters.market.length > 0) {
    queryParams.set("market", filters.market.join(","));
  } else {
    queryParams.delete("market");
  }

  // Handle market price range
  if (filters.marketMin) {
    queryParams.set("marketMin", filters.marketMin);
  } else {
    queryParams.delete("marketMin");
  }

  if (filters.marketMax) {
    queryParams.set("marketMax", filters.marketMax);
  } else {
    queryParams.delete("marketMax");
  }

  // FILETYPE
  if (filters.fileType.length > 0) {
    queryParams.set("filetype", filters.fileType.join(","));
  } else {
    queryParams.delete("filetype");
  }

  // EDITIONS
  if (filters.editions.length > 0) {
    queryParams.set("editions", filters.editions.join(","));
  } else {
    queryParams.delete("editions");
  }

  // RARITY
  if (filters.rarity.preset) {
    queryParams.set("rarity", filters.rarity.preset);
  } else {
    queryParams.delete("rarity");
    if (filters.rarity.min) {
      queryParams.set("rarityMin", filters.rarity.min);
    } else {
      queryParams.delete("rarityMin");
    }
    if (filters.rarity.max) {
      queryParams.set("rarityMax", filters.rarity.max);
    } else {
      queryParams.delete("rarityMax");
    }
  }

  const result = queryParams.toString();
  console.log("Final query params:", result);
  return result;
}

export function filtersToServicePayload(filters: StampFilters) {
  // Collect filters with proper types
  const filetypeFilters = filters.fileType;
  const editionFilters = filters.editions;
  const marketFilters = filters.market;

  // Handle rarity
  let rarityFilters: STAMP_RARITY | undefined = undefined;
  if (filters.rarity.preset) {
    rarityFilters = filters.rarity.preset;
  } else if (filters.rarity.min || filters.rarity.max) {
    rarityFilters = "custom";
  }

  const result = {
    ident: [],
    filetypeFilters: filetypeFilters.length > 0 ? filetypeFilters : undefined,
    editionFilters: editionFilters.length > 0 ? editionFilters : undefined,
    rarityFilters,
    marketFilters: marketFilters.length > 0 ? marketFilters : undefined,
    marketMin: filters.marketMin || undefined,
    marketMax: filters.marketMax || undefined,
  };

  console.log("Filter payload:", result);
  return result;
}

// export function queryParamsToServicePayload(query: URLSearchParams): {
//   filterBy: STAMP_FILTER_TYPES[];
// } {
//   return {
//     filterBy: [],
//   };
// }

export const allQueryKeysFromFilters = [
  "market",
  "marketMin",
  "marketMax",
  "filetype",
  "editions",
  "rarity",
  "rarityMin",
  "rarityMax",
];

export function queryParamsToFilters(query: string): StampFilters {
  const params = new URLSearchParams(query);
  const filtersPartial: Partial<StampFilters> = {
    market: [],
    marketMin: "",
    marketMax: "",
    fileType: [],
    editions: [],
    rarity: {
      preset: null,
      min: "",
      max: "",
    },
  };

  // Parse market parameter (comma-separated string to array)
  const marketParam = params.get("market");
  if (marketParam) {
    filtersPartial.market = marketParam.split(",") as STAMP_MARKET[];
  }

  // Parse market price range
  const marketMin = params.get("marketMin");
  if (marketMin) {
    filtersPartial.marketMin = marketMin;
  }

  const marketMax = params.get("marketMax");
  if (marketMax) {
    filtersPartial.marketMax = marketMax;
  }

  // Parse filetype parameter
  const filetypeParam = params.get("filetype");
  if (filetypeParam) {
    filtersPartial.fileType = filetypeParam.split(",") as STAMP_FILETYPES[];
  }

  // Parse editions parameter
  const editionsParam = params.get("editions");
  if (editionsParam) {
    filtersPartial.editions = editionsParam.split(",") as STAMP_EDITIONS[];
  }

  // Parse rarity parameters
  const rarityPreset = params.get("rarity");
  const rarityMin = params.get("rarityMin");
  const rarityMax = params.get("rarityMax");

  if (rarityPreset) {
    filtersPartial.rarity = {
      preset: rarityPreset as STAMP_RARITY,
      min: "",
      max: "",
    };
  } else if (rarityMin || rarityMax) {
    filtersPartial.rarity = {
      preset: null,
      min: rarityMin || "",
      max: rarityMax || "",
    };
  }

  return { ...defaultFilters, ...filtersPartial };
}

export function queryParamsToServicePayload(query: string) {
  return filtersToServicePayload(queryParamsToFilters(query));
}
