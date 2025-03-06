import {
  filtersToQueryParams,
  queryParamsToFilters,
} from "../stamp/StampFilter.tsx";
import { expect } from "jsr:@std/expect";

Deno.test("filterToQueryParams - does not encode false values", () => {
  expect(filtersToQueryParams("", {
    search: "",
    buyNow: {
      atomic: false,
      dispenser: false,
    },
    status: {
      locked: false,
      oneOfOne: false,
    },
    fileType: {
      svg: false,
      pixel: false,
      gif: false,
      html: false,
      olga: false,
      src721: false,
      src101: false,
      bmp: false,
      jpeg: false,
      jpg: false,
      png: false,
      webp: false,
    },
    stampRangePreset: 10000,
    stampRange: {
      min: "",
      max: "",
    },
    priceRange: {
      min: "",
      max: "",
    },
    sortOrder: "",
  })).toEqual("");
});

// ... rest of tests remain the same ...
