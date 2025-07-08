/**
 * Unit tests for SRC-20 metadata fields support
 * Tests validation, processing, and API integration for all metadata fields
 */

import { assertEquals } from "@std/assert";
import { SRC20Service } from "../../server/services/src20/index.ts";
import { SRC20UtilityService } from "$server/services/src20/utilityService.ts";
import { MockDatabaseManager } from "../mocks/mockDatabaseManager.ts";
import { DatabaseManager } from "$server/database/databaseManager.ts";

// Store original database manager for cleanup
let originalDbManager: DatabaseManager;

// Setup mock database for testing
function setupTestEnvironment() {
  // Store the original database manager
  originalDbManager = (globalThis as any).dbManager;

  // Create and set mock database manager
  const mockDb = new MockDatabaseManager();
  (globalThis as any).dbManager = mockDb;

  // Set up mock responses for deploy check queries
  mockDb.setMockResponse(
    "SELECT * FROM src20_token_stats WHERE tick = ?",
    ["TEST"],
    { rows: [] }, // Empty rows = token not deployed
  );

  return mockDb;
}

// Cleanup test environment
function cleanupTestEnvironment() {
  if (originalDbManager) {
    (globalThis as any).dbManager = originalDbManager;
  }
}

Deno.test({
  name: "SRC20 Metadata Fields - Validation Tests",
  fn: async (t) => {
    setupTestEnvironment();

    try {
      await t.step(
        "should validate x field with correct constraints",
        async () => {
          const validationResult = await SRC20Service.UtilityService
            .validateOperation(
              "deploy",
              {
                op: "deploy",
                sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                toAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                changeAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                feeRate: 10,
                tick: "TEST",
                max: "1000000",
                lim: "1000",
                dec: 18,
                x: "bitcoin_stamps", // Valid x field (32 chars max, alphanumeric + underscore)
                isEstimate: true,
              },
            );

          assertEquals(
            validationResult,
            null,
            "Valid x field should pass validation",
          );
        },
      );

      await t.step("should reject x field that's too long", async () => {
        const validationResult = await SRC20Service.UtilityService
          .validateOperation(
            "deploy",
            {
              op: "deploy",
              sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
              toAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
              changeAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
              feeRate: 10,
              tick: "TEST",
              max: "1000000",
              lim: "1000",
              dec: 18,
              x: "this_username_is_way_too_long_for_the_database_field", // 53 chars (exceeds 32 limit)
              isEstimate: true,
            },
          );

        assertEquals(
          validationResult?.status,
          400,
          "x field exceeding 32 chars should be rejected",
        );
      });

      await t.step(
        "should validate tg field with correct constraints",
        async () => {
          const validationResult = await SRC20Service.UtilityService
            .validateOperation(
              "deploy",
              {
                op: "deploy",
                sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                toAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                changeAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                feeRate: 10,
                tick: "TEST",
                max: "1000000",
                lim: "1000",
                dec: 18,
                tg: "bitcoin_stamps_official", // Valid tg field (32 chars max)
                isEstimate: true,
              },
            );

          assertEquals(
            validationResult,
            null,
            "Valid tg field should pass validation",
          );
        },
      );

      await t.step("should reject tg field that's too long", async () => {
        const validationResult = await SRC20Service.UtilityService
          .validateOperation(
            "deploy",
            {
              op: "deploy",
              sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
              toAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
              changeAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
              feeRate: 10,
              tick: "TEST",
              max: "1000000",
              lim: "1000",
              dec: 18,
              tg: "this_telegram_handle_is_way_too_long_for_database", // 47 chars (exceeds 32 limit)
              isEstimate: true,
            },
          );

        assertEquals(
          validationResult?.status,
          400,
          "tg field exceeding 32 chars should be rejected",
        );
      });

      await t.step(
        "should validate description field with correct constraints",
        async () => {
          const longDescription = "A".repeat(255); // Exactly 255 chars
          const validationResult = await SRC20Service.UtilityService
            .validateOperation(
              "deploy",
              {
                op: "deploy",
                sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                toAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                changeAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                feeRate: 10,
                tick: "TEST",
                max: "1000000",
                lim: "1000",
                dec: 18,
                description: longDescription,
                isEstimate: true,
              },
            );

          assertEquals(
            validationResult,
            null,
            "Valid description field (255 chars) should pass validation",
          );
        },
      );

      await t.step(
        "should reject description field that's too long",
        async () => {
          const tooLongDescription = "A".repeat(256); // 256 chars (exceeds 255 limit)
          const validationResult = await SRC20Service.UtilityService
            .validateOperation(
              "deploy",
              {
                op: "deploy",
                sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                toAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                changeAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                feeRate: 10,
                tick: "TEST",
                max: "1000000",
                lim: "1000",
                dec: 18,
                description: tooLongDescription,
                isEstimate: true,
              },
            );

          assertEquals(
            validationResult?.status,
            400,
            "description field exceeding 255 chars should be rejected",
          );
        },
      );

      await t.step(
        "should validate web field with correct constraints",
        async () => {
          const validationResult = await SRC20Service.UtilityService
            .validateOperation(
              "deploy",
              {
                op: "deploy",
                sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                toAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                changeAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                feeRate: 10,
                tick: "TEST",
                max: "1000000",
                lim: "1000",
                dec: 18,
                web: "https://bitcoinstamps.io",
                isEstimate: true,
              },
            );

          assertEquals(
            validationResult,
            null,
            "Valid web field should pass validation",
          );
        },
      );

      await t.step(
        "should validate email field with correct constraints",
        async () => {
          const validationResult = await SRC20Service.UtilityService
            .validateOperation(
              "deploy",
              {
                op: "deploy",
                sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                toAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                changeAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                feeRate: 10,
                tick: "TEST",
                max: "1000000",
                lim: "1000",
                dec: 18,
                email: "contact@bitcoinstamps.io",
                isEstimate: true,
              },
            );

          assertEquals(
            validationResult,
            null,
            "Valid email field should pass validation",
          );
        },
      );

      await t.step(
        "should handle desc field as fallback for description",
        async () => {
          const validationResult = await SRC20Service.UtilityService
            .validateOperation(
              "deploy",
              {
                op: "deploy",
                sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                toAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                changeAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                feeRate: 10,
                tick: "TEST",
                max: "1000000",
                lim: "1000",
                dec: 18,
                desc: "Token description via desc field", // Using desc instead of description
                isEstimate: true,
              },
            );

          assertEquals(
            validationResult,
            null,
            "desc field should be accepted as alternative to description",
          );
        },
      );

      await t.step(
        "should respect database field length constraints",
        async () => {
          // Test all fields with their exact database limits
          const testCases = [
            {
              field: "x",
              maxLength: 32,
              validValue: "a".repeat(32),
              invalidValue: "a".repeat(33),
            },
            {
              field: "tg",
              maxLength: 32,
              validValue: "a".repeat(32),
              invalidValue: "a".repeat(33),
            },
            {
              field: "description",
              maxLength: 255,
              validValue: "a".repeat(255),
              invalidValue: "a".repeat(256),
            },
            {
              field: "web",
              maxLength: 255,
              validValue: "https://example.com" + "a".repeat(236), // 255 chars total
              invalidValue: "https://example.com" + "a".repeat(237), // 256 chars total
            },
            {
              field: "email",
              maxLength: 255,
              validValue: "a".repeat(245) + "@email.com", // 255 chars total
              invalidValue: "a".repeat(246) + "@email.com", // 256 chars total
            },
          ];

          for (const testCase of testCases) {
            // Test valid case
            const validData = {
              op: "deploy" as const,
              sourceAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
              toAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
              changeAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
              feeRate: 10,
              tick: "TEST",
              max: "1000000",
              lim: "1000",
              dec: 18,
              isEstimate: true, // Always use estimation to avoid database calls
              [testCase.field]: testCase.validValue,
            };

            const validResult = await SRC20Service.UtilityService
              .validateOperation("deploy", validData);

            assertEquals(
              validResult,
              null,
              `${testCase.field} field with ${testCase.maxLength} chars should be valid`,
            );

            // Test invalid case - use validation-only method to avoid database calls
            const invalidData = {
              ...validData,
              [testCase.field]: testCase.invalidValue,
            };

            const invalidResult = await SRC20Service.UtilityService
              .validateOperation("deploy", invalidData);

            assertEquals(
              invalidResult?.status,
              400,
              `${testCase.field} field exceeding ${testCase.maxLength} chars should be rejected`,
            );
          }
        },
      );
    } finally {
      cleanupTestEnvironment();
    }
  },
});

