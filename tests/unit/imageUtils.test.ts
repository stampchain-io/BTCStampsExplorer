import { NOT_AVAILABLE_IMAGE } from "$constants";
import {
  detectContentType,
  getMimeType,
  getSRC101Data,
  getStampImageSrc,
  handleImageError,
  isValidDataUrl,
  isValidSVG,
  mimeTypeToSuffix,
  showFallback,
  validateStampContent,
} from "$lib/utils/ui/media/imageUtils.ts";
import { assertEquals } from "@std/assert";

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

Deno.test("detectContentType - handles filename extension extraction", () => {
  const content = btoa("some content");
  const result = detectContentType(content, "path/to/file.png");
  assertEquals(result.mimeType, "image/png");
  assertEquals(result.isGzipped, false);
  assertEquals(result.isJavaScript, false);
});

// Tests for getStampImageSrc
Deno.test("getStampImageSrc - returns placeholder when no stamp_url", () => {
  const stamp = { stamp_url: null } as any;
  const result = getStampImageSrc(stamp);
  assertEquals(result, NOT_AVAILABLE_IMAGE);
});

Deno.test("getStampImageSrc - handles SRC-20 JSON stamps", () => {
  const stamp = {
    stamp_url: "https://stampchain.io/stamps/abc123.json",
    ident: "SRC-20",
  } as any;
  const result = getStampImageSrc(stamp);
  assertEquals(result, "https://stampchain.io/stamps/abc123.svg");
});

Deno.test("getStampImageSrc - returns placeholder for SRC-20 with invalid URL", () => {
  const stamp = {
    stamp_url: "https://example.com/invalid.json",
    ident: "SRC-20",
  } as any;
  const result = getStampImageSrc(stamp);
  assertEquals(result, NOT_AVAILABLE_IMAGE);
});

Deno.test("getStampImageSrc - handles SRC-20 fetch errors", () => {
  // Ensure test environment
  const originalEnv = Deno.env.get("DENO_ENV");
  Deno.env.set("DENO_ENV", "test");
  
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    return Promise.resolve(new Response("", { status: 404 }));
  };

  try {
    const stamp = {
      stamp_url: "https://stampchain.io/stamps/abc123.json",
      ident: "SRC-20",
    } as any;
    const result = getStampImageSrc(stamp);
    assertEquals(result, "https://stampchain.io/stamps/abc123.svg"); // SRC-20 returns SVG path regardless of fetch result
  } finally {
    globalThis.fetch = originalFetch;
    if (originalEnv) {
      Deno.env.set("DENO_ENV", originalEnv);
    }
  }
});

Deno.test("getStampImageSrc - handles HTML stamp URL extraction", () => {
  // Ensure test environment
  const originalEnv = Deno.env.get("DENO_ENV");
  Deno.env.set("DENO_ENV", "test");
  
  try {
    const stamp = {
      stamp_url: "https://stampchain.io/stamps/content.html",
      stamp_mimetype: "text/html",
      tx_hash: "abc123"
    } as any;
    const result = getStampImageSrc(stamp);
    // In test environment, uses full URLs - /content/ path without .html extension
    assertEquals(result, "https://stampchain.io/content/content");
  } finally {
    if (originalEnv) {
      Deno.env.set("DENO_ENV", originalEnv);
    }
  }
});

Deno.test("getStampImageSrc - handles complex HTML stamp URL", () => {
  // Ensure test environment
  const originalEnv = Deno.env.get("DENO_ENV");
  Deno.env.set("DENO_ENV", "test");
  
  try {
    const stamp = {
      stamp_url: "https://stampchain.io/stamps/path/to/file.html",
    } as any;
    const result = getStampImageSrc(stamp);
    // In test environment, uses full URLs
    assertEquals(result, "https://stampchain.io/content/path/to/file");
  } finally {
    if (originalEnv) {
      Deno.env.set("DENO_ENV", originalEnv);
    }
  }
});

Deno.test("getStampImageSrc - handles SRC-101 stamps", () => {
  const stamp = {
    stamp_url: "https://stampchain.io/stamps/src101.json",
    ident: "SRC-101",
  } as any;
  const result = getStampImageSrc(stamp);
  // SRC-101 JSON stamps now return placeholder (can't fetch synchronously)
  assertEquals(result, NOT_AVAILABLE_IMAGE);
});

