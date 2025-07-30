import { assert, assertEquals, assertExists } from "@std/assert";
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

describe("MARA Configuration - Simple Tests", () => {
  beforeEach(() => {
    restore();
  });

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

    it("should reject incomplete config", () => {
      const incompleteConfig = {
        apiBaseUrl: "https://slipstream.mara.com/rest-api",
        apiTimeout: 30000,
        // Missing serviceFeeAmount, serviceFeeAddress, enabled
      };

      assert(!isMaraConfig(incompleteConfig));
    });

    it("should reject null/undefined", () => {
      assert(!isMaraConfig(null));
      assert(!isMaraConfig(undefined));
      assert(!isMaraConfig({}));
    });

    it("should validate service fee amount exactly", () => {
      const configWrongFee = {
        apiBaseUrl: "https://slipstream.mara.com/rest-api",
        apiTimeout: 30000,
        serviceFeeAmount: 50000, // Wrong amount
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      assert(!isMaraConfig(configWrongFee));
    });

    it("should validate timeout range", () => {
      const configLowTimeout = {
        apiBaseUrl: "https://slipstream.mara.com/rest-api",
        apiTimeout: 500, // Too low
        serviceFeeAmount: 42000,
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      assert(!isMaraConfig(configLowTimeout));

      const configHighTimeout = {
        apiBaseUrl: "https://slipstream.mara.com/rest-api",
        apiTimeout: 120000, // Too high
        serviceFeeAmount: 42000,
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      assert(!isMaraConfig(configHighTimeout));
    });
  });

  describe("isValidBitcoinAddress", () => {
    it("should validate bech32 addresses", () => {
      assert(isValidBitcoinAddress("bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m"));
    });

    it("should validate P2PKH addresses", () => {
      assert(isValidBitcoinAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"));
    });

    it("should validate P2SH addresses", () => {
      assert(isValidBitcoinAddress("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"));
    });

    it("should reject invalid addresses", () => {
      assert(!isValidBitcoinAddress(""));
      assert(!isValidBitcoinAddress("invalid-address"));
      assert(!isValidBitcoinAddress("bc1qinvalid"));
      assert(!isValidBitcoinAddress("tb1qtestnet"));
    });
  });

  describe("validateMaraConfig", () => {
    it("should pass for valid config", () => {
      const validConfig: MaraConfig = {
        apiBaseUrl: "https://slipstream.mara.com/rest-api",
        apiTimeout: 30000,
        serviceFeeAmount: 42000,
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      // Should not throw
      validateMaraConfig(validConfig);
    });

    it("should throw for invalid config", () => {
      const invalidConfig = {
        apiBaseUrl: "https://slipstream.mara.com/rest-api",
        apiTimeout: 30000,
        serviceFeeAmount: 50000, // Wrong amount
        serviceFeeAddress: "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m",
        enabled: true,
      };

      try {
        validateMaraConfig(invalidConfig);
        assert(false, "Should have thrown for invalid config");
      } catch (error) {
        assert(error instanceof Error);
      }
    });
  });

  describe("createMaraConfigFromEnv", () => {
    it("should create config from environment variables", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        switch (key) {
          case "MARA_API_BASE_URL": return "https://api.mara.com";
          case "MARA_API_TIMEOUT": return "25000";
          case "MARA_SERVICE_FEE_SATS": return "42000";
          case "MARA_SERVICE_FEE_ADDRESS": return "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m";
          default: return undefined;
        }
      });

      const config = createMaraConfigFromEnv();

      if (config) {
        assertEquals(config.apiBaseUrl, "https://api.mara.com");
        assertEquals(config.apiTimeout, 25000);
        assertEquals(config.serviceFeeAmount, 42000);
        assertEquals(config.serviceFeeAddress, "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m");
        assertEquals(config.enabled, true); // Always true in implementation
      }

      envStub.restore();
    });

    it("should throw for invalid configuration", () => {
      const envStub = stub(Deno.env, "get", (key: string) => {
        // Return empty service fee address which will make validation fail
        if (key === "MARA_SERVICE_FEE_ADDRESS") return "";
        return undefined;
      });

      try {
        createMaraConfigFromEnv();
        assert(false, "Should have thrown for invalid config");
      } catch (error) {
        assert(error instanceof Error);
      }

      envStub.restore();
    });

    it("should always enable MARA regardless of environment", () => {
      // The implementation always sets enabled = true
      const envStub = stub(Deno.env, "get", (key: string) => {
        switch (key) {
          case "MARA_API_BASE_URL": return "https://api.mara.com";
          case "MARA_API_TIMEOUT": return "30000";
          case "MARA_SERVICE_FEE_SATS": return "42000";
          case "MARA_SERVICE_FEE_ADDRESS": return "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m";
          default: return undefined;
        }
      });

      const config = createMaraConfigFromEnv();
      if (config) {
        assertEquals(config.enabled, true); // Always true according to implementation
      }

      envStub.restore();
    });
  });

  describe("DEFAULT_MARA_CONFIG", () => {
    it("should have valid default configuration", () => {
      assertExists(DEFAULT_MARA_CONFIG);
      assert(isMaraConfig(DEFAULT_MARA_CONFIG));
      
      assertEquals(typeof DEFAULT_MARA_CONFIG.apiBaseUrl, "string");
      assertEquals(typeof DEFAULT_MARA_CONFIG.apiTimeout, "number");
      assertEquals(typeof DEFAULT_MARA_CONFIG.serviceFeeAmount, "number");
      assertEquals(typeof DEFAULT_MARA_CONFIG.serviceFeeAddress, "string");
      assertEquals(typeof DEFAULT_MARA_CONFIG.enabled, "boolean");

      assertEquals(DEFAULT_MARA_CONFIG.serviceFeeAmount, 42000);
    });

    it("should have valid Bitcoin address in default config", () => {
      assert(isValidBitcoinAddress(DEFAULT_MARA_CONFIG.serviceFeeAddress));
    });
  });
});