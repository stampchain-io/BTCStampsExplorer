import {
  STAMP_FILTER_TYPES,
  STAMP_SUFFIX_FILTERS,
  STAMP_TYPES,
} from "$globals";
import type { filterOptions } from "$lib/utils/filterOptions.ts";

// Define a type for the filters object
export type StampFilters = {
  market: {
    atomic: boolean;
    dispenser: boolean;
    trendingSales: boolean;
    sold: boolean;
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
    locked: boolean;
    oneOfOne: boolean;
    multiple: boolean;
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
    trendingSales: false,
    sold: false,
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
    locked: false,
    oneOfOne: false,
    multiple: false,
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
  const queryParams = new URLSearchParams(search);
  Object.entries(filters).forEach(([category, value]) => {
    if (typeof value !== null && typeof value === "object") {
      Object.entries(value).forEach(([key, val]) => {
        // Handle rarity parameters
        if (category === "rarity") {
          // If we have stampRange values, ignore sub
          if (key === "stampRange") {
            // Always clean up stampRange parameters first
            queryParams.delete(`${category}[${key}][min]`);
            queryParams.delete(`${category}[${key}][max]`);

            // Only add parameters if we have non-empty values
            if (val.min && val.min.toString().trim() !== "") {
              queryParams.append(`${category}[${key}][min]`, val.min);
            }
            if (val.max && val.max.toString().trim() !== "") {
              queryParams.append(`${category}[${key}][max]`, val.max);
            }
            return;
          }
        }

        // Handle price range
        if (category === "market" && key === "priceRange") {
          // Always clean up priceRange parameters first
          queryParams.delete(`${category}[${key}][min]`);
          queryParams.delete(`${category}[${key}][max]`);

          // Only add parameters if we have non-empty values
          if (val.min && val.min.toString().trim() !== "") {
            queryParams.append(`${category}[${key}][min]`, val.min);
          }
          if (val.max && val.max.toString().trim() !== "") {
            queryParams.append(`${category}[${key}][max]`, val.max);
          }
          return;
        }

        const strVal = val.toString();
        if (typeof val === "boolean") {
          if (strVal !== "false") {
            queryParams.set(`${category}[${key}]`, strVal);
          } else {
            queryParams.delete(`${category}[${key}]`);
          }
        } else if (val !== "") {
          queryParams.set(`${category}[${key}]`, strVal);
        }
      });
    }
  });
  return queryParams.toString();
}

export function filtersToServicePayload(filters: StampFilters) {
  // "pixel"
  // "vector"
  // "for sale"
  // "trending sales"
  // "sold"
  const filterPayload = {
    vector: {
      suffixFilters: [] as Partial<
        typeof filterOptions["vector"]["suffixFilters"]
      >,
      ident: ["STAMP"],
    },
    pixel: {
      suffixFilters: [] as Partial<
        typeof filterOptions["pixel"]["suffixFilters"]
      >,
      ident: ["STAMP, SRC-721"],
    },
    recursive: {
      suffixFilters: [] as Partial<
        typeof filterOptions["recursive"]["suffixFilters"]
      >,
      ident: ["SRC-721"],
    },
    audio: {
      suffixFilters: [] as Partial<
        typeof filterOptions["audio"]["suffixFilters"]
      >,
      ident: ["STAMP"],
    },
    encoding: { // Combined category for Legacy and Olga
      suffixFilters: [] as Partial<
        typeof filterOptions["encoding"]["suffixFilters"]
      >,
      ident: ["STAMP"],
    },
  };

  // JPG/JPEG (combined)
  if (filters.fileType.jpg) {
    filterPayload.pixel.suffixFilters.push("jpg");
    filterPayload.pixel.suffixFilters.push("jpeg");
  }

  // PNG
  if (filters.fileType.png) {
    filterPayload.pixel.suffixFilters.push("png");
  }

  // GIF
  if (filters.fileType.gif) {
    filterPayload.pixel.suffixFilters.push("gif");
  }

  // WEBP
  if (filters.fileType.webp) {
    filterPayload.pixel.suffixFilters.push("webp");
  }

  // AVIF
  if (filters.fileType.avif) {
    filterPayload.pixel.suffixFilters.push("avif");
  }

  // BMP
  if (filters.fileType.bmp) {
    filterPayload.pixel.suffixFilters.push("bmp");
  }

  // MP3/MPEG (combined)
  if (filters.fileType.mp3) {
    filterPayload.audio.suffixFilters.push("mp3");
    filterPayload.audio.suffixFilters.push("mpeg");
  }

  // SVG
  if (filters.fileType.svg) {
    filterPayload.vector.suffixFilters.push("svg");
    filterPayload.recursive.suffixFilters.push("svg");
  }

  // HTML
  if (filters.fileType.html) {
    filterPayload.vector.suffixFilters.push("html");
    filterPayload.recursive.suffixFilters.push("html");
  }

  // LEGACY
  if (filters.fileType.legacy) {
    filterPayload.encoding.suffixFilters.push("legacy");
  }

  // OLGA
  if (filters.fileType.olga) {
    filterPayload.encoding.suffixFilters.push("olga");
  }

  const suffixFilters = Object.entries(filterPayload).reduce(
    (acc, [key, value]) => {
      if (value.suffixFilters.length > 0) {
        acc.push(...value.suffixFilters);
      }
      return acc;
    },
    [] as STAMP_SUFFIX_FILTERS[],
  );

  return {
    // handle all for now
    ident: [], // Array.from(new Set(ident)),
    suffixFilters: Array.from(new Set(suffixFilters)),
  };
}

// export function queryParamsToServicePayload(query: URLSearchParams): {
//   filterBy: STAMP_FILTER_TYPES[];
// } {
//   return {
//     filterBy: [],
//   };
// }

export const allQueryKeysFromFilters = [
  // Market filters
  "market[atomic]",
  "market[dispenser]",
  "market[trendingSales]",
  "market[sold]",
  "market[priceRange][min]",
  "market[priceRange][max]",

  // File type filters
  "fileType[jpg]",
  "fileType[jpeg]",
  "fileType[png]",
  "fileType[gif]",
  "fileType[webp]",
  "fileType[avif]",
  "fileType[bmp]",
  "fileType[mp3]",
  "fileType[mpeg]",
  "fileType[svg]",
  "fileType[html]",
  "fileType[legacy]",
  "fileType[olga]",

  // Editions filters
  "editions[locked]",
  "editions[oneOfOne]",
  "editions[multiple]",
  "editions[unlocked]",
  "editions[divisible]",

  // Rarity filters
  "rarity[sub]",
  "rarity[stampRange][min]",
  "rarity[stampRange][max]",
];

export function queryParamsToFilters(query: string): StampFilters {
  const params = new URLSearchParams(query);
  const filtersPartial: Partial<StampFilters> = {};

  Object.keys(defaultFilters).forEach((category) => {
    if (category in defaultFilters) {
      const filter = defaultFilters[category as keyof StampFilters];
      if (typeof filter === "object") {
        Object.keys(filter).forEach((key) => {
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
    }
  });

  return { ...defaultFilters, ...filtersPartial };
}

export function queryParamsToServicePayload(query: string) {
  return filtersToServicePayload(queryParamsToFilters(query));
}