// SRC-101 tests removed since getStampImageSrc is now synchronous
// and doesn't fetch JSON data anymore

Deno.test("getStampImageSrc - handles non-JSON stamps", () => {
  // Ensure test environment
  const originalEnv = Deno.env.get("DENO_ENV");
  Deno.env.set("DENO_ENV", "test");
  
  try {
    const stamp = {
      stamp_url: "https://stampchain.io/stamps/image.png",
    } as any;
    const result = getStampImageSrc(stamp);
    // In test environment, uses full URLs
    assertEquals(result, "https://stampchain.io/content/image.png");
  } finally {
    if (originalEnv) {
      Deno.env.set("DENO_ENV", originalEnv);
    }
  }
});

Deno.test("getStampImageSrc - handles other JSON stamps (not SRC-20/101)", () => {
  const stamp = {
    stamp_url: "https://stampchain.io/stamps/data.json",
    ident: "OTHER",
  } as any;
  const result = getStampImageSrc(stamp);
  assertEquals(result, NOT_AVAILABLE_IMAGE);
});

Deno.test("getStampImageSrc - handles empty stamp_url string", () => {
  const stamp = { stamp_url: "" } as any;
  const result = getStampImageSrc(stamp);
  assertEquals(result, NOT_AVAILABLE_IMAGE);
});

Deno.test("getStampImageSrc - handles undefined stamp_url", () => {
  const stamp = { stamp_url: undefined } as any;
  const result = getStampImageSrc(stamp);
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

Deno.test("getSRC101Data - throws on fetch errors", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("Network error");
  };

  const stamp = {
    ident: "SRC-101",
    stamp_url: "https://stampchain.io/stamps/src101.json",
  } as any;

  try {
    await getSRC101Data(stamp);
    assertEquals(true, false, "Expected error to be thrown");
  } catch (error) {
    assertEquals((error as Error).message, "Network error");
  }

  globalThis.fetch = originalFetch;
});

Deno.test("getSRC101Data - throws on invalid JSON response", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    return Promise.resolve(
      new Response("invalid json", { status: 200 }),
    );
  };

  const stamp = {
    ident: "SRC-101",
    stamp_url: "https://stampchain.io/stamps/src101.json",
  } as any;

  try {
    await getSRC101Data(stamp);
    assertEquals(true, false, "Expected error to be thrown");
  } catch (error) {
    assertEquals(error instanceof SyntaxError, true);
  }

  globalThis.fetch = originalFetch;
});

Deno.test("getSRC101Data - throws on HTTP error responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    return Promise.resolve(new Response("Not found", { status: 404 }));
  };

  const stamp = {
    ident: "SRC-101",
    stamp_url: "https://stampchain.io/stamps/src101.json",
  } as any;

  try {
    await getSRC101Data(stamp);
    assertEquals(true, false, "Expected error to be thrown");
  } catch (error) {
    assertEquals(error instanceof SyntaxError, true);
  }

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

Deno.test("validateStampContent - handles string errors", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw "String error";
  };

  const result = await validateStampContent("https://example.com/error.html");
  assertEquals(result.isValid, false);
  assertEquals(result.error, "Error validating content");

  globalThis.fetch = originalFetch;
});

Deno.test("validateStampContent - handles object errors", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw { message: "Object error", code: 500 };
  };

  const result = await validateStampContent("https://example.com/error.html");
  assertEquals(result.isValid, false);
  assertEquals(result.error, "Error validating content");

  globalThis.fetch = originalFetch;
});

