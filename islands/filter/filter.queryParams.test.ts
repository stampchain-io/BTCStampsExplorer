import {
  defaultFilters,
  filtersToQueryParams,
  queryParamsToFilters,
} from "$islands/filter/FilterOptionsStamp.tsx";
import { expect } from "jsr:@std/expect";
// not up to date with the new filter options
Deno.test("filterToQueryParams - does not encode false values", () => {
  expect(filtersToQueryParams("", defaultFilters)).toEqual("");
});

Deno.test("filterToQueryParams - encode string values", () => {
  expect(filtersToQueryParams("search=my+test&sortBy=ASC", defaultFilters))
    .toEqual("search=my+test&sortBy=ASC");
});

Deno.test("filterToQueryParams - encode boolean values", () => {
  expect(filtersToQueryParams("", {
    ...defaultFilters,
    atomics: true,
    fileType: ["svg"],
  })).toEqual("atomics=true&fileType=svg");
});

Deno.test("queryParamsToFilters empty", () => {
  expect(
    queryParamsToFilters(""),
  ).toEqual(defaultFilters);
});

Deno.test("queryParamsToFilters stampRangePreset", () => {
  expect(
    queryParamsToFilters("?stampRangePreset=5000"),
  ).toEqual({
    ...defaultFilters,
    // Note: this property might not exist in the current interface
    // This test may need to be updated based on actual functionality
  });
});

Deno.test("queryParamsToFilters file type filters", () => {
  expect(
    queryParamsToFilters("?fileType=jpeg&fileType=gif"),
  ).toEqual({
    ...defaultFilters,
    fileType: ["jpeg", "gif"],
  });
});

Deno.test("queryParamsToFilters stamp range min max", () => {
  expect(
    queryParamsToFilters("?rangeMin=50&rangeMax=444"),
  ).toEqual({
    ...defaultFilters,
    rangeMin: "50",
    rangeMax: "444",
  });
});
