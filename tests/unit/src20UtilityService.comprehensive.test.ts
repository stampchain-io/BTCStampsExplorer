/**
 * Comprehensive unit tests for SRC20UtilityService
 * Covers all methods including formatSRC20Row, calculateTickHash, validation methods, and edge cases
 */

import { DatabaseManager } from "$server/database/databaseManager.ts";
import { SRC20QueryService } from "$server/services/src20/queryService.ts";
import { SRC20UtilityService } from "$server/services/src20/utilityService.ts";
import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { MockDatabaseManager } from "../mocks/mockDatabaseManager.ts";

// Store original database manager and query service methods for cleanup
let originalDbManager: DatabaseManager;
let originalFetchSrc20MintProgress: typeof SRC20QueryService.fetchSrc20MintProgress;
let originalCheckMintedOut: typeof SRC20QueryService.checkMintedOut;
let originalFetchSrc20Balance: typeof SRC20QueryService.fetchSrc20Balance;

// Setup mock database and services for testing
function setupTestEnvironment() {
  // Store the original database manager
  originalDbManager = (globalThis as any).dbManager;

  // Store original query service methods
  originalFetchSrc20MintProgress = SRC20QueryService.fetchSrc20MintProgress;
  originalCheckMintedOut = SRC20QueryService.checkMintedOut;
  originalFetchSrc20Balance = SRC20QueryService.fetchSrc20Balance;

  // Set environment to avoid Redis connections and file operations
  Deno.env.set("SKIP_REDIS_CONNECTION", "true");
  Deno.env.set("DENO_ENV", "test");

  // Create and set mock database manager
  const mockDb = new MockDatabaseManager();
  (globalThis as any).dbManager = mockDb;

  return mockDb;
}

// Cleanup test environment
function cleanupTestEnvironment() {
  if (originalDbManager) {
    (globalThis as any).dbManager = originalDbManager;
  }

  // Restore original query service methods
  SRC20QueryService.fetchSrc20MintProgress = originalFetchSrc20MintProgress;
  SRC20QueryService.checkMintedOut = originalCheckMintedOut;
  SRC20QueryService.fetchSrc20Balance = originalFetchSrc20Balance;
}