// Tests for isValidSVG function
Deno.test("isValidSVG - accepts valid SVG without external references", () => {
  // Mock DOMParser for test environment
  const originalDOMParser = globalThis.DOMParser;
  globalThis.DOMParser = class {
    parseFromString(_content: string, _type: string) {
      // Simple mock that validates basic SVG structure
      return {
        querySelector: (selector: string) => {
          if (selector === "parsererror") return null;
          return null;
        },
        querySelectorAll: (selector: string) => {
          if (
            selector ===
              "foreignObject, use[href*='http'], image[href*='http'], a[href*='http']"
          ) {
            return [];
          }
          return [];
        },
        getElementsByTagName: (tagName: string) => {
          if (tagName === "*") {
            return [{
              attributes: [
                { name: "xmlns", value: "http://www.w3.org/2000/svg" },
                { name: "r", value: "10" },
              ],
            }];
          }
          return [];
        },
      };
    }
  } as any;

  const validSvg =
    '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>';
  const result = isValidSVG(validSvg);
  assertEquals(result, true);

  globalThis.DOMParser = originalDOMParser;
});

Deno.test("isValidSVG - rejects SVG with external untrusted references", () => {
  const originalDOMParser = globalThis.DOMParser;
  globalThis.DOMParser = class {
    parseFromString(_content: string, _type: string) {
      return {
        querySelector: (selector: string) => {
          if (selector === "parsererror") return null;
          return null;
        },
        querySelectorAll: (selector: string) => {
          if (
            selector ===
              "foreignObject, use[href*='http'], image[href*='http'], a[href*='http']"
          ) {
            // Return mock elements with external references
            return [{
              getAttribute: (name: string) => {
                if (name === "href") return "https://malicious.com/script.js";
                if (name === "xlink:href") return null;
                return null;
              },
            }];
          }
          return [];
        },
        getElementsByTagName: () => [],
      };
    }
  } as any;

  const maliciousSvg =
    '<svg><use href="https://malicious.com/script.js"/></svg>';
  const result = isValidSVG(maliciousSvg);
  assertEquals(result, false);

  globalThis.DOMParser = originalDOMParser;
});

Deno.test("isValidSVG - accepts SVG with trusted domain references", () => {
  const originalDOMParser = globalThis.DOMParser;
  globalThis.DOMParser = class {
    parseFromString(_content: string, _type: string) {
      return {
        querySelector: (selector: string) => {
          if (selector === "parsererror") return null;
          return null;
        },
        querySelectorAll: (selector: string) => {
          if (
            selector ===
              "foreignObject, use[href*='http'], image[href*='http'], a[href*='http']"
          ) {
            return [{
              getAttribute: (name: string) => {
                if (name === "href") return "https://ordinals.com/content/123";
                if (name === "xlink:href") return null;
                return null;
              },
            }];
          }
          return [];
        },
        getElementsByTagName: () => [],
      };
    }
  } as any;

  const trustedSvg =
    '<svg><use href="https://ordinals.com/content/123"/></svg>';
  const result = isValidSVG(trustedSvg);
  assertEquals(result, true);

  globalThis.DOMParser = originalDOMParser;
});

Deno.test("isValidSVG - rejects SVG with event handlers", () => {
  const originalDOMParser = globalThis.DOMParser;
  globalThis.DOMParser = class {
    parseFromString(_content: string, _type: string) {
      return {
        querySelector: (selector: string) => {
          if (selector === "parsererror") return null;
          return null;
        },
        querySelectorAll: () => [],
        getElementsByTagName: (tagName: string) => {
          if (tagName === "*") {
            return [{
              attributes: [
                { name: "onclick", value: "alert('hack')" },
                { name: "r", value: "10" },
              ],
            }];
          }
          return [];
        },
      };
    }
  } as any;

  const maliciousSvg = '<svg><circle onclick="alert(\'hack\')" r="10"/></svg>';
  const result = isValidSVG(maliciousSvg);
  assertEquals(result, false);

  globalThis.DOMParser = originalDOMParser;
});

Deno.test("isValidSVG - rejects SVG with external URLs in attributes", () => {
  const originalDOMParser = globalThis.DOMParser;
  globalThis.DOMParser = class {
    parseFromString(_content: string, _type: string) {
      return {
        querySelector: (selector: string) => {
          if (selector === "parsererror") return null;
          return null;
        },
        querySelectorAll: () => [],
        getElementsByTagName: (tagName: string) => {
          if (tagName === "*") {
            return [{
              attributes: [
                { name: "src", value: "https://malicious.com/image.png" },
                { name: "xmlns", value: "http://www.w3.org/2000/svg" },
              ],
            }];
          }
          return [];
        },
      };
    }
  } as any;

  const maliciousSvg =
    '<svg><image src="https://malicious.com/image.png"/></svg>';
  const result = isValidSVG(maliciousSvg);
  assertEquals(result, false);

  globalThis.DOMParser = originalDOMParser;
});

