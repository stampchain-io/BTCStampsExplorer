import { assertEquals, assertInstanceOf } from "@std/assert";
import { getPaginationParams, paginate } from "$lib/utils/paginationUtils.ts";

Deno.test("paginationUtils - getPaginationParams with default values", () => {
  const url = new URL("https://example.com/api/stamps");
  const result = getPaginationParams(url);

  assertInstanceOf(result, Object);
  if (!(result instanceof Response)) {
    assertEquals(
      result.limit,
      500,
      "Default limit should be 500 for non-wallet paths",
    );
    assertEquals(result.page, 1, "Default page should be 1");
  }
});

Deno.test("paginationUtils - getPaginationParams with wallet path", () => {
  const url = new URL("https://example.com/wallet/address123");
  const result = getPaginationParams(url);

  assertInstanceOf(result, Object);
  if (!(result instanceof Response)) {
    assertEquals(
      result.limit,
      32,
      "Default limit should be 32 for wallet paths",
    );
    assertEquals(result.page, 1, "Default page should be 1");
  }
});

Deno.test("paginationUtils - getPaginationParams with wallet path and src20 type", () => {
  const url = new URL("https://example.com/wallet/address123");
  const result = getPaginationParams(url, "src20");

  assertInstanceOf(result, Object);
  if (!(result instanceof Response)) {
    assertEquals(
      result.limit,
      8,
      "Default limit should be 8 for wallet paths with src20 type",
    );
    assertEquals(result.page, 1, "Default page should be 1");
  }
});

Deno.test("paginationUtils - getPaginationParams with custom values", () => {
  const url = new URL("https://example.com/api/stamps?limit=100&page=5");
  const result = getPaginationParams(url);

  assertInstanceOf(result, Object);
  if (!(result instanceof Response)) {
    assertEquals(
      result.limit,
      100,
      "Should use custom limit from query params",
    );
    assertEquals(result.page, 5, "Should use custom page from query params");
  }
});

Deno.test("paginationUtils - getPaginationParams with type prefix", () => {
  const url = new URL(
    "https://example.com/api/stamps?src20_limit=25&src20_page=3",
  );
  const result = getPaginationParams(url, "src20");

  assertInstanceOf(result, Object);
  if (!(result instanceof Response)) {
    assertEquals(
      result.limit,
      25,
      "Should use prefixed limit from query params",
    );
    assertEquals(result.page, 3, "Should use prefixed page from query params");
  }
});

Deno.test("paginationUtils - getPaginationParams with invalid limit", () => {
  // Test invalid limit values that should return error responses
  const invalidCases = [
    { url: "https://example.com/api/stamps?limit=0", desc: "zero limit" },
    { url: "https://example.com/api/stamps?limit=-5", desc: "negative limit" },
    {
      url: "https://example.com/api/stamps?limit=abc",
      desc: "non-numeric limit",
    },
  ];

  for (const testCase of invalidCases) {
    const url = new URL(testCase.url);
    const result = getPaginationParams(url);

    assertInstanceOf(
      result,
      Response,
      `Should return Response for ${testCase.desc}`,
    );
    if (result instanceof Response) {
      assertEquals(
        result.status,
        400,
        `Should return 400 status for ${testCase.desc}`,
      );
    }
  }

  // Empty limit should use default value
  const url = new URL("https://example.com/api/stamps?limit=");
  const result = getPaginationParams(url);

  assertInstanceOf(
    result,
    Object,
    "Should return params object for empty limit",
  );
  if (!(result instanceof Response)) {
    assertEquals(result.limit, 500, "Should use default limit for empty limit");
    assertEquals(result.page, 1, "Should use default page");
  }
});

Deno.test("paginationUtils - getPaginationParams with invalid page", () => {
  // Test invalid page values that should return error responses
  const invalidCases = [
    { url: "https://example.com/api/stamps?page=0", desc: "zero page" },
    { url: "https://example.com/api/stamps?page=-1", desc: "negative page" },
    {
      url: "https://example.com/api/stamps?page=xyz",
      desc: "non-numeric page",
    },
  ];

  for (const testCase of invalidCases) {
    const url = new URL(testCase.url);
    const result = getPaginationParams(url);

    assertInstanceOf(
      result,
      Response,
      `Should return Response for ${testCase.desc}`,
    );
    if (result instanceof Response) {
      assertEquals(
        result.status,
        400,
        `Should return 400 status for ${testCase.desc}`,
      );
    }
  }

  // Empty page should use default value
  const url = new URL("https://example.com/api/stamps?page=");
  const result = getPaginationParams(url);

  assertInstanceOf(
    result,
    Object,
    "Should return params object for empty page",
  );
  if (!(result instanceof Response)) {
    assertEquals(result.limit, 500, "Should use default limit");
    assertEquals(result.page, 1, "Should use default page for empty page");
  }
});

Deno.test("paginationUtils - paginate basic functionality", () => {
  const result = paginate(100, 1, 10);

  assertEquals(result.page, 1);
  assertEquals(result.limit, 10);
  assertEquals(result.totalPages, 10);
  assertEquals(result.total, 100);
});

Deno.test("paginationUtils - paginate with different values", () => {
  const testCases = [
    { total: 95, page: 2, limit: 20, expectedPages: 5 },
    { total: 1, page: 1, limit: 10, expectedPages: 1 },
    { total: 0, page: 1, limit: 10, expectedPages: 0 },
    { total: 101, page: 5, limit: 25, expectedPages: 5 },
    { total: 50, page: 3, limit: 50, expectedPages: 1 },
  ];

  for (const testCase of testCases) {
    const result = paginate(testCase.total, testCase.page, testCase.limit);

    assertEquals(result.page, testCase.page);
    assertEquals(result.limit, testCase.limit);
    assertEquals(result.totalPages, testCase.expectedPages);
    assertEquals(result.total, testCase.total);
  }
});

Deno.test("paginationUtils - paginate with default parameters", () => {
  // Test with only total
  const result1 = paginate(100);
  assertEquals(result1.page, 1, "Default page should be 1");
  assertEquals(result1.limit, 10, "Default limit should be 10");
  assertEquals(result1.totalPages, 10);
  assertEquals(result1.total, 100);

  // Test with total and page
  const result2 = paginate(100, 3);
  assertEquals(result2.page, 3);
  assertEquals(result2.limit, 10, "Default limit should be 10");
  assertEquals(result2.totalPages, 10);
  assertEquals(result2.total, 100);
});
