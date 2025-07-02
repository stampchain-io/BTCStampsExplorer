import { assertEquals } from "@std/assert";
import {
  abbreviateAddress,
  categorizeInput,
  formatAmount,
  formatBigInt,
  formatBTCAmount,
  formatNumber,
  formatNumberWithCommas,
  formatSatoshisToBTC,
  formatSupplyValue,
  isIntOr32ByteHex,
  stripTrailingZeros,
} from "$lib/utils/formatUtils.ts";

Deno.test("formatUtils - abbreviateAddress", () => {
  assertEquals(abbreviateAddress(""), "");
  assertEquals(
    abbreviateAddress("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"),
    "bc1q...0wlh",
  );
  assertEquals(
    abbreviateAddress("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", 6),
    "bc1qxy...hx0wlh",
  );
  assertEquals(abbreviateAddress("short"), "shor...hort");
});

Deno.test("formatUtils - formatBTCAmount", () => {
  assertEquals(formatBTCAmount(1), "1 BTC");
  assertEquals(formatBTCAmount(0.00000001), "0.00000001 BTC");
  assertEquals(
    formatBTCAmount(0.00000001, { stripZeros: true }),
    "0.00000001 BTC",
  );
  assertEquals(formatBTCAmount(1.00000000, { stripZeros: true }), "1 BTC");
  assertEquals(formatBTCAmount(1.5, { decimals: 2 }), "1.5 BTC");
  assertEquals(formatBTCAmount(1.5, { includeSymbol: false }), "1.5");
  assertEquals(formatBTCAmount(1.5, { excludeSuffix: true }), "1.5");
});

Deno.test("formatUtils - formatSatoshisToBTC", () => {
  assertEquals(formatSatoshisToBTC(100000000), "1 BTC");
  assertEquals(formatSatoshisToBTC(1), "0.00000001 BTC");
  assertEquals(formatSatoshisToBTC(50000000), "0.5 BTC");
  assertEquals(formatSatoshisToBTC(123456789), "1.23456789 BTC");
  assertEquals(formatSatoshisToBTC(100000000, { includeSymbol: false }), "1");
  assertEquals(formatSatoshisToBTC(100000000, { decimals: 2 }), "1 BTC");
  // Test when value already appears to be BTC (has decimal)
  assertEquals(formatSatoshisToBTC(1.5), "1.5 BTC");
});

Deno.test("formatUtils - formatNumber", () => {
  assertEquals(formatNumber(1234.5678), "1,234.56780000");
  assertEquals(formatNumber(1234.5678, 2), "1,234.57");
  assertEquals(formatNumber(1000000), "1,000,000.00000000");
  assertEquals(formatNumber(0.00000001, 8), "0.00000001");
});

Deno.test("formatUtils - stripTrailingZeros", () => {
  assertEquals(stripTrailingZeros("1.00000000"), "1");
  assertEquals(stripTrailingZeros("1.50000000"), "1.5");
  assertEquals(stripTrailingZeros("1.00000001"), "1.00000001");
  assertEquals(stripTrailingZeros(1.5), "1.5");
  assertEquals(stripTrailingZeros(1), "1");
  assertEquals(stripTrailingZeros("0.00000000"), "0");
});

Deno.test("formatUtils - formatSupplyValue", () => {
  assertEquals(formatSupplyValue(undefined, true), "0");
  assertEquals(formatSupplyValue(100000000, true), "1.00");
  assertEquals(formatSupplyValue(100000000, false), "100000000");
  assertEquals(formatSupplyValue("100000000", true), "1.00");
  assertEquals(formatSupplyValue("100000000", false), "100000000");
  assertEquals(formatSupplyValue(250000000, true), "2.50");
});

Deno.test("formatUtils - isIntOr32ByteHex", () => {
  assertEquals(isIntOr32ByteHex("123"), true);

  assertEquals(isIntOr32ByteHex("abc"), false);
  assertEquals(
    isIntOr32ByteHex(
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    ),
    true,
  );
  assertEquals(
    isIntOr32ByteHex(
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcde",
    ),
    false,
  ); // 63 chars
  assertEquals(
    isIntOr32ByteHex(
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeg",
    ),
    false,
  ); // has 'g'
});

Deno.test("formatUtils - categorizeInput", () => {
  assertEquals(categorizeInput("123"), "number");
  assertEquals(categorizeInput(123), "number");
  assertEquals(categorizeInput("abc123"), "hex_string");
  assertEquals(categorizeInput("abcdef"), "hex_string");
  assertEquals(categorizeInput("xyz"), "none");
  assertEquals(categorizeInput("12.34"), "none");
  assertEquals(categorizeInput(""), "none");
});

Deno.test("formatUtils - formatBigInt", () => {
  assertEquals(formatBigInt(BigInt(123)), "123");
  assertEquals(
    formatBigInt(BigInt("1234567890123456789")),
    "1234567890123456789",
  );
  assertEquals(formatBigInt(BigInt(0)), "0");
});

Deno.test("formatUtils - formatAmount", () => {
  assertEquals(formatAmount("001.2300"), "1.23");
  assertEquals(formatAmount("0.00100"), ".001");
  assertEquals(formatAmount("100.00"), "100");
  assertEquals(formatAmount("0.0"), "");
  assertEquals(formatAmount("123"), "123");
  assertEquals(formatAmount("000123"), "123");
});

Deno.test("formatUtils - formatNumberWithCommas", () => {
  assertEquals(formatNumberWithCommas(1234), "1,234");
  assertEquals(formatNumberWithCommas(1234567), "1,234,567");
  assertEquals(formatNumberWithCommas(123), "123");
  assertEquals(formatNumberWithCommas(1234567890), "1,234,567,890");
  assertEquals(formatNumberWithCommas(0), "0");
});