Deno.test("isValidSVG - rejects SVG with data URIs", () => {
  const originalDOMParser = globalThis.DOMParser;
  globalThis.DOMParser = class {
    parseFromString(_content: string, _type: string) {
      return {
        querySelector: (selector: string) => {
          if (selector === "parsererror") return null;
          return null;
        },
        querySelectorAll: () => [],
        getElementsByTagName: (tagName: string) => {
          if (tagName === "*") {
            return [{
              attributes: [
                { name: "src", value: "data:image/png;base64,iVBORw0KGgo=" },
              ],
            }];
          }
          return [];
        },
      };
    }
  } as any;

  const dataUriSvg =
    '<svg><image src="data:image/png;base64,iVBORw0KGgo="/></svg>';
  const result = isValidSVG(dataUriSvg);
  assertEquals(result, false);

  globalThis.DOMParser = originalDOMParser;
});

// Additional edge case tests for imageUtils.ts

Deno.test("detectContentType - handles filename without extension", () => {
  const content = btoa("some content");
  const result = detectContentType(content, "filename_without_extension");
  assertEquals(result.mimeType, "application/octet-stream");
  assertEquals(result.isGzipped, false);
  assertEquals(result.isJavaScript, false);
});

Deno.test("getStampImageSrc - handles malformed URL extraction", () => {
  // Ensure test environment
  const originalEnv = Deno.env.get("DENO_ENV");
  Deno.env.set("DENO_ENV", "test");
  
  try {
    const stamp = {
      stamp_url: "malformed-url-no-stamps-path",
    } as any;
    const result = getStampImageSrc(stamp);
    // In test environment, uses full URLs
    assertEquals(result, "https://stampchain.io/content/malformed-url-no-stamps-path");
  } finally {
    if (originalEnv) {
      Deno.env.set("DENO_ENV", originalEnv);
    }
  }
});

// Removed SRC-101 fetch test - getStampImageSrc is now synchronous

Deno.test("isValidSVG - handles parser error", () => {
  const originalDOMParser = globalThis.DOMParser;
  globalThis.DOMParser = class {
    parseFromString(_content: string, _type: string) {
      return {
        querySelector: (selector: string) => {
          if (selector === "parsererror") return { textContent: "Parse error" };
          return null;
        },
        querySelectorAll: () => [],
        getElementsByTagName: () => [],
      };
    }
  } as any;

  const invalidSvg = "<svg><invalid-xml</svg>";
  const result = isValidSVG(invalidSvg);
  assertEquals(result, false);

  globalThis.DOMParser = originalDOMParser;
});

Deno.test("isValidSVG - handles invalid URL in attributes", () => {
  const originalDOMParser = globalThis.DOMParser;
  globalThis.DOMParser = class {
    parseFromString(_content: string, _type: string) {
      return {
        querySelector: (selector: string) => {
          if (selector === "parsererror") return null;
          return null;
        },
        querySelectorAll: () => [],
        getElementsByTagName: (tagName: string) => {
          if (tagName === "*") {
            return [{
              attributes: [
                { name: "src", value: "http://invalid-url-format::" },
              ],
            }];
          }
          return [];
        },
      };
    }
  } as any;

  const maliciousSvg = '<svg><image src="http://invalid-url-format::"/></svg>';
  const result = isValidSVG(maliciousSvg);
  assertEquals(result, false);

  globalThis.DOMParser = originalDOMParser;
});