Deno.test({
  name: "SRC20UtilityService - formatSRC20Row",
  fn: async (t) => {
    await t.step("should format row with all fields", () => {
      const row = {
        tick: "\\uD83D\\uDC36", // Unicode escape for dog emoji
        max: BigInt("1000000"),
        lim: BigInt("1000"),
        amt: BigInt("500"),
        id: 1,
        block_index: 12345,
        // Add other typical fields
        op: "deploy" as const,
        creator: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
      };

      const result = SRC20UtilityService.formatSRC20Row(row);

      assertEquals(result.tick, "🐶"); // Should convert unicode escape to emoji
      assertEquals(result.max, "1000000");
      assertEquals(result.lim, "1000");
      assertEquals(result.amt, "500");
      assertEquals(result.id, 1);
      assertEquals(result.block_index, 12345);
    });

    await t.step("should handle null values", () => {
      const row = {
        tick: "TEST",
        max: null,
        lim: null,
        amt: null,
        id: 1,
        block_index: 12345,
        op: "deploy" as const,
        creator: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
      };

      const result = SRC20UtilityService.formatSRC20Row(row);

      assertEquals(result.tick, "TEST");
      assertEquals(result.max, null);
      assertEquals(result.lim, null);
      assertEquals(result.amt, null);
    });

    await t.step("should handle undefined values", () => {
      const row = {
        tick: "TEST",
        max: undefined,
        lim: undefined,
        amt: undefined,
        id: 1,
        block_index: 12345,
        op: "deploy" as const,
        creator: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
      };

      const result = SRC20UtilityService.formatSRC20Row(row);

      assertEquals(result.tick, "TEST");
      assertEquals(result.max, null);
      assertEquals(result.lim, null);
      assertEquals(result.amt, null);
    });

    await t.step("should handle zero values as falsy (return null)", () => {
      const row = {
        tick: "TEST",
        max: BigInt("0"), // BigInt("0") is falsy, so returns null
        lim: BigInt("0"),
        amt: BigInt("0"),
        id: 1,
        block_index: 12345,
        op: "deploy" as const,
        creator: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
      };

      const result = SRC20UtilityService.formatSRC20Row(row);

      assertEquals(result.tick, "TEST");
      assertEquals(result.max, null);
      assertEquals(result.lim, null);
      assertEquals(result.amt, null);
    });

    await t.step("should handle non-zero BigInt values as strings", () => {
      const row = {
        tick: "TEST",
        max: BigInt("1000000"), // Non-zero BigInt is truthy, so converts to string
        lim: BigInt("1000"),
        amt: BigInt("500"),
        id: 1,
        block_index: 12345,
        op: "deploy" as const,
        creator: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
      };

      const result = SRC20UtilityService.formatSRC20Row(row);

      assertEquals(result.tick, "TEST");
      assertEquals(result.max, "1000000");
      assertEquals(result.lim, "1000");
      assertEquals(result.amt, "500");
    });

    await t.step("should handle BigInt(0n) as falsy", () => {
      const row = {
        tick: "TEST",
        max: 0n, // This should be falsy and return null
        lim: 0n,
        amt: 0n,
        id: 1,
        block_index: 12345,
        op: "deploy" as const,
        creator: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
      };

      const result = SRC20UtilityService.formatSRC20Row(row);

      assertEquals(result.tick, "TEST");
      assertEquals(result.max, null);
      assertEquals(result.lim, null);
      assertEquals(result.amt, null);
    });
  },
});

Deno.test({
  name: "SRC20UtilityService - calculateTickHash",
  fn: async (t) => {
    await t.step("should calculate consistent hash for same input", () => {
      const tick = "TEST";
      const hash1 = SRC20UtilityService.calculateTickHash(tick);
      const hash2 = SRC20UtilityService.calculateTickHash(tick);

      assertEquals(hash1, hash2);
      assertEquals(typeof hash1, "string");
      assertEquals(hash1.length, 64); // SHA3-256 produces 64 hex characters
    });

    await t.step("should be case insensitive", () => {
      const hash1 = SRC20UtilityService.calculateTickHash("TEST");
      const hash2 = SRC20UtilityService.calculateTickHash("test");
      const hash3 = SRC20UtilityService.calculateTickHash("Test");

      assertEquals(hash1, hash2);
      assertEquals(hash2, hash3);
    });

    await t.step("should handle unicode characters", () => {
      const tick = "🐶"; // Dog emoji
      const hash = SRC20UtilityService.calculateTickHash(tick);

      assertEquals(typeof hash, "string");
      assertEquals(hash.length, 64);
    });

    await t.step("should handle empty string", () => {
      const hash = SRC20UtilityService.calculateTickHash("");

      assertEquals(typeof hash, "string");
      assertEquals(hash.length, 64);
    });

    await t.step("should produce different hashes for different inputs", () => {
      const hash1 = SRC20UtilityService.calculateTickHash("TEST1");
      const hash2 = SRC20UtilityService.calculateTickHash("TEST2");

      assertEquals(hash1.length, 64);
      assertEquals(hash2.length, 64);
      assertEquals(hash1 !== hash2, true);
    });

    await t.step("should produce valid hex string", () => {
      const hash = SRC20UtilityService.calculateTickHash("TEST");
      const hexRegex = /^[0-9a-f]{64}$/;

      assertEquals(hexRegex.test(hash), true);
    });
  },
});