Deno.test("SRC20 Metadata Validation - Valid metadata with all fields", async () => {
  const validMetadata = {
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
    desc: "Test token description",
    description: "Alternative description",
    x: "test_twitter",
    tg: "test_telegram",
    web: "https://example.com",
    email: "test@example.com",
    img: "ar:BNttzDav3jHVnNiV7nYbQv-GY0HQ",
    icon: "ipfs:QmXoypizjW3WknFiJnKLwHCNqzg",
  };

  const result = await SRC20UtilityService.validateSRC20Deployment(
    validMetadata,
  );
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("SRC20 Metadata Validation - Description fallback logic", async () => {
  // Test with only desc field
  const metadataWithDesc = {
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
    desc: "Description from desc field",
  };

  const resultDesc = await SRC20UtilityService.validateSRC20Deployment(
    metadataWithDesc,
  );
  assertEquals(resultDesc.isValid, true);

  // Test with only description field
  const metadataWithDescription = {
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
    description: "Description from description field",
  };

  const resultDescription = await SRC20UtilityService.validateSRC20Deployment(
    metadataWithDescription,
  );
  assertEquals(resultDescription.isValid, true);

  // Test with both fields (description should take precedence)
  const metadataWithBoth = {
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
    desc: "From desc",
    description: "From description",
  };

  const resultBoth = await SRC20UtilityService.validateSRC20Deployment(
    metadataWithBoth,
  );
  assertEquals(resultBoth.isValid, true);
});

Deno.test("SRC20 Metadata Validation - Invalid x field", async () => {
  const invalidXMetadata = {
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
    x: "invalid@twitter", // Contains invalid character
  };

  const result = await SRC20UtilityService.validateSRC20Deployment(
    invalidXMetadata,
  );
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some((e: string) => e.includes("x")), true);
});

Deno.test("SRC20 Metadata Validation - Invalid tg field", async () => {
  const invalidTgMetadata = {
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
    tg: "a".repeat(33), // Too long
  };

  const result = await SRC20UtilityService.validateSRC20Deployment(
    invalidTgMetadata,
  );
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some((e: string) => e.includes("tg")), true);
});

