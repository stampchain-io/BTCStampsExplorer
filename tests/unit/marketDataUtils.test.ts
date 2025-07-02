import { assertEquals } from "@std/assert";
import {
  assessDataQuality,
  calculateUSDValue,
  formatBTCAmount,
  getCacheStatus,
  normalizeConfidenceScore,
  normalizeDistributionScore,
  parseBTCDecimal,
  parseExchangeSources,
  parseVolumeSources,
} from "$lib/utils/marketData.ts";

// Mock console methods to suppress output during tests
const originalConsole = {
  error: console.error,
  warn: console.warn,
};

function suppressConsole() {
  console.error = () => {};
  console.warn = () => {};
}

function restoreConsole() {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
}

Deno.test("parseBTCDecimal - handles various inputs correctly", () => {
  // Valid decimal strings
  assertEquals(parseBTCDecimal("0.12345678"), 0.12345678);
  assertEquals(parseBTCDecimal("1.0"), 1.0);
  assertEquals(parseBTCDecimal("0.00000001"), 0.00000001); // 1 satoshi
  assertEquals(parseBTCDecimal("21000000"), 21000000); // Max BTC supply

  // Edge cases
  assertEquals(parseBTCDecimal("0"), 0);
  assertEquals(parseBTCDecimal("-0.5"), -0.5); // Negative values
  assertEquals(parseBTCDecimal("1e-8"), 1e-8); // Scientific notation

  // Null/undefined cases
  assertEquals(parseBTCDecimal(null), null);
  assertEquals(parseBTCDecimal(undefined), null);
  assertEquals(parseBTCDecimal(""), null);

  // Invalid inputs
  suppressConsole();
  assertEquals(parseBTCDecimal("not a number"), null);
  assertEquals(parseBTCDecimal("12.34.56"), 12.34); // parseFloat parses until invalid char
  assertEquals(parseBTCDecimal("abc123"), null);
  restoreConsole();
});

Deno.test("parseVolumeSources - parses JSON volume data correctly", () => {
  // Valid JSON object
  const validJson =
    '{"counterparty": 0.5, "exchange_a": 1.2, "exchange_b": 0.3}';
  const result = parseVolumeSources(validJson);
  assertEquals(result, {
    counterparty: 0.5,
    exchange_a: 1.2,
    exchange_b: 0.3,
  });

  // Empty object
  assertEquals(parseVolumeSources("{}"), {});

  // Null/undefined/empty
  assertEquals(parseVolumeSources(null), {});
  assertEquals(parseVolumeSources(undefined), {});
  assertEquals(parseVolumeSources(""), {});

  // Invalid JSON
  suppressConsole();
  assertEquals(parseVolumeSources("not json"), {});
  assertEquals(parseVolumeSources("{invalid}"), {});
  restoreConsole();

  // Non-object JSON (array, string, number)
  suppressConsole();
  assertEquals(parseVolumeSources("[]"), {});
  assertEquals(parseVolumeSources('"string"'), {});
  assertEquals(parseVolumeSources("123"), {});
  assertEquals(parseVolumeSources("null"), {});
  restoreConsole();

  // Mixed valid/invalid values
  suppressConsole();
  const mixedJson = '{"valid": 1.5, "invalid": "not a number", "null": null}';
  const mixedResult = parseVolumeSources(mixedJson);
  assertEquals(mixedResult, { valid: 1.5 });
  restoreConsole();
});

Deno.test("parseExchangeSources - parses JSON array correctly", () => {
  // Valid array
  const validJson = '["openstamp", "kucoin", "stampscan"]';
  const result = parseExchangeSources(validJson);
  assertEquals(result, ["openstamp", "kucoin", "stampscan"]);

  // Empty array
  assertEquals(parseExchangeSources("[]"), []);

  // Null/undefined/empty
  assertEquals(parseExchangeSources(null), []);
  assertEquals(parseExchangeSources(undefined), []);
  assertEquals(parseExchangeSources(""), []);

  // Invalid JSON
  suppressConsole();
  assertEquals(parseExchangeSources("not json"), []);
  assertEquals(parseExchangeSources("[invalid]"), []);
  restoreConsole();

  // Non-array JSON
  suppressConsole();
  assertEquals(parseExchangeSources("{}"), []);
  assertEquals(parseExchangeSources('"string"'), []);
  assertEquals(parseExchangeSources("123"), []);
  restoreConsole();

  // Mixed types in array (only strings should be kept)
  const mixedJson = '["valid", 123, null, true, "another string"]';
  const mixedResult = parseExchangeSources(mixedJson);
  assertEquals(mixedResult, ["valid", "another string"]);
});

