import { assert, assertEquals } from "@std/assert";
import { filterOptions } from "$lib/utils/filterOptions.ts";

Deno.test("filterOptions - has expected filter types", () => {
  const expectedTypes = ["vector", "pixel", "recursive", "audio", "encoding"];
  const actualTypes = Object.keys(filterOptions);

  assertEquals(
    actualTypes.sort(),
    expectedTypes.sort(),
    "Should have all expected filter types",
  );
});

Deno.test("filterOptions - vector filter structure", () => {
  const vector = filterOptions.vector;

  assert(
    Array.isArray(vector.suffixFilters),
    "suffixFilters should be an array",
  );
  assert(Array.isArray(vector.ident), "ident should be an array");

  assertEquals(
    vector.suffixFilters,
    ["svg", "html"],
    "Vector should support svg and html",
  );
  assertEquals(vector.ident, ["STAMP"], "Vector should only support STAMP");
});

Deno.test("filterOptions - pixel filter structure", () => {
  const pixel = filterOptions.pixel;

  assert(
    Array.isArray(pixel.suffixFilters),
    "suffixFilters should be an array",
  );
  assert(Array.isArray(pixel.ident), "ident should be an array");

  const expectedFormats = ["gif", "jpg", "png", "webp", "avif", "bmp", "jpeg"];
  assertEquals(
    pixel.suffixFilters,
    expectedFormats,
    "Pixel should support common image formats",
  );
  assertEquals(
    pixel.ident,
    ["STAMP", "SRC-721"],
    "Pixel should support STAMP and SRC-721",
  );
});

Deno.test("filterOptions - recursive filter structure", () => {
  const recursive = filterOptions.recursive;

  assertEquals(
    recursive.suffixFilters,
    ["svg", "html"],
    "Recursive should support svg and html",
  );
  assertEquals(
    recursive.ident,
    ["SRC-721"],
    "Recursive should only support SRC-721",
  );
});

Deno.test("filterOptions - audio filter structure", () => {
  const audio = filterOptions.audio;

  assertEquals(
    audio.suffixFilters,
    ["mp3", "mpeg"],
    "Audio should support mp3 and mpeg",
  );
  assertEquals(audio.ident, ["STAMP"], "Audio should only support STAMP");
});

Deno.test("filterOptions - encoding filter structure", () => {
  const encoding = filterOptions.encoding;

  assertEquals(
    encoding.suffixFilters,
    ["legacy", "olga"],
    "Encoding should support legacy and olga",
  );
  assertEquals(encoding.ident, ["STAMP"], "Encoding should only support STAMP");
});

Deno.test("filterOptions - all filters have required properties", () => {
  for (const [filterType, filterConfig] of Object.entries(filterOptions)) {
    assert(
      "suffixFilters" in filterConfig,
      `${filterType} should have suffixFilters property`,
    );
    assert(
      "ident" in filterConfig,
      `${filterType} should have ident property`,
    );
    assert(
      Array.isArray(filterConfig.suffixFilters),
      `${filterType}.suffixFilters should be an array`,
    );
    assert(
      Array.isArray(filterConfig.ident),
      `${filterType}.ident should be an array`,
    );
    assert(
      filterConfig.suffixFilters.length > 0,
      `${filterType}.suffixFilters should not be empty`,
    );
    assert(
      filterConfig.ident.length > 0,
      `${filterType}.ident should not be empty`,
    );
  }
});

Deno.test("filterOptions - no duplicate suffix filters within each type", () => {
  for (const [filterType, filterConfig] of Object.entries(filterOptions)) {
    const suffixes = filterConfig.suffixFilters;
    const uniqueSuffixes = [...new Set(suffixes)];

    assertEquals(
      suffixes.length,
      uniqueSuffixes.length,
      `${filterType} should not have duplicate suffix filters`,
    );
  }
});
