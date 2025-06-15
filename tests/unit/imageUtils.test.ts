import { assertEquals } from "@std/assert";
import {
  detectContentType,
  getMimeType,
  getSRC101Data,
  getStampImageSrc,
  isValidDataUrl,
  mimeTypeToSuffix,
  validateStampContent,
} from "$lib/utils/imageUtils.ts";
import { NOT_AVAILABLE_IMAGE } from "$lib/utils/constants.ts";

Deno.test("getMimeType - returns correct mime type for known extensions", () => {
  assertEquals(getMimeType("jpg"), "image/jpeg");
  assertEquals(getMimeType("jpeg"), "image/jpeg");
  assertEquals(getMimeType("png"), "image/png");
  assertEquals(getMimeType("gif"), "image/gif");
  assertEquals(getMimeType("svg"), "image/svg+xml");
  assertEquals(getMimeType("html"), "text/html");
  assertEquals(getMimeType("js"), "application/javascript");
  assertEquals(getMimeType("json"), "application/json");
  assertEquals(getMimeType("css"), "text/css");
  assertEquals(getMimeType("mp3"), "audio/mpeg");
  assertEquals(getMimeType("mp4"), "video/mp4");
});

Deno.test("getMimeType - handles case insensitive extensions", () => {
  assertEquals(getMimeType("JPG"), "image/jpeg");
  assertEquals(getMimeType("PNG"), "image/png");
  assertEquals(getMimeType("GIF"), "image/gif");
  assertEquals(getMimeType("SVG"), "image/svg+xml");
});

Deno.test("getMimeType - returns default for unknown extensions", () => {
  assertEquals(getMimeType("xyz"), "application/octet-stream");
  assertEquals(getMimeType("unknown"), "application/octet-stream");
  assertEquals(getMimeType(""), "application/octet-stream");
  assertEquals(getMimeType("123"), "application/octet-stream");
});

Deno.test("mimeTypeToSuffix - correctly reverses mimeTypes mapping", () => {
  // Note: image/jpeg maps to "jpeg" not "jpg" because both extensions map to the same mime type
  assertEquals(mimeTypeToSuffix["image/jpeg"], "jpeg");
  assertEquals(mimeTypeToSuffix["image/png"], "png");
  assertEquals(mimeTypeToSuffix["image/gif"], "gif");
  assertEquals(mimeTypeToSuffix["text/html"], "htm"); // htm comes after html in the mapping
  assertEquals(mimeTypeToSuffix["application/javascript"], "cjs"); // cjs comes last in the mapping
});

Deno.test("isValidDataUrl - validates correct data URLs", () => {
  assertEquals(isValidDataUrl("data:text/plain,hello"), true);
  assertEquals(isValidDataUrl("data:text/plain;base64,aGVsbG8="), true);
  assertEquals(isValidDataUrl("data:image/png;base64,iVBORw0KGgo="), true);
  assertEquals(isValidDataUrl("data:application/json,{}"), true);
  assertEquals(isValidDataUrl("data:text/html,<h1>Hello</h1>"), true);
});

Deno.test("isValidDataUrl - rejects invalid data URLs", () => {
  assertEquals(isValidDataUrl("http://example.com"), false);
  assertEquals(isValidDataUrl("data:"), false);
  assertEquals(isValidDataUrl("data:,"), false);
  assertEquals(isValidDataUrl("data:text/plain"), false);
  assertEquals(isValidDataUrl(""), false);
  assertEquals(isValidDataUrl("not-a-data-url"), false);
});

Deno.test("isValidDataUrl - rejects multiple media type declarations", () => {
  assertEquals(isValidDataUrl("data:text/plain+html+xml,test"), false);
  assertEquals(isValidDataUrl("data:text/plain+xml,test"), true); // Only one + is allowed
});

Deno.test("detectContentType - detects gzipped content", () => {
  const gzipMagicBytes = "\x1f\x8b\x08";
  const result = detectContentType(gzipMagicBytes + "some content");
  assertEquals(result.mimeType, "application/javascript");
  assertEquals(result.isGzipped, true);
  assertEquals(result.isJavaScript, true);
});

