import {
  filtersToQueryParams,
  queryParamsToFilters,
} from "./StampFilterPane.tsx";
import { expect } from "jsr:@std/expect";

Deno.test("filterToQueryParams - does not encode false values", () => {
  expect(filtersToQueryParams("", {
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
    },
    stampRange: {
      preset: "",
      custom: {
        min: "",
        max: "",
      },
    },
    priceRange: {
      min: "",
      max: "",
    },
    sortOrder: "descending",
  })).toEqual("");
});

Deno.test("queryParamsToFilters", () => {
  expect(
    queryParamsToFilters(
      "?stampRange%5Bpreset%5D=&stampRange%5Bcustom%5D=%5Bobject+Object%5D&priceRange%5Bmin%5D=&priceRange%5Bmax%5D=",
    ),
  ).toEqual({});
});