Deno.test({
  name: "SRC20UtilityService - checkDeployedTick",
  fn: async (t) => {
    setupTestEnvironment();

    try {
      await t.step("should return deployed: true when tick exists", async () => {
        // Mock fetchSrc20MintProgress to return mint info
        SRC20QueryService.fetchSrc20MintProgress = async (_tick: string) => {
          return {
            tick: "TEST",
            max: "1000000",
            lim: "1000",
            current_supply: "500000",
            progress: 50,
            minted_out: false,
          };
        };

        const result = await SRC20UtilityService.checkDeployedTick("TEST");
        assertEquals(result.deployed, true);
      });

      await t.step("should return deployed: false when tick doesn't exist", async () => {
        // Mock fetchSrc20MintProgress to return null
        SRC20QueryService.fetchSrc20MintProgress = async (_tick: string) => {
          return null;
        };

        const result = await SRC20UtilityService.checkDeployedTick("NONEXISTENT");
        assertEquals(result.deployed, false);
      });

      await t.step("should return deployed: false when fetchSrc20MintProgress returns undefined", async () => {
        // Mock fetchSrc20MintProgress to return undefined
        SRC20QueryService.fetchSrc20MintProgress = async (_tick: string) => {
          return undefined as any;
        };

        const result = await SRC20UtilityService.checkDeployedTick("UNDEFINED");
        assertEquals(result.deployed, false);
      });
    } finally {
      cleanupTestEnvironment();
    }
  },
});

Deno.test({
  name: "SRC20UtilityService - checkMintedOut",
  fn: async (t) => {
    setupTestEnvironment();

    try {
      await t.step("should return mint info when token exists", async () => {
        const mockMintInfo = {
          tick: "TEST",
          max: "1000000",
          lim: "1000",
          current_supply: "500000",
          progress: 50,
          minted_out: false,
        };

        SRC20QueryService.checkMintedOut = async (_tick: string, _amount: string) => {
          return mockMintInfo;
        };

        const result = await SRC20UtilityService.checkMintedOut("TEST", "100");
        assertEquals(result, mockMintInfo);
      });

      await t.step("should throw error when token not found", async () => {
        SRC20QueryService.checkMintedOut = async (_tick: string, _amount: string) => {
          return null;
        };

        await assertRejects(
          async () => {
            await SRC20UtilityService.checkMintedOut("NONEXISTENT", "100");
          },
          Error,
          "Error: Token not found"
        );
      });

      await t.step("should throw error when checkMintedOut returns undefined", async () => {
        SRC20QueryService.checkMintedOut = async (_tick: string, _amount: string) => {
          return undefined as any;
        };

        await assertRejects(
          async () => {
            await SRC20UtilityService.checkMintedOut("UNDEFINED", "100");
          },
          Error,
          "Error: Token not found"
        );
      });
    } finally {
      cleanupTestEnvironment();
    }
  },
});

Deno.test({
  name: "SRC20UtilityService - checkEnoughBalance",
  fn: async (t) => {
    setupTestEnvironment();

    try {
      await t.step("should return true when balance is sufficient", async () => {
        SRC20QueryService.fetchSrc20Balance = async (_params: any) => {
          return { amt: "1000" };
        };

        const result = await SRC20UtilityService.checkEnoughBalance(
          "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          "TEST",
          "500"
        );
        assertEquals(result, true);
      });

      await t.step("should return false when balance is insufficient", async () => {
        SRC20QueryService.fetchSrc20Balance = async (_params: any) => {
          return { amt: "100" };
        };

        const result = await SRC20UtilityService.checkEnoughBalance(
          "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          "TEST",
          "500"
        );
        assertEquals(result, false);
      });

      await t.step("should return false when no balance data", async () => {
        SRC20QueryService.fetchSrc20Balance = async (_params: any) => {
          return null;
        };

        const result = await SRC20UtilityService.checkEnoughBalance(
          "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          "TEST",
          "500"
        );
        assertEquals(result, false);
      });

      await t.step("should return false when balance data has no amt field", async () => {
        SRC20QueryService.fetchSrc20Balance = async (_params: any) => {
          return { tick: "TEST" }; // Missing amt field
        };

        const result = await SRC20UtilityService.checkEnoughBalance(
          "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          "TEST",
          "500"
        );
        assertEquals(result, false);
      });

      await t.step("should handle decimal amounts correctly", async () => {
        SRC20QueryService.fetchSrc20Balance = async (_params: any) => {
          return { amt: "1000.5" };
        };

        const result = await SRC20UtilityService.checkEnoughBalance(
          "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          "TEST",
          "1000.25"
        );
        assertEquals(result, true);
      });

      await t.step("should return false when fetchSrc20Balance throws error", async () => {
        SRC20QueryService.fetchSrc20Balance = async (_params: any) => {
          throw new Error("Database error");
        };

        const result = await SRC20UtilityService.checkEnoughBalance(
          "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          "TEST",
          "500"
        );
        assertEquals(result, false);
      });
    } finally {
      cleanupTestEnvironment();
    }
  },
});

