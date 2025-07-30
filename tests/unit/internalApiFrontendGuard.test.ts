import {
  assertEquals,
  assertExists,
} from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { stub, returnsNext } from "@std/testing/mock";
import { InternalApiFrontendGuard } from "$/server/services/security/internalApiFrontendGuard.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";

describe("InternalApiFrontendGuard", () => {
  let originalEnv: string | undefined;
  let apiResponseStub: any;

  beforeEach(() => {
    // Save original env
    originalEnv = Deno.env.get("DENO_ENV");
    
    // Mock ApiResponseUtil.forbidden
    apiResponseStub = stub(
      ApiResponseUtil,
      "forbidden",
      returnsNext([new Response("Forbidden", { status: 403 })])
    );
  });

  afterEach(() => {
    // Restore environment
    if (originalEnv) {
      Deno.env.set("DENO_ENV", originalEnv);
    } else {
      Deno.env.delete("DENO_ENV");
    }
    
    // Restore stubs
    apiResponseStub.restore();
  });

  describe("Development Environment", () => {
    it("should allow all requests in development", () => {
      Deno.env.set("DENO_ENV", "development");
      
      const req = new Request("http://localhost:8000/api/internal/test");
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      
      assertEquals(result, null);
    });
  });

  describe("Production Environment - API Key Access", () => {
    beforeEach(() => {
      Deno.env.set("DENO_ENV", "production");
      Deno.env.set("INTERNAL_API_KEY", "test-api-key-123");
    });

    it("should allow requests with valid API key", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test", {
        headers: {
          "X-API-Key": "test-api-key-123",
        },
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertEquals(result, null);
    });

    it("should block requests with invalid API key", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test", {
        headers: {
          "X-API-Key": "wrong-key",
        },
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertExists(result);
    });

    it("should block requests without API key when one is expected", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test");
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertExists(result);
    });
  });

  describe("Production Environment - Origin Validation", () => {
    beforeEach(() => {
      Deno.env.set("DENO_ENV", "production");
    });

    it("should allow requests from stampchain.io origin", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test", {
        headers: {
          "Origin": "https://stampchain.io",
        },
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertEquals(result, null);
    });

    it("should allow requests from www.stampchain.io origin", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test", {
        headers: {
          "Origin": "https://www.stampchain.io",
        },
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertEquals(result, null);
    });

    it("should block requests from external origins", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test", {
        headers: {
          "Origin": "https://evil.com",
        },
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertExists(result);
    });

    it("should block requests with subdomain attacks", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test", {
        headers: {
          "Origin": "https://stampchain.io.evil.com",
        },
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertExists(result);
    });
  });

  describe("Production Environment - Referer Validation", () => {
    beforeEach(() => {
      Deno.env.set("DENO_ENV", "production");
    });

    it("should allow requests with valid referer as fallback", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test", {
        headers: {
          "Referer": "https://stampchain.io/some/page",
        },
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertEquals(result, null);
    });

    it("should block requests with invalid referer", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test", {
        headers: {
          "Referer": "https://malicious.site/attack",
        },
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertExists(result);
    });
  });

  describe("Production Environment - Host Header Validation", () => {
    beforeEach(() => {
      Deno.env.set("DENO_ENV", "production");
    });

    it("should allow browser requests with valid host header", () => {
      const req = new Request("http://stampchain.io/api/internal/test", {
        headers: {
          "Host": "stampchain.io",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0",
          "Accept": "application/json",
        },
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertEquals(result, null);
    });

    it("should block non-browser requests with host header", () => {
      const req = new Request("http://stampchain.io/api/internal/test", {
        headers: {
          "Host": "stampchain.io",
          "User-Agent": "curl/7.68.0",
          "Accept": "*/*",
        },
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertExists(result);
    });

    it("should detect various browser user agents", () => {
      const browserAgents = [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Safari/537.36",
      ];

      for (const ua of browserAgents) {
        const req = new Request("http://stampchain.io/api/internal/test", {
          headers: {
            "Host": "stampchain.io",
            "User-Agent": ua,
            "Accept": "text/html,application/json",
          },
        });
        
        const result = InternalApiFrontendGuard.requireInternalAccess(req);
        assertEquals(result, null);
      }
    });
  });

  describe("CloudFlare Integration", () => {
    beforeEach(() => {
      Deno.env.set("DENO_ENV", "production");
    });

    it("should handle CloudFlare forwarded headers", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test", {
        headers: {
          "CF-Connecting-IP": "1.2.3.4",
          "CF-Ray": "abc123",
          "X-Forwarded-Host": "stampchain.io",
        },
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertEquals(result, null);
    });

    it("should validate X-Forwarded-Host through CloudFlare", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test", {
        headers: {
          "CF-Connecting-IP": "1.2.3.4",
          "CF-Ray": "abc123",
          "X-Forwarded-Host": "evil.com",
        },
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertExists(result);
    });

    it("should require both CF headers for CloudFlare validation", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test", {
        headers: {
          "CF-Connecting-IP": "1.2.3.4",
          // Missing CF-Ray
          "X-Forwarded-Host": "stampchain.io",
        },
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertExists(result);
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      Deno.env.set("DENO_ENV", "production");
    });

    it("should handle malformed URLs in origin/referer gracefully", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test", {
        headers: {
          "Origin": "not-a-valid-url",
        },
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertExists(result);
    });

    it("should handle empty headers", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test", {
        headers: {},
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertExists(result);
    });

    it("should handle domain-only strings in origin check", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test", {
        headers: {
          "Origin": "stampchain.io", // Without protocol
        },
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertEquals(result, null);
    });

    it("should block requests with no identifying headers", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test");
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertExists(result);
    });
  });

  describe("Multiple Validation Methods", () => {
    beforeEach(() => {
      Deno.env.set("DENO_ENV", "production");
      Deno.env.set("INTERNAL_API_KEY", "test-key");
    });

    it("should prioritize API key over origin validation", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test", {
        headers: {
          "X-API-Key": "test-key",
          "Origin": "https://evil.com", // Invalid origin but valid API key
        },
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertEquals(result, null);
    });

    it("should check origin if API key is invalid", () => {
      const req = new Request("http://api.stampchain.io/api/internal/test", {
        headers: {
          "X-API-Key": "wrong-key",
          "Origin": "https://stampchain.io", // Valid origin but invalid API key
        },
      });
      
      const result = InternalApiFrontendGuard.requireInternalAccess(req);
      assertEquals(result, null); // Should pass due to valid origin
    });
  });
});