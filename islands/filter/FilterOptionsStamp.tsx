import { STAMP_EDITIONS, STAMP_FILETYPES, STAMP_RARITY } from "$globals";
import type { filterOptions } from "$lib/utils/filterOptions.ts";

// Define a type for the filters object
export type StampFilters = {
  market: {
    atomic: boolean;
    dispenser: boolean;
    listings: boolean;
    sales: boolean;
    priceRange: {
      min: string;
      max: string;
    };
  };
  fileType: string[];
  editions: string[];
  rarity: {
    preset: string | null;
    min: string;
    max: string;
  };
  [key: string]: any; // Keep index signature for flexibility
};

// Update the defaultFilters declaration to export it
export const defaultFilters: StampFilters = {
  market: {
    atomic: false,
    dispenser: false,
    listings: false,
    sales: false,
    priceRange: {
      min: "",
      max: "",
    },
  },
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

  // FILETYPE - already fixed (flat format)
  if (filters.fileType.length > 0) {
    queryParams.set("filetype", filters.fileType.join(","));
  } else {
    queryParams.delete("filetype");
  }

  // EDITIONS - already fixed (flat format)
  if (filters.editions.length > 0) {
    queryParams.set("editions", filters.editions.join(","));
  } else {
    queryParams.delete("editions");
  }

  // FIX FOR RARITY - handle both new and transitional structure
  // Delete any existing rarity parameters
  queryParams.delete("rarity");
  queryParams.delete("rarityMin");
  queryParams.delete("rarityMax");

  // Check for preset first (from either structure)
  if (filters.rarity.preset) {
    queryParams.set("rarity", filters.rarity.preset);
  } else if (
    filters.rarity.sub && filters.rarity.sub !== "stamp range" &&
    filters.rarity.sub !== false
  ) {
    // Handle transitional structure (during implementation)
    queryParams.set("rarity", filters.rarity.sub.toString());
  } // Handle custom range values from either structure
  else {
    // Check new structure first
    if (filters.rarity.min) {
      queryParams.set("rarityMin", filters.rarity.min);
    }
    if (filters.rarity.max) {
      queryParams.set("rarityMax", filters.rarity.max);
    }

    // Check transitional structure if needed
    if (
      !filters.rarity.min && !filters.rarity.max && filters.rarity.stampRange
    ) {
      if (filters.rarity.stampRange.min) {
        queryParams.set("rarityMin", filters.rarity.stampRange.min);
      }
      if (filters.rarity.stampRange.max) {
        queryParams.set("rarityMax", filters.rarity.stampRange.max);
      }
    }
  }

  // Market filters (keep as is)
  for (const [key, value] of Object.entries(filters.market)) {
    if (key === "priceRange") {
      if (value.min) {
        queryParams.set(`market[priceRange][min]`, value.min);
      } else {
        queryParams.delete(`market[priceRange][min]`);
      }
      if (value.max) {
        queryParams.set(`market[priceRange][max]`, value.max);
      } else {
        queryParams.delete(`market[priceRange][max]`);
      }
    } else if (value === true) {
      queryParams.set(`market[${key}]`, "true");
    } else {
      queryParams.delete(`market[${key}]`);
    }
  }

  const result = queryParams.toString();
  console.log("Final query params:", result);
  return result;
}