Deno.test("isValidSVG - handles URL constructor error in external references", () => {
  const originalDOMParser = globalThis.DOMParser;
  globalThis.DOMParser = class {
    parseFromString(_content: string, _type: string) {
      return {
        querySelector: (selector: string) => {
          if (selector === "parsererror") return null;
          return null;
        },
        querySelectorAll: (selector: string) => {
          if (
            selector ===
              "foreignObject, use[href*='http'], image[href*='http'], a[href*='http']"
          ) {
            return [{
              getAttribute: (name: string) => {
                if (name === "href") return "http://malformed-url::";
                return null;
              },
            }];
          }
          return [];
        },
        getElementsByTagName: () => [],
      };
    }
  } as any;

  const maliciousSvg = '<svg><use href="http://malformed-url::"/></svg>';
  const result = isValidSVG(maliciousSvg);
  assertEquals(result, false);

  globalThis.DOMParser = originalDOMParser;
});

Deno.test("validateStampContent - handles SVG validation", async () => {
  const originalFetch = globalThis.fetch;
  const originalDOMParser = globalThis.DOMParser;

  globalThis.fetch = () => {
    return Promise.resolve(
      new Response('<svg><script>alert("xss")</script></svg>', { status: 200 }),
    );
  };

  globalThis.DOMParser = class {
    parseFromString(_content: string, _type: string) {
      return {
        querySelector: (selector: string) => {
          if (selector === "parsererror") return null;
          return null;
        },
        querySelectorAll: () => [],
        getElementsByTagName: (tagName: string) => {
          if (tagName === "*") {
            return [{
              attributes: [
                { name: "onclick", value: "alert('xss')" },
              ],
            }];
          }
          return [];
        },
      };
    }
  } as any;

  const result = await validateStampContent(
    "https://example.com/malicious.svg",
  );
  assertEquals(result.isValid, false);
  assertEquals(
    result.error,
    "SVG contains unsafe content or untrusted external references",
  );

  globalThis.fetch = originalFetch;
  globalThis.DOMParser = originalDOMParser;
});

// Mock DOM functions for testing - these simulate browser behavior
Deno.test("showFallback - handles regular HTML element", () => {
  const originalDocument = globalThis.document;
  const originalHTMLIFrameElement = globalThis.HTMLIFrameElement;

  // Mock document.createElement
  globalThis.document = {
    createElement: (tagName: string) => {
      if (tagName === "img") {
        return {
          src: "",
          alt: "",
          className: "",
        };
      }
      return null;
    },
  } as any;

  globalThis.HTMLIFrameElement = class {} as any;

  const mockElement = {
    innerHTML: "original content",
    appendChild: (child: any) => {
      mockElement.lastAppendedChild = child;
    },
    lastAppendedChild: null as any,
  };

  try {
    showFallback(mockElement as any);
    assertEquals(mockElement.innerHTML, "");
    assertEquals(mockElement.lastAppendedChild?.src, NOT_AVAILABLE_IMAGE);
    assertEquals(mockElement.lastAppendedChild?.alt, "Content not available");
    assertEquals(
      mockElement.lastAppendedChild?.className,
      "w-full h-full object-contain rounded-lg pixelart",
    );
  } catch (error) {
    // Expected in test environment - DOM APIs not available
    assertEquals(error instanceof ReferenceError, true);
  }

  // Restore
  globalThis.document = originalDocument;
  globalThis.HTMLIFrameElement = originalHTMLIFrameElement;
});

Deno.test("handleImageError - handles HTMLImageElement", () => {
  const originalHTMLImageElement = globalThis.HTMLImageElement;
  const originalHTMLIFrameElement = globalThis.HTMLIFrameElement;

  globalThis.HTMLImageElement = class {} as any;
  globalThis.HTMLIFrameElement = class {} as any;

  const mockImg = {
    src: "original.jpg",
  };

  // Make it instance of HTMLImageElement
  Object.setPrototypeOf(mockImg, globalThis.HTMLImageElement.prototype);

  const event = {
    currentTarget: mockImg,
  };

  try {
    handleImageError(event as any);
    assertEquals(mockImg.src, NOT_AVAILABLE_IMAGE);
  } catch (error) {
    // Expected in test environment - DOM APIs not available
    assertEquals(error instanceof ReferenceError, true);
  }

  // Restore
  globalThis.HTMLImageElement = originalHTMLImageElement;
  globalThis.HTMLIFrameElement = originalHTMLIFrameElement;
});
