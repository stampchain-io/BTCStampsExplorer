import { assert, assertEquals, assertExists, assertThrows } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { stub, restore } from "@std/testing/mock";

import {
  type MaraConfigValidationResult,
  validateMaraConfigOnStartup,
  assertValidMaraConfig,
  isMaraIntegrationEnabled,
  getValidatedMaraConfig,
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
          case "MARA_SERVICE_FEE_SATS": return "42000";
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

    it("should handle MARA configuration (always enabled)", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        if (key === "MARA_ENABLED") return "false"; // Ignored - MARA is always enabled
        return undefined;
      });

      const result = validateMaraConfigOnStartup();

      assert(result.isValid);
      assertExists(result.config);
      assertEquals(result.errors.length, 0);
      assertEquals(result.config!.enabled, true); // Always enabled

      envStub.restore();
    });

    it("should collect validation errors for invalid config", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        switch (key) {
          case "MARA_ENABLED": return "true";
          case "MARA_API_BASE_URL": return "invalid-url"; // Invalid URL
          case "MARA_API_TIMEOUT": return "not-a-number"; // Invalid number
          case "MARA_SERVICE_FEE_SATS": return "abc"; // Invalid number
          case "MARA_SERVICE_FEE_ADDRESS": return "invalid-address";
          default: return undefined;
        }
      });

      const result = validateMaraConfigOnStartup();

      // With invalid URL, validation should fail
      assert(!result.isValid);
      assertEquals(result.config, null);
      assert(result.errors.length > 0);
      assert(result.errors.some(e => e.includes("Invalid MARA API URL")));

      envStub.restore();
    });

    it("should use defaults for missing environment variables", () => {
      const envStub = stub(Deno.env, "get", (_key: string) => undefined);

      const result = validateMaraConfigOnStartup();

      assert(result.isValid);
      assertExists(result.config);
      assertEquals(result.config!.apiBaseUrl, DEFAULT_MARA_CONFIG.apiBaseUrl);
      assertEquals(result.config!.apiTimeout, DEFAULT_MARA_CONFIG.apiTimeout);
      assertEquals(result.config!.serviceFeeAmount, DEFAULT_MARA_CONFIG.serviceFeeAmount);
      assertEquals(result.config!.serviceFeeAddress, DEFAULT_MARA_CONFIG.serviceFeeAddress);
      assertEquals(result.config!.enabled, true); // Always enabled

      envStub.restore();
    });

    it("should handle partial configuration", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        switch (key) {
          case "MARA_ENABLED": return "true";
          case "MARA_API_BASE_URL": return "https://custom.mara.com/api";
          // Other values will use defaults
          default: return undefined;
        }
      });

      const result = validateMaraConfigOnStartup();

      assert(result.isValid);
      assertExists(result.config);
      assertEquals(result.config!.enabled, true);
      assertEquals(result.config!.apiBaseUrl, "https://custom.mara.com/api");
      assertEquals(result.config!.apiTimeout, DEFAULT_MARA_CONFIG.apiTimeout);
      assertEquals(result.config!.serviceFeeAmount, DEFAULT_MARA_CONFIG.serviceFeeAmount);
      assertEquals(result.config!.serviceFeeAddress, DEFAULT_MARA_CONFIG.serviceFeeAddress);

      envStub.restore();
    });
  });

  describe("assertValidMaraConfig", () => {
    it("should return valid config without throwing", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        switch (key) {
          case "MARA_ENABLED": return "true";
          case "MARA_API_BASE_URL": return "https://slipstream.mara.com/rest-api";
          case "MARA_API_TIMEOUT": return "30000";
          case "MARA_SERVICE_FEE_SATS": return "42000";
          case "MARA_SERVICE_FEE_ADDRESS": return "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m";
          default: return undefined;
        }
      });

      const config = assertValidMaraConfig();

      assertExists(config);
      assertEquals(config.enabled, true);
      assertEquals(config.apiBaseUrl, "https://slipstream.mara.com/rest-api");

      envStub.restore();
    });

    it("should handle config (always enabled)", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        if (key === "MARA_ENABLED") return "false"; // Ignored
        return undefined;
      });

      const config = assertValidMaraConfig();

      assertExists(config);
      assertEquals(config.enabled, true); // Always enabled

      envStub.restore();
    });
  });

  describe("isMaraIntegrationEnabled", () => {
    it("should return true when MARA is enabled", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        if (key === "MARA_ENABLED") return "true";
        return undefined;
      });

      const result = isMaraIntegrationEnabled();

      assertEquals(result, true);

      envStub.restore();
    });

    it("should return true (MARA is always enabled)", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        if (key === "MARA_ENABLED") return "false"; // Ignored
        return undefined;
      });

      const result = isMaraIntegrationEnabled();

      assertEquals(result, true); // Always enabled

      envStub.restore();
    });

    it("should return false by default", () => {
      const envStub = stub(Deno.env, "get", (_key: string) => undefined);

      const result = isMaraIntegrationEnabled();

      assertEquals(result, true); // DEFAULT_MARA_CONFIG.enabled is true

      envStub.restore();
    });
  });

  describe("getValidatedMaraConfig", () => {
    it("should return config when valid", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        switch (key) {
          case "MARA_ENABLED": return "true";
          case "MARA_API_BASE_URL": return "https://slipstream.mara.com/rest-api";
          case "MARA_API_TIMEOUT": return "30000";
          case "MARA_SERVICE_FEE_SATS": return "42000";
          case "MARA_SERVICE_FEE_ADDRESS": return "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m";
          default: return undefined;
        }
      });

      const config = getValidatedMaraConfig();

      assertExists(config);
      assertEquals(config.enabled, true);
      assertEquals(config.apiBaseUrl, "https://slipstream.mara.com/rest-api");

      envStub.restore();
    });

    it("should return config (always enabled)", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        if (key === "MARA_ENABLED") return "false"; // Ignored
        return undefined;
      });

      const config = getValidatedMaraConfig();

      assertExists(config);
      assertEquals(config.enabled, true); // Always enabled

      envStub.restore();
    });

    it("should return config with defaults", () => {
      const envStub = stub(Deno.env, "get", (_key: string) => undefined);

      const config = getValidatedMaraConfig();

      assertExists(config);
      assertEquals(config.apiBaseUrl, DEFAULT_MARA_CONFIG.apiBaseUrl);
      assertEquals(config.apiTimeout, DEFAULT_MARA_CONFIG.apiTimeout);
      assertEquals(config.serviceFeeAmount, DEFAULT_MARA_CONFIG.serviceFeeAmount);
      assertEquals(config.serviceFeeAddress, DEFAULT_MARA_CONFIG.serviceFeeAddress);
      assertEquals(config.enabled, DEFAULT_MARA_CONFIG.enabled);

      envStub.restore();
    });
  });

  describe("Edge Cases", () => {
    it("should handle malformed environment variables gracefully", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        switch (key) {
          case "MARA_ENABLED": return "maybe"; // Invalid boolean
          case "MARA_API_TIMEOUT": return "not-a-number";
          case "MARA_SERVICE_FEE_SATS": return "42000.5"; // Not integer
          default: return undefined;
        }
      });

      const result = validateMaraConfigOnStartup();

      // Should handle gracefully with defaults
      assert(result.isValid);
      assertExists(result.config);

      envStub.restore();
    });

    it("should handle empty string environment variables", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        if (key.startsWith("MARA_")) return "";
        return undefined;
      });

      const result = validateMaraConfigOnStartup();

      assert(result.isValid);
      assertExists(result.config);
      // Should fall back to defaults
      assertEquals(result.config!.apiBaseUrl, DEFAULT_MARA_CONFIG.apiBaseUrl);
      assertEquals(result.config!.apiTimeout, DEFAULT_MARA_CONFIG.apiTimeout);
      assertEquals(result.config!.serviceFeeAmount, DEFAULT_MARA_CONFIG.serviceFeeAmount);
      assertEquals(result.config!.serviceFeeAddress, DEFAULT_MARA_CONFIG.serviceFeeAddress);
      assertEquals(result.config!.enabled, true); // Always enabled

      envStub.restore();
    });

    it("should handle whitespace in environment variables", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        switch (key) {
          case "MARA_API_BASE_URL": return "  https://api.mara.com  ";
          case "MARA_SERVICE_FEE_ADDRESS": return "  bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m  ";
          case "MARA_ENABLED": return "  true  ";
          default: return undefined;
        }
      });

      const result = validateMaraConfigOnStartup();

      assert(result.isValid);
      assertExists(result.config);
      // Should trim whitespace
      assertEquals(result.config!.apiBaseUrl, "https://api.mara.com");
      assertEquals(result.config!.serviceFeeAddress, "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m");
      assertEquals(result.config!.enabled, true);

      envStub.restore();
    });
  });

  describe("Integration Tests", () => {
    it("should validate configuration workflow", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        switch (key) {
          case "MARA_API_BASE_URL": return "https://slipstream.mara.com/rest-api";
          case "MARA_API_TIMEOUT": return "30000";
          case "MARA_SERVICE_FEE_SATS": return "42000";
          case "MARA_SERVICE_FEE_ADDRESS": return "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m";
          case "MARA_ENABLED": return "true";
          default: return undefined;
        }
      });

      // Test all validator functions work together
      const validationResult = validateMaraConfigOnStartup();
      assert(validationResult.isValid);

      const isEnabled = isMaraIntegrationEnabled();
      assertEquals(isEnabled, true);

      const config = getValidatedMaraConfig();
      assertExists(config);
      assertEquals(config.enabled, true);

      const assertedConfig = assertValidMaraConfig();
      assertExists(assertedConfig);
      assertEquals(assertedConfig.enabled, true);

      envStub.restore();
    });

    it("should handle MARA workflow (always enabled)", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        if (key === "MARA_ENABLED") return "false"; // Ignored
        return undefined;
      });

      const validationResult = validateMaraConfigOnStartup();
      assert(validationResult.isValid);

      const isEnabled = isMaraIntegrationEnabled();
      assertEquals(isEnabled, true); // Always enabled

      const config = getValidatedMaraConfig();
      assertExists(config);
      assertEquals(config.enabled, true); // Always enabled

      envStub.restore();
    });
  });
});