export function filtersToServicePayload(filters: StampFilters) {
  const filterPayload = {
    vector: {
      filetypeFilters: [] as STAMP_FILETYPES[],
      ident: ["STAMP"],
    },
    pixel: {
      filetypeFilters: [] as STAMP_FILETYPES[],
      ident: ["STAMP, SRC-721"],
    },
    recursive: {
      filetypeFilters: [] as STAMP_FILETYPES[],
      ident: ["SRC-721"],
    },
    audio: {
      filetypeFilters: [] as STAMP_FILETYPES[],
      ident: ["STAMP"],
    },
    encoding: {
      filetypeFilters: [] as STAMP_FILETYPES[],
      ident: ["STAMP"],
    },
  };

  // JPG/JPEG (combined)
  if (filters.fileType.includes("jpg")) {
    filterPayload.pixel.filetypeFilters.push("jpg");
    filterPayload.pixel.filetypeFilters.push("jpeg");
  }

  // PNG
  if (filters.fileType.includes("png")) {
    filterPayload.pixel.filetypeFilters.push("png");
  }

  // GIF
  if (filters.fileType.includes("gif")) {
    filterPayload.pixel.filetypeFilters.push("gif");
  }

  // WEBP
  if (filters.fileType.includes("webp")) {
    filterPayload.pixel.filetypeFilters.push("webp");
  }

  // AVIF
  if (filters.fileType.includes("avif")) {
    filterPayload.pixel.filetypeFilters.push("avif");
  }

  // BMP
  if (filters.fileType.includes("bmp")) {
    filterPayload.pixel.filetypeFilters.push("bmp");
  }

  // MP3/MPEG (combined)
  if (filters.fileType.includes("mp3")) {
    filterPayload.audio.filetypeFilters.push("mp3");
    filterPayload.audio.filetypeFilters.push("mpeg");
  }

  // SVG
  if (filters.fileType.includes("svg")) {
    filterPayload.vector.filetypeFilters.push("svg");
    filterPayload.recursive.filetypeFilters.push("svg");
  }

  // HTML
  if (filters.fileType.includes("html")) {
    filterPayload.vector.filetypeFilters.push("html");
    filterPayload.recursive.filetypeFilters.push("html");
  }

  // LEGACY
  if (filters.fileType.includes("legacy")) {
    filterPayload.encoding.filetypeFilters.push("legacy");
  }

  // OLGA
  if (filters.fileType.includes("olga")) {
    filterPayload.encoding.filetypeFilters.push("olga");
  }

  // Collect all file types into a single array
  const filetypeFilters = Object.entries(filterPayload).reduce(
    (acc, [key, value]) => {
      if (value.filetypeFilters.length > 0) {
        acc.push(...value.filetypeFilters);
      }
      return acc;
    },
    [] as STAMP_FILETYPES[],
  );

  // Collect edition filters
  const editionFilters: STAMP_EDITIONS[] = [];
  if (filters.editions.includes("single")) editionFilters.push("single");
  if (filters.editions.includes("multiple")) editionFilters.push("multiple");
  if (filters.editions.includes("locked")) editionFilters.push("locked");
  if (filters.editions.includes("unlocked")) editionFilters.push("unlocked");
  if (filters.editions.includes("divisible")) editionFilters.push("divisible");

  // Handle rarity as a single value (radio button selection)
  let rarityFilters: STAMP_RARITY | undefined = undefined;

  // If sub is selected and it's not "stamp range", use that value
  if (filters.rarity.preset) {
    rarityFilters = filters.rarity.preset as STAMP_RARITY;
  } else if (filters.rarity.min || filters.rarity.max) {
    rarityFilters = "custom" as STAMP_RARITY;
  }

  // After extracting the filters
  console.log("Extracted filetypeFilters:", filetypeFilters);
  console.log("Extracted editionFilters:", editionFilters);
  console.log("Extracted rarityFilters:", rarityFilters);

  // Before returning
  const result = {
    ident: [],
    filetypeFilters: Array.from(new Set(filetypeFilters)),
    editionFilters: editionFilters.length > 0 ? editionFilters : undefined,
    rarityFilters: rarityFilters,
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
  "filetype",
  "editions",
  "rarity",
  "rarityMin",
  "rarityMax",

  // Market filters
  "market[atomic]",
  "market[dispenser]",
  "market[listings]",
  "market[sales]",
  "market[priceRange][min]",
  "market[priceRange][max]",
];

export function queryParamsToFilters(query: string): StampFilters {
  const params = new URLSearchParams(query);
  const filtersPartial: Partial<StampFilters> = {
    fileType: [],
    editions: [],
    rarity: {
      preset: null,
      min: "",
      max: "",
    },
    market: { ...defaultFilters.market },
  };

  // Parse filetype parameter (comma-separated string to array)
  const filetypeParam = params.get("filetype");
  if (filetypeParam) {
    filtersPartial.fileType = filetypeParam.split(",");
  }

  // Parse editions parameter (comma-separated string to array)
  const editionsParam = params.get("editions");
  if (editionsParam) {
    filtersPartial.editions = editionsParam.split(",");
  }

  // Parse rarity parameters
  const rarityPreset = params.get("rarity");
  const rarityMin = params.get("rarityMin");
  const rarityMax = params.get("rarityMax");

  // Set rarity values based on parameters
  if (rarityPreset) {
    filtersPartial.rarity = {
      preset: rarityPreset,
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

  // Parse market filters (keep as is for now)
  for (const key of Object.keys(defaultFilters.market)) {
    if (key === "priceRange") continue;
    const value = params.get(`market[${key}]`);
    if (filtersPartial.market) {
      filtersPartial.market[key as keyof typeof filtersPartial.market] =
        value === "true";
    }
  }

  // Handle price range
  const minPrice = params.get("market[priceRange][min]");
  const maxPrice = params.get("market[priceRange][max]");
  if (minPrice || maxPrice) {
    if (filtersPartial.market) {
      filtersPartial.market.priceRange = {
        min: minPrice || "",
        max: maxPrice || "",
      };
    }
  }

  return { ...defaultFilters, ...filtersPartial };
}

export function queryParamsToServicePayload(query: string) {
  return filtersToServicePayload(queryParamsToFilters(query));
}
