import { assertEquals } from "@std/assert";
import {
  bigFloatToString,
  bigIntSerializer,
  decodeBase64,
  formatDate,
  formatSatoshisToUSD,
  formatUSDValue,
  jsonStringifyWithBigInt,
} from "$lib/utils/formatUtils.ts";
import { BigFloat } from "bigfloat/mod.ts";

Deno.test("formatSatoshisToUSD - basic conversion", () => {
  // 100,000,000 satoshis = 1 BTC
  // At $50,000/BTC, 1 BTC = $50,000
  assertEquals(formatSatoshisToUSD(100000000, 50000), "50000.00");
  assertEquals(formatSatoshisToUSD(50000000, 50000), "25000.00");
  assertEquals(formatSatoshisToUSD(1000000, 50000), "500.00");
  assertEquals(formatSatoshisToUSD(100000, 50000), "50.00");
  assertEquals(formatSatoshisToUSD(1, 50000), "0.00");
});

Deno.test("formatSatoshisToUSD - with options", () => {
  // With symbol
  assertEquals(
    formatSatoshisToUSD(100000000, 50000, { includeSymbol: true }),
    "$50000.00",
  );

  // Custom decimals
  assertEquals(formatSatoshisToUSD(100000000, 50000, { decimals: 0 }), "50000");
  assertEquals(
    formatSatoshisToUSD(100000000, 50000, { decimals: 4 }),
    "50000.0000",
  );
  assertEquals(
    formatSatoshisToUSD(12345678, 50000, { decimals: 3 }),
    "6172.839",
  );
});

Deno.test("formatSatoshisToUSD - edge cases", () => {
  assertEquals(formatSatoshisToUSD(0, 50000), "0.00");
  assertEquals(formatSatoshisToUSD(100000000, 0), "0.00");
  assertEquals(formatSatoshisToUSD(0, 0), "0.00");
});

Deno.test("formatDate - basic formatting", () => {
  const date = new Date("2024-01-15T12:00:00Z");
  const result = formatDate(date);
  // Result will vary based on locale and timezone, just check it's not INVALID
  assertEquals(result !== "INVALID", true);
});

Deno.test("formatDate - invalid date", () => {
  assertEquals(formatDate(new Date("invalid")), "INVALID");
  assertEquals(formatDate(null as any), "INVALID");
  assertEquals(formatDate(undefined as any), "INVALID");
});

Deno.test("formatDate - with options", () => {
  const date = new Date("2024-01-15T12:00:00Z");

  // Without timezone
  const result = formatDate(date, { timeZone: false });
  assertEquals(result !== "INVALID", true);

  // With specific format options
  const formatted = formatDate(date, {
    month: "long",
    year: "numeric",
    day: "numeric",
  });
  assertEquals(formatted !== "INVALID", true);
});

Deno.test("bigFloatToString - basic conversion", () => {
  const bf1 = new BigFloat("123.456789");
  assertEquals(bigFloatToString(bf1), "123.456");
  assertEquals(bigFloatToString(bf1, 2), "123.45");
  assertEquals(bigFloatToString(bf1, 5), "123.45678");

  const bf2 = new BigFloat("100.000");
  assertEquals(bigFloatToString(bf2), "100");

  const bf3 = new BigFloat("0.100");
  assertEquals(bigFloatToString(bf3), "0.1");
});

Deno.test("bigFloatToString - no decimal part", () => {
  const bf = new BigFloat("123");
  assertEquals(bigFloatToString(bf), "123");
});

Deno.test("bigIntSerializer - serializes bigint values", () => {
  assertEquals(bigIntSerializer("key", 123n), "123");
  assertEquals(bigIntSerializer("key", 0n), "0");
  assertEquals(bigIntSerializer("key", -456n), "-456");
  assertEquals(bigIntSerializer("key", 9007199254740991n), "9007199254740991");
});

Deno.test("bigIntSerializer - passes through non-bigint values", () => {
  assertEquals(bigIntSerializer("key", 123), 123);
  assertEquals(bigIntSerializer("key", "string"), "string");
  assertEquals(bigIntSerializer("key", true), true);
  assertEquals(bigIntSerializer("key", null), null);
  assertEquals(bigIntSerializer("key", undefined), undefined);
  assertEquals(bigIntSerializer("key", { a: 1 }), { a: 1 });
});

Deno.test("jsonStringifyWithBigInt - serializes objects with bigints", () => {
  const obj = {
    regular: 123,
    bigint: 456n,
    nested: {
      value: 789n,
      array: [1, 2n, 3],
    },
  };

  const result = jsonStringifyWithBigInt(obj);
  assertEquals(
    result,
    '{"regular":123,"bigint":"456","nested":{"value":"789","array":[1,"2",3]}}',
  );
});

Deno.test("formatUSDValue - rounds to 2 decimal places", () => {
  assertEquals(formatUSDValue(123.456), 123.46);
  assertEquals(formatUSDValue(123.454), 123.45);
  assertEquals(formatUSDValue(123.999), 124);
  assertEquals(formatUSDValue(0.001), 0);
  assertEquals(formatUSDValue(0.005), 0.01);
  assertEquals(formatUSDValue(100), 100);
});

Deno.test("decodeBase64 - decodes base64 strings", () => {
  assertEquals(decodeBase64("SGVsbG8gV29ybGQ="), "Hello World");
  assertEquals(decodeBase64("VGVzdCAxMjM="), "Test 123");
  assertEquals(decodeBase64(""), "");

  // UTF-8 characters
  assertEquals(decodeBase64("8J+YgA=="), "😀");
  assertEquals(decodeBase64("w6nDqMOgw7w="), "éèàü");
});