Deno.test({
  name: "SRC20UtilityService - validateOperation basic validation",
  fn: async (t) => {
    setupTestEnvironment();

    try {
      await t.step("should require sourceAddress", async () => {
        const result = await SRC20UtilityService.validateOperation("deploy", {
          tick: "TEST",
          max: "1000000",
          lim: "1000",
          dec: 18,
          isEstimate: true,
        } as any);

        assertEquals(result?.status, 400);
        assertStringIncludes(await result?.text() || "", "Source address is required");
      });

      await t.step("should require tick", async () => {
        const result = await SRC20UtilityService.validateOperation("deploy", {
          sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          max: "1000000",
          lim: "1000",
          dec: 18,
          isEstimate: true,
        } as any);

        assertEquals(result?.status, 400);
        assertStringIncludes(await result?.text() || "", "Tick is required");
      });

      await t.step("should reject invalid operation", async () => {
        const result = await SRC20UtilityService.validateOperation("invalid" as any, {
          sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          tick: "TEST",
          isEstimate: true,
        } as any);

        assertEquals(result?.status, 400);
        assertStringIncludes(await result?.text() || "", "Invalid operation");
      });
    } finally {
      cleanupTestEnvironment();
    }
  },
});

Deno.test({
  name: "SRC20UtilityService - validateDeploy edge cases",
  fn: async (t) => {
    setupTestEnvironment();

    try {
      await t.step("should handle BigInt parsing errors", async () => {
        const result = await SRC20UtilityService.validateOperation("deploy", {
          sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          tick: "TEST",
          max: "invalid_number",
          lim: "1000",
          dec: 18,
          isEstimate: true,
        });

        assertEquals(result?.status, 400);
        assertStringIncludes(await result?.text() || "", "Invalid numeric values");
      });

      await t.step("should validate max > 0", async () => {
        const result = await SRC20UtilityService.validateOperation("deploy", {
          sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          tick: "TEST",
          max: "0",
          lim: "1000",
          dec: 18,
          isEstimate: true,
        });

        assertEquals(result?.status, 400);
        assertStringIncludes(await result?.text() || "", "Max supply must be greater than 0");
      });

      await t.step("should validate lim > 0", async () => {
        const result = await SRC20UtilityService.validateOperation("deploy", {
          sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          tick: "TEST",
          max: "1000000",
          lim: "0",
          dec: 18,
          isEstimate: true,
        });

        assertEquals(result?.status, 400);
        assertStringIncludes(await result?.text() || "", "Limit per mint must be greater than 0");
      });

      await t.step("should validate lim <= max", async () => {
        const result = await SRC20UtilityService.validateOperation("deploy", {
          sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          tick: "TEST",
          max: "1000",
          lim: "2000",
          dec: 18,
          isEstimate: true,
        });

        assertEquals(result?.status, 400);
        assertStringIncludes(await result?.text() || "", "Limit per mint cannot exceed max supply");
      });

      await t.step("should validate decimals range", async () => {
        const result = await SRC20UtilityService.validateOperation("deploy", {
          sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          tick: "TEST",
          max: "1000000",
          lim: "1000",
          dec: 19, // > 18
          isEstimate: true,
        });

        assertEquals(result?.status, 400);
        assertStringIncludes(await result?.text() || "", "Decimals must be between 0 and 18");
      });

      await t.step("should validate negative decimals", async () => {
        const result = await SRC20UtilityService.validateOperation("deploy", {
          sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          tick: "TEST",
          max: "1000000",
          lim: "1000",
          dec: -1,
          isEstimate: true,
        });

        assertEquals(result?.status, 400);
        assertStringIncludes(await result?.text() || "", "Decimals must be between 0 and 18");
      });

      await t.step("should handle string decimals", async () => {
        const result = await SRC20UtilityService.validateOperation("deploy", {
          sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          tick: "TEST",
          max: "1000000",
          lim: "1000",
          dec: "8", // String instead of number
          isEstimate: true,
        });

        assertEquals(result, null); // Should be valid
      });

      await t.step("should check deployed status when not estimating", async () => {
        // Mock checkDeployedTick to return deployed: true
        SRC20QueryService.fetchSrc20MintProgress = async (_tick: string) => {
          return { tick: "TEST", max: "1000000", lim: "1000", current_supply: "0", progress: 0, minted_out: false };
        };

        const result = await SRC20UtilityService.validateOperation("deploy", {
          sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          tick: "TEST",
          max: "1000000",
          lim: "1000",
          dec: 18,
          isEstimate: false, // Not estimating
        });

        assertEquals(result?.status, 400);
        assertStringIncludes(await result?.text() || "", "already deployed");
      });
    } finally {
      cleanupTestEnvironment();
    }
  },
});