Deno.test("detectContentType - detects JavaScript in HTML mime type", () => {
  // Base64 encode JavaScript content
  const jsContent = btoa(
    "document.head.insertAdjacentHTML('beforeend', '<style>...</style>')",
  );
  const result = detectContentType(jsContent, undefined, "text/html");
  assertEquals(result.mimeType, "application/javascript");
  assertEquals(result.isGzipped, false);
  assertEquals(result.isJavaScript, true);
});

Deno.test("detectContentType - trusts provided mime type", () => {
  const content = btoa("some content");
  const result = detectContentType(content, "file.txt", "application/pdf");
  assertEquals(result.mimeType, "application/pdf");
  assertEquals(result.isGzipped, false);
  assertEquals(result.isJavaScript, false);
});

Deno.test("detectContentType - uses filename when no mime type provided", () => {
  const content = btoa("some content");
  const result = detectContentType(content, "script.js");
  assertEquals(result.mimeType, "application/javascript");
  assertEquals(result.isGzipped, false);
  assertEquals(result.isJavaScript, true);
});

Deno.test("detectContentType - handles errors gracefully", () => {
  const invalidBase64 = "not-valid-base64!@#$%";
  const result = detectContentType(invalidBase64);
  assertEquals(result.mimeType, "application/octet-stream");
  assertEquals(result.isGzipped, false);
  assertEquals(result.isJavaScript, false);
});

Deno.test("detectContentType - default fallback", () => {
  const content = btoa("some content");
  const result = detectContentType(content);
  assertEquals(result.mimeType, "application/octet-stream");
  assertEquals(result.isGzipped, false);
  assertEquals(result.isJavaScript, false);
});

// Tests for getStampImageSrc
Deno.test("getStampImageSrc - returns placeholder when no stamp_url", async () => {
  const stamp = { stamp_url: null } as any;
  const result = await getStampImageSrc(stamp);
  assertEquals(result, NOT_AVAILABLE_IMAGE);
});

Deno.test("getStampImageSrc - handles SRC-20 JSON stamps", async () => {
  const stamp = {
    stamp_url: "https://stampchain.io/stamps/abc123.json",
    ident: "SRC-20",
  } as any;
  const result = await getStampImageSrc(stamp);
  assertEquals(result, "/stamps/abc123.svg");
});

Deno.test("getStampImageSrc - returns placeholder for SRC-20 with invalid URL", async () => {
  const stamp = {
    stamp_url: "https://example.com/invalid.json",
    ident: "SRC-20",
  } as any;
  const result = await getStampImageSrc(stamp);
  assertEquals(result, NOT_AVAILABLE_IMAGE);
});

Deno.test("getStampImageSrc - handles SRC-101 stamps with image", async () => {
  // Mock fetch for SRC-101 JSON
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (url: string | URL | Request) => {
    if (typeof url === "string" && url.includes("src101")) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            img: ["https://example.com/image.png"],
          }),
          { status: 200 },
        ),
      );
    }
    return originalFetch(url);
  };

  const stamp = {
    stamp_url: "https://stampchain.io/stamps/src101.json",
    ident: "SRC-101",
  } as any;
  const result = await getStampImageSrc(stamp);
  assertEquals(result, "https://example.com/image.png");

  globalThis.fetch = originalFetch;
});

Deno.test("getStampImageSrc - handles SRC-101 stamps without image", async () => {
  // Mock fetch for SRC-101 JSON without image
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (url: string | URL | Request) => {
    if (typeof url === "string" && url.includes("src101")) {
      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
    }
    return originalFetch(url);
  };

  const stamp = {
    stamp_url: "https://stampchain.io/stamps/src101.json",
    ident: "SRC-101",
  } as any;
  const result = await getStampImageSrc(stamp);
  assertEquals(result, NOT_AVAILABLE_IMAGE);

  globalThis.fetch = originalFetch;
});

Deno.test("getStampImageSrc - handles SRC-101 fetch errors", async () => {
  // Mock fetch to throw error
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("Network error");
  };

  const stamp = {
    stamp_url: "https://stampchain.io/stamps/src101.json",
    ident: "SRC-101",
  } as any;
  const result = await getStampImageSrc(stamp);
  assertEquals(result, NOT_AVAILABLE_IMAGE);

  globalThis.fetch = originalFetch;
});