Deno.test("SRC20 Metadata Validation - Invalid web field", async () => {
  const invalidWebMetadata = {
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
    web: "not-a-valid-url",
  };

  const result = await SRC20UtilityService.validateSRC20Deployment(
    invalidWebMetadata,
  );
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some((e: string) => e.includes("web")), true);
});

Deno.test("SRC20 Metadata Validation - Invalid email field", async () => {
  const invalidEmailMetadata = {
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
    email: "not-an-email",
  };

  const result = await SRC20UtilityService.validateSRC20Deployment(
    invalidEmailMetadata,
  );
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some((e: string) => e.includes("email")), true);
});

Deno.test("SRC20 Metadata Validation - Invalid description length", async () => {
  const invalidDescMetadata = {
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
    description: "a".repeat(256), // Too long
  };

  const result = await SRC20UtilityService.validateSRC20Deployment(
    invalidDescMetadata,
  );
  assertEquals(result.isValid, false);
  assertEquals(
    result.errors.some((e: string) => e.includes("description")),
    true,
  );
});

Deno.test("SRC20 Metadata Validation - Valid img field", async () => {
  const validImgMetadata = {
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
    img: "ar:BNttzDav3jHVnNiV7nYbQv-GY0HQ",
  };

  const result = await SRC20UtilityService.validateSRC20Deployment(
    validImgMetadata,
  );
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("SRC20 Metadata Validation - Invalid img field", async () => {
  const invalidImgMetadata = {
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
    img: "invalid-protocol:hash",
  };

  const result = await SRC20UtilityService.validateSRC20Deployment(
    invalidImgMetadata,
  );
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some((e: string) => e.includes("img")), true);
});

Deno.test("SRC20 Metadata Validation - Valid icon field", async () => {
  const validIconMetadata = {
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
    icon: "ipfs:QmXoypizjW3WknFiJnKLwHCNqzg",
  };

  const result = await SRC20UtilityService.validateSRC20Deployment(
    validIconMetadata,
  );
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("SRC20 Metadata Validation - Invalid icon field", async () => {
  const invalidIconMetadata = {
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
    icon: "toolong:thisistoolongtobevalidhash",
  };

  const result = await SRC20UtilityService.validateSRC20Deployment(
    invalidIconMetadata,
  );
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some((e: string) => e.includes("icon")), true);
});

Deno.test("SRC20 Metadata Validation - All image protocol types", async () => {
  const protocols = ["ar", "ipfs", "fc", "ord"];

  for (const protocol of protocols) {
    const metadata = {
      tick: "TEST",
      max: "1000000",
      lim: "1000",
      dec: 8,
      img: `${protocol}:validhash123`,
      icon: `${protocol}:validicon456`,
    };

    const result = await SRC20UtilityService.validateSRC20Deployment(metadata);
    assertEquals(result.isValid, true, `Should validate ${protocol} protocol`);
    assertEquals(result.errors.length, 0);
  }
});

Deno.test("SRC20 Metadata Validation - Mixed valid and invalid fields", async () => {
  const mixedMetadata = {
    tick: "TEST",
    max: "1000000",
    lim: "1000",
    dec: 8,
    x: "valid_twitter", // Valid
    tg: "invalid@telegram", // Invalid character
    web: "https://example.com", // Valid
    email: "not-an-email", // Invalid format
    img: "ar:BNttzDav3jHVnNiV7nYbQv-GY0HQ", // Valid
    icon: "unknown:hash", // Invalid protocol
  };

  const result = await SRC20UtilityService.validateSRC20Deployment(
    mixedMetadata,
  );

  assertEquals(result.isValid, false);

  // Should have errors for tg, email, and icon
  assertEquals(result.errors.some((e: string) => e.includes("tg")), true);
  assertEquals(result.errors.some((e: string) => e.includes("email")), true);
  assertEquals(result.errors.some((e: string) => e.includes("icon")), true);

  // Should NOT have errors for x, web, and img (be more specific with field names)
  const xFieldErrors = result.errors.filter((e: string) => e.startsWith("x "));
  const webFieldErrors = result.errors.filter((e: string) =>
    e.startsWith("web ")
  );
  const imgFieldErrors = result.errors.filter((e: string) =>
    e.startsWith("img ")
  );

  assertEquals(
    xFieldErrors.length,
    0,
    "Should have no errors for valid x field",
  );
  assertEquals(
    webFieldErrors.length,
    0,
    "Should have no errors for valid web field",
  );
  assertEquals(
    imgFieldErrors.length,
    0,
    "Should have no errors for valid img field",
  );
});