Deno.test({
  name: "SRC20UtilityService - validateMint",
  fn: async (t) => {
    setupTestEnvironment();

    try {
      await t.step("should require amount", async () => {
        const result = await SRC20UtilityService.validateOperation("mint", {
          sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          tick: "TEST",
          isEstimate: true,
        });

        assertEquals(result?.status, 400);
        assertStringIncludes(await result?.text() || "", "Amount is required for mint");
      });

      await t.step("should check minted out status when not estimating", async () => {
        // Mock checkMintedOut to return minted_out: true
        SRC20QueryService.checkMintedOut = async (_tick: string, _amount: string) => {
          return { tick: "TEST", max: "1000000", lim: "1000", current_supply: "1000000", progress: 100, minted_out: true };
        };

        const result = await SRC20UtilityService.validateOperation("mint", {
          sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          tick: "TEST",
          amt: "100",
          isEstimate: false, // Not estimating
        });

        assertEquals(result?.status, 400);
        assertStringIncludes(await result?.text() || "", "already minted out");
      });

      await t.step("should pass validation when estimating", async () => {
        const result = await SRC20UtilityService.validateOperation("mint", {
          sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          tick: "TEST",
          amt: "100",
          isEstimate: true, // Estimating
        });

        assertEquals(result, null); // Should be valid
      });
    } finally {
      cleanupTestEnvironment();
    }
  },
});

