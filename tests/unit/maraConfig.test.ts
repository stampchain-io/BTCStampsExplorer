import { assert, assertEquals, assertExists, assertThrows } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { stub, restore } from "@std/testing/mock";

import {
  type MaraConfig,
  isMaraConfig,
  createMaraConfigFromEnv,
  validateMaraConfig,
  isValidBitcoinAddress,
  DEFAULT_MARA_CONFIG,
} from "../../server/config/maraConfig.ts";

describe("MARA Configuration", () => {
  beforeEach(() => {
    // Clean up environment stubs after each test
    restore();
  });

  describe("Type Guards", () => {
    describe("isMaraConfig", () => {
      it("should validate complete valid config", () => {
        const validConfig: MaraConfig = {
          apiBaseUrl: "https://slipstream.mara.com/rest-api",
          apiTimeout: 30000,
          serviceFeeAmount: 42000,
          serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
          enabled: true,
        };

        assert(isMaraConfig(validConfig));
      });

      it("should reject config with missing properties", () => {
        const incompleteConfig = {
          apiBaseUrl: "https://slipstream.mara.com/rest-api",
          apiTimeout: 30000,
          // Missing serviceFeeAmount, serviceFeeAddress, enabled
        };

        assert(!isMaraConfig(incompleteConfig));
      });

      it("should reject config with invalid property types", () => {
        const invalidConfig = {
          apiBaseUrl: 123, // Should be string
          apiTimeout: "30000", // Should be number
          serviceFeeAmount: 42000,
          serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
          enabled: true,
        };

        assert(!isMaraConfig(invalidConfig));
      });

      it("should reject null or undefined values", () => {
        assert(!isMaraConfig(null));
        assert(!isMaraConfig(undefined));
        assert(!isMaraConfig({}));
      });

      it("should reject config with invalid values", () => {
        const configWithInvalidValues = {
          apiBaseUrl: "", // Empty string fails validation
          apiTimeout: 0, // Below minimum timeout
          serviceFeeAmount: 0, // Not the required 42000
          serviceFeeAddress: "", // Empty string fails validation
          enabled: false,
        };

        assert(!isMaraConfig(configWithInvalidValues));
      });
    });
  });

  describe("Bitcoin Address Validation", () => {
    it("should validate correct Bitcoin addresses", () => {
      const validAddresses = [
        "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m", // bech32
        "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", // P2PKH
        "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy", // P2SH
      ];

      validAddresses.forEach(address => {
        assert(isValidBitcoinAddress(address), `Should be valid: ${address}`);
      });
    });

    it("should reject invalid Bitcoin addresses", () => {
      const invalidAddresses = [
        "",
        "invalid-address",
        "bc1qinvalid",
        "1invalidP2PKH",
        "3invalidP2SH",
        "tb1qtestnet", // testnet address
      ];

      invalidAddresses.forEach(address => {
        assert(!isValidBitcoinAddress(address), `Should be invalid: ${address}`);
      });
    });
  });

  describe("Configuration Creation", () => {
    describe("createMaraConfigFromEnv", () => {
      it("should create config from environment variables", () => {
        const envStub = stub(Deno.env, "get", (key: string) => {
          switch (key) {
            case "MARA_API_BASE_URL": return "https://api.mara.com";
            case "MARA_API_TIMEOUT": return "25000";
            case "MARA_SERVICE_FEE_SATS": return "42000";
            case "MARA_SERVICE_FEE_ADDRESS": return "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m";
            case "MARA_ENABLED": return "true";
            default: return undefined;
          }
        });

        const config = createMaraConfigFromEnv();

        assertExists(config);
        assertEquals(config!.apiBaseUrl, "https://api.mara.com");
        assertEquals(config!.apiTimeout, 25000);
        assertEquals(config!.serviceFeeAmount, 42000);
        assertEquals(config!.serviceFeeAddress, "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m");
        assertEquals(config!.enabled, true);

        envStub.restore();
      });

      it("should use default values for missing environment variables", () => {
        const envStub = stub(Deno.env, "get", (_key: string) => undefined);

        const config = createMaraConfigFromEnv();

        assertExists(config);
        assertEquals(config!.apiBaseUrl, DEFAULT_MARA_CONFIG.apiBaseUrl);
        assertEquals(config!.apiTimeout, DEFAULT_MARA_CONFIG.apiTimeout);
        assertEquals(config!.serviceFeeAmount, DEFAULT_MARA_CONFIG.serviceFeeAmount);
        assertEquals(config!.serviceFeeAddress, DEFAULT_MARA_CONFIG.serviceFeeAddress);
        assertEquals(config!.enabled, true); // MARA is always enabled

        envStub.restore();
      });

      it("should handle invalid numeric environment variables", () => {
        const envStub = stub(Deno.env, "get", (key: string) => {
          switch (key) {
            case "MARA_API_TIMEOUT": return "invalid-number";
            case "MARA_SERVICE_FEE_SATS": return "not-a-number";
            default: return undefined;
          }
        });

        const config = createMaraConfigFromEnv();

        assertExists(config);
        // Should fall back to defaults for invalid numbers
        assertEquals(config!.apiTimeout, DEFAULT_MARA_CONFIG.apiTimeout);
        assertEquals(config!.serviceFeeAmount, DEFAULT_MARA_CONFIG.serviceFeeAmount);

        envStub.restore();
      });

      it("should ignore MARA_ENABLED environment variable (always enabled)", () => {
        const testCases = [
          "true",
          "false", 
          "1",
          "0",
          "yes",
          "no",
          "invalid",
        ];

        testCases.forEach((value) => {
          const envStub = stub(Deno.env, "get", (key: string) => {
            if (key === "MARA_ENABLED") return value;
            return undefined;
          });

          const config = createMaraConfigFromEnv();
          assertExists(config);
          // MARA is always enabled in the implementation
          assertEquals(config!.enabled, true, `MARA is always enabled regardless of env value "${value}"`);

          envStub.restore();
        });
      });
    });
  });

  describe("Constants", () => {
    it("should have correct default configuration", () => {
      assertExists(DEFAULT_MARA_CONFIG);
      assertEquals(typeof DEFAULT_MARA_CONFIG.apiBaseUrl, "string");
      assertEquals(typeof DEFAULT_MARA_CONFIG.apiTimeout, "number");
      assertEquals(typeof DEFAULT_MARA_CONFIG.serviceFeeAmount, "number");
      assertEquals(typeof DEFAULT_MARA_CONFIG.serviceFeeAddress, "string");
      assertEquals(typeof DEFAULT_MARA_CONFIG.enabled, "boolean");

      // Verify specific values
      assertEquals(DEFAULT_MARA_CONFIG.serviceFeeAmount, 42000);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty strings in environment variables", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        // Return empty strings for all MARA config variables
        if (key.startsWith("MARA_")) return "";
        return undefined;
      });

      const config = createMaraConfigFromEnv();

      assertExists(config);
      // Should fall back to defaults for empty strings
      assertEquals(config!.apiBaseUrl, DEFAULT_MARA_CONFIG.apiBaseUrl);
      assertEquals(config!.apiTimeout, DEFAULT_MARA_CONFIG.apiTimeout);
      assertEquals(config!.serviceFeeAmount, DEFAULT_MARA_CONFIG.serviceFeeAmount);
      assertEquals(config!.serviceFeeAddress, DEFAULT_MARA_CONFIG.serviceFeeAddress);
      assertEquals(config!.enabled, DEFAULT_MARA_CONFIG.enabled);

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

      const config = createMaraConfigFromEnv();

      assertExists(config);
      // Should trim whitespace
      assertEquals(config!.apiBaseUrl, "https://api.mara.com");
      assertEquals(config!.serviceFeeAddress, "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m");
      assertEquals(config!.enabled, true);

      envStub.restore();
    });

    it("should validate config object constraints", () => {
      const config: MaraConfig = {
        apiBaseUrl: "https://api.mara.com",
        apiTimeout: 30000,
        serviceFeeAmount: 42000,
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      // Test that the config passes validation
      assert(isMaraConfig(config));
      
      // Test validateMaraConfig assertion
      try {
        validateMaraConfig(config);
        assert(true, "validateMaraConfig should not throw for valid config");
      } catch {
        assert(false, "validateMaraConfig should not throw for valid config");
      }
    });
  });

  describe("Integration Tests", () => {
    it("should create and validate complete configuration workflow", () => {
      // Step 1: Set up environment
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

      // Step 2: Create configuration
      const config = createMaraConfigFromEnv();

      assertExists(config);
      // Step 3: Validate configuration
      assert(isMaraConfig(config));

      // Step 4: Validate individual components
      assert(isValidBitcoinAddress(config!.serviceFeeAddress));

      envStub.restore();
    });

    it("should handle MARA configuration (always enabled)", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        if (key === "MARA_ENABLED") return "false"; // This is ignored
        return undefined;
      });

      const config = createMaraConfigFromEnv();

      assertExists(config);
      assertEquals(config!.enabled, true); // MARA is always enabled
      assert(isMaraConfig(config));

      envStub.restore();
    });
  });
});