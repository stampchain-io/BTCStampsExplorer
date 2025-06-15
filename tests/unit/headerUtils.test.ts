import { assert, assertEquals } from "@std/assert";
import { normalizeHeaders } from "$lib/utils/headerUtils.ts";

Deno.test("headerUtils - normalizeHeaders with Headers object", () => {
  const headers = new Headers({
    "content-type": "text/html",
    "x-custom": "value",
  });

  const normalized = normalizeHeaders(headers);

  assertEquals(
    normalized.get("content-type"),
    "text/html; charset=utf-8",
    "Should add charset to text content",
  );
  assertEquals(
    normalized.get("x-custom"),
    "value",
    "Should preserve custom headers",
  );
  assert(
    normalized.get("vary")?.includes("Accept-Encoding"),
    "Should include Accept-Encoding in vary",
  );
  assert(
    normalized.get("vary")?.includes("X-API-Version"),
    "Should include X-API-Version in vary",
  );
  assert(
    normalized.get("vary")?.includes("Origin"),
    "Should include Origin in vary",
  );
});

Deno.test("headerUtils - normalizeHeaders with plain object", () => {
  const headers = {
    "content-type": "application/json",
    "cache-control": "no-cache",
  };

  const normalized = normalizeHeaders(headers);

  assertEquals(
    normalized.get("content-type"),
    "application/json",
    "Should not add charset to non-text content",
  );
  assertEquals(
    normalized.get("cache-control"),
    "no-cache",
    "Should preserve cache control",
  );
  assert(normalized.get("vary") !== null, "Should have vary header");
});

Deno.test("headerUtils - normalizeHeaders handles text-based content types", () => {
  const testCases = [
    { input: "text/plain", expected: "text/plain; charset=utf-8" },
    { input: "text/css", expected: "text/css; charset=utf-8" },
    {
      input: "application/javascript",
      expected: "application/javascript; charset=utf-8",
    },
    { input: "application/xml", expected: "application/xml; charset=utf-8" },
    { input: "image/png", expected: "image/png" },
    { input: "application/octet-stream", expected: "application/octet-stream" },
  ];

  for (const { input, expected } of testCases) {
    const normalized = normalizeHeaders({ "content-type": input });
    assertEquals(
      normalized.get("content-type"),
      expected,
      `Content-type ${input} should be normalized to ${expected}`,
    );
  }
});

Deno.test("headerUtils - normalizeHeaders handles complex content-type", () => {
  const headers = {
    "content-type": "text/html; boundary=something, text/plain",
  };

  const normalized = normalizeHeaders(headers);

  // Should only take the first part before comma
  assertEquals(normalized.get("content-type"), "text/html; charset=utf-8");
});

Deno.test("headerUtils - normalizeHeaders merges vary headers", () => {
  const headers = {
    "vary": "Accept, User-Agent",
  };

  const normalized = normalizeHeaders(headers);
  const varyHeader = normalized.get("vary") || "";

  // Should include original values plus defaults
  assert(varyHeader.includes("Accept"), "Should include Accept");
  assert(varyHeader.includes("User-Agent"), "Should include User-Agent");
  assert(
    varyHeader.includes("Accept-Encoding"),
    "Should include Accept-Encoding",
  );
  assert(varyHeader.includes("X-API-Version"), "Should include X-API-Version");
  assert(varyHeader.includes("Origin"), "Should include Origin");
});

Deno.test("headerUtils - normalizeHeaders handles empty headers", () => {
  const normalized = normalizeHeaders({});

  // Should still have default vary headers
  const varyHeader = normalized.get("vary") || "";
  assert(
    varyHeader.includes("Accept-Encoding"),
    "Should include default vary headers",
  );
  assert(varyHeader.includes("X-API-Version"), "Should include X-API-Version");
  assert(varyHeader.includes("Origin"), "Should include Origin");
});

Deno.test("headerUtils - normalizeHeaders case sensitivity limitation", () => {
  const headers = {
    "Content-Type": "text/html",
    "VARY": "Accept",
    "X-Custom-Header": "value",
  };

  const normalized = normalizeHeaders(headers);

  // The function only processes lowercase "content-type" and "vary" in the input
  // Uppercase versions are not specially processed
  assertEquals(
    normalized.get("content-type"),
    null,
    "Content-Type (uppercase) is not processed",
  );

  // VARY is processed as a regular header, then the function adds default values
  const varyHeader = normalized.get("vary") || "";
  assert(
    varyHeader.includes("Accept"),
    "VARY (uppercase) is set as regular header",
  );
  assert(
    varyHeader.includes("Accept-Encoding"),
    "Default vary values are still added",
  );

  assertEquals(
    normalized.get("x-custom-header"),
    "value",
    "Other headers are passed through",
  );
});

Deno.test("headerUtils - normalizeHeaders no duplicate vary values", () => {
  const headers = {
    "vary": "Accept-Encoding, Origin, Accept-Encoding",
  };

  const normalized = normalizeHeaders(headers);
  const varyValues = (normalized.get("vary") || "").split(",").map((v) =>
    v.trim()
  );

  // Count occurrences of Accept-Encoding
  const acceptEncodingCount =
    varyValues.filter((v) => v === "Accept-Encoding").length;
  assertEquals(acceptEncodingCount, 1, "Should not have duplicate vary values");
});
