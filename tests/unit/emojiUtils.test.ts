import { assertEquals } from "@std/assert";
import {
  convertEmojiToTick,
  convertToEmoji,
  emojiToUnicodeEscape,
  unicodeEscapeToEmoji,
} from "$lib/utils/emojiUtils.ts";

Deno.test("emojiUtils - emojiToUnicodeEscape", () => {
  // Test basic emoji conversion
  assertEquals(emojiToUnicodeEscape("🧧"), "\\U0001F9E7");
  assertEquals(emojiToUnicodeEscape("🔥"), "\\U0001F525");
  assertEquals(emojiToUnicodeEscape("🚀"), "\\U0001F680");
  assertEquals(emojiToUnicodeEscape("🌙"), "\\U0001F319");
  assertEquals(emojiToUnicodeEscape("🐸"), "\\U0001F438");

  // Test empty string
  assertEquals(emojiToUnicodeEscape(""), "");

  // Test regular text (should not be converted)
  assertEquals(emojiToUnicodeEscape("hello"), "hello");
  assertEquals(emojiToUnicodeEscape("123"), "123");

  // Test mixed content
  assertEquals(
    emojiToUnicodeEscape("hello 🔥 world"),
    "hello \\U0001F525 world",
  );

  // Test multiple emojis
  assertEquals(emojiToUnicodeEscape("🔥🚀"), "\\U0001F525\\U0001F680");
});

Deno.test("emojiUtils - unicodeEscapeToEmoji", () => {
  // Test basic Unicode escape conversion
  assertEquals(unicodeEscapeToEmoji("\\U0001F9E7"), "🧧");
  assertEquals(unicodeEscapeToEmoji("\\U0001F525"), "🔥");
  assertEquals(unicodeEscapeToEmoji("\\U0001F680"), "🚀");
  assertEquals(unicodeEscapeToEmoji("\\U0001F319"), "🌙");
  assertEquals(unicodeEscapeToEmoji("\\U0001F438"), "🐸");

  // Test lowercase format
  assertEquals(unicodeEscapeToEmoji("\\u1F525"), "🔥");
  assertEquals(unicodeEscapeToEmoji("\\u1F680"), "🚀");

  // Test empty string
  assertEquals(unicodeEscapeToEmoji(""), "");

  // Test regular text (should not be converted)
  assertEquals(unicodeEscapeToEmoji("hello"), "hello");
  assertEquals(unicodeEscapeToEmoji("123"), "123");

  // Test mixed content
  assertEquals(
    unicodeEscapeToEmoji("hello \\U0001F525 world"),
    "hello 🔥 world",
  );

  // Test multiple Unicode escapes
  assertEquals(unicodeEscapeToEmoji("\\U0001F525\\U0001F680"), "🔥🚀");

  // Test already emoji (should return as-is)
  assertEquals(unicodeEscapeToEmoji("🔥"), "🔥");
});

Deno.test("emojiUtils - deprecated functions", () => {
  // Test that deprecated functions work the same as their replacements
  assertEquals(convertEmojiToTick("🔥"), emojiToUnicodeEscape("🔥"));
  assertEquals(
    convertToEmoji("\\U0001F525"),
    unicodeEscapeToEmoji("\\U0001F525"),
  );

  // Verify they produce expected results
  assertEquals(convertEmojiToTick("🚀"), "\\U0001F680");
  assertEquals(convertToEmoji("\\U0001F680"), "🚀");
});