Deno.test("getStampImageSrc - handles non-JSON stamps", async () => {
  const stamp = {
    stamp_url: "https://stampchain.io/stamps/image.png",
  } as any;
  const result = await getStampImageSrc(stamp);
  assertEquals(result, "/content/image.png");
});

Deno.test("getStampImageSrc - handles HTML stamps", async () => {
  const stamp = {
    stamp_url: "https://stampchain.io/stamps/content.html",
  } as any;
  const result = await getStampImageSrc(stamp);
  assertEquals(result, "/content/content");
});

Deno.test("getStampImageSrc - handles other JSON stamps (not SRC-20/101)", async () => {
  const stamp = {
    stamp_url: "https://stampchain.io/stamps/data.json",
    ident: "OTHER",
  } as any;
  const result = await getStampImageSrc(stamp);
  assertEquals(result, NOT_AVAILABLE_IMAGE);
});

// Tests for getSRC101Data
Deno.test("getSRC101Data - returns empty object for non-SRC-101", async () => {
  const stamp = { ident: "SRC-20" } as any;
  const result = await getSRC101Data(stamp);
  assertEquals(result, {});
});

Deno.test("getSRC101Data - fetches and returns JSON data", async () => {
  const originalFetch = globalThis.fetch;
  const mockData = { name: "Test NFT", img: ["test.png"] };

  globalThis.fetch = () => {
    return Promise.resolve(
      new Response(JSON.stringify(mockData), { status: 200 }),
    );
  };

  const stamp = {
    ident: "SRC-101",
    stamp_url: "https://stampchain.io/stamps/src101.json",
  } as any;
  const result = await getSRC101Data(stamp);
  assertEquals(result, mockData);

  globalThis.fetch = originalFetch;
});

// Tests for validateStampContent
Deno.test("validateStampContent - validates valid content", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    return Promise.resolve(
      new Response("<div>Valid content</div>", { status: 200 }),
    );
  };

  const result = await validateStampContent("https://example.com/content.html");
  assertEquals(result.isValid, true);
  assertEquals(result.error, undefined);

  globalThis.fetch = originalFetch;
});

Deno.test("validateStampContent - rejects deploy content", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    return Promise.resolve(
      new Response('{"deploy": "token"}', { status: 200 }),
    );
  };

  const result = await validateStampContent("https://example.com/content.json");
  assertEquals(result.isValid, false);
  assertEquals(result.error, "Invalid content");

  globalThis.fetch = originalFetch;
});

Deno.test("validateStampContent - handles fetch errors", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    return Promise.resolve(new Response("", { status: 404 }));
  };

  const result = await validateStampContent("https://example.com/missing.html");
  assertEquals(result.isValid, false);
  assertEquals(result.error, "Failed to fetch content");

  globalThis.fetch = originalFetch;
});

Deno.test("validateStampContent - handles network errors", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("Network failure");
  };

  const result = await validateStampContent("https://example.com/error.html");
  assertEquals(result.isValid, false);
  assertEquals(result.error, "Network failure");

  globalThis.fetch = originalFetch;
});

// Additional test for SVG content validation
Deno.test("validateStampContent - validates SVG content", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    return Promise.resolve(
      new Response(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>',
        { status: 200 },
      ),
    );
  };

  const result = await validateStampContent("https://example.com/image.svg");
  // Note: This will fail validation because isValidSVG requires DOM parser
  // In a real browser environment, this would validate the SVG properly
  assertEquals(result.isValid, false);
  assertEquals(result.error, "DOMParser is not defined");

  globalThis.fetch = originalFetch;
});

Deno.test("validateStampContent - handles empty content", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    return Promise.resolve(new Response("", { status: 200 }));
  };

  const result = await validateStampContent("https://example.com/empty.html");
  assertEquals(result.isValid, false);
  assertEquals(result.error, "Invalid content");

  globalThis.fetch = originalFetch;
});

// Note: isValidSVG tests would require DOM mocking which is complex in Deno
// Similarly, showFallback and handleImageError are DOM-specific functions
// These would be better tested in integration/e2e tests or with a DOM testing library