Deno.test("getCacheStatus - returns correct status based on age", () => {
  // Fresh (0-30 minutes)
  assertEquals(getCacheStatus(0), "fresh");
  assertEquals(getCacheStatus(15), "fresh");
  assertEquals(getCacheStatus(30), "fresh");

  // Stale (31-60 minutes)
  assertEquals(getCacheStatus(31), "stale");
  assertEquals(getCacheStatus(45), "stale");
  assertEquals(getCacheStatus(60), "stale");

  // Expired (>60 minutes)
  assertEquals(getCacheStatus(61), "expired");
  assertEquals(getCacheStatus(120), "expired");
  assertEquals(getCacheStatus(1440), "expired"); // 24 hours

  // Invalid inputs
  assertEquals(getCacheStatus(null), "expired");
  assertEquals(getCacheStatus(undefined), "expired");
  assertEquals(getCacheStatus(-1), "expired");
  assertEquals(getCacheStatus(-60), "expired");
});

Deno.test("formatBTCAmount - formats BTC values correctly", () => {
  // Standard formatting (8 decimals)
  assertEquals(formatBTCAmount(1.23456789), "1.23456789");
  assertEquals(formatBTCAmount(0.00000001), "0.00000001");
  assertEquals(formatBTCAmount(21000000), "21000000.00000000");

  // Custom decimal places
  assertEquals(formatBTCAmount(1.23456789, 2), "1.23");
  assertEquals(formatBTCAmount(1.23456789, 4), "1.2346");
  assertEquals(formatBTCAmount(0.00000001, 10), "0.0000000100");

  // Null/invalid inputs
  assertEquals(formatBTCAmount(null), null);
  assertEquals(formatBTCAmount(NaN), null);

  // Edge cases
  assertEquals(formatBTCAmount(0), "0.00000000");
  assertEquals(formatBTCAmount(-0.5, 2), "-0.50");
});

Deno.test("calculateUSDValue - calculates USD from BTC correctly", () => {
  const btcPrice = 95000; // $95,000 per BTC

  // Valid calculations
  assertEquals(calculateUSDValue(1, btcPrice), 95000);
  assertEquals(calculateUSDValue(0.1, btcPrice), 9500);
  assertEquals(calculateUSDValue(0.00000001, btcPrice), 0.00095); // 1 satoshi

  // Null BTC amount
  assertEquals(calculateUSDValue(null, btcPrice), null);

  // Invalid BTC price
  assertEquals(calculateUSDValue(1, 0), null);
  assertEquals(calculateUSDValue(1, -100), null);

  // Edge cases
  assertEquals(calculateUSDValue(0, btcPrice), 0);
});

Deno.test("normalizeConfidenceScore - keeps scores in 0-10 range", () => {
  // Valid range
  assertEquals(normalizeConfidenceScore(0), 0);
  assertEquals(normalizeConfidenceScore(5), 5);
  assertEquals(normalizeConfidenceScore(10), 10);
  assertEquals(normalizeConfidenceScore(7.5), 7.5);

  // Out of range
  assertEquals(normalizeConfidenceScore(-5), 0);
  assertEquals(normalizeConfidenceScore(15), 10);
  assertEquals(normalizeConfidenceScore(100), 10);
  assertEquals(normalizeConfidenceScore(-100), 0);
});

Deno.test("normalizeDistributionScore - keeps scores in 0-100 range", () => {
  // Valid range
  assertEquals(normalizeDistributionScore(0), 0);
  assertEquals(normalizeDistributionScore(50), 50);
  assertEquals(normalizeDistributionScore(100), 100);
  assertEquals(normalizeDistributionScore(75.5), 75.5);

  // Out of range
  assertEquals(normalizeDistributionScore(-10), 0);
  assertEquals(normalizeDistributionScore(150), 100);
  assertEquals(normalizeDistributionScore(1000), 100);
  assertEquals(normalizeDistributionScore(-1000), 0);
});

Deno.test("assessDataQuality - evaluates quality based on multiple factors", () => {
  // High quality: fresh cache, high score, multiple sources
  assertEquals(assessDataQuality(8, 15, 3), "high");
  assertEquals(assessDataQuality(7, 30, 2), "high");
  assertEquals(assessDataQuality(10, 0, 5), "high");

  // Medium quality: various combinations
  assertEquals(assessDataQuality(5, 15, 1), "medium"); // Good cache, medium score, single source
  assertEquals(assessDataQuality(8, 45, 3), "medium"); // Stale cache, high score
  assertEquals(assessDataQuality(4, 30, 2), "medium"); // Fresh cache, low-medium score

  // Low quality: expired or very low score
  assertEquals(assessDataQuality(2, 15, 3), "low"); // Very low score
  assertEquals(assessDataQuality(8, 90, 3), "low"); // Expired cache
  assertEquals(assessDataQuality(1, 120, 1), "low"); // Everything bad

  // Edge cases
  assertEquals(assessDataQuality(11, 15, 3), "high"); // Score >10 normalized to 10
  assertEquals(assessDataQuality(-5, 15, 3), "low"); // Negative score normalized to 0

  // Default source count
  assertEquals(assessDataQuality(8, 15), "medium"); // Default sourceCount = 1
});
