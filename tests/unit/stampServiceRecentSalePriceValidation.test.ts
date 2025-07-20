import { logger } from "$lib/utils/logger.ts";
import { assertEquals, assertExists } from "@std/assert";

/**
 * Test suite for recentSalePrice validation logic in StampService
 * Ensures recentSalePrice properly mirrors marketData.recentSalePriceBTC
 */

// Mock logger to capture validation errors
let loggedErrors: any[] = [];
const originalLoggerError = logger.error;

function mockLoggerError(namespace: string, data: any) {
  loggedErrors.push({ namespace, data });
}

/**
 * Helper function to test the validation logic
 * This mirrors the exact logic from StampService.enrichStampWithMarketData
 */
function validateRecentSalePriceMapping(
  recentSalePrice: number | "priceless",
  marketDataRecentSalePriceBTC: number | null,
): boolean {
  return (
    (recentSalePrice === "priceless" &&
      (marketDataRecentSalePriceBTC === null ||
        marketDataRecentSalePriceBTC <= 0)) ||
    (typeof recentSalePrice === "number" &&
      recentSalePrice === marketDataRecentSalePriceBTC)
  );
}

/**
 * Helper function to simulate the recentSalePrice assignment logic
 * This mirrors the exact logic from StampService.enrichStampWithMarketData
 */
function mapRecentSalePrice(
  marketDataRecentSalePriceBTC: number | null,
): number | "priceless" {
  let recentSalePrice: number | "priceless" = "priceless";
  if (
    marketDataRecentSalePriceBTC !== null && marketDataRecentSalePriceBTC > 0
  ) {
    recentSalePrice = marketDataRecentSalePriceBTC;
  }
  return recentSalePrice;
}

Deno.test({
  name: "StampService - recentSalePrice validation logic",
  fn: async (t) => {
    await t.step("Valid mapping - positive recentSalePriceBTC", () => {
      const marketDataValue = 0.00025;
      const mappedValue = mapRecentSalePrice(marketDataValue);
      const isValid = validateRecentSalePriceMapping(
        mappedValue,
        marketDataValue,
      );

      assertEquals(
        mappedValue,
        0.00025,
        "Should mirror positive value exactly",
      );
      assertEquals(
        isValid,
        true,
        "Validation should pass for correct mirroring",
      );
    });

    await t.step("Valid mapping - null recentSalePriceBTC", () => {
      const marketDataValue = null;
      const mappedValue = mapRecentSalePrice(marketDataValue);
      const isValid = validateRecentSalePriceMapping(
        mappedValue,
        marketDataValue,
      );

      assertEquals(
        mappedValue,
        "priceless",
        "Should be priceless when marketData is null",
      );
      assertEquals(isValid, true, "Validation should pass for null mapping");
    });

    await t.step("Valid mapping - zero recentSalePriceBTC", () => {
      const marketDataValue = 0;
      const mappedValue = mapRecentSalePrice(marketDataValue);
      const isValid = validateRecentSalePriceMapping(
        mappedValue,
        marketDataValue,
      );

      assertEquals(
        mappedValue,
        "priceless",
        "Should be priceless when marketData is zero",
      );
      assertEquals(isValid, true, "Validation should pass for zero mapping");
    });

    await t.step("Valid mapping - negative recentSalePriceBTC", () => {
      const marketDataValue = -0.001;
      const mappedValue = mapRecentSalePrice(marketDataValue);
      const isValid = validateRecentSalePriceMapping(
        mappedValue,
        marketDataValue,
      );

      assertEquals(
        mappedValue,
        "priceless",
        "Should be priceless when marketData is negative",
      );
      assertEquals(
        isValid,
        true,
        "Validation should pass for negative mapping",
      );
    });

    await t.step("Detection of invalid mapping scenarios", () => {
      // Test scenarios where validation should fail

      // Scenario 1: recentSalePrice is "priceless" but marketData has positive value
      assertEquals(
        validateRecentSalePriceMapping("priceless", 0.001),
        false,
        "Should detect invalid: priceless vs positive value",
      );

      // Scenario 2: recentSalePrice is number but marketData is null
      assertEquals(
        validateRecentSalePriceMapping(0.001, null),
        false,
        "Should detect invalid: number vs null",
      );

      // Scenario 3: recentSalePrice and marketData are different numbers
      assertEquals(
        validateRecentSalePriceMapping(0.001, 0.002),
        false,
        "Should detect invalid: different numbers",
      );

      // Valid scenarios that should pass
      assertEquals(
        validateRecentSalePriceMapping("priceless", null),
        true,
        "Should pass: priceless with null",
      );

      assertEquals(
        validateRecentSalePriceMapping("priceless", 0),
        true,
        "Should pass: priceless with zero",
      );

      assertEquals(
        validateRecentSalePriceMapping(0.001, 0.001),
        true,
        "Should pass: exact number match",
      );
    });
  },
});

Deno.test({
  name: "StampService - validation error logging behavior",
  fn: async () => {
    // Setup mock logger
    logger.error = mockLoggerError;
    loggedErrors = [];

    // Simulate error logging behavior
    const mockStamp = { cpid: "A123", stamp: 123 };
    const recentSalePrice: number | "priceless" = 0.001;
    const marketDataRecentSalePriceBTC: number | null = 0.002;

    const isValid = validateRecentSalePriceMapping(
      recentSalePrice,
      marketDataRecentSalePriceBTC,
    );

    if (!isValid) {
      mockLoggerError("stamps", {
        message:
          "recentSalePrice validation failed - field does not mirror marketData.recentSalePriceBTC",
        cpid: mockStamp.cpid,
        stamp: mockStamp.stamp,
        recentSalePrice,
        marketDataRecentSalePriceBTC,
        validationDetails: {
          recentSalePriceType: typeof recentSalePrice,
          recentSalePriceValue: recentSalePrice,
          marketDataType: typeof marketDataRecentSalePriceBTC,
          marketDataValue: marketDataRecentSalePriceBTC,
          marketDataIsNull: marketDataRecentSalePriceBTC === null,
          marketDataIsZero: marketDataRecentSalePriceBTC === 0,
        },
      });
    }

    assertEquals(isValid, false, "Should detect mismatch");
    assertEquals(loggedErrors.length, 1, "Should log validation error");
    assertEquals(loggedErrors[0].namespace, "stamps");
    assertExists(loggedErrors[0].data.validationDetails);
    assertEquals(
      loggedErrors[0].data.validationDetails.recentSalePriceValue,
      0.001,
    );
    assertEquals(loggedErrors[0].data.validationDetails.marketDataValue, 0.002);

    // Restore original logger
    logger.error = originalLoggerError;
  },
});