Deno.test({
  name: "SRC20UtilityService - validateTransfer",
  fn: async (t) => {
    setupTestEnvironment();

    try {
      await t.step("should require valid recipient address", async () => {
        const result = await SRC20UtilityService.validateOperation("transfer", {
          sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          tick: "TEST",
          amt: "100",
          toAddress: "invalid_address",
          isEstimate: true,
        });

        assertEquals(result?.status, 400);
        assertStringIncludes(await result?.text() || "", "Invalid or missing recipient address");
      });

      await t.step("should require amount", async () => {
        const result = await SRC20UtilityService.validateOperation("transfer", {
          sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          tick: "TEST",
          toAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          isEstimate: true,
        });

        assertEquals(result?.status, 400);
        assertStringIncludes(await result?.text() || "", "Amount is required for transfer");
      });

      await t.step("should check balance when not estimating", async () => {
        // Mock checkEnoughBalance to return false
        SRC20QueryService.fetchSrc20Balance = async (_params: any) => {
          return { amt: "50" }; // Less than required 100
        };

        const result = await SRC20UtilityService.validateOperation("transfer", {
          sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          tick: "TEST",
          amt: "100",
          toAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          isEstimate: false, // Not estimating
        });

        assertEquals(result?.status, 400);
        assertStringIncludes(await result?.text() || "", "Insufficient balance");
      });

      await t.step("should pass validation when estimating", async () => {
        const result = await SRC20UtilityService.validateOperation("transfer", {
          sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          tick: "TEST",
          amt: "100",
          toAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          isEstimate: true, // Estimating
        });

        assertEquals(result, null); // Should be valid
      });
    } finally {
      cleanupTestEnvironment();
    }
  },
});

Deno.test({
  name: "SRC20UtilityService - validateSRC20Deployment edge cases",
  fn: async (t) => {
    await t.step("should handle missing required fields", async () => {
      const result = await SRC20UtilityService.validateSRC20Deployment({} as any);

      assertEquals(result.isValid, false);
      assertEquals(result.errors.length > 0, true);
      assertEquals(result.errors.some(e => e.includes("tick")), true);
      assertEquals(result.errors.some(e => e.includes("max")), true);
      assertEquals(result.errors.some(e => e.includes("lim")), true);
    });

    await t.step("should handle non-string types", async () => {
      const result = await SRC20UtilityService.validateSRC20Deployment({
        tick: 123, // Not a string
        max: 1000000, // Not a string
        lim: 1000, // Not a string
        dec: "invalid", // Not a number
      } as any);

      assertEquals(result.isValid, false);
      assertEquals(result.errors.some(e => e.includes("tick") && e.includes("string")), true);
      assertEquals(result.errors.some(e => e.includes("max") && e.includes("string")), true);
      assertEquals(result.errors.some(e => e.includes("lim") && e.includes("string")), true);
    });

    await t.step("should validate image protocol references", async () => {
      const result = await SRC20UtilityService.validateSRC20Deployment({
        tick: "TEST",
        max: "1000000",
        lim: "1000",
        dec: 8,
        img: "invalid:protocol",
        icon: "toolong:thishashiswaytoolongtobevalid",
      });

      assertEquals(result.isValid, false);
      assertEquals(result.errors.some(e => e.includes("img")), true);
      assertEquals(result.errors.some(e => e.includes("icon")), true);
    });

    await t.step("should handle edge case field lengths", async () => {
      const result = await SRC20UtilityService.validateSRC20Deployment({
        tick: "A".repeat(33), // Too long
        max: "1000000",
        lim: "1000",
        dec: 8,
        x: "A".repeat(33), // Too long
        tg: "A".repeat(33), // Too long
        web: "A".repeat(256), // Too long
        email: "A".repeat(256), // Too long
        description: "A".repeat(256), // Too long
      });

      assertEquals(result.isValid, false);
      assertEquals(result.errors.length >= 6, true); // Should have multiple errors
    });

    await t.step("should validate all supported image protocols", async () => {
      const protocols = ["ar", "ipfs", "fc", "ord"];

      for (const protocol of protocols) {
        const result = await SRC20UtilityService.validateSRC20Deployment({
          tick: "TEST",
          max: "1000000",
          lim: "1000",
          dec: 8,
          img: `${protocol}:validhash123`,
          icon: `${protocol}:validicon456`,
        });

        assertEquals(result.isValid, true, `Protocol ${protocol} should be valid`);
        assertEquals(result.errors.length, 0);
      }
    });
  },
});
