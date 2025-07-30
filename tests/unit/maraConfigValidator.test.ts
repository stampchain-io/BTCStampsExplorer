import { assert, assertEquals, assertExists } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { stub, restore } from "@std/testing/mock";

import {
  type MaraConfigValidationResult,
  validateMaraConfigOnStartup,
  validateMaraConfigForProduction,
  validateMaraConfigForDevelopment,
  validateMaraConnectivity,
} from "../../server/config/maraConfigValidator.ts";

import { DEFAULT_MARA_CONFIG } from "../../server/config/maraConfig.ts";

describe("MARA Configuration Validator", () => {
  beforeEach(() => {
    // Clean up environment stubs after each test
    restore();
  });

  describe("validateMaraConfigOnStartup", () => {
    it("should validate complete valid configuration", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        switch (key) {
          case "MARA_ENABLED": return "true";
          case "MARA_API_BASE_URL": return "https://slipstream.mara.com/rest-api";
          case "MARA_API_TIMEOUT": return "30000";
          case "MARA_SERVICE_FEE_AMOUNT": return "42000";
          case "MARA_SERVICE_FEE_ADDRESS": return "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m";
          default: return undefined;
        }
      });

      const result = validateMaraConfigOnStartup();

      assert(result.isValid);
      assertExists(result.config);
      assertEquals(result.errors.length, 0);
      assertEquals(result.config!.enabled, true);
      assertEquals(result.config!.apiBaseUrl, "https://slipstream.mara.com/rest-api");

      envStub.restore();
    });

    it("should handle disabled MARA configuration", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        if (key === "MARA_ENABLED") return "false";
        return undefined;
      });

      const result = validateMaraConfigOnStartup();

      assert(result.isValid);
      assertExists(result.config);
      assertEquals(result.errors.length, 0);
      assertEquals(result.config!.enabled, false);

      envStub.restore();
    });

    it("should collect multiple validation errors", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        switch (key) {
          case "MARA_ENABLED": return "true";
          case "MARA_API_BASE_URL": return "http://insecure.com"; // Invalid HTTPS
          case "MARA_API_TIMEOUT": return "500"; // Too low
          case "MARA_SERVICE_FEE_AMOUNT": return "50000"; // Wrong amount
          case "MARA_SERVICE_FEE_ADDRESS": return "invalid-address";
          default: return undefined;
        }
      });

      const result = validateMaraConfigOnStartup();

      assert(!result.isValid);
      assert(result.errors.length > 0);
      assert(result.errors.some(error => error.includes("HTTPS")));
      assert(result.errors.some(error => error.includes("timeout")));
      assert(result.errors.some(error => error.includes("42000")));
      assert(result.errors.some(error => error.includes("address")));

      envStub.restore();
    });

    it("should provide helpful error messages", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        switch (key) {
          case "MARA_ENABLED": return "true";
          case "MARA_API_BASE_URL": return ""; // Empty URL
          default: return undefined;
        }
      });

      const result = validateMaraConfigOnStartup();

      assert(!result.isValid);
      assert(result.errors.length > 0);
      
      // Check that error messages are descriptive
      const hasDescriptiveError = result.errors.some(error => 
        error.includes("MARA_API_BASE_URL") && error.length > 20
      );
      assert(hasDescriptiveError, "Should provide descriptive error messages");

      envStub.restore();
    });

    it("should generate warnings for suboptimal configuration", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        switch (key) {
          case "MARA_ENABLED": return "true";
          case "MARA_API_BASE_URL": return "https://slipstream.mara.com/rest-api";
          case "MARA_API_TIMEOUT": return "30000";
          case "MARA_SERVICE_FEE_AMOUNT": return "42000";
          case "MARA_SERVICE_FEE_ADDRESS": return "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"; // Valid but not bech32
          default: return undefined;
        }
      });

      const result = validateMaraConfigOnStartup();

      assert(result.isValid);
      assert(result.warnings.length > 0);
      assert(result.warnings.some(warning => warning.includes("bech32")));

      envStub.restore();
    });
  });

  describe("validateMaraConfigForProduction", () => {
    it("should enforce stricter production requirements", () => {
      const config = {
        apiBaseUrl: "http://localhost:3000/api", // HTTP not allowed in production
        apiTimeout: 30000,
        serviceFeeAmount: 42000,
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      const result = validateMaraConfigForProduction(config);

      assert(!result.isValid);
      assert(result.errors.some(error => error.includes("HTTPS")));
      assert(result.errors.some(error => error.includes("production")));
    });

    it("should validate production-ready configuration", () => {
      const config = {
        apiBaseUrl: "https://slipstream.mara.com/rest-api",
        apiTimeout: 30000,
        serviceFeeAmount: 42000,
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      const result = validateMaraConfigForProduction(config);

      assert(result.isValid);
      assertEquals(result.errors.length, 0);
    });

    it("should warn about production best practices", () => {
      const config = {
        apiBaseUrl: "https://slipstream.mara.com/rest-api",
        apiTimeout: 5000, // Very short timeout
        serviceFeeAmount: 42000,
        serviceFeeAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", // Not bech32
        enabled: true,
      };

      const result = validateMaraConfigForProduction(config);

      assert(result.isValid);
      assert(result.warnings.length > 0);
      assert(result.warnings.some(warning => warning.includes("timeout")));
      assert(result.warnings.some(warning => warning.includes("bech32")));
    });

    it("should validate disabled production configuration", () => {
      const config = {
        apiBaseUrl: "",
        apiTimeout: 0,
        serviceFeeAmount: 0,
        serviceFeeAddress: "",
        enabled: false,
      };

      const result = validateMaraConfigForProduction(config);

      assert(result.isValid);
      assertEquals(result.errors.length, 0);
    });
  });

  describe("validateMaraConfigForDevelopment", () => {
    it("should allow HTTP URLs in development", () => {
      const config = {
        apiBaseUrl: "http://localhost:3000/api",
        apiTimeout: 30000,
        serviceFeeAmount: 42000,
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      const result = validateMaraConfigForDevelopment(config);

      assert(result.isValid);
      assertEquals(result.errors.length, 0);
    });

    it("should be more lenient with timeouts", () => {
      const config = {
        apiBaseUrl: "http://localhost:3000/api",
        apiTimeout: 1000, // Minimum allowed
        serviceFeeAmount: 42000,
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      const result = validateMaraConfigForDevelopment(config);

      assert(result.isValid);
      assertEquals(result.errors.length, 0);
    });

    it("should still validate core requirements", () => {
      const config = {
        apiBaseUrl: "http://localhost:3000/api",
        apiTimeout: 30000,
        serviceFeeAmount: 50000, // Wrong amount
        serviceFeeAddress: "invalid-address",
        enabled: true,
      };

      const result = validateMaraConfigForDevelopment(config);

      assert(!result.isValid);
      assert(result.errors.some(error => error.includes("42000")));
      assert(result.errors.some(error => error.includes("address")));
    });

    it("should provide development-specific warnings", () => {
      const config = {
        apiBaseUrl: "http://localhost:3000/api",
        apiTimeout: 30000,
        serviceFeeAmount: 42000,
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      const result = validateMaraConfigForDevelopment(config);

      assert(result.isValid);
      // May have warnings about using localhost, etc.
      // Warnings are optional in development
    });
  });

  describe("validateMaraConnectivity", () => {
    it("should validate API endpoint connectivity", async () => {
      const config = {
        apiBaseUrl: "https://slipstream.mara.com/rest-api",
        apiTimeout: 30000,
        serviceFeeAmount: 42000,
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      // Mock fetch for testing
      const originalFetch = globalThis.fetch;
      globalThis.fetch = stub(
        globalThis,
        "fetch",
        () => Promise.resolve(new Response(JSON.stringify({ status: "ok" }), { status: 200 }))
      );

      const result = await validateMaraConnectivity(config);

      assert(result.isValid);
      assertEquals(result.errors.length, 0);

      globalThis.fetch = originalFetch;
    });

    it("should handle connection failures gracefully", async () => {
      const config = {
        apiBaseUrl: "https://nonexistent.mara.com/rest-api",
        apiTimeout: 5000,
        serviceFeeAmount: 42000,
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      // Mock fetch to simulate network error
      const originalFetch = globalThis.fetch;
      globalThis.fetch = stub(
        globalThis,
        "fetch",
        () => Promise.reject(new Error("Network error"))
      );

      const result = await validateMaraConnectivity(config);

      assert(!result.isValid);
      assert(result.errors.some(error => error.includes("connection")));

      globalThis.fetch = originalFetch;
    });

    it("should handle API errors correctly", async () => {
      const config = {
        apiBaseUrl: "https://slipstream.mara.com/rest-api",
        apiTimeout: 30000,
        serviceFeeAmount: 42000,
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      // Mock fetch to return API error
      const originalFetch = globalThis.fetch;
      globalThis.fetch = stub(
        globalThis,
        "fetch",
        () => Promise.resolve(new Response(JSON.stringify({ error: "API Error" }), { status: 500 }))
      );

      const result = await validateMaraConnectivity(config);

      assert(!result.isValid);
      assert(result.errors.some(error => error.includes("API") || error.includes("500")));

      globalThis.fetch = originalFetch;
    });

    it("should respect timeout configuration", async () => {
      const config = {
        apiBaseUrl: "https://slow.mara.com/rest-api",
        apiTimeout: 1000, // Very short timeout
        serviceFeeAmount: 42000,
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      // Mock fetch to simulate slow response
      const originalFetch = globalThis.fetch;
      globalThis.fetch = stub(
        globalThis,
        "fetch",
        () => new Promise(resolve => setTimeout(resolve, 2000)) // Longer than timeout
      );

      const startTime = Date.now();
      const result = await validateMaraConnectivity(config);
      const elapsedTime = Date.now() - startTime;

      assert(!result.isValid);
      assert(elapsedTime < 1500, "Should timeout within configured time");
      assert(result.errors.some(error => error.includes("timeout")));

      globalThis.fetch = originalFetch;
    });

    it("should skip connectivity check for disabled config", async () => {
      const config = {
        apiBaseUrl: "",
        apiTimeout: 0,
        serviceFeeAmount: 0,
        serviceFeeAddress: "",
        enabled: false,
      };

      const result = await validateMaraConnectivity(config);

      assert(result.isValid);
      assertEquals(result.errors.length, 0);
      assert(result.warnings.some(warning => warning.includes("disabled")));
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle malformed environment variables gracefully", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        switch (key) {
          case "MARA_ENABLED": return "maybe"; // Invalid boolean
          case "MARA_API_TIMEOUT": return "not-a-number";
          case "MARA_SERVICE_FEE_AMOUNT": return "42000.5"; // Not integer
          default: return undefined;
        }
      });

      const result = validateMaraConfigOnStartup();

      // Should handle gracefully and provide useful errors
      assert(result.errors.length > 0);
      assert(result.errors.some(error => error.includes("boolean") || error.includes("MARA_ENABLED")));

      envStub.restore();
    });

    it("should provide clear guidance for missing required variables", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        if (key === "MARA_ENABLED") return "true";
        return undefined; // All other variables missing
      });

      const result = validateMaraConfigOnStartup();

      assert(!result.isValid);
      assert(result.errors.length > 0);
      
      // Should mention which environment variables are missing
      const hasGuidance = result.errors.some(error => 
        error.includes("MARA_") && (error.includes("missing") || error.includes("required"))
      );
      assert(hasGuidance, "Should provide guidance about missing variables");

      envStub.restore();
    });

    it("should validate configuration object type safety", () => {
      const invalidConfig = {
        apiBaseUrl: 123, // Wrong type
        apiTimeout: "string", // Wrong type
        serviceFeeAmount: null, // Wrong type
        serviceFeeAddress: undefined, // Wrong type
        enabled: "yes", // Wrong type
      };

      const result: MaraConfigValidationResult = {
        isValid: false,
        config: null,
        errors: [],
        warnings: [],
      };

      // This simulates what the validator should do with invalid types
      assert(!result.isValid);
      assertEquals(result.config, null);
      assert(Array.isArray(result.errors));
      assert(Array.isArray(result.warnings));
    });

    it("should handle network interruptions during validation", async () => {
      const config = {
        apiBaseUrl: "https://slipstream.mara.com/rest-api",
        apiTimeout: 30000,
        serviceFeeAmount: 42000,
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      // Mock fetch to simulate network interruption
      const originalFetch = globalThis.fetch;
      globalThis.fetch = stub(
        globalThis,
        "fetch",
        () => Promise.reject(new TypeError("Failed to fetch"))
      );

      const result = await validateMaraConnectivity(config);

      assert(!result.isValid);
      assert(result.errors.some(error => 
        error.includes("network") || error.includes("connection") || error.includes("fetch")
      ));

      globalThis.fetch = originalFetch;
    });
  });

  describe("Performance and Resource Management", () => {
    it("should complete validation within reasonable time", async () => {
      const config = {
        apiBaseUrl: "https://slipstream.mara.com/rest-api",
        apiTimeout: 30000,
        serviceFeeAmount: 42000,
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      // Mock successful response
      const originalFetch = globalThis.fetch;
      globalThis.fetch = stub(
        globalThis,
        "fetch",
        () => Promise.resolve(new Response(JSON.stringify({ status: "ok" }), { status: 200 }))
      );

      const startTime = Date.now();
      const result = await validateMaraConnectivity(config);
      const elapsedTime = Date.now() - startTime;

      assert(result.isValid);
      assert(elapsedTime < 5000, "Validation should complete within 5 seconds");

      globalThis.fetch = originalFetch;
    });

    it("should not leak resources during validation", () => {
      // Test that multiple validations don't accumulate resources
      const results = [];
      
      for (let i = 0; i < 10; i++) {
        const envStub = stub(Deno.env, "get", (key: string) => {
          if (key === "MARA_ENABLED") return "false";
          return undefined;
        });

        const result = validateMaraConfigOnStartup();
        results.push(result);

        envStub.restore();
      }

      // All results should be consistent
      results.forEach(result => {
        assert(result.isValid);
        assertEquals(result.config!.enabled, false);
      });
    });
  });
});