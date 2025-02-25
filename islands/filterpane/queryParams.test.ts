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
  })).toEqual("buyNow%5Batomic%5D=true&fileType%5Bsvg%5D=true");
});

Deno.test("queryParamsToFilters empty", () => {
  expect(
    queryParamsToFilters(
      "",
    ),
  ).toEqual({
    buyNow: {
      atomic: false,
      dispenser: false,
    },
    fileType: {
      bmp: false,
      gif: false,
      html: false,
      jpeg: false,
      jpg: false,
      olga: false,
      pixel: false,
      png: false,
      src101: false,
      src721: false,
      svg: false,
      webp: false,
    },
    priceRange: {
      max: "",
      min: "",
    },
    search: "",
    sortOrder: "",
    stampRange: {
      max: "",
      min: "",
    },
    stampRangePreset: 10000,
    status: {
      locked: false,
      oneOfOne: false,
    },
  });
});

Deno.test("queryParamsToFilters stampRangePreset", () => {
  expect(
    queryParamsToFilters(
      "?stampRangePreset=5000",
    ),
  ).toEqual({
    buyNow: {
      atomic: false,
      dispenser: false,
    },
    fileType: {
      bmp: false,
      gif: false,
      html: false,
      jpeg: false,
      jpg: false,
      olga: false,
      pixel: false,
      png: false,
      src101: false,
      src721: false,
      svg: false,
      webp: false,
    },
    priceRange: {
      max: "",
      min: "",
    },
    search: "",
    sortOrder: "",
    stampRange: {
      max: "",
      min: "",
    },
    stampRangePreset: 5000,
    status: {
      locked: false,
      oneOfOne: false,
    },
  });
});

Deno.test("queryParamsToFilters file type filters", () => {
  expect(
    queryParamsToFilters(
      "?fileType%5Bjpeg%5D=true&fileType%5Bgif%5D=true",
    ),
  ).toEqual({
    buyNow: {
      atomic: false,
      dispenser: false,
    },
    fileType: {
      bmp: false,
      gif: true,
      html: false,
      jpeg: true,
      jpg: false,
      olga: false,
      pixel: false,
      png: false,
      src101: false,
      src721: false,
      svg: false,
      webp: false,
    },
    priceRange: {
      max: "",
      min: "",
    },
    search: "",
    sortOrder: "",
    stampRange: {
      max: "",
      min: "",
    },
    stampRangePreset: 10000,
    status: {
      locked: false,
      oneOfOne: false,
    },
  });
});

Deno.test("queryParamsToFilters stamp range min max", () => {
  expect(
    queryParamsToFilters(
      "?stampRange%5Bmin%5D=50&stampRange%5Bmax%5D=444",
    ),
  ).toEqual({
    buyNow: {
      atomic: false,
      dispenser: false,
    },
    fileType: {
      bmp: false,
      gif: false,
      html: false,
      jpeg: false,
      jpg: false,
      olga: false,
      pixel: false,
      png: false,
      src101: false,
      src721: false,
      svg: false,
      webp: false,
    },
    priceRange: {
      max: "",
      min: "",
    },
    search: "",
    sortOrder: "",
    stampRange: {
      max: "444",
      min: "50",
    },
    stampRangePreset: 10000,
    status: {
      locked: false,
      oneOfOne: false,
    },
  });
});
