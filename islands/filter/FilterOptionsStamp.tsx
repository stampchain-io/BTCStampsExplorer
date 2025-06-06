import {
  STAMP_EDITIONS,
  STAMP_FILETYPES,
  STAMP_MARKET,
  STAMP_RANGES,
} from "$globals";

export type StampFilters = {
  market: STAMP_MARKET[];
  marketMin: string;
  marketMax: string;
  fileType: STAMP_FILETYPES[];
  editions: STAMP_EDITIONS[];
  range: STAMP_RANGES | null;
  rangeMin: string;
  rangeMax: string;
  [key: string]: any; // Keep index signature for flexibility
};

export const defaultFilters: StampFilters = {
  market: [],
  marketMin: "",
  marketMax: "",
  fileType: [],
  editions: [],
  range: null,
  rangeMin: "",
  rangeMax: "",
};

export function filtersToQueryParams(
  search: string,
  filters: StampFilters,
) {
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
    // Convert 'jpg' to 'jpeg' and 'mp3' to 'mpeg' in the URL parameters
    const fileTypes = filters.fileType.map((type) => {
      if (type === "jpg") return "jpeg";
      if (type === "mp3") return "mpeg";
      return type;
    });
    queryParams.set("filetype", fileTypes.join(","));
  } else {
    queryParams.delete("filetype");
  }

  // EDITIONS
  if (filters.editions.length > 0) {
    queryParams.set("editions", filters.editions.join(","));
  } else {
    queryParams.delete("editions");
  }

  // RANGE (flattened structure)
  if (filters.range) {
    queryParams.set("range", filters.range);
  } else {
    queryParams.delete("range");
  }

  if (filters.rangeMin) {
    queryParams.set("rangeMin", filters.rangeMin);
  } else {
    queryParams.delete("rangeMin");
  }

  if (filters.rangeMax) {
    queryParams.set("rangeMax", filters.rangeMax);
  } else {
    queryParams.delete("rangeMax");
  }

  const result = queryParams.toString();
  return result;
}

export function filtersToServicePayload(filters: StampFilters) {
  // Collect filters with proper types
  const filetypeFilters = filters.fileType;
  const editionFilters = filters.editions;
  const marketFilters = filters.market;

  // Handle range
  let rangeFilters: STAMP_RANGES | undefined = undefined;
  if (filters.range) {
    rangeFilters = filters.range;
  } else if (filters.rangeMin || filters.rangeMax) {
    rangeFilters = "custom";
  }

  const result = {
    ident: [],
    filetypeFilters: filetypeFilters.length > 0 ? filetypeFilters : undefined,
    editionFilters: editionFilters.length > 0 ? editionFilters : undefined,
    rangeFilters: rangeFilters || undefined,
    rangeMin: filters.rangeMin || undefined,
    rangeMax: filters.rangeMax || undefined,
    marketFilters: marketFilters.length > 0 ? marketFilters : undefined,
    marketMin: filters.marketMin || undefined,
    marketMax: filters.marketMax || undefined,
  };

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
  "range",
  "rangeMin",
  "rangeMax",
];

export function queryParamsToFilters(query: string): StampFilters {
  const params = new URLSearchParams(query);
  const filtersPartial: Partial<StampFilters> = {
    market: [],
    marketMin: "",
    marketMax: "",
    fileType: [],
    editions: [],
    range: null,
    rangeMin: "",
    rangeMax: "",
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

  // Parse range parameters (flat structure)
  const range = params.get("range");
  if (range) {
    filtersPartial.range = range as STAMP_RANGES;
  }

  const rangeMin = params.get("rangeMin");
  if (rangeMin) {
    filtersPartial.rangeMin = rangeMin;
  }

  const rangeMax = params.get("rangeMax");
  if (rangeMax) {
    filtersPartial.rangeMax = rangeMax;
  }

  const result = { ...defaultFilters, ...filtersPartial };
  return result;
}

export function queryParamsToServicePayload(query: string) {
  return filtersToServicePayload(queryParamsToFilters(query));
}
