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

        assert(!isValidMaraConfig(incompleteConfig));
      });

      it("should reject config with invalid property types", () => {
        const invalidConfig = {
          apiBaseUrl: 123, // Should be string
          apiTimeout: "30000", // Should be number
          serviceFeeAmount: 42000,
          serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
          enabled: true,
        };

        assert(!isValidMaraConfig(invalidConfig));
      });

      it("should reject null or undefined values", () => {
        assert(!isValidMaraConfig(null));
        assert(!isValidMaraConfig(undefined));
        assert(!isValidMaraConfig({}));
      });

      it("should handle disabled config correctly", () => {
        const disabledConfig: MaraConfig = {
          apiBaseUrl: "",
          apiTimeout: 0,
          serviceFeeAmount: 0,
          serviceFeeAddress: "",
          enabled: false,
        };

        assert(isValidMaraConfig(disabledConfig));
      });
    });
  });

  describe("Validation Functions", () => {
    describe("validateMaraApiBaseUrl", () => {
      it("should validate correct HTTPS URLs", () => {
        const validUrls = [
          "https://slipstream.mara.com/rest-api",
          "https://api.mara.com/v1",
          "https://localhost:8080/api",
        ];

        validUrls.forEach(url => {
          const result = validateMaraApiBaseUrl(url);
          assert(result.isValid, `Should be valid: ${url}`);
          assertEquals(result.error, undefined);
        });
      });

      it("should reject HTTP URLs in production", () => {
        const httpUrl = "http://slipstream.mara.com/rest-api";
        const result = validateMaraApiBaseUrl(httpUrl);
        
        assert(!result.isValid);
        assertExists(result.error);
        assert(result.error!.includes("HTTPS"));
      });

      it("should reject invalid URLs", () => {
        const invalidUrls = [
          "",
          "not-a-url",
          "ftp://example.com",
          "https://",
          "https:///invalid",
        ];

        invalidUrls.forEach(url => {
          const result = validateMaraApiBaseUrl(url);
          assert(!result.isValid, `Should be invalid: ${url}`);
          assertExists(result.error);
        });
      });

      it("should allow HTTP URLs in development environment", () => {
        // Mock environment for development
        const envStub = stub(Deno.env, "get", (key: string) => {
          if (key === "DENO_ENV") return "development";
          return undefined;
        });

        const httpUrl = "http://localhost:3000/api";
        const result = validateMaraApiBaseUrl(httpUrl);
        
        assert(result.isValid);
        assertEquals(result.error, undefined);

        envStub.restore();
      });
    });

    describe("validateMaraApiTimeout", () => {
      it("should validate timeouts within valid range", () => {
        const validTimeouts = [1000, 5000, 30000, 60000];

        validTimeouts.forEach(timeout => {
          const result = validateMaraApiTimeout(timeout);
          assert(result.isValid, `Should be valid: ${timeout}`);
          assertEquals(result.error, undefined);
        });
      });

      it("should reject timeouts below minimum", () => {
        const result = validateMaraApiTimeout(500);
        assert(!result.isValid);
        assertExists(result.error);
        assert(result.error!.includes("at least 1000"));
      });

      it("should reject timeouts above maximum", () => {
        const result = validateMaraApiTimeout(120000);
        assert(!result.isValid);
        assertExists(result.error);
        assert(result.error!.includes("exceed 60000"));
      });

      it("should reject non-integer timeouts", () => {
        const result = validateMaraApiTimeout(30000.5);
        assert(!result.isValid);
        assertExists(result.error);
        assert(result.error!.includes("integer"));
      });

      it("should reject negative timeouts", () => {
        const result = validateMaraApiTimeout(-1000);
        assert(!result.isValid);
        assertExists(result.error);
      });
    });

    describe("validateMaraServiceFeeAmount", () => {
      it("should validate the required fee amount", () => {
        const result = validateMaraServiceFeeAmount(42000);
        assert(result.isValid);
        assertEquals(result.error, undefined);
      });

      it("should reject incorrect fee amounts", () => {
        const invalidAmounts = [0, 1000, 41999, 42001, 50000];

        invalidAmounts.forEach(amount => {
          const result = validateMaraServiceFeeAmount(amount);
          assert(!result.isValid, `Should be invalid: ${amount}`);
          assertExists(result.error);
          assert(result.error!.includes("42000"));
        });
      });

      it("should reject non-integer amounts", () => {
        const result = validateMaraServiceFeeAmount(42000.5);
        assert(!result.isValid);
        assertExists(result.error);
        assert(result.error!.includes("integer"));
      });
    });

    describe("validateMaraServiceFeeAddress", () => {
      it("should validate correct Bitcoin addresses", () => {
        const validAddresses = [
          "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m", // bech32
          "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", // P2PKH
          "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy", // P2SH
        ];

        validAddresses.forEach(address => {
          const result = validateMaraServiceFeeAddress(address);
          assert(result.isValid, `Should be valid: ${address}`);
          assertEquals(result.error, undefined);
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
          const result = validateMaraServiceFeeAddress(address);
          assert(!result.isValid, `Should be invalid: ${address}`);
          assertExists(result.error);
        });
      });

      it("should prefer bech32 addresses", () => {
        const bech32Address = "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m";
        const result = validateMaraServiceFeeAddress(bech32Address);
        
        assert(result.isValid);
        assertEquals(result.warning, undefined);
      });

      it("should warn about non-bech32 addresses", () => {
        const p2pkhAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
        const result = validateMaraServiceFeeAddress(p2pkhAddress);
        
        assert(result.isValid);
        assertExists(result.warning);
        assert(result.warning!.includes("bech32"));
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
            case "MARA_SERVICE_FEE_AMOUNT": return "42000";
            case "MARA_SERVICE_FEE_ADDRESS": return "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m";
            case "MARA_ENABLED": return "true";
            default: return undefined;
          }
        });

        const config = createMaraConfigFromEnv();

        assertEquals(config.apiBaseUrl, "https://api.mara.com");
        assertEquals(config.apiTimeout, 25000);
        assertEquals(config.serviceFeeAmount, 42000);
        assertEquals(config.serviceFeeAddress, "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m");
        assertEquals(config.enabled, true);

        envStub.restore();
      });

      it("should use default values for missing environment variables", () => {
        const envStub = stub(Deno.env, "get", (_key: string) => undefined);

        const config = createMaraConfigFromEnv();

        assertEquals(config.apiBaseUrl, DEFAULT_MARA_CONFIG.apiBaseUrl);
        assertEquals(config.apiTimeout, DEFAULT_MARA_CONFIG.apiTimeout);
        assertEquals(config.serviceFeeAmount, DEFAULT_MARA_CONFIG.serviceFeeAmount);
        assertEquals(config.serviceFeeAddress, DEFAULT_MARA_CONFIG.serviceFeeAddress);
        assertEquals(config.enabled, DEFAULT_MARA_CONFIG.enabled);

        envStub.restore();
      });

      it("should handle invalid numeric environment variables", () => {
        const envStub = stub(Deno.env, "get", (key: string) => {
          switch (key) {
            case "MARA_API_TIMEOUT": return "invalid-number";
            case "MARA_SERVICE_FEE_AMOUNT": return "not-a-number";
            default: return undefined;
          }
        });

        const config = createMaraConfigFromEnv();

        // Should fall back to defaults for invalid numbers
        assertEquals(config.apiTimeout, DEFAULT_MARA_CONFIG.apiTimeout);
        assertEquals(config.serviceFeeAmount, DEFAULT_MARA_CONFIG.serviceFeeAmount);

        envStub.restore();
      });

      it("should handle boolean environment variables correctly", () => {
        const testCases = [
          { value: "true", expected: true },
          { value: "false", expected: false },
          { value: "1", expected: true },
          { value: "0", expected: false },
          { value: "yes", expected: true },
          { value: "no", expected: false },
          { value: "invalid", expected: false },
        ];

        testCases.forEach(({ value, expected }) => {
          const envStub = stub(Deno.env, "get", (key: string) => {
            if (key === "MARA_ENABLED") return value;
            return undefined;
          });

          const config = createMaraConfigFromEnv();
          assertEquals(config.enabled, expected, `For value "${value}"`);

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

      // Verify the service fee amount constant
      assertEquals(DEFAULT_MARA_CONFIG.serviceFeeAmount, MARA_SERVICE_FEE_AMOUNT);
    });

    it("should have valid service fee amount constant", () => {
      assertEquals(MARA_SERVICE_FEE_AMOUNT, 42000);
      assertEquals(typeof MARA_SERVICE_FEE_AMOUNT, "number");
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

      // Should fall back to defaults for empty strings
      assertEquals(config.apiBaseUrl, DEFAULT_MARA_CONFIG.apiBaseUrl);
      assertEquals(config.apiTimeout, DEFAULT_MARA_CONFIG.apiTimeout);
      assertEquals(config.serviceFeeAmount, DEFAULT_MARA_CONFIG.serviceFeeAmount);
      assertEquals(config.serviceFeeAddress, DEFAULT_MARA_CONFIG.serviceFeeAddress);
      assertEquals(config.enabled, DEFAULT_MARA_CONFIG.enabled);

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

      // Should trim whitespace
      assertEquals(config.apiBaseUrl, "https://api.mara.com");
      assertEquals(config.serviceFeeAddress, "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m");
      assertEquals(config.enabled, true);

      envStub.restore();
    });

    it("should validate readonly property constraints", () => {
      const config: MaraConfig = {
        apiBaseUrl: "https://api.mara.com",
        apiTimeout: 30000,
        serviceFeeAmount: 42000,
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      // Attempting to modify readonly properties should fail in TypeScript
      // but we can test the runtime behavior
      assertThrows(() => {
        (config as any).apiBaseUrl = "https://malicious.com";
      }, TypeError, "Cannot assign to read only property");
    });
  });

  describe("Integration Tests", () => {
    it("should create and validate complete configuration workflow", () => {
      // Step 1: Set up environment
      const envStub = stub(Deno.env, "get", (key: string) => {
        switch (key) {
          case "MARA_API_BASE_URL": return "https://slipstream.mara.com/rest-api";
          case "MARA_API_TIMEOUT": return "30000";
          case "MARA_SERVICE_FEE_AMOUNT": return "42000";
          case "MARA_SERVICE_FEE_ADDRESS": return "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m";
          case "MARA_ENABLED": return "true";
          default: return undefined;
        }
      });

      // Step 2: Create configuration
      const config = createMaraConfigFromEnv();

      // Step 3: Validate configuration
      assert(isValidMaraConfig(config));

      // Step 4: Validate individual components
      assert(validateMaraApiBaseUrl(config.apiBaseUrl).isValid);
      assert(validateMaraApiTimeout(config.apiTimeout).isValid);
      assert(validateMaraServiceFeeAmount(config.serviceFeeAmount).isValid);
      assert(validateMaraServiceFeeAddress(config.serviceFeeAddress).isValid);

      envStub.restore();
    });

    it("should handle disabled MARA configuration", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        if (key === "MARA_ENABLED") return "false";
        return undefined;
      });

      const config = createMaraConfigFromEnv();

      assertEquals(config.enabled, false);
      assert(isValidMaraConfig(config));

      envStub.restore();
    });
  });
});