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
  fileType: {
    jpg: boolean;
    png: boolean;
    gif: boolean;
    webp: boolean;
    avif: boolean;
    bmp: boolean;
    mp3: boolean;
    svg: boolean;
    html: boolean;
    legacy: boolean;
    olga: boolean;
  };
  editions: {
    single: boolean;
    multiple: boolean;
    locked: boolean;
    unlocked: boolean;
    divisible: boolean;
  };
  rarity: {
    sub: string | false;
    stampRange: {
      min: string;
      max: string;
    };
  };
  [key: string]: any; // Add index signature to allow string indexing
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
  fileType: {
    jpg: false,
    png: false,
    gif: false,
    webp: false,
    avif: false,
    bmp: false,
    mp3: false,
    svg: false,
    html: false,
    legacy: false,
    olga: false,
  },
  editions: {
    single: false,
    multiple: false,
    locked: false,
    unlocked: false,
    divisible: false,
  },
  rarity: {
    sub: false,
    stampRange: {
      min: "",
      max: "",
    },
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

  // Extract selected filetypes into a flat parameter
  const selectedFiletypes = Object.entries(filters.fileType)
    .filter(([_, selected]) => selected)
    .map(([type]) => type);

  // Remove all existing fileType nested parameters
  Array.from(queryParams.keys())
    .filter((key) => key.startsWith("fileType["))
    .forEach((key) => queryParams.delete(key));

  // Delete old flat parameter if it exists
  queryParams.delete("filetype");

  // Add the flat filetype parameter if we have selected types
  if (selectedFiletypes.length > 0) {
    queryParams.set("filetype", selectedFiletypes.join(","));
  }

  // NEW SECTION FOR EDITIONS
  // Extract selected editions into a flat parameter
  const selectedEditions = Object.entries(filters.editions)
    .filter(([_, selected]) => selected)
    .map(([type]) => type);

  // Remove all existing editions nested parameters
  Array.from(queryParams.keys())
    .filter((key) => key.startsWith("editions["))
    .forEach((key) => queryParams.delete(key));

  // Delete old flat parameter if it exists
  queryParams.delete("editions");

  // Add the flat editions parameter if we have selected types
  if (selectedEditions.length > 0) {
    queryParams.set("editions", selectedEditions.join(","));
  }
  // END OF NEW SECTION

  // NEW SECTION FOR RARITY
  // Remove all existing rarity nested parameters
  Array.from(queryParams.keys())
    .filter((key) => key.startsWith("rarity["))
    .forEach((key) => queryParams.delete(key));

  // Delete old flat parameters if they exist
  queryParams.delete("rarity");
  queryParams.delete("rarityMin");
  queryParams.delete("rarityMax");

  // Handle rarity filter
  if (filters.rarity.sub && filters.rarity.sub !== "stamp range") {
    // If using a preset (100, 1000, 5000, 10000)
    queryParams.set("rarity", filters.rarity.sub.toString());
  } else if (filters.rarity.stampRange) {
    // If using a custom range, use separate min/max parameters
    if (filters.rarity.stampRange.min) {
      queryParams.set("rarityMin", filters.rarity.stampRange.min);
    }
    if (filters.rarity.stampRange.max) {
      queryParams.set("rarityMax", filters.rarity.stampRange.max);
    }
  }
  // END OF NEW SECTION

  // Process other filter categories (unchanged)
  Object.entries(filters).forEach(([category, value]) => {
    // Skip categories we've handled separately
    if (
      category === "fileType" || category === "editions" ||
      category === "rarity"
    ) return;

    if (typeof value !== null && typeof value === "object") {
      Object.entries(value).forEach(([key, val]) => {
        // Handle price range
        if (category === "market" && key === "priceRange") {
          // Always clean up priceRange parameters first
          queryParams.delete(`${category}[${key}][min]`);
          queryParams.delete(`${category}[${key}][max]`);

          console.log("Price range values:", JSON.stringify(val, null, 2));

          // Add type guard to ensure val has min and max properties
          if (val && typeof val === "object" && "min" in val && "max" in val) {
            // Only add min parameter if it has a non-empty value
            if (val.min !== undefined && val.min !== null && val.min !== "") {
              console.log(`Adding min to URL: ${val.min}`);
              queryParams.append(
                `${category}[${key}][min]`,
                val.min.toString(),
              );
            }

            // Only add max parameter if it has a non-empty value
            if (val.max !== undefined && val.max !== null && val.max !== "") {
              console.log(`Adding max to URL: ${val.max}`);
              queryParams.append(
                `${category}[${key}][max]`,
                val.max.toString(),
              );
            }
          }

          return;
        }

        // Before trying to call toString(), check the type of val
        if (val !== null && val !== undefined) {
          const strVal = val.toString();

          if (typeof val === "boolean") {
            if (strVal !== "false") {
              queryParams.set(`${category}[${key}]`, strVal);
            } else {
              queryParams.delete(`${category}[${key}]`);
            }
          } else if (typeof val === "object") {
            // Skip objects as they're handled in the specific conditions above
            // This prevents trying to compare an object with an empty string
          } else if (val !== "") {
            queryParams.set(`${category}[${key}]`, strVal);
          }
        }
      });
    }
  });

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
  if (filters.fileType.jpg) {
    filterPayload.pixel.filetypeFilters.push("jpg");
    filterPayload.pixel.filetypeFilters.push("jpeg");
  }

  // PNG
  if (filters.fileType.png) {
    filterPayload.pixel.filetypeFilters.push("png");
  }

  // GIF
  if (filters.fileType.gif) {
    filterPayload.pixel.filetypeFilters.push("gif");
  }

  // WEBP
  if (filters.fileType.webp) {
    filterPayload.pixel.filetypeFilters.push("webp");
  }

  // AVIF
  if (filters.fileType.avif) {
    filterPayload.pixel.filetypeFilters.push("avif");
  }

  // BMP
  if (filters.fileType.bmp) {
    filterPayload.pixel.filetypeFilters.push("bmp");
  }

  // MP3/MPEG (combined)
  if (filters.fileType.mp3) {
    filterPayload.audio.filetypeFilters.push("mp3");
    filterPayload.audio.filetypeFilters.push("mpeg");
  }

  // SVG
  if (filters.fileType.svg) {
    filterPayload.vector.filetypeFilters.push("svg");
    filterPayload.recursive.filetypeFilters.push("svg");
  }

  // HTML
  if (filters.fileType.html) {
    filterPayload.vector.filetypeFilters.push("html");
    filterPayload.recursive.filetypeFilters.push("html");
  }

  // LEGACY
  if (filters.fileType.legacy) {
    filterPayload.encoding.filetypeFilters.push("legacy");
  }

  // OLGA
  if (filters.fileType.olga) {
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
  if (filters.editions.single) editionFilters.push("single");
  if (filters.editions.multiple) editionFilters.push("multiple");
  if (filters.editions.locked) editionFilters.push("locked");
  if (filters.editions.unlocked) editionFilters.push("unlocked");
  if (filters.editions.divisible) editionFilters.push("divisible");

  // Handle rarity as a single value (radio button selection)
  let rarityFilters: STAMP_RARITY | undefined = undefined;

  // If sub is selected and it's not "stamp range", use that value
  if (filters.rarity.sub && filters.rarity.sub !== "stamp range") {
    rarityFilters = filters.rarity.sub as STAMP_RARITY;
  } // If sub is "stamp range" or we have values in stampRange, use the custom range
  else if (
    (filters.rarity.sub === "stamp range" || !filters.rarity.sub) &&
    filters.rarity.stampRange &&
    (filters.rarity.stampRange.min || filters.rarity.stampRange.max)
  ) {
    rarityFilters = {
      stampRange: {
        min: filters.rarity.stampRange.min || "",
        max: filters.rarity.stampRange.max || "",
      },
    };
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
  // Flat filter parameters
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
  const filtersPartial: Partial<StampFilters> = {};

  // Handle flat filetype format
  const flatFiletype = params.get("filetype");
  if (flatFiletype) {
    const filetypeValues = flatFiletype.split(",");

    // Initialize fileType with default values
    filtersPartial.fileType = { ...defaultFilters.fileType };

    // Set selected filetypes to true
    filetypeValues.forEach((type) => {
      if (type in filtersPartial.fileType) {
        filtersPartial.fileType[type] = true;
      }
    });
  }

  // NEW SECTION FOR EDITIONS
  // Handle flat editions format
  const flatEditions = params.get("editions");
  if (flatEditions) {
    const editionsValues = flatEditions.split(",");

    // Initialize editions with default values
    filtersPartial.editions = { ...defaultFilters.editions };

    // Set selected editions to true
    editionsValues.forEach((type) => {
      if (type in filtersPartial.editions) {
        filtersPartial.editions[type] = true;
      }
    });
  }
  // END OF NEW SECTION

  // NEW SECTION FOR RARITY
  // Initialize rarity if we have any rarity-related parameters
  if (
    params.has("rarity") || params.has("rarityMin") || params.has("rarityMax")
  ) {
    filtersPartial.rarity = { ...defaultFilters.rarity };

    // Check if we have a preset rarity value
    const rarityValue = params.get("rarity");
    if (rarityValue && ["100", "1000", "5000", "10000"].includes(rarityValue)) {
      filtersPartial.rarity.sub = rarityValue;
    } // Check if we have min/max range values
    else if (params.has("rarityMin") || params.has("rarityMax")) {
      filtersPartial.rarity.sub = "stamp range";
      filtersPartial.rarity.stampRange = {
        min: params.get("rarityMin") || "",
        max: params.get("rarityMax") || "",
      };
    }
  }
  // END OF NEW SECTION

  // Process other categories (no changes needed)
  Object.keys(defaultFilters).forEach((category) => {
    // Skip categories we've handled separately
    if (
      category === "fileType" || category === "editions" ||
      category === "rarity"
    ) return;

    if (typeof defaultFilters[category as keyof StampFilters] === "object") {
      Object.keys(defaultFilters[category as keyof StampFilters] as any)
        .forEach((key) => {
          const value = params.get(`${category}[${key}]`);
          if (value !== null) {
            if (!filtersPartial[category as keyof StampFilters]) {
              filtersPartial[category as keyof StampFilters] = {
                ...defaultFilters[category as keyof StampFilters],
              } as any;
            }

            const categoryObj =
              filtersPartial[category as keyof StampFilters] as any;
            const defaultValue =
              (defaultFilters[category as keyof StampFilters] as any)[key];

            const coercedValue = typeof defaultValue === "boolean"
              ? JSON.parse(value)
              : typeof defaultValue === "number"
              ? parseInt(value)
              : value;

            categoryObj[key] = coercedValue;
          }
        });
    } else {
      const value = params.get(category);
      if (value !== null) {
        const defaultValue = defaultFilters[category as keyof StampFilters];
        const coercedValue = typeof defaultValue === "boolean"
          ? JSON.parse(value)
          : typeof defaultValue === "number"
          ? parseInt(value)
          : value;

        (filtersPartial as any)[category] = coercedValue;
      }
    }
  });

  return { ...defaultFilters, ...filtersPartial };
}

export function queryParamsToServicePayload(query: string) {
  return filtersToServicePayload(queryParamsToFilters(query));
}
