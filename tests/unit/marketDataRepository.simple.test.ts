import { assertEquals } from "@std/assert";
import {
  getCacheStatus,
  parseBTCDecimal,
  parseExchangeSources,
  parseVolumeSources,
} from "$lib/utils/marketData.ts";

// Set environment to skip Redis before importing database-related modules
(globalThis as any).SKIP_REDIS_CONNECTION = true;
Deno.env.set("SKIP_REDIS_CONNECTION", "true");
Deno.env.set("DENO_ENV", "test");

// Simple tests for the parsing functions used by MarketDataRepository
Deno.test("MarketDataRepository utils - parseBTCDecimal", () => {
  assertEquals(parseBTCDecimal("0.00123456"), 0.00123456);
  assertEquals(parseBTCDecimal(null), null);
  assertEquals(parseBTCDecimal(undefined), null);
  assertEquals(parseBTCDecimal(""), null);
});

Deno.test("MarketDataRepository utils - parseVolumeSources", () => {
  const json = '{"counterparty": 0.5, "openstamp": 1.2}';
  const result = parseVolumeSources(json);
  assertEquals(result.counterparty, 0.5);
  assertEquals(result.openstamp, 1.2);

  assertEquals(parseVolumeSources(null), {});
  assertEquals(parseVolumeSources("invalid"), {});
});

Deno.test("MarketDataRepository utils - parseExchangeSources", () => {
  const json = '["openstamp", "kucoin"]';
  const result = parseExchangeSources(json);
  assertEquals(result.length, 2);
  assertEquals(result[0], "openstamp");
  assertEquals(result[1], "kucoin");

  assertEquals(parseExchangeSources(null), []);
  assertEquals(parseExchangeSources("not array"), []);
});

Deno.test("MarketDataRepository utils - getCacheStatus", () => {
  assertEquals(getCacheStatus(15), "fresh");
  assertEquals(getCacheStatus(30), "fresh");
  assertEquals(getCacheStatus(31), "stale");
  assertEquals(getCacheStatus(60), "stale");
  assertEquals(getCacheStatus(61), "expired");
  assertEquals(getCacheStatus(null), "expired");
});
