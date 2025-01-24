import {
  filtersToQueryParams,
  queryParamsToFilters,
} from "./StampFilterPane.tsx";
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
    },
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

Deno.test("filterToQueryParams - encode string values", () => {
  expect(filtersToQueryParams("", {
    search: "my test",
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
      min: "",
      max: "",
    },
    priceRange: {
      min: "",
      max: "",
    },
    sortOrder: "price_asc",
  })).toEqual("search=my+test&sortOrder=price_asc");
});

Deno.test("filterToQueryParams - encode boolean values", () => {
  expect(filtersToQueryParams("", {
    search: "",
    buyNow: {
      atomic: true,
      dispenser: false,
    },
    status: {
      locked: false,
      oneOfOne: false,
    },
    fileType: {
      svg: true,
      pixel: false,
      gif: false,
      html: false,
      olga: false,
      src721: false,
      src101: false,
    },
    stampRange: {
      min: "",
      max: "",
    },
    priceRange: {
      min: "",
      max: "",
    },
    sortOrder: "",
  })).toEqual("buyNow%5Batomic%5D=true&fileType%5Bsvg%5D=true");
});

Deno.test("queryParamsToFilters", () => {
  expect(
    queryParamsToFilters(
      "?stampRange%5Bpreset%5D=&stampRange%5Bcustom%5D=%5Bobject+Object%5D&priceRange%5Bmin%5D=&priceRange%5Bmax%5D=",
    ),
  ).toEqual({});
});
